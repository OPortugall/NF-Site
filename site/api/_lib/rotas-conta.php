<?php
// Rotas públicas do site e da área do cliente ("Minha conta").
//
// Públicas (funcionam também com as contas desligadas):
//   GET  /api/catalogo            → { produtos: [...] }   produtos visíveis, com fotos (usado na compilação do site)
//   GET  /api/estoque             → { estoque: { slug: quantidade } }  (0 = indisponível; produto oculto conta como 0)
//
// Cliente logado (só com as contas ligadas):
//   GET  /api/conta               → { cliente: dados do cadastro }
//   GET  /api/orcamentos          → { orcamentos: [...] }  pedidos de orçamento do cliente e a situação de cada um
//   POST /api/orcamento-criar     → 201 { codigo }         itens do carrinho viram um pedido de orçamento
//   POST /api/orcamento-cancelar  → { ok }                 só enquanto o pedido não foi atendido
//   POST /api/conta-excluir       → { ok }                 senha + "EXCLUIR": apaga a conta e avisa o painel

declare(strict_types=1);

defined('NF_API') || exit;

const NF_ORCAMENTO_MAX_ITENS = 30;
const NF_ORCAMENTOS_POR_HORA = 10;
const NF_CODIGO_LETRAS = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // sem I e O (confundem com 1 e 0)
const NF_AVISO_EXCLUSAO_DIAS = 90; // aviso de conta excluída (com nome e contato) fica no painel por 90 dias
// Mensagens do campo de senha (em constantes: o verificar.py barra texto fixo na chave "senha" do código da API)
const NF_SENHA_VAZIA = 'Digite a sua senha.';
const NF_SENHA_INCORRETA = 'Senha incorreta.';

function nf_rotas_publicas(): array
{
    return [
        'catalogo' => ['GET' => 'nf_rota_catalogo'],
        'estoque' => ['GET' => 'nf_rota_estoque'],
    ];
}

function nf_rotas_conta(): array
{
    return [
        'conta' => ['GET' => 'nf_rota_conta'],
        'orcamentos' => ['GET' => 'nf_rota_orcamentos'],
        'orcamento-criar' => ['POST' => 'nf_rota_orcamento_criar'],
        'orcamento-cancelar' => ['POST' => 'nf_rota_orcamento_cancelar'],
        'conta-excluir' => ['POST' => 'nf_rota_conta_excluir'],
    ];
}

// ---------------------------------------------------------------------------
// Catálogo e estoque (públicos: os mesmos dados que o site mostra; nunca o preço de referência)
// ---------------------------------------------------------------------------

function nf_rota_catalogo(array $config): never
{
    $produtos = nf_consulta($config, "SELECT id, slug, marca, modelo, nome, categoria, impressao, condicao, resumo, descricao,
            disponivel_venda, disponivel_locacao, estoque, destaque
        FROM produtos WHERE status = 'ativo' ORDER BY ordem, id");
    $fotos = [];
    foreach (nf_consulta($config, "SELECT f.produto_id, f.url, f.texto_alternativo FROM produto_fotos f
            JOIN produtos p ON p.id = f.produto_id AND p.status = 'ativo' ORDER BY f.produto_id, f.ordem, f.id") as $f) {
        $fotos[$f['produto_id']][] = ['url' => $f['url'], 'alt' => $f['texto_alternativo']];
    }
    nf_responder(200, ['produtos' => array_map(fn ($p) => [
        'id' => $p['id'], 'slug' => $p['slug'], 'marca' => $p['marca'], 'modelo' => $p['modelo'], 'nome' => $p['nome'],
        'categoria' => $p['categoria'], 'impressao' => $p['impressao'], 'condicao' => $p['condicao'], 'resumo' => $p['resumo'],
        'descricao' => (string) $p['descricao'], 'disponivelVenda' => (bool) $p['disponivel_venda'],
        'disponivelLocacao' => (bool) $p['disponivel_locacao'], 'estoque' => (int) $p['estoque'], 'destaque' => (bool) $p['destaque'],
        'fotos' => $fotos[$p['id']] ?? [],
    ], $produtos)]);
}

function nf_rota_estoque(array $config): never
{
    $estoque = [];
    foreach (nf_consulta($config, 'SELECT slug, estoque, status FROM produtos') as $p) {
        $estoque[$p['slug']] = $p['status'] === 'ativo' ? (int) $p['estoque'] : 0;
    }
    nf_responder(200, ['estoque' => (object) $estoque]);
}

// ---------------------------------------------------------------------------
// Área do cliente
// ---------------------------------------------------------------------------

// Cliente logado (linha completa do banco) ou 401
function nf_exigir_cliente(array $config): array
{
    nf_iniciar_sessao($config);
    $id = $_SESSION['usuario_id'] ?? null;
    $u = is_int($id) ? (nf_consulta($config, "SELECT * FROM usuarios WHERE id = ? AND status = 'ativo'", [$id])[0] ?? null) : null;
    if ($u === null) {
        nf_limpar_login();
        nf_erro(401, 'Entre na sua conta para continuar.', ['codigo' => 'login']);
    }
    return $u;
}

function nf_endereco_principal(array $config, int $usuarioId): ?array
{
    return nf_consulta($config, 'SELECT id, cep, rua, numero, complemento, bairro, cidade, uf FROM enderecos
        WHERE usuario_id = ? ORDER BY principal DESC, id LIMIT 1', [$usuarioId])[0] ?? null;
}

function nf_rota_conta(array $config): never
{
    $u = nf_exigir_cliente($config);
    $en = nf_endereco_principal($config, (int) $u['id']);
    unset($en['id']);
    nf_responder(200, ['cliente' => [
        'nome' => $u['primeiro_nome'], 'sobrenome' => $u['sobrenome'], 'email' => $u['email'], 'telefone' => $u['telefone'],
        'tipo' => $u['tipo_pessoa'] === 'PJ' ? 'cnpj' : 'cpf', 'documento' => $u['documento'],
        'razaoSocial' => $u['razao_social'], 'nomeFantasia' => $u['nome_fantasia'],
        'endereco' => $en, 'criadoEm' => $u['criado_em'],
    ]]);
}

function nf_rota_orcamentos(array $config): never
{
    $u = nf_exigir_cliente($config);
    $lista = nf_consulta($config, 'SELECT id, codigo, status, observacoes_cliente, criado_em, atualizado_em FROM orcamentos
        WHERE usuario_id = ? ORDER BY criado_em DESC, id DESC LIMIT 200', [$u['id']]);
    $itens = [];
    if ($lista) {
        $ids = array_column($lista, 'id');
        $marcas = implode(',', array_fill(0, count($ids), '?'));
        foreach (nf_consulta($config, "SELECT orcamento_id, produto_slug, produto_nome, modalidade, quantidade
                FROM orcamento_itens WHERE orcamento_id IN ({$marcas}) ORDER BY id", $ids) as $i) {
            $itens[$i['orcamento_id']][] = ['slug' => $i['produto_slug'], 'nome' => $i['produto_nome'],
                'modalidade' => $i['modalidade'], 'quantidade' => (int) $i['quantidade']];
        }
    }
    nf_responder(200, ['orcamentos' => array_map(fn ($o) => [
        'codigo' => $o['codigo'], 'status' => $o['status'], 'observacoes' => $o['observacoes_cliente'],
        'criadoEm' => $o['criado_em'], 'atualizadoEm' => $o['atualizado_em'], 'itens' => $itens[$o['id']] ?? [],
    ], $lista)]);
}

function nf_codigo_orcamento(): string
{
    $c = 'NF-';
    for ($i = 0; $i < 8; $i++) {
        $c .= NF_CODIGO_LETRAS[random_int(0, strlen(NF_CODIGO_LETRAS) - 1)];
    }
    return $c;
}

function nf_rota_orcamento_criar(array $config): never
{
    $u = nf_exigir_cliente($config);
    $d = nf_ler_json();
    $lista = $d['itens'] ?? null;
    if (!is_array($lista) || !array_is_list($lista) || !$lista || count($lista) > NF_ORCAMENTO_MAX_ITENS) {
        nf_erro(422, 'O carrinho está vazio ou tem itens demais.');
    }
    $observacoes = nf_texto_longo($d['observacoes'] ?? null, 1000);
    if ($observacoes === null) {
        nf_erro(422, 'Confira os campos destacados.', ['campos' => ['observacoes' => 'Observações inválidas (até 1.000 caracteres).']]);
    }
    $empresa = $u['tipo_pessoa'] === 'PJ';
    $catalogo = nf_catalogo_atual($config);
    $itens = [];
    $problemas = [];
    foreach ($lista as $i) {
        $slug = is_array($i) && is_string($i['slug'] ?? null) ? $i['slug'] : '';
        $modalidade = is_array($i) ? ($i['modalidade'] ?? null) : null;
        $qtd = is_array($i) ? ($i['quantidade'] ?? null) : null;
        if (!in_array($modalidade, ['compra', 'locacao'], true) || !is_int($qtd) || $qtd < 1 || $qtd > 99) {
            nf_erro(422, 'Item do carrinho inválido.');
        }
        $p = $catalogo[$slug] ?? null;
        if ($p === null || !$p['ativo']) {
            $problemas[] = ['slug' => $slug, 'motivo' => 'Este produto não está mais disponível no site.'];
            continue;
        }
        if ($p['estoque'] === 0) {
            $problemas[] = ['slug' => $slug, 'motivo' => "{$p['nome']} está indisponível no momento."];
            continue;
        }
        if ($modalidade === 'locacao' && (!$empresa || !$p['locacao'] || $p['tipo'] === 'suprimentos')) {
            $problemas[] = ['slug' => $slug, 'motivo' => $empresa ? "{$p['nome']} não está disponível para locação." : 'A locação é só para cadastros com CNPJ.'];
            continue;
        }
        if ($modalidade === 'compra' && !$p['venda']) {
            $problemas[] = ['slug' => $slug, 'motivo' => "{$p['nome']} está disponível só para locação."];
            continue;
        }
        $chave = "{$slug}|{$modalidade}";
        $itens[$chave] = ['slug' => $slug, 'id' => $p['id'], 'nome' => $p['nome'], 'modalidade' => $modalidade,
            'quantidade' => min(99, ($itens[$chave]['quantidade'] ?? 0) + $qtd)];
    }
    if ($problemas) {
        nf_erro(422, $problemas[0]['motivo'] . (count($problemas) > 1 ? ' Confira os outros itens marcados no carrinho.' : ''),
            ['itens' => $problemas]);
    }
    $recentes = (int) nf_consulta($config, 'SELECT COUNT(*) AS n FROM orcamentos WHERE usuario_id = ? AND criado_em > NOW() - INTERVAL 1 HOUR',
        [$u['id']])[0]['n'];
    if ($recentes >= NF_ORCAMENTOS_POR_HORA) {
        nf_erro(429, 'Você enviou muitos pedidos na última hora. Tente de novo mais tarde ou fale com a gente pelo WhatsApp.');
    }

    $endereco = nf_endereco_principal($config, (int) $u['id']);
    $banco = nf_banco($config);
    for ($tentativa = 1; ; $tentativa++) {
        $codigo = nf_codigo_orcamento();
        $banco->beginTransaction();
        try {
            nf_consulta($config, 'INSERT INTO orcamentos (codigo, usuario_id, endereco_id, observacoes_cliente) VALUES (?, ?, ?, ?)',
                [$codigo, $u['id'], $endereco['id'] ?? null, $observacoes === '' ? null : $observacoes]);
            $orcamentoId = (int) $banco->lastInsertId();
            foreach ($itens as $i) {
                nf_consulta($config, 'INSERT INTO orcamento_itens (orcamento_id, produto_id, produto_slug, produto_nome, modalidade, quantidade)
                    VALUES (?, ?, ?, ?, ?, ?)', [$orcamentoId, $i['id'], $i['slug'], mb_substr($i['nome'], 0, 160), $i['modalidade'], $i['quantidade']]);
            }
            $banco->commit();
            break;
        } catch (PDOException $ex) {
            $banco->rollBack();
            // Código repetido (muito raro): sorteia outro
            if (($ex->errorInfo[1] ?? 0) !== 1062 || $tentativa >= 5) {
                throw $ex;
            }
        }
    }

    // Avisos para a equipe: falhas não afetam o pedido, que já está gravado
    try {
        $n = array_sum(array_column($itens, 'quantidade'));
        nf_consulta($config, "INSERT INTO notificacoes (tipo, usuario_id, orcamento_id, resumo) VALUES ('novo_orcamento', ?, ?, ?)",
            [$u['id'], $orcamentoId, mb_substr("Pedido de orçamento {$codigo}: {$u['primeiro_nome']} {$u['sobrenome']} · {$n} "
                . ($n === 1 ? 'item' : 'itens'), 0, 300)]);
        nf_email_novo_orcamento($config, $orcamentoId, $codigo, $u, array_values($itens), $observacoes ?: null, $endereco);
    } catch (Throwable $ex) {
        error_log('[api-nf] aviso de pedido de orçamento: ' . $ex->getMessage());
    }
    nf_responder(201, ['codigo' => $codigo]);
}

function nf_rota_orcamento_cancelar(array $config): never
{
    $u = nf_exigir_cliente($config);
    $d = nf_ler_json();
    $codigo = is_string($d['codigo'] ?? null) ? $d['codigo'] : '';
    $o = preg_match('/^NF-[0-9A-HJ-NP-Z]{8}$/', $codigo)
        ? (nf_consulta($config, 'SELECT id, status FROM orcamentos WHERE codigo = ? AND usuario_id = ?', [$codigo, $u['id']])[0] ?? null)
        : null;
    if ($o === null) {
        nf_erro(404, 'Pedido não encontrado.');
    }
    if ($o['status'] !== 'novo') {
        nf_erro(409, 'Este pedido já está com a nossa equipe. Para cancelar, fale com a gente pelo WhatsApp.');
    }
    nf_consulta($config, "UPDATE orcamentos SET status = 'cancelado' WHERE id = ? AND status = 'novo'", [$o['id']]);
    nf_auditar($config, null, 'orcamento_cancelado_cliente', 'orcamento', (int) $o['id']);
    nf_responder(200, ['ok' => true]);
}

// LGPD: o próprio cliente apaga a conta. Saem o cadastro, os endereços e os produtos de interesse;
// os pedidos ficam no histórico da empresa sem ligação com a pessoa. O painel recebe um aviso com
// nome e contato (para a equipe encerrar o que estiver pendente), apagado depois de 90 dias.
function nf_rota_conta_excluir(array $config): never
{
    $u = nf_exigir_cliente($config);
    $d = nf_ler_json();
    $senha = $d['senha'] ?? null;
    if (($d['confirmacao'] ?? null) !== 'EXCLUIR') {
        nf_erro(422, 'Confira os campos destacados.', ['campos' => ['confirmacao' => 'Digite EXCLUIR, em letras maiúsculas, para confirmar.']]);
    }
    if (!is_string($senha) || $senha === '' || strlen($senha) > NF_SENHA_MAXIMO) {
        nf_erro(422, 'Confira os campos destacados.', ['campos' => ['senha' => NF_SENHA_VAZIA]]);
    }
    if ($u['role'] !== 'cliente') {
        nf_erro(403, 'Contas de administrador não podem ser excluídas por aqui.');
    }
    $ip = nf_ip();
    $espera = nf_bloqueio_login($config, $u['email'], $ip);
    if ($espera !== null) {
        nf_erro(429, 'Muitas tentativas. Tente de novo em ' . nf_minutos($espera) . '.', [], ['Retry-After' => (string) $espera]);
    }
    if ($u['senha_hash'] === null || !password_verify($senha, $u['senha_hash'])) {
        nf_registrar_tentativa($config, $u['email'], $ip, false);
        nf_erro(401, NF_SENHA_INCORRETA, ['campos' => ['senha' => NF_SENHA_INCORRETA]]);
    }

    $resumo = mb_substr("Conta excluída pelo cliente: {$u['primeiro_nome']} {$u['sobrenome']}"
        . ($u['tipo_pessoa'] === 'PJ' && $u['razao_social'] ? " ({$u['razao_social']})" : '')
        . " · {$u['email']} · " . nf_formatar_telefone($u['telefone']), 0, 300);
    $banco = nf_banco($config);
    $banco->beginTransaction();
    try {
        nf_consulta($config, "INSERT INTO notificacoes (tipo, resumo) VALUES ('conta_excluida', ?)", [$resumo]);
        nf_consulta($config, 'DELETE FROM usuarios WHERE id = ?', [$u['id']]);
        nf_auditar($config, null, 'cliente_autoexcluir', 'cliente', (int) $u['id']);
        $banco->commit();
    } catch (Throwable $ex) {
        $banco->rollBack();
        throw $ex;
    }
    // Sai da conta excluída com um novo id de sessão (um login do painel no mesmo navegador continua)
    nf_limpar_login();
    session_regenerate_id(true);
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    nf_responder(200, ['ok' => true, 'cliente' => null, 'csrf' => $_SESSION['csrf']]);
}
