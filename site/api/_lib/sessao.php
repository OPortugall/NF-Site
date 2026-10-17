<?php
// Sessão do cliente: cookie protegido + dados guardados numa pasta privada do servidor.

declare(strict_types=1);

defined('NF_API') || exit;

const NF_SESSAO_DURACAO = 7 * 24 * 3600; // depois de 7 dias do login, é preciso entrar de novo

// Prefixo __Host-: o navegador só aceita o cookie via HTTPS, do próprio domínio, em todo o site.
function nf_nome_sessao(array $config): string
{
    return $config['cookie_seguro'] === true ? '__Host-nf_sessao' : 'nf_sessao';
}

function nf_iniciar_sessao(array $config): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    // Pasta das sessões FORA do site e só do nosso usuário (a pasta /tmp do servidor é compartilhada).
    $pasta = $config['pasta_sessoes'];
    if (!is_dir($pasta) && !mkdir($pasta, 0700, true) && !is_dir($pasta)) {
        throw new RuntimeException('Não foi possível criar a pasta de sessões');
    }
    ini_set('session.save_path', $pasta);
    ini_set('session.use_strict_mode', '1');      // não aceita id de sessão inventado (fixação de sessão)
    ini_set('session.use_only_cookies', '1');     // id nunca na URL
    ini_set('session.use_trans_sid', '0');
    ini_set('session.cache_limiter', '');         // os cabeçalhos de cache são nossos (no-store)
    ini_set('session.gc_maxlifetime', (string) NF_SESSAO_DURACAO);
    ini_set('session.gc_probability', '1');
    ini_set('session.gc_divisor', '100');

    $seguro = $config['cookie_seguro'] === true;
    session_name(nf_nome_sessao($config));
    session_set_cookie_params([
        'lifetime' => NF_SESSAO_DURACAO,
        'path' => '/',
        'secure' => $seguro,
        'httponly' => true,     // JavaScript não lê o cookie (protege contra roubo por XSS)
        'samesite' => 'Lax',    // outros sites não enviam o cookie em pedidos POST
    ]);
    session_start();

    // Login vencido (mais de 7 dias): encerra.
    if (isset($_SESSION['usuario_id']) && time() - (int) ($_SESSION['login_em'] ?? 0) > NF_SESSAO_DURACAO) {
        nf_limpar_login();
    }
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
}

// Depois de entrar ou criar conta: novo id de sessão e novo código CSRF.
function nf_registrar_login(int $usuarioId): void
{
    session_regenerate_id(true);
    $_SESSION['usuario_id'] = $usuarioId;
    $_SESSION['login_em'] = time();
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function nf_limpar_login(): void
{
    unset($_SESSION['usuario_id'], $_SESSION['login_em']);
}

function nf_encerrar_sessao(array $config): void
{
    nf_iniciar_sessao($config);
    $_SESSION = [];
    session_destroy();
    $p = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 3600,
        'path' => $p['path'],
        'secure' => $p['secure'],
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

// Cliente logado (ou null). Sempre relido do banco: conta desativada sai na hora.
function nf_cliente_atual(array $config): ?array
{
    $id = $_SESSION['usuario_id'] ?? null;
    if (!is_int($id)) {
        return null;
    }
    $linhas = nf_consulta($config, "SELECT id, primeiro_nome, email, tipo_pessoa FROM usuarios WHERE id = ? AND status = 'ativo'", [$id]);
    if (!$linhas) {
        nf_limpar_login();
        return null;
    }
    return nf_cliente_publico($linhas[0]);
}

// O que o navegador recebe sobre o cliente: só o necessário para a tela.
function nf_cliente_publico(array $u): array
{
    return [
        'nome' => $u['primeiro_nome'],
        'email' => $u['email'],
        'tipo' => $u['tipo_pessoa'] === 'PJ' ? 'cnpj' : 'cpf',
    ];
}
