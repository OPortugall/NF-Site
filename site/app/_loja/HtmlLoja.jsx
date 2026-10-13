// Estrutura <html>/<body> da loja. O id e a classe do <body> são os mesmos do PrestaShop,
// porque o CSS do tema pts_vela usa seletores como "body#product" e ".hide-left-column".
export default function HtmlLoja({ idBody, classeBody, children }) {
  return (
    <html lang="pt-BR">
      <head />
      <body id={idBody} className={classeBody}>
        {children}
      </body>
    </html>
  );
}
