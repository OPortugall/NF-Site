// Chamadas à API do site (PHP, em /api/ no mesmo endereço do site).
// O cookie da sessão é HttpOnly e vai sozinho; o código CSRF vem de GET /api/sessao
// e acompanha todo POST no cabeçalho X-CSRF-Token.

let csrf = null;

async function pedir(metodo, rota, dados) {
  const opcoes = { method: metodo, credentials: 'same-origin', headers: { Accept: 'application/json' }, cache: 'no-store' };
  if (dados !== undefined) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.headers['X-CSRF-Token'] = csrf || '';
    opcoes.body = JSON.stringify(dados);
  }
  let r;
  try {
    r = await fetch(`/api/${rota}`, opcoes);
  } catch {
    return { ok: false, status: 0, erro: 'Sem conexão com o site. Confira sua internet e tente de novo.' };
  }
  let corpo = {};
  try {
    corpo = await r.json();
  } catch {
    // resposta sem JSON (ex.: servidor fora do ar)
  }
  if (corpo.csrf) csrf = corpo.csrf;
  return {
    ok: r.ok,
    status: r.status,
    dados: corpo,
    erro: r.ok ? null : corpo.erro || 'Não foi possível concluir agora. Tente de novo em instantes.',
    campos: corpo.campos || {},
    codigo: corpo.codigo,
  };
}

export async function lerSessao() {
  return pedir('GET', 'sessao');
}

// POST com nova tentativa automática se o código CSRF tiver vencido (sessão expirada no servidor).
async function enviar(rota, dados) {
  if (!csrf) await lerSessao();
  let r = await pedir('POST', rota, dados);
  if (r.status === 403 && r.codigo === 'csrf') {
    await lerSessao();
    r = await pedir('POST', rota, dados);
  }
  return r;
}

export const entrarNaApi = (email, senha) => enviar('entrar', { email, senha });
export const cadastrarNaApi = (dados) => enviar('cadastrar', dados);
export const sairDaApi = () => enviar('sair', {});
