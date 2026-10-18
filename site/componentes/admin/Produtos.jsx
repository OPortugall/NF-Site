'use client';

import { useCallback, useEffect, useState } from 'react';
import carregadorDeImagens from '@/lib/carregador-imagens.mjs';
import { CATEGORIAS, Paginacao } from './comum';
import PublicarSite from './PublicarSite';

const FILTROS = {
  categoria: [['', 'Todas'], ...Object.entries(CATEGORIAS)],
  status: [['', 'Todos'], ['ativo', 'Aparecem no site'], ['oculto', 'Ocultos']],
  estoque: [['', 'Todos'], ['zerado', 'Sem estoque'], ['baixo', 'Estoque baixo']],
};
const ROTULOS = { categoria: 'Categoria', status: 'Visibilidade', estoque: 'Estoque' };

export const miniatura = (url) => carregadorDeImagens({ src: url, width: 128 });

// Situação do estoque de um produto: zerado (indisponível no site), baixo (chegou ao mínimo) ou ok
export function situacaoEstoque(p) {
  if (p.estoque === 0) return ['Sem estoque', 'adm-etiqueta--alerta'];
  if (p.estoqueMinimo > 0 && p.estoque <= p.estoqueMinimo) return ['Estoque baixo', 'adm-etiqueta--y'];
  return null;
}

// Produtos do site: busca, filtros, estoque rápido e a publicação das alterações.
export default function Produtos({ api }) {
  const [filtros, setFiltros] = useState({ busca: '', categoria: '', status: '', estoque: '' });
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [res, setRes] = useState(null);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState(null);
  const [versao, setVersao] = useState(0); // recarrega lista e publicação depois de uma mudança

  useEffect(() => {
    const t = setTimeout(() => setFiltros((f) => (f.busca === busca ? f : { ...f, busca })), 350);
    return () => clearTimeout(t);
  }, [busca]);
  useEffect(() => setPagina(1), [filtros]);

  const consulta = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v)).toString();
  useEffect(() => {
    let ativo = true;
    api('GET', `produtos?${consulta}&pagina=${pagina}`).then((r) => {
      if (!ativo) return;
      if (r.ok) { setRes(r.dados); setErro(''); } else setErro(r.erro);
    });
    return () => { ativo = false; };
  }, [api, consulta, pagina, versao]);

  const importar = async () => {
    setMsg(null);
    const r = await api('POST', 'produtos-importar', {});
    setMsg(r.ok
      ? { tipo: 'ok', texto: `${r.dados.quantidade} produtos importados, cada um com 1 unidade em estoque. Confira o estoque de cada um.` }
      : { tipo: 'erro', texto: r.erro });
    setVersao((v) => v + 1);
  };

  const semFiltros = !consulta;
  return (
    <>
      <div className="adm-titulo-linha">
        <h1 className="adm-titulo">Produtos</h1>
        <div className="adm-acoes">
          <a className="adm-botao" href="#novo-produto">Novo produto</a>
        </div>
      </div>
      <PublicarSite key={versao} api={api} />
      {msg && <p className={`adm-aviso adm-aviso--${msg.tipo}`} role={msg.tipo === 'erro' ? 'alert' : 'status'}>{msg.texto}</p>}

      <div className="adm-filtros">
        <label className="adm-campo adm-campo--busca">
          <span>Buscar</span>
          <input type="search" placeholder="Nome, marca, modelo ou endereço" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        {Object.entries(FILTROS).map(([nome, opcoes]) => (
          <label key={nome} className="adm-campo">
            <span>{ROTULOS[nome]}</span>
            <select value={filtros[nome]} onChange={(e) => setFiltros((f) => ({ ...f, [nome]: e.target.value }))}>
              {opcoes.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </label>
        ))}
      </div>

      {erro && <p className="adm-aviso adm-aviso--erro">{erro}</p>}
      {!res ? <p className="adm-carregando">Carregando…</p> : (
        <>
          {res.total === 0 && semFiltros ? (
            <section className="adm-bloco adm-importar">
              <h2>O cadastro de produtos está vazio</h2>
              <p className="adm-dica">
                Hoje o site mostra os produtos que estão nos arquivos do código. Importe-os para o painel uma vez e,
                daqui em diante, edite tudo por aqui. Cada produto entra com 1 unidade em estoque.
              </p>
              <button type="button" className="adm-botao" onClick={importar}>Importar os produtos do site</button>
            </section>
          ) : (
            <p className="adm-suave" aria-live="polite">{res.total} produto(s)</p>
          )}
          {res.produtos.length === 0 ? (!semFiltros && <p className="adm-vazio">Nenhum produto encontrado.</p>) : (
            <div className="adm-tabela adm-tabela--produtos" role="region" aria-label="Produtos" tabIndex={0}>
              <table>
                <thead>
                  <tr><th><span className="visualmente-oculto">Foto</span></th><th>Produto</th><th>Categoria</th><th>Estoque</th><th>No site</th></tr>
                </thead>
                <tbody>
                  {res.produtos.map((p) => (
                    <tr key={p.id} className={p.status === 'oculto' ? 'adm-linha--apagada' : ''}>
                      <td className="adm-produto-foto">{p.foto ? <img src={miniatura(p.foto)} alt="" width={56} height={42} loading="lazy" /> : <span className="adm-sem-foto">sem foto</span>}</td>
                      <td>
                        <a href={`#produto/${p.id}`}>{p.titulo}</a>
                        <span className="adm-suave adm-bloco-texto">{p.slug}</span>
                      </td>
                      <td>{CATEGORIAS[p.categoria]}</td>
                      <td><EstoqueRapido produto={p} api={api} aoMudar={() => setVersao((v) => v + 1)} /></td>
                      <td>
                        <span className={`adm-etiqueta ${p.status === 'ativo' ? 'adm-etiqueta--ok' : 'adm-etiqueta--cinza'}`}>{p.status === 'ativo' ? 'Visível' : 'Oculto'}</span>
                        {p.destaque && <span className="adm-etiqueta adm-etiqueta--y adm-bloco-texto">Destaque</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginacao total={res.total} pagina={res.pagina} porPagina={res.porPagina} aoMudar={setPagina} />
        </>
      )}
    </>
  );
}

// Estoque direto na lista: muda o número e salva (vale na hora no site, sem publicar)
export function EstoqueRapido({ produto, api, aoMudar }) {
  const [valor, setValor] = useState(String(produto.estoque));
  const [estado, setEstado] = useState(''); // '' | 'salvando' | 'salvo' | mensagem de erro
  useEffect(() => setValor(String(produto.estoque)), [produto.estoque]);

  const salvar = useCallback(async (e) => {
    e.preventDefault();
    const n = Number(valor);
    if (!/^\d+$/.test(valor) || n > 65535) return setEstado('Digite 0 ou mais');
    setEstado('salvando');
    const r = await api('POST', 'produto-estoque', { id: produto.id, estoque: n });
    if (!r.ok) return setEstado(r.erro);
    setEstado('salvo');
    aoMudar?.();
  }, [api, produto.id, valor, aoMudar]);

  const situacao = situacaoEstoque({ ...produto, estoque: Number(valor) });
  const mudou = valor !== String(produto.estoque);
  return (
    <form className="adm-estoque" onSubmit={salvar}>
      <label>
        <span className="visualmente-oculto">Estoque de {produto.titulo}</span>
        <input type="number" min="0" max="65535" inputMode="numeric" value={valor} onChange={(e) => { setValor(e.target.value); setEstado(''); }} />
      </label>
      {mudou && <button className="adm-botao adm-botao--compacto" disabled={estado === 'salvando'}>Salvar</button>}
      {!mudou && situacao && <span className={`adm-etiqueta ${situacao[1]}`}>{situacao[0]}</span>}
      {estado === 'salvo' && !mudou && <span className="adm-suave" role="status">Salvo</span>}
      {estado && !['salvando', 'salvo'].includes(estado) && <span className="adm-campo__erro" role="alert">{estado}</span>}
    </form>
  );
}
