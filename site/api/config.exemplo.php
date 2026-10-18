<?php
// MODELO da configuração da API (sem valores reais). NÃO vai para o servidor nem tem segredos.
//
// No servidor, copie para FORA da pasta pública, um arquivo por ambiente:
//   /home/raioxper/config-nf/producao.php   (banco raioxper_nf,      usuário raioxper_nfapp)
//   /home/raioxper/config-nf/teste.php      (banco raioxper_nfteste, usuário raioxper_nftst)
// e deixe a pasta config-nf só para o seu usuário (permissão 700; arquivos 600).
//
// Para gerar o "segredo": uma sequência aleatória de 64 caracteres, diferente em cada ambiente
// (por exemplo, a saída de: php -r "echo bin2hex(random_bytes(32));").

return [
    'banco' => [
        'dsn' => 'mysql:host=localhost;dbname=raioxper_nf;charset=utf8mb4',
        'usuario' => 'raioxper_nfapp',
        'senha' => 'SENHA-DO-USUARIO-DO-BANCO',
    ],
    // Chave do HMAC do limite de tentativas (mínimo 32 caracteres)
    'segredo' => 'TROQUE-POR-64-CARACTERES-ALEATORIOS',
    // Sessões dos clientes: pasta privada, fora do site
    'pasta_sessoes' => '/home/raioxper/config-nf/sessoes-producao',
    // Endereços que podem chamar a API (o próprio site)
    'origens' => ['https://nfsolucoesdigitais.com.br'],
    // true em produção e teste (HTTPS); false só no computador
    'cookie_seguro' => true,
    // Consulta da situação do CNPJ na Receita
    'cnpj' => ['url' => 'https://brasilapi.com.br/api/cnpj/v1/{cnpj}'],
    // Endereço do site (usado nos links dos e-mails)
    'url_site' => 'https://nfsolucoesdigitais.com.br',
    // E-mails: aviso de cliente novo (para a NF) e aviso de pagamento pendente (para o cliente).
    // 'remetente' precisa ser uma conta de e-mail criada no cPanel. Sem este bloco, os e-mails ficam desligados.
    'email' => [
        'modo' => 'mail',
        'remetente' => 'naoresponda@nfsolucoesdigitais.com.br',
        'admin' => 'contato@nfsolucoesdigitais.com.br',
    ],
];
