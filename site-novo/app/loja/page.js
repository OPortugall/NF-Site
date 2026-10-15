import Catalogo from '@/componentes/Catalogo';
import { marcas } from '@/dados/empresa';
import { FILTROS_TIPO, linkWhatsApp, todosOsProdutos } from '@/lib/produtos';

export const metadata = {
  title: 'Equipamentos e suprimentos',
  description: 'Multifuncionais, copiadoras, impressoras e toners seminovos revisados. Peça seu orçamento.',
};

// /loja?tipo=suprimentos abre o catálogo já filtrado (usado pelo banner da página inicial).
export default async function PaginaLoja({ searchParams }) {
  const { tipo } = await searchParams;
  const tipoInicial = tipo in FILTROS_TIPO ? tipo : 'todos';
  return (
    <div className="conteudo pagina">
      <header className="pagina__cabeca">
        <h1 className="pagina__titulo">Equipamentos e suprimentos</h1>
        <p className="pagina__lead">
          Multifuncionais, copiadoras e impressoras seminovas, revisadas pela nossa assistência técnica antes da entrega.
          Não achou o modelo? Trabalhamos com {marcas.length} marcas.{' '}
          <a href={linkWhatsApp('Olá! Procuro um equipamento que não encontrei no site.')}>Pergunte pelo WhatsApp</a>.
        </p>
      </header>
      <Catalogo produtos={todosOsProdutos()} tipoInicial={tipoInicial} />
    </div>
  );
}
