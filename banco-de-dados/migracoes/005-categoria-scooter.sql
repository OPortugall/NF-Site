-- =============================================================================
-- Migração 005: categoria Scooter
-- (rodar UMA vez nos bancos que já receberam a 004; o schema.sql novo já inclui tudo isto)
-- =============================================================================

SET NAMES utf8mb4;

ALTER TABLE produtos
  MODIFY COLUMN categoria ENUM('multifuncionais', 'impressoras', 'impressoras-3d', 'acabamento', 'suprimentos', 'scooter') NOT NULL;
