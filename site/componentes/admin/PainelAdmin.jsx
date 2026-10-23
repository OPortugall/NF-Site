'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminEnviar, adminLer } from '@/lib/api';
import Auditoria from './Auditoria';
import Clientes from './Clientes';
import FichaCliente from './FichaCliente';
import FichaOrcamento from './FichaOrcamento';
import FichaProduto from './FichaProduto';
import LoginAdmin from './LoginAdmin';
import Notificacoes from './Notificacoes';
import Orcamentos from './Orcamentos';
import Produtos from './Produtos';
import Resumo from './Resumo';

// Painel administrativo (página única). As telas mudam pelo endereço depois do "#":
//   #resumo · #clientes · #cliente/12 · #novo-cliente · #orcamentos · #orcamento/7
//   #produtos · #produto/3 · #novo-produto · #notificacoes · #auditoria
// Toda chamada que volta "401 admin" (sessão expirada) leva de volta ao login.

// Cada área tem a sua tinta de impressão (CMYK): clientes = ciano, pedidos e alertas = magenta,
// produtos e estoque = amarelo, histórico = preto. O início mostra as quatro.
const MENU = [
  ['resumo', 'Início', 'cmyk'],
  ['clientes', 'Clientes', 'c'],
  ['orcamentos', 'Pedidos', 'm'],
  ['produtos', 'Produtos', 'y'],
  ['notificacoes', 'Notificações', 'm'],
  ['auditoria', 'Histórico', 'k'],
];
// Telas de detalhe → item do menu que fica marcado
const AREA = { cliente: 'clientes', 'novo-cliente': 'clientes', orcamento: 'orcamentos', produto: 'produtos', 'novo-produto': 'produtos' };

// Faixa de registro (a mesma do topo do site), sem importar o catálogo de produtos
export function FaixaRegistro() {
  return (
    <div className="faixa-registro" aria-hidden="true">
      {['c', 'm', 'y', 'k'].map((c) => <span key={c} className={`faixa-registro__cor faixa-registro__cor--${c}`} />)}
    </div>
  );
}

function lerTela() {
  const h = (typeof window === 'undefined' ? '' : window.location.hash).replace(/^#/, '');
  const [tela = 'resumo', id] = h.split('/');
  return { tela: tela || 'resumo', id: id && /^\d+$/.test(id) ? Number(id) : null };
}

export default function PainelAdmin() {
  const [sessao, setSessao] = useState({ carregando: true });
  const [rota, setRota] = useState({ tela: 'resumo', id: null });
  const [naoLidas, setNaoLidas] = useState(0);
  const [naoPublicadas, setNaoPublicadas] = useState(false);

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

  // Alterações de produtos ainda não publicadas: aviso fixo em todas as telas (fácil de esquecer de publicar)
  const conferirPublicacao = useCallback(async () => {
    const r = await api('GET', 'publicacao');
    if (r.ok) setNaoPublicadas(Boolean(r.dados.pendente));
  }, [api]);

  useEffect(() => {
    if (sessao.admin) {
      atualizarContador();
      conferirPublicacao();
    }
  }, [sessao.admin, rota, atualizarContador, conferirPublicacao]);

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
  else if (rota.tela === 'orcamentos') tela = <Orcamentos api={api} ir={ir} />;
  else if (rota.tela === 'orcamento' && rota.id) tela = <FichaOrcamento key={rota.id} id={rota.id} api={api} ir={ir} />;
  else if (rota.tela === 'produtos') tela = <Produtos api={api} ir={ir} />;
  else if (rota.tela === 'produto' && rota.id) tela = <FichaProduto key={rota.id} id={rota.id} api={api} ir={ir} />;
  else if (rota.tela === 'novo-produto') tela = <FichaProduto novo api={api} ir={ir} />;
  else if (rota.tela === 'notificacoes') tela = <Notificacoes api={api} ir={ir} aoMudar={atualizarContador} />;
  else if (rota.tela === 'auditoria') tela = <Auditoria api={api} ir={ir} />;
  else tela = <Resumo api={api} ir={ir} />;

  const ativa = AREA[rota.tela] || rota.tela;
  return (
    <div className="adm">
      <div className="adm-cabeca">
      <header className="adm-topo">
        <a className="adm-topo__marca" href="#resumo">
          <span className="adm-topo__selo" aria-hidden="true"><i /><i /><i /><i /></span>
          NF <span>Painel</span>
        </a>
        <nav className="adm-menu" aria-label="Painel">
          {MENU.map(([id, rotulo, tinta]) => (
            <a key={id} href={`#${id}`} className={`adm-menu__item adm-tinta--${tinta}`} aria-current={ativa === id ? 'page' : undefined}>
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
      <FaixaRegistro />
      {/* Em Resumo e Produtos o quadro "Publicar alterações" já aparece na própria tela */}
      {naoPublicadas && !['resumo', 'produtos'].includes(rota.tela) && (
        <p className="adm-faixa-publicar" role="status">
          <strong>Há alterações de produtos ainda não publicadas.</strong> Elas só aparecem no site depois de publicar.
          <a href="#produtos">Publicar agora</a>
        </p>
      )}
      </div>
      <main className={`adm-conteudo adm-area--${ativa}`} id="conteudo">{tela}</main>
    </div>
  );
}
