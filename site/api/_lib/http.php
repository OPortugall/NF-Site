<?php
// Respostas JSON, leitura do corpo e proteções de origem (CSRF).

declare(strict_types=1);

defined('NF_API') || exit;

const NF_LIMITE_CORPO = 32768; // 32 KB: o maior formulário (cadastro) tem bem menos que isso

// Resposta antecipada: as rotas "lançam" a resposta e nf_executar envia.
final class RespostaApi extends Exception
{
    public function __construct(public int $status, public array $corpo, public array $cabecalhos = [])
    {
        parent::__construct('resposta');
    }
}

function nf_cabecalhos_base(): void
{
    header_remove('X-Powered-By');
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
}

function nf_enviar(int $status, array $corpo, array $cabecalhos = []): void
{
    http_response_code($status);
    foreach ($cabecalhos as $nome => $valor) {
        header("{$nome}: {$valor}");
    }
    echo json_encode($corpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_THROW_ON_ERROR);
}

function nf_responder(int $status, array $corpo, array $cabecalhos = []): never
{
    throw new RespostaApi($status, $corpo, $cabecalhos);
}

function nf_erro(int $status, string $mensagem, array $extra = [], array $cabecalhos = []): never
{
    nf_responder($status, ['erro' => $mensagem] + $extra, $cabecalhos);
}

// Só aceita pedidos do próprio site. Navegadores mandam Sec-Fetch-Site e Origin;
// outro site não consegue nem ler as respostas (não há cabeçalhos CORS).
function nf_verificar_origem(array $config): void
{
    $site = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '';
    if ($site !== '' && !in_array($site, ['same-origin', 'none'], true)) {
        nf_erro(403, 'Origem não permitida.');
    }
    $origem = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origem !== '' && !in_array($origem, (array) $config['origens'], true)) {
        nf_erro(403, 'Origem não permitida.');
    }
}

// Pedidos que mudam algo (POST) precisam do código CSRF da sessão no cabeçalho X-CSRF-Token.
function nf_exigir_csrf(array $config): void
{
    // Sem o cookie da sessão não há código a conferir: recusa antes de criar uma sessão nova
    // (robôs mandando POST em massa não enchem o servidor de arquivos de sessão).
    if (!isset($_COOKIE[nf_nome_sessao($config)])) {
        nf_erro(403, 'Sessão expirada. Recarregue a página e tente de novo.', ['codigo' => 'csrf']);
    }
    nf_iniciar_sessao($config);
    $enviado = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $esperado = $_SESSION['csrf'] ?? '';
    if (!is_string($enviado) || $esperado === '' || !hash_equals($esperado, $enviado)) {
        nf_erro(403, 'Sessão expirada. Recarregue a página e tente de novo.', ['codigo' => 'csrf']);
    }
}

// Corpo JSON (objeto), com tamanho e profundidade limitados.
function nf_ler_json(): array
{
    $tipo = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (!preg_match('#^application/json\s*(;|$)#i', $tipo)) {
        nf_erro(415, 'Envie os dados em JSON.');
    }
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > NF_LIMITE_CORPO) {
        nf_erro(413, 'Dados grandes demais.');
    }
    $bruto = file_get_contents('php://input', false, null, 0, NF_LIMITE_CORPO + 1);
    if ($bruto === false || strlen($bruto) > NF_LIMITE_CORPO) {
        nf_erro(413, 'Dados grandes demais.');
    }
    try {
        $objeto = json_decode($bruto, false, 8, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        nf_erro(400, 'Dados em formato inválido.');
    }
    if (!$objeto instanceof stdClass) {
        nf_erro(400, 'Dados em formato inválido.');
    }
    return json_decode($bruto, true, 8, JSON_THROW_ON_ERROR);
}

// IP de quem fez o pedido. Só REMOTE_ADDR: cabeçalhos como X-Forwarded-For podem ser
// inventados pelo visitante e burlariam o limite de tentativas.
function nf_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}
