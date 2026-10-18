// Monta o catálogo de produtos usado na compilação do site.
//
//   dados/catalogo.json          → lido por lib/produtos.js (páginas da loja, carrinho, sitemap)
//   api/_dados/catalogo.json     → { slug: { nome, tipo, venda, locacao } }: a API confere produtos
//                                  de interesse e itens de orçamento enquanto o banco não tem produtos
//   api/_dados/produtos-iniciais.json → os produtos dos arquivos do site, no formato do banco,
//                                  para o botão "Importar produtos do site" do painel
//
// De onde vêm os produtos:
//   CATALOGO_URL definida (publicação pelo GitHub) → GET <CATALOGO_URL> (a API do site no ar, /api/catalogo).
//     Para o ambiente de teste, que pede senha, use https://usuario:senha@teste.../api/catalogo.
//     Banco ainda sem produtos (lista vazia) → arquivos do site. Qualquer outra falha → para a compilação
//     (publicar o catálogo antigo por engano apagaria do site o que foi cadastrado no painel).
//   sem CATALOGO_URL (computador) → arquivos dados/produtos.json e dados/produtos-novos.json.
//
// Uso: node scripts/catalogo.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { arquivoParaSite, bancoParaSite, siteParaBanco } from '../lib/catalogo.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..');
const ARQUIVO_SITE = path.join(RAIZ, 'dados', 'catalogo.json');

// Mesmas regras de lib/produtos.js (tituloProduto / formatarModelo)
const formatarModelo = (m) => m.replace(/^(MP|SP)(C?)(\d)/, (_, linha, c, d) => `${linha} ${c}${d}`);
const titulo = (p) => (p.modelo ? `${p.marca} ${formatarModelo(p.modelo)}` : p.nome);

const lerArquivos = () => {
  const ler = (f) => JSON.parse(readFileSync(path.join(RAIZ, 'dados', f), 'utf8'));
  return [...ler('produtos-novos.json'), ...ler('produtos.json')];
};

async function baixar(endereco) {
  const url = new URL(endereco);
  const cabecalhos = { Accept: 'application/json' };
  if (url.username) {
    const credenciais = `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`;
    cabecalhos.Authorization = `Basic ${Buffer.from(credenciais).toString('base64')}`;
    url.username = url.password = '';
  }
  const r = await fetch(url, { headers: cabecalhos, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${url.origin}${url.pathname} respondeu HTTP ${r.status}`);
  const corpo = await r.json();
  if (!Array.isArray(corpo?.produtos)) throw new Error('resposta sem a lista de produtos');
  return corpo.produtos;
}

export async function montarCatalogoSite() {
  let produtos;
  let origem;
  if (process.env.CATALOGO_URL) {
    const doBanco = await baixar(process.env.CATALOGO_URL);
    if (doBanco.length) {
      produtos = doBanco.map(bancoParaSite);
      origem = 'banco (painel)';
    }
  }
  if (!produtos) {
    produtos = lerArquivos().map(arquivoParaSite);
    origem = process.env.CATALOGO_URL ? 'arquivos do site (o banco ainda não tem produtos)' : 'arquivos do site';
  }
  writeFileSync(ARQUIVO_SITE, `${JSON.stringify(produtos, null, 1)}\n`);
  return { origem, quantidade: produtos.length };
}

export function gerarCatalogoApi(pastaApi = path.join(RAIZ, 'api')) {
  const produtos = existsSync(ARQUIVO_SITE) ? JSON.parse(readFileSync(ARQUIVO_SITE, 'utf8')) : lerArquivos().map(arquivoParaSite);
  const catalogo = Object.fromEntries(
    produtos.map((p) => [p.slug, { nome: titulo(p), tipo: p.tipo, venda: p.venda, locacao: p.locacao }]),
  );
  mkdirSync(path.join(pastaApi, '_dados'), { recursive: true });
  writeFileSync(path.join(pastaApi, '_dados', 'catalogo.json'), JSON.stringify(catalogo, null, 2));
  const iniciais = lerArquivos().map((p, i) => siteParaBanco(p, (i + 1) * 10));
  writeFileSync(path.join(pastaApi, '_dados', 'produtos-iniciais.json'), JSON.stringify(iniciais, null, 1));
  return Object.keys(catalogo).length;
}

if (process.argv[1]?.endsWith('catalogo.mjs')) {
  try {
    const { origem, quantidade } = await montarCatalogoSite();
    console.log(`Catálogo: ${quantidade} produtos (${origem}).`);
  } catch (e) {
    console.error(`✖ Não foi possível baixar o catálogo de CATALOGO_URL: ${e.message}`);
    process.exit(1);
  }
}
