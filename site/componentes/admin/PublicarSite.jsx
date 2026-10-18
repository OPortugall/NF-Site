'use client';

import { useCallback, useEffect, useState } from 'react';

const SITUACOES = {
  na_fila: ['Na fila', 'adm-etiqueta--y'],
  publicando: ['Publicando…', 'adm-etiqueta--y'],
  aguardando_aprovacao: ['Esperando aprovação no GitHub', 'adm-etiqueta--alerta'],
  concluida: ['Publicado', 'adm-etiqueta--ok'],
  falhou: ['Falhou', 'adm-etiqueta--alerta'],
  cancelada: ['Cancelada', 'adm-etiqueta--cinza'],
};
const EM_ANDAMENTO = ['na_fila', 'publicando', 'aguardando_aprovacao'];

// "Publicar alterações": produtos, fotos e textos editados no painel só aparecem no site depois de
// publicar (o site é gerado de novo pelo GitHub e enviado ao servidor; leva alguns minutos).
// O estoque não precisa: o site lê o estoque ao vivo.
export default function PublicarSite({ api, compacto = false }) {
  const [p, setP] = useState(null);
  const [msg, setMsg] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    const r = await api('GET', 'publicacao');
    if (r.ok) setP(r.dados);
    else setMsg({ tipo: 'erro', texto: r.erro });
  }, [api]);
  useEffect(() => { carregar(); }, [carregar]);

  // Enquanto publica, confere de novo a cada 20 segundos
  const andamento = p?.ultima && EM_ANDAMENTO.includes(p.ultima.situacao);
  useEffect(() => {
    if (!andamento) return;
    const t = setInterval(carregar, 20000);
    return () => clearInterval(t);
  }, [andamento, carregar]);

  const publicar = async () => {
    setOcupado(true);
    setMsg(null);
    const r = await api('POST', 'publicar', {});
    setOcupado(false);
    setMsg(r.ok
      ? { tipo: 'ok', texto: 'Publicação pedida. Em alguns minutos o site mostra as alterações.' }
      : { tipo: 'erro', texto: r.erro });
    setTimeout(carregar, 4000);
  };

  if (!p) return msg && !compacto ? <p className={`adm-aviso adm-aviso--${msg.tipo}`}>{msg.texto}</p> : null;
  if (compacto && !p.pendente && !andamento) return null;
  const [rotulo, etiqueta] = SITUACOES[p.ultima?.situacao] || [];

  return (
    <section className={`adm-publicar ${p.pendente ? 'adm-publicar--pendente' : ''}`} aria-labelledby="titulo-publicar">
      <div className="adm-publicar__texto">
        <h2 id="titulo-publicar">{p.pendente ? 'Há alterações de produtos ainda não publicadas' : 'Site publicado'}</h2>
        <p className="adm-suave">
          {p.pendente
            ? 'Produtos, fotos e textos editados no painel aparecem no site depois de publicar. O estoque já aparece na hora.'
            : 'O site está com os produtos do painel.'}
          {p.ultima && (
            <>
              {' '}Última publicação: <span className={`adm-etiqueta ${etiqueta}`}>{rotulo}</span>
              {p.ultima.iniciadaEm && <> em {new Date(p.ultima.iniciadaEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</>}
              {p.ultima.url && <> · <a href={p.ultima.url} target="_blank" rel="noopener noreferrer">ver no GitHub</a></>}
            </>
          )}
        </p>
        {!p.configurada && (
          <p className="adm-dica">A publicação pelo painel ainda não foi configurada no servidor (bloco “github” da configuração).</p>
        )}
        {p.ultima?.situacao === 'aguardando_aprovacao' && (
          <p className="adm-dica">Produção: aprove a publicação no GitHub (Actions → Publicação → Review deployments).</p>
        )}
        {msg && <p className={`adm-aviso adm-aviso--${msg.tipo}`} role={msg.tipo === 'erro' ? 'alert' : 'status'}>{msg.texto}</p>}
      </div>
      <button type="button" className="adm-botao adm-botao--publicar" disabled={ocupado || !p.configurada || andamento} onClick={publicar}>
        {ocupado ? 'Pedindo…' : andamento ? 'Publicando…' : 'Publicar alterações'}
      </button>
    </section>
  );
}
