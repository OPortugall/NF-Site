'use client';

import { useState } from 'react';
import { adminEnviar } from '@/lib/api';

// Login do painel: e-mail e senha, depois o código de 6 dígitos do app autenticador.
// No primeiro acesso, mostra a chave para cadastrar o app (o 2FA só vale depois de um código certo).
export default function LoginAdmin({ etapaInicial, aviso, aoEntrar }) {
  const [etapa, setEtapa] = useState(etapaInicial || 'senha'); // 'senha' | 'codigo' | 'configurar'
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [chave, setChave] = useState(null); // { chave, endereco } no primeiro acesso
  const [erro, setErro] = useState(aviso || '');
  const [enviando, setEnviando] = useState(false);

  const enviarSenha = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    const r = await adminEnviar('entrar', { email: email.trim(), senha });
    setEnviando(false);
    setSenha('');
    if (!r.ok) return setErro(r.erro);
    if (r.dados.etapa === 'configurar') setChave({ chave: r.dados.chave, endereco: r.dados.endereco });
    setEtapa(r.dados.etapa);
  };

  const enviarCodigo = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    const r = await adminEnviar('codigo', { codigo: codigo.replace(/\D/g, '') });
    setEnviando(false);
    setCodigo('');
    if (r.ok) return aoEntrar(r.dados.admin);
    if (r.codigo === 'admin' || r.status === 429) setEtapa('senha');
    setErro(r.erro);
  };

  return (
    <div className="adm-login">
      <div className="adm-login__caixa">
        <p className="adm-login__marca">NF Soluções Digitais</p>
        <h1 className="adm-login__titulo">Painel administrativo</h1>
        {erro && <p className="adm-aviso adm-aviso--erro" role="alert">{erro}</p>}

        {etapa === 'senha' && (
          <form onSubmit={enviarSenha} className="adm-form">
            <label className="adm-campo">
              <span>E-mail</span>
              <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="adm-campo">
              <span>Senha</span>
              <input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </label>
            <button className="adm-botao" disabled={enviando}>{enviando ? 'Conferindo…' : 'Continuar'}</button>
          </form>
        )}

        {etapa !== 'senha' && (
          <form onSubmit={enviarCodigo} className="adm-form">
            {etapa === 'configurar' && (
              <div className="adm-2fa">
                <p><strong>Primeiro acesso: ative a verificação em duas etapas.</strong></p>
                <ol>
                  <li>Instale um app autenticador no celular (Google Authenticator, Microsoft Authenticator ou Authy).</li>
                  <li>No app, escolha <em>adicionar conta</em> → <em>inserir chave de configuração</em> e digite a chave abaixo (tipo: baseada em tempo).</li>
                  <li>Digite aqui o código de 6 dígitos que o app mostrar.</li>
                </ol>
                {chave ? (
                  <>
                    <p className="adm-2fa__chave" aria-label="Chave de configuração">{chave.chave}</p>
                    <p className="adm-dica">No celular, você também pode tocar neste link para abrir o app direto: <a href={chave.endereco}>adicionar ao app autenticador</a>.</p>
                  </>
                ) : (
                  <p className="adm-dica">A chave foi mostrada quando você digitou a senha. Se não anotou, <button type="button" className="adm-link" onClick={() => setEtapa('senha')}>entre de novo</button> para ver outra.</p>
                )}
                <p className="adm-dica">Guarde o celular com cuidado: sem ele, o acesso ao painel precisa ser liberado no banco de dados.</p>
              </div>
            )}
            <label className="adm-campo">
              <span>Código de 6 dígitos do app autenticador</span>
              <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} value={codigo}
                onChange={(e) => setCodigo(e.target.value)} required autoFocus />
            </label>
            <button className="adm-botao" disabled={enviando}>{enviando ? 'Conferindo…' : 'Entrar no painel'}</button>
            <button type="button" className="adm-link" onClick={() => { setEtapa('senha'); setErro(''); }}>Voltar</button>
          </form>
        )}
      </div>
    </div>
  );
}
