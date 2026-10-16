'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/*
 * Estado do cliente e do carrinho, guardado no próprio navegador.
 *
 * DEMONSTRAÇÃO: enquanto o banco de dados não existe, a "conta" é só uma marcação local
 * (nome, e-mail e tipo de cadastro). Nenhuma senha, CPF, CNPJ, telefone ou endereço é guardado.
 * Quando o banco existir, a sessão passa a vir do servidor.
 */

const CHAVE_SESSAO = 'nf-sessao-demo';
const CHAVE_CONTAS = 'nf-contas-demo';
const CHAVE_CARRINHO = 'nf-carrinho';

const ContextoSessao = createContext(null);
const ContextoCarrinho = createContext(null);

function ler(chave, padrao) {
  try {
    const v = localStorage.getItem(chave);
    return v ? JSON.parse(v) : padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave, valor) {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // navegador sem armazenamento (modo privativo): o site continua funcionando, só não lembra
  }
}

export function Provedores({ children }) {
  // ---------- sessão ----------
  const [cliente, setCliente] = useState(null); // { nome, email, tipo: 'cpf' | 'cnpj' }
  const [carregado, setCarregado] = useState(false);

  // ---------- carrinho ----------
  const [itens, setItens] = useState([]); // [{ slug, modalidade: 'compra' | 'locacao', quantidade }]
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [ultimaAdicao, setUltimaAdicao] = useState(null); // { slug, modalidade, vez } para a animação

  useEffect(() => {
    setCliente(ler(CHAVE_SESSAO, null));
    setItens(ler(CHAVE_CARRINHO, []));
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (carregado) gravar(CHAVE_CARRINHO, itens);
  }, [itens, carregado]);

  const podeAlugar = cliente?.tipo === 'cnpj';

  // Se o cliente sai ou não é empresa, itens de locação viram compra.
  useEffect(() => {
    if (carregado && !podeAlugar && itens.some((i) => i.modalidade === 'locacao')) {
      setItens((atual) => juntar(atual.map((i) => ({ ...i, modalidade: 'compra' }))));
    }
  }, [podeAlugar, carregado, itens]);

  const cadastrar = useCallback((dados) => {
    const contas = ler(CHAVE_CONTAS, {});
    const sessao = { nome: dados.nome, email: dados.email.toLowerCase(), tipo: dados.tipo };
    contas[sessao.email] = sessao;
    gravar(CHAVE_CONTAS, contas);
    gravar(CHAVE_SESSAO, sessao);
    setCliente(sessao);
  }, []);

  const entrar = useCallback((email) => {
    const conta = ler(CHAVE_CONTAS, {})[email.trim().toLowerCase()];
    if (!conta) return false;
    gravar(CHAVE_SESSAO, conta);
    setCliente(conta);
    return true;
  }, []);

  const sair = useCallback(() => {
    gravar(CHAVE_SESSAO, null);
    setCliente(null);
  }, []);

  const adicionar = useCallback((slug, modalidade = 'compra') => {
    setItens((atual) => juntar([...atual, { slug, modalidade, quantidade: 1 }]));
    setUltimaAdicao({ slug, modalidade, vez: Date.now() });
    setGavetaAberta(true);
  }, []);

  const alterarQuantidade = useCallback((slug, modalidade, quantidade) => {
    setItens((atual) =>
      quantidade <= 0
        ? atual.filter((i) => !(i.slug === slug && i.modalidade === modalidade))
        : atual.map((i) => (i.slug === slug && i.modalidade === modalidade ? { ...i, quantidade: Math.min(quantidade, 99) } : i)),
    );
  }, []);

  const trocarModalidade = useCallback((slug, de, para) => {
    setItens((atual) => juntar(atual.map((i) => (i.slug === slug && i.modalidade === de ? { ...i, modalidade: para } : i))));
  }, []);

  const esvaziar = useCallback(() => setItens([]), []);

  const total = itens.reduce((s, i) => s + i.quantidade, 0);

  const sessao = useMemo(
    () => ({ cliente, carregado, podeAlugar, cadastrar, entrar, sair }),
    [cliente, carregado, podeAlugar, cadastrar, entrar, sair],
  );
  const carrinho = useMemo(
    () => ({
      itens, total, adicionar, alterarQuantidade, trocarModalidade, esvaziar,
      gavetaAberta, abrirGaveta: () => setGavetaAberta(true), fecharGaveta: () => setGavetaAberta(false),
      ultimaAdicao,
    }),
    [itens, total, adicionar, alterarQuantidade, trocarModalidade, esvaziar, gavetaAberta, ultimaAdicao],
  );

  return (
    <ContextoSessao.Provider value={sessao}>
      <ContextoCarrinho.Provider value={carrinho}>{children}</ContextoCarrinho.Provider>
    </ContextoSessao.Provider>
  );
}

// Soma itens repetidos (mesmo produto e mesma modalidade).
function juntar(lista) {
  const mapa = new Map();
  for (const i of lista) {
    const chave = `${i.slug}|${i.modalidade}`;
    const existente = mapa.get(chave);
    mapa.set(chave, existente ? { ...existente, quantidade: Math.min(existente.quantidade + i.quantidade, 99) } : { ...i });
  }
  return [...mapa.values()];
}

export const useSessao = () => useContext(ContextoSessao);
export const useCarrinho = () => useContext(ContextoCarrinho);
