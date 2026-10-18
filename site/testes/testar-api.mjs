// =============================================================================
// Bateria de testes da API (PHP): rotas, requisições, segurança e regras de negócio.
//
// Sobe tudo isolado e apaga no final: banco nf_api_teste (schema.sql + usuário com privilégio
// mínimo), o PHP embutido com a API e um falso serviço de CNPJ (sem depender da internet).
//
// Uso (credenciais do banco LOCAL vêm de variáveis de ambiente, nunca do código):
//   DB_PORT=3311 DB_ADMIN_USER=root DB_ADMIN_PASSWORD=... node testes/testar-api.mjs
// =============================================================================

import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import path from 'node:path';
import {
  apagarBanco, apagarPasta, conectarAdmin, criarBanco, escreverConfig, iniciarPhp, pastaTemporaria,
} from './ambiente-api.mjs';

const BANCO = 'nf_api_teste';
const USUARIO = 'nf_api_teste';
const PORTA = 8091;
const PORTA_SEGURA = 8092; // mesma API com a configuração de produção (cookie seguro)
const PORTA_SEM_BANCO = 8093; // banco fora do ar
const PORTA_SEM_CONFIG = 8094; // configuração ausente
const PORTA_SEM_CONTAS = 8095; // vitrine: contas de cliente desligadas
const PORTA_SEM_GITHUB = 8096; // mesma sessão do principal, sem o bloco "github" na configuração
const PORTA_GITHUB = 8098; // falso GitHub (publicação pelo painel)
const PORTA_CNPJ = 8099;
const BASE = `http://127.0.0.1:${PORTA}`;

// ---------- resultados ----------
const resultados = [];
let grupoAtual = '';
const grupo = (n) => { grupoAtual = n; console.log(`\n## ${n}`); };
function ok(cond, nome, detalhe = '') {
  resultados.push({ grupo: grupoAtual, ok: !!cond, nome, detalhe });
  console.log(`${cond ? '  ✅' : '  ❌'} ${nome}${detalhe && !cond ? `  (${detalhe})` : ''}`);
}
async function passo(nome, fn) {
  try { await fn(); } catch (e) { ok(false, nome, `erro: ${String(e.message).split('\n')[0].slice(0, 160)}`); }
}

// ---------- documentos válidos ----------
let semente = Date.now() % 1e8;
const aleatorio = (n) => Array.from({ length: n }, () => String((semente = (semente * 48271) % 2147483647) % 10)).join('');
function cpf() {
  for (;;) {
    const d = aleatorio(9);
    if (/^(\d)\1+$/.test(d)) continue;
    const dv = (s, n) => { let t = 0; for (let i = 0; i < n; i++) t += Number(s[i]) * (n + 1 - i); const r = (t * 10) % 11; return r === 10 ? 0 : r; };
    const a = d + dv(d, 9);
    return a + dv(a, 10);
  }
}
function cnpj() {
  const d = aleatorio(8) + '0001';
  const dv = (s, pesos) => { const t = pesos.reduce((x, p, i) => x + Number(s[i]) * p, 0) % 11; return t < 2 ? 0 : 11 - t; };
  const a = d + dv(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return a + dv(a, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
}
let n = 0;
const email = (p = 'cliente') => `${p}.${Date.now()}.${++n}@exemplo.com.br`;
const SENHA = 'senhaBoa123';

function cadastroPF(extra = {}) {
  return {
    tipo: 'cpf', nome: 'Ana', sobrenome: 'Souza', email: email(), telefone: '(12) 99999-0000', documento: cpf(),
    cep: '12236-500', rua: 'Av. Gisele Martins', numero: '541', complemento: '', bairro: 'Bosque dos Ipês',
    cidade: 'São José dos Campos', uf: 'SP', senha: SENHA, aceite: true, ...extra,
  };
}
const cadastroPJ = (doc, extra = {}) => cadastroPF({ tipo: 'cnpj', documento: doc, razaoSocial: 'Empresa Teste LTDA', nomeFantasia: 'Teste', ...extra });

// ---------- cliente HTTP com cookies (como um navegador) ----------
class Navegador {
  constructor(base = BASE) { this.base = base; this.cookies = new Map(); this.csrf = null; }
  get cookie() { return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '); }
  async req(metodo, rota, { json, corpo, cabecalhos = {}, comCsrf = true } = {}) {
    const h = { ...cabecalhos };
    if (this.cookies.size) h.cookie = this.cookie;
    if (json !== undefined) { corpo = JSON.stringify(json); h['content-type'] ??= 'application/json'; }
    if (metodo !== 'GET' && comCsrf && this.csrf && !('x-csrf-token' in h)) h['x-csrf-token'] = this.csrf;
    const inicio = performance.now();
    const r = await fetch(this.base + rota, { method: metodo, headers: h, body: corpo, redirect: 'manual' });
    const ms = performance.now() - inicio;
    const setCookie = r.headers.getSetCookie();
    for (const c of setCookie) {
      const [par] = c.split(';');
      const i = par.indexOf('=');
      const nome = par.slice(0, i).trim();
      if (/max-age=0/i.test(c)) this.cookies.delete(nome); else this.cookies.set(nome, par.slice(i + 1));
    }
    const texto = await r.text();
    let dados = null;
    try { dados = JSON.parse(texto); } catch {}
    if (dados?.csrf) this.csrf = dados.csrf;
    return { status: r.status, dados, texto, h: r.headers, setCookie, ms };
  }
  sessao() { return this.req('GET', '/api/sessao'); }
  async pronto() { await this.sessao(); return this; }
  post(rota, json, op = {}) { return this.req('POST', rota, { json, ...op }); }
}
const novo = () => new Navegador().pronto();

// ---------- falso serviço de CNPJ (BrasilAPI) ----------
const CNPJ_ATIVO = cnpj();
const CNPJ_BAIXADO = cnpj();
const CNPJ_INEXISTENTE = cnpj();
const CNPJ_FORA_DO_AR = cnpj();
const servidorCnpj = createServer((req, res) => {
  const doc = req.url.split('/').pop();
  if (doc === CNPJ_INEXISTENTE) { res.writeHead(404); return res.end('{}'); }
  if (doc === CNPJ_FORA_DO_AR) { res.writeHead(500); return res.end('erro'); }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ cnpj: doc, descricao_situacao_cadastral: doc === CNPJ_BAIXADO ? 'BAIXADA' : 'ATIVA' }));
});
await new Promise((r) => servidorCnpj.listen(PORTA_CNPJ, '127.0.0.1', r));

// ---------- falso GitHub (Actions) ----------
const github = { runs: [], pedidos: [] };
const servidorGithub = createServer((req, res) => {
  let corpo = '';
  req.on('data', (d) => { corpo += d; });
  req.on('end', () => {
    github.pedidos.push({ metodo: req.method, url: req.url, auth: req.headers.authorization, corpo });
    if (req.method === 'GET' && req.url.startsWith('/repos/dono/NF-Site/actions/workflows/publicar.yml/runs?')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ workflow_runs: github.runs }));
    }
    if (req.method === 'POST' && req.url === '/repos/dono/NF-Site/actions/workflows/publicar.yml/dispatches') {
      res.writeHead(204);
      return res.end();
    }
    res.writeHead(404);
    res.end('{}');
  });
});
await new Promise((r) => servidorGithub.listen(PORTA_GITHUB, '127.0.0.1', r));
const TOKEN_GITHUB = `github_pat_teste_${randomBytes(12).toString('hex')}`;

// ---------- ambiente ----------
const admin = await conectarAdmin();
const senhaBanco = await criarBanco(admin, BANCO, USUARIO);
const pasta = pastaTemporaria();
const dsn = `mysql:host=127.0.0.1;port=${process.env.DB_PORT || 3306};dbname=${BANCO};charset=utf8mb4`;
const urlCnpj = `http://127.0.0.1:${PORTA_CNPJ}/cnpj/{cnpj}`;
const base = { dsn, usuario: USUARIO, senha: senhaBanco, urlCnpj };

const pastaPrincipal = path.join(pasta, 'principal');
const pastaSegura = path.join(pasta, 'segura');
const pastaSemBanco = path.join(pasta, 'sem-banco');
const pastaSemContas = path.join(pasta, 'sem-contas');
const pastaSemGithub = path.join(pasta, 'sem-github');
for (const p of [pastaPrincipal, pastaSegura, pastaSemBanco, pastaSemContas, pastaSemGithub]) (await import('node:fs')).mkdirSync(p);
const segredoPrincipal = randomBytes(32).toString('hex');
const pastaSite = path.join(pastaPrincipal, 'site'); // fotos enviadas pelo painel

const phpPrincipal = await iniciarPhp({ porta: PORTA, config: escreverConfig(pastaPrincipal, {
  ...base, origens: [BASE], segredo: segredoPrincipal, pastaSite,
  github: { token: TOKEN_GITHUB, repositorio: 'dono/NF-Site', ramo: 'teste', api: `http://127.0.0.1:${PORTA_GITHUB}` },
}) });
const phpSemContas = await iniciarPhp({ porta: PORTA_SEM_CONTAS, contas: false, config: escreverConfig(pastaSemContas, { ...base }) });
const phpSemGithub = await iniciarPhp({ porta: PORTA_SEM_GITHUB, config: escreverConfig(pastaSemGithub, {
  ...base, segredo: segredoPrincipal, pastaSessoes: path.join(pastaPrincipal, 'sessoes'),
}) });
const phpSeguro = await iniciarPhp({ porta: PORTA_SEGURA, config: escreverConfig(pastaSegura, { ...base, cookieSeguro: true, origens: [] }) });
const phpSemBanco = await iniciarPhp({ porta: PORTA_SEM_BANCO, config: escreverConfig(pastaSemBanco, { ...base, senha: 'senha-errada' }) });
const phpSemConfig = await iniciarPhp({ porta: PORTA_SEM_CONFIG, config: path.join(pasta, 'nao-existe.php') });

const linhas = (sql, p = []) => admin.query(sql, p).then(([l]) => l);
const zerarTentativas = () => admin.query(`DELETE FROM ${BANCO}.tentativas_login`);

try {
  // ===========================================================================
  grupo('1. Rotas');
  // ===========================================================================
  await passo('rotas', async () => {
    const nav = new Navegador();
    const r = await nav.sessao();
    ok(r.status === 200 && r.dados && 'cliente' in r.dados && r.dados.cliente === null, 'GET /api/sessao responde 200 sem cliente');
    ok(/^[0-9a-f]{64}$/.test(r.dados?.csrf || ''), 'GET /api/sessao entrega código CSRF de 256 bits');
    for (const rota of ['/api/', '/api', '/api/nada', '/api/sessao/', '/api/SESSAO', '/api/index.php', '/api/_lib/banco.php',
      '/api/_lib/rotas.php', '/api/config.exemplo.php', '/api/_ambiente.php', '/api/.htaccess', '/api/sessao.php', '/']) {
      const x = await nav.req('GET', rota);
      ok(x.status === 404 && x.dados?.erro, `GET ${rota} → 404 em JSON (nada é executado ou mostrado)`, `HTTP ${x.status}`);
    }
    const p = await nav.req('POST', '/api/sessao', { json: {} });
    ok(p.status === 405 && p.h.get('allow') === 'GET', 'POST /api/sessao → 405 com Allow: GET', `HTTP ${p.status} ${p.h.get('allow')}`);
    for (const rota of ['/api/entrar', '/api/cadastrar', '/api/sair']) {
      const g = await nav.req('GET', rota);
      ok(g.status === 405 && g.h.get('allow') === 'POST', `GET ${rota} → 405 com Allow: POST`, `HTTP ${g.status}`);
    }
    for (const m of ['PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
      const x = await nav.req(m, '/api/entrar');
      ok(x.status === 405, `${m} /api/entrar → 405`, `HTTP ${x.status}`);
    }
  });

  // ===========================================================================
  grupo('2. Cabeçalhos de segurança em todas as respostas');
  // ===========================================================================
  await passo('cabeçalhos', async () => {
    const nav = new Navegador();
    const respostas = [await nav.sessao(), await nav.req('GET', '/api/nada'), await nav.req('POST', '/api/entrar', { json: {} }),
      await nav.req('OPTIONS', '/api/sessao', { cabecalhos: { origin: 'https://golpe.com', 'access-control-request-method': 'POST' } })];
    const todos = (f) => respostas.every((r) => f(r.h));
    ok(todos((h) => (h.get('content-type') || '').startsWith('application/json')), 'Content-Type: application/json');
    ok(todos((h) => h.get('cache-control') === 'no-store'), 'Cache-Control: no-store (nada fica guardado em cache)');
    ok(todos((h) => h.get('x-content-type-options') === 'nosniff'), 'X-Content-Type-Options: nosniff');
    ok(todos((h) => (h.get('content-security-policy') || '').includes("default-src 'none'")), "CSP default-src 'none'");
    ok(todos((h) => h.get('x-frame-options') === 'DENY'), 'X-Frame-Options: DENY');
    ok(todos((h) => !h.get('x-powered-by')), 'Não revela a versão do PHP (sem X-Powered-By)');
    ok(todos((h) => ![...h.keys()].some((k) => k.startsWith('access-control-'))), 'Nenhum cabeçalho CORS: outros sites não leem as respostas');
  });

  // ===========================================================================
  grupo('3. Requisições: origem, CSRF e formato');
  // ===========================================================================
  await passo('requisições', async () => {
    const nav = await novo();
    const sem = await nav.post('/api/entrar', { email: 'a@b.com', senha: 'x' }, { comCsrf: false });
    ok(sem.status === 403 && sem.dados?.codigo === 'csrf', 'POST sem código CSRF → 403');
    const errado = await nav.post('/api/entrar', { email: 'a@b.com', senha: 'x' }, { cabecalhos: { 'x-csrf-token': 'a'.repeat(64) } });
    ok(errado.status === 403, 'POST com código CSRF inventado → 403');
    const outro = await novo();
    const deOutro = await nav.post('/api/entrar', { email: 'a@b.com', senha: 'x' }, { cabecalhos: { 'x-csrf-token': outro.csrf } });
    ok(deOutro.status === 403, 'POST com código CSRF de outra sessão → 403');
    const semCookie = await new Navegador().req('POST', '/api/entrar', { json: { email: 'a@b.com', senha: 'x' }, cabecalhos: { 'x-csrf-token': nav.csrf } });
    ok(semCookie.status === 403, 'POST com código certo mas sem o cookie da sessão → 403');
    const arquivosAntes = readdirSync(path.join(pastaPrincipal, 'sessoes')).length;
    for (let i = 0; i < 5; i++) await new Navegador().req('POST', '/api/entrar', { json: { email: 'a@b.com', senha: 'x' } });
    ok(readdirSync(path.join(pastaPrincipal, 'sessoes')).length === arquivosAntes, 'POST sem cookie não cria arquivos de sessão no servidor');

    const golpe = await nav.post('/api/entrar', { email: 'a@b.com', senha: 'x' }, { cabecalhos: { origin: 'https://golpe.com' } });
    ok(golpe.status === 403, 'Origin de outro site → 403');
    const golpeGet = await nav.req('GET', '/api/sessao', { cabecalhos: { origin: 'https://golpe.com' } });
    ok(golpeGet.status === 403 && !golpeGet.dados?.csrf, 'GET vindo de outro site → 403 (não entrega o CSRF)');
    const cross = await nav.post('/api/entrar', { email: 'a@b.com', senha: 'x' }, { cabecalhos: { 'sec-fetch-site': 'cross-site' } });
    ok(cross.status === 403, 'Sec-Fetch-Site: cross-site → 403');
    const sameSite = await nav.post('/api/entrar', { email: 'a@b.com', senha: 'x' }, { cabecalhos: { 'sec-fetch-site': 'same-site' } });
    ok(sameSite.status === 403, 'Sec-Fetch-Site: same-site (subdomínio) → 403');
    const mesma = await nav.post('/api/entrar', { email: 'nao.existe@b.com', senha: 'x' }, { cabecalhos: { origin: BASE, 'sec-fetch-site': 'same-origin' } });
    ok(mesma.status === 401, 'Pedido do próprio site (mesma origem) é atendido');

    // Formulário HTML de outro site só consegue mandar text/plain, form-urlencoded ou multipart
    for (const tipo of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data; boundary=x']) {
      const x = await nav.req('POST', '/api/entrar', { corpo: 'email=a@b.com&senha=x', cabecalhos: { 'content-type': tipo } });
      ok(x.status === 415, `Content-Type ${tipo.split(';')[0]} → 415`, `HTTP ${x.status}`);
    }
    const invalido = await nav.req('POST', '/api/entrar', { corpo: '{"email": ', cabecalhos: { 'content-type': 'application/json' } });
    ok(invalido.status === 400, 'JSON quebrado → 400');
    for (const corpo of ['[]', '[1,2]', '"texto"', '123', 'null']) {
      const x = await nav.req('POST', '/api/entrar', { corpo, cabecalhos: { 'content-type': 'application/json' } });
      ok(x.status === 400, `Corpo ${corpo} (não é objeto) → 400`, `HTTP ${x.status}`);
    }
    const fundo = await nav.req('POST', '/api/entrar', { corpo: '{"a":'.repeat(12) + '1' + '}'.repeat(12), cabecalhos: { 'content-type': 'application/json' } });
    ok(fundo.status === 400, 'JSON aninhado demais → 400');
    const grande = await nav.post('/api/cadastrar', { ...cadastroPF(), lixo: 'x'.repeat(40000) });
    ok(grande.status === 413, 'Corpo maior que 32 KB → 413', `HTTP ${grande.status}`);
  });

  // ===========================================================================
  grupo('4. Cadastro');
  // ===========================================================================
  let contaPF;
  await passo('cadastro', async () => {
    await zerarTentativas();
    const nav = await novo();
    const csrfAntes = nav.csrf;
    const cookieAntes = [...nav.cookies.values()][0];
    contaPF = cadastroPF({ email: email('Ana.Maiuscula').replace('Ana.Maiuscula', 'ANA.Maiuscula'), role: 'admin', status: 'inativo', email_verificado_em: '2020-01-01', id: 1 });
    const r = await nav.post('/api/cadastrar', contaPF);
    ok(r.status === 201, 'Cadastro de pessoa física válido → 201', `HTTP ${r.status} ${r.texto.slice(0, 120)}`);
    ok(r.dados?.cliente?.tipo === 'cpf' && r.dados.cliente.nome === 'Ana', 'Resposta traz só nome, e-mail e tipo do cliente');
    ok(!/senha|hash|argon|documento|telefone/i.test(JSON.stringify(r.dados?.cliente)), 'Resposta não traz senha, hash, documento nem telefone');
    ok(nav.csrf !== csrfAntes && [...nav.cookies.values()][0] !== cookieAntes, 'Novo id de sessão e novo CSRF depois de criar a conta');
    const [u] = await linhas(`SELECT * FROM ${BANCO}.usuarios WHERE documento = ?`, [contaPF.documento]);
    ok(u?.email === contaPF.email.toLowerCase(), 'E-mail guardado em minúsculas');
    ok(u?.senha_hash?.startsWith('$argon2id$v=19$'), 'Senha guardada como hash argon2id');
    ok(u && !JSON.stringify(u).includes(SENHA), 'A senha em texto não aparece em nenhuma coluna');
    ok(u?.role === 'cliente' && u.status === 'ativo' && u.email_verificado_em === null, 'Campos extras (role=admin, status, e-mail verificado) são ignorados');
    ok(u?.telefone === '12999990000' && u.cep === undefined, 'Telefone guardado só com números');
    const [end] = await linhas(`SELECT * FROM ${BANCO}.enderecos WHERE usuario_id = ?`, [u?.id]);
    ok(end?.cep === '12236500' && end.principal === 1 && end.uf === 'SP', 'Endereço principal gravado (CEP só números)');
    ok(u?.aceite_privacidade_em instanceof Date, 'Data do aceite da Política de Privacidade registrada (LGPD)');
    const s = await nav.sessao();
    ok(s.dados?.cliente?.email === contaPF.email.toLowerCase(), 'Depois de criar a conta, a sessão já está logada');

    const dupEmail = await (await novo()).post('/api/cadastrar', cadastroPF({ email: contaPF.email.toUpperCase() }));
    ok(dupEmail.status === 409 && dupEmail.dados?.campos?.email, 'E-mail repetido (mesmo com maiúsculas) → 409 no campo e-mail');
    const dupDoc = await (await novo()).post('/api/cadastrar', cadastroPF({ documento: contaPF.documento }));
    ok(dupDoc.status === 409 && dupDoc.dados?.campos?.documento, 'CPF repetido → 409 no campo documento');
  });

  await passo('validação do cadastro', async () => {
    await zerarTentativas();
    const nav = await novo();
    const casos = [
      ['CPF com dígito errado', { documento: '12345678900' }, 'documento'],
      ['CPF com números repetidos', { documento: '11111111111' }, 'documento'],
      ['CNPJ no lugar de CPF', { documento: CNPJ_ATIVO }, 'documento'],
      ['E-mail sem domínio', { email: 'ana@' }, 'email'],
      ['E-mail com espaço', { email: 'ana souza@x.com' }, 'email'],
      ['E-mail gigante', { email: `${'a'.repeat(250)}@x.com` }, 'email'],
      ['Telefone curto', { telefone: '1234' }, 'telefone'],
      ['CEP com 7 números', { cep: '1223650' }, 'cep'],
      ['UF inexistente', { uf: 'XX' }, 'uf'],
      ['UF em minúsculas', { uf: 'sp' }, 'uf'],
      ['Nome vazio', { nome: '   ' }, 'nome'],
      ['Nome com 61 letras', { nome: 'a'.repeat(61) }, 'nome'],
      ['Nome com caractere de controle', { nome: 'Ana\u0000' }, 'nome'],
      ['Nome com quebra de linha', { nome: 'Ana\nSouza' }, 'nome'],
      ['Nome que não é texto', { nome: ['Ana'] }, 'nome'],
      ['Número com 11 caracteres', { numero: '12345678901' }, 'numero'],
      ['Senha sem número', { senha: 'abcdefghij' }, 'senha'],
      ['Senha sem letra', { senha: '1234567890' }, 'senha'],
      ['Senha com 7 caracteres', { senha: 'abc1234' }, 'senha'],
      ['Senha com 129 caracteres', { senha: 'a1'.repeat(64) + 'b' }, 'senha'],
      ['Senha que não é texto', { senha: 12345678 }, 'senha'],
      ['Sem aceite da Política', { aceite: false }, 'aceite'],
      ['Aceite como texto "true"', { aceite: 'true' }, 'aceite'],
    ];
    for (const [nome, extra, campo] of casos) {
      const r = await nav.post('/api/cadastrar', cadastroPF(extra));
      ok(r.status === 422 && r.dados?.campos?.[campo], `${nome} → 422 no campo ${campo}`, `HTTP ${r.status} ${JSON.stringify(r.dados?.campos)}`);
    }
    const tipo = await nav.post('/api/cadastrar', cadastroPF({ tipo: 'admin' }));
    ok(tipo.status === 422, 'Tipo de cadastro inválido → 422');
    const varios = await nav.post('/api/cadastrar', { tipo: 'cpf' });
    ok(varios.status === 422 && Object.keys(varios.dados?.campos || {}).length >= 10, 'Cadastro vazio → 422 com todos os campos apontados');
    const [{ total }] = await linhas(`SELECT COUNT(*) AS total FROM ${BANCO}.usuarios`);
    ok(Number(total) === 1, 'Nenhum cadastro inválido entrou no banco', `${total} usuários`);
    const acentos = await nav.post('/api/cadastrar', cadastroPF({ nome: 'João', sobrenome: 'Conceição Ñandú', senha: 'çãoÉótima9' }));
    ok(acentos.status === 201, 'Nomes e senha com acentos são aceitos');
  });

  await passo('cadastro de empresa', async () => {
    await zerarTentativas();
    const ativo = await (await novo()).post('/api/cadastrar', cadastroPJ(CNPJ_ATIVO));
    ok(ativo.status === 201 && ativo.dados?.cliente?.tipo === 'cnpj', 'CNPJ ativo na Receita → 201 (conta de empresa)');
    const [u] = await linhas(`SELECT situacao_cnpj, cnpj_verificado_em, razao_social, tipo_pessoa FROM ${BANCO}.usuarios WHERE documento = ?`, [CNPJ_ATIVO]);
    ok(u?.situacao_cnpj === 'ATIVA' && u.cnpj_verificado_em instanceof Date && u.tipo_pessoa === 'PJ', 'Situação conferida pelo servidor e guardada com a data');
    const baixado = await (await novo()).post('/api/cadastrar', cadastroPJ(CNPJ_BAIXADO));
    ok(baixado.status === 422 && /BAIXADA/.test(baixado.dados?.campos?.documento || ''), 'CNPJ baixado → 422 (exige CNPJ ativo)');
    const inexistente = await (await novo()).post('/api/cadastrar', cadastroPJ(CNPJ_INEXISTENTE));
    ok(inexistente.status === 422, 'CNPJ que não existe na Receita → 422');
    const fora = await (await novo()).post('/api/cadastrar', cadastroPJ(CNPJ_FORA_DO_AR));
    ok(fora.status === 201 && /não conferida/.test(fora.dados?.situacaoCnpj || ''), 'Receita fora do ar → cadastro aceito, marcado "não conferida" para a equipe');
    const semRazao = await (await novo()).post('/api/cadastrar', cadastroPJ(cnpj(), { razaoSocial: '' }));
    ok(semRazao.status === 422 && semRazao.dados?.campos?.razaoSocial, 'Empresa sem razão social → 422');
    const cpfComoEmpresa = await (await novo()).post('/api/cadastrar', cadastroPJ(cpf()));
    ok(cpfComoEmpresa.status === 422, 'CPF no cadastro de empresa → 422');
  });

  await passo('injeção', async () => {
    await zerarTentativas();
    const ataque = "Robert'); DROP TABLE usuarios;--";
    const xss = '<script>alert(1)</script>';
    const nav = await novo();
    const r = await nav.post('/api/cadastrar', cadastroPF({ nome: xss, sobrenome: ataque, rua: "' OR '1'='1", complemento: '"; DELETE FROM enderecos; --' }));
    ok(r.status === 201, 'Textos com SQL e HTML são aceitos como texto comum', `HTTP ${r.status}`);
    const [u] = await linhas(`SELECT primeiro_nome, sobrenome FROM ${BANCO}.usuarios WHERE primeiro_nome = ?`, [xss]);
    ok(u?.sobrenome === ataque, 'Guardados exatamente como digitados (nada executado)');
    const [{ tabelas }] = await linhas(`SELECT COUNT(*) AS tabelas FROM information_schema.tables WHERE table_schema = ?`, [BANCO]);
    ok(Number(tabelas) === 12, 'As 12 tabelas continuam lá');
    ok(!r.texto.includes('<script>') && r.texto.includes('\\u003Cscript'), 'Na resposta, "<" e ">" saem escapados (não viram HTML)');
    const login = await (await novo()).post('/api/entrar', { email: "'OR'1'='1'--@x.com", senha: "' OR '1'='1" });
    ok(login.status === 401, 'Login com SQL no e-mail e na senha → 401 (tratado como texto)', `HTTP ${login.status}`);
    const loginEspaco = await (await novo()).post('/api/entrar', { email: "' OR 1=1 --@x.com", senha: 'x' });
    ok(loginEspaco.status === 422, 'E-mail com espaços e SQL → 422 (nem chega ao banco)', `HTTP ${loginEspaco.status}`);
    const login2 = await (await novo()).post('/api/entrar', { email: { $ne: null }, senha: { $ne: null } });
    ok(login2.status === 422, 'Login com objetos no lugar de texto → 422');
  });

  // ===========================================================================
  grupo('5. Login, sessão e saída');
  // ===========================================================================
  await passo('login', async () => {
    await zerarTentativas();
    const nav = await novo();
    const idAntes = [...nav.cookies.values()][0];
    const errada = await nav.post('/api/entrar', { email: contaPF.email, senha: 'senhaErrada1' });
    const inexistente = await nav.post('/api/entrar', { email: email('ninguem'), senha: 'senhaErrada1' });
    ok(errada.status === 401 && inexistente.status === 401, 'Senha errada e e-mail inexistente → 401');
    ok(errada.dados?.erro === inexistente.dados?.erro, 'Mesma mensagem nos dois casos (não revela quais e-mails têm conta)');
    const certo = await nav.post('/api/entrar', { email: `  ${contaPF.email.toUpperCase()} `, senha: SENHA });
    ok(certo.status === 200 && certo.dados?.cliente?.nome === 'Ana', 'Senha certa → 200 (e-mail sem diferenciar maiúsculas e espaços)');
    ok([...nav.cookies.values()][0] !== idAntes, 'Novo id de sessão ao entrar (contra fixação de sessão)');
    const [u] = await linhas(`SELECT ultimo_login_em FROM ${BANCO}.usuarios WHERE email = ?`, [contaPF.email.toLowerCase()]);
    ok(u?.ultimo_login_em instanceof Date, 'Último login registrado');
    const s = await nav.sessao();
    ok(s.dados?.cliente?.email === contaPF.email.toLowerCase(), 'GET /api/sessao mostra o cliente logado');
    const tentativas = await linhas(`SELECT chave_email, chave_ip FROM ${BANCO}.tentativas_login`);
    ok(tentativas.length >= 3 && tentativas.every((t) => /^[0-9a-f]{64}$/.test(t.chave_email) && /^[0-9a-f]{64}$/.test(t.chave_ip)),
      'Tentativas guardadas só como HMAC (sem e-mail nem IP legíveis)');
    ok(!JSON.stringify(tentativas).includes('127.0.0.1') && !JSON.stringify(tentativas).toLowerCase().includes('exemplo.com'), 'Nenhum e-mail ou IP em texto no banco');

    const cookieVelho = nav.cookie;
    const sair = await nav.post('/api/sair', {});
    ok(sair.status === 200 && sair.dados?.cliente === null, 'POST /api/sair → 200');
    ok(sair.setCookie.some((c) => /max-age=0/i.test(c)), 'Sair apaga o cookie da sessão');
    const depois = await nav.sessao();
    ok(depois.dados?.cliente === null, 'Depois de sair, a sessão não tem cliente');
    const reaproveitado = await new Navegador().req('GET', '/api/sessao', { cabecalhos: { cookie: cookieVelho } });
    ok(reaproveitado.dados?.cliente === null, 'O cookie antigo não serve mais depois de sair');
    await nav.sessao();
    const sairDeNovo = await nav.post('/api/sair', {});
    ok(sairDeNovo.status === 200, 'Sair sem estar logado não dá erro');
  });

  await passo('sessão', async () => {
    const nav = new Navegador();
    const inventado = await nav.req('GET', '/api/sessao', { cabecalhos: { cookie: 'nf_sessao=sessaoinventadapeloatacante1234' } });
    const id = (inventado.setCookie.find((c) => c.startsWith('nf_sessao=')) || '').split(';')[0].split('=')[1];
    ok(id && id !== 'sessaoinventadapeloatacante1234', 'Id de sessão inventado é recusado e trocado (modo estrito)');
    const lixo = await new Navegador().req('GET', '/api/sessao', { cabecalhos: { cookie: "nf_sessao=../../etc/passwd'%00" } });
    ok(lixo.status === 200 && lixo.dados?.cliente === null, 'Cookie de sessão malicioso não causa erro nem acesso');
    const c = inventado.setCookie.find((x) => x.startsWith('nf_sessao=')) || '';
    ok(/httponly/i.test(c), 'Cookie HttpOnly (JavaScript não lê)');
    ok(/samesite=lax/i.test(c), 'Cookie SameSite=Lax');
    ok(/path=\//i.test(c) && !/domain=/i.test(c), 'Cookie só deste endereço (Path=/, sem Domain)');
    ok(existsSync(path.join(pastaPrincipal, 'sessoes')) && readdirSync(path.join(pastaPrincipal, 'sessoes')).some((f) => f.startsWith('sess_')),
      'Sessões guardadas na pasta privada da configuração');

    const seguro = await new Navegador(`http://127.0.0.1:${PORTA_SEGURA}`).sessao();
    const cs = seguro.setCookie[0] || '';
    ok(cs.startsWith('__Host-nf_sessao=') && /;\s*secure/i.test(cs), 'Em produção: cookie __Host- com Secure (só via HTTPS)', cs.slice(0, 80));

    // conta desativada perde a sessão na hora
    const conta = cadastroPF();
    await zerarTentativas();
    const n2 = await novo();
    await n2.post('/api/cadastrar', conta);
    await admin.query(`UPDATE ${BANCO}.usuarios SET status = 'inativo' WHERE documento = ?`, [conta.documento]);
    ok((await n2.sessao()).dados?.cliente === null, 'Conta desativada: a sessão aberta deixa de valer');
    const n3 = await novo();
    const login = await n3.post('/api/entrar', { email: conta.email, senha: SENHA });
    ok(login.status === 401 && login.dados?.erro === 'E-mail ou senha incorretos.', 'Conta desativada não entra (mesma mensagem genérica)');
  });

  await passo('tempo de resposta', async () => {
    await zerarTentativas();
    const nav = await novo();
    const medir = async (e) => { const t = []; for (let i = 0; i < 3; i++) t.push((await nav.post('/api/entrar', { email: e, senha: `errada${i}x` })).ms); return t.sort((a, b) => a - b)[1]; };
    const existente = await medir(contaPF.email);
    const inexistente = await medir(email('fantasma'));
    const razao = existente / inexistente;
    ok(razao > 0.6 && razao < 1.6, 'E-mail existente e inexistente demoram o mesmo (não dá para descobrir contas pelo tempo)',
      `${existente.toFixed(0)} ms x ${inexistente.toFixed(0)} ms`);
  });

  // ===========================================================================
  grupo('6. Limite de tentativas (força bruta)');
  // ===========================================================================
  await passo('limite por e-mail', async () => {
    await zerarTentativas();
    const nav = await novo();
    for (let i = 0; i < 5; i++) await nav.post('/api/entrar', { email: contaPF.email, senha: `errada${i}x` });
    const bloqueado = await nav.post('/api/entrar', { email: contaPF.email, senha: SENHA });
    ok(bloqueado.status === 429, '5 senhas erradas → bloqueia o e-mail, até com a senha certa', `HTTP ${bloqueado.status}`);
    const espera = Number(bloqueado.h.get('retry-after'));
    ok(espera > 0 && espera <= 900, 'Resposta diz quanto esperar (Retry-After, até 15 min)', `${espera}`);
    ok(/Tente de novo em \d+ minutos?/.test(bloqueado.dados?.erro || ''), 'Mensagem em minutos para o cliente');
    const outro = await nav.post('/api/entrar', { email: email('outra'), senha: 'qualquer1' });
    ok(outro.status === 401, 'Outro e-mail continua podendo tentar');
  });

  await passo('limite por IP', async () => {
    await zerarTentativas();
    const nav = await novo();
    for (let i = 0; i < 20; i++) await nav.post('/api/entrar', { email: email('robo'), senha: 'tentativa1' });
    const r = await nav.post('/api/entrar', { email: contaPF.email, senha: SENHA });
    ok(r.status === 429, '20 senhas erradas do mesmo IP (e-mails diferentes) → bloqueia o IP', `HTTP ${r.status}`);
  });

  await passo('limite de cadastros', async () => {
    await zerarTentativas();
    let ultimo;
    for (let i = 0; i < 6; i++) ultimo = await (await novo()).post('/api/cadastrar', cadastroPF());
    ok(ultimo.status === 429 && Number(ultimo.h.get('retry-after')) > 0, '6º cadastro do mesmo IP em 1 hora → 429', `HTTP ${ultimo.status}`);
    await zerarTentativas();
    const login = await (await novo()).post('/api/entrar', { email: contaPF.email, senha: SENHA });
    ok(login.status === 200, 'Cadastros não contam como senhas erradas no limite de login');
  });

  // ===========================================================================
  grupo('8. Painel: aviso de cliente novo e produtos de interesse');
  // ===========================================================================
  const pastaEmails = path.join(pastaPrincipal, 'emails');
  const emails = () => (existsSync(pastaEmails) ? readdirSync(pastaEmails).sort().map((f) => readFileSync(path.join(pastaEmails, f), 'utf8')) : []);
  let clienteInteresse;
  await passo('aviso de cliente novo', async () => {
    await zerarTentativas();
    clienteInteresse = cadastroPF({ nome: 'Bruno', sobrenome: 'Interessado', interesses: ['15-mp5001', 'konica-minolta-bizhub-c361i', 'produto-que-nao-existe', '15-mp5001'] });
    const r = await (await novo()).post('/api/cadastrar', clienteInteresse);
    ok(r.status === 201, 'Cadastro com produtos de interesse → 201', `HTTP ${r.status} ${r.texto.slice(0, 100)}`);
    const [u] = await linhas(`SELECT id FROM ${BANCO}.usuarios WHERE email = ?`, [clienteInteresse.email]);
    clienteInteresse.id = u?.id;
    const ints = await linhas(`SELECT produto_slug, produto_nome FROM ${BANCO}.usuario_interesses WHERE usuario_id = ? ORDER BY id`, [u?.id]);
    ok(ints.length === 2 && ints[0].produto_nome === 'Ricoh MP 5001' && ints[1].produto_nome === 'Konica Minolta bizhub C361i',
      'Interesses gravados com o nome do catálogo (repetidos e inexistentes ignorados)', JSON.stringify(ints));
    const [n] = await linhas(`SELECT tipo, resumo, lida_em FROM ${BANCO}.notificacoes WHERE usuario_id = ?`, [u?.id]);
    ok(n?.tipo === 'novo_cliente' && /Bruno Interessado/.test(n.resumo) && n.lida_em === null, 'Notificação de cliente novo no painel (não lida)');
    const aviso = emails().find((e) => e.includes('To: equipe@nf.test') && e.includes('Novo cliente: Bruno Interessado'));
    ok(aviso && /Novo cliente: Bruno Interessado/.test(aviso) && aviso.includes('Ricoh MP 5001') && aviso.includes('Konica Minolta bizhub C361i'),
      'E-mail para a NF com os dados e os produtos de interesse');
    ok(aviso && !aviso.includes(SENHA), 'O e-mail nunca leva a senha');
    const [reg] = await linhas(`SELECT sucesso FROM ${BANCO}.emails_enviados WHERE usuario_id = ? AND tipo = 'novo_cliente_admin'`, [u?.id]);
    ok(reg?.sucesso === 1, 'Envio do aviso registrado');
    const ruim = await (await novo()).post('/api/cadastrar', cadastroPF({ interesses: 'tudo' }));
    ok(ruim.status === 422, 'Interesses em formato errado → 422');
    const demais = await (await novo()).post('/api/cadastrar', cadastroPF({ interesses: Array.from({ length: 31 }, (_, i) => `p${i}`) }));
    ok(demais.status === 422, 'Mais de 30 interesses → 422');
  });

  // ===========================================================================
  grupo('9. Painel: login do administrador com 2FA');
  // ===========================================================================
  // Código TOTP (RFC 6238), igual ao do app autenticador
  const { createHmac } = await import('node:crypto');
  const base32 = (s) => { const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const c of s.replace(/\s/g, '')) bits += a.indexOf(c).toString(2).padStart(5, '0'); return Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2))); };
  const totp = (chave, desloc = 0) => { const passo = Math.floor(Date.now() / 30000) + desloc; const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(passo)); const h = createHmac('sha1', base32(chave)).update(buf).digest(); const o = h[19] & 15; return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0'); };
  const ADMIN = cadastroPF({ nome: 'Admin', sobrenome: 'Teste', email: email('admin') });
  let chave2fa;
  let adm; // navegador logado como admin
  await passo('login admin', async () => {
    await zerarTentativas();
    await (await novo()).post('/api/cadastrar', ADMIN);
    await admin.query(`UPDATE ${BANCO}.usuarios SET role = 'admin' WHERE email = ?`, [ADMIN.email]);
    const anon = await new Navegador().pronto();
    const s0 = await anon.req('GET', '/api/admin/sessao');
    ok(s0.status === 200 && s0.dados?.admin === null, 'Sem login: GET admin/sessao → admin null');
    for (const rota of ['/api/admin/resumo', '/api/admin/clientes', '/api/admin/cliente?id=1', '/api/admin/clientes-csv', '/api/admin/notificacoes', '/api/admin/auditoria']) {
      const r = await anon.req('GET', rota);
      ok(r.status === 401 && r.dados?.codigo === 'admin', `Sem login: ${rota.split('?')[0]} → 401`, `HTTP ${r.status}`);
    }
    const cliente = await (await novo()).post('/api/admin/entrar', { email: contaPF.email, senha: SENHA });
    ok(cliente.status === 401, 'Cliente comum (sem role admin) não entra no painel');
    const errada = await (await novo()).post('/api/admin/entrar', { email: ADMIN.email, senha: 'senhaErrada1' });
    ok(errada.status === 401 && errada.dados?.erro === cliente.dados?.erro, 'Senha errada → 401 com a mesma mensagem genérica');
    adm = await novo();
    const idAntes = [...adm.cookies.values()][0];
    const e1 = await adm.post('/api/admin/entrar', { email: ADMIN.email, senha: SENHA });
    ok(e1.status === 200 && e1.dados?.etapa === 'configurar' && /^[A-Z2-7 ]{32,40}$/.test(e1.dados?.chave || ''), 'Primeiro acesso: pede para configurar o app autenticador (chave de 160 bits)');
    ok(String(e1.dados?.endereco).startsWith('otpauth://totp/'), 'Entrega o endereço otpauth:// para o app');
    chave2fa = e1.dados?.chave;
    ok((await adm.req('GET', '/api/admin/resumo')).status === 401, 'Só a senha não basta: sem o código, o painel continua fechado');
    const [antes] = await linhas(`SELECT totp_segredo FROM ${BANCO}.usuarios WHERE email = ?`, [ADMIN.email]);
    ok(antes?.totp_segredo === null, 'O 2FA só é gravado depois de um código certo');
    const errado = await adm.post('/api/admin/codigo', { codigo: '000000' === totp(chave2fa) ? '111111' : '000000' });
    ok(errado.status === 401, 'Código errado → 401');
    await zerarTentativas(); // cada código errado conta como tentativa (5 bloqueiam)
    for (const lixo of ['12345', '1234567', 'abcdef', 123456, null]) {
      const r = await adm.post('/api/admin/codigo', { codigo: lixo });
      ok(r.status === 401, `Código em formato inválido (${JSON.stringify(lixo)}) → 401`);
    }
    await zerarTentativas();
    const certo = await adm.post('/api/admin/codigo', { codigo: totp(chave2fa) });
    ok(certo.status === 200 && certo.dados?.admin?.nome === 'Admin', 'Código certo → entra no painel', `HTTP ${certo.status} ${certo.texto.slice(0, 80)}`);
    ok([...adm.cookies.values()][0] !== idAntes, 'Novo id de sessão ao entrar no painel');
    const [depois] = await linhas(`SELECT totp_segredo, totp_ultimo_passo FROM ${BANCO}.usuarios WHERE email = ?`, [ADMIN.email]);
    ok(depois?.totp_segredo && !depois.totp_segredo.includes(chave2fa.replace(/ /g, '')) && depois.totp_ultimo_passo > 0,
      'Segredo do 2FA guardado cifrado (não dá para ler no banco)');
    ok((await adm.req('GET', '/api/admin/resumo')).status === 200, 'Com senha + código, o painel abre');

    // Segundo login: o mesmo código não vale de novo (reuso); o próximo vale
    const outro = await novo();
    const e2 = await outro.post('/api/admin/entrar', { email: ADMIN.email, senha: SENHA });
    ok(e2.dados?.etapa === 'codigo' && !e2.dados?.chave, 'Login seguinte pede só o código (não mostra a chave de novo)');
    const reuso = await outro.post('/api/admin/codigo', { codigo: totp(chave2fa) });
    ok(reuso.status === 401, 'O mesmo código não pode ser usado duas vezes');
    const proximo = await outro.post('/api/admin/codigo', { codigo: totp(chave2fa, 1) });
    ok(proximo.status === 200, 'O código seguinte do app é aceito (tolerância de relógio)');
    const sair = await outro.post('/api/admin/sair', {});
    ok(sair.status === 200 && (await outro.req('GET', '/api/admin/resumo')).status === 401, 'Sair do painel fecha o acesso');

    // Força bruta no código
    await zerarTentativas();
    const robo = await novo();
    await robo.post('/api/admin/entrar', { email: ADMIN.email, senha: SENHA });
    let ultimo;
    for (let i = 0; i < 6; i++) ultimo = await robo.post('/api/admin/codigo', { codigo: String(100000 + i) });
    ok(ultimo.status === 429, '5 códigos errados → bloqueio por 15 minutos', `HTTP ${ultimo.status}`);
    await zerarTentativas();
    const semCsrf = await adm.post('/api/admin/cliente-status', { id: 1, status: 'inativo' }, { comCsrf: false });
    ok(semCsrf.status === 403, 'Ações do painel exigem o código CSRF');
  });

  // ===========================================================================
  grupo('10. Painel: clientes');
  // ===========================================================================
  await passo('clientes', async () => {
    const resumo = await adm.req('GET', '/api/admin/resumo');
    ok(resumo.status === 200 && resumo.dados.clientes >= 3 && resumo.dados.notificacoesNaoLidas >= 1 && Array.isArray(resumo.dados.ultimosClientes),
      'Resumo: clientes, novos, notificações e últimos cadastros', JSON.stringify(resumo.dados).slice(0, 120));
    const lista = await adm.req('GET', '/api/admin/clientes');
    ok(lista.status === 200 && lista.dados.total >= 3 && lista.dados.clientes.every((c) => !('senha_hash' in c) && !('totp_segredo' in c)),
      'Lista de clientes sem senha nem segredo');
    ok(!lista.dados.clientes.some((c) => c.email === ADMIN.email.toLowerCase()), 'Administradores não aparecem na lista de clientes');
    const porNome = await adm.req('GET', '/api/admin/clientes?busca=Interessado');
    ok(porNome.dados?.total === 1 && porNome.dados.clientes[0].nome === 'Bruno', 'Busca por nome');
    const porDoc = await adm.req('GET', `/api/admin/clientes?busca=${clienteInteresse.documento.slice(0, 3)}.${clienteInteresse.documento.slice(3, 6)}`);
    ok(porDoc.dados?.clientes.some((c) => c.id === clienteInteresse.id), 'Busca por CPF com pontuação');
    const curinga = await adm.req('GET', '/api/admin/clientes?busca=' + encodeURIComponent('%'));
    ok(curinga.dados?.total === 0, 'Busca por "%" não vira curinga (não lista todo mundo)');
    const injecao = await adm.req('GET', '/api/admin/clientes?busca=' + encodeURIComponent("' OR 'a'='a' -- "));
    ok(injecao.status === 200 && injecao.dados.total === 0, 'Busca com SQL é tratada como texto');
    const empresas = await adm.req('GET', '/api/admin/clientes?tipo=cnpj');
    ok(empresas.dados?.clientes.every((c) => c.tipo === 'cnpj'), 'Filtro por tipo (empresas)');

    const ficha = await adm.req('GET', `/api/admin/cliente?id=${clienteInteresse.id}`);
    const c = ficha.dados?.cliente;
    ok(ficha.status === 200 && c?.interesses?.length === 2 && c.endereco?.cep === '12236500' && !ficha.texto.includes('argon2'),
      'Ficha do cliente com endereço e interesses, sem hash de senha');
    ok((await adm.req('GET', '/api/admin/cliente?id=999999')).status === 404, 'Cliente inexistente → 404');
    ok((await adm.req('GET', '/api/admin/cliente?id=abc')).status === 422, 'Id inválido → 422');
    const [admRow] = await linhas(`SELECT id FROM ${BANCO}.usuarios WHERE email = ?`, [ADMIN.email]);
    ok((await adm.req('GET', `/api/admin/cliente?id=${admRow.id}`)).status === 404, 'Ficha de administrador não abre pelo painel de clientes');

    // criar
    const novoCliente = cadastroPF({ nome: 'Carla', sobrenome: 'Criada', senha: 'temporaria123' });
    delete novoCliente.aceite;
    const criar = await adm.post('/api/admin/cliente-criar', novoCliente);
    ok(criar.status === 201 && criar.dados?.id > 0, 'Criar cliente pelo painel → 201');
    ok((await adm.post('/api/admin/cliente-criar', { ...novoCliente, documento: cpf() })).status === 409, 'Criar com e-mail repetido → 409');
    ok((await adm.post('/api/admin/cliente-criar', { ...novoCliente, email: 'x' })).status === 422, 'Criar com dados inválidos → 422');
    ok((await (await novo()).post('/api/entrar', { email: novoCliente.email, senha: 'temporaria123' })).status === 200, 'Cliente criado pelo painel consegue entrar com a senha temporária');

    // editar
    const ed = { ...novoCliente, id: criar.dados.id, telefone: '(12) 98888-7777', numero: '100', senha: '' };
    const editar = await adm.post('/api/admin/cliente-editar', ed);
    ok(editar.status === 200 && editar.dados.alterados.includes('telefone') && editar.dados.alterados.includes('endereco.numero') && !editar.dados.alterados.includes('senha'),
      'Editar cliente: grava e informa os campos alterados', JSON.stringify(editar.dados));
    const [ce] = await linhas(`SELECT telefone FROM ${BANCO}.usuarios WHERE id = ?`, [criar.dados.id]);
    ok(ce?.telefone === '12988887777', 'Alteração gravada no banco');
    ok((await adm.post('/api/admin/cliente-editar', { ...ed, email: contaPF.email })).status === 409, 'Editar para um e-mail de outro cliente → 409');
    ok((await adm.post('/api/admin/cliente-editar', { ...ed, id: admRow.id })).status === 404, 'Não edita administradores');
    const novaSenha = await adm.post('/api/admin/cliente-editar', { ...ed, senha: 'novaSenha456' });
    ok(novaSenha.dados?.alterados.includes('senha'), 'Painel pode redefinir a senha do cliente');
    ok((await (await novo()).post('/api/entrar', { email: novoCliente.email, senha: 'novaSenha456' })).status === 200, 'Cliente entra com a senha nova');

    // inativar / ativar
    const sessaoCliente = await novo();
    await sessaoCliente.post('/api/entrar', { email: novoCliente.email, senha: 'novaSenha456' });
    ok((await adm.post('/api/admin/cliente-status', { id: criar.dados.id, status: 'inativo' })).status === 200, 'Inativar cliente');
    ok((await sessaoCliente.sessao()).dados?.cliente === null, 'Cliente inativado perde a sessão aberta na hora');
    ok((await (await novo()).post('/api/entrar', { email: novoCliente.email, senha: 'novaSenha456' })).status === 401, 'Cliente inativo não entra');
    ok((await adm.post('/api/admin/cliente-status', { id: criar.dados.id, status: 'apagado' })).status === 422, 'Situação inválida → 422');
    ok((await adm.post('/api/admin/cliente-pagamento', { id: criar.dados.id, situacao: 'em_atraso', enviarEmail: true })).status === 422, 'Não envia aviso de atraso para cliente inativo');
    ok((await adm.post('/api/admin/cliente-status', { id: criar.dados.id, status: 'ativo' })).status === 200
      && (await (await novo()).post('/api/entrar', { email: novoCliente.email, senha: 'novaSenha456' })).status === 200, 'Reativar cliente: volta a entrar');

    // em atraso + e-mail
    const atraso = await adm.post('/api/admin/cliente-pagamento', { id: criar.dados.id, situacao: 'em_atraso', enviarEmail: true });
    ok(atraso.status === 200 && atraso.dados?.emailEnviado === true, 'Marcar "em atraso" e enviar o aviso por e-mail');
    const [ca] = await linhas(`SELECT situacao_pagamento, em_atraso_desde FROM ${BANCO}.usuarios WHERE id = ?`, [criar.dados.id]);
    ok(ca?.situacao_pagamento === 'em_atraso' && ca.em_atraso_desde instanceof Date, 'Situação e data do atraso gravadas');
    const aviso = emails().find((e) => e.includes(`To: ${novoCliente.email.toLowerCase()}`));
    ok(aviso && /pagamento pendente/i.test(aviso) && /desconsidere/.test(aviso), 'Cliente recebe o aviso de pagamento pendente (texto neutro)');
    ok(aviso && !aviso.includes(contaPF.email) && !aviso.includes(novoCliente.documento), 'O aviso não traz documento nem dados de outros clientes');
    const repetido = await adm.post('/api/admin/cliente-pagamento', { id: criar.dados.id, situacao: 'em_atraso', enviarEmail: true });
    ok(repetido.status === 429, 'Segundo aviso em menos de 3 dias → bloqueado');
    const emDia = await adm.post('/api/admin/cliente-pagamento', { id: criar.dados.id, situacao: 'em_dia' });
    const [cd] = await linhas(`SELECT situacao_pagamento, em_atraso_desde FROM ${BANCO}.usuarios WHERE id = ?`, [criar.dados.id]);
    ok(emDia.status === 200 && cd?.situacao_pagamento === 'em_dia' && cd.em_atraso_desde === null, 'Marcar "em dia" limpa o atraso');

    // notificações
    const nots = await adm.req('GET', '/api/admin/notificacoes?filtro=nao-lidas');
    ok(nots.status === 200 && nots.dados.notificacoes.some((n) => n.clienteId === clienteInteresse.id), 'Notificações não lidas listadas');
    const ler = await adm.post('/api/admin/notificacoes-lidas', { ids: [nots.dados.notificacoes[0].id] });
    const depois = await adm.req('GET', '/api/admin/notificacoes');
    ok(ler.status === 200 && depois.dados.naoLidas === nots.dados.naoLidas - 1, 'Marcar notificação como lida');
    ok((await adm.post('/api/admin/notificacoes-lidas', { ids: ['1 OR 1=1'] })).status === 422, 'Ids inválidos → 422');
    await adm.post('/api/admin/notificacoes-lidas', { todas: true });
    ok((await adm.req('GET', '/api/admin/notificacoes')).dados.naoLidas === 0, 'Marcar todas como lidas');

    // CSV
    await adm.post('/api/admin/cliente-criar', cadastroPF({ nome: '=HYPERLINK("http://x")', sobrenome: '+Formula', senha: 'temporaria123' }));
    const csv = await adm.req('GET', '/api/admin/clientes-csv');
    ok(csv.status === 200 && (csv.h.get('content-type') || '').startsWith('text/csv') && /attachment/.test(csv.h.get('content-disposition') || ''),
      'Exportar CSV: arquivo para baixar');
    const bytes = new Uint8Array(await (await fetch(BASE + '/api/admin/clientes-csv', { headers: { cookie: adm.cookie } })).arrayBuffer());
    ok(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf && csv.texto.includes('"Nome";"Sobrenome"') && csv.texto.includes('Ricoh MP 5001'),
      'CSV com acentos para o Excel, colunas e produtos de interesse');
    ok(csv.texto.includes(`"'=HYPERLINK(""http://x"")"`) && csv.texto.includes(`"'+Formula"`), 'Células que começam com = ou + viram texto (sem fórmulas maliciosas)');
    ok(!/argon2|totp/i.test(csv.texto) && !csv.texto.includes(ADMIN.email.toLowerCase()), 'CSV sem senhas, sem segredos e sem administradores');

    // excluir
    const errado = await adm.post('/api/admin/cliente-excluir', { id: criar.dados.id, confirmacao: 'outro@x.com' });
    ok(errado.status === 422, 'Excluir exige digitar o e-mail do cliente');
    const excluir = await adm.post('/api/admin/cliente-excluir', { id: clienteInteresse.id, confirmacao: clienteInteresse.email.toUpperCase() });
    const [ex] = await linhas(`SELECT COUNT(*) AS n FROM ${BANCO}.usuarios WHERE id = ?`, [clienteInteresse.id]);
    const [exi] = await linhas(`SELECT COUNT(*) AS n FROM ${BANCO}.usuario_interesses WHERE usuario_id = ?`, [clienteInteresse.id]);
    ok(excluir.status === 200 && Number(ex.n) === 0 && Number(exi.n) === 0, 'Excluir cliente apaga cadastro e interesses (LGPD)');
    ok((await adm.post('/api/admin/cliente-excluir', { id: admRow.id, confirmacao: ADMIN.email })).status === 404, 'Não exclui administradores');

    // auditoria
    const aud = await adm.req('GET', '/api/admin/auditoria');
    const acoes = aud.dados?.registros.map((r) => r.acao) || [];
    for (const a of ['admin_autenticador_configurado', 'admin_entrar', 'cliente_criar', 'cliente_editar', 'cliente_inativar', 'cliente_ativar',
      'cliente_marcar_atraso', 'cliente_aviso_atraso', 'cliente_marcar_em_dia', 'clientes_exportar', 'cliente_excluir']) {
      ok(acoes.includes(a), `Auditoria registra "${a}"`);
    }
    ok(!/novaSenha456|temporaria123|argon2/.test(aud.texto), 'Auditoria não guarda senhas');
    const [ipAud] = await linhas(`SELECT ip_hmac FROM ${BANCO}.auditoria LIMIT 1`);
    ok(/^[0-9a-f]{64}$/.test(ipAud?.ip_hmac || ''), 'Auditoria guarda o IP só como HMAC');
  });

  // ===========================================================================
  grupo('11. Catálogo e estoque públicos');
  // ===========================================================================
  await passo('catálogo vazio', async () => {
    const anon = new Navegador();
    const c = await anon.req('GET', '/api/catalogo');
    ok(c.status === 200 && Array.isArray(c.dados?.produtos) && c.dados.produtos.length === 0, 'Banco sem produtos: catálogo vazio (o site usa os arquivos)');
    const e = await anon.req('GET', '/api/estoque');
    ok(e.status === 200 && e.dados?.estoque && Object.keys(e.dados.estoque).length === 0, 'Estoque vazio enquanto o banco não tem produtos');
    ok((await anon.req('POST', '/api/catalogo', { json: {} })).status === 405, 'Catálogo só aceita GET');
  });

  // ===========================================================================
  grupo('12. Pedidos de orçamento (cliente)');
  // ===========================================================================
  let clientePedidos; // PF
  let navPedidos;
  let navEmpresa;
  let codigoPF;
  await passo('pedidos do cliente', async () => {
    await zerarTentativas();
    const anon = await novo();
    for (const [m, rota] of [['GET', '/api/conta'], ['GET', '/api/orcamentos'], ['POST', '/api/orcamento-criar'], ['POST', '/api/orcamento-cancelar'], ['POST', '/api/conta-excluir']]) {
      const r = await anon.req(m, rota, m === 'POST' ? { json: {} } : {});
      ok(r.status === 401 && r.dados?.codigo === 'login', `Sem login: ${m} ${rota} → 401`, `HTTP ${r.status}`);
    }
    clientePedidos = cadastroPF({ nome: 'Carla', sobrenome: 'Pedidos', telefone: '(12) 98888-7777' });
    navPedidos = await novo();
    ok((await navPedidos.post('/api/cadastrar', clientePedidos)).status === 201, 'Cliente PF cadastrado');
    const conta = await navPedidos.req('GET', '/api/conta');
    ok(conta.status === 200 && conta.dados?.cliente?.sobrenome === 'Pedidos' && conta.dados.cliente.endereco?.cidade === 'São José dos Campos'
      && !('senha_hash' in conta.dados.cliente) && !('id' in conta.dados.cliente.endereco), 'GET conta: dados do cadastro, sem senha nem ids internos');

    const vazio = await navPedidos.post('/api/orcamento-criar', { itens: [] });
    ok(vazio.status === 422, 'Carrinho vazio → 422');
    const qtd = await navPedidos.post('/api/orcamento-criar', { itens: [{ slug: '15-mp5001', modalidade: 'compra', quantidade: 0 }] });
    ok(qtd.status === 422, 'Quantidade 0 → 422');
    const qtd2 = await navPedidos.post('/api/orcamento-criar', { itens: [{ slug: '15-mp5001', modalidade: 'compra', quantidade: '2' }] });
    ok(qtd2.status === 422, 'Quantidade em texto → 422');
    const inexistente = await navPedidos.post('/api/orcamento-criar', { itens: [{ slug: 'nao-existe', modalidade: 'compra', quantidade: 1 }] });
    ok(inexistente.status === 422 && inexistente.dados?.itens?.[0]?.slug === 'nao-existe', 'Produto que não existe → 422 apontando o item');
    const locacaoPF = await navPedidos.post('/api/orcamento-criar', { itens: [{ slug: '15-mp5001', modalidade: 'locacao', quantidade: 1 }] });
    ok(locacaoPF.status === 422 && /CNPJ/.test(locacaoPF.dados?.erro), 'Pessoa física não pede locação → 422');
    const demais = await navPedidos.post('/api/orcamento-criar', { itens: Array.from({ length: 31 }, () => ({ slug: '15-mp5001', modalidade: 'compra', quantidade: 1 })) });
    ok(demais.status === 422, 'Mais de 30 itens → 422');
    const obsRuim = await navPedidos.post('/api/orcamento-criar', { itens: [{ slug: '15-mp5001', modalidade: 'compra', quantidade: 1 }], observacoes: 'x'.repeat(1001) });
    ok(obsRuim.status === 422 && obsRuim.dados?.campos?.observacoes, 'Observações com mais de 1.000 caracteres → 422');

    const certo = await navPedidos.post('/api/orcamento-criar', {
      itens: [{ slug: '15-mp5001', modalidade: 'compra', quantidade: 2 }, { slug: '4-toner', modalidade: 'compra', quantidade: 3 },
        { slug: '15-mp5001', modalidade: 'compra', quantidade: 1 }],
      observacoes: 'Entregar pela manhã.\nLigar antes.',
    });
    codigoPF = certo.dados?.codigo;
    ok(certo.status === 201 && /^NF-[0-9A-HJ-NP-Z]{8}$/.test(codigoPF || ''), 'Pedido criado → 201 com código NF-XXXXXXXX', `HTTP ${certo.status} ${certo.texto.slice(0, 120)}`);
    const [o] = await linhas(`SELECT id, usuario_id, endereco_id, status, observacoes_cliente FROM ${BANCO}.orcamentos WHERE codigo = ?`, [codigoPF]);
    const itens = await linhas(`SELECT produto_slug, produto_nome, modalidade, quantidade FROM ${BANCO}.orcamento_itens WHERE orcamento_id = ? ORDER BY id`, [o?.id]);
    ok(o?.status === 'novo' && o.endereco_id && o.observacoes_cliente === 'Entregar pela manhã.\nLigar antes.', 'Pedido gravado com endereço principal e observações (com quebra de linha)');
    ok(itens.length === 2 && itens[0].quantidade === 3 && itens[0].produto_nome === 'Ricoh MP 5001', 'Itens repetidos somados; nome do produto vem do catálogo', JSON.stringify(itens));
    const [notif] = await linhas(`SELECT tipo, orcamento_id, resumo FROM ${BANCO}.notificacoes WHERE orcamento_id = ?`, [o?.id]);
    ok(notif?.tipo === 'novo_orcamento' && notif.resumo.includes(codigoPF) && notif.resumo.includes('Carla Pedidos'), 'Notificação de pedido no painel, ligada ao pedido');
    const aviso = emails().find((e) => e.includes(`Pedido de orçamento ${codigoPF}`));
    ok(aviso && aviso.includes('To: equipe@nf.test') && aviso.includes('3x Ricoh MP 5001 (compra)') && aviso.includes(`/admin#orcamento/${o?.id}`),
      'E-mail para a equipe com os itens e o link do painel');

    const lista = await navPedidos.req('GET', '/api/orcamentos');
    const meu = lista.dados?.orcamentos?.[0];
    ok(lista.status === 200 && lista.dados.orcamentos.length === 1 && meu.codigo === codigoPF && meu.status === 'novo' && meu.itens.length === 2,
      'GET orcamentos: o cliente vê o pedido, a situação e os itens');
    ok(!('id' in meu) && !('observacoesInternas' in meu) && !lista.texto.includes('observacoes_internas'), 'O cliente não vê ids nem anotações internas');

    // Empresa: locação liberada
    navEmpresa = await novo();
    const cadPJ = await navEmpresa.post('/api/cadastrar', cadastroPJ(cnpj(), { nome: 'Eduardo', sobrenome: 'Empresa' }));
    ok(cadPJ.status === 201, 'Cliente PJ cadastrado', `HTTP ${cadPJ.status} ${cadPJ.texto.slice(0, 100)}`);
    const loc = await navEmpresa.post('/api/orcamento-criar', { itens: [{ slug: '15-mp5001', modalidade: 'locacao', quantidade: 1 }] });
    ok(loc.status === 201, 'Empresa pede locação → 201');
    const tonerLoc = await navEmpresa.post('/api/orcamento-criar', { itens: [{ slug: '4-toner', modalidade: 'locacao', quantidade: 1 }] });
    ok(tonerLoc.status === 422, 'Suprimento não é alugado (nem para empresa) → 422');

    // Um cliente não vê nem cancela o pedido do outro
    const outros = await navEmpresa.req('GET', '/api/orcamentos');
    ok(outros.dados?.orcamentos?.every((x) => x.codigo !== codigoPF), 'Um cliente não vê os pedidos de outro');
    const cancelarAlheio = await navEmpresa.post('/api/orcamento-cancelar', { codigo: codigoPF });
    ok(cancelarAlheio.status === 404, 'Um cliente não cancela o pedido de outro (404)');
    ok((await navPedidos.post('/api/orcamento-cancelar', { codigo: "NF-' OR 1=1" })).status === 404, 'Código em formato inválido → 404');

    // Limite: 10 pedidos por hora
    const [u] = await linhas(`SELECT id FROM ${BANCO}.usuarios WHERE email = ?`, [clientePedidos.email]);
    clientePedidos.id = u.id;
    for (let i = 0; i < 9; i++) {
      await admin.query(`INSERT INTO ${BANCO}.orcamentos (codigo, usuario_id) VALUES (?, ?)`, [`NF-${String(i).padStart(2, '0')}AAAAAA`.slice(0, 11), u.id]);
    }
    const limite = await navPedidos.post('/api/orcamento-criar', { itens: [{ slug: '15-mp5001', modalidade: 'compra', quantidade: 1 }] });
    ok(limite.status === 429, '11º pedido na mesma hora → 429', `HTTP ${limite.status}`);
    await admin.query(`DELETE FROM ${BANCO}.orcamentos WHERE usuario_id = ? AND codigo LIKE 'NF-0%AAAAAA'`, [u.id]);
  });

  // ===========================================================================
  grupo('13. Painel: pedidos de orçamento');
  // ===========================================================================
  let idPedidoPF;
  await passo('pedidos no painel', async () => {
    const anon = await novo();
    ok((await anon.req('GET', '/api/admin/orcamentos')).status === 401, 'Sem login no painel: lista de pedidos → 401');
    ok((await navPedidos.req('GET', '/api/admin/orcamentos')).status === 401, 'Cliente logado no site não acessa o painel');
    const lista = await adm.req('GET', '/api/admin/orcamentos');
    const pf = lista.dados?.orcamentos?.find((x) => x.codigo === codigoPF);
    idPedidoPF = pf?.id;
    ok(lista.status === 200 && lista.dados.total >= 2 && pf?.cliente === 'Carla Pedidos' && pf.itens === 6, 'Lista de pedidos com cliente e quantidade de itens');
    const busca = await adm.req('GET', `/api/admin/orcamentos?busca=${encodeURIComponent(codigoPF)}`);
    ok(busca.dados?.total === 1, 'Busca pelo código do pedido');
    const filtro = await adm.req('GET', '/api/admin/orcamentos?status=aprovado');
    ok(filtro.dados?.total === 0, 'Filtro por situação');
    const ficha = await adm.req('GET', `/api/admin/orcamento?id=${idPedidoPF}`);
    ok(ficha.status === 200 && ficha.dados.orcamento.cliente?.telefone === '12988887777' && ficha.dados.orcamento.endereco?.cidade === 'São José dos Campos'
      && ficha.dados.orcamento.itens.length === 2 && ficha.dados.orcamento.observacoesCliente.includes('Ligar antes'), 'Pedido completo: cliente, contato, endereço, itens e observações');
    ok((await adm.req('GET', '/api/admin/orcamento?id=999999')).status === 404, 'Pedido inexistente → 404');
    ok((await adm.req('GET', '/api/admin/orcamento?id=abc')).status === 422, 'Id inválido → 422');
    const ruim = await adm.post('/api/admin/orcamento-status', { id: idPedidoPF, status: 'pago' });
    ok(ruim.status === 422, 'Situação fora da lista → 422');
    const st = await adm.post('/api/admin/orcamento-status', { id: idPedidoPF, status: 'em_atendimento' });
    const [o] = await linhas(`SELECT status, atendido_por FROM ${BANCO}.orcamentos WHERE id = ?`, [idPedidoPF]);
    ok(st.status === 200 && o.status === 'em_atendimento' && o.atendido_por, 'Mudar situação: grava e define o responsável');
    const notas = await adm.post('/api/admin/orcamento-notas', { id: idPedidoPF, observacoes: 'Cliente quer parcelar.\nRetornar sexta.' });
    ok(notas.status === 200, 'Anotações internas gravadas');
    const visto = await navPedidos.req('GET', '/api/orcamentos');
    ok(visto.dados.orcamentos[0].status === 'em_atendimento' && !visto.texto.includes('parcelar'), 'O cliente vê a nova situação, mas não as anotações internas');
    const cancelar = await navPedidos.post('/api/orcamento-cancelar', { codigo: codigoPF });
    ok(cancelar.status === 409, 'Pedido já em atendimento: o cliente não cancela pelo site (409)');
    const hist = (await adm.req('GET', `/api/admin/orcamento?id=${idPedidoPF}`)).dados?.orcamento?.historico || [];
    ok(hist.some((h) => h.acao === 'orcamento_status' && h.detalhes?.para === 'em_atendimento') && hist.some((h) => h.acao === 'orcamento_notas'),
      'Histórico do pedido registra situação e anotações');
    const ficha2 = await adm.req('GET', `/api/admin/cliente?id=${clientePedidos.id}`);
    ok(ficha2.dados?.cliente?.orcamentos?.[0]?.codigo === codigoPF, 'Ficha do cliente lista os pedidos dele');
    const resumo = await adm.req('GET', '/api/admin/resumo');
    ok(resumo.dados?.orcamentosNovos >= 1 && resumo.dados?.orcamentosEmAtendimento >= 1, 'Resumo conta pedidos novos e em atendimento');
    const notifs = await adm.req('GET', '/api/admin/notificacoes');
    ok(notifs.dados?.notificacoes?.some((n) => n.tipo === 'novo_orcamento' && n.orcamentoId === idPedidoPF), 'Notificações trazem o pedido de cada aviso');

    // O cliente cancela um pedido ainda novo
    const novoPedido = await navPedidos.post('/api/orcamento-criar', { itens: [{ slug: '4-toner', modalidade: 'compra', quantidade: 1 }] });
    const cancelou = await navPedidos.post('/api/orcamento-cancelar', { codigo: novoPedido.dados?.codigo });
    const [c] = await linhas(`SELECT id, status FROM ${BANCO}.orcamentos WHERE codigo = ?`, [novoPedido.dados?.codigo]);
    ok(cancelou.status === 200 && c?.status === 'cancelado', 'O cliente cancela um pedido ainda não atendido');
    const histC = (await adm.req('GET', `/api/admin/orcamento?id=${c?.id}`)).dados?.orcamento?.historico || [];
    ok(histC[0]?.acao === 'orcamento_cancelado_cliente' && histC[0]?.admin === 'Cliente (pelo site)', 'Cancelamento pelo cliente aparece no histórico');
  });

  // ===========================================================================
  grupo('14. Painel: produtos, estoque e fotos');
  // ===========================================================================
  let idProdutoNovo;
  await passo('produtos', async () => {
    ok((await (await novo()).req('GET', '/api/admin/produtos')).status === 401, 'Sem login no painel: produtos → 401');
    const imp = await adm.post('/api/admin/produtos-importar', {});
    ok(imp.status === 201 && imp.dados?.quantidade === 15, 'Importa os 15 produtos dos arquivos do site', `HTTP ${imp.status} ${imp.texto.slice(0, 150)}`);
    ok((await adm.post('/api/admin/produtos-importar', {})).status === 409, 'A importação só roda uma vez (banco já tem produtos)');
    const [t] = await linhas(`SELECT COUNT(*) AS n, SUM(estoque = 1) AS um, SUM(destaque) AS destaques FROM ${BANCO}.produtos`);
    ok(Number(t.n) === 15 && Number(t.um) === 15 && Number(t.destaques) === 4, 'Importados com 1 unidade em estoque e os 4 destaques da página inicial');
    const [toner] = await linhas(`SELECT modelo, impressao, disponivel_locacao FROM ${BANCO}.produtos WHERE slug = '4-toner'`);
    ok(toner?.modelo === '' && toner.impressao === null && toner.disponivel_locacao === 0, 'Toner: sem modelo, sem tipo de impressão e sem locação');

    const cat = await new Navegador().req('GET', '/api/catalogo');
    const mp5001 = cat.dados?.produtos?.find((p) => p.slug === '15-mp5001');
    ok(cat.status === 200 && cat.dados.produtos.length === 15 && mp5001?.fotos?.length >= 1 && mp5001.impressao === 'monocromatica', 'Catálogo público vem do banco, com fotos');
    ok(!cat.texto.includes('preco') && !cat.texto.includes('estoque_minimo'), 'Catálogo público sem preço de referência nem dados internos');
    const { textoParaBlocos } = await import('../lib/catalogo.mjs');
    const original = JSON.parse(readFileSync(path.join(import.meta.dirname, '..', 'dados', 'produtos.json'), 'utf8')).find((p) => p.slug === '18-mpc3502');
    const doBanco = cat.dados.produtos.find((p) => p.slug === '18-mpc3502');
    ok(JSON.stringify(textoParaBlocos(doBanco?.descricao)) === JSON.stringify(original.descricao), 'Descrição volta do banco igual à original (títulos, tabelas e listas)');

    // criar
    const base = { slug: 'ricoh-im-c3000', marca: 'Ricoh', modelo: 'IM C3000', nome: 'Ricoh IM C3000', categoria: 'multifuncionais',
      impressao: 'colorida', condicao: 'seminovo', resumo: 'Multifuncional colorida A3', descricao: '## Destaques\n- Rápida\n- Econômica\n\n| Velocidade | 30 ppm',
      disponivelVenda: true, disponivelLocacao: true, estoque: 3, estoqueMinimo: 2, precoReferencia: 1500000, status: 'ativo', destaque: false, ordem: 5 };
    const invalido = await adm.post('/api/admin/produto-criar', { ...base, slug: 'Ricoh IM!', categoria: 'outra', estoque: -1 });
    ok(invalido.status === 422 && invalido.dados?.campos?.slug && invalido.dados.campos.categoria && invalido.dados.campos.estoque, 'Produto inválido → 422 com os campos');
    const supLoc = await adm.post('/api/admin/produto-criar', { ...base, categoria: 'suprimentos', impressao: null });
    ok(supLoc.status === 422 && supLoc.dados?.campos?.disponivelLocacao, 'Suprimento para locação → 422');
    const xss = await adm.post('/api/admin/produto-criar', { ...base, slug: 'x', nome: 'Ricoh\u0000' });
    ok(xss.status === 422, 'Nome com caractere de controle → 422');
    const criar = await adm.post('/api/admin/produto-criar', base);
    idProdutoNovo = criar.dados?.id;
    ok(criar.status === 201 && idProdutoNovo, 'Produto criado → 201');
    ok((await adm.post('/api/admin/produto-criar', base)).status === 409, 'Endereço (slug) repetido → 409');
    const ficha = await adm.req('GET', `/api/admin/produto?id=${idProdutoNovo}`);
    ok(ficha.status === 200 && ficha.dados.produto.precoReferencia === 1500000 && ficha.dados.produto.titulo === 'Ricoh IM C3000', 'Ficha do produto (o painel vê o preço de referência)');

    // editar
    const editar = await adm.post('/api/admin/produto-editar', { ...base, id: idProdutoNovo, resumo: 'Multifuncional colorida A3, revisada' });
    ok(editar.status === 200 && editar.dados.alterados.join() === 'resumo', 'Editar grava e devolve só os campos alterados');

    // estoque
    const notifsAntes = Number((await linhas(`SELECT COUNT(*) AS n FROM ${BANCO}.notificacoes WHERE produto_id = ?`, [idProdutoNovo]))[0].n);
    await adm.post('/api/admin/produto-estoque', { id: idProdutoNovo, estoque: 2 });
    const [baixo] = await linhas(`SELECT tipo FROM ${BANCO}.notificacoes WHERE produto_id = ? ORDER BY id DESC LIMIT 1`, [idProdutoNovo]);
    ok(baixo?.tipo === 'estoque_baixo' && Number((await linhas(`SELECT COUNT(*) AS n FROM ${BANCO}.notificacoes WHERE produto_id = ?`, [idProdutoNovo]))[0].n) === notifsAntes + 1,
      'Estoque chegou ao mínimo → aviso de estoque baixo');
    await adm.post('/api/admin/produto-estoque', { id: idProdutoNovo, estoque: 1 });
    ok(Number((await linhas(`SELECT COUNT(*) AS n FROM ${BANCO}.notificacoes WHERE produto_id = ?`, [idProdutoNovo]))[0].n) === notifsAntes + 1,
      'Continua baixo: não repete o aviso');
    const zerar = await adm.post('/api/admin/produto-estoque', { id: idProdutoNovo, estoque: 0 });
    const [zerado] = await linhas(`SELECT tipo FROM ${BANCO}.notificacoes WHERE produto_id = ? ORDER BY id DESC LIMIT 1`, [idProdutoNovo]);
    ok(zerar.status === 200 && zerado?.tipo === 'estoque_zerado', 'Estoque zerado → aviso no painel');
    ok((await adm.post('/api/admin/produto-estoque', { id: idProdutoNovo, estoque: -3 })).status === 422, 'Estoque negativo → 422');
    const est = await new Navegador().req('GET', '/api/estoque');
    ok(est.dados?.estoque?.['ricoh-im-c3000'] === 0 && est.dados.estoque['15-mp5001'] === 1, 'GET estoque (público) mostra o zerado na hora');
    const pedidoZerado = await navPedidos.post('/api/orcamento-criar', { itens: [{ slug: 'ricoh-im-c3000', modalidade: 'compra', quantidade: 1 }] });
    ok(pedidoZerado.status === 422 && /indisponível/.test(pedidoZerado.dados?.erro), 'Pedido com produto de estoque zerado → 422 (indisponível)');
    const resumo = await adm.req('GET', '/api/admin/resumo');
    ok(resumo.dados?.semEstoque >= 1 && resumo.dados?.produtos === 16, 'Resumo conta produtos e os sem estoque');
    const filtro = await adm.req('GET', '/api/admin/produtos?estoque=zerado');
    ok(filtro.dados?.total === 1 && filtro.dados.produtos[0].slug === 'ricoh-im-c3000', 'Filtro de produtos sem estoque');

    // ocultar
    await adm.post('/api/admin/produto-editar', { ...base, id: idProdutoNovo, estoque: 4, status: 'oculto' });
    const cat2 = await new Navegador().req('GET', '/api/catalogo');
    const est2 = await new Navegador().req('GET', '/api/estoque');
    ok(!cat2.dados.produtos.some((p) => p.slug === 'ricoh-im-c3000') && est2.dados.estoque['ricoh-im-c3000'] === 0,
      'Produto oculto: sai do catálogo e aparece como indisponível até a próxima publicação');
    await adm.post('/api/admin/produto-editar', { ...base, id: idProdutoNovo, estoque: 4 });

    // fotos
    const enviar = (campos) => {
      const fd = new FormData();
      for (const [k, v] of Object.entries(campos)) if (v.blob) fd.append(k, v.blob, v.nome); else fd.append(k, v);
      return adm.req('POST', '/api/admin/produto-foto', { corpo: fd });
    };
    const jpg = await sharp({ create: { width: 1800, height: 1200, channels: 3, background: '#0aa0dc' } }).jpeg().toBuffer();
    const foto = await enviar({ produtoId: String(idProdutoNovo), alt: 'Frente da Ricoh', foto: { blob: new Blob([jpg], { type: 'image/jpeg' }), nome: 'frente.jpg' } });
    ok(foto.status === 201 && /^\/uploads\/produtos\/ricoh-im-c3000\/[a-f0-9]{16}\.webp$/.test(foto.dados?.url || ''), 'Foto enviada → regravada como WebP com nome gerado', `HTTP ${foto.status} ${foto.texto.slice(0, 160)}`);
    const arquivo = path.join(pastaSite, ...String(foto.dados?.url).split('/'));
    const reduzidas = [64, 128, 256, 384, 640, 828, 1080, 1600].map((l) => path.join(pastaSite, 'otim', ...String(foto.dados?.url).replace('.webp', `-${l}.webp`).split('/')));
    ok(existsSync(arquivo) && reduzidas.every(existsSync), 'Original e as 8 versões reduzidas gravadas (as larguras do site)');
    // lida da memória: no Windows, o sharp abrindo o arquivo o deixaria travado e a API não conseguiria apagá-lo
    const meta = existsSync(arquivo) ? await sharp(readFileSync(arquivo)).metadata() : {};
    ok(meta.format === 'webp' && meta.width === 1600, 'Original reduzido para 1600 px de largura');
    ok(existsSync(path.join(pastaSite, 'uploads', '.htaccess')) && /Require all denied/.test(readFileSync(path.join(pastaSite, 'uploads', '.htaccess'), 'utf8')),
      'Pasta de fotos protegida: só imagens com nome gerado são servidas, nada é executado');
    // WebP pequeno com transparência (o caso que falhou no servidor com imagescale)
    const webp = await sharp({ create: { width: 430, height: 502, channels: 4, background: { r: 0, g: 160, b: 220, alpha: 0.5 } } }).webp().toBuffer();
    const fotoWebp = await enviar({ produtoId: String(idProdutoNovo), foto: { blob: new Blob([webp], { type: 'image/webp' }), nome: 'MPC3004-1-430x502.webp' } });
    const menor = fotoWebp.dados?.url ? path.join(pastaSite, 'otim', ...fotoWebp.dados.url.replace('.webp', '-64.webp').split('/')) : '';
    const metaMenor = menor && existsSync(menor) ? await sharp(readFileSync(menor)).metadata() : {};
    ok(fotoWebp.status === 201 && metaMenor.width === 64 && metaMenor.hasAlpha, 'WebP 430×502 com transparência: versões reduzidas mantêm a transparência', `HTTP ${fotoWebp.status} ${fotoWebp.texto.slice(0, 120)}`);
    await adm.post('/api/admin/produto-foto-excluir', { id: fotoWebp.dados?.id });
    const php = await enviar({ produtoId: String(idProdutoNovo), foto: { blob: new Blob(['<?php system($_GET["c"]); ?>'], { type: 'image/jpeg' }), nome: 'foto.php.jpg' } });
    ok(php.status === 422, 'Arquivo PHP disfarçado de foto → 422');
    const svg = await enviar({ produtoId: String(idProdutoNovo), foto: { blob: new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], { type: 'image/svg+xml' }), nome: 'x.svg' } });
    ok(svg.status === 422, 'SVG (pode ter script) → 422');
    const poliglota = Buffer.concat([jpg, Buffer.from('<?php echo 1; ?>')]);
    const fotoPoli = await enviar({ produtoId: String(idProdutoNovo), foto: { blob: new Blob([poliglota], { type: 'image/jpeg' }), nome: 'p.jpg' } });
    const salvo = fotoPoli.dados?.url ? readFileSync(path.join(pastaSite, ...fotoPoli.dados.url.split('/'))) : Buffer.from('<?php');
    ok(fotoPoli.status === 201 && !salvo.includes('<?php'), 'JPG com código escondido no fim: a foto regravada não leva o código');
    const pequena = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#000' } }).png().toBuffer();
    ok((await enviar({ produtoId: String(idProdutoNovo), foto: { blob: new Blob([pequena], { type: 'image/png' }), nome: 'p.png' } })).status === 422, 'Foto pequena demais → 422');
    ok((await enviar({ produtoId: '999999', foto: { blob: new Blob([jpg], { type: 'image/jpeg' }), nome: 'a.jpg' } })).status === 404, 'Foto para produto inexistente → 404');
    const semCsrfFd = new FormData();
    semCsrfFd.append('produtoId', String(idProdutoNovo));
    ok((await adm.req('POST', '/api/admin/produto-foto', { corpo: semCsrfFd, comCsrf: false })).status === 403, 'Envio de foto exige o código CSRF');
    const json = await adm.post('/api/admin/produto-foto', { produtoId: idProdutoNovo });
    ok(json.status === 415, 'Envio de foto em JSON → 415');

    const fichaFotos = (await adm.req('GET', `/api/admin/produto?id=${idProdutoNovo}`)).dados?.produto?.fotos || [];
    ok(fichaFotos.length === 2 && fichaFotos[0].alt === 'Frente da Ricoh', 'Ficha lista as fotos na ordem');
    const ordemRuim = await adm.post('/api/admin/produto-fotos-ordem', { produtoId: idProdutoNovo, ids: [fichaFotos[0]?.id] });
    ok(ordemRuim.status === 422, 'Nova ordem precisa ter todas as fotos');
    const ordem = await adm.post('/api/admin/produto-fotos-ordem', { produtoId: idProdutoNovo, ids: fichaFotos.map((f) => f.id).reverse() });
    const depois = (await adm.req('GET', `/api/admin/produto?id=${idProdutoNovo}`)).dados?.produto?.fotos || [];
    ok(ordem.status === 200 && depois[0]?.id === fichaFotos[1]?.id, 'Muda a ordem das fotos (a primeira é a principal)');
    const apagar = await adm.post('/api/admin/produto-foto-excluir', { id: fichaFotos[1]?.id });
    ok(apagar.status === 200 && !existsSync(path.join(pastaSite, ...String(fotoPoli.dados?.url).split('/'))), 'Apagar foto remove os arquivos');

    // pedido com o produto e depois exclusão do produto
    const pedido = await navEmpresa.post('/api/orcamento-criar', { itens: [{ slug: 'ricoh-im-c3000', modalidade: 'locacao', quantidade: 2 }] });
    ok(pedido.status === 201, 'Pedido com produto cadastrado no painel');
    const [item] = await linhas(`SELECT i.produto_id FROM ${BANCO}.orcamento_itens i JOIN ${BANCO}.orcamentos o ON o.id = i.orcamento_id WHERE o.codigo = ?`, [pedido.dados?.codigo]);
    ok(item?.produto_id === idProdutoNovo, 'Item do pedido ligado ao produto do banco');
    ok((await adm.post('/api/admin/produto-excluir', { id: idProdutoNovo, confirmacao: 'outro' })).status === 422, 'Excluir produto exige digitar o endereço');
    const excluir = await adm.post('/api/admin/produto-excluir', { id: idProdutoNovo, confirmacao: 'ricoh-im-c3000' });
    const [restante] = await linhas(`SELECT produto_id, produto_nome FROM ${BANCO}.orcamento_itens i JOIN ${BANCO}.orcamentos o ON o.id = i.orcamento_id WHERE o.codigo = ?`, [pedido.dados?.codigo]);
    ok(excluir.status === 200 && !existsSync(arquivo) && restante?.produto_id === null && restante.produto_nome === 'Ricoh IM C3000',
      'Excluir produto apaga as fotos; pedidos antigos mantêm o nome');
    const aud = (await adm.req('GET', '/api/admin/auditoria')).dados?.registros?.map((r) => r.acao) || [];
    for (const a of ['produtos_importar', 'produto_criar', 'produto_editar', 'produto_estoque', 'produto_foto_enviar', 'produto_fotos_ordem', 'produto_foto_excluir', 'produto_excluir']) {
      ok(aud.includes(a), `Auditoria registra "${a}"`);
    }
  });

  // ===========================================================================
  grupo('15. Publicação do site pelo painel');
  // ===========================================================================
  await passo('publicação', async () => {
    const semGithub = new Navegador(`http://127.0.0.1:${PORTA_SEM_GITHUB}`);
    semGithub.cookies = new Map(adm.cookies);
    semGithub.csrf = adm.csrf;
    const nc = await semGithub.req('GET', '/api/admin/publicacao');
    ok(nc.status === 200 && nc.dados?.configurada === false, 'Sem o bloco "github": painel avisa que não está configurado');
    ok((await semGithub.post('/api/admin/publicar', {})).status === 503, 'Sem configuração: publicar → 503 com explicação');

    const p0 = await adm.req('GET', '/api/admin/publicacao');
    ok(p0.status === 200 && p0.dados?.configurada && p0.dados.pendente === true && p0.dados.ultima === null, 'Há alterações de produto não publicadas');
    ok((await (await novo()).post('/api/admin/publicar', {})).status === 401, 'Publicar exige o painel');
    github.pedidos.length = 0;
    const pub = await adm.post('/api/admin/publicar', {});
    const disparo = github.pedidos.find((x) => x.metodo === 'POST');
    ok(pub.status === 202 && disparo && JSON.parse(disparo.corpo).ref === 'teste' && disparo.auth === `Bearer ${TOKEN_GITHUB}`,
      'Publicar → pede ao GitHub a Publicação do ramo configurado, com o token');
    ok(!pub.texto.includes(TOKEN_GITHUB) && !(await adm.req('GET', '/api/admin/publicacao')).texto.includes(TOKEN_GITHUB), 'O token nunca vai para o navegador');
    ok((await adm.post('/api/admin/publicar', {})).status === 429, 'Dois pedidos seguidos → 429');
    await admin.query(`UPDATE ${BANCO}.auditoria SET criado_em = NOW() - INTERVAL 10 MINUTE WHERE alvo_tipo = 'produto' OR acao = 'produtos_importar'`);
    await admin.query(`UPDATE ${BANCO}.auditoria SET criado_em = NOW() - INTERVAL 5 MINUTE WHERE acao = 'site_publicar'`);
    github.runs = [{ status: 'in_progress', conclusion: null, run_started_at: '2026-10-18T12:00:00Z', html_url: 'https://github.com/dono/NF-Site/actions/runs/1' }];
    const p1 = await adm.req('GET', '/api/admin/publicacao');
    ok(p1.dados?.ultima?.situacao === 'publicando' && p1.dados.pendente === false, 'Mostra a publicação em andamento; nada pendente');
    ok((await adm.post('/api/admin/publicar', {})).status === 409, 'Publicação em andamento → 409');
    github.runs = [{ status: 'waiting', conclusion: null, html_url: 'javascript:alert(1)' }];
    const p2 = await adm.req('GET', '/api/admin/publicacao');
    ok(p2.dados?.ultima?.situacao === 'aguardando_aprovacao' && p2.dados.ultima.url === null, 'Aguardando aprovação; link que não é do GitHub é descartado');
    github.runs = [{ status: 'completed', conclusion: 'failure' }];
    ok((await adm.req('GET', '/api/admin/publicacao')).dados?.ultima?.situacao === 'falhou', 'Publicação com erro aparece como "falhou"');
    ok((await adm.req('GET', '/api/admin/auditoria')).dados?.registros?.some((r) => r.acao === 'site_publicar'), 'Auditoria registra "site_publicar"');
  });

  // ===========================================================================
  grupo('16. Contas desligadas (vitrine)');
  // ===========================================================================
  await passo('vitrine', async () => {
    const v = new Navegador(`http://127.0.0.1:${PORTA_SEM_CONTAS}`);
    for (const [m, rota] of [['GET', '/api/sessao'], ['POST', '/api/cadastrar'], ['POST', '/api/entrar'], ['GET', '/api/conta'], ['GET', '/api/orcamentos'],
      ['POST', '/api/orcamento-criar'], ['POST', '/api/conta-excluir']]) {
      const r = await v.req(m, rota, m === 'POST' ? { json: {} } : {});
      ok(r.status === 404, `Vitrine: ${m} ${rota} → 404`, `HTTP ${r.status}`);
    }
    ok((await v.req('GET', '/api/catalogo')).status === 200 && (await v.req('GET', '/api/estoque')).status === 200, 'Vitrine: catálogo e estoque funcionam');
    ok((await v.req('GET', '/api/admin/sessao')).status === 200, 'Vitrine: o painel funciona');
  });

  // ===========================================================================
  grupo('17. Excluir a própria conta (LGPD)');
  // ===========================================================================
  await passo('excluir conta', async () => {
    await zerarTentativas();
    const semConfirmar = await navPedidos.post('/api/conta-excluir', { senha: SENHA, confirmacao: 'excluir' });
    ok(semConfirmar.status === 422 && semConfirmar.dados?.campos?.confirmacao, 'Exige digitar EXCLUIR');
    const errada = await navPedidos.post('/api/conta-excluir', { senha: 'senhaErrada9', confirmacao: 'EXCLUIR' });
    ok(errada.status === 401 && errada.dados?.campos?.senha, 'Senha errada → 401');
    const [ainda] = await linhas(`SELECT id FROM ${BANCO}.usuarios WHERE id = ?`, [clientePedidos.id]);
    ok(ainda?.id === clientePedidos.id, 'Com a senha errada, nada é apagado');
    const semCsrf = await navPedidos.post('/api/conta-excluir', { senha: SENHA, confirmacao: 'EXCLUIR' }, { comCsrf: false });
    ok(semCsrf.status === 403, 'Excluir conta exige o código CSRF');

    const admNoSite = await novo();
    await admNoSite.post('/api/entrar', { email: ADMIN.email, senha: SENHA });
    ok((await admNoSite.post('/api/conta-excluir', { senha: SENHA, confirmacao: 'EXCLUIR' })).status === 403, 'Conta de administrador não é excluída pelo site');

    const r = await navPedidos.post('/api/conta-excluir', { senha: SENHA, confirmacao: 'EXCLUIR' });
    ok(r.status === 200 && r.dados?.cliente === null, 'Senha certa + EXCLUIR → conta excluída');
    const [u] = await linhas(`SELECT COUNT(*) AS n FROM ${BANCO}.usuarios WHERE id = ?`, [clientePedidos.id]);
    const [en] = await linhas(`SELECT COUNT(*) AS n FROM ${BANCO}.enderecos WHERE usuario_id = ?`, [clientePedidos.id]);
    ok(Number(u.n) === 0 && Number(en.n) === 0, 'Cadastro e endereços apagados');
    const [o] = await linhas(`SELECT usuario_id, endereco_id FROM ${BANCO}.orcamentos WHERE codigo = ?`, [codigoPF]);
    ok(o && o.usuario_id === null && o.endereco_id === null, 'Pedidos ficam no histórico da empresa, sem ligação com a pessoa');
    const [n] = await linhas(`SELECT tipo, usuario_id, resumo, lida_em FROM ${BANCO}.notificacoes WHERE tipo = 'conta_excluida' ORDER BY id DESC LIMIT 1`);
    ok(n && n.usuario_id === null && n.resumo.includes('Carla Pedidos') && n.resumo.includes(clientePedidos.email) && n.resumo.includes('(12) 98888-7777') && n.lida_em === null,
      'Aviso no painel com o nome e o contato do cliente', n?.resumo);
    const sessao = await navPedidos.req('GET', '/api/conta');
    ok(sessao.status === 401, 'A sessão termina junto com a conta');
    ok((await (await novo()).post('/api/entrar', { email: clientePedidos.email, senha: SENHA })).status === 401, 'Não dá mais para entrar com a conta excluída');
    const aud = (await adm.req('GET', '/api/admin/auditoria')).dados?.registros || [];
    ok(aud.some((a) => a.acao === 'cliente_autoexcluir' && a.alvoId === clientePedidos.id), 'Auditoria registra a exclusão feita pelo próprio cliente');
    const ficha = await adm.req('GET', `/api/admin/orcamento?id=${idPedidoPF}`);
    ok(ficha.status === 200 && ficha.dados.orcamento.cliente === null && ficha.dados.orcamento.itens.length === 2, 'Painel mostra o pedido sem o cliente (conta excluída)');

    // O aviso com dados pessoais sai do painel depois de 90 dias
    await admin.query(`UPDATE ${BANCO}.notificacoes SET criado_em = NOW() - INTERVAL 91 DAY WHERE tipo = 'conta_excluida'`);
    await adm.req('GET', '/api/admin/notificacoes');
    const [restam] = await linhas(`SELECT COUNT(*) AS n FROM ${BANCO}.notificacoes WHERE tipo = 'conta_excluida'`);
    ok(Number(restam.n) === 0, 'Aviso de conta excluída apagado depois de 90 dias');
  });

  // ===========================================================================
  grupo('7. Falhas do servidor não vazam informação');
  // ===========================================================================
  await passo('falhas', async () => {
    const semBanco = await new Navegador(`http://127.0.0.1:${PORTA_SEM_BANCO}`).sessao();
    const n = await new Navegador(`http://127.0.0.1:${PORTA_SEM_BANCO}`).req('POST', '/api/entrar', { json: { email: 'a@b.com', senha: 'x' } });
    ok(n.status === 403 || n.status === 503, 'Banco fora do ar → API recusa sem travar', `HTTP ${n.status}`);
    const nav = new Navegador(`http://127.0.0.1:${PORTA_SEM_BANCO}`);
    await nav.sessao();
    const login = await nav.post('/api/entrar', { email: 'a@b.com', senha: 'abc12345' });
    ok(login.status === 503, 'Banco fora do ar → 503 com mensagem genérica', `HTTP ${login.status}`);
    const vazou = (t) => /SQLSTATE|PDO|Access denied|mysql|\.php|stack|trace|C:\\|\/home\//i.test(t);
    ok(!vazou(login.texto) && !vazou(semBanco.texto), 'Sem detalhes técnicos (SQL, caminhos, senhas) na resposta');
    const logSemBanco = path.join(pastaSemBanco, 'api-desenvolvimento.log');
    ok(existsSync(logSemBanco) && /\[api-nf\] banco indisponível/.test(readFileSync(logSemBanco, 'utf8')),
      'O detalhe fica só no log, gravado na pasta da configuração (fora do site)');
    const semConfig = await new Navegador(`http://127.0.0.1:${PORTA_SEM_CONFIG}`).sessao();
    ok(semConfig.status === 503 && !vazou(semConfig.texto), 'Sem arquivo de configuração → 503 genérico (a API não funciona "aberta")');
  });

  await passo('log limpo', async () => {
    const logPrincipal = path.join(pastaPrincipal, 'api-desenvolvimento.log');
    const textoLog = phpPrincipal.log + (existsSync(logPrincipal) ? readFileSync(logPrincipal, 'utf8') : '');
    const problemas = textoLog.split('\n').filter((l) => /PHP (Warning|Notice|Deprecated|Fatal|Parse)|\[api-nf\]/.test(l));
    ok(problemas.length === 0, 'Nenhum aviso ou erro de PHP durante os testes', problemas.slice(0, 3).join(' | '));
  });
} finally {
  for (const p of [phpPrincipal, phpSeguro, phpSemBanco, phpSemConfig, phpSemContas, phpSemGithub]) p.kill();
  servidorCnpj.close();
  servidorGithub.close();
  await apagarBanco(admin, BANCO, USUARIO);
  await admin.end();
  apagarPasta(pasta);
}

const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length} testes: ${resultados.length - falhas.length} passaram, ${falhas.length} falharam.`);
if (falhas.length) {
  for (const f of falhas) console.log(`  ❌ [${f.grupo}] ${f.nome}  (${f.detalhe})`);
  process.exitCode = 1;
}
