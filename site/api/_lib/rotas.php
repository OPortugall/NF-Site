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
        'SELECT id, primeiro_nome, email, tipo_pessoa, senha_hash, status, email_verificado_em FROM usuarios WHERE email = ?', [$email]);
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
    [$v, $erros] = nf_validar_cliente($d, true);
    if (($d['aceite'] ?? null) !== true) {
        $erros['aceite'] = 'Para criar a conta, é preciso concordar com os Termos de Uso e a Política de Privacidade.';
    }
    if ($erros) {
        nf_erro(422, isset($erros['tipo']) ? 'Escolha CPF ou CNPJ.' : 'Confira os campos destacados.', ['campos' => $erros]);
    }
    $interesses = nf_validar_interesses($config, $d['interesses'] ?? null);

    $ip = nf_ip();
    $espera = nf_bloqueio_cadastro($config, $ip);
    if ($espera !== null) {
        nf_erro(429, 'Muitos cadastros feitos daqui. Tente de novo em ' . nf_minutos($espera) . '.', [], ['Retry-After' => (string) $espera]);
    }

    // CNPJ: a Receita é consultada pelo servidor. Fora do ar → segue sem a situação (a equipe confere depois).
    $empresa = $v['tipo'] === 'cnpj';
    $situacao = $empresa ? nf_conferir_cnpj_cliente($config, $v['usuario']['documento']) : null;

    $id = nf_gravar_cliente_novo($config, $v, $situacao, $interesses);
    nf_registrar_cadastro($config, $ip);
    nf_iniciar_sessao($config);
    nf_registrar_login($id);
    nf_avisar_cliente_novo($config, $id, $v, $interesses, $situacao);
    try {
        nf_registrar_uso($config, '#email-conta', (string) $id);
        nf_enviar_confirmacao($config, ['id' => $id, 'primeiro_nome' => $v['usuario']['primeiro_nome'], 'email' => $v['usuario']['email']]);
    } catch (Throwable $ex) {
        error_log('[api-nf] e-mail de confirmação: ' . $ex->getMessage()); // a conta já existe; pode reenviar depois
    }
    nf_responder(201, [
        'cliente' => ['nome' => $v['usuario']['primeiro_nome'], 'email' => $v['usuario']['email'], 'tipo' => $v['tipo'], 'emailConfirmado' => false],
        'csrf' => $_SESSION['csrf'],
        'situacaoCnpj' => $empresa ? ($situacao ?? 'não conferida (consulta indisponível)') : null,
    ]);
}
