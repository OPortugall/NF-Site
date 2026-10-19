'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Campo, CampoSenha } from './Acesso';
import { useSessao } from './Provedores';
import { confirmarEmail, pedirNovaSenha, redefinirSenha } from '@/lib/api';
import { REGRAS_SENHA } from '@/lib/documentos';

// Telas abertas pelos links dos e-mails (/entrar#redefinir=… e /entrar#confirmar=…) e o pedido de nova senha.

// Lê o código do link e tira da barra de endereço (não fica no histórico nem é copiado junto com o endereço)
export function codigoDoLink() {
  if (typeof window === 'undefined') return null;
  const m = window.location.hash.match(/^#(redefinir|confirmar)=([0-9a-f]{64})$/);
  if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return m ? { tipo: m[1], codigo: m[2] } : null;
}

export function EsqueciSenha({ voltar }) {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setErro('Digite um e-mail válido.');
    setErro('');
    setEnviando(true);
    const r = await pedirNovaSenha(email.trim());
    setEnviando(false);
    if (r.ok) setMsg(r.dados.mensagem);
    else setErro(r.campos?.email || r.erro);
  };

  return (
    <div className="acesso">
      <h1 className="pagina__titulo acesso__titulo">Esqueci minha senha</h1>
      {msg ? (
        <p className="aviso aviso--info" role="status">{msg}</p>
      ) : (
        <form className="formulario" onSubmit={enviar} noValidate>
          <p className="pagina__lead">Digite o e-mail da sua conta. Enviamos um link para você criar uma nova senha.</p>
          <Campo rotulo="E-mail" erro={erro}>
            {(p) => <input {...p} type="email" autoComplete="email" value={email} onChange={(ev) => setEmail(ev.target.value)} />}
          </Campo>
          <button type="submit" className="botao botao--principal botao--largo" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar link'}</button>
        </form>
      )}
      <p className="formulario__rodape"><button type="button" className="link-botao" onClick={voltar}>Voltar para entrar</button></p>
    </div>
  );
}

export function RedefinirSenha({ codigo, voltar }) {
  const { contaExcluida: limparSessao } = useSessao();
  const [senha, setSenha] = useState('');
  const [repetir, setRepetir] = useState('');
  const [erros, setErros] = useState({});
  const [falha, setFalha] = useState('');
  const [pronto, setPronto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    const novos = {};
    if (!REGRAS_SENHA.every((r) => r.ok(senha))) novos.senha = 'A senha precisa de 8 caracteres, uma letra e um número.';
    if (repetir !== senha) novos.repetir = 'As senhas não conferem.';
    setErros(novos);
    setFalha('');
    if (Object.keys(novos).length) return;
    setEnviando(true);
    const r = await redefinirSenha(codigo, senha);
    setEnviando(false);
    if (r.ok) {
      limparSessao(); // a API encerrou qualquer sessão deste navegador
      setPronto(true);
    } else if (r.campos?.senha) setErros({ senha: r.campos.senha });
    else setFalha(r.erro);
  };

  if (pronto) {
    return (
      <div className="acesso" role="status">
        <h1 className="pagina__titulo acesso__titulo">Senha alterada</h1>
        <p className="pagina__lead">Pronto! Entre com a sua nova senha. Por segurança, outras sessões abertas da sua conta foram encerradas.</p>
        <button type="button" className="botao botao--principal" onClick={voltar}>Entrar</button>
      </div>
    );
  }
  return (
    <div className="acesso">
      <h1 className="pagina__titulo acesso__titulo">Criar uma nova senha</h1>
      <form className="formulario" onSubmit={enviar} noValidate>
        <CampoSenha rotulo="Nova senha" valor={senha} aoMudar={setSenha} erro={erros.senha} autoComplete="new-password"
          ajuda="Pelo menos 8 caracteres, com uma letra e um número." />
        <CampoSenha rotulo="Repita a nova senha" valor={repetir} aoMudar={setRepetir} erro={erros.repetir} autoComplete="new-password" />
        {falha && <p className="aviso aviso--erro" role="alert">{falha}</p>}
        <button type="submit" className="botao botao--principal botao--largo" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar nova senha'}</button>
      </form>
    </div>
  );
}

export function ConfirmarEmail({ codigo }) {
  const { atualizarSessao } = useSessao();
  const [estado, setEstado] = useState({ carregando: true });
  const feito = useRef(false);

  useEffect(() => {
    if (feito.current) return; // o código vale uma vez só: não envia de novo no modo de desenvolvimento
    feito.current = true;
    confirmarEmail(codigo).then((r) => {
      setEstado({ ok: r.ok, erro: r.erro });
      if (r.ok) atualizarSessao();
    });
  }, [codigo, atualizarSessao]);

  if (estado.carregando) return <p className="pagina__lead" role="status">Confirmando o seu e-mail…</p>;
  return (
    <div className="acesso" role="status">
      <h1 className="pagina__titulo acesso__titulo">{estado.ok ? 'E-mail confirmado' : 'Não foi possível confirmar'}</h1>
      <p className="pagina__lead">
        {estado.ok ? 'Obrigado! Agora você já pode enviar pedidos de orçamento pelo site.' : `${estado.erro} Você pode pedir outro em "Minha conta".`}
      </p>
      <Link href="/conta" className="botao botao--principal">Ir para Minha conta</Link>
    </div>
  );
}
