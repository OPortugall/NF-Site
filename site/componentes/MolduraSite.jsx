import Cabecalho from './Cabecalho';
import FaixaAmbiente from './FaixaAmbiente';
import { GavetaCarrinho } from './Carrinho';
import { Provedores } from './Provedores';
import Rodape from './Rodape';
import { CONTAS_ATIVAS } from '@/lib/ambiente';

// Moldura das páginas do site (loja, institucionais e 404): cabeçalho, rodapé e carrinho.
export default function MolduraSite({ children }) {
  return (
    <Provedores>
      <a className="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a>
      <FaixaAmbiente />
      <Cabecalho />
      <main id="conteudo">{children}</main>
      <Rodape />
      {CONTAS_ATIVAS && <GavetaCarrinho />}
    </Provedores>
  );
}
