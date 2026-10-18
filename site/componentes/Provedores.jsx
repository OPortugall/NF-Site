'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CONTAS_ATIVAS } from '@/lib/ambiente';
import { cadastrarNaApi, entrarNaApi, lerSessao, sairDaApi } from '@/lib/api';

/*
 * Estado do cliente e do carrinho.
 *
 * Sessão: vem do servidor (API em PHP, cookie HttpOnly). O navegador só guarda o carrinho.
 * Na vitrine (contas desligadas) a API nem é chamada.
 */

const CHAVE_CARRINHO = 'nf-carrinho';
// Chaves da demonstração antiga (conta só no navegador): apagadas ao abrir o site
const CHAVES_ANTIGAS = ['nf-sessao-demo', 'nf-contas-demo'];

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
    setItens(ler(CHAVE_CARRINHO, []));
    CHAVES_ANTIGAS.forEach((c) => gravar(c, null));
    if (!CONTAS_ATIVAS) {
      setCarregado(true);
      return;
    }
    let ativo = true;
    lerSessao().then((r) => {
      if (!ativo) return;
      setCliente(r.ok ? r.dados.cliente : null);
      setCarregado(true);
    });
    return () => { ativo = false; };
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

  // As três devolvem a resposta da API: { ok, erro, campos, dados }
  const cadastrar = useCallback(async (dados) => {
    const r = await cadastrarNaApi(dados);
    if (r.ok) setCliente(r.dados.cliente);
    return r;
  }, []);

  const entrar = useCallback(async (email, senha) => {
    const r = await entrarNaApi(email, senha);
    if (r.ok) setCliente(r.dados.cliente);
    return r;
  }, []);

  const sair = useCallback(async () => {
    const r = await sairDaApi();
    setCliente(null);
    return r;
  }, []);

  // Depois que o cliente exclui a própria conta (a API já encerrou a sessão)
  const contaExcluida = useCallback(() => setCliente(null), []);

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
    () => ({ cliente, carregado, podeAlugar, cadastrar, entrar, sair, contaExcluida }),
    [cliente, carregado, podeAlugar, cadastrar, entrar, sair, contaExcluida],
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
