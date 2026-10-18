<?php
// Cria (ou promove) um administrador do painel. Só pelo Terminal do cPanel, nunca pela internet.
//
// Uso (no Terminal do cPanel):
//   php ~/nfsolucoesdigitais.com.br-site/api/_cli/criar-admin.php        (produção)
//   php ~/teste.nfsolucoesdigitais.com.br/api/_cli/criar-admin.php       (teste)
//
// Pergunta nome, sobrenome, e-mail, telefone, CPF e a senha (digitada sem aparecer na tela, duas vezes).
// Se o e-mail já tiver conta, só promove a administrador (a senha não muda).
// No primeiro acesso ao /admin, o painel pede o cadastro do app autenticador (2FA).

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

define('NF_API', true);
require dirname(__DIR__) . '/_lib/inicio.php';

function perguntar(string $rotulo): string
{
    echo $rotulo, ': ';
    return trim((string) fgets(STDIN));
}

function perguntar_senha(string $rotulo): string
{
    echo $rotulo, ': ';
    $tty = stream_isatty(STDIN);
    if ($tty) {
        shell_exec('stty -echo');
    }
    $s = rtrim((string) fgets(STDIN), "\r\n");
    if ($tty) {
        shell_exec('stty echo');
    }
    echo "\n";
    return $s;
}

function sair_com_erro(string $msg): never
{
    fwrite(STDERR, "\n✖ {$msg}\n");
    exit(1);
}

try {
    $config = nf_config();
} catch (Throwable $e) {
    sair_com_erro('Configuração: ' . $e->getMessage());
}
echo "Ambiente: {$config['ambiente']}\n\n";

$email = mb_strtolower(perguntar('E-mail do administrador'));
if (!nf_email_valido($email)) {
    sair_com_erro('E-mail inválido.');
}
$existente = nf_consulta($config, 'SELECT id, role FROM usuarios WHERE email = ?', [$email])[0] ?? null;
if ($existente !== null) {
    if ($existente['role'] === 'admin') {
        sair_com_erro('Este e-mail já é administrador.');
    }
    if (strtolower(perguntar('Já existe um cliente com este e-mail. Tornar administrador? (s/n)')) !== 's') {
        sair_com_erro('Nada foi alterado.');
    }
    nf_consulta($config, "UPDATE usuarios SET role = 'admin' WHERE id = ?", [$existente['id']]);
    nf_auditar($config, null, 'admin_criado_terminal', 'admin', (int) $existente['id']);
    echo "\n✔ Conta promovida a administrador. Entre em /admin e cadastre o app autenticador.\n";
    exit(0);
}

$nome = nf_texto(perguntar('Primeiro nome'), 60) ?? sair_com_erro('Nome inválido.');
$sobrenome = nf_texto(perguntar('Sobrenome'), 100) ?? sair_com_erro('Sobrenome inválido.');
$telefone = nf_so_digitos(perguntar('Telefone com DDD'));
if (!preg_match('/^\d{10,11}$/', $telefone)) {
    sair_com_erro('Telefone inválido (DDD + número).');
}
$cpf = nf_so_digitos(perguntar('CPF'));
if (!nf_cpf_valido($cpf)) {
    sair_com_erro('CPF inválido.');
}
$senha = perguntar_senha('Senha (não aparece na tela)');
if (!nf_senha_valida($senha)) {
    sair_com_erro('A senha precisa de 8 a 128 caracteres, com pelo menos uma letra e um número.');
}
if (!hash_equals($senha, perguntar_senha('Repita a senha'))) {
    sair_com_erro('As senhas não conferem.');
}

try {
    nf_consulta($config,
        "INSERT INTO usuarios (primeiro_nome, sobrenome, tipo_pessoa, documento, email, telefone, senha_hash, role, aceite_privacidade_em)
         VALUES (?, ?, 'PF', ?, ?, ?, ?, 'admin', NOW())",
        [$nome, $sobrenome, $cpf, $email, $telefone, password_hash($senha, PASSWORD_ARGON2ID)]);
} catch (PDOException $e) {
    sair_com_erro(($e->errorInfo[1] ?? 0) === 1062 ? 'Já existe uma conta com este CPF.' : 'Erro no banco: ' . $e->getMessage());
}
$id = (int) nf_banco($config)->lastInsertId();
nf_auditar($config, null, 'admin_criado_terminal', 'admin', $id);
echo "\n✔ Administrador criado. Entre em /admin e cadastre o app autenticador (2FA).\n";
