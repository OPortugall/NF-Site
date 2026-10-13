// Gerado por scripts/gerar_loja.py — layout das páginas do tipo "cms" (mesmo <body> do PrestaShop).
import HtmlLoja from '../_loja/HtmlLoja';

export default function Layout({ children }) {
  return <HtmlLoja idBody="cms" classeBody="cms hide-left-column hide-right-column lang_br">{children}</HtmlLoja>;
}
