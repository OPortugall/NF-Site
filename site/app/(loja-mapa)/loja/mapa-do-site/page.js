// Gerado por scripts/gerar_loja.py — rota /loja/mapa-do-site.
import paginas from '../../../_loja/paginas/registro-sitemap';
import PaginaLoja, { metadadosDaPagina } from '../../../_loja/PaginaLoja';

const pagina = paginas["sitemap"];

export const metadata = metadadosDaPagina(pagina);

export default function Pagina() {
  return <PaginaLoja pagina={pagina} />;
}
