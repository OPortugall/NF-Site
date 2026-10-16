'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { empresa } from '@/dados/empresa';
import Logo from './Logo';
import { FaixaRegistro } from './Tinta';
import { BotaoCarrinho } from './Carrinho';
import { IconeFechar, IconeMenu, IconeUsuario } from './Icones';
import { useSessao } from './Provedores';
import { CONTAS_ATIVAS } from '@/lib/ambiente';

const LINKS = [
  { href: '/loja', rotulo: 'Equipamentos' },
  { href: '/#servicos', rotulo: 'Serviços' },
  { href: '/#marcas', rotulo: 'Marcas' },
  { href: '/#empresa', rotulo: 'Empresa' },
  { href: '/#contato', rotulo: 'Contato' },
];

export default function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  const [contaAberta, setContaAberta] = useState(false);
  const caminho = usePathname();
  const { cliente, sair } = useSessao();

  // Fecha os menus ao trocar de página ou apertar Esc.
  useEffect(() => {
    setAberto(false);
    setContaAberta(false);
  }, [caminho]);
  useEffect(() => {
    if (!aberto && !contaAberta) return;
    const aoTeclar = (e) => {
      if (e.key === 'Escape') {
        setAberto(false);
        setContaAberta(false);
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aberto, contaAberta]);

  return (
    <header className="cabecalho">
      <FaixaRegistro />
      <div className="cabecalho__barra conteudo">
        <Link href="/" className="cabecalho__logo" aria-label="NF Soluções Digitais, página inicial">
          <Logo />
        </Link>

        <nav id="menu-principal" className={`menu${aberto ? ' menu--aberto' : ''}`} aria-label="Principal">
          <ul className="menu__lista">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="menu__link"
                  aria-current={l.href === '/loja' && caminho.startsWith('/loja') ? 'page' : undefined}
                  onClick={() => setAberto(false)}
                >
                  {l.rotulo}
                </Link>
              </li>
            ))}
            <li className="menu__telefone">
              <a className="menu__link" href={`tel:${empresa.telefones[0].numero}`}>
                Ligar {empresa.telefones[0].rotulo}
              </a>
            </li>
          </ul>
        </nav>

        <div className="cabecalho__acoes">
          <a className="cabecalho__telefone" href={`tel:${empresa.telefones[0].numero}`}>
            {empresa.telefones[0].rotulo}
          </a>
          {CONTAS_ATIVAS && (
            <>
            {cliente ? (
              <div className="conta">
                <button
                  type="button"
                  className="cabecalho__icone"
                  aria-expanded={contaAberta}
                  aria-controls="menu-conta"
                  onClick={() => setContaAberta((a) => !a)}
                >
                  <IconeUsuario />
                  <span className="cabecalho__icone-rotulo">Olá, {cliente.nome}</span>
                  <span className="visualmente-oculto">: menu da conta</span>
                </button>
                {contaAberta && (
                  <div id="menu-conta" className="conta__menu">
                    <p>
                      {cliente.email}
                      <br />
                      Cadastro com {cliente.tipo === 'cnpj' ? 'CNPJ (compra e locação)' : 'CPF (compra)'}
                    </p>
                    <button type="button" className="botao botao--secundario botao--compacto" onClick={() => { sair(); setContaAberta(false); }}>
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/entrar" className="cabecalho__icone" aria-current={caminho === '/entrar' ? 'page' : undefined}>
                <IconeUsuario />
                <span className="cabecalho__icone-rotulo">Entrar</span>
              </Link>
            )}
            <BotaoCarrinho />
            </>
          )}
          <button
            type="button"
            className="cabecalho__menu-botao"
            aria-expanded={aberto}
            aria-controls="menu-principal"
            onClick={() => setAberto((a) => !a)}
          >
            {aberto ? <IconeFechar /> : <IconeMenu />}
            <span className="visualmente-oculto">{aberto ? 'Fechar menu' : 'Abrir menu'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
