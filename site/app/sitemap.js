import { AMBIENTE } from '@/lib/ambiente';
import { todosOsProdutos } from '@/lib/produtos';
import { URL_DO_SITE } from '@/lib/seguranca.mjs';

// sitemap.xml: lista as páginas públicas para o Google.
export const dynamic = 'force-static';

export default function sitemap() {
  const base = URL_DO_SITE[AMBIENTE];
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/loja`, priority: 0.9 },
    ...todosOsProdutos().map((p) => ({ url: `${base}/loja/inicio/${p.slug}.html`, priority: 0.7 })),
    { url: `${base}/privacidade`, priority: 0.2 },
    { url: `${base}/termos`, priority: 0.2 },
  ];
}
