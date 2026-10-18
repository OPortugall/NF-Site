import { notFound } from 'next/navigation';
import MinhaConta from '@/componentes/MinhaConta';
import { CONTAS_ATIVAS } from '@/lib/ambiente';

export const metadata = {
  title: 'Minha conta',
  description: 'Seus pedidos de orçamento e os dados do seu cadastro na NF Soluções Digitais.',
  robots: { index: false },
};

export default function PaginaConta() {
  if (!CONTAS_ATIVAS) notFound(); // na vitrine (produção, por enquanto) esta página não existe
  return (
    <div className="conteudo pagina pagina--estreita">
      <MinhaConta />
    </div>
  );
}
