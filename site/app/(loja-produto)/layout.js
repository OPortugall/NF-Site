// Gerado por scripts/gerar_loja.py — layout das páginas do tipo "product" (mesmo <body> do PrestaShop).
import HtmlLoja from '../_loja/HtmlLoja';

export default function Layout({ children }) {
  return <HtmlLoja idBody="product" classeBody="product hide-left-column lang_br">{children}</HtmlLoja>;
}
