// =============================================================================
// Bateria de testes de segurança e integridade do banco de dados
//
// O que faz:
//  1. Cria um banco SEPARADO só para teste (nf_solucoes_teste) a partir de ../schema.sql.
//  2. Cria o usuário do site a partir de ../usuario-do-site.sql (com senha aleatória, só para o teste).
//  3. Roda os testes conectado COMO O SITE (privilégio mínimo), como será em produção.
//  4. Apaga o banco e o usuário de teste no final. Nunca toca no banco de verdade.
//
// Uso (as credenciais do administrador do banco vêm de variáveis de ambiente, nunca do código):
//   DB_HOST=127.0.0.1 DB_PORT=3306 DB_ADMIN_USER=root DB_ADMIN_PASSWORD=... npm run testar
// =============================================================================

import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash, verify } from '@node-rs/argon2';
import mysql from 'mysql2/promise';

const AQUI = dirname(fileURLToPath(import.meta.url));
const BANCO = 'nf_solucoes_teste';
const TOTAL_TABELAS = 12;
const USUARIO_SITE = 'nf_site_teste';
const HOST = process.env.DB_HOST ?? '127.0.0.1';
const PORTA = Number(process.env.DB_PORT ?? 3306);

if (!process.env.DB_ADMIN_USER || process.env.DB_ADMIN_PASSWORD === undefined) {
  console.error('Defina DB_ADMIN_USER e DB_ADMIN_PASSWORD (administrador do banco de TESTE).');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Registro dos resultados
// ---------------------------------------------------------------------------
const resultados = [];
let grupoAtual = '';
const grupo = (nome) => {
  grupoAtual = nome;
  console.log(`\n## ${nome}`);
};
function registrar(ok, nome, detalhe = '') {
  resultados.push({ grupo: grupoAtual, ok, nome, detalhe });
  console.log(`${ok ? '  ✅' : '  ❌'} ${nome}${detalhe ? `  (${detalhe})` : ''}`);
}

// O teste passa se a operação FOR RECUSADA pelo banco pelo motivo esperado.
async function deveRecusar(nome, fn, motivo) {
  try {
    await fn();
    registrar(false, nome, 'o banco ACEITOU — deveria recusar');
  } catch (e) {
    const ok = motivo.test(e.message);
    registrar(ok, nome, ok ? `recusado: ${resumo(e.message)}` : `recusado por outro motivo: ${resumo(e.message)}`);
  }
}

// O teste passa se a operação for ACEITA (e, opcionalmente, se a verificação retornar verdadeiro).
async function deveAceitar(nome, fn, verificar) {
  try {
    const r = await fn();
    const ok = verificar ? await verificar(r) : true;
    registrar(ok, nome, ok ? '' : 'resultado inesperado');
    return r;
  } catch (e) {
    registrar(false, nome, `erro: ${resumo(e.message)}`);
  }
}

const resumo = (m) => m.replace(/\s+/g, ' ').slice(0, 110);

// ---------------------------------------------------------------------------
// Preparação: banco de teste + usuário do site
// ---------------------------------------------------------------------------
const admin = await mysql.createConnection({
  host: HOST, port: PORTA, user: process.env.DB_ADMIN_USER, password: process.env.DB_ADMIN_PASSWORD,
  multipleStatements: true, // só o administrador, só para aplicar o schema
});

const senhaSite = randomBytes(24).toString('base64url');
const hostSite = HOST === '127.0.0.1' || HOST === 'localhost' ? '127.0.0.1' : '%';

await admin.query(`DROP DATABASE IF EXISTS ${BANCO}`);
await admin.query(`DROP DATABASE IF EXISTS ${BANCO}_outro`);
await admin.query(`DROP USER IF EXISTS '${USUARIO_SITE}'@'${hostSite}'`);
await admin.query(`CREATE DATABASE ${BANCO} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await admin.query(`CREATE DATABASE ${BANCO}_outro`); // outro banco, para provar que o site não acessa
await admin.query(`CREATE TABLE ${BANCO}_outro.segredo (x INT)`);
await admin.query(`USE ${BANCO}`);
await admin.query(readFileSync(join(AQUI, '..', 'schema.sql'), 'utf8'));

// Usa o MESMO arquivo de permissões que vai para produção, trocando só nome, banco e senha.
const sqlUsuario = readFileSync(join(AQUI, '..', 'usuario-do-site.sql'), 'utf8')
  .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
  .replaceAll("'nf_site'@'localhost'", `'${USUARIO_SITE}'@'${hostSite}'`)
  .replaceAll('nf_solucoes.*', `${BANCO}.*`)
  .replaceAll('TROQUE_POR_UMA_SENHA_FORTE', senhaSite);
await admin.query(sqlUsuario);

// Conexão COMO O SITE: sem múltiplos comandos, só consultas parametrizadas.
const site = await mysql.createConnection({
  host: HOST, port: PORTA, user: USUARIO_SITE, password: senhaSite, database: BANCO,
});

// ---------------------------------------------------------------------------
// Dados de exemplo
// ---------------------------------------------------------------------------
const hashValido = await hash('Senha-de-teste-123');
let seq = 0;
const unico = () => String(++seq).padStart(3, '0');

function usuarioBase(extra = {}) {
  const n = unico();
  return {
    primeiro_nome: 'Ana', sobrenome: 'Souza', tipo_pessoa: 'PF', documento: `52998224${n}`,
    email: `ana${n}@empresa.com.br`, telefone: '12999998888', senha_hash: hashValido,
    aceite_privacidade_em: new Date(),
    ...extra,
  };
}

// Monta o INSERT com os NOMES de colunas fixos do código e os VALORES sempre como parâmetros (?).
async function inserir(tabela, dados) {
  const colunas = Object.keys(dados);
  const [r] = await site.execute(
    `INSERT INTO ${tabela} (${colunas.join(', ')}) VALUES (${colunas.map(() => '?').join(', ')})`,
    colunas.map((c) => dados[c]),
  );
  return r.insertId;
}

const enderecoBase = (usuario_id, extra = {}) => ({
  usuario_id, cep: '12236500', rua: 'Av. Gisele Martins', numero: '541', bairro: 'Bosque dos Ipês',
  cidade: 'São José dos Campos', uf: 'SP', ...extra,
});

const produtoBase = (extra = {}) => {
  const n = unico();
  return {
    slug: `produto-teste-${n}`, marca: 'Konica Minolta', modelo: `bizhub C361i ${n}`, nome: 'Konica Minolta bizhub C361i',
    categoria: 'multifuncionais', impressao: 'colorida', condicao: 'novo', resumo: 'Multifuncional colorida A3',
    disponivel_venda: 1, disponivel_locacao: 1, ...extra,
  };
};

// ---------------------------------------------------------------------------
grupo('1. Configuração do servidor');
// ---------------------------------------------------------------------------
{
  const [[v]] = await admin.query('SELECT VERSION() AS versao, @@sql_mode AS modo, @@local_infile AS arquivo_local');
  registrar(true, `Versão do banco: ${v.versao}`);
  registrar(/STRICT_(TRANS|ALL)_TABLES/.test(v.modo), 'Modo estrito ligado (dados inválidos são recusados, não cortados)', v.modo);
  registrar(Number(v.arquivo_local) === 0, 'Leitura de arquivos locais (LOAD DATA LOCAL) desligada');
  const [tabelas] = await admin.query(
    'SELECT table_name AS t, engine AS e, table_collation AS c FROM information_schema.tables WHERE table_schema = ?', [BANCO]);
  registrar(tabelas.length === TOTAL_TABELAS && tabelas.every((t) => t.e === 'InnoDB' && t.c.startsWith('utf8mb4')),
    `${tabelas.length} tabelas com InnoDB (transações e chaves estrangeiras) e utf8mb4 (acentos e emojis)`);
}

// ---------------------------------------------------------------------------
grupo('2. Usuários: dados válidos e inválidos');
// ---------------------------------------------------------------------------
const idAna = await deveAceitar('Cadastro de pessoa física válido', () => inserir('usuarios', usuarioBase()));
await deveAceitar('Cadastro de empresa válido (com razão social)', () => inserir('usuarios', usuarioBase({
  tipo_pessoa: 'PJ', documento: `11222333000${unico()}`, razao_social: 'Empresa Exemplo LTDA', nome_fantasia: 'Exemplo',
})));
await deveRecusar('CPF com 10 números', () => inserir('usuarios', usuarioBase({ documento: '1234567890' })), /ck_usuarios_documento/);
await deveRecusar('CPF com pontuação', () => inserir('usuarios', usuarioBase({ documento: '529.982.247-25' })), /ck_usuarios_documento|too long/i);
await deveRecusar('Pessoa física com CNPJ (14 números)', () => inserir('usuarios', usuarioBase({ documento: '11222333000181' })), /ck_usuarios_documento/);
await deveRecusar('Empresa sem razão social', () => inserir('usuarios', usuarioBase({ tipo_pessoa: 'PJ', documento: `99888777000${unico()}` })), /ck_usuarios_razao_social/);
{
  const [[ana]] = await site.execute('SELECT email, documento FROM usuarios WHERE id = ?', [idAna]);
  await deveRecusar('E-mail repetido', () => inserir('usuarios', usuarioBase({ email: ana.email })), /Duplicate entry .*uq_usuarios_email/);
  await deveRecusar('Mesmo e-mail com letras maiúsculas (conta duplicada)', () => inserir('usuarios', usuarioBase({ email: ana.email.toUpperCase() })), /ck_usuarios_email|Duplicate/);
  await deveRecusar('E-mail novo com maiúsculas (precisa ser salvo em minúsculas)', () => inserir('usuarios', usuarioBase({ email: 'Novo.Cliente@Empresa.com.br' })), /ck_usuarios_email/);
  await deveRecusar('CPF já cadastrado', () => inserir('usuarios', usuarioBase({ documento: ana.documento })), /Duplicate entry .*uq_usuarios_documento/);
}
await deveRecusar('E-mail inválido', () => inserir('usuarios', usuarioBase({ email: 'nao-e-email' })), /ck_usuarios_email/);
await deveRecusar('Telefone com letras', () => inserir('usuarios', usuarioBase({ telefone: '12abc998888' })), /ck_usuarios_telefone/);
await deveRecusar('Nome em branco (só espaços)', () => inserir('usuarios', usuarioBase({ primeiro_nome: '   ' })), /ck_usuarios_nomes/);
await deveRecusar('Nome gigante (é recusado, não cortado em silêncio)', () => inserir('usuarios', usuarioBase({ primeiro_nome: 'A'.repeat(500) })), /too long/i);
await deveRecusar('Cadastro sem aceite da Política de Privacidade (LGPD)', () => {
  const u = usuarioBase(); delete u.aceite_privacidade_em; return inserir('usuarios', u);
}, /aceite_privacidade_em/);
await deveRecusar("Perfil inexistente ('superadmin')", () => inserir('usuarios', usuarioBase({ role: 'superadmin' })), /truncated|role/i);
await deveRecusar("Situação inexistente ('bloqueado')", () => inserir('usuarios', usuarioBase({ status: 'bloqueado' })), /truncated|status/i);
{
  const [[u]] = await site.execute('SELECT role, status FROM usuarios WHERE id = ?', [idAna]);
  registrar(u.role === 'cliente' && u.status === 'ativo', 'Novo cadastro entra como "cliente" e "ativo" por padrão (nunca admin)');
}

// ---------------------------------------------------------------------------
grupo('3. Senhas');
// ---------------------------------------------------------------------------
await deveRecusar('Senha em texto puro', () => inserir('usuarios', usuarioBase({ senha_hash: 'Senha-de-teste-123' })), /ck_usuarios_senha_hash/);
await deveRecusar('Senha em MD5 (hash antigo e inseguro)', () => inserir('usuarios', usuarioBase({ senha_hash: '5f4dcc3b5aa765d61d8327deb882cf99' })), /ck_usuarios_senha_hash/);
await deveRecusar('Senha em SHA-256 sem "sal"', () => inserir('usuarios', usuarioBase({ senha_hash: 'a'.repeat(64) })), /ck_usuarios_senha_hash/);
await deveRecusar('Conta sem senha e sem login do Google', () => inserir('usuarios', usuarioBase({ senha_hash: null })), /ck_usuarios_forma_login/);
await deveAceitar('Conta só com Google (sem senha)', () => inserir('usuarios', usuarioBase({ senha_hash: null, google_id: `1098765432${unico()}` })));
await deveRecusar('Hash com o nome do algoritmo em maiúsculas (falso)', () => inserir('usuarios', usuarioBase({ senha_hash: '$ARGON2ID$V=19$' + 'x'.repeat(60) })), /ck_usuarios_senha_hash/);
await deveAceitar('Hash bcrypt aceito', () => inserir('usuarios', usuarioBase({ senha_hash: '$2b$12$' + 'a'.repeat(53) })));
{
  const h1 = await hash('Minha-senha-1');
  const h2 = await hash('Minha-senha-1');
  registrar(h1.startsWith('$argon2id$v=19$'), 'Senhas usam argon2id (recomendado pela OWASP)');
  registrar(h1 !== h2, 'A mesma senha gera hashes diferentes a cada vez (sal aleatório)');
  registrar(await verify(h1, 'Minha-senha-1'), 'Senha correta é reconhecida');
  registrar(!(await verify(h1, 'minha-senha-1')), 'Senha errada (só uma letra diferente) é recusada');
  const [linhas] = await site.execute('SELECT COUNT(*) AS n FROM usuarios WHERE senha_hash LIKE ?', ['%Senha-de-teste%']);
  registrar(linhas[0].n === 0, 'Nenhuma senha legível guardada no banco');
}

// ---------------------------------------------------------------------------
grupo('4. Endereços');
// ---------------------------------------------------------------------------
await deveAceitar('Endereço principal válido', () => inserir('enderecos', enderecoBase(idAna, { principal: 1, apelido: 'Matriz' })));
await deveAceitar('Segundo endereço (filial)', () => inserir('enderecos', enderecoBase(idAna, { apelido: 'Filial' })));
await deveAceitar('Terceiro endereço', () => inserir('enderecos', enderecoBase(idAna, { apelido: 'Depósito' })));
await deveRecusar('Dois endereços principais para o mesmo cliente', () => inserir('enderecos', enderecoBase(idAna, { principal: 1 })), /Duplicate entry .*uq_enderecos_um_principal/);
await deveRecusar('Endereço de cliente que não existe', () => inserir('enderecos', enderecoBase(999999)), /foreign key constraint fails|child row/i);
await deveRecusar('CEP com hífen', () => inserir('enderecos', enderecoBase(idAna, { cep: '12236-50' })), /ck_enderecos_cep/);
await deveRecusar('Estado inexistente (XX)', () => inserir('enderecos', enderecoBase(idAna, { uf: 'XX' })), /ck_enderecos_uf/);

// ---------------------------------------------------------------------------
grupo('5. Produtos e fotos');
// ---------------------------------------------------------------------------
const idProduto = await deveAceitar('Produto válido', () => inserir('produtos', produtoBase()));
await deveRecusar('Endereço de página (slug) com letras maiúsculas', () => inserir('produtos', produtoBase({ slug: 'Konica-Minolta' })), /ck_produtos_slug/);
await deveRecusar('Endereço de página (slug) com espaço e símbolo', () => inserir('produtos', produtoBase({ slug: 'Konica Minolta!' })), /ck_produtos_slug/);
await deveRecusar('Impressora 3D marcada como "colorida/monocromática"', () => inserir('produtos', produtoBase({ categoria: 'impressoras-3d' })), /ck_produtos_impressao/);
await deveRecusar('Toner disponível para locação', () => inserir('produtos', produtoBase({ categoria: 'suprimentos', impressao: null })), /ck_produtos_locacao_suprimento/);
await deveRecusar('Produto sem venda e sem locação', () => inserir('produtos', produtoBase({ disponivel_venda: 0, disponivel_locacao: 0 })), /ck_produtos_disponibilidade/);
await deveRecusar('Especificações com JSON inválido', () => inserir('produtos', produtoBase({ especificacoes: '{quebrado' })), /especificacoes|json/i);
await deveAceitar('Foto do próprio site', () => inserir('produto_fotos', { produto_id: idProduto, url: '/produtos/konica-minolta-bizhub-c361i/foto-1.jpg', ordem: 1 }));
await deveRecusar('Foto em pasta com letras maiúsculas', () => inserir('produto_fotos', { produto_id: idProduto, url: '/produtos/Konica/foto.jpg', ordem: 5 }), /ck_produto_fotos_url/);
await deveRecusar('Foto apontando para site externo', () => inserir('produto_fotos', { produto_id: idProduto, url: 'https://site-malicioso.com/x.jpg', ordem: 2 }), /ck_produto_fotos_url/);
await deveRecusar('Foto com "javascript:" (ataque XSS)', () => inserir('produto_fotos', { produto_id: idProduto, url: 'javascript:alert(1)', ordem: 3 }), /ck_produto_fotos_url/);
await deveRecusar('Foto tentando sair da pasta (../../)', () => inserir('produto_fotos', { produto_id: idProduto, url: '/produtos/../../etc/passwd.jpg', ordem: 4 }), /ck_produto_fotos_url/);
await deveAceitar('Interesse do cliente num produto', () => inserir('usuario_interesses', { usuario_id: idAna, produto_id: idProduto, produto_slug: 'konica-minolta-bizhub-c361i', produto_nome: 'Konica Minolta bizhub C361i' }));
await deveAceitar('Interesse num produto que só existe no código do site (sem produto_id)', () => inserir('usuario_interesses', { usuario_id: idAna, produto_slug: '15-mp5001', produto_nome: 'Ricoh MP 5001' }));
await deveRecusar('O mesmo interesse duas vezes', () => inserir('usuario_interesses', { usuario_id: idAna, produto_slug: '15-mp5001', produto_nome: 'Ricoh MP 5001' }), /Duplicate|uq_usuario_interesses/);
await deveRecusar('Interesse com slug malicioso', () => inserir('usuario_interesses', { usuario_id: idAna, produto_slug: '../x', produto_nome: 'X' }), /ck_interesses_slug/);
await deveRecusar('Estoque negativo', () => inserir('produtos', produtoBase({ estoque: -1 })), /estoque|range/i);
await deveAceitar('Produto com estoque e limite de estoque baixo', () => inserir('produtos', produtoBase({ estoque: 5, estoque_minimo: 2 })));

// ---------------------------------------------------------------------------
grupo('5b. Painel administrativo: pagamento, 2FA, notificações e auditoria');
// ---------------------------------------------------------------------------
await deveRecusar('Cliente "em atraso" sem a data do atraso', () => inserir('usuarios', usuarioBase({ situacao_pagamento: 'em_atraso' })), /ck_usuarios_atraso/);
await deveRecusar('Cliente "em dia" com data de atraso', () => inserir('usuarios', usuarioBase({ em_atraso_desde: new Date() })), /ck_usuarios_atraso/);
await deveAceitar('Cliente em atraso com a data', () => inserir('usuarios', usuarioBase({ situacao_pagamento: 'em_atraso', em_atraso_desde: new Date() })));
await deveRecusar('Situação de pagamento fora da lista', () => inserir('usuarios', usuarioBase({ situacao_pagamento: 'perdoado' })), /situacao_pagamento|truncated|incorrect/i);
await deveRecusar('Segredo de 2FA num cliente (só administradores têm 2FA)', () => inserir('usuarios', usuarioBase({ totp_segredo: 'x' })), /ck_usuarios_totp/);
await deveAceitar('Administrador com 2FA', () => inserir('usuarios', usuarioBase({ role: 'admin', totp_segredo: 'cifrado' })));
await deveAceitar('Notificação de cliente novo', () => inserir('notificacoes', { tipo: 'novo_cliente', usuario_id: idAna, resumo: 'Novo cliente: Ana Souza' }));
await deveRecusar('Notificação de tipo desconhecido', () => inserir('notificacoes', { tipo: 'spam', resumo: 'x' }), /tipo|truncated|incorrect/i);
await deveAceitar('Registro de auditoria', () => inserir('auditoria', { acao: 'cliente_editar', alvo_tipo: 'cliente', alvo_id: idAna, detalhes: JSON.stringify({ campos: ['telefone'] }) }));
await deveRecusar('Auditoria com ação fora do formato (SQL/HTML)', () => inserir('auditoria', { acao: "x'; DROP", alvo_tipo: 'cliente' }), /ck_auditoria_acao/);
await deveRecusar('Auditoria com detalhes que não são JSON', () => inserir('auditoria', { acao: 'teste', alvo_tipo: 'sistema', detalhes: '{quebrado' }), /detalhes|json/i);
await deveRecusar('Auditoria com IP em texto (só HMAC)', () => inserir('auditoria', { acao: 'teste', alvo_tipo: 'sistema', ip_hmac: '200.1.1.1' }), /ck_auditoria_ip/);
await deveAceitar('Registro de e-mail enviado', () => inserir('emails_enviados', { usuario_id: idAna, tipo: 'aviso_atraso', sucesso: 1 }));

// ---------------------------------------------------------------------------
grupo('6. Injeção de SQL (consultas parametrizadas)');
// ---------------------------------------------------------------------------
{
  const ataques = [
    "' OR '1'='1",
    "' OR 1=1 -- ",
    "qualquer@x.com' OR 'x'='x",
    "admin@nf.com'#",
    "x' UNION SELECT senha_hash FROM usuarios -- ",
    "'; DROP TABLE usuarios; -- ",
  ];
  for (const a of ataques) {
    // É assim que o site vai procurar o usuário no login: valor sempre como parâmetro.
    const [linhas] = await site.execute('SELECT id FROM usuarios WHERE email = ?', [a]);
    registrar(linhas.length === 0, `Login com ${JSON.stringify(a)} não encontra ninguém`);
  }

  const nomeMalicioso = "Robert'); DROP TABLE usuarios; --";
  const id = await inserir('usuarios', usuarioBase({ primeiro_nome: nomeMalicioso }));
  const [[salvo]] = await site.execute('SELECT primeiro_nome FROM usuarios WHERE id = ?', [id]);
  registrar(salvo.primeiro_nome === nomeMalicioso, 'Nome com comando SQL é guardado como texto comum');

  try {
    await site.query('SELECT 1; DROP TABLE usuarios');
    registrar(false, 'Vários comandos numa só chamada');
  } catch (e) {
    registrar(/syntax/i.test(e.message), 'Vários comandos numa só chamada são bloqueados pela conexão do site', resumo(e.message));
  }

  const [[{ n }]] = await admin.query(`SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = '${BANCO}'`);
  registrar(Number(n) === TOTAL_TABELAS, `Depois dos ataques, as ${TOTAL_TABELAS} tabelas continuam lá`);

  // Demonstração (não é uma falha do banco): por que o site NUNCA deve montar SQL juntando texto.
  const [errado] = await site.query(`SELECT id FROM usuarios WHERE email = '${"' OR '1'='1"}'`);
  registrar(errado.length > 1, `Demonstração: SQL montado juntando texto devolveria TODOS os ${errado.length} usuários (por isso o site só usa parâmetros)`);
}

// ---------------------------------------------------------------------------
grupo('7. Permissões do usuário do site (privilégio mínimo)');
// ---------------------------------------------------------------------------
await deveAceitar('Site consegue ler, gravar, alterar e apagar dados', async () => {
  const id = await inserir('usuarios', usuarioBase());
  await site.execute('UPDATE usuarios SET telefone = ? WHERE id = ?', ['12988887777', id]);
  await site.execute('DELETE FROM usuarios WHERE id = ?', [id]);
});
const negado = /denied/i;
await deveRecusar('Apagar tabela (DROP TABLE)', () => site.query('DROP TABLE usuarios'), negado);
await deveRecusar('Alterar tabela (ALTER TABLE)', () => site.query('ALTER TABLE usuarios ADD COLUMN x INT'), negado);
await deveRecusar('Criar tabela', () => site.query('CREATE TABLE invasor (x INT)'), negado);
await deveRecusar('Esvaziar tabela inteira (TRUNCATE)', () => site.query('TRUNCATE TABLE usuarios'), negado);
await deveRecusar('Apagar o banco inteiro', () => site.query(`DROP DATABASE ${BANCO}`), negado);
await deveRecusar('Criar outro usuário de banco', () => site.query("CREATE USER 'invasor'@'%' IDENTIFIED BY 'x'"), negado);
await deveRecusar('Dar permissões a si mesmo', () => site.query(`GRANT ALL ON ${BANCO}.* TO '${USUARIO_SITE}'@'${hostSite}'`), negado);
await deveRecusar('Ler a lista de usuários do servidor (mysql.user)', () => site.query('SELECT User FROM mysql.user'), negado);
await deveRecusar('Acessar outro banco do servidor', () => site.query(`SELECT * FROM ${BANCO}_outro.segredo`), negado);
await deveRecusar('Gravar arquivo no servidor (INTO OUTFILE)', () => site.query("SELECT 'x' INTO OUTFILE 'C:/invasor.txt'"), negado);
{
  const [[{ arquivo }]] = await site.query("SELECT LOAD_FILE('C:/Windows/win.ini') AS arquivo");
  registrar(arquivo === null, 'Ler arquivos do servidor (LOAD_FILE) devolve vazio');
}
await deveRecusar('Criar procedimento armazenado', () => site.query('CREATE PROCEDURE invasor() SELECT 1'), negado);

// ---------------------------------------------------------------------------
grupo('8. Acentos e caracteres especiais');
// ---------------------------------------------------------------------------
{
  const texto = 'São José dos Campos — Conceição Ñandú 👍';
  const id = await inserir('enderecos', enderecoBase(idAna, { complemento: texto.slice(0, 80) }));
  const [[e]] = await site.execute('SELECT complemento FROM enderecos WHERE id = ?', [id]);
  registrar(e.complemento === texto.slice(0, 80), 'Acentos e emoji são guardados e lidos sem corromper');
}

// ---------------------------------------------------------------------------
grupo('9. Orçamentos');
// ---------------------------------------------------------------------------
// Código aleatório como o site vai gerar: "NF-" + 8 caracteres sem letras confusas (sem I e O).
const ALFABETO = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const novoCodigo = () => 'NF-' + [...randomBytes(8)].map((b) => ALFABETO[b % ALFABETO.length]).join('');
const [[enderecoAna]] = await site.execute('SELECT id FROM enderecos WHERE usuario_id = ? AND principal = 1', [idAna]);
const idOrcamento = await deveAceitar('Orçamento válido, com endereço de entrega', () =>
  inserir('orcamentos', { codigo: novoCodigo(), usuario_id: idAna, endereco_id: enderecoAna.id, observacoes_cliente: 'Preciso para a filial' }));
const item = (extra = {}) => ({ orcamento_id: idOrcamento, produto_id: idProduto, produto_slug: 'konica-minolta-bizhub-c361i',
  produto_nome: 'Konica Minolta bizhub C361i', modalidade: 'compra', quantidade: 2, ...extra });
await deveAceitar('Item para compra', () => inserir('orcamento_itens', item()));
await deveAceitar('Mesmo produto para locação (linha separada)', () => inserir('orcamento_itens', item({ modalidade: 'locacao', quantidade: 1 })));
await deveRecusar('Mesmo produto e modalidade duas vezes', () => inserir('orcamento_itens', item()), /Duplicate entry .*uq_orcamento_itens/);
await deveRecusar('Quantidade zero', () => inserir('orcamento_itens', item({ produto_slug: 'outro-produto', quantidade: 0 })), /ck_orcamento_itens_quantidade/);
await deveRecusar('Quantidade acima de 99', () => inserir('orcamento_itens', item({ produto_slug: 'outro-produto', quantidade: 500 })), /ck_orcamento_itens_quantidade/);
await deveRecusar('Quantidade negativa', () => inserir('orcamento_itens', item({ produto_slug: 'outro-produto', quantidade: -1 })), /range|ck_orcamento_itens_quantidade/i);
await deveRecusar('Modalidade inexistente ("doacao")', () => inserir('orcamento_itens', item({ produto_slug: 'outro-produto', modalidade: 'doacao' })), /truncated|modalidade/i);
await deveRecusar('Produto com endereço de página inválido', () => inserir('orcamento_itens', item({ produto_slug: '../admin' })), /ck_orcamento_itens_slug/);
await deveRecusar('Código sequencial curto ("NF-0001")', () => inserir('orcamentos', { codigo: 'NF-0001', usuario_id: idAna }), /ck_orcamentos_codigo/);
await deveRecusar('Código em minúsculas', () => inserir('orcamentos', { codigo: 'NF-abcdefgh', usuario_id: idAna }), /ck_orcamentos_codigo/);
await deveRecusar('Código com letra confusa ("O")', () => inserir('orcamentos', { codigo: 'NF-ABCDEFGO', usuario_id: idAna }), /ck_orcamentos_codigo/);
{
  const [[o]] = await site.execute('SELECT codigo, status FROM orcamentos WHERE id = ?', [idOrcamento]);
  await deveRecusar('Código de orçamento repetido', () => inserir('orcamentos', { codigo: o.codigo, usuario_id: idAna }), /Duplicate entry .*uq_orcamentos_codigo/);
  registrar(o.status === 'novo', 'Orçamento novo entra com situação "novo"');
}
await deveRecusar('Situação inexistente ("pago")', () => site.execute("UPDATE orcamentos SET status = 'pago' WHERE id = ?", [idOrcamento]), /truncated|status/i);
await deveRecusar('Orçamento de cliente que não existe', () => inserir('orcamentos', { codigo: novoCodigo(), usuario_id: 999999 }), /foreign key constraint fails|child row/i);
await deveAceitar('Cancelar um orçamento apaga os itens dele junto', async () => {
  const id = await inserir('orcamentos', { codigo: novoCodigo(), usuario_id: idAna });
  await inserir('orcamento_itens', item({ orcamento_id: id }));
  await site.execute('DELETE FROM orcamentos WHERE id = ?', [id]);
  const [[{ n }]] = await site.execute('SELECT COUNT(*) AS n FROM orcamento_itens WHERE orcamento_id = ?', [id]);
  return n;
}, (n) => n === 0);
await deveAceitar('Produto que sai do catálogo: o orçamento antigo continua com o nome dele', async () => {
  const idP = await inserir('produtos', produtoBase());
  const id = await inserir('orcamentos', { codigo: novoCodigo(), usuario_id: idAna });
  await inserir('orcamento_itens', item({ orcamento_id: id, produto_id: idP, produto_slug: 'produto-que-sai', produto_nome: 'Produto que sai' }));
  await site.execute('DELETE FROM produtos WHERE id = ?', [idP]);
  const [[i]] = await site.execute('SELECT produto_id, produto_nome FROM orcamento_itens WHERE orcamento_id = ?', [id]);
  return i;
}, (i) => i.produto_id === null && i.produto_nome === 'Produto que sai');

// ---------------------------------------------------------------------------
grupo('10. Confirmação de e-mail e recuperação de senha');
// ---------------------------------------------------------------------------
// O site sorteia um código secreto, manda por e-mail e guarda aqui só o hash dele.
const novoToken = () => randomBytes(32).toString('base64url');
const sha256 = (s) => createHash('sha256').update(s).digest('hex');
// A validade é calculada pelo próprio banco (NOW()), para não depender do relógio do servidor do site.
async function inserirToken(tipo, minutos, hashToken = sha256(novoToken()), usuario = idAna) {
  await site.execute(
    'INSERT INTO tokens_usuario (usuario_id, tipo, token_hash, expira_em) VALUES (?, ?, ?, NOW() + INTERVAL ? MINUTE)',
    [usuario, tipo, hashToken, minutos],
  );
}
await deveAceitar('Link de nova senha válido por 30 minutos', () => inserirToken('redefinir_senha', 30));
await deveRecusar('Link de nova senha válido por 2 horas (máximo é 1 hora)', () => inserirToken('redefinir_senha', 120), /ck_tokens_validade/);
await deveAceitar('Link de confirmação de e-mail válido por 24 horas', () => inserirToken('confirmar_email', 24 * 60));
await deveRecusar('Link de confirmação válido por 3 dias (máximo é 48 horas)', () => inserirToken('confirmar_email', 72 * 60), /ck_tokens_validade/);
await deveRecusar('Link já vencido no momento em que é criado', () => inserirToken('redefinir_senha', -5), /ck_tokens_validade/);
await deveRecusar('Guardar o código em si, em vez do hash', () => inserirToken('redefinir_senha', 30, novoToken()), /ck_tokens_hash|too long/i);
await deveRecusar('Hash em formato inválido (maiúsculas)', () => inserirToken('redefinir_senha', 30, sha256('x').toUpperCase()), /ck_tokens_hash/);
await deveRecusar('Tipo de link inexistente', () => site.execute(
  "INSERT INTO tokens_usuario (usuario_id, tipo, token_hash, expira_em) VALUES (?, 'virar_admin', ?, NOW() + INTERVAL 5 MINUTE)",
  [idAna, sha256(novoToken())]), /truncated|tipo/i);
{
  const tokenEnviado = novoToken(); // vai no link do e-mail
  await inserirToken('redefinir_senha', 30, sha256(tokenEnviado));
  await deveRecusar('Mesmo hash duas vezes', () => inserirToken('redefinir_senha', 30, sha256(tokenEnviado)), /Duplicate entry .*uq_tokens_hash/);

  const [comCodigo] = await site.execute('SELECT id FROM tokens_usuario WHERE token_hash = ?', [tokenEnviado]);
  registrar(comCodigo.length === 0, 'Quem vê o banco não consegue usar os links (o código não está guardado)');

  // Uso do link: marca como usado só se ainda for válido e nunca usado, numa única operação.
  const usar = (codigo) => site.execute(
    "UPDATE tokens_usuario SET usado_em = NOW() WHERE token_hash = ? AND tipo = 'redefinir_senha' AND usado_em IS NULL AND expira_em > NOW()",
    [sha256(codigo)]);
  const [primeira] = await usar(tokenEnviado);
  const [segunda] = await usar(tokenEnviado);
  registrar(primeira.affectedRows === 1, 'O link funciona na primeira vez');
  registrar(segunda.affectedRows === 0, 'O mesmo link não funciona uma segunda vez (uso único)');
  const [errado] = await usar(novoToken());
  registrar(errado.affectedRows === 0, 'Um código inventado não funciona');
}

// ---------------------------------------------------------------------------
grupo('11. Exclusão de conta (direito de exclusão, LGPD)');
// ---------------------------------------------------------------------------
{
  await site.execute('DELETE FROM usuarios WHERE id = ?', [idAna]);
  const [[{ end }]] = await site.execute('SELECT COUNT(*) AS end FROM enderecos WHERE usuario_id = ?', [idAna]);
  const [[{ int }]] = await site.execute('SELECT COUNT(*) AS `int` FROM usuario_interesses WHERE usuario_id = ?', [idAna]);
  registrar(end === 0 && int === 0, 'Ao excluir o cliente, os endereços e interesses dele também são apagados');
  const [[{ tok }]] = await site.execute('SELECT COUNT(*) AS tok FROM tokens_usuario WHERE usuario_id = ?', [idAna]);
  registrar(tok === 0, 'Os links de e-mail pendentes dele também são apagados');
  const [[o]] = await site.execute('SELECT usuario_id, endereco_id FROM orcamentos WHERE id = ?', [idOrcamento]);
  registrar(Boolean(o) && o.usuario_id === null && o.endereco_id === null,
    'Os orçamentos dele ficam no histórico da empresa, mas sem ligação com os dados pessoais');
  const [[n]] = await site.execute('SELECT usuario_id FROM notificacoes WHERE resumo = ?', ['Novo cliente: Ana Souza']);
  const [[a]] = await site.execute("SELECT alvo_id FROM auditoria WHERE acao = 'cliente_editar'");
  registrar(n?.usuario_id === null && a?.alvo_id === idAna,
    'Notificações perdem a ligação com o cliente; a auditoria guarda só o número do registro');
  const [[{ prod }]] = await site.execute('SELECT COUNT(*) AS prod FROM produtos WHERE id = ?', [idProduto]);
  registrar(prod === 1, 'O produto em que ele tinha interesse continua no catálogo');
}

// ---------------------------------------------------------------------------
grupo('12. Limite de tentativas de login (força bruta)');
// ---------------------------------------------------------------------------
{
  // Usa o mesmo módulo que o site vai usar (site/lib/limite-login.js).
  const limite = await import(new URL('../../site/lib/limite-login.js', import.meta.url));
  const segredo = randomBytes(32).toString('hex');
  const consulta = async (sql, params) => (await site.execute(sql, params))[0];
  const tentar = async (email, ip, sucesso = false) => {
    const b = await limite.verificarBloqueio(consulta, { email, ip }, segredo);
    if (!b.bloqueado) await limite.registrarTentativa(consulta, { email, ip, sucesso }, segredo);
    return b;
  };

  for (let i = 0; i < 4; i++) await tentar('vitima@empresa.com.br', '200.1.1.1');
  const quarta = await limite.verificarBloqueio(consulta, { email: 'vitima@empresa.com.br', ip: '200.1.1.1' }, segredo);
  registrar(!quarta.bloqueado, '4 senhas erradas: ainda pode tentar');
  await tentar('vitima@empresa.com.br', '200.1.1.1');
  const quinta = await limite.verificarBloqueio(consulta, { email: 'vitima@empresa.com.br', ip: '200.1.1.1' }, segredo);
  registrar(quinta.bloqueado && quinta.motivo === 'email', '5 senhas erradas no mesmo e-mail: bloqueado', `liberado em ${Math.ceil(quinta.tentarEmSegundos / 60)} min`);
  const outroIp = await limite.verificarBloqueio(consulta, { email: 'VITIMA@empresa.com.br ', ip: '177.9.9.9' }, segredo);
  registrar(outroIp.bloqueado, 'Trocar de IP ou escrever o e-mail em maiúsculas não escapa do bloqueio');
  const outroEmail = await limite.verificarBloqueio(consulta, { email: 'outra@empresa.com.br', ip: '200.1.1.1' }, segredo);
  registrar(!outroEmail.bloqueado, 'Outros clientes continuam podendo entrar');

  await site.execute('UPDATE tentativas_login SET criado_em = criado_em - INTERVAL 16 MINUTE');
  const depois = await limite.verificarBloqueio(consulta, { email: 'vitima@empresa.com.br', ip: '200.1.1.1' }, segredo);
  registrar(!depois.bloqueado, 'Depois de 15 minutos, o e-mail é liberado sozinho');

  for (let i = 0; i < 4; i++) await tentar('cliente@empresa.com.br', '10.0.0.5');
  await tentar('cliente@empresa.com.br', '10.0.0.5', true);
  await tentar('cliente@empresa.com.br', '10.0.0.5');
  const zerou = await limite.verificarBloqueio(consulta, { email: 'cliente@empresa.com.br', ip: '10.0.0.5' }, segredo);
  registrar(!zerou.bloqueado && zerou.errosEmail === 1, 'Um login certo zera a contagem do e-mail', `${zerou.errosEmail} erro depois do acerto`);

  for (let i = 0; i < 20; i++) await tentar(`alvo${i}@empresa.com.br`, '45.6.7.8');
  const robo = await limite.verificarBloqueio(consulta, { email: 'mais-um@empresa.com.br', ip: '45.6.7.8' }, segredo);
  registrar(robo.bloqueado && robo.motivo === 'ip', 'Robô testando 20 e-mails diferentes do mesmo IP: IP bloqueado');
  // o robô acerta a senha da própria conta, do MESMO IP bloqueado
  await limite.registrarTentativa(consulta, { email: 'robo-dono@empresa.com.br', ip: '45.6.7.8', sucesso: true }, segredo);
  const naoZeraIp = await limite.verificarBloqueio(consulta, { email: 'mais-um@empresa.com.br', ip: '45.6.7.8' }, segredo);
  registrar(naoZeraIp.bloqueado, 'O robô não consegue "zerar" o bloqueio do IP entrando numa conta própria');

  const [linhas] = await site.execute("SELECT COUNT(*) AS n FROM tentativas_login WHERE chave_email LIKE '%@%' OR chave_ip LIKE '%.%'");
  registrar(linhas[0].n === 0, 'O banco não guarda e-mails nem IPs, só códigos (LGPD)');
  await deveRecusar('Gravar e-mail em texto na tabela de tentativas', () => site.execute(
    'INSERT INTO tentativas_login (chave_email, chave_ip) VALUES (?, ?)', ['vitima@empresa.com.br', limite.chave('1.1.1.1', segredo)]), /ck_tentativas_chaves/);
  let erroSegredo = '';
  try { limite.chave('x', 'curto'); } catch (e) { erroSegredo = e.message; }
  registrar(/Segredo/.test(erroSegredo), 'O módulo se recusa a funcionar sem um segredo forte configurado');

  await site.execute('UPDATE tentativas_login SET criado_em = criado_em - INTERVAL 2 DAY WHERE chave_ip = ?', [limite.chave('200.1.1.1', segredo)]);
  await limite.limparTentativasAntigas(consulta);
  const [[{ antigas }]] = await site.execute('SELECT COUNT(*) AS antigas FROM tentativas_login WHERE criado_em < NOW() - INTERVAL 1 DAY');
  registrar(antigas === 0, 'Registros com mais de 1 dia são apagados');
}

// ---------------------------------------------------------------------------
// Limpeza e resumo
// ---------------------------------------------------------------------------
await site.end();
await admin.query(`DROP DATABASE ${BANCO}`);
await admin.query(`DROP DATABASE ${BANCO}_outro`);
await admin.query(`DROP USER '${USUARIO_SITE}'@'${hostSite}'`);
await admin.end();

const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length} testes: ${resultados.length - falhas.length} passaram, ${falhas.length} falharam.`);

const md = [
  '# Resultado da bateria de testes do banco de dados',
  '',
  `Executado em ${new Date().toLocaleString('pt-BR')}. ${resultados.length} testes: **${resultados.length - falhas.length} passaram, ${falhas.length} falharam.**`,
  '',
  ...[...new Set(resultados.map((r) => r.grupo))].flatMap((g) => [
    `## ${g}`, '', '| | Teste | Detalhe |', '|---|---|---|',
    ...resultados.filter((r) => r.grupo === g).map((r) => `| ${r.ok ? '✅' : '❌'} | ${r.nome.replaceAll('|', '/')} | ${r.detalhe.replaceAll('|', '/')} |`),
    '',
  ]),
];
writeFileSync(join(AQUI, 'ultimo-resultado.md'), md.join('\n'), 'utf8');
process.exit(falhas.length ? 1 : 0);
