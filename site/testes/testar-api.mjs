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
import { existsSync, readdirSync, readFileSync } from 'node:fs';
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
for (const p of [pastaPrincipal, pastaSegura, pastaSemBanco]) (await import('node:fs')).mkdirSync(p);

const phpPrincipal = await iniciarPhp({ porta: PORTA, config: escreverConfig(pastaPrincipal, { ...base, origens: [BASE] }) });
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
    ok(Number(tabelas) === 9, 'As 9 tabelas continuam lá');
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
  for (const p of [phpPrincipal, phpSeguro, phpSemBanco, phpSemConfig]) p.kill();
  servidorCnpj.close();
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
