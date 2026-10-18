<?php
// Carrega a configuração, liga o tratamento de erros e despacha a rota.

declare(strict_types=1);

defined('NF_API') || exit;

require __DIR__ . '/http.php';
require __DIR__ . '/banco.php';
require __DIR__ . '/sessao.php';
require __DIR__ . '/validacao.php';
require __DIR__ . '/limite.php';
require __DIR__ . '/cnpj.php';
require __DIR__ . '/email.php';
require __DIR__ . '/totp.php';
require __DIR__ . '/clientes.php';
require __DIR__ . '/produtos.php';
require __DIR__ . '/github.php';
require __DIR__ . '/admin.php';
require __DIR__ . '/rotas.php';
require __DIR__ . '/rotas-conta.php';
require __DIR__ . '/rotas-admin.php';
require __DIR__ . '/rotas-admin-loja.php';

// Configuração com os segredos (banco, chaves). Fica FORA da pasta pública do site:
//   servidor: /home/<usuario>/config-nf/<ambiente>.php   (o ambiente vem de api/_ambiente.php, gerado na compilação)
//   computador: caminho na variável de ambiente NF_CONFIG
// Modelo comentado: api/config.exemplo.php
function nf_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }
    // _ambiente.php (gerado na compilação): ['ambiente' => 'producao'|'teste', 'contas' => true|false].
    // Sem ele (computador): desenvolvimento, com as contas ligadas (NF_CONTAS=0 desliga, para testes).
    $arquivoAmbiente = dirname(__DIR__) . '/_ambiente.php';
    $opcoes = is_file($arquivoAmbiente) ? (require $arquivoAmbiente)
        : ['ambiente' => 'desenvolvimento', 'contas' => getenv('NF_CONTAS') !== '0'];
    $ambiente = is_array($opcoes) ? ($opcoes['ambiente'] ?? null) : null;
    if (!in_array($ambiente, ['producao', 'teste', 'desenvolvimento'], true) || !is_bool($opcoes['contas'] ?? null)) {
        throw new RuntimeException('Ambiente inválido em _ambiente.php');
    }
    $arquivo = getenv('NF_CONFIG') ?: dirname(__DIR__, 3) . "/config-nf/{$ambiente}.php";
    if (!is_file($arquivo)) {
        throw new RuntimeException("Configuração não encontrada: {$arquivo}");
    }
    // O log de erros da API fica junto da configuração, fora da pasta pública do site
    ini_set('error_log', dirname($arquivo) . "/api-{$ambiente}.log");
    $c = require $arquivo;

    // Falha fechada: sem configuração completa e segura, a API não atende.
    $faltando = array_diff(['banco', 'segredo', 'pasta_sessoes', 'origens', 'cookie_seguro', 'cnpj'], array_keys((array) $c));
    if ($faltando) {
        throw new RuntimeException('Configuração incompleta: ' . implode(', ', $faltando));
    }
    if (!is_string($c['segredo']) || strlen($c['segredo']) < 32) {
        throw new RuntimeException('Configuração: "segredo" precisa de 32 ou mais caracteres');
    }
    if ($ambiente !== 'desenvolvimento' && $c['cookie_seguro'] !== true) {
        throw new RuntimeException('Configuração: "cookie_seguro" precisa ser true fora do computador');
    }
    $c['ambiente'] = $ambiente;
    $c['contas'] = $opcoes['contas'];
    // Pasta pública do site (fotos enviadas pelo painel ficam em uploads/ e otim/uploads/)
    $c['pasta_site'] = rtrim((string) ($c['pasta_site'] ?? dirname(__DIR__, 2)), '/\\');
    return $config = $c;
}

function nf_executar(): void
{
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    error_reporting(E_ALL);
    set_error_handler(static function (int $nivel, string $mensagem, string $arquivo, int $linha): bool {
        // Avisos silenciados com @ (ex.: getimagesize de um arquivo que não é imagem) são tratados no código
        if (!(error_reporting() & $nivel)) {
            return true;
        }
        throw new ErrorException($mensagem, 0, $nivel, $arquivo, $linha);
    });

    nf_cabecalhos_base();

    try {
        try {
            $config = nf_config();
        } catch (Throwable $e) {
            error_log('[api-nf] configuração: ' . $e->getMessage());
            nf_erro(503, 'Serviço indisponível no momento. Tente de novo mais tarde.');
        }
        nf_verificar_origem($config);
        nf_despachar($config);
    } catch (RespostaApi $r) {
        nf_enviar($r->status, $r->corpo, $r->cabecalhos);
    } catch (Throwable $e) {
        // Detalhes só no log do servidor; o visitante recebe uma mensagem genérica.
        error_log('[api-nf] ' . get_class($e) . ': ' . $e->getMessage() . ' em ' . $e->getFile() . ':' . $e->getLine());
        nf_enviar(500, ['erro' => 'Erro interno. Tente de novo em instantes.']);
    }
}

function nf_despachar(array $config): void
{
    $caminho = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!is_string($caminho) || !preg_match('#^/api/((?:admin/)?[a-z]+(?:-[a-z]+)*)$#', $caminho, $m)) {
        nf_erro(404, 'Rota não encontrada.');
    }
    // Rotas de cliente (cadastro, login, conta e pedidos) só existem com as contas ligadas
    $rotas = nf_rotas_publicas() + nf_rotas_admin() + nf_rotas_admin_loja()
        + ($config['contas'] ? nf_rotas() + nf_rotas_conta() : []);
    $rota = $rotas[$m[1]] ?? null;
    if ($rota === null) {
        nf_erro(404, 'Rota não encontrada.');
    }
    if (!isset($rota[$metodo])) {
        nf_erro(405, 'Método não permitido.', [], ['Allow' => implode(', ', array_keys($rota))]);
    }
    if ($metodo !== 'GET') {
        nf_exigir_csrf($config);
    }
    ($rota[$metodo])($config);
}
