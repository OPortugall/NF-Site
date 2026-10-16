# Banco de dados da NF Soluções Digitais

Estrutura das tabelas (MariaDB/MySQL), as permissões do usuário que o site usa e uma
bateria de testes de segurança.

> Esta pasta tem só a **estrutura**, nunca dados. O CI barra qualquer `.sql` com `INSERT`
> (backups), e senhas nunca entram em arquivos do projeto.

## Arquivos

| Arquivo | O que é |
|---|---|
| `schema.sql` | Cria as tabelas, com as regras de segurança dentro do próprio banco |
| `usuario-do-site.sql` | Conta técnica que o site usa para se conectar, só com permissão de ler e gravar dados (em servidor próprio; na Hostinger, veja o comentário no arquivo) |
| `testes/testar-seguranca.mjs` | Bateria de testes (125) de integridade, senhas, injeção de SQL, permissões, orçamentos, links de e-mail e limite de login |
| `testes/ultimo-resultado.md` | Resultado da última execução dos testes |

## Tabelas

```
usuarios ─┬─< enderecos               (um cliente, vários endereços: matriz, filiais)
          ├─< usuario_interesses >─ produtos ─< produto_fotos
          ├─< orcamentos ─< orcamento_itens >─ produtos
          └─< tokens_usuario          (links de confirmação de e-mail e de nova senha)

tentativas_login                      (limite contra força bruta; sem ligação com usuários)
```

**usuarios:** id, primeiro_nome, sobrenome, tipo_pessoa (PF/PJ), documento (CPF ou CNPJ),
razao_social, nome_fantasia, situacao_cnpj, cnpj_verificado_em, email, email_verificado_em,
telefone, senha_hash, google_id, role (cliente/admin), status (ativo/inativo),
aceite_privacidade_em, ultimo_login_em, criado_em, atualizado_em.

**enderecos:** id, usuario_id, apelido (Matriz, Filial...), cep, rua, numero, complemento,
bairro, cidade, uf, principal (no máximo um por cliente), criado_em, atualizado_em.

**produtos:** id, slug, marca, modelo, nome, categoria, impressao (colorida/monocromatica),
condicao (novo/seminovo), resumo, descricao, especificacoes (JSON), disponivel_venda,
disponivel_locacao, preco_referencia_centavos (interno), status (ativo/oculto), destaque,
ordem, criado_em, atualizado_em. **Por enquanto vazia:** os produtos continuam no código do site.

**produto_fotos:** id, produto_id, url, texto_alternativo, ordem.

**usuario_interesses:** usuario_id, produto_id, criado_em.

**orcamentos:** id, codigo (aleatório, ex.: NF-7K3Q9XAB), usuario_id, endereco_id, status
(novo, em_atendimento, enviado, aprovado, recusado, cancelado), observacoes_cliente,
observacoes_internas (só a equipe vê), atendido_por, criado_em, atualizado_em.
Se o cliente excluir a conta, o orçamento fica no histórico da empresa sem os dados pessoais.

**orcamento_itens:** id, orcamento_id, produto_id, produto_slug, produto_nome (guardado no
momento do pedido), modalidade (compra/locacao), quantidade (1 a 99).

**tokens_usuario:** id, usuario_id, tipo (confirmar_email/redefinir_senha), token_hash, criado_em,
expira_em, usado_em. Guarda só o hash do código enviado por e-mail; validade máxima de 1 hora
(nova senha) e 48 horas (confirmação); cada link vale uma vez.

**tentativas_login:** id, chave_email, chave_ip, sucesso, criado_em. Guarda só códigos (HMAC) do
e-mail e do IP, nunca os valores. Usada por `site/lib/limite-login.js`: 5 erros no mesmo
e-mail ou 20 no mesmo IP em 15 minutos bloqueiam por 15 minutos; registros apagados após 1 dia.

## Criar o banco na Hostinger

1. hPanel → **Bancos de dados → Gerenciamento**: crie o banco e um usuário com senha forte
   (gerada, 32+ caracteres). Anote o nome do banco.
2. **phpMyAdmin** (com o usuário administrador) → aba SQL → cole o conteúdo de `schema.sql` → Executar.
3. Mantenha o **acesso remoto ao banco desligado**. Se o hPanel permitir escolher as permissões
   do usuário, deixe só **SELECT, INSERT, UPDATE, DELETE**; normalmente ele dá todas, e aí a
   proteção vem da senha forte, do acesso remoto desligado e das consultas com parâmetros
   (veja o comentário em `usuario-do-site.sql`).
4. A senha do banco vai só nas **variáveis de ambiente** do app Node.js no hPanel
   (ex.: `DATABASE_URL`), nunca em arquivo do projeto.

## Rodar os testes

Os testes criam um banco separado (`nf_solucoes_teste`), testam e apagam tudo no fim.
Rodar só num servidor de **teste** (não no da Hostinger):

```
cd banco-de-dados/testes
npm install
DB_HOST=127.0.0.1 DB_PORT=3306 DB_ADMIN_USER=root DB_ADMIN_PASSWORD=... npm run testar
```

## Regras que o site vai precisar seguir (quando o cadastro for ligado)

O banco já barra muita coisa sozinho, mas algumas proteções são do site:

- Toda consulta com **parâmetros** (`?`), nunca juntando texto (os testes mostram por quê).
- Validar os **dígitos verificadores** de CPF/CNPJ (o banco confere só o formato).
- Salvar o e-mail em **minúsculas** (o banco recusa se vier com maiúsculas).
- Senha com **argon2id** (o banco recusa texto puro, MD5 e SHA).
- **Nunca** aceitar `role` vindo do formulário: todo cadastro novo é `cliente`.
- Limitar tentativas de login com `site/lib/limite-login.js`, NA ROTA DO SERVIDOR (no navegador não protege),
  com o segredo em variável de ambiente (`LIMITE_LOGIN_SEGREDO`, 32+ caracteres) e resposta HTTP 429 quando bloqueado.
- Locação só para clientes PJ e nunca para suprimentos (os produtos ainda estão no código).
- Gerar o código do orçamento e o código dos links de e-mail com sorteio seguro
  (`crypto.randomBytes`), e calcular a validade dos links com `NOW()` do próprio banco.
- Ao trocar a senha, invalidar os outros links de nova senha pendentes daquele cliente.
- Conexão com o banco por **SSL** e, no fim do cadastro, refazer a consulta do CNPJ no servidor.
