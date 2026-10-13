# Site NF Soluções Digitais — Next.js

O site novo, em JavaScript (Next.js), com o mesmo visual do site antigo em PHP (Joomla e PrestaShop).

## Como rodar no seu computador

É preciso ter o [Node.js](https://nodejs.org) (versão LTS) instalado.

```
cd site
npm install
npm run dev
```

Depois, abra http://localhost:3000 (site principal) e http://localhost:3000/loja (loja).

Para testar a versão de produção: `npm run build` e depois `npm start`.

## Estrutura

```
site/
├── app/
│   ├── (site)/                 ← site principal (página inicial em "/")
│   │   ├── page.js             ← monta a página com os componentes abaixo
│   │   └── componentes/        ← uma seção por arquivo: Abertura, Sobre, Servicos, Portfolio...
│   ├── (loja-*)/               ← um layout por tipo de página da loja (inicial, categoria, produto...)
│   ├── _loja/                  ← peças da loja: Cabecalho, Rodape, PaginaLoja e o miolo de cada página
│   ├── api/contato, api/newsletter ← recebem os formulários (por enquanto só respondem)
│   └── componentes/ScriptsLegados.jsx ← roda os scripts jQuery originais, na ordem original
└── public/
    ├── nfs/                    ← CSS, imagens, fontes e scripts originais do site principal
    └── loja/                   ← CSS, imagens, fontes e scripts originais da loja
```

Os arquivos em `public/nfs/` e `public/loja/` ficam nos mesmos caminhos de antes,
para o CSS original funcionar sem alterações.

## Como as páginas foram geradas

Os componentes foram convertidos automaticamente do HTML que o site antigo exibia
(páginas arquivadas no Wayback Machine, guardadas em `reconstrucao/`):

```
python scripts/gerar_site_principal.py   # site principal
python scripts/gerar_loja.py             # loja
```

Os dois scripts leem o backup `BkpNF-limpo.zip` (fora do repositório, por conter senhas)
e **sobrescrevem** os arquivos gerados. Depois que começarmos a editar os componentes
à mão, não rode os geradores de novo sem antes conferir o que mudaria.

## O que ainda não funciona (depende do servidor, próxima etapa)

- Carrinho, finalizar pedido, login, cadastro, lista de desejos, comentários.
- Formulários de contato e newsletter (respondem "temporariamente indisponível").
- Busca de produtos.

## Endereços

Os endereços antigos continuam valendo, por exemplo `/loja/inicio/15-mp5001.html` e
`/loja/24-toner`. Os poucos que mudaram redirecionam sozinhos (ver `next.config.mjs`):
`/nfs/` → `/`, `/loja/mapa do site` → `/loja/mapa-do-site`, `/loja/preços-em-queda` → `/loja/precos-em-queda`.
