'use client';

import { useEffect, useState } from 'react';
import { ETIQUETA_ORCAMENTO, Paginacao, SITUACOES_ORCAMENTO, dataHora } from './comum';

// Pedidos de orçamento enviados pelo carrinho do site.
export default function Orcamentos({ api }) {
  const [status, setStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [buscaFeita, setBuscaFeita] = useState('');
  const [pagina, setPagina] = useState(1);
  const [res, setRes] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setBuscaFeita(busca), 350);
    return () => clearTimeout(t);
  }, [busca]);
  useEffect(() => setPagina(1), [status, buscaFeita]);

  const consulta = new URLSearchParams(Object.entries({ status, busca: buscaFeita }).filter(([, v]) => v)).toString();
  useEffect(() => {
    let ativo = true;
    api('GET', `orcamentos?${consulta}&pagina=${pagina}`).then((r) => {
      if (!ativo) return;
      if (r.ok) { setRes(r.dados); setErro(''); } else setErro(r.erro);
    });
    return () => { ativo = false; };
  }, [api, consulta, pagina]);

  return (
    <>
      <h1 className="adm-titulo">Pedidos de orçamento</h1>
      <div className="adm-filtros adm-filtros--2">
        <label className="adm-campo adm-campo--busca">
          <span>Buscar</span>
          <input type="search" placeholder="Código do pedido, nome, e-mail ou razão social" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        <label className="adm-campo">
          <span>Situação</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(SITUACOES_ORCAMENTO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
          </select>
        </label>
      </div>

      {erro && <p className="adm-aviso adm-aviso--erro">{erro}</p>}
      {!res ? <p className="adm-carregando">Carregando…</p> : (
        <>
          <p className="adm-suave" aria-live="polite">{res.total} pedido(s)</p>
          {res.orcamentos.length === 0 ? <p className="adm-vazio">Nenhum pedido encontrado.</p> : (
            <div className="adm-tabela" role="region" aria-label="Pedidos de orçamento" tabIndex={0}>
              <table>
                <thead>
                  <tr><th>Pedido</th><th>Cliente</th><th>Itens</th><th>Situação</th><th>Enviado em</th></tr>
                </thead>
                <tbody>
                  {res.orcamentos.map((o) => (
                    <tr key={o.id} className={o.status === 'novo' ? 'adm-linha--nova' : ''}>
                      <td className="adm-nowrap"><a href={`#orcamento/${o.id}`}>{o.codigo}</a></td>
                      <td>
                        {o.cliente ?? <span className="adm-suave">(conta excluída)</span>}
                        {o.empresa && <span className="adm-suave adm-bloco-texto">{o.empresa}</span>}
                      </td>
                      <td>{o.itens}</td>
                      <td><span className={`adm-etiqueta ${ETIQUETA_ORCAMENTO[o.status]}`}>{SITUACOES_ORCAMENTO[o.status]}</span></td>
                      <td className="adm-nowrap">{dataHora(o.criadoEm)}</td>
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
