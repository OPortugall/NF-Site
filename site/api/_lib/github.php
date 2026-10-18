<?php
// Botão "Publicar alterações" do painel: pede ao GitHub para rodar a Publicação (publicar.yml),
// que compila o site com os produtos do banco e envia ao cPanel.
//
// Configuração ('github' no arquivo de config). Sem ela, o botão avisa que não está configurado.
//   'token'       => token "fine-grained" do GitHub, só deste repositório, permissão Actions: leitura e escrita
//   'repositorio' => 'dono/NF-Site'
//   'ramo'        => 'teste' (ambiente de teste) | 'main' (produção: a publicação ainda espera aprovação no GitHub)
//   'workflow'    => 'publicar.yml' (padrão)

declare(strict_types=1);

defined('NF_API') || exit;

function nf_github_config(array $config): ?array
{
    $g = (array) ($config['github'] ?? []) + ['workflow' => 'publicar.yml', 'api' => 'https://api.github.com', 'permitir_http' => false];
    $valido = is_string($g['token'] ?? null) && strlen($g['token']) >= 20
        && is_string($g['repositorio'] ?? null) && preg_match('#^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$#', $g['repositorio'])
        && is_string($g['ramo'] ?? null) && preg_match('#^[A-Za-z0-9._/-]{1,100}$#', $g['ramo'])
        && is_string($g['workflow']) && preg_match('#^[A-Za-z0-9._-]+\.ya?ml$#', $g['workflow']);
    return $valido ? $g : null;
}

// Devolve [status HTTP, corpo decodificado | null]. Status 0 = sem resposta.
function nf_github_pedir(array $g, string $metodo, string $caminho, ?array $dados = null): array
{
    $corpo = '';
    $ch = curl_init(rtrim($g['api'], '/') . $caminho);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $metodo,
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_PROTOCOLS => $g['permitir_http'] === true ? (CURLPROTO_HTTPS | CURLPROTO_HTTP) : CURLPROTO_HTTPS,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => [
            'Accept: application/vnd.github+json',
            'Authorization: Bearer ' . $g['token'],
            'X-GitHub-Api-Version: 2022-11-28',
            'User-Agent: NF-Solucoes-Painel/1.0',
            'Content-Type: application/json',
        ],
        CURLOPT_WRITEFUNCTION => static function ($ch, string $parte) use (&$corpo): int {
            if (strlen($corpo) + strlen($parte) > 524288) {
                return 0;
            }
            $corpo .= $parte;
            return strlen($parte);
        },
    ]);
    if ($dados !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($dados, JSON_THROW_ON_ERROR));
    }
    $ok = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($ok === false) {
        return [0, null];
    }
    return [$status, $corpo === '' ? null : json_decode($corpo, true, 32)];
}

// Última publicação deste ramo: { situacao: 'na_fila'|'publicando'|'aguardando_aprovacao'|'concluida'|'falhou'|'cancelada', ... } | null
function nf_github_ultima_publicacao(array $g): ?array
{
    $caminho = "/repos/{$g['repositorio']}/actions/workflows/" . rawurlencode($g['workflow'])
        . '/runs?per_page=1&branch=' . rawurlencode($g['ramo']);
    [$status, $corpo] = nf_github_pedir($g, 'GET', $caminho);
    if ($status !== 200 || !is_array($corpo)) {
        error_log("[api-nf] GitHub: consulta das publicações respondeu HTTP {$status}");
        nf_erro(502, 'Não foi possível consultar o GitHub agora. Tente de novo em instantes.');
    }
    $run = $corpo['workflow_runs'][0] ?? null;
    if (!is_array($run)) {
        return null;
    }
    $situacao = match ($run['status'] ?? '') {
        'queued', 'requested', 'pending' => 'na_fila',
        'in_progress' => 'publicando',
        'waiting' => 'aguardando_aprovacao',
        default => match ($run['conclusion'] ?? '') {
            'success' => 'concluida',
            'cancelled', 'skipped' => 'cancelada',
            default => 'falhou',
        },
    };
    $url = is_string($run['html_url'] ?? null) && str_starts_with($run['html_url'], 'https://github.com/') ? $run['html_url'] : null;
    return ['situacao' => $situacao, 'iniciadaEm' => $run['run_started_at'] ?? $run['created_at'] ?? null,
        'atualizadaEm' => $run['updated_at'] ?? null, 'url' => $url];
}

function nf_github_publicar(array $g): bool
{
    [$status] = nf_github_pedir($g, 'POST',
        "/repos/{$g['repositorio']}/actions/workflows/" . rawurlencode($g['workflow']) . '/dispatches', ['ref' => $g['ramo']]);
    if ($status !== 204) {
        error_log("[api-nf] GitHub: pedido de publicação respondeu HTTP {$status}");
    }
    return $status === 204;
}
