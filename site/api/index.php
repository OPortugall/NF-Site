<?php
// API do site da NF Soluções Digitais: porta de entrada única.
// Todo pedido para /api/... chega aqui (veja .htaccess); as regras ficam em _lib/.
// Rotas e proteções estão descritas em _lib/rotas.php e no LEIA-ME.md do site.

declare(strict_types=1);

define('NF_API', true);

require __DIR__ . '/_lib/inicio.php';

nf_executar();
