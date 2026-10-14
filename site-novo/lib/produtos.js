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

const real = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarPreco(centavos) {
  return real.format(centavos / 100);
}

export function linkWhatsApp(mensagem) {
  return `https://wa.me/${empresa.whatsapp.numero}?text=${encodeURIComponent(mensagem)}`;
}

export function mensagemProduto(produto) {
  return `Olá! Tenho interesse no ${produto.nome} (${formatarPreco(produto.precoCentavos)}) que vi no site.`;
}

// O endereço antigo da loja era /loja/inicio/<id>-<nome>.html; mantemos o mesmo.
export function urlProduto(produto) {
  return `/loja/inicio/${produto.slug}.html`;
}
