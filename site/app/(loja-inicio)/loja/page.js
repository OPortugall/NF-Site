// Gerado por scripts/gerar_loja.py — rota /loja.
import paginas from '../../_loja/paginas/registro-index';
import PaginaLoja, { metadadosDaPagina } from '../../_loja/PaginaLoja';

const pagina = paginas["index"];

export const metadata = metadadosDaPagina(pagina);

export default function Pagina() {
  return <PaginaLoja pagina={pagina} />;
}
