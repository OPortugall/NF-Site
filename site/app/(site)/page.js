// Gerado por scripts/gerar_site_principal.py — página inicial do site principal.
import ScriptsLegados from '../componentes/ScriptsLegados';
import { itens } from './scripts-legados';
import Abertura from './componentes/Abertura';
import Clientes from './componentes/Clientes';
import Contato from './componentes/Contato';
import Equipe from './componentes/Equipe';
import Navegacao from './componentes/Navegacao';
import Newsletter from './componentes/Newsletter';
import Portfolio from './componentes/Portfolio';
import Rodape from './componentes/Rodape';
import Servicos from './componentes/Servicos';
import Sobre from './componentes/Sobre';
import Sobreposicao from './componentes/Sobreposicao';

export default function PaginaInicial() {
  return (
    <>

	<div id="main">
	<Navegacao />	
		<Sobreposicao />	
	<div className="wrapper">
				<div id="system-message-container">
	</div>
<Abertura /><Sobre /><Servicos /><Portfolio /><Equipe /><Newsletter /><Clientes /><Contato />
	<Rodape />
	</div>
	</div>
<a href="https://api.whatsapp.com/send?l=pt&phone=5512974052176"><img src="/nfs/images/whatsapp.png" style={{ height: "80px", position: "fixed", bottom: "25px", left: "25px", zIndex: "100" }} data-selector="img" /></a>

      <ScriptsLegados itens={itens} />
    </>
  );
}
