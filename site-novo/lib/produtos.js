import produtos from '@/dados/produtos.json';
import { empresa } from '@/dados/empresa';

export const TIPOS = {
  multifuncionais: 'Multifuncionais e copiadoras',
  impressoras: 'Impressoras',
  suprimentos: 'Suprimentos',
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

// O endereço antigo da loja era /loja/inicio/<id>-<nome>.html; mantemos o mesmo.
export function urlProduto(produto) {
  return `/loja/inicio/${produto.slug}.html`;
}
