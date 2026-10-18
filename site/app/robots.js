import { AMBIENTE, EH_PRODUCAO } from '@/lib/ambiente';
import { URL_DO_SITE } from '@/lib/seguranca.mjs';

// robots.txt: a produção é aberta ao Google; teste e desenvolvimento ficam fora.
export const dynamic = 'force-static';

export default function robots() {
  if (!EH_PRODUCAO) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/entrar', '/admin', '/api/'] },
    sitemap: `${URL_DO_SITE[AMBIENTE]}/sitemap.xml`,
  };
}
