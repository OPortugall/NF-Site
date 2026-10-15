// Cabeçalhos de segurança enviados em todas as páginas.
const emDesenvolvimento = process.env.NODE_ENV === 'development';

// Content-Security-Policy: de onde o navegador pode carregar cada tipo de recurso.
// A vitrine não consulta serviços externos; só o próprio site e o mapa do Google.
const politica = [
  "default-src 'self'",
  // O Next.js coloca pequenos scripts na própria página ('unsafe-inline'); 'unsafe-eval' só no modo de desenvolvimento.
  `script-src 'self' 'unsafe-inline'${emDesenvolvimento ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
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
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false, // não anuncia que o site usa Next.js
  async headers() {
    return [{ source: '/:path*', headers: cabecalhos }];
  },
};

export default nextConfig;
