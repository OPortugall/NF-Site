'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Campo, CampoSenha } from './Acesso';
import { useSessao } from './Provedores';
import { cancelarOrcamento, excluirConta, lerConta, lerOrcamentos } from '@/lib/api';
import { MODALIDADES, linkWhatsApp } from '@/lib/produtos';

// Situação do pedido como o cliente vê (os nomes internos ficam no painel)
export const SITUACOES = {
  novo: { rotulo: 'Recebido', texto: 'Recebemos o seu pedido. Em breve a nossa equipe começa o orçamento.' },
  em_atendimento: { rotulo: 'Em atendimento', texto: 'A nossa equipe está preparando o seu orçamento.' },
  enviado: { rotulo: 'Orçamento enviado', texto: 'Enviamos o orçamento pelo seu e-mail ou telefone.' },
  aprovado: { rotulo: 'Aprovado', texto: 'Orçamento aprovado. Obrigado pela confiança!' },
  recusado: { rotulo: 'Não aprovado', texto: 'Este orçamento não seguiu adiante.' },
  cancelado: { rotulo: 'Cancelado', texto: 'Pedido cancelado.' },
};

const data = (v) => (v ? new Date(v.replace(' ', 'T')).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '');
const documento = (d, tipo) => (tipo === 'cnpj'
  ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  : d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
const telefone = (t) => t.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');

export default function MinhaConta() {
  const { cliente, carregado } = useSessao();
  const [aba, setAba] = useState('pedidos');
  // Fica aqui (e não no formulário): ao excluir, a sessão some e a página trocaria pelo "Entrar"
  const [excluida, setExcluida] = useState(false);

  if (excluida) {
    return (
      <div className="conta-pagina excluir-conta" role="status">
        <h1 className="pagina__titulo">Conta excluída</h1>
        <p>Os seus dados foram apagados do site. Obrigado por ter sido nosso cliente.</p>
        <Link href="/" className="botao botao--secundario">Voltar ao início</Link>
      </div>
    );
  }
  if (!carregado) return <p className="pagina__lead" role="status">Carregando…</p>;
  if (!cliente) {
    return (
      <div className="conta-pagina">
        <h1 className="pagina__titulo">Minha conta</h1>
        <p className="pagina__lead">Entre na sua conta para ver os seus pedidos de orçamento e os seus dados.</p>
        <Link href="/entrar?volta=/conta" className="botao botao--principal">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="conta-pagina">
      <h1 className="pagina__titulo">Olá, {cliente.nome}</h1>
      <div className="abas" role="tablist" aria-label="Minha conta">
        <button type="button" role="tab" id="aba-pedidos" aria-selected={aba === 'pedidos'} aria-controls="painel-conta" className="abas__aba" onClick={() => setAba('pedidos')}>
          Meus pedidos
        </button>
        <button type="button" role="tab" id="aba-dados" aria-selected={aba === 'dados'} aria-controls="painel-conta" className="abas__aba" onClick={() => setAba('dados')}>
          Meus dados
        </button>
      </div>
      <div id="painel-conta" role="tabpanel" aria-labelledby={aba === 'pedidos' ? 'aba-pedidos' : 'aba-dados'}>
        {aba === 'pedidos' ? <MeusPedidos /> : <MeusDados aoExcluir={() => setExcluida(true)} />}
      </div>
    </div>
  );
}

// ---------- pedidos ----------
function MeusPedidos() {
  const [pedidos, setPedidos] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [confirmando, setConfirmando] = useState(null); // código do pedido a cancelar

  const carregar = useCallback(async () => {
    const r = await lerOrcamentos();
    if (r.ok) setPedidos(r.dados.orcamentos);
    else setErro(r.erro);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const cancelar = async (codigo) => {
    setConfirmando(null);
    const r = await cancelarOrcamento(codigo);
    setAviso(r.ok ? `Pedido ${codigo} cancelado.` : r.erro);
    carregar();
  };

  if (erro) return <p className="aviso aviso--erro" role="alert">{erro}</p>;
  if (!pedidos) return <p className="pagina__lead" role="status">Carregando os pedidos…</p>;
  if (!pedidos.length) {
    return (
      <div className="conta-vazia">
        <p>Você ainda não enviou nenhum pedido de orçamento pelo site.</p>
        <p className="campo__ajuda">Escolha os equipamentos na loja, coloque no carrinho e clique em “Enviar pedido de orçamento”.</p>
        <Link href="/loja" className="botao botao--principal">Ver equipamentos</Link>
      </div>
    );
  }
  return (
    <>
      {aviso && <p className="aviso aviso--info" role="status">{aviso}</p>}
      <ul className="pedidos">
        {pedidos.map((p) => {
          const s = SITUACOES[p.status] ?? { rotulo: p.status, texto: '' };
          return (
            <li key={p.codigo} className={`pedido pedido--${p.status}`}>
              <div className="pedido__cabeca">
                <div>
                  <p className="pedido__codigo">Pedido {p.codigo}</p>
                  <p className="pedido__data">Enviado em {data(p.criadoEm)}</p>
                </div>
                <span className={`situacao situacao--${p.status}`}>{s.rotulo}</span>
              </div>
              <p className="pedido__texto">{s.texto}</p>
              <ul className="pedido__itens">
                {p.itens.map((i) => (
                  <li key={`${i.slug}|${i.modalidade}`}>
                    <span className="pedido__qtd">{i.quantidade}×</span> {i.nome}{' '}
                    <span className="pedido__modalidade">{MODALIDADES[i.modalidade]}</span>
                  </li>
                ))}
              </ul>
              {p.observacoes && <p className="pedido__obs"><strong>Suas observações:</strong> {p.observacoes}</p>}
              <div className="pedido__acoes">
                <a className="botao botao--secundario botao--compacto" href={linkWhatsApp(`Olá! Quero falar sobre o pedido de orçamento ${p.codigo}.`)} target="_blank" rel="noopener">
                  Falar sobre este pedido
                </a>
                {p.status === 'novo' && confirmando !== p.codigo && (
                  <button type="button" className="botao-texto" onClick={() => setConfirmando(p.codigo)}>Cancelar pedido</button>
                )}
                {p.status === 'novo' && confirmando === p.codigo && (
                  <span className="pedido__confirmar">
                    Cancelar este pedido?
                    <button type="button" className="botao botao--perigo botao--compacto" onClick={() => cancelar(p.codigo)}>Sim, cancelar</button>
                    <button type="button" className="botao-texto" onClick={() => setConfirmando(null)}>Não</button>
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ---------- dados e exclusão da conta ----------
function MeusDados({ aoExcluir }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  useEffect(() => {
    lerConta().then((r) => (r.ok ? setDados(r.dados.cliente) : setErro(r.erro)));
  }, []);

  if (erro) return <p className="aviso aviso--erro" role="alert">{erro}</p>;
  if (!dados) return <p className="pagina__lead" role="status">Carregando os seus dados…</p>;
  const e = dados.endereco;
  return (
    <>
      <dl className="conta-dados">
        <div><dt>Nome</dt><dd>{dados.nome} {dados.sobrenome}</dd></div>
        {dados.tipo === 'cnpj' && <div><dt>Empresa</dt><dd>{dados.razaoSocial}{dados.nomeFantasia ? ` (${dados.nomeFantasia})` : ''}</dd></div>}
        <div><dt>{dados.tipo === 'cnpj' ? 'CNPJ' : 'CPF'}</dt><dd>{documento(dados.documento, dados.tipo)}</dd></div>
        <div><dt>E-mail</dt><dd>{dados.email}</dd></div>
        <div><dt>Telefone</dt><dd>{telefone(dados.telefone)}</dd></div>
        {e && (
          <div>
            <dt>Endereço</dt>
            <dd>{e.rua}, {e.numero}{e.complemento ? ` ${e.complemento}` : ''}, {e.bairro}<br />{e.cidade}/{e.uf}, CEP {e.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}</dd>
          </div>
        )}
        <div><dt>Cliente desde</dt><dd>{data(dados.criadoEm)}</dd></div>
      </dl>
      <p className="campo__ajuda">
        Para corrigir algum dado, <a href={linkWhatsApp('Olá! Quero corrigir os dados do meu cadastro no site.')} target="_blank" rel="noopener">fale com a gente</a>.
      </p>
      <ExcluirConta aoExcluir={aoExcluir} />
    </>
  );
}

function ExcluirConta({ aoExcluir }) {
  const { contaExcluida } = useSessao();
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState({});
  const [falha, setFalha] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (ev) => {
    ev.preventDefault();
    if (enviando) return;
    const novos = {};
    if (!senha) novos.senha = 'Digite a sua senha.';
    if (confirmacao !== 'EXCLUIR') novos.confirmacao = 'Digite EXCLUIR, em letras maiúsculas, para confirmar.';
    setErros(novos);
    setFalha('');
    if (Object.keys(novos).length) return;
    setEnviando(true);
    const r = await excluirConta(senha, confirmacao);
    setEnviando(false);
    if (r.ok) {
      aoExcluir();
      contaExcluida();
      return;
    }
    setErros(r.campos || {});
    if (!r.campos || !Object.keys(r.campos).length) setFalha(r.erro);
  };

  return (
    <section className="excluir-conta" aria-labelledby="titulo-excluir">
      <h2 id="titulo-excluir" className="excluir-conta__titulo">Excluir minha conta</h2>
      {!aberto ? (
        <>
          <p>Você pode apagar o seu cadastro quando quiser (Lei Geral de Proteção de Dados).</p>
          <button type="button" className="botao botao--perigo" onClick={() => setAberto(true)}>Quero excluir minha conta</button>
        </>
      ) : (
        <form className="formulario" onSubmit={enviar} noValidate>
          <div className="aviso aviso--erro">
            <p><strong>Esta ação não pode ser desfeita.</strong></p>
            <ul>
              <li>O seu cadastro, endereços e produtos de interesse são apagados do site.</li>
              <li>Os pedidos de orçamento ficam no histórico da NF, sem ligação com o seu nome.</li>
              <li>A nossa equipe recebe um aviso com o seu nome e contato, para encerrar algum atendimento em aberto.</li>
            </ul>
          </div>
          <CampoSenha rotulo="Sua senha" valor={senha} aoMudar={setSenha} erro={erros.senha} autoComplete="current-password" />
          <Campo rotulo='Digite "EXCLUIR" para confirmar' erro={erros.confirmacao}>
            {(props) => <input {...props} value={confirmacao} onChange={(ev) => setConfirmacao(ev.target.value)} autoComplete="off" />}
          </Campo>
          {falha && <p className="aviso aviso--erro" role="alert">{falha}</p>}
          <div className="excluir-conta__acoes">
            <button type="submit" className="botao botao--perigo" disabled={enviando}>{enviando ? 'Excluindo…' : 'Excluir minha conta'}</button>
            <button type="button" className="botao botao--secundario" onClick={() => { setAberto(false); setSenha(''); setConfirmacao(''); setErros({}); }}>
              Desistir
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
