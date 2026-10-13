// Gerado por scripts/gerar_loja.py — rota /loja/precos-em-queda.
import paginas from '../../../_loja/paginas/registro-prices-drop';
import PaginaLoja, { metadadosDaPagina } from '../../../_loja/PaginaLoja';

const pagina = paginas["prices-drop"];

export const metadata = metadadosDaPagina(pagina);

export default function Pagina() {
  return <PaginaLoja pagina={pagina} />;
}
