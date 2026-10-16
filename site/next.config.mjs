import { AMBIENTES, REDIRECIONAMENTOS, cabecalhosDeSeguranca } from './lib/seguranca.mjs';

const emDesenvolvimento = process.env.NODE_ENV === 'development';

// ---------- ambiente (veja lib/ambiente.js e os arquivos .env.*.example) ----------
const ambiente = process.env.NEXT_PUBLIC_AMBIENTE || 'desenvolvimento';
if (!AMBIENTES.includes(ambiente)) {
  throw new Error(`NEXT_PUBLIC_AMBIENTE inválido: "${ambiente}". Use producao, teste ou desenvolvimento.`);
}
// Segredos nunca podem ir para o navegador: barra a compilação se alguém criar NEXT_PUBLIC_ com nome de segredo.
const publicasPerigosas = Object.keys(process.env).filter(
  (n) => n.startsWith('NEXT_PUBLIC_') && /SENHA|SEGREDO|SECRET|TOKEN|PASSWORD|CHAVE|KEY|DATABASE/i.test(n),
);
if (publicasPerigosas.length) {
  throw new Error(`Variáveis com segredo não podem começar com NEXT_PUBLIC_ (iriam para o navegador): ${publicasPerigosas.join(', ')}`);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A hospedagem atual (cPanel) não tem Node.js: o site é gerado como arquivos HTML/CSS/JS prontos
  // (pasta out/), servidos pelo Apache. Cabeçalhos, redirecionamentos e a senha do teste ficam no
  // .htaccess que scripts/compilar.mjs escreve a partir de lib/seguranca.mjs.
  output: 'export',
  // Pasta da compilação: permite compilar os dois ambientes lado a lado (padrão: .next)
  distDir: process.env.PASTA_BUILD || '.next',
  poweredByHeader: false,
  // Sem servidor não há otimizador de imagens: scripts/otimizar-imagens.mjs gera as versões
  // reduzidas (WebP) antes da compilação, e lib/carregador-imagens.mjs escolhe a do tamanho certo.
  images: {
    loader: 'custom',
    loaderFile: './lib/carregador-imagens.mjs',
    deviceSizes: [640, 828, 1080, 1600],
    imageSizes: [64, 128, 256, 384],
  },
  // No "npm run dev" os cabeçalhos e redirecionamentos valem como no servidor
  // (na compilação estática o Next.js não os usa; quem aplica é o .htaccess).
  ...(emDesenvolvimento && {
    async headers() {
      return [{ source: '/:path*', headers: cabecalhosDeSeguranca(ambiente, { desenvolvimento: true }) }];
    },
    async redirects() {
      return REDIRECIONAMENTOS.map(({ de, para }) => ({ source: de, destination: para, permanent: true }));
    },
  }),
};

export default nextConfig;
