<?php
// Sessão do administrador e auditoria.
//
// Login do painel em duas etapas: e-mail + senha (conta com role = 'admin') e depois o código de
// 6 dígitos do app autenticador (2FA). No primeiro acesso, o admin cadastra o app (o segredo só é
// gravado no banco depois que ele digita um código certo).
// A sessão do admin expira com 30 minutos sem uso e, de qualquer forma, 8 horas depois do login.

declare(strict_types=1);

defined('NF_API') || exit;

const NF_ADMIN_OCIOSO = 30 * 60;
const NF_ADMIN_MAXIMO = 8 * 3600;
const NF_ADMIN_PENDENTE = 5 * 60; // tempo para digitar o código depois da senha

function nf_admin_limpar(): void
{
    unset($_SESSION['admin_id'], $_SESSION['admin_login_em'], $_SESSION['admin_visto_em'],
        $_SESSION['admin_pendente'], $_SESSION['admin_totp_novo']);
}

// Administrador logado (relido do banco a cada pedido) ou null.
function nf_admin_atual(array $config): ?array
{
    nf_iniciar_sessao($config);
    $id = $_SESSION['admin_id'] ?? null;
    if (!is_int($id)) {
        return null;
    }
    $agora = time();
    if ($agora - (int) ($_SESSION['admin_visto_em'] ?? 0) > NF_ADMIN_OCIOSO
        || $agora - (int) ($_SESSION['admin_login_em'] ?? 0) > NF_ADMIN_MAXIMO) {
        nf_admin_limpar();
        return null;
    }
    $linhas = nf_consulta($config,
        "SELECT id, primeiro_nome, sobrenome, email FROM usuarios WHERE id = ? AND role = 'admin' AND status = 'ativo'", [$id]);
    if (!$linhas) {
        nf_admin_limpar();
        return null;
    }
    $_SESSION['admin_visto_em'] = $agora;
    return $linhas[0];
}

function nf_exigir_admin(array $config): array
{
    $admin = nf_admin_atual($config);
    if ($admin === null) {
        nf_erro(401, 'Entre no painel para continuar.', ['codigo' => 'admin']);
    }
    return $admin;
}

// Registro de auditoria: quem fez o quê, em quem, quando. Nunca guarda senhas ou segredos.
function nf_auditar(array $config, ?int $adminId, string $acao, string $alvoTipo, ?int $alvoId = null, ?array $detalhes = null): void
{
    nf_consulta($config,
        'INSERT INTO auditoria (admin_id, acao, alvo_tipo, alvo_id, detalhes, ip_hmac) VALUES (?, ?, ?, ?, ?, ?)',
        [$adminId, $acao, $alvoTipo, $alvoId,
         $detalhes === null ? null : json_encode($detalhes, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
         nf_chave($config, nf_ip())]);
}

// Endereço "otpauth://" que o app autenticador entende (o painel mostra a chave para digitar no app).
function nf_totp_endereco(string $segredo, string $email): string
{
    return 'otpauth://totp/' . rawurlencode('NF Soluções:' . $email)
        . '?secret=' . $segredo . '&issuer=' . rawurlencode('NF Soluções Digitais') . '&digits=6&period=' . NF_TOTP_PASSO;
}
