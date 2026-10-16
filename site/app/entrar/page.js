import { notFound } from 'next/navigation';
import Acesso from '@/componentes/Acesso';
import { CONTAS_ATIVAS } from '@/lib/ambiente';

export const metadata = {
  title: 'Entrar ou criar conta',
  description: 'Entre na sua conta da NF Soluções Digitais ou crie um cadastro para comprar ou alugar equipamentos.',
};

export default async function PaginaEntrar({ searchParams }) {
  if (!CONTAS_ATIVAS) notFound(); // na vitrine (produção, por enquanto) esta página não existe
  const { aba } = await searchParams;
  return (
    <div className="conteudo pagina pagina--estreita">
      <Acesso abaInicial={aba === 'criar' ? 'criar' : 'entrar'} />
    </div>
  );
}
