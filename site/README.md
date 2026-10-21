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
antigas), mas nunca `.well-known`, `cgi-bin`, `php.ini`, `.user.ini`, `error_log` e as fotos enviadas pelo
painel (`uploads/` e `otim/uploads/`); permissões sempre 755/644.
A configuração da API (`~/config-nf/`) fica fora das pastas publicadas e nunca é tocada.

Segredos do repositório (Settings → Secrets and variables → Actions): `SSH_HOST` (`cpl84.hosting24.com`),
`SSH_PORT` (`65002`), `SSH_USER` (`raioxper`), `SSH_KEY` (chave privada criada só para publicar) e
`SSH_KNOWN_HOSTS` (impressão digital do servidor, de `ssh-keyscan -p 65002 cpl84.hosting24.com`).
Ambientes (Settings → Environments): `teste` e `producao`, este com você como revisor obrigatório.

Cada ambiente tem a **sua** chave (`SSH_KEY` como segredo do ambiente), presa no servidor à pasta dele pelo
`rrsync` oficial do rsync (`~/bin/rrsync`, versão 3.4.4) no `~/.ssh/authorized_keys`:

```
restrict,command="/bin/python3 /home/raioxper/bin/rrsync -wo /home/raioxper/teste.nfsolucoesdigitais.com.br" ssh-ed25519 AAAA… publicar-github-nf
restrict,command="/bin/python3 /home/raioxper/bin/rrsync -wo /home/raioxper/nfsolucoesdigitais.com.br-site" ssh-ed25519 AAAA… publicar-github-nf-producao
```

Assim as chaves só enviam arquivos (sem terminal, sem ler nada) e cada uma só para a sua pasta.

**Produtos do painel no site ("Publicar alterações"):** a compilação baixa o catálogo do banco se o ambiente
tiver o segredo `CATALOGO_URL` (produção: `https://nfsolucoesdigitais.com.br/api/catalogo`; teste:
`https://teste.nfsolucoesdigitais.com.br/api/catalogo`, mais os segredos `CATALOGO_USUARIO` e `CATALOGO_SENHA`
com o usuário e a senha do site de teste). Sem o segredo,
ou com o banco ainda sem produtos, usa `dados/produtos*.json`; se a API responder com erro, a publicação para
(para não publicar um catálogo velho). O botão do painel dispara este mesmo workflow (`workflow_dispatch`) com
um token do GitHub guardado na configuração do servidor (bloco `github` de `api/config.exemplo.php`: token
"fine-grained" só deste repositório, permissão **Actions: Read and write**). Na produção, a publicação ainda
espera a sua aprovação no GitHub. O **estoque** não precisa publicar: o site lê `/api/estoque` ao vivo.

## API (PHP)

A API em PHP (pasta `api/`) vai junto com o site nos dois ambientes. As rotas de cliente (cadastro, login,
conta e pedidos) só respondem com as contas ligadas (hoje: teste e produção; desligadas, respondem 404). O resto do
site continua estático.

| Rota | Método | O que faz |
|---|---|---|
| `/api/catalogo` | GET | produtos visíveis, com fotos (usado na compilação) |
| `/api/estoque` | GET | estoque de cada produto, ao vivo (0 = "Indisponível" no site) |
| `/api/sessao` | GET | cliente logado (ou `null`) e o código CSRF |
| `/api/cadastrar` | POST | cria a conta (confere CPF/CNPJ, e o CNPJ na Receita) e já entra |
| `/api/entrar` | POST | e-mail e senha |
| `/api/sair` | POST | encerra a sessão |
| `/api/conta` | GET | dados do cadastro ("Minha conta") |
| `/api/orcamentos` | GET | pedidos de orçamento do cliente e a situação de cada um |
| `/api/orcamento-criar` | POST | o carrinho vira um pedido (código `NF-XXXXXXXX`); avisa o painel e a NF por e-mail |
| `/api/orcamento-cancelar` | POST | o cliente cancela um pedido ainda não atendido |
| `/api/conta-excluir` | POST | senha + "EXCLUIR": apaga a conta e avisa o painel com nome e contato |
| `/api/admin/...` | GET/POST | painel (veja `api/_lib/rotas-admin.php` e `rotas-admin-loja.php`) |

Proteções: tudo passa por `api/index.php` (o resto de `api/` nunca é executado direto); só JSON; código
CSRF em todo POST; só aceita pedidos do próprio site (Origin/Sec-Fetch-Site); sessão em cookie HttpOnly,
SameSite=Lax e `__Host-` com HTTPS, guardada numa pasta privada; senhas em argon2id; limite de tentativas
(5 por e-mail e 20 por IP em 15 min; 5 cadastros por IP por hora); consultas preparadas (PDO); erros sem
detalhes técnicos para o visitante. Os segredos ficam num arquivo **fora do site** (modelo: `api/config.exemplo.php`).

### Testar no computador

Precisa do MariaDB e do PHP 8.3 locais (pasta de ferramentas) e das credenciais do banco **local**:

```
DB_PORT=3311 DB_ADMIN_USER=root DB_ADMIN_PASSWORD=... npm run testar:api     # 373 testes da API (site + painel)
DB_PORT=3311 DB_ADMIN_USER=root DB_ADMIN_PASSWORD=... npm run api:local      # API em :8081 (banco nf_local)
API_LOCAL=http://127.0.0.1:8081 npm run dev                                   # site + API
```

### Publicar a API no ambiente de teste

1. Crie `/home/raioxper/config-nf/` (fora de qualquer site) com permissão **700**.
2. Dentro dela, crie `teste.php` a partir de `api/config.exemplo.php`, com o banco `raioxper_nfteste`,
   o usuário `raioxper_nf_equipe` e a senha dele, um `segredo` novo, `pasta_sessoes` =
   `/home/raioxper/config-nf/sessoes-teste` e `origens` = `['https://teste.nfsolucoesdigitais.com.br']`.
   Permissão do arquivo: **600**.
3. phpMyAdmin → banco `raioxper_nfteste` → **Importar** → `banco-de-dados/schema.sql`.
4. `npm run compilar:teste` e envie `publicar/site-teste.zip` (já contém `api/` e `api/_ambiente.php`).

Para a produção, o mesmo com `producao.php`, banco `raioxper_nf` e usuário `raioxper_nfapp` (o painel e o
estoque funcionam com as contas desligadas). Contas de cliente na produção: `NEXT_PUBLIC_CONTAS_ATIVAS=true`
na compilação, só depois de aprovado no teste.

Bancos que já existiam recebem as mudanças pelas migrações de `banco-de-dados/migracoes/` (rodar cada uma uma
vez, em ordem, no phpMyAdmin → SQL).

As fotos enviadas pelo painel são regravadas pela extensão **GD** do PHP: deixe `gd` marcada no seletor de PHP do cPanel.

## Painel administrativo (`/admin`)

Existe nos dois ambientes. Login com e-mail e senha **e** código de 6 dígitos de app autenticador
(2FA obrigatório); sessão do painel expira com 30 min sem uso ou 8 h após o login.

| Tela | O que faz |
|---|---|
| Início | clientes, pedidos novos, em atraso, notificações, estoque e o aviso de alterações não publicadas |
| Clientes | busca e filtros, criar, editar, excluir (digitando o e-mail), ativar/inativar, "em atraso" com aviso por e-mail, exportar CSV |
| Pedidos | pedidos de orçamento do site: itens, cliente, situação (o cliente vê em "Minha conta") e anotações internas |
| Produtos | importar os produtos do site (uma vez), criar, editar, ocultar, excluir, fotos (JPG/PNG/WebP até 8 MB), estoque e estoque mínimo, "Publicar alterações" |
| Notificações | cliente novo, pedido de orçamento, conta excluída pelo cliente (apagado em 90 dias), estoque baixo e zerado |
| Histórico | auditoria de tudo o que foi feito no painel |

Estoque 0 = o produto aparece no site com uma tarja cinza "Indisponível" (na hora, sem publicar) e não pode ser
pedido. Produtos, fotos e textos mudam no site depois de "Publicar alterações".

**Criar o primeiro administrador:** crie uma conta normal pelo site e, no phpMyAdmin do banco do ambiente, rode
`UPDATE usuarios SET role = 'admin' WHERE email = 'email-do-admin';`. No primeiro acesso ao `/admin`, o painel
mostra a chave para cadastrar o app autenticador. Se o celular for perdido, libere um novo cadastro do app com
`UPDATE usuarios SET totp_segredo = NULL, totp_ultimo_passo = NULL WHERE email = '…';`.

**E-mails:** precisam do bloco `email` e de `url_site` no arquivo de configuração (veja `api/config.exemplo.php`)
e de uma conta de e-mail remetente criada no cPanel (ex.: `naoresponda@nfsolucoesdigitais.com.br`).

## Páginas

- `/`: banner com as quatro categorias, equipamentos em estoque, serviços, marcas, empresa e contato
- `/loja`: catálogo com filtros (aceita `?tipo=impressoras-e-copiadoras`, `impressoras-3d`, `acabamento`, `suprimentos`)
- `/loja/inicio/<produto>.html`: página de cada produto (mesmo endereço da loja antiga)
- `/entrar`: login e cadastro (só existe com `NEXT_PUBLIC_CONTAS_ATIVAS=true`; aceita `?aba=criar` e `?volta=/conta`)
- `/conta`: "Minha conta": pedidos de orçamento e a situação de cada um, dados do cadastro e exclusão da conta
- `/admin`: painel administrativo
- `/privacidade` e `/termos`: Política de Privacidade e Termos de Uso (LGPD)
- `/sitemap.xml` e `/robots.txt`: gerados na compilação (o teste bloqueia o Google)

## Dados

- `dados/empresa.js`: telefones, WhatsApp, endereço, marcas, serviços e textos institucionais.
- `dados/catalogo.json`: gerado por `scripts/catalogo.mjs` antes de "dev" e "compilar" (do banco, na publicação;
  dos arquivos abaixo, no computador). É o que as páginas usam.
- `dados/produtos-novos.json`: produtos cadastrados à mão (antes do painel; viram a importação inicial).
- `dados/produtos.json` e as fotos em `public/produtos/`: produtos da loja antiga (base da importação inicial do painel).

## Segurança

- Cabeçalhos de segurança (CSP, HSTS, X-Frame-Options...) e redirecionamentos em `lib/seguranca.mjs`,
  aplicados pelo `next.config.mjs` (no `npm run dev`) e pelo `.htaccess` gerado (no servidor).
- Fotos: `public/` guarda os originais; `npm run imagens` gera as versões WebP reduzidas em
  `public/otim/` (pasta ignorada pelo Git), usadas pelo `lib/carregador-imagens.mjs`.
- Limite de tentativas de login pronto em `lib/limite-login.js` (para quando houver servidor).
- Banco de dados e testes em `../banco-de-dados/`.
