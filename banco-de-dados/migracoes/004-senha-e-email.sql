-- =============================================================================
-- Migração 004: "Esqueci minha senha" e confirmação de e-mail
-- (rodar UMA vez nos bancos que já receberam a 003; o schema.sql novo já inclui tudo isto)
--
--  * usuarios.senha_alterada_em: trocar a senha encerra as sessões abertas antes da troca
--  * emails_enviados: registra os e-mails de confirmação e de nova senha
-- =============================================================================

SET NAMES utf8mb4;

ALTER TABLE usuarios
  ADD COLUMN senha_alterada_em DATETIME NULL COMMENT 'Última troca de senha: sessões abertas antes disso são encerradas' AFTER senha_hash;

ALTER TABLE emails_enviados
  MODIFY COLUMN tipo ENUM('aviso_atraso', 'novo_cliente_admin', 'novo_orcamento_admin', 'confirmar_email', 'redefinir_senha') NOT NULL;
