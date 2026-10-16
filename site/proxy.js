import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

// Ambiente de TESTE protegido por usuário e senha (o navegador pede ao abrir o site).
// Assim, só a equipe e o cliente acessam a versão de teste; robôs e o Google ficam de fora.
//
// Usuário e senha vêm de variáveis de ambiente do servidor (sem NEXT_PUBLIC_, então nunca
// vão para o navegador): TESTE_USUARIO e TESTE_SENHA. Se faltarem, o teste fica fechado.
// Em produção e no computador (desenvolvimento) esta proteção não é aplicada.

function iguais(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y); // comparação sem "vazar" tempo
}

export function proxy(request) {
  if (process.env.NEXT_PUBLIC_AMBIENTE !== 'teste') return NextResponse.next();

  const usuario = process.env.TESTE_USUARIO;
  const senha = process.env.TESTE_SENHA;
  if (!usuario || !senha || senha.length < 12) {
    return new NextResponse('Ambiente de teste sem usuário e senha configurados.', { status: 503 });
  }

  const cabecalho = request.headers.get('authorization') || '';
  if (cabecalho.startsWith('Basic ')) {
    const [u, ...resto] = Buffer.from(cabecalho.slice(6), 'base64').toString('utf8').split(':');
    if (iguais(u, usuario) && iguais(resto.join(':'), senha)) return NextResponse.next();
  }

  return new NextResponse('Acesso restrito ao ambiente de teste.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="NF Solucoes - ambiente de teste", charset="UTF-8"' },
  });
}

// A senha protege todas as páginas e o código. Ficam de fora só as imagens públicas
// (as mesmas da produção): o otimizador de imagens do Next.js busca o arquivo original
// por dentro do servidor, sem a senha, e sem esta exceção as fotos não carregariam.
export const config = {
  matcher: ['/((?!_next/image|produtos/|destaques/|marcas/|logo-nf\\.jpg$).*)'],
};
