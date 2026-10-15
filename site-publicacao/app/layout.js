import { Archivo } from 'next/font/google';
import Cabecalho from '@/componentes/Cabecalho';
import Rodape from '@/componentes/Rodape';
import './globals.css';

// Archivo: uma família só, com eixo de largura. Semicondensada nos títulos e nomes de modelo
// (lembra a etiqueta técnica de um equipamento), largura normal no texto.
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--fonte',
});

export const metadata = {
  title: {
    default: 'NF Soluções Digitais | Impressoras e copiadoras em São José dos Campos',
    template: '%s | NF Soluções Digitais',
  },
  description:
    'Venda, locação e assistência técnica de impressoras, copiadoras e multifuncionais Ricoh, Brother, Canon, HP, Kyocera e outras marcas em São José dos Campos.',
};

export const viewport = {
  themeColor: '#232323',
};

export default function LayoutRaiz({ children }) {
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body>
        <a className="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a>
        <Cabecalho />
        <main id="conteudo">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
