'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { IconeCarrinho, IconeFechar, IconeWhatsApp } from './Icones';
import { useCarrinho, useSessao } from './Provedores';
import { estoqueAtual, useIndisponivel, useMapaEstoque } from './Estoque';
import { criarOrcamento } from '@/lib/api';
import {
  MODALIDADES, linkWhatsApp, produtoAlugavel, produtoIndisponivel, produtoPorSlug, produtoVendavel, tituloProduto, urlProduto,
} from '@/lib/produtos';

// ---------- ícone do cabeçalho, com o contador animado ----------
export function BotaoCarrinho() {
  const { total, abrirGaveta, ultimaAdicao } = useCarrinho();
  return (
    <button type="button" className="cabecalho__icone" onClick={abrirGaveta} aria-label={`Carrinho, ${total} ${total === 1 ? 'item' : 'itens'}`}>
      <span className="carrinho-icone">
        <IconeCarrinho />
        {total > 0 && (
          // a "key" muda a cada produto adicionado, o que reinicia a animação do contador
          <span key={ultimaAdicao?.vez ?? 0} className="carrinho-icone__contador" aria-hidden="true">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </span>
      <span className="cabecalho__icone-rotulo">Carrinho</span>
    </button>
  );
}

// ---------- gaveta lateral ----------
export function GavetaCarrinho() {
  const { itens, total, gavetaAberta, fecharGaveta, alterarQuantidade, trocarModalidade, esvaziar, ultimaAdicao } = useCarrinho();
  const { cliente, podeAlugar } = useSessao();
  const dialogo = useRef(null);
  const mapaEstoque = useMapaEstoque();
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState('');
  const [problemas, setProblemas] = useState({}); // { slug: motivo } apontados pela API
  const [enviado, setEnviado] = useState(null); // código do pedido enviado

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (gavetaAberta && !d.open) d.showModal();
    if (!gavetaAberta && d.open) d.close();
  }, [gavetaAberta]);

  // Ao abrir de novo depois de um pedido enviado, volta ao carrinho normal
  useEffect(() => {
    if (gavetaAberta) return;
    setEnviado(null);
    setFalha('');
  }, [gavetaAberta]);

  const recem = ultimaAdicao && Date.now() - ultimaAdicao.vez < 4000 ? produtoPorSlug(ultimaAdicao.slug) : null;
  const indisponivel = (p) => produtoIndisponivel(p, estoqueAtual(mapaEstoque, p));
  const temIndisponivel = itens.some((i) => {
    const p = produtoPorSlug(i.slug);
    return !p || indisponivel(p);
  });

  // Pedido de orçamento pelo site (cliente logado): vira um pedido no painel e em "Minha conta"
  const enviarPedido = async () => {
    if (enviando) return;
    setEnviando(true);
    setFalha('');
    const r = await criarOrcamento(itens.map(({ slug, modalidade, quantidade }) => ({ slug, modalidade, quantidade })), observacoes);
    setEnviando(false);
    if (r.ok) {
      setEnviado(r.dados.codigo);
      setObservacoes('');
      setProblemas({});
      esvaziar();
      return;
    }
    setFalha(r.erro);
    setProblemas(Object.fromEntries((r.dados?.itens || []).map((x) => [x.slug, x.motivo])));
  };

  const mensagem = () => {
    const linhas = itens.map((i) => {
      const p = produtoPorSlug(i.slug);
      return `• ${i.quantidade}x ${p.nome} (${MODALIDADES[i.modalidade].toLowerCase()})`;
    });
    const quem = cliente ? `\n\nCliente: ${cliente.nome} (${cliente.email})` : '';
    return `Olá! Gostaria de um orçamento destes produtos:\n${linhas.join('\n')}${quem}`;
  };

  return (
    <dialog
      ref={dialogo}
      className="gaveta"
      aria-labelledby="titulo-carrinho"
      onClose={fecharGaveta}
      onClick={(e) => e.target === dialogo.current && fecharGaveta()} // clique no fundo escuro fecha
    >
      <div className="gaveta__painel">
        <header className="gaveta__cabeca">
          <h2 id="titulo-carrinho" className="gaveta__titulo">
            Carrinho <span className="gaveta__total">{total} {total === 1 ? 'item' : 'itens'}</span>
          </h2>
          <button type="button" className="gaveta__fechar" onClick={fecharGaveta}>
            <IconeFechar />
            <span className="visualmente-oculto">Fechar carrinho</span>
          </button>
        </header>

        <p className="gaveta__aviso" aria-live="polite">
          {recem ? `${tituloProduto(recem)} adicionado ao carrinho.` : ''}
        </p>

        {enviado ? (
          <div className="gaveta__vazia gaveta__enviado" role="status">
            <p className="gaveta__enviado-titulo">Pedido enviado!</p>
            <p>
              Código do pedido: <strong>{enviado}</strong>. Nossa equipe vai preparar o orçamento e responder pelo seu
              e-mail ou telefone, sem custo.
            </p>
            <Link className="botao botao--principal" href="/conta" onClick={fecharGaveta}>Acompanhar meus pedidos</Link>
          </div>
        ) : itens.length === 0 ? (
          <div className="gaveta__vazia">
            <IconeCarrinho width={40} height={40} />
            <p>Seu carrinho está vazio.</p>
            <Link className="botao botao--secundario" href="/loja" onClick={fecharGaveta}>Ver equipamentos</Link>
          </div>
        ) : (
          <>
            <ul className="gaveta__lista">
              {itens.map((i) => {
                const p = produtoPorSlug(i.slug);
                if (!p) return null;
                const novo = ultimaAdicao?.slug === i.slug && ultimaAdicao?.modalidade === i.modalidade;
                const outra = i.modalidade === 'compra' ? 'locacao' : 'compra';
                const aviso = indisponivel(p) ? 'Indisponível no momento. Remova para enviar o pedido.' : problemas[i.slug];
                return (
                  <li key={`${i.slug}|${i.modalidade}`} className={`item-carrinho${novo ? ' item-carrinho--novo' : ''}${aviso ? ' item-carrinho--problema' : ''}`} {...(novo ? { 'data-vez': ultimaAdicao.vez } : {})}>
                    <div className="item-carrinho__foto">
                      <Image src={p.fotos[0]} alt="" fill sizes="72px" />
                    </div>
                    <div className="item-carrinho__info">
                      <Link href={urlProduto(p)} className="item-carrinho__nome" onClick={fecharGaveta}>{tituloProduto(p)}</Link>
                      <span className={`item-carrinho__modalidade item-carrinho__modalidade--${i.modalidade}`}>
                        {MODALIDADES[i.modalidade]}
                      </span>
                      {podeAlugar && produtoAlugavel(p) && produtoVendavel(p) && (
                        <button type="button" className="item-carrinho__trocar" onClick={() => trocarModalidade(i.slug, i.modalidade, outra)}>
                          Mudar para {MODALIDADES[outra].toLowerCase()}
                        </button>
                      )}
                      {aviso && <span className="item-carrinho__aviso">{aviso}</span>}
                    </div>
                    <div className="quantidade" role="group" aria-label={`Quantidade de ${tituloProduto(p)}`}>
                      <button type="button" onClick={() => alterarQuantidade(i.slug, i.modalidade, i.quantidade - 1)}>
                        <span aria-hidden="true">{i.quantidade === 1 ? '×' : '−'}</span>
                        <span className="visualmente-oculto">{i.quantidade === 1 ? 'Remover' : 'Diminuir'}</span>
                      </button>
                      <span className="quantidade__valor" aria-live="polite">{i.quantidade}</span>
                      <button type="button" onClick={() => alterarQuantidade(i.slug, i.modalidade, i.quantidade + 1)}>
                        <span aria-hidden="true">+</span>
                        <span className="visualmente-oculto">Aumentar</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="gaveta__rodape">
              {!podeAlugar && (
                <p className="gaveta__nota">
                  {cliente
                    ? 'Locação disponível para cadastros com CNPJ.'
                    : <>Empresa? <Link href="/entrar?aba=criar" onClick={fecharGaveta}>Cadastre-se com CNPJ</Link> para também alugar equipamentos.</>}
                </p>
              )}
              <p className="gaveta__nota">Os preços são enviados no orçamento, sem custo.</p>
              {cliente ? (
                <>
                  <label className="gaveta__observacoes">
                    <span>Observações (opcional)</span>
                    <textarea
                      rows={2}
                      maxLength={1000}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Ex.: prazo de entrega, quantidade de cópias por mês, forma de pagamento"
                    />
                  </label>
                  {falha && <p className="gaveta__erro" role="alert">{falha}</p>}
                  <button type="button" className="botao botao--principal botao--largo" onClick={enviarPedido} disabled={enviando || temIndisponivel}>
                    {enviando ? 'Enviando…' : 'Enviar pedido de orçamento'}
                  </button>
                  <a className="botao botao--secundario botao--largo" href={linkWhatsApp(mensagem())} target="_blank" rel="noopener">
                    <IconeWhatsApp /> Prefiro pelo WhatsApp
                  </a>
                </>
              ) : (
                <>
                  <a className="botao botao--whatsapp botao--largo" href={linkWhatsApp(mensagem())} target="_blank" rel="noopener">
                    <IconeWhatsApp /> Pedir orçamento destes itens
                  </a>
                  <p className="gaveta__nota">
                    <Link href="/entrar?volta=/conta" onClick={fecharGaveta}>Entre na sua conta</Link> para enviar o pedido pelo site e acompanhar a resposta.
                  </p>
                </>
              )}
              <button type="button" className="gaveta__esvaziar" onClick={esvaziar}>Esvaziar carrinho</button>
            </footer>
          </>
        )}
      </div>
    </dialog>
  );
}

// ---------- botões de adicionar (cartão e página de produto) ----------
export function BotoesAdicionar({ produto, completo = false }) {
  const { adicionar } = useCarrinho();
  const { cliente, podeAlugar } = useSessao();
  const alugavel = produtoAlugavel(produto);
  const vendavel = produtoVendavel(produto);
  const indisponivel = useIndisponivel(produto);

  if (!completo) {
    if (indisponivel) {
      return <span className="botao-adicionar botao-adicionar--indisponivel">Indisponível</span>;
    }
    // Produto só para locação: o cartão leva à página (lá aparecem as opções)
    if (!vendavel) return null;
    return (
      <button type="button" className="botao-adicionar" onClick={() => adicionar(produto.slug, 'compra')}>
        <IconeCarrinho width={18} height={18} /> Adicionar
      </button>
    );
  }

  if (indisponivel) return null; // a página mostra o aviso de indisponível

  return (
    <div className="produto__carrinho">
      {vendavel && (
        <button type="button" className="botao botao--principal botao--largo" onClick={() => adicionar(produto.slug, 'compra')}>
          <IconeCarrinho /> Adicionar ao carrinho para compra
        </button>
      )}
      {alugavel && podeAlugar && (
        <button type="button" className="botao botao--secundario botao--largo" onClick={() => adicionar(produto.slug, 'locacao')}>
          Adicionar ao carrinho para locação
        </button>
      )}
      {alugavel && !podeAlugar && (
        <p className="produto__locacao-aviso">
          {cliente
            ? 'A locação está disponível para cadastros com CNPJ.'
            : <>Locação disponível para empresas. <Link href="/entrar?aba=criar">Cadastre-se com CNPJ</Link> ou <Link href="/entrar">entre na sua conta</Link>.</>}
        </p>
      )}
    </div>
  );
}
