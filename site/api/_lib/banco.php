<?php
// Conexão com o banco (MariaDB). Sempre com consultas preparadas: dados nunca entram no SQL.

declare(strict_types=1);

defined('NF_API') || exit;

function nf_banco(array $config): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    $b = $config['banco'];
    try {
        $pdo = new PDO($b['dsn'], $b['usuario'], $b['senha'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,     // preparo real no servidor do banco
            PDO::ATTR_STRINGIFY_FETCHES => false,
            PDO::ATTR_TIMEOUT => 5,
            PDO::MYSQL_ATTR_LOCAL_INFILE => false,   // nunca ler arquivos do servidor
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => false, // um comando por vez (barra "; DROP ...")
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'",
        ]);
    } catch (PDOException $e) {
        error_log('[api-nf] banco indisponível: ' . $e->getMessage());
        nf_erro(503, 'Serviço indisponível no momento. Tente de novo mais tarde.');
    }
    return $pdo;
}

function nf_consulta(array $config, string $sql, array $parametros = []): array
{
    $st = nf_banco($config)->prepare($sql);
    $st->execute($parametros);
    return $st->columnCount() > 0 ? $st->fetchAll() : [];
}
