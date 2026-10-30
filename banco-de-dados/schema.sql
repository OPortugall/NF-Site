-- =============================================================================
-- NF Soluções Digitais: estrutura do banco de dados
-- Compatível com MariaDB 10.11+/11.x (usado pela Hostinger) e MySQL 8.0.16+.
--
-- Regras de segurança aplicadas na própria estrutura (não dependem só do site):
--  * Senha nunca em texto: a coluna só aceita hash argon2id ou bcrypt.
--  * Documento só com números, com tamanho certo para CPF (11) ou CNPJ (14), e único.
--  * E-mail único (sem diferenciar maiúsculas) e sempre salvo em minúsculas.
--  * Valores fora da lista (role, status, UF...) são recusados.
--  * Regras de formato comparam letra a letra (CAST AS BINARY): o banco ignora maiúsculas/minúsculas
--    nas comparações comuns, e sem isso "Konica" passaria onde só vale "konica".
--  * Aceite da Política de Privacidade obrigatório (LGPD).
--  * Excluir um usuário apaga também os endereços e interesses dele (direito de exclusão, LGPD).
--  * Fotos só podem apontar para arquivos do próprio site (nada de links externos ou "javascript:").
--  * Links de e-mail (confirmação e nova senha) guardados só como hash, com validade curta e uso único.
--  * Tentativas de login registradas (sem guardar e-mail nem IP) para bloquear força bruta.
-- =============================================================================

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- Usuários (clientes e administradores)
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  primeiro_nome          VARCHAR(60)  NOT NULL,
  sobrenome              VARCHAR(100) NOT NULL,

  -- PF = pessoa física (CPF, só compra) | PJ = empresa (CNPJ, compra e locação)
  tipo_pessoa            ENUM('PF', 'PJ') NOT NULL,
  documento              VARCHAR(14)  NOT NULL COMMENT 'CPF ou CNPJ, só números',
  razao_social           VARCHAR(150) NULL COMMENT 'Obrigatória para PJ',
  nome_fantasia          VARCHAR(150) NULL,
  situacao_cnpj          VARCHAR(30)  NULL COMMENT 'Situação na Receita Federal na última consulta',
  cnpj_verificado_em     DATETIME     NULL,

  email                  VARCHAR(254) NOT NULL,
  email_verificado_em    DATETIME     NULL,
  telefone               VARCHAR(11)  NOT NULL COMMENT 'DDD + número, só números',

  -- Senha: apenas o HASH (argon2id ou bcrypt). Fica vazia para quem entra só com Google.
  senha_hash             VARCHAR(255) NULL,
  senha_alterada_em      DATETIME     NULL COMMENT 'Última troca de senha: sessões abertas antes disso são encerradas',
  google_id              VARCHAR(64)  NULL,
  totp_segredo           VARCHAR(255) NULL COMMENT 'Só administradores: segredo do 2FA, cifrado pela API (nunca em texto)',
  totp_ultimo_passo      BIGINT UNSIGNED NULL COMMENT 'Último código 2FA aceito (impede reusar o mesmo código)',

  role                   ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
  status                 ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
  -- Marcado pelo painel; ao marcar "em atraso", o cliente recebe um aviso por e-mail
  situacao_pagamento     ENUM('em_dia', 'em_atraso') NOT NULL DEFAULT 'em_dia',
  em_atraso_desde        DATETIME     NULL,

  aceite_privacidade_em  DATETIME     NOT NULL COMMENT 'LGPD: quando aceitou a Política de Privacidade',
  ultimo_login_em        DATETIME     NULL,
  criado_em              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),
  UNIQUE KEY uq_usuarios_documento (documento),
  UNIQUE KEY uq_usuarios_google (google_id),
  KEY ix_usuarios_role_status (role, status),
  KEY ix_usuarios_pagamento (situacao_pagamento),

  CONSTRAINT ck_usuarios_documento CHECK (
    (tipo_pessoa = 'PF' AND documento REGEXP '^[0-9]{11}$') OR
    (tipo_pessoa = 'PJ' AND documento REGEXP '^[0-9]{14}$')
  ),
  CONSTRAINT ck_usuarios_razao_social CHECK (tipo_pessoa = 'PF' OR (razao_social IS NOT NULL AND razao_social <> '')),
  CONSTRAINT ck_usuarios_nomes CHECK (TRIM(primeiro_nome) <> '' AND TRIM(sobrenome) <> ''),
  -- CAST AS BINARY: compara letra a letra (sem isso, 'ANA' = 'ana' daria verdadeiro)
  CONSTRAINT ck_usuarios_email CHECK (CAST(email AS BINARY) = CAST(LOWER(email) AS BINARY) AND email REGEXP '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]{2,}$'),
  CONSTRAINT ck_usuarios_telefone CHECK (telefone REGEXP '^[0-9]{10,11}$'),
  CONSTRAINT ck_usuarios_forma_login CHECK (senha_hash IS NOT NULL OR google_id IS NOT NULL),
  CONSTRAINT ck_usuarios_atraso CHECK ((situacao_pagamento = 'em_atraso') = (em_atraso_desde IS NOT NULL)),
  CONSTRAINT ck_usuarios_totp CHECK (totp_segredo IS NULL OR role = 'admin'),
  CONSTRAINT ck_usuarios_senha_hash CHECK (senha_hash IS NULL OR CAST(senha_hash AS BINARY) REGEXP '^\\$(argon2id\\$v=19\\$|2[aby]\\$[0-9]{2}\\$)')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Endereços (um cliente pode ter vários: matriz, filiais, local de entrega)
-- -----------------------------------------------------------------------------
CREATE TABLE enderecos (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      INT UNSIGNED NOT NULL,
  apelido         VARCHAR(60)  NULL COMMENT 'Ex.: Matriz, Filial Centro',
  cep             CHAR(8)      NOT NULL COMMENT 'Só números',
  rua             VARCHAR(150) NOT NULL,
  numero          VARCHAR(10)  NOT NULL,
  complemento     VARCHAR(80)  NULL,
  bairro          VARCHAR(80)  NOT NULL,
  cidade          VARCHAR(80)  NOT NULL,
  uf              CHAR(2)      NOT NULL,
  principal       TINYINT(1)   NOT NULL DEFAULT 0,
  -- Marcador interno: vale 1 só no endereço principal, para garantir no máximo um principal por cliente
  principal_unico TINYINT(1) GENERATED ALWAYS AS (IF(principal = 1, 1, NULL)) STORED,
  criado_em       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_enderecos_um_principal (usuario_id, principal_unico),
  CONSTRAINT fk_enderecos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT ck_enderecos_cep CHECK (cep REGEXP '^[0-9]{8}$'),
  CONSTRAINT ck_enderecos_principal CHECK (principal IN (0, 1)),
  CONSTRAINT ck_enderecos_campos CHECK (TRIM(rua) <> '' AND TRIM(numero) <> '' AND TRIM(bairro) <> '' AND TRIM(cidade) <> ''),
  CONSTRAINT ck_enderecos_uf CHECK (uf IN (
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
    'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Produtos (estrutura pronta; os produtos continuam no código do site por enquanto)
-- -----------------------------------------------------------------------------
CREATE TABLE produtos (
  id                         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug                       VARCHAR(120) NOT NULL COMMENT 'Parte do endereço da página, ex.: konica-minolta-bizhub-c361i',
  marca                      VARCHAR(60)  NOT NULL,
  modelo                     VARCHAR(100) NOT NULL COMMENT 'Vazio em produtos sem modelo (ex.: toner): o site mostra o nome',
  nome                       VARCHAR(160) NOT NULL COMMENT 'Nome exibido no site',
  categoria                  ENUM('multifuncionais', 'impressoras', 'impressoras-3d', 'acabamento', 'suprimentos', 'scooter') NOT NULL,
  -- Só para impressoras e copiadoras; fica vazio em impressora 3D, plotter e suprimentos
  impressao                  ENUM('colorida', 'monocromatica') NULL,
  condicao                   ENUM('novo', 'seminovo') NOT NULL,
  resumo                     VARCHAR(300) NOT NULL,
  descricao                  TEXT         NULL,
  especificacoes             JSON         NULL COMMENT 'Tabela técnica: [["Velocidade","36 ppm"], ...]',
  disponivel_venda           TINYINT(1)   NOT NULL DEFAULT 1,
  disponivel_locacao         TINYINT(1)   NOT NULL DEFAULT 0,
  estoque                    SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Quantidade disponível; 0 = indisponível no site',
  estoque_minimo             SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Avisa o painel quando o estoque chegar a este número (0 = sem aviso)',
  preco_referencia_centavos  INT UNSIGNED NULL COMMENT 'Interno: nunca exibido no site',
  status                     ENUM('ativo', 'oculto') NOT NULL DEFAULT 'ativo',
  destaque                   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = aparece em "Equipamentos em estoque" na página inicial',
  ordem                      SMALLINT     NOT NULL DEFAULT 0,
  criado_em                  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_produtos_slug (slug),
  KEY ix_produtos_vitrine (status, categoria, ordem),
  CONSTRAINT ck_produtos_slug CHECK (CAST(slug AS BINARY) REGEXP '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT ck_produtos_textos CHECK (TRIM(marca) <> '' AND TRIM(nome) <> ''),
  CONSTRAINT ck_produtos_impressao CHECK (impressao IS NULL OR categoria IN ('multifuncionais', 'impressoras')),
  CONSTRAINT ck_produtos_especificacoes CHECK (especificacoes IS NULL OR JSON_VALID(especificacoes)),
  CONSTRAINT ck_produtos_disponibilidade CHECK (disponivel_venda IN (0, 1) AND disponivel_locacao IN (0, 1)
                                                AND (disponivel_venda = 1 OR disponivel_locacao = 1)),
  CONSTRAINT ck_produtos_locacao_suprimento CHECK (categoria <> 'suprimentos' OR disponivel_locacao = 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE produto_fotos (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  produto_id         INT UNSIGNED NOT NULL,
  url                VARCHAR(300) NOT NULL COMMENT 'Caminho de arquivo do próprio site, ex.: /produtos/x/foto-1.jpg',
  texto_alternativo  VARCHAR(200) NULL,
  ordem              SMALLINT     NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  UNIQUE KEY uq_produto_fotos_ordem (produto_id, ordem),
  CONSTRAINT fk_produto_fotos_produto FOREIGN KEY (produto_id) REFERENCES produtos (id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  -- /produtos/... = fotos que vêm no código do site; /uploads/produtos/... = fotos enviadas pelo painel
  CONSTRAINT ck_produto_fotos_url CHECK (
    CAST(url AS BINARY) REGEXP '^/(uploads/)?produtos/[a-z0-9-]+/[a-zA-Z0-9._-]+\\.(jpe?g|png|webp)$'
    AND url NOT LIKE '%..%'
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Produtos de interesse marcados no cadastro (vão no aviso de cliente novo ao administrador).
-- Guarda o slug e o nome do momento do cadastro: os produtos ainda estão no código do site.
-- -----------------------------------------------------------------------------
CREATE TABLE usuario_interesses (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id    INT UNSIGNED NOT NULL,
  produto_id    INT UNSIGNED NULL,
  produto_slug  VARCHAR(120) NOT NULL,
  produto_nome  VARCHAR(160) NOT NULL COMMENT 'Guardado no momento do cadastro',
  criado_em     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_interesses (usuario_id, produto_slug),
  KEY ix_usuario_interesses_produto (produto_id),
  CONSTRAINT fk_interesses_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_interesses_produto FOREIGN KEY (produto_id) REFERENCES produtos (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT ck_interesses_slug CHECK (CAST(produto_slug AS BINARY) REGEXP '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT ck_interesses_nome CHECK (TRIM(produto_nome) <> '')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Orçamentos (o carrinho enviado pelo cliente vira um orçamento registrado)
-- -----------------------------------------------------------------------------
CREATE TABLE orcamentos (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- Código mostrado ao cliente e na mensagem do WhatsApp (ex.: NF-7K3Q9XAB).
  -- Aleatório de propósito: com um número sequencial, dava para "chutar" orçamentos de outros clientes.
  codigo               CHAR(11)     NOT NULL,
  -- Se o cliente excluir a conta (LGPD), o orçamento fica no histórico da empresa, sem os dados pessoais.
  usuario_id           INT UNSIGNED NULL,
  endereco_id          INT UNSIGNED NULL COMMENT 'Endereço de entrega/instalação escolhido',
  status               ENUM('novo', 'em_atendimento', 'enviado', 'aprovado', 'recusado', 'cancelado')
                       NOT NULL DEFAULT 'novo',
  observacoes_cliente  VARCHAR(1000) NULL COMMENT 'Escrito pelo cliente ao enviar',
  observacoes_internas TEXT          NULL COMMENT 'Só a equipe da NF vê',
  atendido_por         INT UNSIGNED  NULL COMMENT 'Administrador responsável',
  criado_em            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_orcamentos_codigo (codigo),
  KEY ix_orcamentos_usuario (usuario_id, criado_em),
  KEY ix_orcamentos_status (status, criado_em),
  CONSTRAINT fk_orcamentos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT fk_orcamentos_endereco FOREIGN KEY (endereco_id) REFERENCES enderecos (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT fk_orcamentos_atendente FOREIGN KEY (atendido_por) REFERENCES usuarios (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT ck_orcamentos_codigo CHECK (CAST(codigo AS BINARY) REGEXP '^NF-[0-9A-HJ-NP-Z]{8}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Os produtos de cada orçamento. Guarda uma "foto" do nome do produto no momento do pedido:
-- se o produto mudar de nome ou sair do catálogo, o orçamento antigo continua legível.
-- (Os produtos ainda estão no código do site; por isso produto_id pode ficar vazio e o slug é obrigatório.)
CREATE TABLE orcamento_itens (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  orcamento_id  INT UNSIGNED NOT NULL,
  produto_id    INT UNSIGNED NULL,
  produto_slug  VARCHAR(120) NOT NULL,
  produto_nome  VARCHAR(160) NOT NULL,
  modalidade    ENUM('compra', 'locacao') NOT NULL,
  quantidade    SMALLINT UNSIGNED NOT NULL DEFAULT 1,

  PRIMARY KEY (id),
  UNIQUE KEY uq_orcamento_itens (orcamento_id, produto_slug, modalidade),
  KEY ix_orcamento_itens_produto (produto_id),
  CONSTRAINT fk_orcamento_itens_orcamento FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_orcamento_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT ck_orcamento_itens_quantidade CHECK (quantidade BETWEEN 1 AND 99),
  CONSTRAINT ck_orcamento_itens_slug CHECK (CAST(produto_slug AS BINARY) REGEXP '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT ck_orcamento_itens_nome CHECK (TRIM(produto_nome) <> '')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tokens de confirmação de e-mail e de recuperação de senha
--
-- Como funciona: o site sorteia um código secreto longo, manda por e-mail num link
-- e guarda aqui só o HASH (SHA-256) dele. Assim, quem tiver acesso ao banco não
-- consegue usar os links. Cada código vale uma vez e por pouco tempo.
-- -----------------------------------------------------------------------------
CREATE TABLE tokens_usuario (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  tipo        ENUM('confirmar_email', 'redefinir_senha') NOT NULL,
  token_hash  CHAR(64)     NOT NULL COMMENT 'SHA-256 do código enviado; o código em si nunca é guardado',
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_em   DATETIME     NOT NULL,
  usado_em    DATETIME     NULL COMMENT 'Preenchido quando o link é usado: não vale de novo',

  PRIMARY KEY (id),
  UNIQUE KEY uq_tokens_hash (token_hash),
  KEY ix_tokens_usuario_tipo (usuario_id, tipo, expira_em),
  CONSTRAINT fk_tokens_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT ck_tokens_hash CHECK (CAST(token_hash AS BINARY) REGEXP '^[0-9a-f]{64}$'),
  -- Validade máxima: 1 hora para redefinir senha, 48 horas para confirmar e-mail
  CONSTRAINT ck_tokens_validade CHECK (
    expira_em > criado_em AND (
      (tipo = 'redefinir_senha' AND expira_em <= criado_em + INTERVAL 1 HOUR) OR
      (tipo = 'confirmar_email' AND expira_em <= criado_em + INTERVAL 48 HOUR)
    )
  ),
  CONSTRAINT ck_tokens_uso CHECK (usado_em IS NULL OR usado_em >= criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tentativas de login (contra robôs que testam senhas: "força bruta")
--
-- Regra (aplicada pelo site em site/lib/limite-login.js):
--   * 5 senhas erradas para o mesmo e-mail em 15 minutos: aquele e-mail fica bloqueado
--     por 15 minutos (um login certo zera a contagem do e-mail);
--   * 20 senhas erradas vindas do mesmo endereço de internet (IP) em 15 minutos:
--     aquele IP fica bloqueado, mesmo trocando de e-mail.
-- Privacidade (LGPD): o e-mail e o IP não são guardados, só um código (HMAC-SHA256 com
-- uma chave secreta do servidor), e os registros são apagados depois de 1 dia.
-- -----------------------------------------------------------------------------
CREATE TABLE tentativas_login (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  chave_email  CHAR(64)    NOT NULL COMMENT 'HMAC-SHA256 do e-mail digitado',
  chave_ip     CHAR(64)    NOT NULL COMMENT 'HMAC-SHA256 do IP de origem',
  sucesso      TINYINT(1)  NOT NULL DEFAULT 0,
  criado_em    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY ix_tentativas_email (chave_email, criado_em),
  KEY ix_tentativas_ip (chave_ip, criado_em),
  KEY ix_tentativas_data (criado_em),
  CONSTRAINT ck_tentativas_chaves CHECK (
    CAST(chave_email AS BINARY) REGEXP '^[0-9a-f]{64}$' AND CAST(chave_ip AS BINARY) REGEXP '^[0-9a-f]{64}$'
  ),
  CONSTRAINT ck_tentativas_sucesso CHECK (sucesso IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Painel administrativo: notificações, auditoria (quem alterou o quê) e e-mails enviados
-- -----------------------------------------------------------------------------
CREATE TABLE notificacoes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo        ENUM('novo_cliente', 'estoque_baixo', 'estoque_zerado', 'novo_orcamento', 'conta_excluida') NOT NULL,
  usuario_id  INT UNSIGNED NULL,
  produto_id  INT UNSIGNED NULL,
  orcamento_id INT UNSIGNED NULL,
  resumo      VARCHAR(300) NOT NULL,
  lida_em     DATETIME     NULL,
  criado_em   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY ix_notificacoes_lidas (lida_em, criado_em),
  CONSTRAINT fk_notificacoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT fk_notificacoes_produto FOREIGN KEY (produto_id) REFERENCES produtos (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT fk_notificacoes_orcamento FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT ck_notificacoes_resumo CHECK (TRIM(resumo) <> '')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id    INT UNSIGNED NULL,
  acao        VARCHAR(40)  NOT NULL,
  alvo_tipo   ENUM('cliente', 'produto', 'admin', 'sistema', 'orcamento') NOT NULL,
  alvo_id     INT UNSIGNED NULL,
  detalhes    JSON         NULL COMMENT 'Campos alterados (nunca senhas ou segredos)',
  ip_hmac     CHAR(64)     NULL COMMENT 'HMAC do IP (LGPD)',
  criado_em   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY ix_auditoria_data (criado_em),
  KEY ix_auditoria_alvo (alvo_tipo, alvo_id),
  CONSTRAINT fk_auditoria_admin FOREIGN KEY (admin_id) REFERENCES usuarios (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT ck_auditoria_acao CHECK (CAST(acao AS BINARY) REGEXP '^[a-z_]+$'),
  CONSTRAINT ck_auditoria_detalhes CHECK (detalhes IS NULL OR JSON_VALID(detalhes)),
  CONSTRAINT ck_auditoria_ip CHECK (ip_hmac IS NULL OR CAST(ip_hmac AS BINARY) REGEXP '^[0-9a-f]{64}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE emails_enviados (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NULL,
  tipo        ENUM('aviso_atraso', 'novo_cliente_admin', 'novo_orcamento_admin', 'confirmar_email', 'redefinir_senha') NOT NULL,
  sucesso     TINYINT(1)   NOT NULL,
  criado_em   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY ix_emails_usuario (usuario_id, tipo, criado_em),
  CONSTRAINT fk_emails_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT ck_emails_sucesso CHECK (sucesso IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
