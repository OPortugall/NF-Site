// Sobe a API (PHP) no computador, ligada a um banco LOCAL de desenvolvimento (nf_local).
// Usado com "npm run dev" (API_LOCAL) e com "npm run ver:teste".
//
// Uso:  DB_PORT=3311 DB_ADMIN_USER=root DB_ADMIN_PASSWORD=... npm run api:local
//       (acrescente --zerar para recriar o banco local do zero)
//
// A configuração gerada (com a senha aleatória do usuário local) fica numa pasta temporária,
// fora do projeto, e é apagada ao sair. A CNPJ é consultada na BrasilAPI de verdade.

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { apagarPasta, conectarAdmin, criarBanco, escreverConfig, iniciarPhp, pastaTemporaria } from '../testes/ambiente-api.mjs';

const PORTA = Number(process.env.PORTA_API || 8081);
const BANCO = 'nf_local';
const USUARIO = 'nf_local';

const admin = await conectarAdmin();
// Sempre recria o usuário (a senha é nova a cada execução); o banco só com --zerar ou se não existir
const [existe] = await admin.query('SELECT 1 FROM information_schema.schemata WHERE schema_name = ?', [BANCO]);
let senha;
if (!existe.length || process.argv.includes('--zerar')) {
  senha = await criarBanco(admin, BANCO, USUARIO);
  console.log(`Banco ${BANCO} criado do zero.`);
} else {
  senha = (await import('node:crypto')).randomBytes(24).toString('base64url');
  await admin.query(`DROP USER IF EXISTS '${USUARIO}'@'127.0.0.1'`);
  await admin.query(`CREATE USER '${USUARIO}'@'127.0.0.1' IDENTIFIED BY ?`, [senha]);
  await admin.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${BANCO}.* TO '${USUARIO}'@'127.0.0.1'`);
}
await admin.end();

const pasta = pastaTemporaria();
mkdirSync(path.join(pasta, 'sessoes'));
const config = escreverConfig(pasta, {
  dsn: `mysql:host=127.0.0.1;port=${process.env.DB_PORT || 3306};dbname=${BANCO};charset=utf8mb4`,
  usuario: USUARIO,
  senha,
  origens: ['http://localhost:3000', 'http://localhost:3221', 'http://localhost:3231'],
  urlCnpj: 'https://brasilapi.com.br/api/cnpj/v1/{cnpj}',
});
const php = await iniciarPhp({ porta: PORTA, config });
console.log(`API local em http://127.0.0.1:${PORTA}/api/ (banco ${BANCO}). Ctrl+C para parar.`);
php.stderr.on('data', (d) => { if (/PHP |\[api-nf\]/.test(d)) process.stderr.write(d); });

const encerrar = () => { php.kill(); apagarPasta(pasta); process.exit(0); };
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
php.on('exit', () => { apagarPasta(pasta); process.exit(1); });
