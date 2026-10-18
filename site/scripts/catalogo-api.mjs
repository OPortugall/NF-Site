// Gera api/_dados/catalogo.json: { slug: nome } de todos os produtos do site.
// A API usa para conferir os "produtos de interesse" do cadastro e mostrar o nome deles no aviso
// ao administrador. (Os produtos ainda estão no código do site; na fase 2 passam para o banco.)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');

// Mesmas regras de lib/produtos.js (tituloProduto / formatarModelo)
const formatarModelo = (m) => m.replace(/^(MP|SP)(C?)(\d)/, (_, linha, c, d) => `${linha} ${c}${d}`);
const titulo = (p) => (p.modelo ? `${p.marca} ${formatarModelo(p.modelo)}` : p.nome);

export function gerarCatalogoApi(pastaApi = path.join(RAIZ, 'api')) {
  const ler = (f) => JSON.parse(readFileSync(path.join(RAIZ, 'dados', f), 'utf8'));
  const produtos = [...ler('produtos-novos.json'), ...ler('produtos.json')];
  const catalogo = Object.fromEntries(produtos.map((p) => [p.slug, titulo(p)]));
  mkdirSync(path.join(pastaApi, '_dados'), { recursive: true });
  writeFileSync(path.join(pastaApi, '_dados', 'catalogo.json'), JSON.stringify(catalogo, null, 2));
  return Object.keys(catalogo).length;
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('catalogo-api.mjs')) {
  console.log(`Catálogo da API: ${gerarCatalogoApi()} produtos.`);
}
