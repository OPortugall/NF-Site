'use client';

import { useEffect, useState } from 'react';
import { lerEstoque } from '@/lib/api';
import { produtoIndisponivel } from '@/lib/produtos';

/*
 * Estoque ao vivo: o painel muda o estoque e o site mostra na hora, sem publicar de novo.
 * Uma consulta a /api/estoque por página (renovada depois de 1 minuto); sem resposta da API,
 * vale o estoque gravado na compilação do site.
 */

const VALIDADE = 60_000;
let consulta = null; // { quando, promessa }

function buscar() {
  if (!consulta || Date.now() - consulta.quando > VALIDADE) {
    consulta = { quando: Date.now(), promessa: lerEstoque().catch(() => null) };
  }
  return consulta.promessa;
}

// { slug: quantidade } ou null enquanto carrega / sem API
export function useMapaEstoque() {
  const [mapa, setMapa] = useState(null);
  useEffect(() => {
    let ativo = true;
    buscar().then((m) => { if (ativo) setMapa(m); });
    return () => { ativo = false; };
  }, []);
  return mapa;
}

export function estoqueAtual(mapa, produto) {
  return mapa && produto.slug in mapa ? mapa[produto.slug] : produto.estoque;
}

export function useIndisponivel(produto) {
  return produtoIndisponivel(produto, estoqueAtual(useMapaEstoque(), produto));
}

// Tarja cinza por cima da foto quando o estoque zera
export function SeloIndisponivel({ slug, estoque }) {
  const indisponivel = useIndisponivel({ slug, estoque });
  if (!indisponivel) return null;
  return (
    <span className="selo-indisponivel">
      <span className="selo-indisponivel__texto">Indisponível</span>
    </span>
  );
}

// Na página do produto: explica que está indisponível (o pedido pelo WhatsApp continua aberto)
export function AvisoIndisponivel({ slug, estoque }) {
  const indisponivel = useIndisponivel({ slug, estoque });
  if (!indisponivel) return null;
  return (
    <p className="produto__indisponivel" role="status">
      Indisponível no momento. Fale com a gente para saber quando chega ou conhecer um modelo parecido.
    </p>
  );
}
