<?php
// Limite de tentativas (força bruta). Mesmas regras de site/lib/limite-login.js:
//   * 5 senhas erradas no mesmo e-mail em 15 min bloqueiam aquele e-mail (login certo zera);
//   * 20 senhas erradas do mesmo IP em 15 min bloqueiam o IP (login certo NÃO zera);
//   * 5 contas criadas pelo mesmo IP em 1 hora bloqueiam novos cadastros desse IP.
// O banco guarda só HMAC do e-mail e do IP (LGPD), apagados depois de 1 dia.

declare(strict_types=1);

defined('NF_API') || exit;

const NF_LIMITE = [
    'email' => ['maximo' => 5, 'minutos' => 15],
    'ip' => ['maximo' => 20, 'minutos' => 15],
    'cadastro' => ['maximo' => 5, 'minutos' => 60],
    'guardar_horas' => 24,
];
// Marcador gravado no lugar do e-mail para contar cadastros (nunca coincide com um e-mail real).
const NF_MARCADOR_CADASTRO = '#cadastro';

function nf_chave(array $config, string $valor): string
{
    return hash_hmac('sha256', mb_strtolower(trim($valor)), $config['segredo']);
}

function nf_segundos_restantes(?string $primeira, int $minutos, string $agora): int
{
    $fim = strtotime((string) $primeira) + $minutos * 60;
    return max(1, $fim - strtotime($agora));
}

// Devolve null se pode tentar, ou os segundos de espera.
function nf_bloqueio_login(array $config, string $email, string $ip): ?int
{
    $ce = nf_chave($config, $email);
    $porEmail = nf_consulta($config,
        "SELECT COUNT(*) AS erros, MIN(criado_em) AS primeira, NOW(3) AS agora
           FROM tentativas_login
          WHERE chave_email = ? AND sucesso = 0
            AND criado_em > NOW(3) - INTERVAL ? MINUTE
            AND criado_em > COALESCE((SELECT MAX(criado_em) FROM tentativas_login WHERE chave_email = ? AND sucesso = 1), '1970-01-01')",
        [$ce, NF_LIMITE['email']['minutos'], $ce])[0];
    if ((int) $porEmail['erros'] >= NF_LIMITE['email']['maximo']) {
        return nf_segundos_restantes($porEmail['primeira'], NF_LIMITE['email']['minutos'], $porEmail['agora']);
    }
    $porIp = nf_consulta($config,
        "SELECT COUNT(*) AS erros, MIN(criado_em) AS primeira, NOW(3) AS agora
           FROM tentativas_login
          WHERE chave_ip = ? AND sucesso = 0 AND criado_em > NOW(3) - INTERVAL ? MINUTE",
        [nf_chave($config, $ip), NF_LIMITE['ip']['minutos']])[0];
    if ((int) $porIp['erros'] >= NF_LIMITE['ip']['maximo']) {
        return nf_segundos_restantes($porIp['primeira'], NF_LIMITE['ip']['minutos'], $porIp['agora']);
    }
    return null;
}

function nf_registrar_tentativa(array $config, string $email, string $ip, bool $sucesso): void
{
    nf_consulta($config, 'INSERT INTO tentativas_login (chave_email, chave_ip, sucesso) VALUES (?, ?, ?)',
        [nf_chave($config, $email), nf_chave($config, $ip), $sucesso ? 1 : 0]);
    if (random_int(1, 50) === 1) {
        nf_consulta($config, 'DELETE FROM tentativas_login WHERE criado_em < NOW() - INTERVAL ? HOUR', [NF_LIMITE['guardar_horas']]);
    }
}

function nf_bloqueio_cadastro(array $config, string $ip): ?int
{
    $r = nf_consulta($config,
        "SELECT COUNT(*) AS feitos, MIN(criado_em) AS primeira, NOW(3) AS agora
           FROM tentativas_login
          WHERE chave_email = ? AND chave_ip = ? AND criado_em > NOW(3) - INTERVAL ? MINUTE",
        [nf_chave($config, NF_MARCADOR_CADASTRO), nf_chave($config, $ip), NF_LIMITE['cadastro']['minutos']])[0];
    if ((int) $r['feitos'] >= NF_LIMITE['cadastro']['maximo']) {
        return nf_segundos_restantes($r['primeira'], NF_LIMITE['cadastro']['minutos'], $r['agora']);
    }
    return null;
}

function nf_registrar_cadastro(array $config, string $ip): void
{
    // sucesso = 1: não entra na conta de "senhas erradas" do IP
    nf_registrar_tentativa($config, NF_MARCADOR_CADASTRO, $ip, true);
}

function nf_minutos(int $segundos): string
{
    $m = (int) ceil($segundos / 60);
    return $m === 1 ? '1 minuto' : "{$m} minutos";
}

// Limite genérico de ações (pedidos de nova senha, reenvio de confirmação, códigos inválidos):
// conta as linhas gravadas com o marcador nos últimos minutos para aquela chave (IP ou id da conta).
// Grava com sucesso = 1: não entra na conta de senhas erradas do login.
function nf_limite_excedido(array $config, string $marcador, string $chave, int $maximo, int $minutos): bool
{
    $r = nf_consulta($config,
        'SELECT COUNT(*) AS n FROM tentativas_login WHERE chave_email = ? AND chave_ip = ? AND criado_em > NOW(3) - INTERVAL ? MINUTE',
        [nf_chave($config, $marcador), nf_chave($config, $chave), $minutos])[0];
    return (int) $r['n'] >= $maximo;
}

function nf_registrar_uso(array $config, string $marcador, string $chave): void
{
    nf_consulta($config, 'INSERT INTO tentativas_login (chave_email, chave_ip, sucesso) VALUES (?, ?, 1)',
        [nf_chave($config, $marcador), nf_chave($config, $chave)]);
}
