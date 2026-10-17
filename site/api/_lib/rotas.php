<?php
// Rotas da API (fase 1: contas).
//
//   GET  /api/sessao     → { cliente: {nome, email, tipo} | null, csrf }
//   POST /api/cadastrar  → 201 { cliente }          (cria a conta e já entra)
//   POST /api/entrar     → 200 { cliente }          (e-mail e senha)
//   POST /api/sair       → 200 { cliente: null }
//
// Todo POST exige JSON e o cabeçalho X-CSRF-Token com o código recebido em GET /api/sessao.

declare(strict_types=1);

defined('NF_API') || exit;

// Hash de uma senha aleatória descartada: quando o e-mail não existe, a senha é conferida
// contra ele mesmo assim, para a resposta demorar o mesmo tempo (não revela quais e-mails existem).
const NF_HASH_FALSO = '$argon2id$v=19$m=65536,t=4,p=1$YUlCd0ZWbEo4Y0xxbVFLcg$J8mmt8jsp6HGLLqYSBSv6EPnCSq389e/t8G7FMLIExE';
const NF_LOGIN_INVALIDO = 'E-mail ou senha incorretos.';

function nf_rotas(): array
{
    return [
        'sessao' => ['GET' => 'nf_rota_sessao'],
        'cadastrar' => ['POST' => 'nf_rota_cadastrar'],
        'entrar' => ['POST' => 'nf_rota_entrar'],
        'sair' => ['POST' => 'nf_rota_sair'],
    ];
}

function nf_rota_sessao(array $config): never
{
    nf_iniciar_sessao($config);
    nf_responder(200, ['cliente' => nf_cliente_atual($config), 'csrf' => $_SESSION['csrf']]);
}

function nf_rota_sair(array $config): never
{
    nf_encerrar_sessao($config);
    nf_responder(200, ['cliente' => null]);
}

function nf_rota_entrar(array $config): never
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

    $linhas = nf_consulta($config,
        'SELECT id, primeiro_nome, email, tipo_pessoa, senha_hash, status FROM usuarios WHERE email = ?', [$email]);
    $u = $linhas[0] ?? null;
    $hash = $u['senha_hash'] ?? null;
    $senhaCerta = password_verify($senha, $hash ?? NF_HASH_FALSO);
    $ok = $u !== null && $hash !== null && $senhaCerta && $u['status'] === 'ativo';

    nf_registrar_tentativa($config, $email, $ip, $ok);
    if (!$ok) {
        nf_erro(401, NF_LOGIN_INVALIDO);
    }

    if (password_needs_rehash($hash, PASSWORD_ARGON2ID)) {
        nf_consulta($config, 'UPDATE usuarios SET senha_hash = ? WHERE id = ?', [password_hash($senha, PASSWORD_ARGON2ID), $u['id']]);
    }
    nf_consulta($config, 'UPDATE usuarios SET ultimo_login_em = NOW() WHERE id = ?', [$u['id']]);
    nf_iniciar_sessao($config);
    nf_registrar_login((int) $u['id']);
    nf_responder(200, ['cliente' => nf_cliente_publico($u), 'csrf' => $_SESSION['csrf']]);
}

function nf_rota_cadastrar(array $config): never
{
    if (!defined('PASSWORD_ARGON2ID')) {
        throw new RuntimeException('PHP sem suporte a argon2id (ative a extensão sodium)');
    }
    $d = nf_ler_json();
    $e = []; // erros por campo (mesmos nomes do formulário)

    $tipo = $d['tipo'] ?? null;
    if (!in_array($tipo, ['cpf', 'cnpj'], true)) {
        nf_erro(422, 'Escolha CPF ou CNPJ.', ['campos' => ['tipo' => 'Escolha CPF ou CNPJ.']]);
    }
    $empresa = $tipo === 'cnpj';

    $nome = nf_texto($d['nome'] ?? null, 60) ?? ($e['nome'] = 'Digite seu primeiro nome (até 60 letras).');
    $sobrenome = nf_texto($d['sobrenome'] ?? null, 100) ?? ($e['sobrenome'] = 'Digite seu sobrenome (até 100 letras).');
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
    if (!nf_senha_valida($senha)) {
        $e['senha'] = 'A senha precisa de 8 a 128 caracteres, com pelo menos uma letra e um número.';
    }
    if (($d['aceite'] ?? null) !== true) {
        $e['aceite'] = 'Para criar a conta, é preciso concordar com os Termos de Uso e a Política de Privacidade.';
    }
    if ($e) {
        nf_erro(422, 'Confira os campos destacados.', ['campos' => $e]);
    }

    $ip = nf_ip();
    $espera = nf_bloqueio_cadastro($config, $ip);
    if ($espera !== null) {
        nf_erro(429, 'Muitos cadastros feitos daqui. Tente de novo em ' . nf_minutos($espera) . '.', [], ['Retry-After' => (string) $espera]);
    }

    // CNPJ: a Receita é consultada pelo servidor. Se a consulta estiver fora do ar, o cadastro
    // segue sem a situação (a equipe confere depois); se o CNPJ não existir ou não estiver ativo, é recusado.
    $situacao = null;
    if ($empresa) {
        $r = nf_consultar_cnpj($config, $documento);
        if ($r['estado'] === 'nao-encontrado') {
            nf_erro(422, 'Confira os campos destacados.', ['campos' => ['documento' => 'Não encontramos este CNPJ na Receita Federal. Confira os números.']]);
        }
        if ($r['estado'] === 'ok' && !$r['ativa']) {
            nf_erro(422, 'Confira os campos destacados.', ['campos' => ['documento' => "Este CNPJ está com situação \"{$r['situacao']}\" na Receita Federal. O cadastro de empresa exige CNPJ ativo."]]);
        }
        $situacao = $r['estado'] === 'ok' ? $r['situacao'] : null;
    }

    $banco = nf_banco($config);
    $banco->beginTransaction();
    try {
        nf_consulta($config,
            'INSERT INTO usuarios (primeiro_nome, sobrenome, tipo_pessoa, documento, razao_social, nome_fantasia,
                                   situacao_cnpj, cnpj_verificado_em, email, telefone, senha_hash, aceite_privacidade_em)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [$nome, $sobrenome, $empresa ? 'PJ' : 'PF', $documento, $razaoSocial, $nomeFantasia ?: null,
             $situacao, $situacao !== null ? date('Y-m-d H:i:s') : null, $email, $telefone,
             password_hash($senha, PASSWORD_ARGON2ID)]);
        $id = (int) $banco->lastInsertId();
        nf_consulta($config,
            "INSERT INTO enderecos (usuario_id, apelido, cep, rua, numero, complemento, bairro, cidade, uf, principal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
            [$id, $empresa ? 'Matriz' : 'Principal', $cep, $rua, $numero, $complemento ?: null, $bairro, $cidade, $uf]);
        $banco->commit();
    } catch (PDOException $ex) {
        $banco->rollBack();
        if (($ex->errorInfo[1] ?? 0) === 1062) { // chave única repetida
            $campo = str_contains($ex->getMessage(), 'uq_usuarios_documento') ? 'documento' : 'email';
            $texto = $campo === 'email'
                ? 'Já existe uma conta com este e-mail. Entre na sua conta ou use outro e-mail.'
                : ($empresa ? 'Já existe uma conta com este CNPJ.' : 'Já existe uma conta com este CPF.');
            nf_erro(409, $texto, ['campos' => [$campo => $texto]]);
        }
        throw $ex;
    }

    nf_registrar_cadastro($config, $ip);
    nf_iniciar_sessao($config);
    nf_registrar_login($id);
    nf_responder(201, [
        'cliente' => ['nome' => $nome, 'email' => $email, 'tipo' => $tipo],
        'csrf' => $_SESSION['csrf'],
        'situacaoCnpj' => $empresa ? ($situacao ?? 'não conferida (consulta indisponível)') : null,
    ]);
}
