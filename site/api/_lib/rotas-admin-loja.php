<?php
// Rotas do painel para a loja: pedidos de orçamento, produtos (com estoque e fotos) e publicação do site.
// Todas exigem administrador logado com 2FA; todo POST exige o código CSRF (nf_despachar).
//
//   GET  admin/orcamentos          → lista (?status, busca, pagina)
//   GET  admin/orcamento?id=       → pedido completo
//   POST admin/orcamento-status | orcamento-notas
//   GET  admin/produtos            → lista (?busca, categoria, status, estoque=zerado|baixo, pagina)
//   GET  admin/produto?id=         → produto completo, com fotos
//   POST admin/produto-criar | produto-editar | produto-duplicar | produto-excluir | produto-estoque
//   POST admin/produto-foto        → envio de foto (multipart: produtoId, foto)
//   POST admin/produto-foto-excluir | produto-fotos-ordem
//   POST admin/produtos-importar   → copia para o banco os produtos que hoje estão nos arquivos do site
//   GET  admin/publicacao          → situação da última publicação e se há alterações não publicadas
//   POST admin/publicar            → pede ao GitHub para compilar e publicar o site

declare(strict_types=1);

defined('NF_API') || exit;

const NF_STATUS_ORCAMENTO = ['novo', 'em_atendimento', 'enviado', 'aprovado', 'recusado', 'cancelado'];
const NF_PUBLICAR_INTERVALO = 60; // segundos entre dois pedidos de publicação

function nf_rotas_admin_loja(): array
{
    return [
        'admin/orcamentos' => ['GET' => 'nf_admin_rota_orcamentos'],
        'admin/orcamento' => ['GET' => 'nf_admin_rota_orcamento'],
        'admin/orcamento-status' => ['POST' => 'nf_admin_rota_orcamento_status'],
        'admin/orcamento-notas' => ['POST' => 'nf_admin_rota_orcamento_notas'],
        'admin/produtos' => ['GET' => 'nf_admin_rota_produtos'],
        'admin/produto' => ['GET' => 'nf_admin_rota_produto'],
        'admin/produto-criar' => ['POST' => 'nf_admin_rota_produto_criar'],
        'admin/produto-editar' => ['POST' => 'nf_admin_rota_produto_editar'],
        'admin/produto-duplicar' => ['POST' => 'nf_admin_rota_produto_duplicar'],
        'admin/produto-excluir' => ['POST' => 'nf_admin_rota_produto_excluir'],
        'admin/produto-estoque' => ['POST' => 'nf_admin_rota_produto_estoque'],
        'admin/produto-foto' => ['POST' => 'nf_admin_rota_produto_foto'],
        'admin/produto-foto-excluir' => ['POST' => 'nf_admin_rota_produto_foto_excluir'],
        'admin/produto-fotos-ordem' => ['POST' => 'nf_admin_rota_produto_fotos_ordem'],
        'admin/produtos-importar' => ['POST' => 'nf_admin_rota_produtos_importar'],
        'admin/publicacao' => ['GET' => 'nf_admin_rota_publicacao'],
        'admin/publicar' => ['POST' => 'nf_admin_rota_publicar'],
    ];
}

function nf_historico(array $config, string $alvoTipo, int $alvoId): array
{
    return array_map(fn ($h) => [
        'acao' => $h['acao'], 'detalhes' => $h['detalhes'] === null ? null : json_decode($h['detalhes'], true),
        'admin' => $h['admin'] ?? ($h['admin_id'] === null ? 'Cliente (pelo site)' : '(excluído)'), 'em' => $h['criado_em'],
    ], nf_consulta($config, 'SELECT a.acao, a.detalhes, a.criado_em, a.admin_id, adm.primeiro_nome AS admin
        FROM auditoria a LEFT JOIN usuarios adm ON adm.id = a.admin_id
        WHERE a.alvo_tipo = ? AND a.alvo_id = ? ORDER BY a.criado_em DESC, a.id DESC LIMIT 30', [$alvoTipo, $alvoId]));
}

// ---------------------------------------------------------------------------
// Pedidos de orçamento
// ---------------------------------------------------------------------------

function nf_admin_rota_orcamentos(array $config): never
{
    nf_exigir_admin($config);
    $onde = ['1 = 1'];
    $par = [];
    $status = $_GET['status'] ?? '';
    if (is_string($status) && in_array($status, NF_STATUS_ORCAMENTO, true)) {
        $onde[] = 'o.status = ?';
        $par[] = $status;
    }
    $busca = is_string($_GET['busca'] ?? null) ? mb_substr(trim($_GET['busca']), 0, 100) : '';
    if ($busca !== '') {
        $like = '%' . addcslashes($busca, '%_\\') . '%';
        $onde[] = "(o.codigo LIKE ? OR CONCAT_WS(' ', u.primeiro_nome, u.sobrenome) LIKE ? OR u.email LIKE ? OR u.razao_social LIKE ?)";
        array_push($par, $like, $like, $like, $like);
    }
    $onde = implode(' AND ', $onde);
    $pagina = nf_pagina();
    $total = (int) nf_consulta($config, "SELECT COUNT(*) AS n FROM orcamentos o LEFT JOIN usuarios u ON u.id = o.usuario_id WHERE {$onde}", $par)[0]['n'];
    $lista = nf_consulta($config, "SELECT o.id, o.codigo, o.status, o.criado_em, o.atualizado_em, u.id AS cliente_id,
            u.primeiro_nome, u.sobrenome, u.tipo_pessoa, u.razao_social,
            (SELECT SUM(i.quantidade) FROM orcamento_itens i WHERE i.orcamento_id = o.id) AS itens
        FROM orcamentos o LEFT JOIN usuarios u ON u.id = o.usuario_id
        WHERE {$onde} ORDER BY o.criado_em DESC, o.id DESC LIMIT " . NF_POR_PAGINA . ' OFFSET ' . (($pagina - 1) * NF_POR_PAGINA), $par);
    nf_responder(200, ['total' => $total, 'pagina' => $pagina, 'porPagina' => NF_POR_PAGINA, 'orcamentos' => array_map(fn ($o) => [
        'id' => $o['id'], 'codigo' => $o['codigo'], 'status' => $o['status'], 'itens' => (int) $o['itens'],
        'criadoEm' => $o['criado_em'], 'atualizadoEm' => $o['atualizado_em'], 'clienteId' => $o['cliente_id'],
        'cliente' => $o['cliente_id'] === null ? null : "{$o['primeiro_nome']} {$o['sobrenome']}",
        'empresa' => $o['tipo_pessoa'] === 'PJ' ? $o['razao_social'] : null,
    ], $lista)]);
}

function nf_buscar_orcamento(array $config, int $id): array
{
    $o = nf_consulta($config, 'SELECT * FROM orcamentos WHERE id = ?', [$id])[0] ?? null;
    if ($o === null) {
        nf_erro(404, 'Pedido de orçamento não encontrado.');
    }
    return $o;
}

function nf_admin_rota_orcamento(array $config): never
{
    nf_exigir_admin($config);
    $o = nf_buscar_orcamento($config, nf_id_da_url('Pedido inválido.'));
    $u = $o['usuario_id'] === null ? null : (nf_consulta($config, 'SELECT id, primeiro_nome, sobrenome, email, telefone, tipo_pessoa,
        documento, razao_social, nome_fantasia FROM usuarios WHERE id = ?', [$o['usuario_id']])[0] ?? null);
    $en = $o['endereco_id'] === null ? null : (nf_consulta($config, 'SELECT cep, rua, numero, complemento, bairro, cidade, uf
        FROM enderecos WHERE id = ?', [$o['endereco_id']])[0] ?? null);
    $atendente = $o['atendido_por'] === null ? null
        : (nf_consulta($config, 'SELECT primeiro_nome FROM usuarios WHERE id = ?', [$o['atendido_por']])[0]['primeiro_nome'] ?? null);
    $itens = nf_consulta($config, 'SELECT i.produto_id, i.produto_slug, i.produto_nome, i.modalidade, i.quantidade, p.id AS existe
        FROM orcamento_itens i LEFT JOIN produtos p ON p.id = i.produto_id WHERE i.orcamento_id = ? ORDER BY i.id', [$o['id']]);
    nf_responder(200, ['orcamento' => [
        'id' => $o['id'], 'codigo' => $o['codigo'], 'status' => $o['status'],
        'observacoesCliente' => $o['observacoes_cliente'], 'observacoesInternas' => $o['observacoes_internas'],
        'atendidoPor' => $atendente, 'criadoEm' => $o['criado_em'], 'atualizadoEm' => $o['atualizado_em'],
        'cliente' => $u === null ? null : [
            'id' => $u['id'], 'nome' => "{$u['primeiro_nome']} {$u['sobrenome']}", 'email' => $u['email'], 'telefone' => $u['telefone'],
            'tipo' => $u['tipo_pessoa'] === 'PJ' ? 'cnpj' : 'cpf', 'documento' => $u['documento'],
            'razaoSocial' => $u['razao_social'], 'nomeFantasia' => $u['nome_fantasia'],
        ],
        'endereco' => $en,
        'itens' => array_map(fn ($i) => ['produtoId' => $i['existe'], 'slug' => $i['produto_slug'], 'nome' => $i['produto_nome'],
            'modalidade' => $i['modalidade'], 'quantidade' => (int) $i['quantidade']], $itens),
        'historico' => nf_historico($config, 'orcamento', (int) $o['id']),
    ]]);
}

function nf_admin_rota_orcamento_status(array $config): never
{
    $admin = nf_exigir_admin($config);
    $d = nf_ler_json();
    $o = nf_buscar_orcamento($config, nf_id_do_corpo($d, 'Pedido inválido.'));
    $status = $d['status'] ?? null;
    if (!in_array($status, NF_STATUS_ORCAMENTO, true)) {
        nf_erro(422, 'Situação inválida.');
    }
    if ($status !== $o['status']) {
        // Quem mexe primeiro no pedido fica como responsável
        nf_consulta($config, 'UPDATE orcamentos SET status = ?, atendido_por = COALESCE(atendido_por, ?) WHERE id = ?',
            [$status, $admin['id'], $o['id']]);
        nf_auditar($config, (int) $admin['id'], 'orcamento_status', 'orcamento', (int) $o['id'], ['de' => $o['status'], 'para' => $status]);
    }
    nf_responder(200, ['ok' => true, 'status' => $status]);
}

function nf_admin_rota_orcamento_notas(array $config): never
{
    $admin = nf_exigir_admin($config);
    $d = nf_ler_json();
    $o = nf_buscar_orcamento($config, nf_id_do_corpo($d, 'Pedido inválido.'));
    $notas = nf_texto_longo($d['observacoes'] ?? null, 5000);
    if ($notas === null) {
        nf_erro(422, 'Confira os campos destacados.', ['campos' => ['observacoes' => 'Anotações inválidas (até 5.000 caracteres).']]);
    }
    if ($notas !== (string) $o['observacoes_internas']) {
        nf_consulta($config, 'UPDATE orcamentos SET observacoes_internas = ?, atendido_por = COALESCE(atendido_por, ?) WHERE id = ?',
            [$notas === '' ? null : $notas, $admin['id'], $o['id']]);
        nf_auditar($config, (int) $admin['id'], 'orcamento_notas', 'orcamento', (int) $o['id']);
    }
    nf_responder(200, ['ok' => true]);
}

// ---------------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------------

function nf_produto_publico(array $p): array
{
    return [
        'id' => $p['id'], 'slug' => $p['slug'], 'marca' => $p['marca'], 'modelo' => $p['modelo'], 'nome' => $p['nome'],
        'titulo' => nf_titulo_produto($p), 'categoria' => $p['categoria'], 'impressao' => $p['impressao'], 'condicao' => $p['condicao'],
        'resumo' => $p['resumo'], 'disponivelVenda' => (bool) $p['disponivel_venda'], 'disponivelLocacao' => (bool) $p['disponivel_locacao'],
        'estoque' => (int) $p['estoque'], 'estoqueMinimo' => (int) $p['estoque_minimo'], 'status' => $p['status'],
        'destaque' => (bool) $p['destaque'], 'ordem' => (int) $p['ordem'], 'atualizadoEm' => $p['atualizado_em'],
    ];
}

function nf_buscar_produto(array $config, int $id): array
{
    $p = nf_consulta($config, 'SELECT * FROM produtos WHERE id = ?', [$id])[0] ?? null;
    if ($p === null) {
        nf_erro(404, 'Produto não encontrado.');
    }
    return $p;
}

function nf_admin_rota_produtos(array $config): never
{
    nf_exigir_admin($config);
    $onde = ['1 = 1'];
    $par = [];
    $busca = is_string($_GET['busca'] ?? null) ? mb_substr(trim($_GET['busca']), 0, 100) : '';
    if ($busca !== '') {
        $like = '%' . addcslashes($busca, '%_\\') . '%';
        $onde[] = '(p.nome LIKE ? OR p.marca LIKE ? OR p.modelo LIKE ? OR p.slug LIKE ?)';
        array_push($par, $like, $like, $like, $like);
    }
    $categoria = $_GET['categoria'] ?? '';
    if (is_string($categoria) && in_array($categoria, NF_CATEGORIAS, true)) {
        $onde[] = 'p.categoria = ?';
        $par[] = $categoria;
    }
    $filtros = [
        'status' => ['ativo' => "p.status = 'ativo'", 'oculto' => "p.status = 'oculto'"],
        'estoque' => ['zerado' => 'p.estoque = 0', 'baixo' => 'p.estoque > 0 AND p.estoque_minimo > 0 AND p.estoque <= p.estoque_minimo'],
    ];
    foreach ($filtros as $param => $opcoes) {
        $v = $_GET[$param] ?? '';
        if (is_string($v) && isset($opcoes[$v])) {
            $onde[] = $opcoes[$v];
        }
    }
    $onde = implode(' AND ', $onde);
    $pagina = nf_pagina();
    $total = (int) nf_consulta($config, "SELECT COUNT(*) AS n FROM produtos p WHERE {$onde}", $par)[0]['n'];
    $lista = nf_consulta($config, "SELECT p.*, (SELECT f.url FROM produto_fotos f WHERE f.produto_id = p.id ORDER BY f.ordem, f.id LIMIT 1) AS foto
        FROM produtos p WHERE {$onde} ORDER BY p.ordem, p.id LIMIT " . NF_POR_PAGINA . ' OFFSET ' . (($pagina - 1) * NF_POR_PAGINA), $par);
    nf_responder(200, ['total' => $total, 'pagina' => $pagina, 'porPagina' => NF_POR_PAGINA,
        'produtos' => array_map(fn ($p) => nf_produto_publico($p) + ['foto' => $p['foto']], $lista)]);
}

function nf_admin_rota_produto(array $config): never
{
    nf_exigir_admin($config);
    $p = nf_buscar_produto($config, nf_id_da_url('Produto inválido.'));
    $fotos = nf_consulta($config, 'SELECT id, url, texto_alternativo, ordem FROM produto_fotos WHERE produto_id = ? ORDER BY ordem, id', [$p['id']]);
    nf_responder(200, ['produto' => nf_produto_publico($p) + [
        'descricao' => (string) $p['descricao'],
        'precoReferencia' => $p['preco_referencia_centavos'] === null ? null : (int) $p['preco_referencia_centavos'],
        'criadoEm' => $p['criado_em'],
        'fotos' => array_map(fn ($f) => ['id' => $f['id'], 'url' => $f['url'], 'alt' => $f['texto_alternativo']], $fotos),
        'historico' => nf_historico($config, 'produto', (int) $p['id']),
    ]]);
}

function nf_erro_slug_repetido(PDOException $ex): never
{
    if (($ex->errorInfo[1] ?? 0) === 1062) {
        nf_erro(409, 'Já existe um produto com este endereço.', ['campos' => ['slug' => 'Já existe um produto com este endereço. Escolha outro.']]);
    }
    throw $ex;
}

function nf_admin_rota_produto_criar(array $config): never
{
    $admin = nf_exigir_admin($config);
    [$v, $erros] = nf_validar_produto(nf_ler_json());
    if ($erros) {
        nf_erro(422, 'Confira os campos destacados.', ['campos' => $erros]);
    }
    $colunas = array_keys($v);
    $banco = nf_banco($config);
    $banco->beginTransaction();
    try {
        nf_consulta($config, 'INSERT INTO produtos (' . implode(', ', $colunas) . ') VALUES (' . implode(', ', array_fill(0, count($colunas), '?')) . ')',
            array_values($v));
        $id = (int) $banco->lastInsertId();
        nf_avisar_estoque($config, $id, nf_titulo_produto($v), null, $v['estoque'], $v['estoque_minimo']);
        nf_auditar($config, (int) $admin['id'], 'produto_criar', 'produto', $id, ['slug' => $v['slug']]);
        $banco->commit();
    } catch (PDOException $ex) {
        $banco->rollBack();
        nf_erro_slug_repetido($ex);
    }
    nf_responder(201, ['id' => $id]);
}

function nf_admin_rota_produto_editar(array $config): never
{
    $admin = nf_exigir_admin($config);
    $d = nf_ler_json();
    $atual = nf_buscar_produto($config, nf_id_do_corpo($d, 'Produto inválido.'));
    [$v, $erros] = nf_validar_produto($d);
    if ($erros) {
        nf_erro(422, 'Confira os campos destacados.', ['campos' => $erros]);
    }
    // Só os nomes dos campos alterados vão para o histórico (o preço de referência fica fora dele)
    $alterados = array_keys(array_filter($v, fn ($valor, $campo) => (string) $atual[$campo] !== (string) $valor, ARRAY_FILTER_USE_BOTH));
    if ($alterados) {
        $banco = nf_banco($config);
        $banco->beginTransaction();
        try {
            nf_consulta($config, 'UPDATE produtos SET ' . implode(', ', array_map(fn ($c) => "{$c} = ?", array_keys($v))) . ' WHERE id = ?',
                [...array_values($v), $atual['id']]);
            nf_avisar_estoque($config, (int) $atual['id'], nf_titulo_produto($v), (int) $atual['estoque'], $v['estoque'], $v['estoque_minimo']);
            nf_auditar($config, (int) $admin['id'], 'produto_editar', 'produto', (int) $atual['id'], ['campos' => $alterados]);
            $banco->commit();
        } catch (PDOException $ex) {
            $banco->rollBack();
            nf_erro_slug_repetido($ex);
        }
    }
    nf_responder(200, ['ok' => true, 'alterados' => $alterados]);
}

// "ricoh-mp-c3502" → "ricoh-mp-c3502-copia" (ou -copia-2, -copia-3...: o primeiro livre)
function nf_slug_da_copia(array $config, string $slug): string
{
    $base = rtrim(substr(preg_replace('/-copia(-\d+)?$/', '', $slug), 0, 110), '-');
    for ($n = 1; ; $n++) {
        $novo = $base . '-copia' . ($n > 1 ? "-{$n}" : '');
        if (!nf_consulta($config, 'SELECT 1 FROM produtos WHERE slug = ?', [$novo])) {
            return $novo;
        }
    }
}

// Cria uma cópia oculta do produto, com as fotos, para o admin alterar só o que for diferente.
function nf_admin_rota_produto_duplicar(array $config): never
{
    $admin = nf_exigir_admin($config);
    $p = nf_buscar_produto($config, nf_id_do_corpo(nf_ler_json(), 'Produto inválido.'));
    $fotos = nf_consulta($config, 'SELECT url, texto_alternativo, ordem FROM produto_fotos WHERE produto_id = ? ORDER BY ordem, id', [$p['id']]);
    $slug = nf_slug_da_copia($config, $p['slug']);
    $colunas = ['marca', 'modelo', 'categoria', 'impressao', 'condicao', 'resumo', 'descricao', 'disponivel_venda', 'disponivel_locacao',
        'estoque', 'estoque_minimo', 'preco_referencia_centavos', 'ordem'];
    $v = array_intersect_key($p, array_flip($colunas)) + [
        'slug' => $slug, 'nome' => mb_substr($p['nome'], 0, 152) . ' (cópia)', 'status' => 'oculto', 'destaque' => 0,
    ];
    $banco = nf_banco($config);
    $banco->beginTransaction();
    $copiadas = [];
    try {
        nf_consulta($config, 'INSERT INTO produtos (' . implode(', ', array_keys($v)) . ') VALUES (' . implode(', ', array_fill(0, count($v), '?')) . ')',
            array_values($v));
        $id = (int) $banco->lastInsertId();
        foreach ($fotos as $f) {
            $url = $copiadas[] = nf_copiar_foto($config, $f['url'], $slug);
            nf_consulta($config, 'INSERT INTO produto_fotos (produto_id, url, texto_alternativo, ordem) VALUES (?, ?, ?, ?)',
                [$id, $url, $f['texto_alternativo'], $f['ordem']]);
        }
        nf_auditar($config, (int) $admin['id'], 'produto_duplicar', 'produto', $id, ['slug' => $p['slug']]);
        $banco->commit();
    } catch (Throwable $ex) {
        $banco->rollBack();
        foreach ($copiadas as $url) {
            nf_apagar_foto($config, $url);
        }
        if ($ex instanceof PDOException) {
            nf_erro_slug_repetido($ex);
        }
        throw $ex;
    }
    nf_responder(201, ['id' => $id]);
}

function nf_admin_rota_produto_excluir(array $config): never
{
    $admin = nf_exigir_admin($config);
    $d = nf_ler_json();
    $p = nf_buscar_produto($config, nf_id_do_corpo($d, 'Produto inválido.'));
    if (!is_string($d['confirmacao'] ?? null) || !hash_equals($p['slug'], trim($d['confirmacao']))) {
        nf_erro(422, 'Para excluir, digite o endereço do produto exatamente como está.', ['campos' => ['confirmacao' => 'O endereço não confere.']]);
    }
    $fotos = nf_consulta($config, 'SELECT url FROM produto_fotos WHERE produto_id = ?', [$p['id']]);
    // Pedidos antigos continuam com o nome do produto (orcamento_itens guarda uma cópia)
    nf_consulta($config, 'DELETE FROM produtos WHERE id = ?', [$p['id']]);
    nf_auditar($config, (int) $admin['id'], 'produto_excluir', 'produto', (int) $p['id'], ['slug' => $p['slug'], 'nome' => nf_titulo_produto($p)]);
    foreach ($fotos as $f) {
        nf_apagar_foto($config, $f['url']);
    }
    nf_responder(200, ['ok' => true]);
}

function nf_admin_rota_produto_estoque(array $config): never
{
    $admin = nf_exigir_admin($config);
    $d = nf_ler_json();
    $p = nf_buscar_produto($config, nf_id_do_corpo($d, 'Produto inválido.'));
    $estoque = $d['estoque'] ?? null;
    $minimo = $d['estoqueMinimo'] ?? (int) $p['estoque_minimo'];
    if (!is_int($estoque) || $estoque < 0 || $estoque > 65535 || !is_int($minimo) || $minimo < 0 || $minimo > 65535) {
        nf_erro(422, 'Digite uma quantidade de 0 ou mais.', ['campos' => ['estoque' => 'Quantidade inválida.']]);
    }
    if ($estoque !== (int) $p['estoque'] || $minimo !== (int) $p['estoque_minimo']) {
        nf_consulta($config, 'UPDATE produtos SET estoque = ?, estoque_minimo = ? WHERE id = ?', [$estoque, $minimo, $p['id']]);
        nf_avisar_estoque($config, (int) $p['id'], nf_titulo_produto($p), (int) $p['estoque'], $estoque, $minimo);
        nf_auditar($config, (int) $admin['id'], 'produto_estoque', 'produto', (int) $p['id'],
            ['de' => (int) $p['estoque'], 'para' => $estoque, 'minimo' => $minimo]);
    }
    nf_responder(200, ['ok' => true, 'estoque' => $estoque, 'estoqueMinimo' => $minimo]);
}

// Envio de foto: multipart/form-data (o único pedido da API que não é JSON)
function nf_admin_rota_produto_foto(array $config): never
{
    $admin = nf_exigir_admin($config);
    $tipo = $_SERVER['CONTENT_TYPE'] ?? '';
    if (!preg_match('#^multipart/form-data\s*;#i', $tipo)) {
        nf_erro(415, 'Envie a foto como formulário (multipart/form-data).');
    }
    $id = $_POST['produtoId'] ?? '';
    if (!is_string($id) || !ctype_digit($id) || (int) $id < 1) {
        nf_erro(422, 'Produto inválido.');
    }
    $p = nf_buscar_produto($config, (int) $id);
    $alt = nf_texto($_POST['alt'] ?? null, 200, false);
    if ($alt === null) {
        nf_erro(422, 'Descrição da foto inválida (até 200 letras).');
    }
    $existentes = nf_consulta($config, 'SELECT COUNT(*) AS n, COALESCE(MAX(ordem), 0) AS ultima FROM produto_fotos WHERE produto_id = ?', [$p['id']])[0];
    if ((int) $existentes['n'] >= NF_FOTOS_POR_PRODUTO) {
        nf_erro(422, 'Este produto já tem ' . NF_FOTOS_POR_PRODUTO . ' fotos. Apague uma antes de enviar outra.');
    }
    $arquivo = $_FILES['foto'] ?? null;
    if (!is_array($arquivo) || is_array($arquivo['name'] ?? null)) {
        nf_erro(422, 'Escolha uma foto para enviar.');
    }
    $url = nf_salvar_foto($config, $p['slug'], $arquivo);
    try {
        nf_consulta($config, 'INSERT INTO produto_fotos (produto_id, url, texto_alternativo, ordem) VALUES (?, ?, ?, ?)',
            [$p['id'], $url, $alt === '' ? null : $alt, (int) $existentes['ultima'] + 1]);
    } catch (Throwable $ex) {
        nf_apagar_foto($config, $url);
        throw $ex;
    }
    $fotoId = (int) nf_banco($config)->lastInsertId();
    nf_auditar($config, (int) $admin['id'], 'produto_foto_enviar', 'produto', (int) $p['id']);
    nf_responder(201, ['id' => $fotoId, 'url' => $url]);
}

function nf_admin_rota_produto_foto_excluir(array $config): never
{
    $admin = nf_exigir_admin($config);
    $d = nf_ler_json();
    $id = nf_id_do_corpo($d, 'Foto inválida.');
    $f = nf_consulta($config, 'SELECT id, produto_id, url FROM produto_fotos WHERE id = ?', [$id])[0] ?? null;
    if ($f === null) {
        nf_erro(404, 'Foto não encontrada.');
    }
    nf_consulta($config, 'DELETE FROM produto_fotos WHERE id = ?', [$f['id']]);
    nf_apagar_foto($config, $f['url']);
    nf_auditar($config, (int) $admin['id'], 'produto_foto_excluir', 'produto', (int) $f['produto_id']);
    nf_responder(200, ['ok' => true]);
}

// Nova ordem das fotos: a primeira é a foto principal (cartão da loja)
function nf_admin_rota_produto_fotos_ordem(array $config): never
{
    $admin = nf_exigir_admin($config);
    $d = nf_ler_json();
    $p = nf_buscar_produto($config, nf_id_do_corpo($d, 'Produto inválido.', 'produtoId'));
    $ids = $d['ids'] ?? null;
    $atuais = array_map('intval', array_column(nf_consulta($config, 'SELECT id FROM produto_fotos WHERE produto_id = ?', [$p['id']]), 'id'));
    if (!is_array($ids) || !array_is_list($ids) || array_filter($ids, fn ($i) => !is_int($i))
        || count($ids) !== count($atuais) || array_diff($atuais, $ids) || count(array_unique($ids)) !== count($ids)) {
        nf_erro(422, 'A lista de fotos não confere. Recarregue a página e tente de novo.');
    }
    $banco = nf_banco($config);
    $banco->beginTransaction();
    try {
        // Duas etapas por causa da chave única (produto_id, ordem)
        nf_consulta($config, 'UPDATE produto_fotos SET ordem = -ordem - 1000 WHERE produto_id = ?', [$p['id']]);
        foreach ($ids as $i => $fotoId) {
            nf_consulta($config, 'UPDATE produto_fotos SET ordem = ? WHERE id = ? AND produto_id = ?', [$i + 1, $fotoId, $p['id']]);
        }
        nf_auditar($config, (int) $admin['id'], 'produto_fotos_ordem', 'produto', (int) $p['id']);
        $banco->commit();
    } catch (Throwable $ex) {
        $banco->rollBack();
        throw $ex;
    }
    nf_responder(200, ['ok' => true]);
}

// Primeira carga: copia para o banco os produtos que estão nos arquivos do site (só com o banco vazio).
// Cada produto entra com 1 unidade em estoque (ajuste no painel) e as fotos que já estão no site.
function nf_admin_rota_produtos_importar(array $config): never
{
    $admin = nf_exigir_admin($config);
    if ((int) nf_consulta($config, 'SELECT COUNT(*) AS n FROM produtos')[0]['n'] > 0) {
        nf_erro(409, 'O banco já tem produtos. A importação só funciona uma vez, com o cadastro vazio.');
    }
    $arquivo = dirname(__DIR__) . '/_dados/produtos-iniciais.json';
    $lista = is_file($arquivo) ? json_decode((string) file_get_contents($arquivo), true) : null;
    if (!is_array($lista) || !$lista) {
        nf_erro(503, 'Lista de produtos do site não encontrada (publique o site de novo).');
    }
    $banco = nf_banco($config);
    $banco->beginTransaction();
    try {
        foreach ($lista as $p) {
            [$v, $erros] = nf_validar_produto($p + ['estoque' => 1, 'estoqueMinimo' => 0, 'status' => 'ativo', 'precoReferencia' => null]);
            if ($erros) {
                throw new RuntimeException("Produto {$p['slug']} inválido: " . implode(', ', array_keys($erros)));
            }
            $colunas = array_keys($v);
            nf_consulta($config, 'INSERT INTO produtos (' . implode(', ', $colunas) . ') VALUES (' . implode(', ', array_fill(0, count($colunas), '?')) . ')',
                array_values($v));
            $id = (int) $banco->lastInsertId();
            foreach (array_values($p['fotos']) as $i => $url) {
                nf_consulta($config, 'INSERT INTO produto_fotos (produto_id, url, ordem) VALUES (?, ?, ?)', [$id, $url, $i + 1]);
            }
        }
        nf_auditar($config, (int) $admin['id'], 'produtos_importar', 'sistema', null, ['quantidade' => count($lista)]);
        $banco->commit();
    } catch (Throwable $ex) {
        $banco->rollBack();
        throw $ex;
    }
    nf_responder(201, ['ok' => true, 'quantidade' => count($lista)]);
}

// ---------------------------------------------------------------------------
// Publicação do site (GitHub Actions)
// ---------------------------------------------------------------------------

// Há mudança de produto (fora o estoque, que o site lê ao vivo) depois da última publicação?
function nf_alteracoes_pendentes(array $config): bool
{
    $r = nf_consulta($config, "SELECT
        (SELECT MAX(criado_em) FROM auditoria WHERE acao = 'site_publicar') AS publicado,
        (SELECT MAX(criado_em) FROM auditoria WHERE (alvo_tipo = 'produto' AND acao <> 'produto_estoque') OR acao = 'produtos_importar') AS alterado")[0];
    return $r['alterado'] !== null && ($r['publicado'] === null || $r['alterado'] > $r['publicado']);
}

function nf_admin_rota_publicacao(array $config): never
{
    nf_exigir_admin($config);
    $g = nf_github_config($config);
    nf_responder(200, [
        'configurada' => $g !== null,
        'ramo' => $g['ramo'] ?? null,
        'pendente' => nf_alteracoes_pendentes($config),
        'ultima' => $g === null ? null : nf_github_ultima_publicacao($g),
    ]);
}

function nf_admin_rota_publicar(array $config): never
{
    $admin = nf_exigir_admin($config);
    $g = nf_github_config($config);
    if ($g === null) {
        nf_erro(503, 'A publicação pelo painel ainda não foi configurada (bloco "github" na configuração do servidor).');
    }
    $recente = nf_consulta($config, "SELECT 1 FROM auditoria WHERE acao = 'site_publicar' AND criado_em > NOW() - INTERVAL ? SECOND LIMIT 1",
        [NF_PUBLICAR_INTERVALO]);
    if ($recente) {
        nf_erro(429, 'Uma publicação acabou de ser pedida. Espere um minuto.');
    }
    $ultima = nf_github_ultima_publicacao($g);
    if ($ultima !== null && in_array($ultima['situacao'], ['na_fila', 'publicando', 'aguardando_aprovacao'], true)) {
        nf_erro(409, $ultima['situacao'] === 'aguardando_aprovacao'
            ? 'A última publicação está esperando aprovação no GitHub. Aprove ou cancele antes de pedir outra.'
            : 'Já existe uma publicação em andamento. Espere terminar (leva alguns minutos).');
    }
    if (!nf_github_publicar($g)) {
        nf_erro(502, 'O GitHub não aceitou o pedido de publicação. Confira o token na configuração do servidor.');
    }
    nf_auditar($config, (int) $admin['id'], 'site_publicar', 'sistema', null, ['ramo' => $g['ramo']]);
    nf_responder(202, ['ok' => true]);
}
