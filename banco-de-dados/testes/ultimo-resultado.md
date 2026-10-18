# Resultado da bateria de testes do banco de dados

Executado em 18/10/2026, 11:16:50. 153 testes: **153 passaram, 0 falharam.**

## 1. Configuração do servidor

| | Teste | Detalhe |
|---|---|---|
| ✅ | Versão do banco: 10.11.19-MariaDB |  |
| ✅ | Modo estrito ligado (dados inválidos são recusados, não cortados) | IGNORE_SPACE,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION |
| ✅ | Leitura de arquivos locais (LOAD DATA LOCAL) desligada |  |
| ✅ | 12 tabelas com InnoDB (transações e chaves estrangeiras) e utf8mb4 (acentos e emojis) |  |

## 2. Usuários: dados válidos e inválidos

| | Teste | Detalhe |
|---|---|---|
| ✅ | Cadastro de pessoa física válido |  |
| ✅ | Cadastro de empresa válido (com razão social) |  |
| ✅ | CPF com 10 números | recusado: CONSTRAINT `ck_usuarios_documento` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | CPF com pontuação | recusado: CONSTRAINT `ck_usuarios_documento` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Pessoa física com CNPJ (14 números) | recusado: CONSTRAINT `ck_usuarios_documento` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Empresa sem razão social | recusado: CONSTRAINT `ck_usuarios_razao_social` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | E-mail repetido | recusado: Duplicate entry 'ana001@empresa.com.br' for key 'uq_usuarios_email' |
| ✅ | Mesmo e-mail com letras maiúsculas (conta duplicada) | recusado: CONSTRAINT `ck_usuarios_email` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | E-mail novo com maiúsculas (precisa ser salvo em minúsculas) | recusado: CONSTRAINT `ck_usuarios_email` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | CPF já cadastrado | recusado: Duplicate entry '52998224001' for key 'uq_usuarios_documento' |
| ✅ | E-mail inválido | recusado: CONSTRAINT `ck_usuarios_email` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Telefone com letras | recusado: CONSTRAINT `ck_usuarios_telefone` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Nome em branco (só espaços) | recusado: CONSTRAINT `ck_usuarios_nomes` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Nome gigante (é recusado, não cortado em silêncio) | recusado: Data too long for column 'primeiro_nome' at row 1 |
| ✅ | Cadastro sem aceite da Política de Privacidade (LGPD) | recusado: Field 'aceite_privacidade_em' doesn't have a default value |
| ✅ | Perfil inexistente ('superadmin') | recusado: Data truncated for column 'role' at row 1 |
| ✅ | Situação inexistente ('bloqueado') | recusado: Data truncated for column 'status' at row 1 |
| ✅ | Novo cadastro entra como "cliente" e "ativo" por padrão (nunca admin) |  |

## 3. Senhas

| | Teste | Detalhe |
|---|---|---|
| ✅ | Senha em texto puro | recusado: CONSTRAINT `ck_usuarios_senha_hash` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Senha em MD5 (hash antigo e inseguro) | recusado: CONSTRAINT `ck_usuarios_senha_hash` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Senha em SHA-256 sem "sal" | recusado: CONSTRAINT `ck_usuarios_senha_hash` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Conta sem senha e sem login do Google | recusado: CONSTRAINT `ck_usuarios_forma_login` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Conta só com Google (sem senha) |  |
| ✅ | Hash com o nome do algoritmo em maiúsculas (falso) | recusado: CONSTRAINT `ck_usuarios_senha_hash` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Hash bcrypt aceito |  |
| ✅ | Senhas usam argon2id (recomendado pela OWASP) |  |
| ✅ | A mesma senha gera hashes diferentes a cada vez (sal aleatório) |  |
| ✅ | Senha correta é reconhecida |  |
| ✅ | Senha errada (só uma letra diferente) é recusada |  |
| ✅ | Nenhuma senha legível guardada no banco |  |

## 4. Endereços

| | Teste | Detalhe |
|---|---|---|
| ✅ | Endereço principal válido |  |
| ✅ | Segundo endereço (filial) |  |
| ✅ | Terceiro endereço |  |
| ✅ | Dois endereços principais para o mesmo cliente | recusado: Duplicate entry '1-1' for key 'uq_enderecos_um_principal' |
| ✅ | Endereço de cliente que não existe | recusado: Cannot add or update a child row: a foreign key constraint fails (`nf_solucoes_teste`.`enderecos`, CONSTRAINT  |
| ✅ | CEP com hífen | recusado: CONSTRAINT `ck_enderecos_cep` failed for `nf_solucoes_teste`.`enderecos` |
| ✅ | Estado inexistente (XX) | recusado: CONSTRAINT `ck_enderecos_uf` failed for `nf_solucoes_teste`.`enderecos` |

## 5. Produtos e fotos

| | Teste | Detalhe |
|---|---|---|
| ✅ | Produto válido |  |
| ✅ | Endereço de página (slug) com letras maiúsculas | recusado: CONSTRAINT `ck_produtos_slug` failed for `nf_solucoes_teste`.`produtos` |
| ✅ | Endereço de página (slug) com espaço e símbolo | recusado: CONSTRAINT `ck_produtos_slug` failed for `nf_solucoes_teste`.`produtos` |
| ✅ | Impressora 3D marcada como "colorida/monocromática" | recusado: CONSTRAINT `ck_produtos_impressao` failed for `nf_solucoes_teste`.`produtos` |
| ✅ | Toner disponível para locação | recusado: CONSTRAINT `ck_produtos_locacao_suprimento` failed for `nf_solucoes_teste`.`produtos` |
| ✅ | Produto sem venda e sem locação | recusado: CONSTRAINT `ck_produtos_disponibilidade` failed for `nf_solucoes_teste`.`produtos` |
| ✅ | Especificações com JSON inválido | recusado: CONSTRAINT `produtos.especificacoes` failed for `nf_solucoes_teste`.`produtos` |
| ✅ | Foto do próprio site |  |
| ✅ | Foto em pasta com letras maiúsculas | recusado: CONSTRAINT `ck_produto_fotos_url` failed for `nf_solucoes_teste`.`produto_fotos` |
| ✅ | Foto apontando para site externo | recusado: CONSTRAINT `ck_produto_fotos_url` failed for `nf_solucoes_teste`.`produto_fotos` |
| ✅ | Foto com "javascript:" (ataque XSS) | recusado: CONSTRAINT `ck_produto_fotos_url` failed for `nf_solucoes_teste`.`produto_fotos` |
| ✅ | Foto tentando sair da pasta (../../) | recusado: CONSTRAINT `ck_produto_fotos_url` failed for `nf_solucoes_teste`.`produto_fotos` |
| ✅ | Foto enviada pelo painel (/uploads/produtos/...) |  |
| ✅ | Foto enviada com ".." no nome | recusado: CONSTRAINT `ck_produto_fotos_url` failed for `nf_solucoes_teste`.`produto_fotos` |
| ✅ | Foto em outra pasta de uploads | recusado: CONSTRAINT `ck_produto_fotos_url` failed for `nf_solucoes_teste`.`produto_fotos` |
| ✅ | Foto com extensão .php | recusado: CONSTRAINT `ck_produto_fotos_url` failed for `nf_solucoes_teste`.`produto_fotos` |
| ✅ | Interesse do cliente num produto |  |
| ✅ | Interesse num produto que só existe no código do site (sem produto_id) |  |
| ✅ | O mesmo interesse duas vezes | recusado: Duplicate entry '1-15-mp5001' for key 'uq_usuario_interesses' |
| ✅ | Interesse com slug malicioso | recusado: CONSTRAINT `ck_interesses_slug` failed for `nf_solucoes_teste`.`usuario_interesses` |
| ✅ | Estoque negativo | recusado: Out of range value for column 'estoque' at row 1 |
| ✅ | Produto com estoque e limite de estoque baixo |  |
| ✅ | Produto sem modelo (toner): o site mostra o nome |  |
| ✅ | Produto sem nome | recusado: CONSTRAINT `ck_produtos_textos` failed for `nf_solucoes_teste`.`produtos` |

## 5b. Painel administrativo: pagamento, 2FA, notificações e auditoria

| | Teste | Detalhe |
|---|---|---|
| ✅ | Cliente "em atraso" sem a data do atraso | recusado: CONSTRAINT `ck_usuarios_atraso` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Cliente "em dia" com data de atraso | recusado: CONSTRAINT `ck_usuarios_atraso` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Cliente em atraso com a data |  |
| ✅ | Situação de pagamento fora da lista | recusado: Data truncated for column 'situacao_pagamento' at row 1 |
| ✅ | Segredo de 2FA num cliente (só administradores têm 2FA) | recusado: CONSTRAINT `ck_usuarios_totp` failed for `nf_solucoes_teste`.`usuarios` |
| ✅ | Administrador com 2FA |  |
| ✅ | Notificação de cliente novo |  |
| ✅ | Notificação de pedido de orçamento |  |
| ✅ | Notificação de conta excluída pelo cliente (sem usuario_id) |  |
| ✅ | Notificação de tipo desconhecido | recusado: Data truncated for column 'tipo' at row 1 |
| ✅ | Registro de auditoria |  |
| ✅ | Auditoria com ação fora do formato (SQL/HTML) | recusado: CONSTRAINT `ck_auditoria_acao` failed for `nf_solucoes_teste`.`auditoria` |
| ✅ | Auditoria com detalhes que não são JSON | recusado: CONSTRAINT `auditoria.detalhes` failed for `nf_solucoes_teste`.`auditoria` |
| ✅ | Auditoria com IP em texto (só HMAC) | recusado: CONSTRAINT `ck_auditoria_ip` failed for `nf_solucoes_teste`.`auditoria` |
| ✅ | Registro de e-mail enviado |  |
| ✅ | Registro de e-mail de orçamento para a equipe |  |

## 6. Injeção de SQL (consultas parametrizadas)

| | Teste | Detalhe |
|---|---|---|
| ✅ | Login com "' OR '1'='1" não encontra ninguém |  |
| ✅ | Login com "' OR 1=1 -- " não encontra ninguém |  |
| ✅ | Login com "qualquer@x.com' OR 'x'='x" não encontra ninguém |  |
| ✅ | Login com "admin@nf.com'#" não encontra ninguém |  |
| ✅ | Login com "x' UNION SELECT senha_hash FROM usuarios -- " não encontra ninguém |  |
| ✅ | Login com "'; DROP TABLE usuarios; -- " não encontra ninguém |  |
| ✅ | Nome com comando SQL é guardado como texto comum |  |
| ✅ | Vários comandos numa só chamada são bloqueados pela conexão do site | You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the |
| ✅ | Depois dos ataques, as 12 tabelas continuam lá |  |
| ✅ | Demonstração: SQL montado juntando texto devolveria TODOS os 7 usuários (por isso o site só usa parâmetros) |  |

## 7. Permissões do usuário do site (privilégio mínimo)

| | Teste | Detalhe |
|---|---|---|
| ✅ | Site consegue ler, gravar, alterar e apagar dados |  |
| ✅ | Apagar tabela (DROP TABLE) | recusado: DROP command denied to user 'nf_site_teste'@'localhost' for table `nf_solucoes_teste`.`usuarios` |
| ✅ | Alterar tabela (ALTER TABLE) | recusado: ALTER command denied to user 'nf_site_teste'@'localhost' for table `nf_solucoes_teste`.`usuarios` |
| ✅ | Criar tabela | recusado: CREATE command denied to user 'nf_site_teste'@'localhost' for table `nf_solucoes_teste`.`invasor` |
| ✅ | Esvaziar tabela inteira (TRUNCATE) | recusado: DROP command denied to user 'nf_site_teste'@'localhost' for table `nf_solucoes_teste`.`usuarios` |
| ✅ | Apagar o banco inteiro | recusado: Access denied for user 'nf_site_teste'@'127.0.0.1' to database 'nf_solucoes_teste' |
| ✅ | Criar outro usuário de banco | recusado: Access denied; you need (at least one of) the CREATE USER privilege(s) for this operation |
| ✅ | Dar permissões a si mesmo | recusado: Access denied for user 'nf_site_teste'@'127.0.0.1' to database 'nf_solucoes_teste' |
| ✅ | Ler a lista de usuários do servidor (mysql.user) | recusado: SELECT command denied to user 'nf_site_teste'@'localhost' for table `mysql`.`user` |
| ✅ | Acessar outro banco do servidor | recusado: SELECT command denied to user 'nf_site_teste'@'localhost' for table `nf_solucoes_teste_outro`.`segredo` |
| ✅ | Gravar arquivo no servidor (INTO OUTFILE) | recusado: Access denied; you need (at least one of) the FILE privilege(s) for this operation |
| ✅ | Ler arquivos do servidor (LOAD_FILE) devolve vazio |  |
| ✅ | Criar procedimento armazenado | recusado: Access denied for user 'nf_site_teste'@'127.0.0.1' to database 'nf_solucoes_teste' |

## 8. Acentos e caracteres especiais

| | Teste | Detalhe |
|---|---|---|
| ✅ | Acentos e emoji são guardados e lidos sem corromper |  |

## 9. Orçamentos

| | Teste | Detalhe |
|---|---|---|
| ✅ | Orçamento válido, com endereço de entrega |  |
| ✅ | Item para compra |  |
| ✅ | Mesmo produto para locação (linha separada) |  |
| ✅ | Mesmo produto e modalidade duas vezes | recusado: Duplicate entry '1-konica-minolta-bizhub-c361i-compra' for key 'uq_orcamento_itens' |
| ✅ | Quantidade zero | recusado: CONSTRAINT `ck_orcamento_itens_quantidade` failed for `nf_solucoes_teste`.`orcamento_itens` |
| ✅ | Quantidade acima de 99 | recusado: CONSTRAINT `ck_orcamento_itens_quantidade` failed for `nf_solucoes_teste`.`orcamento_itens` |
| ✅ | Quantidade negativa | recusado: Out of range value for column 'quantidade' at row 1 |
| ✅ | Modalidade inexistente ("doacao") | recusado: Data truncated for column 'modalidade' at row 1 |
| ✅ | Produto com endereço de página inválido | recusado: CONSTRAINT `ck_orcamento_itens_slug` failed for `nf_solucoes_teste`.`orcamento_itens` |
| ✅ | Código sequencial curto ("NF-0001") | recusado: CONSTRAINT `ck_orcamentos_codigo` failed for `nf_solucoes_teste`.`orcamentos` |
| ✅ | Código em minúsculas | recusado: CONSTRAINT `ck_orcamentos_codigo` failed for `nf_solucoes_teste`.`orcamentos` |
| ✅ | Código com letra confusa ("O") | recusado: CONSTRAINT `ck_orcamentos_codigo` failed for `nf_solucoes_teste`.`orcamentos` |
| ✅ | Código de orçamento repetido | recusado: Duplicate entry 'NF-2AL3VR5K' for key 'uq_orcamentos_codigo' |
| ✅ | Orçamento novo entra com situação "novo" |  |
| ✅ | Situação inexistente ("pago") | recusado: Data truncated for column 'status' at row 1 |
| ✅ | Orçamento de cliente que não existe | recusado: Cannot add or update a child row: a foreign key constraint fails (`nf_solucoes_teste`.`orcamentos`, CONSTRAINT |
| ✅ | Cancelar um orçamento apaga os itens dele junto |  |
| ✅ | Produto que sai do catálogo: o orçamento antigo continua com o nome dele |  |

## 10. Confirmação de e-mail e recuperação de senha

| | Teste | Detalhe |
|---|---|---|
| ✅ | Link de nova senha válido por 30 minutos |  |
| ✅ | Link de nova senha válido por 2 horas (máximo é 1 hora) | recusado: CONSTRAINT `ck_tokens_validade` failed for `nf_solucoes_teste`.`tokens_usuario` |
| ✅ | Link de confirmação de e-mail válido por 24 horas |  |
| ✅ | Link de confirmação válido por 3 dias (máximo é 48 horas) | recusado: CONSTRAINT `ck_tokens_validade` failed for `nf_solucoes_teste`.`tokens_usuario` |
| ✅ | Link já vencido no momento em que é criado | recusado: CONSTRAINT `ck_tokens_validade` failed for `nf_solucoes_teste`.`tokens_usuario` |
| ✅ | Guardar o código em si, em vez do hash | recusado: CONSTRAINT `ck_tokens_hash` failed for `nf_solucoes_teste`.`tokens_usuario` |
| ✅ | Hash em formato inválido (maiúsculas) | recusado: CONSTRAINT `ck_tokens_hash` failed for `nf_solucoes_teste`.`tokens_usuario` |
| ✅ | Tipo de link inexistente | recusado: Data truncated for column 'tipo' at row 1 |
| ✅ | Mesmo hash duas vezes | recusado: Duplicate entry 'dd1a592c91f99cd482af4c805e1d6179d573ed3136a184d79473473a1f607a0e' for key 'uq_tokens_hash' |
| ✅ | Quem vê o banco não consegue usar os links (o código não está guardado) |  |
| ✅ | O link funciona na primeira vez |  |
| ✅ | O mesmo link não funciona uma segunda vez (uso único) |  |
| ✅ | Um código inventado não funciona |  |

## 11. Exclusão de conta (direito de exclusão, LGPD)

| | Teste | Detalhe |
|---|---|---|
| ✅ | Ao excluir o cliente, os endereços e interesses dele também são apagados |  |
| ✅ | Os links de e-mail pendentes dele também são apagados |  |
| ✅ | Os orçamentos dele ficam no histórico da empresa, mas sem ligação com os dados pessoais |  |
| ✅ | Notificações perdem a ligação com o cliente; a auditoria guarda só o número do registro |  |
| ✅ | O produto em que ele tinha interesse continua no catálogo |  |

## 12. Limite de tentativas de login (força bruta)

| | Teste | Detalhe |
|---|---|---|
| ✅ | 4 senhas erradas: ainda pode tentar |  |
| ✅ | 5 senhas erradas no mesmo e-mail: bloqueado | liberado em 15 min |
| ✅ | Trocar de IP ou escrever o e-mail em maiúsculas não escapa do bloqueio |  |
| ✅ | Outros clientes continuam podendo entrar |  |
| ✅ | Depois de 15 minutos, o e-mail é liberado sozinho |  |
| ✅ | Um login certo zera a contagem do e-mail | 1 erro depois do acerto |
| ✅ | Robô testando 20 e-mails diferentes do mesmo IP: IP bloqueado |  |
| ✅ | O robô não consegue "zerar" o bloqueio do IP entrando numa conta própria |  |
| ✅ | O banco não guarda e-mails nem IPs, só códigos (LGPD) |  |
| ✅ | Gravar e-mail em texto na tabela de tentativas | recusado: CONSTRAINT `ck_tentativas_chaves` failed for `nf_solucoes_teste`.`tentativas_login` |
| ✅ | O módulo se recusa a funcionar sem um segredo forte configurado |  |
| ✅ | Registros com mais de 1 dia são apagados |  |
