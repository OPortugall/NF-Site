import Acesso from '@/componentes/Acesso';

export const metadata = {
  title: 'Entrar ou criar conta',
  description: 'Entre na sua conta da NF Soluções Digitais ou crie um cadastro para comprar ou alugar equipamentos.',
};

export default async function PaginaEntrar({ searchParams }) {
  const { aba } = await searchParams;
  return (
    <div className="conteudo pagina pagina--estreita">
      <Acesso abaInicial={aba === 'criar' ? 'criar' : 'entrar'} />
    </div>
  );
}
