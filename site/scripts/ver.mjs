// Prévia local do site compilado (publicar/<ambiente>), imitando as regras do .htaccess do servidor:
// cabeçalhos de segurança, redirecionamentos, endereços sem ".html", página 404 e, no teste, a senha.
//
// Uso:  npm run ver:producao              → http://localhost:3231
//       npm run ver:teste                 → http://localhost:3221 (usuário e senha: TESTE_USUARIO / TESTE_SENHA)
//       PORTA=4000 node scripts/ver.mjs producao
//
// /api/...: repassado ao PHP local (npm run api:local), endereço em API_LOCAL (padrão http://127.0.0.1:8081).

import { timingSafeEqual } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { REDIRECIONAMENTOS, cabecalhosDeSeguranca } from '../lib/seguranca.mjs';

const ambiente = process.argv[2];
if (!['producao', 'teste'].includes(ambiente)) {
  console.error('Uso: node scripts/ver.mjs producao|teste');
  process.exit(1);
}
const PASTA = path.resolve(import.meta.dirname, '..', 'publicar', ambiente);
const PORTA = Number(process.env.PORTA) || (ambiente === 'producao' ? 3231 : 3221);
const API_LOCAL = process.env.API_LOCAL || 'http://127.0.0.1:8081';
const USUARIO = process.env.TESTE_USUARIO || 'equipe-nf';
const SENHA = process.env.TESTE_SENHA;
if (ambiente === 'teste' && !SENHA) {
  console.error('Defina TESTE_SENHA para a prévia do teste (a senha que o navegador vai pedir).');
  process.exit(1);
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
const CABECALHOS = Object.fromEntries(cabecalhosDeSeguranca(ambiente).map(({ key, value }) => [key, value]));

const ehArquivo = (f) => stat(f).then((s) => s.isFile(), () => false);
const ehPasta = (f) => stat(f).then((s) => s.isDirectory(), () => false);
const iguais = (a, b) => Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));

function autorizado(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  const [u, ...s] = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':');
  return iguais(u, USUARIO) && iguais(s.join(':'), SENHA);
}

async function responder(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let caminho = decodeURIComponent(url.pathname);
  const enviar = (status, extra = {}, corpo = '') => {
    res.writeHead(status, { ...CABECALHOS, ...extra });
    res.end(req.method === 'HEAD' ? undefined : corpo);
  };

  if (ambiente === 'teste' && !autorizado(req)) {
    return enviar(401, { 'WWW-Authenticate': 'Basic realm="NF Solucoes - ambiente de teste"' }, 'Acesso restrito');
  }
  // Como no servidor: só há API se a compilação a incluiu (contas ligadas)
  if ((caminho === '/api' || caminho.startsWith('/api/')) && (await ehArquivo(path.join(PASTA, 'api', 'index.php')))) {
    return repassarParaApi(req, res, url);
  }
  // redirecionamentos (mesma ordem do .htaccess)
  const antigo = REDIRECIONAMENTOS.find(({ de }) => caminho === de || caminho === `${de}/`);
  if (antigo) return enviar(301, { Location: antigo.para });
  if (/^\/(nfs|nf|raiz)(\/.*)?$/.test(caminho)) return enviar(301, { Location: '/' });
  if (caminho.length > 1 && caminho.endsWith('/') && (await ehArquivo(path.join(PASTA, `${caminho.slice(0, -1)}.html`)))) {
    return enviar(301, { Location: caminho.slice(0, -1) + url.search });
  }

  if (caminho.split('/').includes('..')) return enviar(400);
  let arquivo = path.join(PASTA, caminho);
  if (caminho === '/') arquivo = path.join(PASTA, 'index.html');
  else if (!(await ehArquivo(arquivo)) && (await ehArquivo(`${arquivo}.html`))) arquivo = `${arquivo}.html`;

  if (!(await ehArquivo(arquivo)) || (await ehPasta(arquivo))) {
    return enviar(404, { 'Content-Type': TIPOS['.html'] }, await readFile(path.join(PASTA, '404.html')));
  }
  const extra = { 'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream' };
  if (caminho.startsWith('/_next/static/')) extra['Cache-Control'] = 'public, max-age=31536000, immutable';
  enviar(200, extra, await readFile(arquivo));
}

// Repassa o pedido ao PHP local, como o Apache faria executando api/index.php.
async function repassarParaApi(req, res, url) {
  const partes = [];
  for await (const p of req) partes.push(p);
  const cabecalhos = {};
  for (const nome of ['cookie', 'content-type', 'x-csrf-token', 'origin', 'sec-fetch-site', 'accept']) {
    if (req.headers[nome]) cabecalhos[nome] = req.headers[nome];
  }
  let r;
  try {
    r = await fetch(API_LOCAL + url.pathname + url.search, {
      method: req.method, headers: cabecalhos, body: partes.length ? Buffer.concat(partes) : undefined, redirect: 'manual',
    });
  } catch {
    res.writeHead(503, { ...CABECALHOS, 'Content-Type': TIPOS['.json'] });
    return res.end(JSON.stringify({ erro: 'API local desligada (rode npm run api:local).' }));
  }
  const saida = { ...CABECALHOS };
  r.headers.forEach((v, k) => { if (k !== 'set-cookie' && k !== 'content-length' && k !== 'transfer-encoding') saida[k] = v; });
  const cookies = r.headers.getSetCookie();
  if (cookies.length) saida['set-cookie'] = cookies;
  res.writeHead(r.status, saida);
  res.end(Buffer.from(await r.arrayBuffer()));
}

createServer((req, res) => responder(req, res).catch((e) => { res.writeHead(500); res.end(String(e)); })).listen(PORTA, () =>
  console.log(`Prévia de "${ambiente}" em http://localhost:${PORTA} (pasta publicar/${ambiente})`),
);
