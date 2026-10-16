import Link from 'next/link';
import { empresa } from '@/dados/empresa';
import { linkWhatsApp } from '@/lib/produtos';
import { SeloNF } from './Logo';
import { BotoesRedes } from './BotoesExternos';
import { IconeWhatsApp } from './Icones';

export default function Rodape() {
  return (
    <>
      <footer className="rodape">
        <div className="conteudo rodape__grade">
          <div className="rodape__marca">
            <SeloNF tamanho={104} />
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
          <p>© {new Date().getFullYear()} {empresa.nome}</p>
          <p>{empresa.horario}</p>
        </div>
      </footer>

      {/* WhatsApp fixo no canto inferior esquerdo, acompanha a rolagem em todas as páginas */}
      <a className="whatsapp-flutuante" href={linkWhatsApp('Olá! Vim pelo site e gostaria de um orçamento.')}>
        <IconeWhatsApp width={30} height={30} />
        <span className="visualmente-oculto">Conversar pelo WhatsApp</span>
      </a>
    </>
  );
}
