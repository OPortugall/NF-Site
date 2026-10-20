import Link from 'next/link';
import { empresa, juridico } from '@/dados/empresa';
import { linkWhatsApp } from '@/lib/produtos';
import Logo from './Logo';
import { BotoesRedes } from './BotoesExternos';
import { IconeFacebook, IconeInstagram, IconeWhatsApp } from './Icones';

export default function Rodape() {
  return (
    <>
      <footer className="rodape">
        <div className="conteudo rodape__grade">
          <div className="rodape__marca">
            <Link href="/" className="rodape__logo" aria-label="NF Soluções Digitais, página inicial">
              <Logo claro />
            </Link>
            <p>Venda, locação e assistência técnica de impressoras e copiadoras desde {empresa.fundacao}.</p>
            <BotoesRedes claro />
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
          </div>
        </div>
        <div className="conteudo rodape__base">
          <p>© {new Date().getFullYear()} {empresa.nome} · CNPJ {juridico.cnpj}</p>
          <ul className="rodape__legal">
            <li><Link href="/privacidade">Política de Privacidade</Link></li>
            <li><Link href="/termos">Termos de Uso</Link></li>
          </ul>
          <p>{empresa.horario}</p>
        </div>
      </footer>

      {/* WhatsApp fixo no canto inferior esquerdo, acompanha a rolagem em todas as páginas */}
      <a className="whatsapp-flutuante" href={linkWhatsApp('Olá! Vim pelo site e gostaria de um orçamento.')}>
        <IconeWhatsApp width={30} height={30} />
        <span className="visualmente-oculto">Conversar pelo WhatsApp</span>
      </a>

      {/* Facebook e Instagram fixos na lateral direita */}
      <ul className="redes-flutuantes" aria-label="Redes sociais da NF">
        {empresa.redes.map((r) => {
          const Icone = r.nome === 'Facebook' ? IconeFacebook : IconeInstagram;
          return (
            <li key={r.nome}>
              <a className={`redes-flutuantes__botao redes-flutuantes__botao--${r.nome.toLowerCase()}`} href={r.url} target="_blank" rel="noopener noreferrer">
                <Icone width={24} height={24} />
                <span className="visualmente-oculto">{r.nome} da NF (abre em nova aba)</span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
