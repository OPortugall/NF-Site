import { Archivo } from 'next/font/google';
import { AMBIENTE, EH_PRODUCAO } from '@/lib/ambiente';
import { URL_DO_SITE } from '@/lib/seguranca.mjs';
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
  // Base dos links canônicos e do compartilhamento (cada ambiente tem seu endereço)
  metadataBase: new URL(URL_DO_SITE[AMBIENTE]),
  title: {
    default: 'NF Soluções Digitais | Impressoras e copiadoras em São José dos Campos',
    template: '%s | NF Soluções Digitais',
  },
  description:
    'Venda, locação e assistência técnica de impressoras, copiadoras e multifuncionais Ricoh, Brother, Canon, HP, Kyocera e outras marcas em São José dos Campos.',
  // Teste e desenvolvimento nunca aparecem no Google
  robots: EH_PRODUCAO ? undefined : { index: false, follow: false },
};

export const viewport = {
  themeColor: '#232323',
};

// Raiz comum ao site e ao painel: só a página em branco, a fonte e os estilos.
// A moldura da loja (cabeçalho, rodapé, carrinho) fica em app/(site)/layout.js; o painel tem a dele.
export default function LayoutRaiz({ children }) {
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
