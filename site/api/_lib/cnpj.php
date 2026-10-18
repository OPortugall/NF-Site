<?php
// Confere no servidor a situação do CNPJ na Receita Federal (BrasilAPI), sem confiar no navegador.

declare(strict_types=1);

defined('NF_API') || exit;

// Devolve ['estado' => 'ok', 'ativa' => bool, 'situacao' => string]
//       | ['estado' => 'nao-encontrado'] | ['estado' => 'indisponivel']
function nf_consultar_cnpj(array $config, string $cnpj): array
{
    $url = str_replace('{cnpj}', $cnpj, $config['cnpj']['url']);
    $corpo = '';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT => 6,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_PROTOCOLS => ($config['cnpj']['permitir_http'] ?? false) ? (CURLPROTO_HTTPS | CURLPROTO_HTTP) : CURLPROTO_HTTPS,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'User-Agent: NF-Solucoes-Site/1.0'],
        // Guarda no máximo 256 KB da resposta (proteção contra respostas enormes)
        CURLOPT_WRITEFUNCTION => static function ($ch, string $parte) use (&$corpo): int {
            if (strlen($corpo) + strlen($parte) > 262144) {
                return 0;
            }
            $corpo .= $parte;
            return strlen($parte);
        },
    ]);
    $ok = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($ok === false) {
        return ['estado' => 'indisponivel'];
    }
    if ($status === 404) {
        return ['estado' => 'nao-encontrado'];
    }
    if ($status !== 200) {
        return ['estado' => 'indisponivel'];
    }
    $dados = json_decode($corpo, true, 16);
    $situacao = is_array($dados) ? ($dados['descricao_situacao_cadastral'] ?? null) : null;
    if (!is_string($situacao) || $situacao === '') {
        return ['estado' => 'indisponivel'];
    }
    $situacao = mb_substr(trim($situacao), 0, 30);
    return ['estado' => 'ok', 'ativa' => mb_strtoupper($situacao) === 'ATIVA', 'situacao' => $situacao];
}
