'use client';

import { useCallback, useEffect, useState } from 'react';
import { REGRAS_SENHA, mascaraCep, mascaraCnpj, mascaraCpf, mascaraTelefone } from '@/lib/documentos';
import { ACOES, cep, dataHora, descreverDetalhes } from './comum';

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const VAZIO = {
  tipo: 'cpf', nome: '', sobrenome: '', email: '', telefone: '', documento: '', razaoSocial: '', nomeFantasia: '',
  cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', senha: '',
};

function paraFormulario(c) {
  const en = c.endereco || {};
  return {
    tipo: c.tipo, nome: c.nome, sobrenome: c.sobrenome, email: c.email, telefone: mascaraTelefone(c.telefone),
    documento: c.tipo === 'cnpj' ? mascaraCnpj(c.documento) : mascaraCpf(c.documento),
    razaoSocial: c.razaoSocial || '', nomeFantasia: c.nomeFantasia || '',
    cep: mascaraCep(en.cep || ''), rua: en.rua || '', numero: en.numero || '', complemento: en.complemento || '',
    bairro: en.bairro || '', cidade: en.cidade || '', uf: en.uf || '', senha: '',
  };
}

function Campo({ nome, rotulo, erro, children, largo }) {
  return (
    <label className={`adm-campo ${largo ? 'adm-campo--largo' : ''} ${erro ? 'adm-campo--erro' : ''}`}>
      <span>{rotulo}</span>
      {children}
      {erro && <span className="adm-campo__erro" id={`erro-${nome}`}>{erro}</span>}
    </label>
  );
}

// Ficha do cliente (ou cadastro de um cliente novo, com `novo`).
export default function FichaCliente({ id, novo, api, ir }) {
  const [cliente, setCliente] = useState(null);
  const [f, setF] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [msg, setMsg] = useState(null); // { tipo: 'ok' | 'erro', texto }
  const [ocupado, setOcupado] = useState(false);
  const [enviarAviso, setEnviarAviso] = useState(true);
  const [confirmacao, setConfirmacao] = useState('');

  const carregar = useCallback(async () => {
    const r = await api('GET', `cliente?id=${id}`);
    if (!r.ok) return setMsg({ tipo: 'erro', texto: r.erro });
    setCliente(r.dados.cliente);
    setF(paraFormulario(r.dados.cliente));
  }, [api, id]);

  useEffect(() => {
    if (!novo) carregar();
  }, [novo, carregar]);

  const muda = (campo) => (e) => {
    let v = e.target.value;
    if (campo === 'documento') v = f.tipo === 'cnpj' ? mascaraCnpj(v) : mascaraCpf(v);
    if (campo === 'telefone') v = mascaraTelefone(v);
    if (campo === 'cep') v = mascaraCep(v);
    setF((a) => ({ ...a, [campo]: v }));
  };

  const salvar = async (e) => {
    e.preventDefault();
    setOcupado(true);
    setMsg(null);
    const r = novo ? await api('POST', 'cliente-criar', f) : await api('POST', 'cliente-editar', { ...f, id });
    setOcupado(false);
    if (!r.ok) {
      setErros(r.campos || {});
      return setMsg({ tipo: 'erro', texto: r.erro });
    }
    setErros({});
    if (novo) return ir(`cliente/${r.dados.id}`);
    setMsg({ tipo: 'ok', texto: r.dados.alterados.length ? 'Alterações salvas.' : 'Nada foi alterado.' });
    carregar();
  };

  const acao = async (rota, dados, sucesso) => {
    setOcupado(true);
    setMsg(null);
    const r = await api('POST', rota, { id, ...dados });
    setOcupado(false);
    if (!r.ok) return setMsg({ tipo: 'erro', texto: r.erro });
    setMsg({ tipo: 'ok', texto: typeof sucesso === 'function' ? sucesso(r.dados) : sucesso });
    carregar();
  };

  const excluir = async () => {
    setOcupado(true);
    const r = await api('POST', 'cliente-excluir', { id, confirmacao });
    setOcupado(false);
    if (!r.ok) return setMsg({ tipo: 'erro', texto: r.erro });
    ir('clientes');
  };

  if (!novo && !cliente) return msg ? <p className="adm-aviso adm-aviso--erro">{msg.texto}</p> : <p className="adm-carregando">Carregando…</p>;
  const empresa = f.tipo === 'cnpj';
  const senhaOk = REGRAS_SENHA.every((r) => r.ok(f.senha));

  return (
    <>
      <p><a href="#clientes" className="adm-voltar">← Clientes</a></p>
      <div className="adm-titulo-linha">
        <h1 className="adm-titulo">{novo ? 'Novo cliente' : `${cliente.nome} ${cliente.sobrenome}`}</h1>
        {!novo && (
          <div className="adm-acoes">
            <span className={`adm-etiqueta ${cliente.status === 'inativo' ? 'adm-etiqueta--cinza' : 'adm-etiqueta--ok'}`}>{cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
            <span className={`adm-etiqueta ${cliente.pagamento === 'em_atraso' ? 'adm-etiqueta--alerta' : ''}`}>
              {cliente.pagamento === 'em_atraso' ? `Em atraso desde ${dataHora(cliente.emAtrasoDesde).slice(0, 10)}` : 'Pagamento em dia'}
            </span>
          </div>
        )}
      </div>
      {msg && <p className={`adm-aviso adm-aviso--${msg.tipo}`} role={msg.tipo === 'erro' ? 'alert' : 'status'}>{msg.texto}</p>}

      <div className="adm-ficha">
        <form className="adm-bloco adm-form-grade" onSubmit={salvar} noValidate>
          <h2 className="adm-campo--largo">Dados do cliente</h2>
          <fieldset className="adm-campo--largo adm-radios">
            <legend>Tipo</legend>
            {[['cpf', 'Pessoa física (CPF)'], ['cnpj', 'Empresa (CNPJ)']].map(([v, r]) => (
              <label key={v}><input type="radio" name="tipo" checked={f.tipo === v} onChange={() => setF((a) => ({ ...a, tipo: v, documento: '' }))} /> {r}</label>
            ))}
          </fieldset>
          <Campo nome="nome" rotulo="Primeiro nome" erro={erros.nome}><input value={f.nome} onChange={muda('nome')} /></Campo>
          <Campo nome="sobrenome" rotulo="Sobrenome" erro={erros.sobrenome}><input value={f.sobrenome} onChange={muda('sobrenome')} /></Campo>
          <Campo nome="documento" rotulo={empresa ? 'CNPJ' : 'CPF'} erro={erros.documento}><input inputMode="numeric" value={f.documento} onChange={muda('documento')} /></Campo>
          <Campo nome="telefone" rotulo="Telefone" erro={erros.telefone}><input inputMode="tel" value={f.telefone} onChange={muda('telefone')} /></Campo>
          <Campo nome="email" rotulo="E-mail" erro={erros.email} largo><input type="email" value={f.email} onChange={muda('email')} /></Campo>
          {empresa && (
            <>
              <Campo nome="razaoSocial" rotulo="Razão social" erro={erros.razaoSocial} largo><input value={f.razaoSocial} onChange={muda('razaoSocial')} /></Campo>
              <Campo nome="nomeFantasia" rotulo="Nome fantasia (opcional)" erro={erros.nomeFantasia} largo><input value={f.nomeFantasia} onChange={muda('nomeFantasia')} /></Campo>
            </>
          )}
          <h2 className="adm-campo--largo">Endereço principal</h2>
          <Campo nome="cep" rotulo="CEP" erro={erros.cep}><input inputMode="numeric" value={f.cep} onChange={muda('cep')} /></Campo>
          <Campo nome="uf" rotulo="Estado" erro={erros.uf}>
            <select value={f.uf} onChange={muda('uf')}><option value="">Escolha</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select>
          </Campo>
          <Campo nome="rua" rotulo="Rua" erro={erros.rua} largo><input value={f.rua} onChange={muda('rua')} /></Campo>
          <Campo nome="numero" rotulo="Número" erro={erros.numero}><input value={f.numero} onChange={muda('numero')} /></Campo>
          <Campo nome="complemento" rotulo="Complemento (opcional)" erro={erros.complemento}><input value={f.complemento} onChange={muda('complemento')} /></Campo>
          <Campo nome="bairro" rotulo="Bairro" erro={erros.bairro}><input value={f.bairro} onChange={muda('bairro')} /></Campo>
          <Campo nome="cidade" rotulo="Cidade" erro={erros.cidade}><input value={f.cidade} onChange={muda('cidade')} /></Campo>
          <h2 className="adm-campo--largo">{novo ? 'Senha inicial' : 'Redefinir senha'}</h2>
          <Campo nome="senha" rotulo={novo ? 'Senha temporária (passe para o cliente trocar depois)' : 'Nova senha (deixe vazio para não mudar)'} erro={erros.senha} largo>
            <input type="password" autoComplete="new-password" value={f.senha} onChange={muda('senha')} />
          </Campo>
          {f.senha && !senhaOk && <p className="adm-dica adm-campo--largo">A senha precisa de 8 caracteres, uma letra e um número.</p>}
          <div className="adm-campo--largo">
            <button className="adm-botao" disabled={ocupado}>{ocupado ? 'Salvando…' : novo ? 'Criar cliente' : 'Salvar alterações'}</button>
          </div>
        </form>

        {!novo && (
          <aside className="adm-lateral">
            <section className="adm-bloco">
              <h2>Pagamento</h2>
              {cliente.pagamento === 'em_dia' ? (
                <>
                  <label className="adm-check">
                    <input type="checkbox" checked={enviarAviso} onChange={(e) => setEnviarAviso(e.target.checked)} />
                    Enviar e-mail de aviso de pagamento pendente
                  </label>
                  <button type="button" className="adm-botao adm-botao--alerta" disabled={ocupado}
                    onClick={() => acao('cliente-pagamento', { situacao: 'em_atraso', enviarEmail: enviarAviso },
                      (d) => (d.emailEnviado === false ? 'Marcado em atraso, mas o e-mail não foi enviado (veja a configuração de e-mail).' : d.emailEnviado ? 'Marcado em atraso e aviso enviado.' : 'Marcado em atraso.'))}>
                    Marcar em atraso
                  </button>
                </>
              ) : (
                <div className="adm-pilha">
                  <button type="button" className="adm-botao" disabled={ocupado} onClick={() => acao('cliente-pagamento', { situacao: 'em_dia' }, 'Pagamento marcado em dia.')}>Marcar em dia</button>
                  <button type="button" className="adm-botao adm-botao--fantasma" disabled={ocupado}
                    onClick={() => acao('cliente-pagamento', { situacao: 'em_atraso', enviarEmail: true }, (d) => (d.emailEnviado ? 'Aviso reenviado.' : 'O e-mail não foi enviado.'))}>
                    Reenviar aviso por e-mail
                  </button>
                </div>
              )}
              {cliente.avisosAtraso.length > 0 && (
                <ul className="adm-lista adm-lista--compacta">
                  {cliente.avisosAtraso.map((a) => <li key={a.em}>{a.enviado ? 'Aviso enviado' : 'Falha no envio'} em {dataHora(a.em)}</li>)}
                </ul>
              )}
            </section>

            <section className="adm-bloco">
              <h2>Acesso ao site</h2>
              <p className="adm-dica">{cliente.status === 'ativo' ? 'Inativar impede o cliente de entrar e encerra a sessão aberta.' : 'O cliente não consegue entrar enquanto estiver inativo.'}</p>
              <button type="button" className={`adm-botao ${cliente.status === 'ativo' ? 'adm-botao--fantasma' : ''}`} disabled={ocupado}
                onClick={() => acao('cliente-status', { status: cliente.status === 'ativo' ? 'inativo' : 'ativo' }, cliente.status === 'ativo' ? 'Cliente inativado.' : 'Cliente reativado.')}>
                {cliente.status === 'ativo' ? 'Inativar cliente' : 'Reativar cliente'}
              </button>
            </section>

            <section className="adm-bloco">
              <h2>Produtos de interesse</h2>
              {cliente.interesses.length === 0 ? <p className="adm-vazio">Nenhum marcado.</p> : (
                <ul className="adm-lista adm-lista--compacta">{cliente.interesses.map((i) => <li key={i.slug}>{i.nome}</li>)}</ul>
              )}
            </section>

            <section className="adm-bloco">
              <h2>Cadastro</h2>
              <dl className="adm-dados">
                <dt>Cadastrado em</dt><dd>{dataHora(cliente.criadoEm)}</dd>
                <dt>Último login</dt><dd>{dataHora(cliente.ultimoLoginEm)}</dd>
                <dt>Aceite da Política</dt><dd>{dataHora(cliente.aceitePrivacidadeEm)}</dd>
                {cliente.tipo === 'cnpj' && <><dt>Situação na Receita</dt><dd>{cliente.situacaoCnpj || 'Não conferida'}</dd></>}
                <dt>CEP</dt><dd>{cep(cliente.endereco?.cep)}</dd>
              </dl>
            </section>

            <section className="adm-bloco">
              <h2>Histórico</h2>
              {cliente.historico.length === 0 ? <p className="adm-vazio">Nenhuma alteração pelo painel.</p> : (
                <ul className="adm-lista adm-lista--compacta">
                  {cliente.historico.map((h, i) => (
                    <li key={i}><strong>{ACOES[h.acao] || h.acao}</strong> · {h.admin} · {dataHora(h.em)}
                      {descreverDetalhes(h.acao, h.detalhes) && <span className="adm-suave adm-bloco-texto">{descreverDetalhes(h.acao, h.detalhes)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="adm-bloco adm-bloco--perigo">
              <h2>Excluir cliente</h2>
              <p className="adm-dica">Apaga o cadastro, o endereço e os interesses (LGPD). Os orçamentos ficam no histórico da empresa, sem os dados pessoais. Não dá para desfazer.</p>
              <label className="adm-campo">
                <span>Para confirmar, digite o e-mail do cliente</span>
                <input value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} placeholder={cliente.email} />
              </label>
              <button type="button" className="adm-botao adm-botao--perigo" disabled={ocupado || confirmacao.trim().toLowerCase() !== cliente.email} onClick={excluir}>
                Excluir definitivamente
              </button>
            </section>
          </aside>
        )}
      </div>
    </>
  );
}
