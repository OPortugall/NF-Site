// Gerado por scripts/gerar_loja.py — rota /loja/content/[pagina].
import paginas from '../../../../_loja/paginas/registro-cms';
import PaginaLoja, { metadadosDaPagina } from '../../../../_loja/PaginaLoja';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(paginas).map((pagina) => ({ pagina }));
}

export async function generateMetadata({ params }) {
  const { pagina } = await params;
  return metadadosDaPagina(paginas[decodeURIComponent(pagina)]);
}

export default async function Pagina({ params }) {
  const { pagina } = await params;
  return <PaginaLoja pagina={paginas[decodeURIComponent(pagina)]} />;
}
