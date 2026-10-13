// Gerado por scripts/gerar_site_principal.py a partir da página arquivada de 22/02/2024.
export default function Newsletter() {
  return (
    <>
<div id="subscribe" className="azp_sections sections bg-fx nobg"><div className="content"><div className="quote-icon"><i className="fa fa-rss"></i></div>
<div className="rester"></div>
<div className="rester black"></div><div className="azp_container container"><h3 className="sections-head">Newsletter</h3>
<div className="small-separator ws"></div>
<div className="clear"></div>
<div className="subcribe">
	<span className="overlay suboverlay"></span>
	<fieldset>
		<form className="subscriptionForm" id="subscriptionForm" method="post" action="/api/newsletter" encType="multipart/form-data">
			<input className="inputForm" type="text" name="e-mail" defaultValue="Enter Your Email Address" />
						<input type="submit" id="submitButton" className="transition" defaultValue="Enviar" />
			<input type="hidden" name="receiveEmail" defaultValue="contato@nfsolucoesdigitais.com.br" />
			<input type="hidden" name="subject" defaultValue="NF Soluções" />
			<input type="hidden" name="thanks" defaultValue="Obrigado por subscrever a nossa newsletter!" />
			<input type="hidden" name="bd1bab9e16887bf367032bface073842" defaultValue="1" />		</form>
		<div id="success"></div>
		<div id="error"></div>
	</fieldset>
</div> 
</div></div></div>
    </>
  );
}
