-- =============================================================================
-- Migração 003: pedidos de orçamento pelo site, exclusão de conta pelo cliente e produtos no painel
-- (rodar UMA vez nos bancos que já receberam a 002; o schema.sql novo já inclui tudo isto)
--
--  * notificacoes: novos tipos "novo_orcamento" e "conta_excluida" e o orçamento de cada aviso
--  * auditoria: ações em orçamentos
--  * emails_enviados: novo tipo "novo_orcamento_admin"
--  * produto_fotos: aceita fotos enviadas pelo painel (/uploads/produtos/...)
--  * produtos: modelo pode ficar vazio (toner e outros produtos sem modelo; o site mostra o nome)
-- =============================================================================

SET NAMES utf8mb4;

ALTER TABLE notificacoes
  MODIFY COLUMN tipo ENUM('novo_cliente', 'estoque_baixo', 'estoque_zerado', 'novo_orcamento', 'conta_excluida') NOT NULL,
  ADD COLUMN orcamento_id INT UNSIGNED NULL AFTER produto_id,
  ADD CONSTRAINT fk_notificacoes_orcamento FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id)
    ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE auditoria
  MODIFY COLUMN alvo_tipo ENUM('cliente', 'produto', 'admin', 'sistema', 'orcamento') NOT NULL;

ALTER TABLE emails_enviados
  MODIFY COLUMN tipo ENUM('aviso_atraso', 'novo_cliente_admin', 'novo_orcamento_admin') NOT NULL;

ALTER TABLE produto_fotos
  DROP CONSTRAINT ck_produto_fotos_url,
  ADD CONSTRAINT ck_produto_fotos_url CHECK (
    CAST(url AS BINARY) REGEXP '^/(uploads/)?produtos/[a-z0-9-]+/[a-zA-Z0-9._-]+\\.(jpe?g|png|webp)$'
    AND url NOT LIKE '%..%'
  );

ALTER TABLE produtos
  MODIFY COLUMN modelo VARCHAR(100) NOT NULL COMMENT 'Vazio em produtos sem modelo (ex.: toner): o site mostra o nome',
  MODIFY COLUMN destaque TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = aparece em "Equipamentos em estoque" na página inicial',
  DROP CONSTRAINT ck_produtos_textos,
  ADD CONSTRAINT ck_produtos_textos CHECK (TRIM(marca) <> '' AND TRIM(nome) <> '');
