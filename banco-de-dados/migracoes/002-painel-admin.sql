-- =============================================================================
-- Migração 002: painel administrativo (rodar UMA vez nos bancos criados com o schema antigo)
--
-- O que muda:
--  * usuarios: situação de pagamento ("em atraso") e o 2FA dos administradores
--  * produtos: estoque e limite de estoque baixo (usados na fase 2 do painel)
--  * usuario_interesses: passa a guardar o slug e o nome do produto (os produtos ainda estão no
--    código do site); a tabela antiga nunca foi usada pelo site e é recriada vazia
--  * novas tabelas: notificacoes, auditoria e emails_enviados
--
-- Como rodar: phpMyAdmin → escolha o banco (raioxper_nfteste ou raioxper_nf) → Importar → este arquivo.
-- O schema.sql já tem tudo isso para bancos novos: NÃO rode esta migração depois do schema.sql novo.
-- =============================================================================

SET NAMES utf8mb4;

ALTER TABLE usuarios
  ADD COLUMN situacao_pagamento ENUM('em_dia', 'em_atraso') NOT NULL DEFAULT 'em_dia' AFTER status,
  ADD COLUMN em_atraso_desde DATETIME NULL AFTER situacao_pagamento,
  ADD COLUMN totp_segredo VARCHAR(255) NULL COMMENT 'Só administradores: segredo do 2FA, cifrado pela API (nunca em texto)' AFTER google_id,
  ADD COLUMN totp_ultimo_passo BIGINT UNSIGNED NULL COMMENT 'Último código 2FA aceito (impede reusar o mesmo código)' AFTER totp_segredo,
  ADD KEY ix_usuarios_pagamento (situacao_pagamento),
  ADD CONSTRAINT ck_usuarios_atraso CHECK ((situacao_pagamento = 'em_atraso') = (em_atraso_desde IS NOT NULL)),
  ADD CONSTRAINT ck_usuarios_totp CHECK (totp_segredo IS NULL OR role = 'admin');

ALTER TABLE produtos
  ADD COLUMN estoque SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Quantidade disponível; 0 = indisponível no site' AFTER disponivel_locacao,
  ADD COLUMN estoque_minimo SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Avisa o painel quando o estoque chegar a este número (0 = sem aviso)' AFTER estoque;

DROP TABLE IF EXISTS usuario_interesses;
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

CREATE TABLE notificacoes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo        ENUM('novo_cliente', 'estoque_baixo', 'estoque_zerado') NOT NULL,
  usuario_id  INT UNSIGNED NULL,
  produto_id  INT UNSIGNED NULL,
  resumo      VARCHAR(300) NOT NULL,
  lida_em     DATETIME     NULL,
  criado_em   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY ix_notificacoes_lidas (lida_em, criado_em),
  CONSTRAINT fk_notificacoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT fk_notificacoes_produto FOREIGN KEY (produto_id) REFERENCES produtos (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT ck_notificacoes_resumo CHECK (TRIM(resumo) <> '')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id    INT UNSIGNED NULL,
  acao        VARCHAR(40)  NOT NULL,
  alvo_tipo   ENUM('cliente', 'produto', 'admin', 'sistema') NOT NULL,
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
  tipo        ENUM('aviso_atraso', 'novo_cliente_admin') NOT NULL,
  sucesso     TINYINT(1)   NOT NULL,
  criado_em   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY ix_emails_usuario (usuario_id, tipo, criado_em),
  CONSTRAINT fk_emails_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT ck_emails_sucesso CHECK (sucesso IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
