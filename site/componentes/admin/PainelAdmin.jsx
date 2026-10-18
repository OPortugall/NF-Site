'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminEnviar, adminLer } from '@/lib/api';
import Auditoria from './Auditoria';
import Clientes from './Clientes';
import FichaCliente from './FichaCliente';
import LoginAdmin from './LoginAdmin';
import Notificacoes from './Notificacoes';
import Resumo from './Resumo';

// Painel administrativo (página única). As telas mudam pelo endereço depois do "#":
//   #resumo · #clientes · #cliente/12 · #novo-cliente · #notificacoes · #auditoria
// Toda chamada que volta "401 admin" (sessão expirada) leva de volta ao login.

const MENU = [
  ['resumo', 'Início'],
  ['clientes', 'Clientes'],
  ['notificacoes', 'Notificações'],
  ['auditoria', 'Histórico'],
];

function lerTela() {
  const h = (typeof window === 'undefined' ? '' : window.location.hash).replace(/^#/, '');
  const [tela = 'resumo', id] = h.split('/');
  return { tela: tela || 'resumo', id: id && /^\d+$/.test(id) ? Number(id) : null };
}

export default function PainelAdmin() {
  const [sessao, setSessao] = useState({ carregando: true });
  const [rota, setRota] = useState({ tela: 'resumo', id: null });
  const [naoLidas, setNaoLidas] = useState(0);

  const carregarSessao = useCallback(async () => {
    const r = await adminLer('sessao');
    setSessao({ carregando: false, admin: r.ok ? r.dados.admin : null, etapa: r.ok ? r.dados.etapa : null, erro: r.ok ? null : r.erro });
  }, []);

  useEffect(() => {
    carregarSessao();
    const mudou = () => setRota(lerTela());
    mudou();
    window.addEventListener('hashchange', mudou);
    return () => window.removeEventListener('hashchange', mudou);
  }, [carregarSessao]);

  // Chamada usada pelas telas: se a sessão do painel expirou, volta para o login
  const api = useCallback(async (metodo, rotaApi, dados) => {
    const r = metodo === 'GET' ? await adminLer(rotaApi) : await adminEnviar(rotaApi, dados);
    if (r.status === 401 && r.codigo === 'admin') setSessao({ carregando: false, admin: null, aviso: 'Sua sessão do painel expirou. Entre de novo.' });
    return r;
  }, []);

  const atualizarContador = useCallback(async () => {
    const r = await api('GET', 'notificacoes?filtro=nao-lidas');
    if (r.ok) setNaoLidas(r.dados.naoLidas);
  }, [api]);

  useEffect(() => {
    if (sessao.admin) atualizarContador();
  }, [sessao.admin, rota, atualizarContador]);

  const sair = async () => {
    await adminEnviar('sair', {});
    setSessao({ carregando: false, admin: null });
    window.location.hash = '';
  };

  if (sessao.carregando) return <p className="adm-carregando">Carregando o painel…</p>;
  if (!sessao.admin) {
    return <LoginAdmin etapaInicial={sessao.etapa} aviso={sessao.aviso || sessao.erro} aoEntrar={(admin) => setSessao({ carregando: false, admin })} />;
  }

  const ir = (destino) => { window.location.hash = destino; };
  let tela;
  if (rota.tela === 'clientes') tela = <Clientes api={api} ir={ir} />;
  else if (rota.tela === 'cliente' && rota.id) tela = <FichaCliente key={rota.id} id={rota.id} api={api} ir={ir} />;
  else if (rota.tela === 'novo-cliente') tela = <FichaCliente novo api={api} ir={ir} />;
  else if (rota.tela === 'notificacoes') tela = <Notificacoes api={api} ir={ir} aoMudar={atualizarContador} />;
  else if (rota.tela === 'auditoria') tela = <Auditoria api={api} ir={ir} />;
  else tela = <Resumo api={api} ir={ir} />;

  const ativa = rota.tela === 'cliente' || rota.tela === 'novo-cliente' ? 'clientes' : rota.tela;
  return (
    <div className="adm">
      <header className="adm-topo">
        <a className="adm-topo__marca" href="#resumo">NF <span>Painel</span></a>
        <nav className="adm-menu" aria-label="Painel">
          {MENU.map(([id, rotulo]) => (
            <a key={id} href={`#${id}`} className="adm-menu__item" aria-current={ativa === id ? 'page' : undefined}>
              {rotulo}
              {id === 'notificacoes' && naoLidas > 0 && <span className="adm-selo" aria-label={`${naoLidas} não lidas`}>{naoLidas}</span>}
            </a>
          ))}
        </nav>
        <div className="adm-topo__conta">
          <span>{sessao.admin.nome}</span>
          <button type="button" className="adm-botao adm-botao--fantasma" onClick={sair}>Sair</button>
        </div>
      </header>
      <main className="adm-conteudo" id="conteudo">{tela}</main>
    </div>
  );
}
