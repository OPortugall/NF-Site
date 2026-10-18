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

// ---------- área do cliente ----------
export const lerConta = () => pedir('GET', 'conta');
export const lerOrcamentos = () => pedir('GET', 'orcamentos');
export const criarOrcamento = (itens, observacoes) => enviar('orcamento-criar', { itens, observacoes });
export const cancelarOrcamento = (codigo) => enviar('orcamento-cancelar', { codigo });
export const excluirConta = (senha, confirmacao) => enviar('conta-excluir', { senha, confirmacao });

// Estoque ao vivo (0 = indisponível). null quando a API não responde: o site fica com o da compilação.
export async function lerEstoque() {
  const r = await pedir('GET', 'estoque');
  return r.ok && r.dados.estoque && typeof r.dados.estoque === 'object' ? r.dados.estoque : null;
}

// ---------- painel administrativo (/api/admin/...) ----------
// Mesmo cookie e mesmo código CSRF; a sessão do painel começa em GET admin/sessao.
export const adminLer = (rota) => pedir('GET', `admin/${rota}`);
// Envio de arquivo (foto de produto): multipart/form-data, com o mesmo código CSRF
export async function adminEnviarArquivo(rota, campos) {
  if (!csrf) await pedir('GET', 'admin/sessao');
  const formulario = () => {
    const f = new FormData();
    for (const [k, v] of Object.entries(campos)) f.append(k, v);
    return f;
  };
  const tentar = async () => {
    try {
      const r = await fetch(`/api/admin/${rota}`, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { Accept: 'application/json', 'X-CSRF-Token': csrf || '' }, body: formulario(),
      });
      let corpo = {};
      try { corpo = await r.json(); } catch { /* sem JSON */ }
      if (corpo.csrf) csrf = corpo.csrf;
      return { ok: r.ok, status: r.status, dados: corpo, erro: r.ok ? null : corpo.erro || 'Não foi possível enviar a foto.', codigo: corpo.codigo };
    } catch {
      return { ok: false, status: 0, erro: 'Sem conexão com o site. Confira sua internet e tente de novo.' };
    }
  };
  let r = await tentar();
  if (r.status === 403 && r.codigo === 'csrf') {
    await pedir('GET', 'admin/sessao');
    r = await tentar();
  }
  return r;
}

export async function adminEnviar(rota, dados) {
  if (!csrf) await pedir('GET', 'admin/sessao');
  let r = await pedir('POST', `admin/${rota}`, dados);
  if (r.status === 403 && r.codigo === 'csrf') {
    await pedir('GET', 'admin/sessao');
    r = await pedir('POST', `admin/${rota}`, dados);
  }
  return r;
}
