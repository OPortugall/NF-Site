// Gerado por scripts/gerar_loja.py — rota /loja/[categoria].
import paginas from '../../../_loja/paginas/registro-category';
import PaginaLoja, { metadadosDaPagina } from '../../../_loja/PaginaLoja';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(paginas).map((categoria) => ({ categoria }));
}

export async function generateMetadata({ params }) {
  const { categoria } = await params;
  return metadadosDaPagina(paginas[decodeURIComponent(categoria)]);
}

export default async function Pagina({ params }) {
  const { categoria } = await params;
  return <PaginaLoja pagina={paginas[decodeURIComponent(categoria)]} />;
}
