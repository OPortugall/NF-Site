import produtos from '@/dados/catalogo.json';
import { empresa } from '@/dados/empresa';

// dados/catalogo.json é gerado por scripts/catalogo.mjs antes de "dev" e "compilar":
// na publicação vem do banco (produtos editados no painel); no computador, dos arquivos
// dados/produtos.json (loja antiga) e dados/produtos-novos.json.
// Cada produto: { slug, nome, marca, modelo, condicao, resumo, tipo, impressao, fotos, descricao,
//                 venda, locacao, estoque (null = sem controle), destaque }

export const TIPOS = {
  multifuncionais: 'Multifuncionais e copiadoras',
  impressoras: 'Impressoras',
  'impressoras-3d': 'Impressoras 3D',
  acabamento: 'Plotters de recorte e vinco',
  suprimentos: 'Suprimentos',
  scooter: 'Scooters',
};

// Filtros da loja: multifuncionais/copiadoras e impressoras ficam juntas num só filtro.
export const FILTROS_TIPO = {
  'impressoras-e-copiadoras': { rotulo: 'Impressoras e copiadoras', tipos: ['multifuncionais', 'impressoras'] },
  'impressoras-3d': { rotulo: 'Impressoras 3D', tipos: ['impressoras-3d'] },
  acabamento: { rotulo: 'Equipamentos gráficos', tipos: ['acabamento'] },
  suprimentos: { rotulo: 'Suprimentos', tipos: ['suprimentos'] },
  scooter: { rotulo: 'Scooters', tipos: ['scooter'] },
};

export const IMPRESSAO = {
  colorida: 'Colorida',
  pb: 'Preto e branco',
  scooter: 'Scooter', // só no filtro da loja: scooter não tem tipo de impressão, a opção mostra a categoria
};

export function todosOsProdutos() {
  return produtos;
}

export function produtoPorSlug(slug) {
  return produtos.find((p) => p.slug === slug);
}

export function linkWhatsApp(mensagem) {
  return `https://wa.me/${empresa.whatsapp.numero}?text=${encodeURIComponent(mensagem)}`;
}

// O site não mostra preços: o cliente pede orçamento e a equipe responde.
export function mensagemProduto(produto) {
  return `Olá! Gostaria de um orçamento do ${produto.nome} que vi no site.`;
}

// "MPC3502" -> "MP C3502"; "SPC430DN" -> "SP C430DN"; "MP5001" -> "MP 5001"
export function formatarModelo(modelo) {
  return modelo.replace(/^(MP|SP)(C?)(\d)/, (_, linha, c, d) => `${linha} ${c}${d}`);
}

export function tituloProduto(produto) {
  return produto.modelo ? `${produto.marca} ${formatarModelo(produto.modelo)}` : produto.nome;
}

// Locação: só equipamentos (toner e outros suprimentos são vendidos, não alugados).
export function produtoAlugavel(produto) {
  return produto.locacao && produto.tipo !== 'suprimentos';
}

export function produtoVendavel(produto) {
  return produto.venda !== false;
}

// Estoque zerado = indisponível no site (null = estoque não controlado: sempre disponível)
export function produtoIndisponivel(produto, estoque = produto.estoque) {
  return estoque === 0;
}

export function produtosEmDestaque() {
  return produtos.filter((p) => p.destaque);
}

export const MODALIDADES = { compra: 'Compra', locacao: 'Locação' };

// O endereço antigo da loja era /loja/inicio/<id>-<nome>.html; mantemos o mesmo.
export function urlProduto(produto) {
  return `/loja/inicio/${produto.slug}.html`;
}
