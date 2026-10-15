-- =============================================================================
-- Conta técnica que o SITE usa para se conectar ao banco (privilégio mínimo)
--
-- Não é uma pessoa: é a "chave" do programa do site. Clientes e administradores
-- do site ficam na tabela `usuarios`, não aqui.
--
-- O site só precisa ler e gravar dados. Com estas permissões ele NÃO pode:
--   criar/alterar/apagar tabelas, dar permissões, ler arquivos do servidor,
--   nem acessar outros bancos. Se alguém explorar uma falha no site, o estrago fica limitado.
--
-- ONDE ESTE ARQUIVO SE APLICA
--   * Servidor próprio (VPS) ou banco de teste: rode este arquivo como administrador do banco.
--   * Hospedagem da Hostinger (planos Web e Cloud): o hPanel cria o usuário do banco
--     e normalmente dá TODAS as permissões sobre aquele banco, sem opção de escolher;
--     o phpMyAdmin também costuma bloquear CREATE USER. Nesse caso este arquivo não
--     pode ser aplicado e serve só de referência. A proteção passa a ser:
--       - senha forte e gerada (32+ caracteres);
--       - acesso remoto ao banco DESLIGADO no hPanel;
--       - o site usando só consultas com parâmetros (testado em testes/testar-seguranca.mjs).
--     (Confirmar no hPanel da NF quando o banco for criado.)
--
-- A senha real fica só no servidor, em variável de ambiente (ex.: DATABASE_URL),
-- NUNCA em arquivos do projeto ou no GitHub. TROQUE_POR_UMA_SENHA_FORTE é só um aviso.
-- =============================================================================

-- 'localhost': a conta só funciona de dentro do próprio servidor, nunca pela internet.
CREATE USER IF NOT EXISTS 'nf_site'@'localhost' IDENTIFIED BY 'TROQUE_POR_UMA_SENHA_FORTE';

-- Consultar, inserir, alterar e apagar registros, e só no banco nf_solucoes.
GRANT SELECT, INSERT, UPDATE, DELETE ON nf_solucoes.* TO 'nf_site'@'localhost';
