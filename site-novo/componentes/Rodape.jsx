import Link from 'next/link';
import { empresa } from '@/dados/empresa';
import { linkWhatsApp } from '@/lib/produtos';
import Logo from './Logo';
import { IconeTelefone, IconeWhatsApp } from './Icones';

export default function Rodape() {
  return (
    <>
      <footer className="rodape">
        <div className="conteudo rodape__grade">
          <div className="rodape__marca">
            <Logo claro />
            <p>Venda, locação e assistência técnica de impressoras e copiadoras desde {empresa.fundacao}.</p>
          </div>

          <nav aria-label="Rodapé">
            <h2 className="rodape__titulo">Site</h2>
            <ul className="rodape__lista">
              <li><Link href="/loja">Equipamentos</Link></li>
              <li><Link href="/#servicos">Serviços</Link></li>
              <li><Link href="/#empresa">Empresa</Link></li>
              <li><Link href="/#contato">Contato</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className="rodape__titulo">Fale com a gente</h2>
            <ul className="rodape__lista">
              {empresa.telefones.map((t) => (
                <li key={t.numero}><a href={`tel:${t.numero}`}>{t.rotulo}</a></li>
              ))}
              <li><a href={linkWhatsApp('Olá! Vim pelo site.')}>WhatsApp {empresa.whatsapp.rotulo}</a></li>
              <li><a href={`mailto:${empresa.email}`}>{empresa.email}</a></li>
            </ul>
          </div>

          <div>
            <h2 className="rodape__titulo">Endereço</h2>
            <address className="rodape__endereco">
              {empresa.endereco.linha1}<br />
              {empresa.endereco.linha2}<br />
              {empresa.endereco.cidade}<br />
              CEP {empresa.endereco.cep}
            </address>
            <ul className="rodape__redes">
              {empresa.redes.map((r) => (
                <li key={r.nome}><a href={r.url} rel="noopener" target="_blank">{r.nome}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="conteudo rodape__base">
          <p>© {new Date().getFullYear()} {empresa.nome}</p>
          <p>{empresa.horario}</p>
        </div>
      </footer>

      {/* Celular: atalhos de contato sempre ao alcance do polegar */}
      <div className="barra-contato">
        <a className="barra-contato__item barra-contato__item--whatsapp" href={linkWhatsApp('Olá! Vim pelo site e gostaria de um orçamento.')}>
          <IconeWhatsApp /> WhatsApp
        </a>
        <a className="barra-contato__item" href={`tel:${empresa.telefones[0].numero}`}>
          <IconeTelefone /> Ligar
        </a>
      </div>
    </>
  );
}
