<?php
// Envio de e-mails (avisos de cliente novo e de pedido de orçamento para a NF; aviso de pagamento
// pendente para o cliente).
//
// Configuração ('email' no arquivo de config):
//   'modo'       => 'mail' (servidor do cPanel) | 'arquivo' (grava .eml numa pasta: testes) | 'desligado'
//   'remetente'  => 'naoresponda@nfsolucoesdigitais.com.br' (conta de e-mail que existe no cPanel)
//   'admin'      => 'contato@nfsolucoesdigitais.com.br'     (quem recebe os avisos de cliente novo)
//   'pasta'      => pasta dos .eml no modo 'arquivo'
// Sem configuração, os e-mails ficam desligados (a API funciona normalmente, só não avisa).

declare(strict_types=1);

defined('NF_API') || exit;

const NF_CONTATO_EMPRESA = "NF Soluções Digitais\n"
    . "Telefone: (12) 3029-3838 · WhatsApp: (12) 97405-2176\n"
    . "contato@nfsolucoesdigitais.com.br · nfsolucoesdigitais.com.br";

function nf_email_config(array $config): array
{
    return (array) ($config['email'] ?? []) + [
        'modo' => 'desligado',
        'remetente' => '',
        'nome_remetente' => 'NF Soluções Digitais',
        'admin' => '',
        'pasta' => '',
    ];
}

// Devolve true se o e-mail foi entregue ao servidor de envio. Nunca lança erro:
// falha de e-mail não pode quebrar o cadastro nem o painel (fica registrada no log).
function nf_enviar_email(array $config, string $para, string $assunto, string $texto): bool
{
    $e = nf_email_config($config);
    // Barra injeção de cabeçalhos (quebras de linha) e endereços inválidos
    if (!nf_email_valido($para) || preg_match('/[\r\n]/', $para . $assunto)) {
        return false;
    }
    $texto = str_replace(["\r\n", "\r"], "\n", $texto);
    try {
        if ($e['modo'] === 'arquivo') {
            if (!is_dir($e['pasta']) && !mkdir($e['pasta'], 0700, true) && !is_dir($e['pasta'])) {
                return false;
            }
            $nome = sprintf('%s/%s-%s.eml', $e['pasta'], date('Ymd-His'), bin2hex(random_bytes(4)));
            return file_put_contents($nome, "To: {$para}\nSubject: {$assunto}\n\n{$texto}") !== false;
        }
        if ($e['modo'] === 'mail') {
            if (!nf_email_valido($e['remetente'])) {
                error_log('[api-nf] e-mail: remetente inválido na configuração');
                return false;
            }
            $cabecalhos = [
                'From' => mb_encode_mimeheader($e['nome_remetente'], 'UTF-8', 'Q') . " <{$e['remetente']}>",
                'Reply-To' => nf_email_valido($e['admin']) ? $e['admin'] : $e['remetente'],
                'MIME-Version' => '1.0',
                'Content-Type' => 'text/plain; charset=UTF-8',
                'Content-Transfer-Encoding' => '8bit',
                'X-Auto-Response-Suppress' => 'All',
            ];
            $ok = mail($para, mb_encode_mimeheader($assunto, 'UTF-8', 'B'), $texto, $cabecalhos, '-f' . $e['remetente']);
            if (!$ok) {
                error_log('[api-nf] e-mail: o servidor recusou o envio');
            }
            return $ok;
        }
    } catch (Throwable $ex) {
        error_log('[api-nf] e-mail: ' . $ex->getMessage());
    }
    return false;
}

function nf_registrar_email(array $config, ?int $usuarioId, string $tipo, bool $sucesso): void
{
    nf_consulta($config, 'INSERT INTO emails_enviados (usuario_id, tipo, sucesso) VALUES (?, ?, ?)',
        [$usuarioId, $tipo, $sucesso ? 1 : 0]);
}

// ---------- textos ----------

function nf_email_novo_cliente(array $config, int $id, array $u, array $endereco, array $interesses, ?string $situacaoCnpj): void
{
    $admin = nf_email_config($config)['admin'];
    if (!nf_email_valido($admin)) {
        return;
    }
    $empresa = $u['tipo_pessoa'] === 'PJ';
    $linhas = [
        'Novo cliente cadastrado no site.',
        '',
        "Nome: {$u['primeiro_nome']} {$u['sobrenome']}",
        'Tipo: ' . ($empresa ? 'Empresa (compra e locação)' : 'Pessoa física (compra)'),
        ($empresa ? 'CNPJ: ' : 'CPF: ') . nf_formatar_documento($u['documento']),
    ];
    if ($empresa) {
        $linhas[] = "Razão social: {$u['razao_social']}";
        if (!empty($u['nome_fantasia'])) {
            $linhas[] = "Nome fantasia: {$u['nome_fantasia']}";
        }
        $linhas[] = 'Situação na Receita: ' . ($situacaoCnpj ?? 'não conferida (consulta indisponível)');
    }
    $linhas[] = "E-mail: {$u['email']}";
    $linhas[] = 'Telefone: ' . nf_formatar_telefone($u['telefone']);
    $linhas[] = "Cidade: {$endereco['cidade']}/{$endereco['uf']}";
    $linhas[] = '';
    $linhas[] = 'Produtos de interesse:';
    foreach ($interesses ?: [['nome' => 'Nenhum marcado']] as $i) {
        $linhas[] = "• {$i['nome']}";
    }
    $linhas[] = '';
    $linhas[] = 'Ver no painel: ' . rtrim((string) ($config['url_site'] ?? ''), '/') . "/admin#cliente/{$id}";

    $ok = nf_enviar_email($config, $admin, "Novo cliente: {$u['primeiro_nome']} {$u['sobrenome']}", implode("\n", $linhas));
    nf_registrar_email($config, $id, 'novo_cliente_admin', $ok);
}

// Pedido de orçamento enviado pelo site: aviso para a equipe (Reply-To = e-mail da NF, nunca o do cliente).
function nf_email_novo_orcamento(array $config, int $orcamentoId, string $codigo, array $u, array $itens, ?string $observacoes, ?array $endereco): void
{
    $admin = nf_email_config($config)['admin'];
    if (!nf_email_valido($admin)) {
        return;
    }
    $modalidades = ['compra' => 'compra', 'locacao' => 'locação'];
    $linhas = [
        "Novo pedido de orçamento pelo site: {$codigo}",
        '',
        "Cliente: {$u['primeiro_nome']} {$u['sobrenome']}" . ($u['tipo_pessoa'] === 'PJ' ? " ({$u['razao_social']})" : ''),
        "E-mail: {$u['email']}",
        'Telefone: ' . nf_formatar_telefone($u['telefone']),
    ];
    if ($endereco) {
        $linhas[] = "Cidade: {$endereco['cidade']}/{$endereco['uf']}";
    }
    $linhas[] = '';
    $linhas[] = 'Produtos:';
    foreach ($itens as $i) {
        $linhas[] = "• {$i['quantidade']}x {$i['nome']} ({$modalidades[$i['modalidade']]})";
    }
    if ($observacoes) {
        $linhas[] = '';
        $linhas[] = 'Observações do cliente:';
        $linhas[] = $observacoes;
    }
    $linhas[] = '';
    $linhas[] = 'Ver no painel: ' . rtrim((string) ($config['url_site'] ?? ''), '/') . "/admin#orcamento/{$orcamentoId}";

    $ok = nf_enviar_email($config, $admin, "Pedido de orçamento {$codigo}: {$u['primeiro_nome']} {$u['sobrenome']}", implode("\n", $linhas));
    nf_registrar_email($config, (int) $u['id'], 'novo_orcamento_admin', $ok);
}

// Aviso de pagamento pendente. Texto neutro e enviado só ao próprio cliente: o Código de Defesa
// do Consumidor (art. 42) proíbe cobrança que exponha o cliente ao ridículo ou o constranja.
function nf_email_aviso_atraso(array $config, int $id, array $u): bool
{
    $texto = implode("\n", [
        "Olá, {$u['primeiro_nome']}.",
        '',
        'Identificamos um pagamento pendente referente aos produtos ou serviços contratados com a NF Soluções Digitais.',
        '',
        'Se você já fez o pagamento, por favor desconsidere esta mensagem.',
        'Para conferir os valores ou combinar a melhor forma de pagamento, fale com a gente:',
        '',
        NF_CONTATO_EMPRESA,
        '',
        'Atenciosamente,',
        'Equipe NF Soluções Digitais',
    ]);
    $ok = nf_enviar_email($config, $u['email'], 'Aviso de pagamento pendente - NF Soluções Digitais', $texto);
    nf_registrar_email($config, $id, 'aviso_atraso', $ok);
    return $ok;
}

function nf_formatar_documento(string $d): string
{
    return strlen($d) === 11
        ? preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $d)
        : preg_replace('/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/', '$1.$2.$3/$4-$5', $d);
}

function nf_formatar_telefone(string $t): string
{
    return strlen($t) === 11
        ? preg_replace('/(\d{2})(\d{5})(\d{4})/', '($1) $2-$3', $t)
        : preg_replace('/(\d{2})(\d{4})(\d{4})/', '($1) $2-$3', $t);
}
