'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useId, useRef, useState } from 'react';
import { useCarrinho, useSessao } from './Provedores';
import {
  REGRAS_SENHA,
  cnpjValido,
  cpfValido,
  mascaraCep,
  mascaraCnpj,
  mascaraCpf,
  mascaraTelefone,
  soDigitos,
  telefoneValido,
} from '@/lib/documentos';
import { consultarCnpj } from '@/lib/cnpj';
import { TIPOS, todosOsProdutos, tituloProduto } from '@/lib/produtos';

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

function PainelAcesso({ abaInicial }) {
  const [aba, setAba] = useState(abaInicial);
  const [concluido, setConcluido] = useState(null); // { nome, tipo } da conta recém-criada

  if (concluido) return <CadastroConcluido dados={concluido} />;

  return (
    <div className="acesso">
      <h1 className="pagina__titulo acesso__titulo">{aba === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>

      <div className="abas" role="tablist" aria-label="Entrar ou criar conta">
        <button type="button" role="tab" id="aba-entrar" aria-selected={aba === 'entrar'} aria-controls="painel-acesso" className="abas__aba" onClick={() => setAba('entrar')}>
          Já tenho conta
        </button>
        <button type="button" role="tab" id="aba-criar" aria-selected={aba === 'criar'} aria-controls="painel-acesso" className="abas__aba" onClick={() => setAba('criar')}>
          Criar conta
        </button>
      </div>

      <div id="painel-acesso" role="tabpanel" aria-labelledby={aba === 'entrar' ? 'aba-entrar' : 'aba-criar'}>
        {aba === 'entrar' ? <FormEntrar irParaCriar={() => setAba('criar')} /> : <FormCriar aoConcluir={setConcluido} />}
      </div>

    </div>
  );
}

// ---------- Google ----------
function BotaoGoogle({ texto }) {
  const [aviso, setAviso] = useState(false);
  return (
    <>
      <button type="button" className="botao botao--google botao--largo" onClick={() => setAviso(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.4v3.1A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z" />
        </svg>
        {texto}
      </button>
      {aviso && (
        <p className="aviso aviso--info" role="status">
          O acesso com Google será ligado junto com o banco de dados (precisa da configuração no Google Cloud).
        </p>
      )}
    </>
  );
}

function Separador() {
  return <p className="separador"><span>ou com e-mail</span></p>;
}

// ---------- campo com rótulo, ajuda e erro ----------
export function Campo({ rotulo, erro, ajuda, opcional, children, className = '' }) {
  const id = useId();
  const idAjuda = ajuda ? `${id}-ajuda` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;
  const descricao = [idAjuda, idErro].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`campo ${erro ? 'campo--erro' : ''} ${className}`}>
      <label htmlFor={id} className="campo__rotulo">
        {rotulo} {opcional && <span className="campo__opcional">(opcional)</span>}
      </label>
      {children({ id, 'aria-describedby': descricao, 'aria-invalid': erro ? true : undefined })}
      {ajuda && <p id={idAjuda} className="campo__ajuda">{ajuda}</p>}
      {erro && <p id={idErro} className="campo__erro">{erro}</p>}
    </div>
  );
}

export function CampoSenha({ rotulo, valor, aoMudar, erro, autoComplete, ajuda }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <Campo rotulo={rotulo} erro={erro} ajuda={ajuda}>
      {(props) => (
        <div className="campo__senha">
          <input {...props} type={visivel ? 'text' : 'password'} value={valor} onChange={(e) => aoMudar(e.target.value)} autoComplete={autoComplete} />
          <button type="button" onClick={() => setVisivel((v) => !v)} aria-pressed={visivel}>
            {visivel ? 'Ocultar' : 'Mostrar'}
            <span className="visualmente-oculto"> senha</span>
          </button>
        </div>
      )}
    </Campo>
  );
}

// ---------- entrar ----------
function FormEntrar({ irParaCriar }) {
  const { entrar } = useSessao();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState({});
  const [falha, setFalha] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    const novos = {};
    if (!emailValido(email)) novos.email = 'Digite um e-mail válido, como nome@empresa.com.br.';
    if (!senha) novos.senha = 'Digite sua senha.';
    setErros(novos);
    setFalha('');
    if (Object.keys(novos).length) return;
    setEnviando(true);
    const r = await entrar(email.trim(), senha);
    setEnviando(false);
    // /entrar?volta=/conta volta para "Minha conta" (só endereços conhecidos: nada de redirecionar para outro site)
    const volta = new URLSearchParams(window.location.search).get('volta') === '/conta' ? '/conta' : '/loja';
    if (r.ok) router.push(volta);
    else setFalha(r.erro);
  };

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <BotaoGoogle texto="Entrar com Google" />
      <Separador />
      <Campo rotulo="E-mail" erro={erros.email}>
        {(p) => <input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
      </Campo>
      <CampoSenha rotulo="Senha" valor={senha} aoMudar={setSenha} erro={erros.senha} autoComplete="current-password" />
      {falha && <p className="aviso aviso--erro" role="alert">{falha}</p>}
      <button type="submit" className="botao botao--principal botao--largo" disabled={enviando} aria-busy={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="formulario__rodape">
        Ainda não tem conta? <button type="button" className="link-botao" onClick={irParaCriar}>Criar conta</button>
      </p>
    </form>
  );
}

// ---------- criar conta ----------
const VAZIO = {
  tipo: 'cpf', nome: '', sobrenome: '', email: '', telefone: '', documento: '', razaoSocial: '', nomeFantasia: '',
  cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
  senha: '', confirmacao: '', aceite: false,
};

function validar(d, empresa) {
  const e = {};
  if (!d.nome.trim()) e.nome = 'Digite seu primeiro nome.';
  if (!d.sobrenome.trim()) e.sobrenome = 'Digite seu sobrenome.';
  if (!emailValido(d.email)) e.email = 'Digite um e-mail válido, como nome@empresa.com.br.';
  if (!telefoneValido(d.telefone)) e.telefone = 'Digite o telefone com DDD, como (12) 99999-9999.';
  if (d.tipo === 'cpf' && !cpfValido(d.documento)) e.documento = 'CPF inválido. Confira os 11 números.';
  if (d.tipo === 'cnpj' && !cnpjValido(d.documento)) e.documento = 'CNPJ inválido. Confira os 14 números.';
  else if (d.tipo === 'cnpj' && empresa?.estado === 'ok' && !empresa.dados.ativa)
    e.documento = `Este CNPJ está com situação "${empresa.dados.situacao}" na Receita Federal. O cadastro de empresa exige CNPJ ativo.`;
  else if (d.tipo === 'cnpj' && empresa?.estado === 'nao-encontrado')
    e.documento = 'Não encontramos este CNPJ na Receita Federal. Confira os números.';
  else if (d.tipo === 'cnpj' && empresa?.estado === 'buscando')
    e.documento = 'Aguarde: ainda estamos consultando este CNPJ.';
  if (d.tipo === 'cnpj' && !d.razaoSocial.trim()) e.razaoSocial = 'Digite a razão social da empresa.';
  if (soDigitos(d.cep).length !== 8) e.cep = 'Digite o CEP com 8 números.';
  if (!d.rua.trim()) e.rua = 'Digite a rua.';
  if (!d.numero.trim()) e.numero = 'Digite o número (ou "s/n").';
  if (!d.bairro.trim()) e.bairro = 'Digite o bairro.';
  if (!d.cidade.trim()) e.cidade = 'Digite a cidade.';
  if (!d.uf) e.uf = 'Escolha o estado.';
  if (!REGRAS_SENHA.every((r) => r.ok(d.senha))) e.senha = 'A senha ainda não cumpre todas as regras abaixo.';
  if (d.confirmacao !== d.senha || !d.confirmacao) e.confirmacao = 'As senhas não são iguais.';
  if (!d.aceite) e.aceite = 'Para criar a conta, é preciso concordar com os Termos de Uso e a Política de Privacidade.';
  return e;
}

function FormCriar({ aoConcluir }) {
  const { cadastrar } = useSessao();
  const { itens } = useCarrinho();
  const produtos = todosOsProdutos();
  const [d, setD] = useState(VAZIO);
  const [interesses, setInteresses] = useState(() => [...new Set(itens.map((i) => i.slug))]);
  const [erros, setErros] = useState({});
  const [falha, setFalha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cepStatus, setCepStatus] = useState('');
  const [empresa, setEmpresa] = useState(null); // consulta do CNPJ: { estado, dados? }
  const ultimoCnpj = useRef('');
  const formulario = useRef(null);

  const muda = (campo, valor) => setD((atual) => ({ ...atual, [campo]: valor }));

  const buscarCep = async (cep) => {
    const digitos = soDigitos(cep);
    if (digitos.length !== 8) return;
    setCepStatus('Buscando endereço…');
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const j = await r.json();
      if (j.erro) throw new Error();
      setD((atual) => ({
        ...atual,
        rua: j.logradouro || atual.rua,
        bairro: j.bairro || atual.bairro,
        cidade: j.localidade || atual.cidade,
        uf: j.uf || atual.uf,
      }));
      setCepStatus('Endereço preenchido. Confira e complete com o número.');
    } catch {
      setCepStatus('Não encontramos esse CEP. Preencha o endereço manualmente.');
    }
  };

  // Consulta o CNPJ na Receita (BrasilAPI / CNPJ.ws) e preenche os dados da empresa e o endereço.
  const buscarCnpj = async (doc) => {
    const digitos = soDigitos(doc);
    ultimoCnpj.current = digitos;
    setEmpresa({ estado: 'buscando' });
    const r = await consultarCnpj(digitos);
    if (ultimoCnpj.current !== digitos) return; // o usuário já digitou outro CNPJ
    setEmpresa(r);
    if (r.estado === 'ok') {
      const x = r.dados;
      setD((a) => ({
        ...a,
        razaoSocial: x.razaoSocial || a.razaoSocial,
        nomeFantasia: x.nomeFantasia || a.nomeFantasia,
        cep: x.cep || a.cep,
        rua: x.rua || a.rua,
        numero: x.numero || a.numero,
        complemento: x.complemento || a.complemento,
        bairro: x.bairro || a.bairro,
        cidade: x.cidade || a.cidade,
        uf: x.uf || a.uf,
        telefone: a.telefone || x.telefone,
      }));
      setErros((a) => {
        const { documento, razaoSocial, cep, rua, numero, bairro, cidade, uf, ...resto } = a;
        return resto;
      });
      setCepStatus(x.cep ? 'Endereço da empresa preenchido pelo cadastro da Receita. Altere se a entrega for em outro local.' : '');
    }
  };

  const mudaDocumento = (valor) => {
    const v = d.tipo === 'cpf' ? mascaraCpf(valor) : mascaraCnpj(valor);
    muda('documento', v);
    if (d.tipo !== 'cnpj') return;
    const digitos = soDigitos(v);
    if (digitos.length === 14 && cnpjValido(digitos)) {
      if (digitos !== ultimoCnpj.current) buscarCnpj(digitos);
    } else {
      ultimoCnpj.current = '';
      setEmpresa(null);
    }
  };

  const focarErro = () => requestAnimationFrame(() => formulario.current?.querySelector('[aria-invalid="true"]')?.focus());

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    const novos = validar(d, empresa);
    setErros(novos);
    setFalha('');
    if (Object.keys(novos).length) {
      focarErro(); // leva o foco ao primeiro campo com problema
      return;
    }
    setEnviando(true);
    const { confirmacao, ...paraEnviar } = d; // a confirmação da senha só serve aqui na tela
    const r = await cadastrar({ ...paraEnviar, interesses });
    setEnviando(false);
    if (!r.ok) {
      // O servidor confere tudo de novo (e o CNPJ na Receita): mostra os erros nos campos
      setErros(r.campos);
      setFalha(Object.keys(r.campos).length ? '' : r.erro);
      if (Object.keys(r.campos).length) focarErro();
      return;
    }
    aoConcluir({ nome: r.dados.cliente.nome, tipo: r.dados.cliente.tipo });
    window.scrollTo({ top: 0 });
  };

  const qtdErros = Object.keys(erros).length;

  return (
    <form ref={formulario} className="formulario" onSubmit={enviar} noValidate>
      <BotaoGoogle texto="Criar conta com Google" />
      <p className="campo__ajuda">Com o Google, você ainda completa documento, telefone e endereço depois.</p>
      <Separador />

      {qtdErros > 0 && (
        <p className="aviso aviso--erro" role="alert">
          {qtdErros === 1 ? 'Há 1 campo para corrigir.' : `Há ${qtdErros} campos para corrigir.`} Veja as mensagens em vermelho.
        </p>
      )}

      <fieldset className="grupo">
        <legend className="grupo__titulo">Tipo de cadastro</legend>
        <div className="tipo-cadastro">
          {[
            { v: 'cpf', t: 'Pessoa física (CPF)', s: 'Compra de produtos' },
            { v: 'cnpj', t: 'Empresa (CNPJ)', s: 'Compra e locação de produtos' },
          ].map((o) => (
            <label key={o.v} className="tipo-cadastro__opcao">
              <input
                type="radio"
                name="tipo"
                value={o.v}
                checked={d.tipo === o.v}
                onChange={() => {
                  setD((a) => ({ ...a, tipo: o.v, documento: '' }));
                  setEmpresa(null);
                  ultimoCnpj.current = '';
                }}
              />
              <span>
                <strong>{o.t}</strong>
                {o.s}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grupo">
        <legend className="grupo__titulo">Seus dados</legend>
        <div className="grade-campos">
          <Campo rotulo="Primeiro nome" erro={erros.nome}>
            {(p) => <input {...p} autoComplete="given-name" value={d.nome} onChange={(e) => muda('nome', e.target.value)} />}
          </Campo>
          <Campo rotulo="Sobrenome" erro={erros.sobrenome}>
            {(p) => <input {...p} autoComplete="family-name" value={d.sobrenome} onChange={(e) => muda('sobrenome', e.target.value)} />}
          </Campo>
          <Campo rotulo="E-mail" erro={erros.email}>
            {(p) => <input {...p} type="email" autoComplete="email" value={d.email} onChange={(e) => muda('email', e.target.value)} />}
          </Campo>
          <Campo rotulo="Telefone com DDD" erro={erros.telefone}>
            {(p) => <input {...p} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="(12) 99999-9999" value={d.telefone} onChange={(e) => muda('telefone', mascaraTelefone(e.target.value))} />}
          </Campo>
          <Campo
            rotulo={d.tipo === 'cpf' ? 'CPF' : 'CNPJ'}
            erro={erros.documento}
            className="campo--largo"
            ajuda={d.tipo === 'cnpj' && !empresa ? 'Ao digitar o CNPJ, buscamos os dados da empresa na Receita Federal.' : undefined}
          >
            {(p) => (
              <input
                {...p}
                inputMode="numeric"
                placeholder={d.tipo === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                value={d.documento}
                onChange={(e) => mudaDocumento(e.target.value)}
              />
            )}
          </Campo>
          {d.tipo === 'cnpj' && <StatusCnpj empresa={empresa} />}
          {d.tipo === 'cnpj' && (
            <>
              <Campo rotulo="Razão social" erro={erros.razaoSocial} className="campo--largo">
                {(p) => <input {...p} autoComplete="organization" value={d.razaoSocial} onChange={(e) => muda('razaoSocial', e.target.value)} />}
              </Campo>
              <Campo rotulo="Nome fantasia" opcional className="campo--largo">
                {(p) => <input {...p} value={d.nomeFantasia} onChange={(e) => muda('nomeFantasia', e.target.value)} />}
              </Campo>
            </>
          )}
        </div>
      </fieldset>

      <fieldset className="grupo">
        <legend className="grupo__titulo">Endereço</legend>
        <div className="grade-campos">
          <Campo rotulo="CEP" erro={erros.cep} ajuda={cepStatus || 'Digite o CEP para preencher o endereço.'}>
            {(p) => (
              <input
                {...p}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                value={d.cep}
                onChange={(e) => {
                  const v = mascaraCep(e.target.value);
                  muda('cep', v);
                  if (soDigitos(v).length === 8) buscarCep(v);
                }}
              />
            )}
          </Campo>
          <Campo rotulo="Rua" erro={erros.rua} className="campo--largo">
            {(p) => <input {...p} autoComplete="address-line1" value={d.rua} onChange={(e) => muda('rua', e.target.value)} />}
          </Campo>
          <Campo rotulo="Número" erro={erros.numero}>
            {(p) => <input {...p} value={d.numero} onChange={(e) => muda('numero', e.target.value)} />}
          </Campo>
          <Campo rotulo="Complemento" opcional>
            {(p) => <input {...p} autoComplete="address-line2" value={d.complemento} onChange={(e) => muda('complemento', e.target.value)} />}
          </Campo>
          <Campo rotulo="Bairro" erro={erros.bairro}>
            {(p) => <input {...p} value={d.bairro} onChange={(e) => muda('bairro', e.target.value)} />}
          </Campo>
          <Campo rotulo="Cidade" erro={erros.cidade}>
            {(p) => <input {...p} autoComplete="address-level2" value={d.cidade} onChange={(e) => muda('cidade', e.target.value)} />}
          </Campo>
          <Campo rotulo="Estado" erro={erros.uf}>
            {(p) => (
              <select {...p} autoComplete="address-level1" value={d.uf} onChange={(e) => muda('uf', e.target.value)}>
                <option value="">Escolha</option>
                {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            )}
          </Campo>
        </div>
      </fieldset>

      <fieldset className="grupo">
        <legend className="grupo__titulo">Senha</legend>
        <CampoSenha rotulo="Crie uma senha" valor={d.senha} aoMudar={(v) => muda('senha', v)} erro={erros.senha} autoComplete="new-password" />
        <ul className="regras-senha" aria-label="Regras da senha">
          {REGRAS_SENHA.map((r) => {
            const ok = r.ok(d.senha);
            return (
              <li key={r.id} className={ok ? 'regras-senha__ok' : ''}>
                <span aria-hidden="true">{ok ? '✓' : '○'}</span> {r.texto}
                <span className="visualmente-oculto">{ok ? ': cumprida' : ': pendente'}</span>
              </li>
            );
          })}
        </ul>
        <CampoSenha rotulo="Repita a senha" valor={d.confirmacao} aoMudar={(v) => muda('confirmacao', v)} erro={erros.confirmacao} autoComplete="new-password" />
      </fieldset>

      <fieldset className="grupo">
        <legend className="grupo__titulo">
          Produtos de interesse <span className="campo__opcional">(opcional)</span>
        </legend>
        <p className="campo__ajuda">Marque o que você procura. Nossa equipe recebe essa lista junto com o seu cadastro.</p>
        <div className="interesses">
          {produtos.map((p) => (
            <label key={p.slug} className="interesses__opcao">
              <input
                type="checkbox"
                checked={interesses.includes(p.slug)}
                onChange={(e) => setInteresses((a) => (e.target.checked ? [...a, p.slug] : a.filter((s) => s !== p.slug)))}
              />
              <span>{tituloProduto(p)}<small>{TIPOS[p.tipo]}</small></span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={`campo campo--aceite ${erros.aceite ? 'campo--erro' : ''}`}>
        <label className="aceite">
          <input type="checkbox" checked={d.aceite} onChange={(e) => muda('aceite', e.target.checked)} aria-invalid={erros.aceite ? true : undefined} aria-describedby={erros.aceite ? 'erro-aceite' : undefined} />
          <span>
            Li e concordo com os <a href="/termos" target="_blank" rel="noopener">Termos de Uso</a> e
            a <a href="/privacidade" target="_blank" rel="noopener">Política de Privacidade</a>.
          </span>
        </label>
        {erros.aceite && <p id="erro-aceite" className="campo__erro">{erros.aceite}</p>}
      </div>

      {falha && <p className="aviso aviso--erro" role="alert">{falha}</p>}
      <button type="submit" className="botao botao--principal botao--largo" disabled={enviando} aria-busy={enviando}>
        {enviando ? 'Criando conta…' : 'Criar conta'}
      </button>
    </form>
  );
}

// ---------- resultado da consulta do CNPJ ----------
function StatusCnpj({ empresa }) {
  if (!empresa) return null;
  const textos = {
    buscando: { classe: 'info', texto: 'Consultando o CNPJ na Receita Federal…' },
    'nao-encontrado': { classe: 'erro', texto: 'CNPJ não encontrado na Receita Federal.' },
    erro: { classe: 'info', texto: 'Não foi possível consultar o CNPJ agora. Preencha os dados da empresa manualmente.' },
  };
  if (empresa.estado === 'ok') {
    const x = empresa.dados;
    return (
      <div className={`status-cnpj ${x.ativa ? 'status-cnpj--ativa' : 'status-cnpj--inativa'} campo--largo`} role="status">
        <strong>{x.nomeFantasia || x.razaoSocial}</strong>
        <span>
          Situação na Receita: <b>{x.situacao || 'não informada'}</b>
          {x.ativa ? '. Dados da empresa e endereço preenchidos abaixo.' : '. Para cadastro de empresa, o CNPJ precisa estar ativo.'}
        </span>
      </div>
    );
  }
  const s = textos[empresa.estado];
  return <p className={`aviso aviso--${s.classe} campo--largo`} role="status">{s.texto}</p>;
}

// ---------- depois do cadastro ----------
function CadastroConcluido({ dados }) {
  return (
    <div className="acesso">
      <h1 className="pagina__titulo acesso__titulo">Conta criada</h1>
      <p className="pagina__lead">
        Bem-vindo(a), {dados.nome}! Seu cadastro {dados.tipo === 'cnpj' ? 'com CNPJ permite comprar e alugar' : 'com CPF permite comprar'} os nossos produtos.
      </p>
      <div className="acesso__acoes">
        <Link href="/loja" className="botao botao--principal">Ver equipamentos</Link>
      </div>
    </div>
  );
}

// /entrar?aba=criar abre direto no cadastro (lido no navegador: o site é estático)
function AcessoDaUrl() {
  const aba = useSearchParams().get('aba') === 'criar' ? 'criar' : 'entrar';
  return <PainelAcesso key={aba} abaInicial={aba} />;
}

export default function Acesso() {
  return (
    <Suspense fallback={<PainelAcesso abaInicial="entrar" />}>
      <AcessoDaUrl />
    </Suspense>
  );
}
