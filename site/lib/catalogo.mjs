// Conversões do catálogo entre o formato do site (dados/*.json, lib/produtos.js) e o do banco
// (tabela produtos, editada no painel). Usado na compilação (scripts/catalogo.mjs) e nos testes.
//
// A descrição fica no banco como texto simples, fácil de editar no painel:
//   ## Título                      → título de seção
//   - item                         → lista (cada linha um item)
//   | Rótulo | Valor               → tabela de especificações (cada linha uma especificação)
//   outro texto                    → parágrafo
// Blocos separados por uma linha em branco.

// Seleção de "Equipamentos em estoque" da página inicial antes de os produtos irem para o banco
export const DESTAQUES_INICIAIS = ['18-mpc3502', '17-mp7500', '1-mpc2050', '16-spc430dn'];

export function blocosParaTexto(blocos) {
  return blocos
    .map((b) => {
      if (b.tipo === 'titulo') return `## ${b.texto}`;
      if (b.tipo === 'lista') return b.itens.map((t) => `- ${t}`).join('\n');
      if (b.tipo === 'specs') return b.linhas.map(([k, v]) => `| ${k} | ${v}`).join('\n');
      return b.texto;
    })
    .join('\n\n');
}

export function textoParaBlocos(texto) {
  const blocos = [];
  const trechos = String(texto || '').replace(/\r\n?/g, '\n').split(/\n\s*\n/);
  // "trecho" = número do trecho: linhas seguidas do mesmo tipo, no mesmo trecho, formam um só bloco
  for (const [trecho, conteudo] of trechos.entries()) {
    const linhas = conteudo.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!linhas.length) continue;
    // Linhas de tipos diferentes no mesmo trecho viram blocos separados, na ordem em que aparecem
    for (const l of linhas) {
      const ultimo = blocos.at(-1);
      if (l.startsWith('## ')) blocos.push({ tipo: 'titulo', texto: l.slice(3).trim() });
      else if (l.startsWith('- ')) {
        if (ultimo?.tipo === 'lista' && ultimo.aberto === trecho) ultimo.itens.push(l.slice(2).trim());
        else blocos.push({ tipo: 'lista', itens: [l.slice(2).trim()], aberto: trecho });
      } else if (l.startsWith('|')) {
        const [k = '', ...v] = l.replace(/^\|/, '').split('|');
        const linha = [k.trim(), v.join('|').trim()];
        if (ultimo?.tipo === 'specs' && ultimo.aberto === trecho) ultimo.linhas.push(linha);
        else blocos.push({ tipo: 'specs', linhas: [linha], aberto: trecho });
      } else if (ultimo?.tipo === 'paragrafo' && ultimo.aberto === trecho) ultimo.texto += ` ${l}`;
      else blocos.push({ tipo: 'paragrafo', texto: l, aberto: trecho });
    }
  }
  return blocos.map(({ aberto, ...b }) => b);
}

// Produto dos arquivos do site → linha do banco (importação inicial pelo painel)
export function siteParaBanco(p, ordem) {
  const locacao = p.tipo !== 'suprimentos';
  return {
    slug: p.slug,
    marca: p.marca,
    modelo: p.modelo || '',
    nome: p.nome,
    categoria: p.tipo,
    impressao: ['multifuncionais', 'impressoras'].includes(p.tipo) ? ({ colorida: 'colorida', pb: 'monocromatica' }[p.impressao] ?? null) : null,
    condicao: p.condicao === 'Novo' ? 'novo' : 'seminovo',
    resumo: p.resumo,
    descricao: blocosParaTexto(p.descricao),
    disponivelVenda: true,
    disponivelLocacao: locacao,
    destaque: DESTAQUES_INICIAIS.includes(p.slug),
    ordem,
    fotos: p.fotos,
  };
}

// Produto da API (/api/catalogo) → formato usado pelas páginas do site
export function bancoParaSite(p) {
  return {
    id: p.id,
    slug: p.slug,
    nome: p.nome,
    marca: p.marca,
    modelo: p.modelo,
    condicao: p.condicao === 'novo' ? 'Novo' : 'Usado',
    resumo: p.resumo,
    tipo: p.categoria,
    impressao: { colorida: 'colorida', monocromatica: 'pb' }[p.impressao] ?? null,
    // Produto ainda sem foto (cadastrado no painel): mostra o selo da NF no lugar
    fotos: p.fotos.length ? p.fotos.map((f) => f.url) : ['/logo-nf.jpg'],
    descricao: textoParaBlocos(p.descricao),
    venda: p.disponivelVenda,
    locacao: p.disponivelLocacao,
    estoque: p.estoque,
    destaque: p.destaque,
  };
}

// Produto dos arquivos do site → mesmo formato (sem estoque controlado: sempre disponível)
export function arquivoParaSite(p) {
  const { destaque, ...resto } = p; // "destaque" antigo era a imagem de um banner que não existe mais
  return {
    ...resto,
    venda: true,
    locacao: p.tipo !== 'suprimentos',
    estoque: null,
    destaque: DESTAQUES_INICIAIS.includes(p.slug),
  };
}
