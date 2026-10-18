<?php
// Rotas do painel administrativo (/api/admin/...). Todas exigem administrador logado com 2FA,
// exceto sessao, entrar e codigo (o próprio login). Todo POST exige o código CSRF (nf_despachar).
//
//   GET  admin/sessao            → { admin | null, etapa: null|'codigo'|'configurar', csrf }
//   POST admin/entrar            → e-mail e senha            → { etapa: 'codigo' | 'configurar', chave?, endereco? }
//   POST admin/codigo            → código de 6 dígitos (2FA) → { admin }
//   POST admin/sair
//   GET  admin/resumo            → números da tela inicial
//   GET  admin/clientes          → lista (?busca, status, pagamento, tipo, pagina)
//   GET  admin/cliente?id=       → ficha completa
//   POST admin/cliente-criar | cliente-editar | cliente-excluir | cliente-status | cliente-pagamento
//   GET  admin/clientes-csv      → planilha (CSV)
//   GET  admin/notificacoes      → POST admin/notificacoes-lidas
//   GET  admin/auditoria         → histórico de ações

declare(strict_types=1);

defined('NF_API') || exit;

const NF_POR_PAGINA = 25;
const NF_INTERVALO_AVISO_ATRASO = 72 * 3600; // no máximo um aviso de atraso por cliente a cada 3 dias

function nf_rotas_admin(): array
{
    return [
        'admin/sessao' => ['GET' => 'nf_admin_rota_sessao'],
        'admin/entrar' => ['POST' => 'nf_admin_rota_entrar'],
        'admin/codigo' => ['POST' => 'nf_admin_rota_codigo'],
        'admin/sair' => ['POST' => 'nf_admin_rota_sair'],
        'admin/resumo' => ['GET' => 'nf_admin_rota_resumo'],
        'admin/clientes' => ['GET' => 'nf_admin_rota_clientes'],
        'admin/cliente' => ['GET' => 'nf_admin_rota_cliente'],
        'admin/cliente-criar' => ['POST' => 'nf_admin_rota_cliente_criar'],
        'admin/cliente-editar' => ['POST' => 'nf_admin_rota_cliente_editar'],
        'admin/cliente-excluir' => ['POST' => 'nf_admin_rota_cliente_excluir'],
        'admin/cliente-status' => ['POST' => 'nf_admin_rota_cliente_status'],
        'admin/cliente-pagamento' => ['POST' => 'nf_admin_rota_cliente_pagamento'],
        'admin/clientes-csv' => ['GET' => 'nf_admin_rota_clientes_csv'],
        'admin/notificacoes' => ['GET' => 'nf_admin_rota_notificacoes'],
        'admin/notificacoes-lidas' => ['POST' => 'nf_admin_rota_notificacoes_lidas'],
        'admin/auditoria' => ['GET' => 'nf_admin_rota_auditoria'],
    ];
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

function nf_admin_publico(array $a): array
{
    return ['nome' => $a['primeiro_nome'], 'email' => $a['email']];
}

function nf_admin_rota_sessao(array $config): never
{
    $admin = nf_admin_atual($config);
    $pendente = $_SESSION['admin_pendente'] ?? null;
    $etapa = null;
    if ($admin === null && is_array($pendente) && time() - $pendente['em'] <= NF_ADMIN_PENDENTE) {
        $etapa = isset($_SESSION['admin_totp_novo']) ? 'configurar' : 'codigo';
    }
    nf_responder(200, ['admin' => $admin ? nf_admin_publico($admin) : null, 'etapa' => $etapa, 'csrf' => $_SESSION['csrf']]);
}

function nf_admin_rota_entrar(array $config): never
{
    $d = nf_ler_json();
    $email = is_string($d['email'] ?? null) ? mb_strtolower(trim($d['email'])) : '';
    $senha = $d['senha'] ?? null;
    if (!nf_email_valido($email) || !is_string($senha) || $senha === '' || strlen($senha) > NF_SENHA_MAXIMO) {
        nf_erro(422, 'Digite um e-mail válido e a senha.');
    }
    $ip = nf_ip();
    $espera = nf_bloqueio_login($config, $email, $ip);
    if ($espera !== null) {
        nf_erro(429, 'Muitas tentativas. Tente de novo em ' . nf_minutos($espera) . '.', [], ['Retry-After' => (string) $espera]);
    }
    $u = nf_consulta($config,
        'SELECT id, email, senha_hash, role, status, totp_segredo FROM usuarios WHERE email = ?', [$email])[0] ?? null;
    $hash = $u['senha_hash'] ?? null;
    $senhaCerta = password_verify($senha, $hash ?? NF_HASH_FALSO);
    if (!($u && $hash && $senhaCerta && $u['role'] === 'admin' && $u['status'] === 'ativo')) {
        nf_registrar_tentativa($config, $email, $ip, false);
        nf_erro(401, NF_LOGIN_INVALIDO);
    }
    // Senha certa: ainda não é login (falta o 2FA). O sucesso só é registrado depois do código.
    nf_admin_limpar();
    session_regenerate_id(true);
    $_SESSION['admin_pendente'] = ['id' => (int) $u['id'], 'email' => $u['email'], 'em' => time()];
    if ($u['totp_segredo'] !== null) {
        nf_responder(200, ['etapa' => 'codigo', 'csrf' => $_SESSION['csrf']]);
    }
    $segredo = nf_totp_novo_segredo();
    $_SESSION['admin_totp_novo'] = $segredo;
    nf_responder(200, [
        'etapa' => 'configurar',
        'chave' => trim(chunk_split($segredo, 4, ' ')),
        'endereco' => nf_totp_endereco($segredo, $u['email']),
        'csrf' => $_SESSION['csrf'],
    ]);
}

function nf_admin_rota_codigo(array $config): never
{
    $d = nf_ler_json();
    $p = $_SESSION['admin_pendente'] ?? null;
    if (!is_array($p) || time() - $p['em'] > NF_ADMIN_PENDENTE) {
        nf_admin_limpar();
        nf_erro(401, 'O tempo para digitar o código acabou. Entre de novo com e-mail e senha.', ['codigo' => 'admin']);
    }
    $ip = nf_ip();
    $espera = nf_bloqueio_login($config, $p['email'], $ip);
    if ($espera !== null) {
        nf_admin_limpar();
        nf_erro(429, 'Muitas tentativas. Tente de novo em ' . nf_minutos($espera) . '.', [], ['Retry-After' => (string) $espera]);
    }
    $u = nf_consulta($config,
        "SELECT id, primeiro_nome, email, totp_segredo, totp_ultimo_passo FROM usuarios WHERE id = ? AND role = 'admin' AND status = 'ativo'",
        [$p['id']])[0] ?? null;
    if ($u === null) {
        nf_admin_limpar();
        nf_erro(401, NF_LOGIN_INVALIDO, ['codigo' => 'admin']);
    }
    $novo = $_SESSION['admin_totp_novo'] ?? null;
    $segredo = $novo ?? ($u['totp_segredo'] !== null ? nf_totp_decifrar($config, $u['totp_segredo']) : null);
    if ($segredo === null) {
        throw new RuntimeException('Segredo 2FA ilegível (a chave "segredo" da configuração mudou?)');
    }
    $ultimo = $u['totp_ultimo_passo'] === null ? null : (int) $u['totp_ultimo_passo'];
    $passo = nf_totp_conferir($segredo, $d['codigo'] ?? null, $novo !== null ? null : $ultimo);
    if ($passo === null) {
        nf_registrar_tentativa($config, $p['email'], $ip, false);
        nf_erro(401, 'Código incorreto. Confira o código de 6 dígitos no app autenticador.');
    }
    if ($novo !== null) {
        // Grava o segredo e o registro de auditoria juntos (ou nenhum dos dois)
        $banco = nf_banco($config);
        $banco->beginTransaction();
        try {
            nf_consulta($config, 'UPDATE usuarios SET totp_segredo = ?, totp_ultimo_passo = ? WHERE id = ?',
                [nf_totp_cifrar($config, $novo), $passo, $u['id']]);
            nf_auditar($config, (int) $u['id'], 'admin_autenticador_configurado', 'admin', (int) $u['id']);
            $banco->commit();
        } catch (Throwable $ex) {
            $banco->rollBack();
            throw $ex;
        }
    } else {
        nf_consulta($config, 'UPDATE usuarios SET totp_ultimo_passo = ? WHERE id = ?', [$passo, $u['id']]);
    }
    nf_registrar_tentativa($config, $p['email'], $ip, true);
    nf_consulta($config, 'UPDATE usuarios SET ultimo_login_em = NOW() WHERE id = ?', [$u['id']]);
    nf_admin_limpar();
    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int) $u['id'];
    $_SESSION['admin_login_em'] = $_SESSION['admin_visto_em'] = time();
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    nf_auditar($config, (int) $u['id'], 'admin_entrar', 'admin', (int) $u['id']);
    nf_responder(200, ['admin' => nf_admin_publico($u), 'csrf' => $_SESSION['csrf']]);
}

function nf_admin_rota_sair(array $config): never
{
    $admin = nf_admin_atual($config);
    if ($admin !== null) {
        nf_auditar($config, (int) $admin['id'], 'admin_sair', 'admin', (int) $admin['id']);
    }
    nf_admin_limpar();
    session_regenerate_id(true);
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    nf_responder(200, ['admin' => null, 'csrf' => $_SESSION['csrf']]);
}

// ---------------------------------------------------------------------------
// Resumo, notificações e auditoria
// ---------------------------------------------------------------------------

function nf_admin_rota_resumo(array $config): never
{
    nf_exigir_admin($config);
    $n = nf_consulta($config, "SELECT
        COUNT(*) AS clientes,
        SUM(criado_em >= NOW() - INTERVAL 7 DAY) AS novos_7_dias,
        SUM(situacao_pagamento = 'em_atraso') AS em_atraso,
        SUM(status = 'inativo') AS inativos,
        SUM(tipo_pessoa = 'PJ') AS empresas
        FROM usuarios WHERE role = 'cliente'")[0];
    $p = nf_consulta($config, "SELECT SUM(estoque = 0) AS sem_estoque,
        SUM(estoque > 0 AND estoque_minimo > 0 AND estoque <= estoque_minimo) AS estoque_baixo
        FROM produtos WHERE status = 'ativo'")[0];
    $naoLidas = nf_consulta($config, 'SELECT COUNT(*) AS n FROM notificacoes WHERE lida_em IS NULL')[0]['n'];
    $ultimos = nf_consulta($config, "SELECT id, primeiro_nome, sobrenome, tipo_pessoa, criado_em
        FROM usuarios WHERE role = 'cliente' ORDER BY criado_em DESC, id DESC LIMIT 5");
    nf_responder(200, [
        'clientes' => (int) $n['clientes'], 'novos7Dias' => (int) $n['novos_7_dias'], 'emAtraso' => (int) $n['em_atraso'],
        'inativos' => (int) $n['inativos'], 'empresas' => (int) $n['empresas'],
        'semEstoque' => (int) $p['sem_estoque'], 'estoqueBaixo' => (int) $p['estoque_baixo'],
        'notificacoesNaoLidas' => (int) $naoLidas,
        'ultimosClientes' => array_map(fn ($u) => [
            'id' => $u['id'], 'nome' => "{$u['primeiro_nome']} {$u['sobrenome']}",
            'tipo' => $u['tipo_pessoa'] === 'PJ' ? 'cnpj' : 'cpf', 'criadoEm' => $u['criado_em'],
        ], $ultimos),
    ]);
}

function nf_admin_rota_notificacoes(array $config): never
{
    nf_exigir_admin($config);
    $soNaoLidas = ($_GET['filtro'] ?? '') === 'nao-lidas';
    $lista = nf_consulta($config, 'SELECT id, tipo, usuario_id, produto_id, resumo, lida_em, criado_em FROM notificacoes'
        . ($soNaoLidas ? ' WHERE lida_em IS NULL' : '') . ' ORDER BY criado_em DESC, id DESC LIMIT 100');
    $naoLidas = nf_consulta($config, 'SELECT COUNT(*) AS n FROM notificacoes WHERE lida_em IS NULL')[0]['n'];
    nf_responder(200, ['notificacoes' => array_map(fn ($n) => [
        'id' => $n['id'], 'tipo' => $n['tipo'], 'clienteId' => $n['usuario_id'], 'produtoId' => $n['produto_id'],
        'resumo' => $n['resumo'], 'lida' => $n['lida_em'] !== null, 'criadoEm' => $n['criado_em'],
    ], $lista), 'naoLidas' => (int) $naoLidas]);
}

function nf_admin_rota_notificacoes_lidas(array $config): never
{
    nf_exigir_admin($config);
    $d = nf_ler_json();
    if (($d['todas'] ?? null) === true) {
        nf_consulta($config, 'UPDATE notificacoes SET lida_em = NOW() WHERE lida_em IS NULL');
    } else {
        $ids = $d['ids'] ?? null;
        if (!is_array($ids) || !array_is_list($ids) || count($ids) > 100 || array_filter($ids, fn ($i) => !is_int($i) || $i < 1)) {
            nf_erro(422, 'Lista de notificações inválida.');
        }
        foreach ($ids as $id) {
            nf_consulta($config, 'UPDATE notificacoes SET lida_em = NOW() WHERE id = ? AND lida_em IS NULL', [$id]);
        }
    }
    nf_responder(200, ['ok' => true]);
}

function nf_admin_rota_auditoria(array $config): never
{
    nf_exigir_admin($config);
    $pagina = nf_pagina();
    $total = (int) nf_consulta($config, 'SELECT COUNT(*) AS n FROM auditoria')[0]['n'];
    $lista = nf_consulta($config, 'SELECT a.id, a.acao, a.alvo_tipo, a.alvo_id, a.detalhes, a.criado_em,
            u.primeiro_nome, u.sobrenome
        FROM auditoria a LEFT JOIN usuarios u ON u.id = a.admin_id
        ORDER BY a.criado_em DESC, a.id DESC LIMIT ' . NF_POR_PAGINA . ' OFFSET ' . (($pagina - 1) * NF_POR_PAGINA));
    nf_responder(200, ['total' => $total, 'pagina' => $pagina, 'porPagina' => NF_POR_PAGINA, 'registros' => array_map(fn ($a) => [
        'id' => $a['id'], 'acao' => $a['acao'], 'alvoTipo' => $a['alvo_tipo'], 'alvoId' => $a['alvo_id'],
        'detalhes' => $a['detalhes'] === null ? null : json_decode($a['detalhes'], true),
        'admin' => $a['primeiro_nome'] === null ? '(administrador excluído)' : "{$a['primeiro_nome']} {$a['sobrenome']}",
        'criadoEm' => $a['criado_em'],
    ], $lista)]);
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

function nf_pagina(): int
{
    $p = $_GET['pagina'] ?? '1';
    return is_string($p) && ctype_digit($p) && (int) $p >= 1 && (int) $p <= 100000 ? (int) $p : 1;
}

function nf_id_da_url(): int
{
    $id = $_GET['id'] ?? '';
    if (!is_string($id) || !ctype_digit($id) || (int) $id < 1) {
        nf_erro(422, 'Cliente inválido.');
    }
    return (int) $id;
}

function nf_id_do_corpo(array $d): int
{
    $id = $d['id'] ?? null;
    if (!is_int($id) || $id < 1) {
        nf_erro(422, 'Cliente inválido.');
    }
    return $id;
}

// Só clientes: administradores não são alterados pelo painel (ficam no banco).
function nf_buscar_cliente(array $config, int $id): array
{
    $u = nf_consulta($config, "SELECT * FROM usuarios WHERE id = ? AND role = 'cliente'", [$id])[0] ?? null;
    if ($u === null) {
        nf_erro(404, 'Cliente não encontrado.');
    }
    return $u;
}

// Filtros da lista e do CSV (sempre com parâmetros; o texto de busca nunca entra no SQL).
function nf_filtro_clientes(): array
{
    $onde = ["u.role = 'cliente'"];
    $par = [];
    $busca = is_string($_GET['busca'] ?? null) ? mb_substr(trim($_GET['busca']), 0, 100) : '';
    if ($busca !== '') {
        $like = '%' . addcslashes($busca, '%_\\') . '%';
        $digitos = preg_replace('/\D/', '', $busca);
        $onde[] = '(CONCAT_WS(\' \', u.primeiro_nome, u.sobrenome) LIKE ? OR u.email LIKE ? OR u.razao_social LIKE ? OR u.nome_fantasia LIKE ?'
            . ($digitos !== '' ? ' OR u.documento LIKE ? OR u.telefone LIKE ?' : '') . ')';
        array_push($par, $like, $like, $like, $like);
        if ($digitos !== '') {
            array_push($par, "%{$digitos}%", "%{$digitos}%");
        }
    }
    $mapas = [
        'status' => ['ativo' => "u.status = 'ativo'", 'inativo' => "u.status = 'inativo'"],
        'pagamento' => ['em_dia' => "u.situacao_pagamento = 'em_dia'", 'em_atraso' => "u.situacao_pagamento = 'em_atraso'"],
        'tipo' => ['cpf' => "u.tipo_pessoa = 'PF'", 'cnpj' => "u.tipo_pessoa = 'PJ'"],
    ];
    foreach ($mapas as $param => $opcoes) {
        $v = $_GET[$param] ?? '';
        if (is_string($v) && isset($opcoes[$v])) {
            $onde[] = $opcoes[$v];
        }
    }
    return [implode(' AND ', $onde), $par];
}

function nf_cliente_resumo(array $u): array
{
    return [
        'id' => $u['id'], 'nome' => $u['primeiro_nome'], 'sobrenome' => $u['sobrenome'],
        'tipo' => $u['tipo_pessoa'] === 'PJ' ? 'cnpj' : 'cpf', 'documento' => $u['documento'],
        'razaoSocial' => $u['razao_social'], 'email' => $u['email'], 'telefone' => $u['telefone'],
        'status' => $u['status'], 'pagamento' => $u['situacao_pagamento'], 'emAtrasoDesde' => $u['em_atraso_desde'],
        'criadoEm' => $u['criado_em'], 'ultimoLoginEm' => $u['ultimo_login_em'],
    ];
}

function nf_admin_rota_clientes(array $config): never
{
    nf_exigir_admin($config);
    [$onde, $par] = nf_filtro_clientes();
    $pagina = nf_pagina();
    $total = (int) nf_consulta($config, "SELECT COUNT(*) AS n FROM usuarios u WHERE {$onde}", $par)[0]['n'];
    $lista = nf_consulta($config, "SELECT u.* FROM usuarios u WHERE {$onde} ORDER BY u.criado_em DESC, u.id DESC
        LIMIT " . NF_POR_PAGINA . ' OFFSET ' . (($pagina - 1) * NF_POR_PAGINA), $par);
    nf_responder(200, ['total' => $total, 'pagina' => $pagina, 'porPagina' => NF_POR_PAGINA,
        'clientes' => array_map('nf_cliente_resumo', $lista)]);
}

function nf_admin_rota_cliente(array $config): never
{
    nf_exigir_admin($config);
    $u = nf_buscar_cliente($config, nf_id_da_url());
    $en = nf_consulta($config, 'SELECT cep, rua, numero, complemento, bairro, cidade, uf FROM enderecos
        WHERE usuario_id = ? ORDER BY principal DESC, id LIMIT 1', [$u['id']])[0] ?? null;
    $interesses = nf_consulta($config, 'SELECT produto_slug, produto_nome FROM usuario_interesses WHERE usuario_id = ? ORDER BY id', [$u['id']]);
    $avisos = nf_consulta($config, "SELECT sucesso, criado_em FROM emails_enviados
        WHERE usuario_id = ? AND tipo = 'aviso_atraso' ORDER BY criado_em DESC LIMIT 10", [$u['id']]);
    $historico = nf_consulta($config, "SELECT a.acao, a.detalhes, a.criado_em, adm.primeiro_nome AS admin
        FROM auditoria a LEFT JOIN usuarios adm ON adm.id = a.admin_id
        WHERE a.alvo_tipo = 'cliente' AND a.alvo_id = ? ORDER BY a.criado_em DESC LIMIT 30", [$u['id']]);
    nf_responder(200, ['cliente' => nf_cliente_resumo($u) + [
        'nomeFantasia' => $u['nome_fantasia'], 'situacaoCnpj' => $u['situacao_cnpj'], 'cnpjVerificadoEm' => $u['cnpj_verificado_em'],
        'aceitePrivacidadeEm' => $u['aceite_privacidade_em'],
        'endereco' => $en,
        'interesses' => array_map(fn ($i) => ['slug' => $i['produto_slug'], 'nome' => $i['produto_nome']], $interesses),
        'avisosAtraso' => array_map(fn ($a) => ['enviado' => (bool) $a['sucesso'], 'em' => $a['criado_em']], $avisos),
        'historico' => array_map(fn ($h) => [
            'acao' => $h['acao'], 'detalhes' => $h['detalhes'] === null ? null : json_decode($h['detalhes'], true),
            'admin' => $h['admin'] ?? '(excluído)', 'em' => $h['criado_em'],
        ], $historico),
    ]]);
}

function nf_admin_rota_cliente_criar(array $config): never
{
    $admin = nf_exigir_admin($config);
    $d = nf_ler_json();
    [$v, $erros] = nf_validar_cliente($d, true);
    if ($erros) {
        nf_erro(422, 'Confira os campos destacados.', ['campos' => $erros]);
    }
    $interesses = nf_validar_interesses($d['interesses'] ?? null);
    $situacao = $v['tipo'] === 'cnpj' ? nf_conferir_cnpj_cliente($config, $v['usuario']['documento']) : null;
    $id = nf_gravar_cliente_novo($config, $v, $situacao, $interesses);
    nf_auditar($config, (int) $admin['id'], 'cliente_criar', 'cliente', $id);
    nf_responder(201, ['id' => $id]);
}

function nf_admin_rota_cliente_editar(array $config): never
{
    $admin = nf_exigir_admin($config);
    $d = nf_ler_json();
    $atual = nf_buscar_cliente($config, nf_id_do_corpo($d));
    [$v, $erros] = nf_validar_cliente($d, false);
    if ($erros) {
        nf_erro(422, 'Confira os campos destacados.', ['campos' => $erros]);
    }
    $u = $v['usuario'];
    $empresa = $u['tipo_pessoa'] === 'PJ';
    $situacao = $atual['situacao_cnpj'];
    $verificadoEm = $atual['cnpj_verificado_em'];
    if ($empresa && ($u['documento'] !== $atual['documento'] || $atual['tipo_pessoa'] !== 'PJ')) {
        $situacao = nf_conferir_cnpj_cliente($config, $u['documento']);
        $verificadoEm = $situacao !== null ? date('Y-m-d H:i:s') : null;
    }
    if (!$empresa) {
        $situacao = $verificadoEm = null;
    }
    // Quais campos mudaram (só os nomes vão para a auditoria, não os valores)
    $alterados = array_keys(array_filter($u, fn ($valor, $campo) => (string) $atual[$campo] !== (string) $valor, ARRAY_FILTER_USE_BOTH));
    $enAtual = nf_consulta($config, 'SELECT id, cep, rua, numero, complemento, bairro, cidade, uf FROM enderecos
        WHERE usuario_id = ? ORDER BY principal DESC, id LIMIT 1', [$atual['id']])[0] ?? null;
    foreach ($v['endereco'] as $campo => $valor) {
        if ($enAtual === null || (string) $enAtual[$campo] !== (string) $valor) {
            $alterados[] = "endereco.{$campo}";
        }
    }
    if ($v['senha'] !== null) {
        $alterados[] = 'senha';
    }

    $banco = nf_banco($config);
    $banco->beginTransaction();
    try {
        nf_consulta($config, 'UPDATE usuarios SET primeiro_nome = ?, sobrenome = ?, tipo_pessoa = ?, documento = ?, razao_social = ?,
                nome_fantasia = ?, situacao_cnpj = ?, cnpj_verificado_em = ?, email = ?, telefone = ? WHERE id = ?',
            [$u['primeiro_nome'], $u['sobrenome'], $u['tipo_pessoa'], $u['documento'], $u['razao_social'], $u['nome_fantasia'],
             $situacao, $verificadoEm, $u['email'], $u['telefone'], $atual['id']]);
        if ($v['senha'] !== null) {
            nf_consulta($config, 'UPDATE usuarios SET senha_hash = ? WHERE id = ?', [password_hash($v['senha'], PASSWORD_ARGON2ID), $atual['id']]);
        }
        $en = $v['endereco'];
        if ($enAtual === null) {
            nf_consulta($config, 'INSERT INTO enderecos (usuario_id, apelido, cep, rua, numero, complemento, bairro, cidade, uf, principal)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)', [$atual['id'], $empresa ? 'Matriz' : 'Principal', $en['cep'], $en['rua'],
                $en['numero'], $en['complemento'], $en['bairro'], $en['cidade'], $en['uf']]);
        } else {
            nf_consulta($config, 'UPDATE enderecos SET cep = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, uf = ? WHERE id = ?',
                [$en['cep'], $en['rua'], $en['numero'], $en['complemento'], $en['bairro'], $en['cidade'], $en['uf'], $enAtual['id']]);
        }
        $banco->commit();
    } catch (PDOException $ex) {
        $banco->rollBack();
        if (($ex->errorInfo[1] ?? 0) === 1062) {
            nf_erro_duplicado($ex, $empresa);
        }
        throw $ex;
    }
    if ($alterados) {
        nf_auditar($config, (int) $admin['id'], 'cliente_editar', 'cliente', (int) $atual['id'], ['campos' => $alterados]);
    }
    nf_responder(200, ['ok' => true, 'alterados' => $alterados]);
}

function nf_admin_rota_cliente_excluir(array $config): never
{
    $admin = nf_exigir_admin($config);
    $d = nf_ler_json();
    $u = nf_buscar_cliente($config, nf_id_do_corpo($d));
    // Confirmação: digitar o e-mail do cliente (evita excluir o cliente errado por um clique)
    $confirmacao = is_string($d['confirmacao'] ?? null) ? mb_strtolower(trim($d['confirmacao'])) : '';
    if (!hash_equals($u['email'], $confirmacao)) {
        nf_erro(422, 'Para excluir, digite o e-mail do cliente exatamente como está cadastrado.', ['campos' => ['confirmacao' => 'O e-mail não confere.']]);
    }
    // LGPD: endereços e interesses saem junto; orçamentos ficam na empresa sem os dados pessoais
    nf_consulta($config, 'DELETE FROM usuarios WHERE id = ?', [$u['id']]);
    nf_auditar($config, (int) $admin['id'], 'cliente_excluir', 'cliente', (int) $u['id']);
    nf_responder(200, ['ok' => true]);
}

function nf_admin_rota_cliente_status(array $config): never
{
    $admin = nf_exigir_admin($config);
    $d = nf_ler_json();
    $u = nf_buscar_cliente($config, nf_id_do_corpo($d));
    $status = $d['status'] ?? null;
    if (!in_array($status, ['ativo', 'inativo'], true)) {
        nf_erro(422, 'Situação inválida.');
    }
    if ($status !== $u['status']) {
        nf_consulta($config, 'UPDATE usuarios SET status = ? WHERE id = ?', [$status, $u['id']]);
        nf_auditar($config, (int) $admin['id'], $status === 'ativo' ? 'cliente_ativar' : 'cliente_inativar', 'cliente', (int) $u['id']);
    }
    nf_responder(200, ['ok' => true, 'status' => $status]);
}

function nf_admin_rota_cliente_pagamento(array $config): never
{
    $admin = nf_exigir_admin($config);
    $d = nf_ler_json();
    $u = nf_buscar_cliente($config, nf_id_do_corpo($d));
    $situacao = $d['situacao'] ?? null;
    $enviar = ($d['enviarEmail'] ?? false) === true;
    if (!in_array($situacao, ['em_dia', 'em_atraso'], true)) {
        nf_erro(422, 'Situação de pagamento inválida.');
    }
    if ($situacao === 'em_atraso' && $enviar) {
        if ($u['status'] !== 'ativo') {
            nf_erro(422, 'Cliente inativo: ative o cadastro antes de enviar o aviso.');
        }
        $recente = nf_consulta($config, "SELECT criado_em FROM emails_enviados WHERE usuario_id = ? AND tipo = 'aviso_atraso'
            AND sucesso = 1 AND criado_em > NOW() - INTERVAL ? SECOND ORDER BY criado_em DESC LIMIT 1",
            [$u['id'], NF_INTERVALO_AVISO_ATRASO])[0] ?? null;
        if ($recente !== null) {
            nf_erro(429, "Já enviamos um aviso de pagamento pendente para este cliente em {$recente['criado_em']}. Espere 3 dias para enviar outro.");
        }
    }
    if ($situacao !== $u['situacao_pagamento']) {
        nf_consulta($config, 'UPDATE usuarios SET situacao_pagamento = ?, em_atraso_desde = ' . ($situacao === 'em_atraso' ? 'NOW()' : 'NULL') . ' WHERE id = ?',
            [$situacao, $u['id']]);
        nf_auditar($config, (int) $admin['id'], $situacao === 'em_atraso' ? 'cliente_marcar_atraso' : 'cliente_marcar_em_dia', 'cliente', (int) $u['id']);
    }
    $enviado = null;
    if ($situacao === 'em_atraso' && $enviar) {
        $enviado = nf_email_aviso_atraso($config, (int) $u['id'], $u);
        nf_auditar($config, (int) $admin['id'], 'cliente_aviso_atraso', 'cliente', (int) $u['id'], ['enviado' => $enviado]);
    }
    nf_responder(200, ['ok' => true, 'situacao' => $situacao, 'emailEnviado' => $enviado]);
}

// Planilha para Excel (separador ";" e acentos em UTF-8 com BOM).
function nf_admin_rota_clientes_csv(array $config): never
{
    $admin = nf_exigir_admin($config);
    [$onde, $par] = nf_filtro_clientes();
    $lista = nf_consulta($config, "SELECT u.*, e.cep, e.rua, e.numero, e.complemento, e.bairro, e.cidade, e.uf,
            (SELECT GROUP_CONCAT(i.produto_nome ORDER BY i.id SEPARATOR ', ') FROM usuario_interesses i WHERE i.usuario_id = u.id) AS interesses
        FROM usuarios u
        LEFT JOIN enderecos e ON e.id = (SELECT e2.id FROM enderecos e2 WHERE e2.usuario_id = u.id ORDER BY e2.principal DESC, e2.id LIMIT 1)
        WHERE {$onde} ORDER BY u.criado_em DESC, u.id DESC", $par);
    nf_auditar($config, (int) $admin['id'], 'clientes_exportar', 'sistema', null, ['quantidade' => count($lista)]);

    // Célula que começa com = + - @ vira texto (evita fórmulas maliciosas ao abrir no Excel)
    $celula = function ($v): string {
        $v = (string) $v;
        if ($v !== '' && strpbrk($v[0], "=+-@\t\r") !== false) {
            $v = "'" . $v;
        }
        return '"' . str_replace('"', '""', $v) . '"';
    };
    $linhas = [['ID', 'Nome', 'Sobrenome', 'Tipo', 'CPF/CNPJ', 'Razão social', 'Nome fantasia', 'E-mail', 'Telefone',
        'CEP', 'Endereço', 'Bairro', 'Cidade', 'UF', 'Situação', 'Pagamento', 'Em atraso desde', 'Cadastrado em', 'Último login',
        'Produtos de interesse']];
    foreach ($lista as $u) {
        $linhas[] = [$u['id'], $u['primeiro_nome'], $u['sobrenome'], $u['tipo_pessoa'] === 'PJ' ? 'Empresa' : 'Pessoa física',
            nf_formatar_documento($u['documento']), $u['razao_social'], $u['nome_fantasia'], $u['email'], nf_formatar_telefone($u['telefone']),
            $u['cep'], trim("{$u['rua']}, {$u['numero']} {$u['complemento']}", ', '), $u['bairro'], $u['cidade'], $u['uf'],
            $u['status'] === 'ativo' ? 'Ativo' : 'Inativo', $u['situacao_pagamento'] === 'em_atraso' ? 'Em atraso' : 'Em dia',
            $u['em_atraso_desde'], $u['criado_em'], $u['ultimo_login_em'], $u['interesses']];
    }
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="clientes-nf-' . date('Y-m-d') . '.csv"');
    echo "\xEF\xBB\xBF";
    foreach ($linhas as $l) {
        echo implode(';', array_map($celula, $l)), "\r\n";
    }
    exit;
}
