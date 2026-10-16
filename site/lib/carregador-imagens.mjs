// Carregador de imagens do site estático (sem o otimizador do Next.js no servidor).
// Para cada foto em public/, scripts/otimizar-imagens.mjs gera versões WebP em public/otim/
// nas larguras abaixo; aqui o next/image pede a menor que cubra o tamanho necessário.
// Ex.: /produtos/15-mp5001/foto-57.jpg com 640px → /otim/produtos/15-mp5001/foto-57-640.webp

export const LARGURAS = [64, 128, 256, 384, 640, 828, 1080, 1600]; // = imageSizes + deviceSizes do next.config

export default function carregadorDeImagens({ src, width }) {
  if (!src.startsWith('/') || src.endsWith('.svg')) return src;
  const largura = LARGURAS.find((l) => l >= width) ?? LARGURAS[LARGURAS.length - 1];
  return `/otim${src.replace(/\.[a-z0-9]+$/i, '')}-${largura}.webp`;
}
