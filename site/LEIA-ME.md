# Site da NF Soluções Digitais

Código único do site, usado nos dois ambientes (produção e teste). O que muda de um
ambiente para o outro são só as **variáveis de ambiente**, nunca o código.

## Ambientes

| Ambiente | Endereço | Ramo do GitHub | Login/cadastro/carrinho | Banco |
|---|---|---|---|---|
| **Produção** | nfsolucoesdigitais.com.br | `main` | desligados por enquanto (vitrine) | de produção |
| **Teste** (homologação) | ex.: teste.nfsolucoesdigitais.com.br | `teste` | ligados | de teste, só dados fictícios |
| **Desenvolvimento** | http://localhost:3000 | qualquer | ligados | local |

Caminho de toda mudança: **desenvolvimento → ramo `teste` → aprovação → ramo `main`**.
Nada vai direto para a produção.

No ambiente de **teste**:
- o navegador pede **usuário e senha** (`TESTE_USUARIO`/`TESTE_SENHA`) para abrir o site;
- aparece uma **faixa amarela** "Ambiente de TESTE" no topo;
- o Google é avisado para **não indexar** nada (também em desenvolvimento).

### Variáveis de ambiente

Os modelos (sem valores reais) estão em:

- `.env.producao.example`
- `.env.teste.example`
- `.env.desenvolvimento.example`

Os valores de verdade ficam **nas variáveis de cada app no hPanel da Hostinger**, nunca no
GitHub. Cada ambiente tem os **seus** segredos e o **seu** banco.

> Variável que começa com `NEXT_PUBLIC_` vai para o navegador: **nunca** coloque segredo nela.
> A compilação e o CI barram nomes de segredo com esse prefixo.

| Variável | Pública? | Para quê |
|---|---|---|
| `NEXT_PUBLIC_AMBIENTE` | sim | `producao`, `teste` ou `desenvolvimento` |
| `NEXT_PUBLIC_CONTAS_ATIVAS` | sim | `true` liga login, cadastro e carrinho; `false` = só vitrine |
| `TESTE_USUARIO`, `TESTE_SENHA` | **não** | senha de acesso ao ambiente de teste |
| `DATABASE_URL` | **não** | conexão com o banco (quando o login for ligado) |
| `LIMITE_LOGIN_SEGREDO`, `SESSAO_SEGREDO` | **não** | chaves do limite de login e da sessão |
| `SMTP_*`, `EMAIL_ADMINISTRADOR` | **não** | envio de e-mails |

Sem nenhuma configuração, o site sobe no modo mais seguro: **vitrine, sem contas**.

## Rodar no computador

```
cd site
npm install
cp .env.desenvolvimento.example .env.local   # e ajuste se precisar
npm run dev
```

Para testar exatamente como cada ambiente, compile com as variáveis dele, por exemplo:

```
NEXT_PUBLIC_AMBIENTE=producao NEXT_PUBLIC_CONTAS_ATIVAS=false npm run build && npm start
```

## Publicar na Hostinger

Dois apps Node.js no hPanel, um por ambiente, cada um ligado ao seu ramo do GitHub:

| | Produção | Teste |
|---|---|---|
| Domínio | nfsolucoesdigitais.com.br | teste.nfsolucoesdigitais.com.br |
| Ramo | `main` | `teste` |
| Pasta | `site` | `site` |
| Build / início | `npm run build` / `npm start` | `npm run build` / `npm start` |
| Variáveis | as de `.env.producao.example` | as de `.env.teste.example` |

## Páginas

- `/`: banner com as quatro categorias, equipamentos em estoque, serviços, marcas, empresa e contato
- `/loja`: catálogo com filtros (aceita `?tipo=impressoras-e-copiadoras`, `impressoras-3d`, `acabamento`, `suprimentos`)
- `/loja/inicio/<produto>.html`: página de cada produto (mesmo endereço da loja antiga)
- `/entrar`: login e cadastro (só existe com `NEXT_PUBLIC_CONTAS_ATIVAS=true`)

## Dados

- `dados/empresa.js`: telefones, WhatsApp, endereço, marcas, serviços e textos institucionais.
- `dados/produtos-novos.json`: produtos cadastrados à mão.
- `dados/produtos.json` e as fotos em `public/produtos/`: gerados por
  `python scripts/gerar_dados_produtos.py` a partir de `reconstrucao/loja/`.

## Segurança

- Cabeçalhos de segurança (CSP, HSTS, X-Frame-Options...) em `next.config.mjs`.
- Limite de tentativas de login pronto em `lib/limite-login.js` (para usar na rota do servidor).
- Banco de dados e testes em `../banco-de-dados/`.
