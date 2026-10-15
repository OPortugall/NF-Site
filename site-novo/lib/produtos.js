import produtosDaLojaAntiga from '@/dados/produtos.json';
import produtosNovos from '@/dados/produtos-novos.json';
import { empresa } from '@/dados/empresa';

// produtos.json é gerado a partir da loja antiga (scripts/gerar_dados_site_novo.py);
// produtos-novos.json é editado à mão com os produtos cadastrados depois.
const produtos = [...produtosNovos, ...produtosDaLojaAntiga];

export const TIPOS = {
  multifuncionais: 'Multifuncionais e copiadoras',
  impressoras: 'Impressoras',
  'impressoras-3d': 'Impressoras 3D',
  acabamento: 'Plotters de recorte e vinco',
  suprimentos: 'Suprimentos',
};

// Filtros da loja: multifuncionais/copiadoras e impressoras ficam juntas num só filtro.
export const FILTROS_TIPO = {
  'impressoras-e-copiadoras': { rotulo: 'Impressoras e copiadoras', tipos: ['multifuncionais', 'impressoras'] },
  'impressoras-3d': { rotulo: 'Impressoras 3D', tipos: ['impressoras-3d'] },
  acabamento: { rotulo: 'Equipamentos gráficos', tipos: ['acabamento'] },
  suprimentos: { rotulo: 'Suprimentos', tipos: ['suprimentos'] },
};

export const IMPRESSAO = {
  colorida: 'Colorida',
  pb: 'Preto e branco',
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
  return produto.tipo !== 'suprimentos';
}

export const MODALIDADES = { compra: 'Compra', locacao: 'Locação' };

// O endereço antigo da loja era /loja/inicio/<id>-<nome>.html; mantemos o mesmo.
export function urlProduto(produto) {
  return `/loja/inicio/${produto.slug}.html`;
}
