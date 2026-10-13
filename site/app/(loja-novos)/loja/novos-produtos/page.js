// Gerado por scripts/gerar_loja.py — rota /loja/novos-produtos.
import paginas from '../../../_loja/paginas/registro-new-products';
import PaginaLoja, { metadadosDaPagina } from '../../../_loja/PaginaLoja';

const pagina = paginas["new-products"];

export const metadata = metadadosDaPagina(pagina);

export default function Pagina() {
  return <PaginaLoja pagina={pagina} />;
}
