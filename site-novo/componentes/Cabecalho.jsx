'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { empresa } from '@/dados/empresa';
import { linkWhatsApp } from '@/lib/produtos';
import Logo from './Logo';
import { FaixaRegistro } from './Tinta';
import { IconeFechar, IconeMenu, IconeWhatsApp } from './Icones';

const LINKS = [
  { href: '/loja', rotulo: 'Equipamentos' },
  { href: '/#servicos', rotulo: 'Serviços' },
  { href: '/#marcas', rotulo: 'Marcas' },
  { href: '/#empresa', rotulo: 'Empresa' },
  { href: '/#contato', rotulo: 'Contato' },
];

export default function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  const caminho = usePathname();

  // Fecha o menu do celular ao trocar de página ou apertar Esc.
  useEffect(() => setAberto(false), [caminho]);
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e) => e.key === 'Escape' && setAberto(false);
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

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
          </ul>
        </nav>

        <div className="cabecalho__acoes">
          <a className="cabecalho__telefone" href={`tel:${empresa.telefones[0].numero}`}>
            {empresa.telefones[0].rotulo}
          </a>
          <a className="botao botao--whatsapp botao--compacto" href={linkWhatsApp('Olá! Vim pelo site e gostaria de um orçamento.')}>
            <IconeWhatsApp />
            <span>WhatsApp</span>
          </a>
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
