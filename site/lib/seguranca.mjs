// Regras de segurança e redirecionamentos do site, num lugar só.
// Usadas por next.config.mjs (no computador, com "npm run dev"), por scripts/compilar.mjs
// (que escreve o .htaccess do servidor Apache da hospedagem) e por scripts/ver.mjs (prévia local).

export const AMBIENTES = ['producao', 'teste', 'desenvolvimento'];

// Endereço público de cada ambiente (usado em links canônicos, sitemap e robots.txt)
export const URL_DO_SITE = {
  producao: 'https://nfsolucoesdigitais.com.br',
  teste: 'https://teste.nfsolucoesdigitais.com.br',
  desenvolvimento: 'http://localhost:3000',
};

// Content-Security-Policy: de onde o navegador pode carregar cada tipo de recurso.
// Só o próprio site, mais os serviços que ele realmente usa.
export function politicaDeConteudo({ desenvolvimento = false } = {}) {
  return [
    "default-src 'self'",
    // O Next.js coloca pequenos scripts na própria página ('unsafe-inline'); 'unsafe-eval' só no modo de desenvolvimento.
    `script-src 'self' 'unsafe-inline'${desenvolvimento ? " 'unsafe-eval'" : ''}`,
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
}

export function cabecalhosDeSeguranca(ambiente, { desenvolvimento = false } = {}) {
  return [
    { key: 'Content-Security-Policy', value: politicaDeConteudo({ desenvolvimento }) },
    { key: 'X-Frame-Options', value: 'DENY' }, // ninguém pode embutir o site (golpe do "clique falso")
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }, // sempre HTTPS
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    // Fora da produção, o Google não indexa nada (nem imagens e arquivos)
    ...(ambiente === 'producao' ? [] : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
  ];
}

// Endereços antigos que mudaram (loja PrestaShop e site antigo)
export const REDIRECIONAMENTOS = [
  { de: '/loja/content/2-politica-privacidade', para: '/privacidade' },
  { de: '/loja/content/3-termos-de-utilizacao', para: '/termos' },
];
