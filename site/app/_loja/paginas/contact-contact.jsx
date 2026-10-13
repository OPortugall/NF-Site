// Gerado por scripts/gerar_loja.py a partir de reconstrucao/loja/paginas/html-original/entrar-em-contato-conosco-20250118.html
export default function PaginaContactContact() {
  return (
    <>

                    <div className="columns-container">
            <div id="columns" className="container">
                <div className="row">
                                                            <div id="center_column" className="center_column col-xs-12 col-sm-12">
<div className="breadcrumb clearfix">
	<a className="home" href="/loja" title="Retornar a Home"><span>Home</span></a>
						<span className="navigation_page">Contato</span>
			</div>
                                            <h1 className="page-heading bottom-indent">
    Serviço ao cliente - Fale conosco</h1>
	<form action="/loja/entrar-em-contato-conosco" method="post" className="contact-form-box" encType="multipart/form-data">
		<fieldset>
        <h3 className="page-subheading">envie uma mensagem</h3>
        <div className="clearfix">
            <div className="col-xs-12 col-md-3">
                <div className="form-group selector1">
                    <label htmlFor="id_contact">Assunto Principal</label>
                                    <select id="id_contact" className="form-control" name="id_contact">
                        <option value="0">--Escolha--</option>
                                                    <option value="2">Serviço ao cliente</option>
                                                    <option value="1">Webmaster</option>
                                            </select>
                </div>
                    <p id="desc_contact0" className="desc_contact"> </p>
                                            <p id="desc_contact2" className="desc_contact contact-title" style={{ display: "none" }}>
                            <i className="icon-comment-alt"></i>Para qualquer pergunta sobre um produto, um pedido
                        </p>
                                            <p id="desc_contact1" className="desc_contact contact-title" style={{ display: "none" }}>
                            <i className="icon-comment-alt"></i>Se ocorrer algum problema técnico neste site
                        </p>
                                                    <p className="form-group">
                    <label htmlFor="email">Endereço de email</label>
                                            <input className="form-control grey validate" type="text" id="email" name="from" data-validate="isEmail" defaultValue="" />
                                    </p>
                                                            <div className="form-group selector1">
                            <label>Referência do pedido</label>
                                                            <input className="form-control grey" type="text" name="id_order" id="id_order" defaultValue="" />
                                                    </div>
                                                                                            <p className="form-group">
                        <label htmlFor="fileUpload">Anexar Arquivo</label>
                        <input type="hidden" name="MAX_FILE_SIZE" defaultValue="2000000" />
                        <input type="file" name="fileUpload" id="fileUpload" className="form-control" />
                    </p>
                            </div>
            <div className="col-xs-12 col-md-9">
                <div className="form-group">
                    <label htmlFor="message">Mensagem</label>
                    <textarea className="form-control" id="message" name="message"></textarea>
                </div>
            </div>
        </div>
        <div className="submit">
            <button type="submit" name="submitMessage" id="submitMessage" className="button btn btn-default button-medium"><span>Enviar<i className="icon-chevron-right right"></i></span></button>
		</div>
	</fieldset>
</form>
					</div>
										</div>
				</div>
			</div>
                                                                        
    </>
  );
}
