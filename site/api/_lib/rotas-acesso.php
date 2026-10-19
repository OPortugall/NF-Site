<?php
// "Esqueci minha senha" e confirmação de e-mail (só com as contas ligadas).
//
//   POST /api/senha-esqueci    { email }          → sempre a mesma resposta (não revela se a conta existe)
//   POST /api/senha-redefinir  { codigo, senha }  → troca a senha; encerra as sessões abertas antes
//   POST /api/email-confirmar  { codigo }         → confirma o e-mail da conta
//   POST /api/email-reenviar                      → (logado) manda outro link de confirmação
//
// Segurança dos links: código de 256 bits, guardado só como SHA-256, de uso único, que vence
// (1 hora para senha, 48 horas para e-mail); pedir outro invalida o anterior. O código vai depois do
// "#" no link (/entrar#redefinir=...): essa parte nunca é enviada ao servidor nem fica em logs de acesso.

declare(strict_types=1);

defined('NF_API') || exit;

const NF_CODIGO_SENHA_MINUTOS = 60;
const NF_CODIGO_EMAIL_MINUTOS = 48 * 60;
const NF_LIMITE_PEDIDOS_IP = 10;      // pedidos de nova senha por IP por hora
const NF_LIMITE_EMAILS_CONTA = 3;     // e-mails (nova senha ou confirmação) por conta por hora
const NF_LIMITE_CODIGOS_ERRADOS = 20; // códigos inválidos por IP em 15 minutos
const NF_SENHA_FRACA = 'A senha precisa de 8 a 128 caracteres, com pelo menos uma letra e um número.';

function nf_rotas_acesso(): array
{
    return [
        'senha-esqueci' => ['POST' => 'nf_rota_senha_esqueci'],
        'senha-redefinir' => ['POST' => 'nf_rota_senha_redefinir'],
        'email-confirmar' => ['POST' => 'nf_rota_email_confirmar'],
        'email-reenviar' => ['POST' => 'nf_rota_email_reenviar'],
    ];
}

// Cria um código novo (e invalida os anteriores do mesmo tipo). Devolve o código (só vai no e-mail).
function nf_criar_codigo(array $config, int $usuarioId, string $tipo, int $minutos): string
{
    nf_consulta($config, 'UPDATE tokens_usuario SET usado_em = NOW() WHERE usuario_id = ? AND tipo = ? AND usado_em IS NULL',
        [$usuarioId, $tipo]);
    $codigo = bin2hex(random_bytes(32));
    nf_consulta($config, 'INSERT INTO tokens_usuario (usuario_id, tipo, token_hash, expira_em) VALUES (?, ?, ?, NOW() + INTERVAL ? MINUTE)',
        [$usuarioId, $tipo, hash('sha256', $codigo), $minutos]);
    if (random_int(1, 20) === 1) {
        nf_consulta($config, 'DELETE FROM tokens_usuario WHERE expira_em < NOW() - INTERVAL 1 DAY');
    }
    return $codigo;
}

// Gasta um código válido (uma vez só) e devolve o id da conta, ou responde 400.
function nf_usar_codigo(array $config, mixed $codigo, string $tipo): int
{
    $ip = nf_ip();
    if (nf_limite_excedido($config, '#codigo-errado', $ip, NF_LIMITE_CODIGOS_ERRADOS, 15)) {
        nf_erro(429, 'Muitas tentativas. Tente de novo em 15 minutos.', [], ['Retry-After' => '900']);
    }
    $invalido = 'Este link não vale mais (já foi usado ou venceu). Peça um novo.';
    if (!is_string($codigo) || !preg_match('/^[0-9a-f]{64}$/', $codigo)) {
        nf_registrar_uso($config, '#codigo-errado', $ip);
        nf_erro(400, $invalido, ['codigo' => 'link']);
    }
    $banco = nf_banco($config);
    $banco->beginTransaction();
    try {
        // FOR UPDATE: dois pedidos ao mesmo tempo com o mesmo código não passam os dois
        $t = nf_consulta($config, "SELECT t.id, t.usuario_id FROM tokens_usuario t JOIN usuarios u ON u.id = t.usuario_id
            WHERE t.token_hash = ? AND t.tipo = ? AND t.usado_em IS NULL AND t.expira_em > NOW() AND u.status = 'ativo' FOR UPDATE",
            [hash('sha256', $codigo), $tipo])[0] ?? null;
        if ($t !== null) {
            nf_consulta($config, 'UPDATE tokens_usuario SET usado_em = NOW() WHERE id = ?', [$t['id']]);
        }
        $banco->commit();
    } catch (Throwable $ex) {
        $banco->rollBack();
        throw $ex;
    }
    if ($t === null) {
        nf_registrar_uso($config, '#codigo-errado', $ip);
        nf_erro(400, $invalido, ['codigo' => 'link']);
    }
    return (int) $t['usuario_id'];
}

function nf_link_site(array $config, string $fragmento): string
{
    return rtrim((string) ($config['url_site'] ?? ''), '/') . '/entrar#' . $fragmento;
}

function nf_enviar_confirmacao(array $config, array $u): bool
{
    $codigo = nf_criar_codigo($config, (int) $u['id'], 'confirmar_email', NF_CODIGO_EMAIL_MINUTOS);
    $ok = nf_enviar_email($config, $u['email'], 'Confirme seu e-mail - NF Soluções Digitais', implode("\n", [
        "Olá, {$u['primeiro_nome']}.",
        '',
        'Para confirmar o e-mail da sua conta no site da NF Soluções Digitais, abra o link abaixo (vale por 48 horas):',
        '',
        nf_link_site($config, 'confirmar=' . $codigo),
        '',
        'Se você não criou esta conta, ignore esta mensagem.',
        '',
        NF_CONTATO_EMPRESA,
    ]));
    nf_registrar_email($config, (int) $u['id'], 'confirmar_email', $ok);
    return $ok;
}

function nf_rota_senha_esqueci(array $config): never
{
    $d = nf_ler_json();
    $email = is_string($d['email'] ?? null) ? mb_strtolower(trim($d['email'])) : '';
    if (!nf_email_valido($email)) {
        nf_erro(422, 'Digite um e-mail válido.', ['campos' => ['email' => 'Digite um e-mail válido.']]);
    }
    $ip = nf_ip();
    if (nf_limite_excedido($config, '#senha-esqueci', $ip, NF_LIMITE_PEDIDOS_IP, 60)) {
        nf_erro(429, 'Muitos pedidos daqui. Tente de novo em 1 hora.', [], ['Retry-After' => '3600']);
    }
    nf_registrar_uso($config, '#senha-esqueci', $ip);
    $u = nf_consulta($config, "SELECT id, primeiro_nome, email FROM usuarios WHERE email = ? AND status = 'ativo'", [$email])[0] ?? null;
    // Conta existe e não passou do limite de e-mails: manda o link. A resposta é a mesma em todos os casos.
    if ($u !== null && !nf_limite_excedido($config, '#email-conta', (string) $u['id'], NF_LIMITE_EMAILS_CONTA, 60)) {
        nf_registrar_uso($config, '#email-conta', (string) $u['id']);
        $codigo = nf_criar_codigo($config, (int) $u['id'], 'redefinir_senha', NF_CODIGO_SENHA_MINUTOS);
        $ok = nf_enviar_email($config, $u['email'], 'Criar uma nova senha - NF Soluções Digitais', implode("\n", [
            "Olá, {$u['primeiro_nome']}.",
            '',
            'Recebemos um pedido para criar uma nova senha na sua conta do site da NF Soluções Digitais.',
            'Abra o link abaixo para escolher a nova senha (vale por 1 hora e só uma vez):',
            '',
            nf_link_site($config, 'redefinir=' . $codigo),
            '',
            'Se você não pediu, ignore esta mensagem: sua senha continua a mesma.',
            '',
            NF_CONTATO_EMPRESA,
        ]));
        nf_registrar_email($config, (int) $u['id'], 'redefinir_senha', $ok);
    }
    nf_responder(200, ['ok' => true, 'mensagem' => 'Se houver uma conta com este e-mail, enviamos um link para criar uma nova senha. Confira também a caixa de spam.']);
}

function nf_rota_senha_redefinir(array $config): never
{
    $d = nf_ler_json();
    $senha = $d['senha'] ?? null;
    if (!nf_senha_valida($senha)) {
        nf_erro(422, 'Confira os campos destacados.', ['campos' => ['senha' => NF_SENHA_FRACA]]);
    }
    $id = nf_usar_codigo($config, $d['codigo'] ?? null, 'redefinir_senha');
    // Quem recebeu o link no e-mail é dono do e-mail: confirma também. Sessões abertas antes caem.
    nf_consulta($config, 'UPDATE usuarios SET senha_hash = ?, senha_alterada_em = ?, email_verificado_em = COALESCE(email_verificado_em, NOW())
        WHERE id = ?', [password_hash($senha, PASSWORD_ARGON2ID), date('Y-m-d H:i:s'), $id]);
    nf_consulta($config, "UPDATE tokens_usuario SET usado_em = NOW() WHERE usuario_id = ? AND tipo = 'redefinir_senha' AND usado_em IS NULL", [$id]);
    nf_auditar($config, null, 'cliente_nova_senha', 'cliente', $id);
    // Se este navegador estava logado em alguma conta, sai dela (vai entrar de novo com a senha nova)
    nf_iniciar_sessao($config);
    nf_limpar_login();
    session_regenerate_id(true);
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    nf_responder(200, ['ok' => true, 'csrf' => $_SESSION['csrf']]);
}

function nf_rota_email_confirmar(array $config): never
{
    $d = nf_ler_json();
    $id = nf_usar_codigo($config, $d['codigo'] ?? null, 'confirmar_email');
    nf_consulta($config, 'UPDATE usuarios SET email_verificado_em = COALESCE(email_verificado_em, NOW()) WHERE id = ?', [$id]);
    nf_responder(200, ['ok' => true]);
}

function nf_rota_email_reenviar(array $config): never
{
    $u = nf_exigir_cliente($config);
    if ($u['email_verificado_em'] !== null) {
        nf_responder(200, ['ok' => true, 'jaConfirmado' => true]);
    }
    if (nf_limite_excedido($config, '#email-conta', (string) $u['id'], NF_LIMITE_EMAILS_CONTA, 60)) {
        nf_erro(429, 'Já enviamos vários e-mails na última hora. Confira a caixa de spam ou tente mais tarde.');
    }
    nf_registrar_uso($config, '#email-conta', (string) $u['id']);
    nf_responder(200, ['ok' => true, 'enviado' => nf_enviar_confirmacao($config, $u)]);
}
