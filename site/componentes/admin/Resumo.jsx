'use client';

import { useEffect, useState } from 'react';
import { data } from './comum';
import PublicarSite from './PublicarSite';

// Tela inicial: números do dia a dia e os últimos cadastros.
export default function Resumo({ api }) {
  const [r, setR] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('GET', 'resumo').then((x) => (x.ok ? setR(x.dados) : setErro(x.erro)));
  }, [api]);

  if (erro) return <p className="adm-aviso adm-aviso--erro">{erro}</p>;
  if (!r) return <p className="adm-carregando">Carregando…</p>;

  // [rótulo, número, link, observação, tinta, destaque] — a tinta diz de que área é o número
  const cartoes = [
    ['Clientes', r.clientes, '#clientes', `${r.empresas} empresa(s) e ${r.clientes - r.empresas} pessoa(s) física(s)`, 'c', true],
    ['Novos nos últimos 7 dias', r.novos7Dias, '#clientes', null, 'c'],
    ['Pedidos de orçamento novos', r.orcamentosNovos, '#orcamentos', r.orcamentosNovos ? 'Esperando a equipe' : 'Nenhum esperando', 'm'],
    ['Pagamento em atraso', r.emAtraso, '#clientes', r.emAtraso ? 'Pede atenção' : 'Tudo em dia', 'm'],
    ['Notificações não lidas', r.notificacoesNaoLidas, '#notificacoes', null, 'm'],
    ['Pedidos em atendimento', r.orcamentosEmAtendimento, '#orcamentos', null, 'k'],
    ['Clientes inativos', r.inativos, '#clientes', null, 'k'],
    ['Produtos sem estoque', r.semEstoque, '#produtos', r.semEstoque ? 'Aparecem como indisponíveis no site' : null, 'y'],
    ['Produtos com estoque baixo', r.estoqueBaixo, '#produtos', null, 'y'],
    ['Produtos cadastrados', r.produtos, '#produtos', r.produtos ? null : 'Importe os produtos do site', 'y'],
  ];

  return (
    <>
      <h1 className="adm-titulo">Início</h1>
      <PublicarSite api={api} compacto />
      <div className="adm-cartoes">
        {cartoes.map(([rotulo, valor, link, obs, tinta, destaque]) => {
          const corpo = (
            <>
              <span className="adm-cartao__valor">{valor}</span>
              <span className="adm-cartao__rotulo">{rotulo}</span>
              {obs && <span className="adm-cartao__obs">{obs}</span>}
            </>
          );
          const classe = `adm-cartao adm-tinta--${tinta} ${destaque ? 'adm-cartao--destaque' : ''} ${valor > 0 && tinta === 'm' ? 'adm-cartao--alerta' : ''}`;
          return link
            ? <a key={rotulo} href={link} className={classe}>{corpo}</a>
            : <div key={rotulo} className={`${classe} adm-cartao--inativo`}>{corpo}</div>;
        })}
      </div>

      <section className="adm-bloco">
        <div className="adm-bloco__cabeca">
          <h2>Últimos cadastros</h2>
          <a href="#clientes">Ver todos</a>
        </div>
        {r.ultimosClientes.length === 0 ? <p className="adm-vazio">Nenhum cliente cadastrado ainda.</p> : (
          <ul className="adm-lista">
            {r.ultimosClientes.map((c) => (
              <li key={c.id}>
                <a href={`#cliente/${c.id}`}>{c.nome}</a>
                <span className="adm-etiqueta">{c.tipo === 'cnpj' ? 'Empresa' : 'Pessoa física'}</span>
                <span className="adm-suave">{data(c.criadoEm)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
