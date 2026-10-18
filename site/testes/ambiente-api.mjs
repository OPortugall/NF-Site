// Monta um ambiente local da API para testes: banco MariaDB criado a partir do schema.sql,
// usuário do banco com privilégio mínimo (usuario-do-site.sql), arquivo de configuração
// temporário e o servidor embutido do PHP. Usado por testes/testar-api.mjs e scripts/api-local.mjs.

import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { gerarCatalogoApi } from '../scripts/catalogo-api.mjs';

export const RAIZ_SITE = path.resolve(import.meta.dirname, '..');
const RAIZ_REPO = path.resolve(RAIZ_SITE, '..');
const FERRAMENTAS = path.join(process.env.LOCALAPPDATA || '', 'Temp', 'nf-site-ferramentas');
export const PHP = process.env.PHP || path.join(FERRAMENTAS, 'php83', 'php.exe');
const PHP_INI = process.env.PHP_INI || path.join(path.dirname(PHP), 'php.ini');

export async function conectarAdmin() {
  if (!process.env.DB_ADMIN_USER || process.env.DB_ADMIN_PASSWORD === undefined) {
    throw new Error('Defina DB_ADMIN_USER e DB_ADMIN_PASSWORD (administrador do banco LOCAL de testes).');
  }
  return mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_ADMIN_USER,
    password: process.env.DB_ADMIN_PASSWORD,
    multipleStatements: true, // só o administrador, só para aplicar o schema
  });
}

// Cria (do zero) o banco e o usuário do site, com as mesmas permissões de produção.
export async function criarBanco(admin, banco, usuario) {
  if (!/^[a-z0-9_]+$/.test(banco) || !/^[a-z0-9_]+$/.test(usuario)) throw new Error('nome inválido');
  const senha = randomBytes(24).toString('base64url');
  await admin.query(`DROP DATABASE IF EXISTS ${banco}`);
  await admin.query(`DROP USER IF EXISTS '${usuario}'@'127.0.0.1'`);
  await admin.query(`CREATE DATABASE ${banco} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.query(`USE ${banco}`);
  await admin.query(readFileSync(path.join(RAIZ_REPO, 'banco-de-dados', 'schema.sql'), 'utf8'));
  const sql = readFileSync(path.join(RAIZ_REPO, 'banco-de-dados', 'usuario-do-site.sql'), 'utf8')
    .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
    .replaceAll("'nf_site'@'localhost'", `'${usuario}'@'127.0.0.1'`)
    .replaceAll('nf_solucoes.*', `${banco}.*`)
    .replaceAll('TROQUE_POR_UMA_SENHA_FORTE', senha);
  await admin.query(sql);
  return senha;
}

export async function apagarBanco(admin, banco, usuario) {
  await admin.query(`DROP DATABASE IF EXISTS ${banco}`);
  await admin.query(`DROP USER IF EXISTS '${usuario}'@'127.0.0.1'`);
}

const php = (v) => (typeof v === 'boolean' ? String(v) : `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`);

// Escreve um arquivo de configuração no formato de api/config.exemplo.php.
export function escreverConfig(pasta, c) {
  const arquivo = path.join(pasta, 'config.php');
  writeFileSync(arquivo, `<?php
return [
    'banco' => ['dsn' => ${php(c.dsn)}, 'usuario' => ${php(c.usuario)}, 'senha' => ${php(c.senha)}],
    'segredo' => ${php(c.segredo ?? randomBytes(32).toString('hex'))},
    'pasta_sessoes' => ${php(path.join(pasta, 'sessoes'))},
    'origens' => [${(c.origens || []).map(php).join(', ')}],
    'cookie_seguro' => ${php(c.cookieSeguro ?? false)},
    'cnpj' => ['url' => ${php(c.urlCnpj)}, 'permitir_http' => ${php(c.urlCnpj.startsWith('http:'))}],
    'url_site' => 'http://localhost:3221',
    // E-mails gravados como arquivos .eml na pasta "emails" (nada sai para a internet)
    'email' => ['modo' => 'arquivo', 'pasta' => ${php(path.join(pasta, 'emails'))}, 'remetente' => 'naoresponda@nf.test', 'admin' => 'equipe@nf.test'],
];
`);
  return arquivo;
}

export const pastaTemporaria = () => mkdtempSync(path.join(tmpdir(), 'nf-api-'));
export const apagarPasta = (p) => rmSync(p, { recursive: true, force: true });

// Sobe o servidor embutido do PHP com a API (todas as rotas passam por api/index.php).
export async function iniciarPhp({ porta, config }) {
  gerarCatalogoApi(); // api/_dados/catalogo.json (produtos de interesse)
  const filho = spawn(PHP, ['-n', '-c', PHP_INI, '-S', `127.0.0.1:${porta}`, '-t', 'api', 'api/index.php'], {
    cwd: RAIZ_SITE,
    env: { ...process.env, NF_CONFIG: config },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  filho.log = '';
  filho.stdout.on('data', (d) => { filho.log += d; });
  filho.stderr.on('data', (d) => { filho.log += d; });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`http://127.0.0.1:${porta}/api/__pronto`);
      return filho;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  filho.kill();
  throw new Error(`PHP não respondeu na porta ${porta}:\n${filho.log}`);
}
