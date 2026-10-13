// Gerado por scripts/gerar_site_principal.py a partir da página arquivada de 22/02/2024.
export default function Contato() {
  return (
    <>
<div id="contacts" className="azp_sections sections nobg"><div className="content"><div className="rester"></div>
<div className="rester black"></div><div className="azp_separator quote-icon to-top"><i className="fa fa-angle-up"></i></div><div className="azp_container container">
<div className="contactForm clear">
	<fieldset>											
	<form id="contact_form" method="post" action="/api/contato" encType="multipart/form-data">			
		<div className="grid-half">
			<label htmlFor="name">Nome</label>
			<input type="text" name="name" id="name" />
		</div>
		<div className="grid-half">
			<label htmlFor="email" className="em">Email</label>
			<input type="text" name="email" id="email" className="right" />
		</div>
		<label htmlFor="message" className="m-top">Mensagem</label>
		<textarea name="message" id="message"></textarea>
		<div className="clear"></div>
		<label>
			<button className="submit_btn transition" id="submit_btn">Enviar</button>
		</label>
		<input type="hidden" name="receiveEmail" defaultValue="contato@nfsolucoesdigitais.com.br" />
		<input type="hidden" name="subject" defaultValue="NF Soluções Digitais" />
		<input type="hidden" name="thanks" defaultValue="Obrigado por entrar em contato conosco !" />
		<input type="hidden" name="option" defaultValue="com_azurapagebuilder" />
		<input type="hidden" name="task" defaultValue="contact.sendemail" />
		<input type="hidden" name="bd1bab9e16887bf367032bface073842" defaultValue="1" />		<div id="result"></div>
		</form>
	</fieldset>
</div>		
<div className="contact-details"><div className="grid-2">
	<div className="smallicon animaper phone"><i className="fa fa-mobile fa-2x"></i></div>
	<span>+55 (12) 3029-3838<br />+55 (12) 3322-0345<br /><br /><img src="/nfs/images/whatsapp.png" width="32" height="32" /> +55 (12) 97405-2176<br /><img src="/nfs/images/skype.png" width="32" height="32" /> nf.solucoes</span>
</div>
<div className="grid-2 showform">
	<div className="smallicon actform  animaper"><i className="fa fa-envelope-o fa-2x"></i></div>
	<span>contato@nfsolucoesdigitais.com.br</span>
</div>
<div className="grid-2">
	<div className="smallicon animaper showmap mnv "><i className="fa fa-home fa-2x"></i></div>
	<span>Av. Gisele Martins, 541 - Residencial Bosque dos Ipês<br /> São José dos Campos-	SP CEP 12236-500</span>
</div>
</div></div>
<div className="mapbox">
	<div className="map-decor"></div>
	<div className="close-map">
		<img src="/nfs/images/gmap/close-white.png" alt="Close" />
		<div className="triangle"></div>
	</div>
	<div id="map_canvas"></div>
</div>
<div className="footer clear">
	<p>NF Soluções Digitais  ©2019  All rights reserved.</p>
	<div className="small-separator ws"></div>
</div> 
</div></div>
    </>
  );
}
