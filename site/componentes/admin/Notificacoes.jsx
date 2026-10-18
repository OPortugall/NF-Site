'use client';

import { useCallback, useEffect, useState } from 'react';
import { dataHora } from './comum';

const TIPOS = { novo_cliente: 'Cliente novo', estoque_baixo: 'Estoque baixo', estoque_zerado: 'Sem estoque' };

export default function Notificacoes({ api, aoMudar }) {
  const [res, setRes] = useState(null);
  const [soNaoLidas, setSoNaoLidas] = useState(false);

  const carregar = useCallback(async () => {
    const r = await api('GET', `notificacoes${soNaoLidas ? '?filtro=nao-lidas' : ''}`);
    if (r.ok) setRes(r.dados);
  }, [api, soNaoLidas]);

  useEffect(() => { carregar(); }, [carregar]);

  const marcar = async (dados) => {
    await api('POST', 'notificacoes-lidas', dados);
    await carregar();
    aoMudar();
  };

  return (
    <>
      <div className="adm-titulo-linha">
        <h1 className="adm-titulo">Notificações</h1>
        <div className="adm-acoes">
          <label className="adm-check"><input type="checkbox" checked={soNaoLidas} onChange={(e) => setSoNaoLidas(e.target.checked)} /> Só não lidas</label>
          <button type="button" className="adm-botao adm-botao--fantasma" disabled={!res?.naoLidas} onClick={() => marcar({ todas: true })}>Marcar todas como lidas</button>
        </div>
      </div>
      {!res ? <p className="adm-carregando">Carregando…</p> : res.notificacoes.length === 0 ? <p className="adm-vazio">Nenhuma notificação.</p> : (
        <ul className="adm-notificacoes">
          {res.notificacoes.map((n) => (
            <li key={n.id} className={n.lida ? '' : 'adm-notificacoes__nova'}>
              <span className="adm-etiqueta">{TIPOS[n.tipo] || n.tipo}</span>
              <span className="adm-notificacoes__texto">
                {n.clienteId ? <a href={`#cliente/${n.clienteId}`} onClick={() => !n.lida && marcar({ ids: [n.id] })}>{n.resumo}</a> : n.resumo}
              </span>
              <span className="adm-suave adm-nowrap">{dataHora(n.criadoEm)}</span>
              {!n.lida && <button type="button" className="adm-link" onClick={() => marcar({ ids: [n.id] })}>Marcar como lida</button>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
