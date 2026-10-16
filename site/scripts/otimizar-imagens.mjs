// Gera as versões reduzidas (WebP) das fotos de public/ em public/otim/, nas larguras de
// lib/carregador-imagens.mjs. Só refaz as que mudaram. Roda sozinho antes de "dev" e "compilar".
// Uso: node scripts/otimizar-imagens.mjs

import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { LARGURAS } from '../lib/carregador-imagens.mjs';

const PUBLICO = path.resolve(import.meta.dirname, '..', 'public');
const DESTINO = path.join(PUBLICO, 'otim');
const EXTENSOES = /\.(jpe?g|png|webp)$/i;

async function* arquivos(pasta) {
  for (const item of await readdir(pasta, { withFileTypes: true })) {
    const caminho = path.join(pasta, item.name);
    if (item.isDirectory()) {
      if (caminho !== DESTINO) yield* arquivos(caminho);
    } else if (EXTENSOES.test(item.name)) {
      yield caminho;
    }
  }
}

const dataDe = (f) => stat(f).then((s) => s.mtimeMs, () => 0);

let gerados = 0;
let atuais = 0;
for await (const original of arquivos(PUBLICO)) {
  const relativo = path.relative(PUBLICO, original).replace(EXTENSOES, '');
  const dataOriginal = await dataDe(original);
  for (const largura of LARGURAS) {
    const saida = path.join(DESTINO, `${relativo}-${largura}.webp`);
    if ((await dataDe(saida)) >= dataOriginal) { atuais++; continue; }
    await mkdir(path.dirname(saida), { recursive: true });
    // withoutEnlargement: foto menor que a largura pedida fica no tamanho original (o arquivo existe mesmo assim)
    await sharp(original).resize({ width: largura, withoutEnlargement: true }).webp({ quality: 80 }).toFile(saida);
    gerados++;
  }
}
console.log(`Imagens: ${gerados} geradas, ${atuais} já atualizadas (public/otim/).`);
