# Site novo da NF Soluções Digitais (teste de redesenho)

Teste do visual novo, com site e loja numa identidade única. Fica separado de `site/`
(a cópia fiel do site antigo), que continua intacto.

## Como rodar

```
cd site-novo
npm install
npm run dev
```

Abra http://localhost:3000.

## Páginas deste teste

- `/`: página inicial (abertura, equipamentos em estoque, serviços, marcas, empresa, contato)
- `/loja`: catálogo com filtros por tipo e por impressão (colorida ou preto e branco)
- `/loja/inicio/<produto>.html`: página de cada produto, no mesmo endereço da loja antiga

## Sistema visual

- **Cores do logo:** preto, petróleo `#003a48` e ciano `#11a0af`. As quatro tintas de impressão
  (ciano, magenta, amarelo e preto) aparecem só na faixa do topo e no indicador de impressão dos produtos.
- **Fonte:** Archivo (uma família só). Semicondensada nos títulos e nomes de modelo, normal no texto.
- **Tudo em** `app/globals.css`, com as cores, a escala de texto e os espaçamentos em variáveis no início do arquivo.

## Dados

- `dados/empresa.js`: telefones, WhatsApp, endereço, marcas, serviços e textos institucionais.
- `dados/produtos.json` e as fotos em `public/produtos/`: gerados por
  `python scripts/gerar_dados_site_novo.py` a partir de `reconstrucao/loja/`.

## Ainda não existe neste teste

Categorias, páginas institucionais (Quem somos, Termos...), busca, carrinho e login.
Por enquanto, o pedido é feito pelo WhatsApp, com a mensagem já preenchida com o produto.
