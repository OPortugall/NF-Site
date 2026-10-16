// Cabeçalhos de segurança enviados em todas as páginas.
const emDesenvolvimento = process.env.NODE_ENV === 'development';

// ---------- ambiente (veja lib/ambiente.js e os arquivos .env.*.example) ----------
const ambiente = process.env.NEXT_PUBLIC_AMBIENTE || 'desenvolvimento';
if (!['producao', 'teste', 'desenvolvimento'].includes(ambiente)) {
  throw new Error(`NEXT_PUBLIC_AMBIENTE inválido: "${ambiente}". Use producao, teste ou desenvolvimento.`);
}
// Segredos nunca podem ir para o navegador: barra a compilação se alguém criar NEXT_PUBLIC_ com nome de segredo.
const publicasPerigosas = Object.keys(process.env).filter(
  (n) => n.startsWith('NEXT_PUBLIC_') && /SENHA|SEGREDO|SECRET|TOKEN|PASSWORD|CHAVE|KEY|DATABASE/i.test(n),
);
if (publicasPerigosas.length) {
  throw new Error(`Variáveis com segredo não podem começar com NEXT_PUBLIC_ (iriam para o navegador): ${publicasPerigosas.join(', ')}`);
}

// Content-Security-Policy: de onde o navegador pode carregar cada tipo de recurso.
// Só o próprio site, mais os serviços que ele realmente usa.
const politica = [
  "default-src 'self'",
  // O Next.js coloca pequenos scripts na própria página ('unsafe-inline'); 'unsafe-eval' só no modo de desenvolvimento.
  `script-src 'self' 'unsafe-inline'${emDesenvolvimento ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // Consulta de CNPJ (Receita) e de CEP no cadastro
  "connect-src 'self' https://brasilapi.com.br https://publica.cnpj.ws https://viacep.com.br",
  // Mapa da seção de contato
  'frame-src https://maps.google.com https://www.google.com',
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const cabecalhos = [
  { key: 'Content-Security-Policy', value: politica },
  { key: 'X-Frame-Options', value: 'DENY' }, // ninguém pode embutir o site (golpe do "clique falso")
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }, // sempre HTTPS (vale no domínio real)
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Fora da produção, o Google não indexa nada (nem imagens e arquivos)
  ...(ambiente === 'producao' ? [] : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pasta da compilação: permite compilar os dois ambientes lado a lado no computador (padrão: .next)
  distDir: process.env.PASTA_BUILD || '.next',
  poweredByHeader: false, // não anuncia que o site usa Next.js
  async headers() {
    return [{ source: '/:path*', headers: cabecalhos }];
  },
  // Endereços das páginas legais da loja antiga (PrestaShop), para links e buscadores não darem erro
  async redirects() {
    return [
      { source: '/loja/content/2-politica-privacidade', destination: '/privacidade', permanent: true },
      { source: '/loja/content/3-termos-de-utilizacao', destination: '/termos', permanent: true },
    ];
  },
};

export default nextConfig;
