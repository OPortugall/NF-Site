import ScriptsLegados from '../componentes/ScriptsLegados';
import Cabecalho from './Cabecalho';
import Rodape, { Extras } from './Rodape';
import SliderInicial from './SliderInicial';

export function metadadosDaPagina(pagina) {
  return {
    title: pagina.titulo,
    description: pagina.descricao || undefined,
    icons: pagina.icone ? { icon: pagina.icone } : undefined,
  };
}

// Monta uma página da loja: cabeçalho e rodapé compartilhados + o miolo próprio da página.
// As folhas de estilo usam "precedence" para o React colocá-las no <head>, na ordem original.
export default function PaginaLoja({ pagina }) {
  const { Miolo } = pagina;
  return (
    <>
      {pagina.estilos.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="loja" />
      ))}
      <div id="page">
        <Cabecalho selecionados={pagina.selecionados}>{pagina.slider ? <SliderInicial /> : null}</Cabecalho>
        <Miolo />
        <Rodape />
      </div>
      <Extras />
      <ScriptsLegados itens={pagina.scripts} />
    </>
  );
}
