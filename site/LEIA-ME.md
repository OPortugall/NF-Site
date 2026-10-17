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
2. Use o pacote `publicar/site-producao.zip`, gerado pela compilação. **Não compacte no Windows**: o zip
   do Windows não guarda permissões e o cPanel extrai tudo como 666/777 (qualquer conta do servidor
   poderia alterar o site). O da compilação sai com 644 (arquivos) e 755 (pastas).
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
3. `npm run compilar:teste` e envie `publicar/site-teste.zip` para essa pasta (extrair), como na produção.
   O `.htaccess` gerado já contém as linhas da senha.
4. cPanel → **Status SSL/TLS** → rode o AutoSSL para o subdomínio ganhar HTTPS.

## Publicação automática (GitHub → cPanel)

O workflow `.github/workflows/publicar.yml` compila e envia o site por SSH (rsync) a cada push:

| Ramo | Vai para | Aprovação |
|---|---|---|
| `teste` | `~/teste.nfsolucoesdigitais.com.br` | automática |
| `main` | `~/nfsolucoesdigitais.com.br-site` (produção) | precisa aprovar em Actions (ambiente `producao`) |

Só publica se a Verificação passar. O rsync apaga no servidor o que saiu do site (restos de versões
antigas), mas nunca `.well-known`, `cgi-bin`, `php.ini`, `.user.ini` e `error_log`; permissões sempre 755/644.
A configuração da API (`~/config-nf/`) fica fora das pastas publicadas e nunca é tocada.

Segredos do repositório (Settings → Secrets and variables → Actions): `SSH_HOST` (`cpl84.hosting24.com`),
`SSH_PORT` (`65002`), `SSH_USER` (`raioxper`), `SSH_KEY` (chave privada criada só para publicar) e
`SSH_KNOWN_HOSTS` (impressão digital do servidor, de `ssh-keyscan -p 65002 cpl84.hosting24.com`).
Ambientes (Settings → Environments): `teste` e `producao`, este com você como revisor obrigatório.

## API (PHP) — contas

As contas (cadastro, login, sessão) ficam numa API em PHP na pasta `api/`, que vai junto com o
site **só quando as contas estão ligadas** (hoje: só no ambiente de teste). O resto do site continua estático.

| Rota | Método | O que faz |
|---|---|---|
| `/api/sessao` | GET | cliente logado (ou `null`) e o código CSRF |
| `/api/cadastrar` | POST | cria a conta (confere CPF/CNPJ, e o CNPJ na Receita) e já entra |
| `/api/entrar` | POST | e-mail e senha |
| `/api/sair` | POST | encerra a sessão |

Proteções: tudo passa por `api/index.php` (o resto de `api/` nunca é executado direto); só JSON; código
CSRF em todo POST; só aceita pedidos do próprio site (Origin/Sec-Fetch-Site); sessão em cookie HttpOnly,
SameSite=Lax e `__Host-` com HTTPS, guardada numa pasta privada; senhas em argon2id; limite de tentativas
(5 por e-mail e 20 por IP em 15 min; 5 cadastros por IP por hora); consultas preparadas (PDO); erros sem
detalhes técnicos para o visitante. Os segredos ficam num arquivo **fora do site** (modelo: `api/config.exemplo.php`).

### Testar no computador

Precisa do MariaDB e do PHP 8.3 locais (pasta de ferramentas) e das credenciais do banco **local**:

```
DB_PORT=3311 DB_ADMIN_USER=root DB_ADMIN_PASSWORD=... npm run testar:api     # 142 testes da API
DB_PORT=3311 DB_ADMIN_USER=root DB_ADMIN_PASSWORD=... npm run api:local      # API em :8081 (banco nf_local)
API_LOCAL=http://127.0.0.1:8081 npm run dev                                   # site + API
```

### Publicar a API no ambiente de teste

1. Crie `/home/raioxper/config-nf/` (fora de qualquer site) com permissão **700**.
2. Dentro dela, crie `teste.php` a partir de `api/config.exemplo.php`, com o banco `raioxper_nfteste`,
   o usuário `raioxper_nftst` e a senha dele, um `segredo` novo, `pasta_sessoes` =
   `/home/raioxper/config-nf/sessoes-teste` e `origens` = `['https://teste.nfsolucoesdigitais.com.br']`.
   Permissão do arquivo: **600**.
3. phpMyAdmin → banco `raioxper_nfteste` → **Importar** → `banco-de-dados/schema.sql`.
4. `npm run compilar:teste` e envie `publicar/site-teste.zip` (já contém `api/` e `api/_ambiente.php`).

Para a produção, o mesmo com `producao.php`, banco `raioxper_nf`, usuário `raioxper_nfapp` e
`NEXT_PUBLIC_CONTAS_ATIVAS=true` na compilação — só depois de aprovado no teste.

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
