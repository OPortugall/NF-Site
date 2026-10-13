// Gerado por scripts/gerar_loja.py — rota /loja/inicio/[produto].
import paginas from '../../../../_loja/paginas/registro-product';
import PaginaLoja, { metadadosDaPagina } from '../../../../_loja/PaginaLoja';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(paginas).map((produto) => ({ produto }));
}

export async function generateMetadata({ params }) {
  const { produto } = await params;
  return metadadosDaPagina(paginas[decodeURIComponent(produto)]);
}

export default async function Pagina({ params }) {
  const { produto } = await params;
  return <PaginaLoja pagina={paginas[decodeURIComponent(produto)]} />;
}
