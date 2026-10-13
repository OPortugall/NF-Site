// Gerado por scripts/gerar_loja.py — rota /loja/lojas.
import paginas from '../../../_loja/paginas/registro-stores';
import PaginaLoja, { metadadosDaPagina } from '../../../_loja/PaginaLoja';

const pagina = paginas["stores"];

export const metadata = metadadosDaPagina(pagina);

export default function Pagina() {
  return <PaginaLoja pagina={pagina} />;
}
