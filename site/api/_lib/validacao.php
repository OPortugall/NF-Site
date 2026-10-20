<?php
// Validação dos dados recebidos. As mesmas regras do formulário (site/lib/documentos.js),
// repetidas aqui porque o servidor nunca confia no navegador.

declare(strict_types=1);

defined('NF_API') || exit;

const NF_UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
    'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const NF_SENHA_MAXIMO = 128; // limite contra senhas gigantes (custo do argon2)

function nf_so_digitos(mixed $v): string
{
    return is_string($v) ? preg_replace('/\D/', '', $v) : '';
}

function nf_cpf_valido(string $d): bool
{
    if (!preg_match('/^\d{11}$/', $d) || preg_match('/^(\d)\1{10}$/', $d)) {
        return false;
    }
    foreach ([9, 10] as $n) {
        $soma = 0;
        for ($i = 0; $i < $n; $i++) {
            $soma += (int) $d[$i] * ($n + 1 - $i);
        }
        $resto = ($soma * 10) % 11;
        if (($resto === 10 ? 0 : $resto) !== (int) $d[$n]) {
            return false;
        }
    }
    return true;
}

function nf_cnpj_valido(string $d): bool
{
    if (!preg_match('/^\d{14}$/', $d) || preg_match('/^(\d)\1{13}$/', $d)) {
        return false;
    }
    $pesos = [12 => [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], 13 => [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]];
    foreach ($pesos as $n => $p) {
        $soma = 0;
        foreach ($p as $i => $peso) {
            $soma += (int) $d[$i] * $peso;
        }
        $resto = $soma % 11;
        if (($resto < 2 ? 0 : 11 - $resto) !== (int) $d[$n]) {
            return false;
        }
    }
    return true;
}

function nf_email_valido(string $e): bool
{
    return strlen($e) <= 254 && preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/u', $e) === 1;
}

// Senha: 8+ caracteres, uma letra e um número (as mesmas regras mostradas no formulário).
function nf_senha_valida(mixed $s): bool
{
    return is_string($s) && mb_strlen($s) >= 8 && strlen($s) <= NF_SENHA_MAXIMO
        && preg_match('/\p{L}/u', $s) === 1 && preg_match('/\d/', $s) === 1;
}

// Caracteres de direção do texto (ex.: U+202E inverte o que vem depois): servem para disfarçar nomes e
// textos no painel ("arquivo.exe" aparecendo como "exe.oviuqra"). Nenhum texto do site precisa deles: recusa.
function nf_tem_invisivel(string $v): bool
{
    return preg_match('/[\x{061C}\x{200E}\x{200F}\x{202A}-\x{202E}\x{2066}-\x{2069}\x{206A}-\x{206F}\x{FFF9}-\x{FFFB}]/u', $v) === 1;
}

// Invisíveis inofensivos que vêm junto ao copiar texto de sites (hífen invisível, espaço de largura zero,
// BOM): removidos em silêncio, para não dar erro à equipe. Só chamar com UTF-8 já conferido.
function nf_tirar_invisiveis(string $v): string
{
    return preg_replace('/[\x{00AD}\x{180E}\x{200B}\x{2060}-\x{2064}\x{FEFF}]/u', '', $v);
}

// Texto livre: tipo certo, UTF-8 válido, sem caracteres de controle, tamanho dentro do limite.
// Devolve o texto limpo (sem espaços nas pontas) ou null se for inválido.
function nf_texto(mixed $v, int $maximo, bool $obrigatorio = true): ?string
{
    if ($v === null && !$obrigatorio) {
        return '';
    }
    if (!is_string($v) || !mb_check_encoding($v, 'UTF-8') || preg_match('/[\x00-\x1F\x7F]/', $v) || nf_tem_invisivel($v)) {
        return null;
    }
    $t = trim(preg_replace('/\s+/u', ' ', nf_tirar_invisiveis($v)));
    if (($obrigatorio && $t === '') || mb_strlen($t) > $maximo) {
        return null;
    }
    return $t;
}
