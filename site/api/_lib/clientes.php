<?php
// Regras de cliente usadas pelo cadastro do site e pelo painel: validação, CNPJ, gravação.

declare(strict_types=1);

defined('NF_API') || exit;

const NF_MAX_INTERESSES = 30;

// Confere e limpa os dados. Devolve [$dados, $erros]; $erros vazio = tudo certo.
// Os nomes dos campos são os do formulário do site (nome, sobrenome, documento, cep...).
function nf_validar_cliente(array $d, bool $senhaObrigatoria): array
{
    $e = [];
    $tipo = $d['tipo'] ?? null;
    if (!in_array($tipo, ['cpf', 'cnpj'], true)) {
        return [null, ['tipo' => 'Escolha CPF ou CNPJ.']];
    }
    $empresa = $tipo === 'cnpj';

    $nome = nf_texto($d['nome'] ?? null, 60) ?? ($e['nome'] = 'Digite o primeiro nome (até 60 letras).');
    $sobrenome = nf_texto($d['sobrenome'] ?? null, 100) ?? ($e['sobrenome'] = 'Digite o sobrenome (até 100 letras).');
    $email = is_string($d['email'] ?? null) ? mb_strtolower(trim($d['email'])) : '';
    if (!nf_email_valido($email)) {
        $e['email'] = 'Digite um e-mail válido, como nome@empresa.com.br.';
    }
    $telefone = nf_so_digitos($d['telefone'] ?? null);
    if (!preg_match('/^\d{10,11}$/', $telefone)) {
        $e['telefone'] = 'Digite o telefone com DDD, como (12) 99999-9999.';
    }
    $documento = nf_so_digitos($d['documento'] ?? null);
    if (!$empresa && !nf_cpf_valido($documento)) {
        $e['documento'] = 'CPF inválido. Confira os 11 números.';
    }
    if ($empresa && !nf_cnpj_valido($documento)) {
        $e['documento'] = 'CNPJ inválido. Confira os 14 números.';
    }
    $razaoSocial = $empresa ? (nf_texto($d['razaoSocial'] ?? null, 150) ?? ($e['razaoSocial'] = 'Digite a razão social da empresa.')) : null;
    $nomeFantasia = $empresa ? nf_texto($d['nomeFantasia'] ?? null, 150, false) : '';
    if ($nomeFantasia === null) {
        $e['nomeFantasia'] = 'Nome fantasia inválido (até 150 letras).';
    }

    $cep = nf_so_digitos($d['cep'] ?? null);
    if (!preg_match('/^\d{8}$/', $cep)) {
        $e['cep'] = 'Digite o CEP com 8 números.';
    }
    $rua = nf_texto($d['rua'] ?? null, 150) ?? ($e['rua'] = 'Digite a rua.');
    $numero = nf_texto($d['numero'] ?? null, 10) ?? ($e['numero'] = 'Digite o número (ou "s/n").');
    $complemento = nf_texto($d['complemento'] ?? null, 80, false);
    if ($complemento === null) {
        $e['complemento'] = 'Complemento inválido (até 80 letras).';
    }
    $bairro = nf_texto($d['bairro'] ?? null, 80) ?? ($e['bairro'] = 'Digite o bairro.');
    $cidade = nf_texto($d['cidade'] ?? null, 80) ?? ($e['cidade'] = 'Digite a cidade.');
    $uf = $d['uf'] ?? null;
    if (!in_array($uf, NF_UFS, true)) {
        $e['uf'] = 'Escolha o estado.';
    }
    $senha = $d['senha'] ?? null;
    if (($senhaObrigatoria || ($senha !== null && $senha !== '')) && !nf_senha_valida($senha)) {
        $e['senha'] = 'A senha precisa de 8 a 128 caracteres, com pelo menos uma letra e um número.';
    }
    if ($e) {
        return [null, $e];
    }
    return [[
        'tipo' => $tipo,
        'usuario' => [
            'primeiro_nome' => $nome, 'sobrenome' => $sobrenome, 'tipo_pessoa' => $empresa ? 'PJ' : 'PF',
            'documento' => $documento, 'razao_social' => $razaoSocial, 'nome_fantasia' => $nomeFantasia ?: null,
            'email' => $email, 'telefone' => $telefone,
        ],
        'endereco' => [
            'cep' => $cep, 'rua' => $rua, 'numero' => $numero, 'complemento' => $complemento ?: null,
            'bairro' => $bairro, 'cidade' => $cidade, 'uf' => $uf,
        ],
        'senha' => is_string($senha) && $senha !== '' ? $senha : null,
    ], []];
}

// Situação do CNPJ na Receita: recusa (422) CNPJ inexistente ou não ativo.
// Devolve a situação, ou null se a consulta estiver fora do ar (a equipe confere depois).
function nf_conferir_cnpj_cliente(array $config, string $cnpj): ?string
{
    $r = nf_consultar_cnpj($config, $cnpj);
    if ($r['estado'] === 'nao-encontrado') {
        nf_erro(422, 'Confira os campos destacados.', ['campos' => ['documento' => 'Não encontramos este CNPJ na Receita Federal. Confira os números.']]);
    }
    if ($r['estado'] === 'ok' && !$r['ativa']) {
        nf_erro(422, 'Confira os campos destacados.', ['campos' => ['documento' => "Este CNPJ está com situação \"{$r['situacao']}\" na Receita Federal. O cadastro de empresa exige CNPJ ativo."]]);
    }
    return $r['estado'] === 'ok' ? $r['situacao'] : null;
}

// Catálogo { slug: nome } gerado na compilação (scripts/catalogo-api.mjs).
function nf_catalogo(): array
{
    static $catalogo = null;
    if ($catalogo === null) {
        $arquivo = dirname(__DIR__) . '/_dados/catalogo.json';
        $catalogo = is_file($arquivo) ? (json_decode((string) file_get_contents($arquivo), true) ?: []) : [];
    }
    return $catalogo;
}

// Produtos de interesse: só slugs que existem no catálogo; nomes vêm do catálogo, nunca do navegador.
function nf_validar_interesses(mixed $lista): array
{
    if ($lista === null) {
        return [];
    }
    if (!is_array($lista) || !array_is_list($lista) || count($lista) > NF_MAX_INTERESSES) {
        nf_erro(422, 'Lista de produtos de interesse inválida.');
    }
    $catalogo = nf_catalogo();
    $saida = [];
    foreach ($lista as $slug) {
        if (is_string($slug) && isset($catalogo[$slug]) && !isset($saida[$slug])) {
            $saida[$slug] = ['slug' => $slug, 'nome' => $catalogo[$slug]];
        }
    }
    return array_values($saida);
}

// Mensagem de chave única repetida (e-mail ou documento) → 409 no campo certo.
function nf_erro_duplicado(PDOException $ex, bool $empresa): never
{
    $campo = str_contains($ex->getMessage(), 'uq_usuarios_documento') ? 'documento' : 'email';
    $texto = $campo === 'email'
        ? 'Já existe uma conta com este e-mail.'
        : ($empresa ? 'Já existe uma conta com este CNPJ.' : 'Já existe uma conta com este CPF.');
    nf_erro(409, $texto, ['campos' => [$campo => $texto]]);
}

// Grava cliente + endereço principal + interesses numa transação. Devolve o id.
function nf_gravar_cliente_novo(array $config, array $v, ?string $situacaoCnpj, array $interesses): int
{
    $u = $v['usuario'];
    $en = $v['endereco'];
    $banco = nf_banco($config);
    $banco->beginTransaction();
    try {
        nf_consulta($config,
            'INSERT INTO usuarios (primeiro_nome, sobrenome, tipo_pessoa, documento, razao_social, nome_fantasia,
                                   situacao_cnpj, cnpj_verificado_em, email, telefone, senha_hash, aceite_privacidade_em)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [$u['primeiro_nome'], $u['sobrenome'], $u['tipo_pessoa'], $u['documento'], $u['razao_social'], $u['nome_fantasia'],
             $situacaoCnpj, $situacaoCnpj !== null ? date('Y-m-d H:i:s') : null, $u['email'], $u['telefone'],
             password_hash($v['senha'], PASSWORD_ARGON2ID)]);
        $id = (int) $banco->lastInsertId();
        nf_consulta($config,
            'INSERT INTO enderecos (usuario_id, apelido, cep, rua, numero, complemento, bairro, cidade, uf, principal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
            [$id, $u['tipo_pessoa'] === 'PJ' ? 'Matriz' : 'Principal', $en['cep'], $en['rua'], $en['numero'],
             $en['complemento'], $en['bairro'], $en['cidade'], $en['uf']]);
        foreach ($interesses as $i) {
            nf_consulta($config, 'INSERT INTO usuario_interesses (usuario_id, produto_slug, produto_nome) VALUES (?, ?, ?)',
                [$id, $i['slug'], $i['nome']]);
        }
        $banco->commit();
        return $id;
    } catch (PDOException $ex) {
        $banco->rollBack();
        if (($ex->errorInfo[1] ?? 0) === 1062) {
            nf_erro_duplicado($ex, $u['tipo_pessoa'] === 'PJ');
        }
        throw $ex;
    }
}

// Aviso de cliente novo: notificação no painel + e-mail para a NF. Falhas não afetam o cadastro.
function nf_avisar_cliente_novo(array $config, int $id, array $v, array $interesses, ?string $situacaoCnpj): void
{
    try {
        $u = $v['usuario'];
        $resumo = mb_substr("Novo cliente: {$u['primeiro_nome']} {$u['sobrenome']} ("
            . ($u['tipo_pessoa'] === 'PJ' ? 'empresa' : 'pessoa física') . ')'
            . ($interesses ? ' · ' . count($interesses) . ' produto(s) de interesse' : ''), 0, 300);
        nf_consulta($config, "INSERT INTO notificacoes (tipo, usuario_id, resumo) VALUES ('novo_cliente', ?, ?)", [$id, $resumo]);
        nf_email_novo_cliente($config, $id, $u, $v['endereco'], $interesses, $situacaoCnpj);
    } catch (Throwable $ex) {
        error_log('[api-nf] aviso de cliente novo: ' . $ex->getMessage());
    }
}
