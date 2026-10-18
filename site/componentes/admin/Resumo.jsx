'use client';

import { useEffect, useState } from 'react';
import { data } from './comum';

// Tela inicial: números do dia a dia e os últimos cadastros.
export default function Resumo({ api }) {
  const [r, setR] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('GET', 'resumo').then((x) => (x.ok ? setR(x.dados) : setErro(x.erro)));
  }, [api]);

  if (erro) return <p className="adm-aviso adm-aviso--erro">{erro}</p>;
  if (!r) return <p className="adm-carregando">Carregando…</p>;

  const cartoes = [
    ['Clientes', r.clientes, '#clientes', `${r.empresas} empresa(s)`],
    ['Novos nos últimos 7 dias', r.novos7Dias, '#clientes', null],
    ['Pagamento em atraso', r.emAtraso, '#clientes', r.emAtraso ? 'Atenção' : null, r.emAtraso > 0],
    ['Clientes inativos', r.inativos, '#clientes', null],
    ['Notificações não lidas', r.notificacoesNaoLidas, '#notificacoes', null, r.notificacoesNaoLidas > 0],
    ['Produtos sem estoque', r.semEstoque, null, 'Gestão de produtos: em breve'],
    ['Produtos com estoque baixo', r.estoqueBaixo, null, 'Gestão de produtos: em breve'],
  ];

  return (
    <>
      <h1 className="adm-titulo">Início</h1>
      <div className="adm-cartoes">
        {cartoes.map(([rotulo, valor, link, obs, alerta]) => {
          const corpo = (
            <>
              <span className="adm-cartao__valor">{valor}</span>
              <span className="adm-cartao__rotulo">{rotulo}</span>
              {obs && <span className="adm-cartao__obs">{obs}</span>}
            </>
          );
          return link
            ? <a key={rotulo} href={link} className={`adm-cartao ${alerta ? 'adm-cartao--alerta' : ''}`}>{corpo}</a>
            : <div key={rotulo} className="adm-cartao adm-cartao--inativo">{corpo}</div>;
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
