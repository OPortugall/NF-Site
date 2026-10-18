import Link from 'next/link';
import MolduraSite from '@/componentes/MolduraSite';

export const metadata = { title: 'Página não encontrada' };

// 404 com a moldura da loja (a raiz não tem cabeçalho nem rodapé)
export default function NaoEncontrada() {
  return (
    <MolduraSite>
      <div className="conteudo pagina pagina--estreita">
        <header className="pagina__cabeca">
          <h1 className="pagina__titulo">Página não encontrada</h1>
          <p className="pagina__lead">O endereço pode ter mudado ou não existe mais.</p>
        </header>
        <p>
          <Link href="/" className="botao botao--principal">Ir para a página inicial</Link>{' '}
          <Link href="/loja" className="botao botao--secundario">Ver equipamentos</Link>
        </p>
      </div>
    </MolduraSite>
  );
}
