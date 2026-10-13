// Gerado por scripts/gerar_loja.py — layout das páginas do tipo "stores" (mesmo <body> do PrestaShop).
import HtmlLoja from '../_loja/HtmlLoja';

export default function Layout({ children }) {
  return <HtmlLoja idBody="stores" classeBody="stores hide-left-column hide-right-column lang_br">{children}</HtmlLoja>;
}
