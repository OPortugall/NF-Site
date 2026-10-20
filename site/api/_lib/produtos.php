<?php
// Produtos: catálogo atual, validação do formulário do painel, avisos de estoque e fotos enviadas.

declare(strict_types=1);

defined('NF_API') || exit;

const NF_CATEGORIAS = ['multifuncionais', 'impressoras', 'impressoras-3d', 'acabamento', 'suprimentos'];
// Larguras das versões reduzidas das fotos: as mesmas de site/lib/carregador-imagens.mjs
const NF_LARGURAS_FOTO = [64, 128, 256, 384, 640, 828, 1080, 1600];
const NF_FOTO_BYTES = 8 * 1024 * 1024;     // 8 MB por foto enviada
const NF_FOTO_PIXELS = 16_000_000;         // 16 megapixels (memória do PHP ao abrir a foto)
const NF_FOTOS_POR_PRODUTO = 12;

// Nome mostrado no site: "Ricoh MP C3502" (o mesmo de tituloProduto em site/lib/produtos.js)
function nf_titulo_produto(array $p): string
{
    $modelo = (string) $p['modelo'];
    return $modelo !== '' ? $p['marca'] . ' ' . preg_replace('/^(MP|SP)(C?)(\d)/', '$1 $2$3', $modelo) : (string) $p['nome'];
}

// Catálogo atual { slug: { id, nome, tipo, venda, locacao, estoque, ativo } }.
// Do banco quando ele já tem produtos; antes disso, do catálogo gerado na compilação (_dados/catalogo.json).
function nf_catalogo_atual(array $config): array
{
    static $catalogo = null;
    if ($catalogo !== null) {
        return $catalogo;
    }
    $linhas = nf_consulta($config, 'SELECT id, slug, marca, modelo, nome, categoria, disponivel_venda, disponivel_locacao,
        estoque, status FROM produtos');
    $catalogo = [];
    foreach ($linhas as $p) {
        $catalogo[$p['slug']] = [
            'id' => (int) $p['id'], 'nome' => nf_titulo_produto($p), 'tipo' => $p['categoria'],
            'venda' => (bool) $p['disponivel_venda'], 'locacao' => (bool) $p['disponivel_locacao'],
            'estoque' => (int) $p['estoque'], 'ativo' => $p['status'] === 'ativo',
        ];
    }
    if (!$catalogo) {
        $arquivo = dirname(__DIR__) . '/_dados/catalogo.json';
        $doArquivo = is_file($arquivo) ? (json_decode((string) file_get_contents($arquivo), true) ?: []) : [];
        foreach ($doArquivo as $slug => $p) {
            $catalogo[$slug] = ['id' => null, 'nome' => $p['nome'], 'tipo' => $p['tipo'], 'venda' => $p['venda'] !== false,
                'locacao' => (bool) $p['locacao'], 'estoque' => null, 'ativo' => true];
        }
    }
    return $catalogo;
}

// Formulário de produto do painel. Devolve [$dados, $erros] (como nf_validar_cliente).
function nf_validar_produto(array $d): array
{
    $e = [];
    $slug = is_string($d['slug'] ?? null) ? trim($d['slug']) : '';
    if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug) || strlen($slug) > 120) {
        $e['slug'] = 'Use só letras minúsculas, números e hífens (ex.: ricoh-mp-c3502).';
    }
    $marca = nf_texto($d['marca'] ?? null, 60) ?? ($e['marca'] = 'Digite a marca (até 60 letras).');
    $modelo = nf_texto($d['modelo'] ?? null, 100, false);
    if ($modelo === null) {
        $e['modelo'] = 'Modelo inválido (até 100 letras).';
    }
    $nome = nf_texto($d['nome'] ?? null, 160) ?? ($e['nome'] = 'Digite o nome do produto (até 160 letras).');
    $categoria = $d['categoria'] ?? null;
    if (!in_array($categoria, NF_CATEGORIAS, true)) {
        $e['categoria'] = 'Escolha a categoria.';
    }
    $comImpressao = in_array($categoria, ['multifuncionais', 'impressoras'], true);
    $impressao = $d['impressao'] ?? null;
    if ($comImpressao && !in_array($impressao, ['colorida', 'monocromatica'], true)) {
        $e['impressao'] = 'Escolha colorida ou preto e branco.';
    }
    $condicao = $d['condicao'] ?? null;
    if (!in_array($condicao, ['novo', 'seminovo'], true)) {
        $e['condicao'] = 'Escolha novo ou seminovo.';
    }
    $resumo = nf_texto($d['resumo'] ?? null, 300) ?? ($e['resumo'] = 'Digite o resumo (até 300 letras).');
    $descricao = nf_texto_longo($d['descricao'] ?? null, 20000);
    if ($descricao === null) {
        $e['descricao'] = 'Descrição inválida (até 20 mil caracteres).';
    }
    $venda = ($d['disponivelVenda'] ?? null) === true;
    $locacao = ($d['disponivelLocacao'] ?? null) === true;
    if ($locacao && $categoria === 'suprimentos') {
        $e['disponivelLocacao'] = 'Suprimentos não são alugados.';
    } elseif (!$venda && !$locacao) {
        $e['disponivelVenda'] = 'Marque venda, locação ou as duas.';
    }
    $estoque = $d['estoque'] ?? null;
    if (!is_int($estoque) || $estoque < 0 || $estoque > 65535) {
        $e['estoque'] = 'Digite a quantidade em estoque (0 ou mais).';
    }
    $minimo = $d['estoqueMinimo'] ?? null;
    if (!is_int($minimo) || $minimo < 0 || $minimo > 65535) {
        $e['estoqueMinimo'] = 'Digite o estoque mínimo (0 = sem aviso).';
    }
    $preco = $d['precoReferencia'] ?? null;
    if ($preco !== null && (!is_int($preco) || $preco < 0 || $preco > 4294967295)) {
        $e['precoReferencia'] = 'Preço inválido.';
    }
    $status = $d['status'] ?? null;
    if (!in_array($status, ['ativo', 'oculto'], true)) {
        $e['status'] = 'Escolha se o produto aparece no site.';
    }
    $ordem = $d['ordem'] ?? 0;
    if (!is_int($ordem) || $ordem < -32768 || $ordem > 32767) {
        $e['ordem'] = 'Ordem inválida.';
    }
    if ($e) {
        return [null, $e];
    }
    return [[
        'slug' => $slug, 'marca' => $marca, 'modelo' => $modelo, 'nome' => $nome, 'categoria' => $categoria,
        'impressao' => $comImpressao ? $impressao : null, 'condicao' => $condicao, 'resumo' => $resumo,
        'descricao' => $descricao === '' ? null : $descricao,
        'disponivel_venda' => $venda ? 1 : 0, 'disponivel_locacao' => $locacao ? 1 : 0,
        'estoque' => $estoque, 'estoque_minimo' => $minimo, 'preco_referencia_centavos' => $preco,
        'status' => $status, 'destaque' => ($d['destaque'] ?? null) === true ? 1 : 0, 'ordem' => $ordem,
    ], []];
}

// Texto com várias linhas (descrição, observações): UTF-8 válido, sem caracteres de controle além
// da quebra de linha e da tabulação. Devolve o texto limpo, '' se vazio, ou null se inválido.
function nf_texto_longo(mixed $v, int $maximo): ?string
{
    if ($v === null) {
        return '';
    }
    if (!is_string($v) || !mb_check_encoding($v, 'UTF-8')) {
        return null;
    }
    $t = trim(str_replace(["\r\n", "\r", "\t"], ["\n", "\n", ' '], nf_tirar_invisiveis($v)));
    if (preg_match('/[\x00-\x09\x0B-\x1F\x7F]/', $t) || nf_tem_invisivel($t) || mb_strlen($t) > $maximo) {
        return null;
    }
    return $t;
}

// Aviso no painel quando o estoque zera ou chega ao mínimo (só na mudança, não a cada edição).
function nf_avisar_estoque(array $config, int $produtoId, string $nome, ?int $antes, int $agora, int $minimo): void
{
    if ($agora === 0 && $antes !== 0) {
        nf_consulta($config, "INSERT INTO notificacoes (tipo, produto_id, resumo) VALUES ('estoque_zerado', ?, ?)",
            [$produtoId, mb_substr("Estoque zerado: {$nome}. O produto aparece como indisponível no site.", 0, 300)]);
    } elseif ($agora > 0 && $minimo > 0 && $agora <= $minimo && ($antes === null || $antes > $minimo || $antes === 0)) {
        nf_consulta($config, "INSERT INTO notificacoes (tipo, produto_id, resumo) VALUES ('estoque_baixo', ?, ?)",
            [$produtoId, mb_substr("Estoque baixo: {$nome} ({$agora} " . ($agora === 1 ? 'unidade' : 'unidades') . ", mínimo {$minimo}).", 0, 300)]);
    }
}

// ---------------------------------------------------------------------------
// Fotos enviadas pelo painel
// ---------------------------------------------------------------------------
// Cada foto é aberta e regravada pelo PHP (GD) como WebP: o arquivo salvo nunca é o que veio do
// navegador (descarta metadados, como a localização GPS, e qualquer conteúdo escondido).
// Original reduzido: <site>/uploads/produtos/<slug>/<código>.webp
// Versões reduzidas: <site>/otim/uploads/produtos/<slug>/<código>-<largura>.webp (lib/carregador-imagens.mjs)

function nf_pasta_protegida(string $pasta): void
{
    if (!is_dir($pasta) && !mkdir($pasta, 0755, true) && !is_dir($pasta)) {
        throw new RuntimeException('Não foi possível criar a pasta de fotos');
    }
    $regras = $pasta . '/.htaccess';
    if (!is_file($regras)) {
        // Só imagens com nome gerado pela API são servidas; nada nesta pasta é executado
        file_put_contents($regras, "# Criado pela API: fotos enviadas pelo painel\n"
            . "Options -Indexes -ExecCGI\n"
            . "RemoveHandler .php .phtml .phar\n"
            . "RemoveType .php .phtml .phar\n"
            . "Require all denied\n"
            . "<FilesMatch \"^[a-z0-9-]+\\.webp$\">\n  Require all granted\n</FilesMatch>\n");
    }
}

// Devolve a URL da foto (/uploads/produtos/<slug>/<código>.webp) ou lança RespostaApi com o erro.
function nf_salvar_foto(array $config, string $slug, array $arquivo): string
{
    if (!function_exists('imagewebp')) {
        nf_erro(503, 'O servidor não tem a extensão de imagens (GD) do PHP ligada. Ative "gd" no seletor de PHP do cPanel.');
    }
    if (($arquivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file((string) $arquivo['tmp_name'])) {
        $erro = $arquivo['error'] ?? UPLOAD_ERR_NO_FILE;
        nf_erro(422, in_array($erro, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
            ? 'Foto grande demais (máximo 8 MB).' : 'Escolha uma foto para enviar.');
    }
    if ((int) $arquivo['size'] > NF_FOTO_BYTES) {
        nf_erro(422, 'Foto grande demais (máximo 8 MB).');
    }
    $tmp = (string) $arquivo['tmp_name'];
    $info = @getimagesize($tmp);
    $tipos = [IMAGETYPE_JPEG => 'imagecreatefromjpeg', IMAGETYPE_PNG => 'imagecreatefrompng', IMAGETYPE_WEBP => 'imagecreatefromwebp'];
    if ($info === false || !isset($tipos[$info[2]])) {
        nf_erro(422, 'Envie uma foto em JPG, PNG ou WebP.');
    }
    [$largura, $altura] = $info;
    if ($largura < 64 || $altura < 64 || $largura * $altura > NF_FOTO_PIXELS) {
        nf_erro(422, 'A foto precisa ter entre 64 pixels e 16 megapixels.');
    }
    ini_set('memory_limit', '256M');
    $imagem = @($tipos[$info[2]])($tmp);
    if (!$imagem instanceof GdImage) {
        nf_erro(422, 'Não foi possível abrir esta foto. Tente outro arquivo.');
    }
    $imagem = nf_foto_girar($imagem, $tmp, $info[2]);
    imagepalettetotruecolor($imagem);
    imagealphablending($imagem, false);
    imagesavealpha($imagem, true);

    $codigo = bin2hex(random_bytes(8));
    $base = "produtos/{$slug}";
    $pastaOriginal = "{$config['pasta_site']}/uploads/{$base}";
    $pastaReduzidas = "{$config['pasta_site']}/otim/uploads/{$base}";
    nf_pasta_protegida("{$config['pasta_site']}/uploads");
    nf_pasta_protegida("{$config['pasta_site']}/otim/uploads");
    foreach ([$pastaOriginal, $pastaReduzidas] as $p) {
        if (!is_dir($p) && !mkdir($p, 0755, true) && !is_dir($p)) {
            throw new RuntimeException('Não foi possível criar a pasta de fotos');
        }
    }
    try {
        nf_gravar_webp($imagem, NF_LARGURAS_FOTO[count(NF_LARGURAS_FOTO) - 1], "{$pastaOriginal}/{$codigo}.webp", 85);
        foreach (NF_LARGURAS_FOTO as $l) {
            nf_gravar_webp($imagem, $l, "{$pastaReduzidas}/{$codigo}-{$l}.webp", 80);
        }
    } catch (Throwable $ex) {
        nf_apagar_foto($config, "/uploads/{$base}/{$codigo}.webp");
        throw $ex;
    }
    return "/uploads/{$base}/{$codigo}.webp";
}

// Foto de celular "deitada": gira conforme a orientação gravada pela câmera (se o PHP tiver EXIF)
function nf_foto_girar(GdImage $imagem, string $arquivo, int $tipo): GdImage
{
    if ($tipo !== IMAGETYPE_JPEG || !function_exists('exif_read_data')) {
        return $imagem;
    }
    $exif = @exif_read_data($arquivo);
    $graus = [3 => 180, 6 => -90, 8 => 90][(int) ($exif['Orientation'] ?? 1)] ?? 0;
    return $graus ? (imagerotate($imagem, $graus, 0) ?: $imagem) : $imagem;
}

// Reduz para a largura (nunca amplia) e grava em WebP
function nf_gravar_webp(GdImage $imagem, int $largura, string $destino, int $qualidade): void
{
    $w = imagesx($imagem);
    $h = imagesy($imagem);
    $saida = $imagem;
    if ($w > $largura) {
        // imagecopyresampled (e não imagescale): funciona em qualquer versão do GD; no servidor da
        // hospedagem, imagescale com IMG_BICUBIC falhava
        $altura = max(1, (int) round($h * $largura / $w));
        $saida = imagecreatetruecolor($largura, $altura);
        if (!$saida instanceof GdImage) {
            throw new RuntimeException('Falha ao reduzir a foto');
        }
        imagealphablending($saida, false);
        imagesavealpha($saida, true);
        imagefill($saida, 0, 0, imagecolorallocatealpha($saida, 255, 255, 255, 127));
        if (!imagecopyresampled($saida, $imagem, 0, 0, 0, 0, $largura, $altura, $w, $h)) {
            throw new RuntimeException('Falha ao reduzir a foto');
        }
    }
    if (!imagewebp($saida, $destino, $qualidade)) {
        throw new RuntimeException('Falha ao gravar a foto');
    }
    chmod($destino, 0644);
}

// Apaga do disco uma foto enviada pelo painel e as versões reduzidas. Fotos que vêm com o código do
// site (/produtos/...) não são apagadas: o arquivo é do site, só sai do produto.
function nf_apagar_foto(array $config, string $url): void
{
    if (!preg_match('#^/uploads/produtos/([a-z0-9-]+)/([a-f0-9]{16})\.webp$#', $url, $m)) {
        return;
    }
    @unlink("{$config['pasta_site']}/uploads/produtos/{$m[1]}/{$m[2]}.webp");
    foreach (NF_LARGURAS_FOTO as $l) {
        @unlink("{$config['pasta_site']}/otim/uploads/produtos/{$m[1]}/{$m[2]}-{$l}.webp");
    }
}
