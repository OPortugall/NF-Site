// Compila o site estático de um ambiente, pronto para enviar à hospedagem (cPanel/Apache, sem Node.js).
//
// Uso:  npm run compilar:producao   →  publicar/producao/   (conteúdo vai para a pasta do domínio)
//       npm run compilar:teste      →  publicar/teste/      (conteúdo vai para a pasta do subdomínio de teste)
//
// Além do HTML/CSS/JS, escreve o .htaccess com o que no "npm run dev" o Next.js faz sozinho:
// cabeçalhos de segurança, HTTPS, redirecionamentos, endereços sem ".html" e, no teste, a senha.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { REDIRECIONAMENTOS, cabecalhosDeSeguranca } from '../lib/seguranca.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..');
const ambiente = process.argv[2];
const PADROES = {
  producao: { contas: 'false' }, // vitrine: sem login, cadastro e carrinho
  teste: { contas: 'true' },
};
if (!(ambiente in PADROES)) {
  console.error('Uso: node scripts/compilar.mjs producao|teste');
  process.exit(1);
}

// Arquivo de senhas do teste, criado pelo cPanel em "Privacidade do diretório" (veja LEIA-ME.md)
const HTPASSWD_TESTE =
  process.env.HTPASSWD_TESTE || '/home/raioxper/.htpasswds/teste.nfsolucoesdigitais.com.br/passwd';

function rodar(rotulo, args, env = {}) {
  console.log(`\n▶ ${rotulo}`);
  const r = spawnSync(process.execPath, args, { cwd: RAIZ, stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.status !== 0) {
    console.error(`✖ Falhou: ${rotulo}`);
    process.exit(r.status || 1);
  }
}

// ---------- 1. fotos reduzidas e compilação ----------
rodar('Gerando as fotos reduzidas', ['scripts/otimizar-imagens.mjs']);
// Com output: 'export', o Next.js grava o site pronto na própria pasta de compilação (distDir)
const destino = path.join(RAIZ, 'publicar', ambiente);
rodar(`Compilando o ambiente "${ambiente}"`, [path.join('node_modules', 'next', 'dist', 'bin', 'next'), 'build'], {
  NEXT_PUBLIC_AMBIENTE: ambiente,
  NEXT_PUBLIC_CONTAS_ATIVAS: process.env.NEXT_PUBLIC_CONTAS_ATIVAS || PADROES[ambiente].contas,
  PASTA_BUILD: path.relative(RAIZ, destino),
  NEXT_TELEMETRY_DISABLED: '1',
});

// Na vitrine o login não existe: não publica a página /entrar (o servidor responde 404)
if (PADROES[ambiente].contas === 'false' && process.env.NEXT_PUBLIC_CONTAS_ATIVAS !== 'true') {
  for (const f of ['entrar.html', 'entrar.txt', 'entrar']) await rm(path.join(destino, f), { recursive: true, force: true });
}

// Arquivos de navegação do Next.js: ele grava loja/__next.loja/__PAGE__.txt, mas o navegador pede
// loja/__next.loja.__PAGE__.txt (nome "achatado"). Sem servidor Node para traduzir, achatamos aqui.
async function achatar(pasta) {
  for (const item of await readdir(pasta, { withFileTypes: true })) {
    const caminho = path.join(pasta, item.name);
    if (!item.isDirectory()) continue;
    if (!item.name.startsWith('__next.')) { await achatar(caminho); continue; }
    for (const f of await readdir(caminho, { recursive: true, withFileTypes: true })) {
      if (!f.isFile()) continue;
      const partes = path.relative(caminho, path.join(f.parentPath, f.name)).split(path.sep);
      await rename(path.join(f.parentPath, f.name), path.join(pasta, [item.name, ...partes].join('.')));
    }
    await rm(caminho, { recursive: true, force: true });
  }
}
await achatar(destino);

// ---------- 2. .htaccess ----------
const aspas = (v) => `"${v.replace(/"/g, '\\"')}"`;
const regex = (url) => url.replace(/^\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const htaccess = `# Gerado por scripts/compilar.mjs (${ambiente}). Não edite aqui: mude lib/seguranca.mjs e compile de novo.

Options -Indexes -MultiViews
DirectoryIndex index.html
# /loja é página (loja.html) e também pasta (loja/inicio/...): sem isto o Apache trocaria por /loja/
DirectorySlash Off
ErrorDocument 404 /404.html
AddDefaultCharset utf-8
AddType image/webp .webp
${
  ambiente === 'teste'
    ? `
# ---------- ambiente de teste: só a equipe entra (usuário e senha do cPanel) ----------
AuthType Basic
AuthName "NF Solucoes - ambiente de teste"
AuthUserFile ${aspas(HTPASSWD_TESTE)}
Require valid-user
`
    : ''
}
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# Sempre HTTPS e sem "www."
RewriteCond %{HTTPS} off
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]

# Endereços antigos
${REDIRECIONAMENTOS.map(({ de, para }) => `RewriteRule ^${regex(de)}/?$ ${para} [R=301,L]`).join('\n')}
# Pastas do site antigo (nfs, nf, raiz) vão para a página inicial
RewriteRule ^(nfs|nf|raiz)(/.*)?$ / [R=301,L]

# Barra no fim (/loja/ → /loja) quando a página existe
RewriteCond %{REQUEST_FILENAME} -d
RewriteCond %{DOCUMENT_ROOT}/$1.html -f
RewriteRule ^(.+)/$ /$1 [R=301,L]

# Endereço sem ".html" → arquivo .html (/privacidade → privacidade.html;
# /loja/inicio/15-mp5001.html → 15-mp5001.html.html, mantendo os endereços da loja antiga)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.+)$ $1.html [L]
</IfModule>

<IfModule mod_headers.c>
${cabecalhosDeSeguranca(ambiente)
  .map(({ key, value }) => `Header always set ${key} ${aspas(value)}`)
  .join('\n')}
Header always unset X-Powered-By
</IfModule>

<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType text/html "access plus 0 seconds"
ExpiresByType image/webp "access plus 30 days"
ExpiresByType image/jpeg "access plus 30 days"
ExpiresByType image/png "access plus 30 days"
ExpiresByType image/svg+xml "access plus 30 days"
</IfModule>
`;
await writeFile(path.join(destino, '.htaccess'), htaccess);

// Arquivos de _next/static têm o conteúdo no nome: podem ficar guardados no navegador por 1 ano
const estaticos = path.join(destino, '_next', 'static');
if (existsSync(estaticos)) {
  await writeFile(
    path.join(estaticos, '.htaccess'),
    '<IfModule mod_headers.c>\nHeader set Cache-Control "public, max-age=31536000, immutable"\n</IfModule>\n',
  );
}

console.log(`\n✔ Pronto: publicar/${ambiente}/ (envie TODO o conteúdo, inclusive o .htaccess, para a pasta do site)`);
