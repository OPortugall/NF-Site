// Gerado por scripts/gerar_loja.py — rota /loja/entrar-em-contato-conosco.
import paginas from '../../../_loja/paginas/registro-contact';
import PaginaLoja, { metadadosDaPagina } from '../../../_loja/PaginaLoja';

const pagina = paginas["contact"];

export const metadata = metadadosDaPagina(pagina);

export default function Pagina() {
  return <PaginaLoja pagina={pagina} />;
}
