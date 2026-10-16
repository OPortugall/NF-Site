# Site da NF Soluções Digitais

Código único do site, usado nos dois ambientes (produção e teste). O que muda de um
ambiente para o outro são só as **variáveis de ambiente** da compilação, nunca o código.

O site é **estático**: a hospedagem atual (cPanel, sem Node.js) recebe arquivos HTML, CSS e JS
prontos, gerados no computador. Quem aplica HTTPS, cabeçalhos de segurança, redirecionamentos e a
senha do teste no servidor é o **`.htaccess`** que a compilação escreve.

## Ambientes

| Ambiente | Endereço | Ramo do GitHub | Login/cadastro/carrinho |
|---|---|---|---|
| **Produção** | nfsolucoesdigitais.com.br | `main` | desligados (vitrine) |
| **Teste** (homologação) | teste.nfsolucoesdigitais.com.br | `teste` | ligados (demonstração, só no navegador) |
| **Desenvolvimento** | http://localhost:3000 | qualquer | ligados |

Caminho de toda mudança: **desenvolvimento → ramo `teste` → aprovação → ramo `main`**.
Nada vai direto para a produção.

No ambiente de **teste**:
- o navegador pede **usuário e senha** (Apache, cadastrados no cPanel) para abrir qualquer arquivo;
- aparece uma **faixa amarela** "Ambiente de TESTE" no topo;
- o Google é avisado para **não indexar** nada (também em desenvolvimento).

### Variáveis de ambiente

Modelos (sem valores reais): `.env.producao.example`, `.env.teste.example`, `.env.desenvolvimento.example`.

> Variável que começa com `NEXT_PUBLIC_` vai para o navegador: **nunca** coloque segredo nela.
> A compilação e o CI barram nomes de segredo com esse prefixo.

| Variável | Pública? | Para quê |
|---|---|---|
| `NEXT_PUBLIC_AMBIENTE` | sim | `producao`, `teste` ou `desenvolvimento` |
| `NEXT_PUBLIC_CONTAS_ATIVAS` | sim | `true` liga login, cadastro e carrinho; `false` = só vitrine |
| `HTPASSWD_TESTE` | não | caminho do arquivo de senhas do teste no servidor (tem padrão) |
| `TESTE_USUARIO`, `TESTE_SENHA` | **não** | senha da prévia local do teste (`npm run ver:teste`) |
| `DATABASE_URL`, `*_SEGREDO`, `SMTP_*` | **não** | para o futuro, quando houver servidor |

## Rodar no computador

```
cd site
npm install
npm run dev                  # http://localhost:3000 (gera as fotos reduzidas antes)
```

Para ver **exatamente** o que vai para o servidor:

```
npm run compilar:producao    # gera publicar/producao/
npm run ver:producao         # prévia em http://localhost:3231

npm run compilar:teste       # gera publicar/teste/
TESTE_SENHA=... npm run ver:teste   # prévia em http://localhost:3221 (pede usuário e senha)
```

A prévia imita as regras do `.htaccess` (endereços sem `.html`, redirecionamentos, 404, cabeçalhos, senha).

## Publicar no cPanel

A pasta `publicar/<ambiente>/` é o site inteiro. Envie **todo** o conteúdo dela, **inclusive o
`.htaccess`** (arquivo que começa com ponto).

### Produção (nfsolucoesdigitais.com.br)

1. `npm run compilar:producao`.
2. Compacte o **conteúdo** de `publicar/producao/` num `.zip` (selecione tudo dentro da pasta).
3. cPanel → **Gerenciador de arquivos** → crie a pasta `/nfsolucoesdigitais.com.br-site`
   (pasta nova: o site antigo continua intacto na pasta de antes) → **Carregar** o zip → **Extrair** → apague o zip.
4. cPanel → **Domínios** → `nfsolucoesdigitais.com.br` → **Gerenciar** → troque a **raiz do documento**
   para `/nfsolucoesdigitais.com.br-site`.
5. Para voltar ao site antigo, basta trocar a raiz do documento de volta.

Nas próximas atualizações: repita 1 a 3 numa pasta nova (ex.: `-site-2`) e troque a raiz, ou
substitua o conteúdo da pasta atual.

### Teste (teste.nfsolucoesdigitais.com.br)

1. cPanel → **Domínios** → **Criar um novo domínio** → `teste.nfsolucoesdigitais.com.br`,
   raiz `/teste.nfsolucoesdigitais.com.br`.
2. cPanel → **Privacidade do diretório** → pasta `teste.nfsolucoesdigitais.com.br` → ative a proteção
   e crie o usuário e a senha da equipe. O cPanel guarda as senhas em
   `/home/raioxper/.htpasswds/teste.nfsolucoesdigitais.com.br/passwd` (padrão da compilação; se for outro
   caminho, compile com `HTPASSWD_TESTE=<caminho>`).
3. `npm run compilar:teste` e envie o conteúdo de `publicar/teste/` para essa pasta, como na produção.
   O `.htaccess` gerado já contém as linhas da senha.
4. cPanel → **Status SSL/TLS** → rode o AutoSSL para o subdomínio ganhar HTTPS.

## Páginas

- `/`: banner com as quatro categorias, equipamentos em estoque, serviços, marcas, empresa e contato
- `/loja`: catálogo com filtros (aceita `?tipo=impressoras-e-copiadoras`, `impressoras-3d`, `acabamento`, `suprimentos`)
- `/loja/inicio/<produto>.html`: página de cada produto (mesmo endereço da loja antiga)
- `/entrar`: login e cadastro (só existe com `NEXT_PUBLIC_CONTAS_ATIVAS=true`; aceita `?aba=criar`)
- `/privacidade` e `/termos`: Política de Privacidade e Termos de Uso (LGPD)
- `/sitemap.xml` e `/robots.txt`: gerados na compilação (o teste bloqueia o Google)

## Dados

- `dados/empresa.js`: telefones, WhatsApp, endereço, marcas, serviços e textos institucionais.
- `dados/produtos-novos.json`: produtos cadastrados à mão.
- `dados/produtos.json` e as fotos em `public/produtos/`: gerados por
  `python scripts/gerar_dados_produtos.py` a partir de `reconstrucao/loja/`.

## Segurança

- Cabeçalhos de segurança (CSP, HSTS, X-Frame-Options...) e redirecionamentos em `lib/seguranca.mjs`,
  aplicados pelo `next.config.mjs` (no `npm run dev`) e pelo `.htaccess` gerado (no servidor).
- Fotos: `public/` guarda os originais; `npm run imagens` gera as versões WebP reduzidas em
  `public/otim/` (pasta ignorada pelo Git), usadas pelo `lib/carregador-imagens.mjs`.
- Limite de tentativas de login pronto em `lib/limite-login.js` (para quando houver servidor).
- Banco de dados e testes em `../banco-de-dados/`.
