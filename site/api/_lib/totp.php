<?php
// Verificação em duas etapas (2FA) do painel: códigos de 6 dígitos de app autenticador
// (Google Authenticator, Authy, Microsoft Authenticator...). Padrão TOTP, RFC 6238.
// O segredo de cada administrador fica cifrado no banco (sodium), com chave derivada do "segredo"
// da configuração: quem tiver só o banco não consegue gerar os códigos.

declare(strict_types=1);

defined('NF_API') || exit;

const NF_TOTP_PASSO = 30;     // segundos por código
const NF_TOTP_JANELA = 1;     // aceita o código anterior e o seguinte (relógio do celular adiantado/atrasado)
const NF_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function nf_totp_novo_segredo(): string
{
    $bytes = random_bytes(20); // 160 bits, o recomendado pela RFC
    $bits = '';
    foreach (str_split($bytes) as $b) {
        $bits .= str_pad(decbin(ord($b)), 8, '0', STR_PAD_LEFT);
    }
    $saida = '';
    foreach (str_split($bits, 5) as $grupo) {
        $saida .= NF_BASE32[bindec(str_pad($grupo, 5, '0'))];
    }
    return $saida;
}

function nf_base32_decodificar(string $s): string
{
    $bits = '';
    foreach (str_split(strtoupper($s)) as $c) {
        $v = strpos(NF_BASE32, $c);
        if ($v === false) {
            throw new InvalidArgumentException('base32 inválido');
        }
        $bits .= str_pad(decbin($v), 5, '0', STR_PAD_LEFT);
    }
    $saida = '';
    foreach (str_split($bits, 8) as $byte) {
        if (strlen($byte) === 8) {
            $saida .= chr(bindec($byte));
        }
    }
    return $saida;
}

function nf_totp_codigo(string $segredoBase32, int $passo): string
{
    $hash = hash_hmac('sha1', pack('J', $passo), nf_base32_decodificar($segredoBase32), true);
    $deslocamento = ord($hash[19]) & 0x0f;
    $numero = (unpack('N', substr($hash, $deslocamento, 4))[1] & 0x7fffffff) % 1000000;
    return str_pad((string) $numero, 6, '0', STR_PAD_LEFT);
}

// Devolve o passo do código aceito, ou null. Recusa passos já usados (o mesmo código não vale duas vezes).
function nf_totp_conferir(string $segredoBase32, mixed $codigo, ?int $ultimoPasso): ?int
{
    if (!is_string($codigo) || !preg_match('/^\d{6}$/', $codigo)) {
        return null;
    }
    $agora = intdiv(time(), NF_TOTP_PASSO);
    for ($d = -NF_TOTP_JANELA; $d <= NF_TOTP_JANELA; $d++) {
        $passo = $agora + $d;
        if ($ultimoPasso !== null && $passo <= $ultimoPasso) {
            continue;
        }
        if (hash_equals(nf_totp_codigo($segredoBase32, $passo), $codigo)) {
            return $passo;
        }
    }
    return null;
}

function nf_totp_chave(array $config): string
{
    return sodium_crypto_generichash('nf-totp:' . $config['segredo'], '', SODIUM_CRYPTO_SECRETBOX_KEYBYTES);
}

function nf_totp_cifrar(array $config, string $segredoBase32): string
{
    $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    return base64_encode($nonce . sodium_crypto_secretbox($segredoBase32, $nonce, nf_totp_chave($config)));
}

function nf_totp_decifrar(array $config, string $cifrado): ?string
{
    $bruto = base64_decode($cifrado, true);
    if ($bruto === false || strlen($bruto) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
        return null;
    }
    $nonce = substr($bruto, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    $texto = sodium_crypto_secretbox_open(substr($bruto, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), $nonce, nf_totp_chave($config));
    return $texto === false ? null : $texto;
}
