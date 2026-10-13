// Gerado por scripts/gerar_loja.py — cabeçalho da loja (igual em todas as páginas).
// "selecionados": endereços de categoria destacados no menu; "children": conteúdo extra no fim do <header> (slider da inicial).
export default function Cabecalho({ selecionados = [], children }) {
  const sel = (href) => (selecionados.includes(href) ? 'selected' : undefined);
  return (
    <>
<div className="header-container">
                    <header id="header">
                        <div className="banner">
                            <div className="container">
                                <div className="row">
                                </div>
                            </div>
                        </div>
                        <div className="nav">
                            <div className="container">
                                <div className="row">
                                    <nav><div className="lc">
</div>
<ul id="header_links">
		<li>
            <i className="icon-user"></i>
            <a className="link-myaccount" href="/loja/minha-conta" title="Minha conta">Minha conta</a></li>
	<li>
               <i className="icon-heart"></i>
               <a className="link-wishlist wishlist_block" href="/loja/module/blockwishlist/mywishlist" title="Meus desejos">Meus desejos</a></li>
		<li>
            <i className="icon-shopping-cart"></i>
            <a className="link-mycart" href="/loja/pedido" title="Meu carrinho">Meu carrinho</a></li>
	        	<li>
            <i className="icon-check-sign"></i>
            <a className="link-checkout" href="/loja/pedido" title="Check-out">Check-out</a></li>
					<li className="last">
                            <i className="icon-lock"></i>
                            <a className="link-login" href="/loja/minha-conta" title="Entrar" rel="nofollow">Entrar</a></li>
</ul></nav>
                                </div>
                            </div>
                        </div>
                        <div className="wrap_header_logo">
                            <div className="container">
                                <div className="row">
                                    <div id="header_logo" className="col-xs-4 col-sm-4 col-md-4">
                                        <a href="/loja" title="NF Soluções Digitais">
                                            <img className="logo img-responsive" src="/loja/img/nf-solucoes-digitais-logo-1455302687.jpg" alt="NF Soluções Digitais" width="364" height="157" />
                                        </a>
                                    </div>
                                <div className="header-content col-xs-8 col-sm-8 col-md-8">
<div id="sticky_top">
<div id="search_block_top" className="clearfix">
   <div className="pts-search">
    	<form method="get" action="/loja/procurar" id="searchbox">
            <input type="hidden" name="controller" defaultValue="search" />
                                <input type="hidden" name="orderby" defaultValue="position" />
                <input type="hidden" name="orderway" defaultValue="desc" />
                <input className="search_query form-control" type="text" id="search_query_top" name="search_query" defaultValue="Pesquisar..." />
                <button type="submit" name="submit_search" className="btn button-search">
                    <span className="icon-search"></span>
                </button>
    	</form>
    </div>
</div>
	<div className="shopping_cart">
		<a className="title_cart" href="/loja/pedido" title="Ver meu carrinho de compras" rel="nofollow">
			<span className="ajax_cart_quantity unvisible">0</span>
			<span className="ajax_cart_product_txt unvisible">Item -</span>
			<span className="ajax_cart_product_txt_s unvisible">Items -</span>
			<span className="ajax_cart_total unvisible">
							</span>
			<span className="ajax_cart_no_product">(vazio)</span>
					</a>
					<div className="cart_block block exclusive">
				<div className="block_content">
					<div className="cart_block_list">
												<p className="cart_block_no_products">
							Sem produtos
						</p>
												<div className="cart-prices">
							<div className="cart-prices-line first-line">
								<span className="price cart_block_shipping_cost ajax_cart_shipping_cost">
																			Frete grátis!
																	</span>
								<span>
									Frete
								</span>
							</div>
																					<div className="cart-prices-line last-line">
								<span className="price cart_block_total ajax_block_cart_total">R$ 0,00</span>
								<span>Total</span>
							</div>
													</div>
						<p className="cart-buttons">
							<a id="button_order_cart" className="btn btn-default button button-small" href="/loja/pedido" title="Finalizar" rel="nofollow">
								<span>
									Finalizar<i className="icon-chevron-right right"></i>
								</span>
							</a>
						</p>
					</div>
				</div>
			</div>
			</div>
</div>
	<div id="layer_cart">
		<div className="clearfix">
			<div className="layer_cart_product col-xs-12 col-md-6">
				<span className="cross" title="Fechar janela"></span>
				<h2>
					<i className="icon-ok"></i>Produto adicionado ao seu carrinho de compras
				</h2>
				<div className="product-image-container layer_cart_img">
				</div>
				<div className="layer_cart_product_info">
					<span id="layer_cart_product_title" className="product-name"></span>
					<span id="layer_cart_product_attributes"></span>
					<div>
						<strong className="dark">Quantidade</strong>
						<span id="layer_cart_product_quantity"></span>
					</div>
					<div>
						<strong className="dark">Total</strong>
						<span id="layer_cart_product_price"></span>
					</div>
				</div>
			</div>
			<div className="layer_cart_cart col-xs-12 col-md-6">
				<h2>
					<span className="ajax_cart_product_txt_s  unvisible">
						Existem <span className="ajax_cart_quantity">0</span> produtos no seu carrinho.
					</span>
					<span className="ajax_cart_product_txt ">
						Existe 1 produto no seu carrinho.
					</span>
				</h2>
				<div className="layer_cart_row">
					<strong className="dark">
						Total de produtos:
													(taxa incl.)
											</strong>
					<span className="ajax_block_products_total">
											</span>
				</div>
								<div className="layer_cart_row">
					<strong className="dark">
						Total do frete (taxa incl.)					</strong>
					<span className="ajax_cart_shipping_cost">
													Frete grátis!
											</span>
				</div>
								<div className="layer_cart_row">	
					<strong className="dark">
						Total
													(taxa incl.)
											</strong>
					<span className="ajax_block_cart_total">
											</span>
				</div>
				<div className="button-container">	
					<span className="continue btn btn-default button exclusive-medium" title="Continuar comprando">
						<span>
							<i className="icon-chevron-left left"></i>Continuar comprando
						</span>
					</span>
					<a className="btn btn-default button button-medium" href="/loja/pedido" title="Finalizar Pedido" rel="nofollow">
						<span>
							Finalizar Pedido<i className="icon-chevron-right right"></i>
						</span>
					</a>	
				</div>
			</div>
		</div>
		<div className="crossseling"></div>
	</div> 
	<div className="layer_cart_overlay"></div>
                                    <div className="top-info">
<div className="support"><span className="info-support"> <em className="icon-phone"></em> [ Tel: (12)<em> 3029-3838 </em>] </span> <span className="days">Segunda-feira - Sexta-feira: 8:00 am - 18:00 pm</span></div>
</div>
                                                 </div>
                        </div>
                    </div>
                </div>
                <div className="top-menu">
                    <div className="shadow-top-menu"></div>
                    <div className="container">
                        <div className="row">
    <div className="nav-mobile-container visible-sm visible-xs ">
        <div className="navbar">
            <div id="navbar-inner" className="navbar-inner navbar-inactive">
                <div className="menu-mobile">
                    <a className="btn btn-navbar">
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                    </a>
                    <span className="brand">Menu</span>
                </div>
                <ul id="pts-mobilemenu" className="tree dhtml  mobilemenu nav-collapse collapse">
<li>
	<a href="/loja/18-copiadoras" className={sel("/loja/18-copiadoras")} title="">
		Copiadoras
	</a>
			<ul>
<li>
	<a href="/loja/25-coloridas" className={sel("/loja/25-coloridas")} title="">
		Coloridas
	</a>
	</li>
<li className="last">
	<a href="/loja/26-monocromaticas" className={sel("/loja/26-monocromaticas")} title="">
		Monocromáticas
	</a>
	</li>
									</ul>
	</li>
<li>
	<a href="/loja/3-impressoras" className={sel("/loja/3-impressoras")} title="">
		Impressoras
	</a>
			<ul>
<li>
	<a href="/loja/4-coloridas" className={sel("/loja/4-coloridas")} title="">
		Coloridas
	</a>
	</li>
<li className="last">
	<a href="/loja/8-monocromaticas" className={sel("/loja/8-monocromaticas")} title="">
		Monocromáticas
	</a>
	</li>
									</ul>
	</li>
<li>
	<a href="/loja/17-multifuncional" className={sel("/loja/17-multifuncional")} title="">
		Multifuncional
	</a>
			<ul>
<li>
	<a href="/loja/19-coloridas" className={sel("/loja/19-coloridas")} title="">
		Coloridas
	</a>
	</li>
<li className="last">
	<a href="/loja/20-monocromaticas" className={sel("/loja/20-monocromaticas")} title="">
		Monocromáticas
	</a>
	</li>
									</ul>
	</li>
<li>
	<a href="/loja/12-plotter" className={sel("/loja/12-plotter")} title="">
		Plotter
	</a>
			<ul>
<li className="last">
	<a href="/loja/13-canon" className={sel("/loja/13-canon")} title="">
		Canon
	</a>
	</li>
									</ul>
	</li>
<li className="last">
	<a href="/loja/16-suprimentos" className={sel("/loja/16-suprimentos")} title="">
		Suprimentos
	</a>
			<ul>
<li>
	<a href="/loja/21-chip" className={sel("/loja/21-chip")} title="">
		Chip
	</a>
	</li>
<li>
	<a href="/loja/22-cilindro" className={sel("/loja/22-cilindro")} title="">
		Cilindro
	</a>
	</li>
<li>
	<a href="/loja/23-revelador" className={sel("/loja/23-revelador")} title="">
		Revelador
	</a>
	</li>
<li className="last">
	<a href="/loja/24-toner" className={sel("/loja/24-toner")} title="">
		Toner
	</a>
	</li>
									</ul>
	</li>
                </ul>
            </div>
        </div>
    </div>
                <div className="nav-container visible-lg visible-md">
                    <div id="pts_megamenu" className="pts_megamenu">
                        <div id="pts_menu_home" className="pts_menu"><div className="parentMenu"><a href="/loja"><span><i className="icon-home"></i></span></a></div></div><div id="pts_menu18" className="pts_menu nav-1">
<div className="parentMenu">
<a href="/loja/18-copiadoras" className={sel("/loja/18-copiadoras")}>
<span>Copiadoras</span>
</a>
</div>
<div id="popup18" className="popup" style={{ display: "none", width: "1228px" }}>
<div className="block1" id="block118">
<div className="column last col1"><div className="itemMenu level1"><a className="itemMenuName level3 nochild" href="/loja/25-coloridas"><span>Coloridas</span></a><a className="itemMenuName level3 nochild" href="/loja/26-monocromaticas"><span>Monocromáticas</span></a></div></div>
<div className="clearBoth"></div>
</div>
</div>
</div><div id="pts_menu3" className="pts_menu nav-2">
<div className="parentMenu">
<a href="/loja/3-impressoras" className={sel("/loja/3-impressoras")}>
<span>Impressoras</span>
</a>
</div>
<div id="popup3" className="popup" style={{ display: "none", width: "1228px" }}>
<div className="block1" id="block13">
<div className="column last col1"><div className="itemMenu level1"><a className="itemMenuName level3 nochild" href="/loja/4-coloridas"><span>Coloridas</span></a><a className="itemMenuName level3 nochild" href="/loja/8-monocromaticas"><span>Monocromáticas</span></a></div></div>
<div className="clearBoth"></div>
</div>
</div>
</div><div id="pts_menu17" className="pts_menu nav-3">
<div className="parentMenu">
<a href="/loja/17-multifuncional" className={sel("/loja/17-multifuncional")}>
<span>Multifuncional</span>
</a>
</div>
<div id="popup17" className="popup" style={{ display: "none", width: "1228px" }}>
<div className="block1" id="block117">
<div className="column last col1"><div className="itemMenu level1"><a className="itemMenuName level3 nochild" href="/loja/19-coloridas"><span>Coloridas</span></a><a className="itemMenuName level3 nochild" href="/loja/20-monocromaticas"><span>Monocromáticas</span></a></div></div>
<div className="clearBoth"></div>
</div>
</div>
</div><div id="pts_menu12" className="pts_menu nav-4">
<div className="parentMenu">
<a href="/loja/12-plotter" className={sel("/loja/12-plotter")}>
<span>Plotter</span>
</a>
</div>
<div id="popup12" className="popup" style={{ display: "none", width: "1228px" }}>
<div className="block1" id="block112">
<div className="column last col1"><div className="itemMenu level1"><a className="itemMenuName level3 nochild" href="/loja/13-canon"><span>Canon</span></a></div></div>
<div className="clearBoth"></div>
</div>
</div>
</div><div id="pts_menu16" className="pts_menu nav-5">
<div className="parentMenu">
<a href="/loja/16-suprimentos" className={sel("/loja/16-suprimentos")}>
<span>Suprimentos</span>
</a>
</div>
<div id="popup16" className="popup" style={{ display: "none", width: "1228px" }}>
<div className="block1" id="block116">
<div className="column last col1"><div className="itemMenu level1"><a className="itemMenuName level3 nochild" href="/loja/21-chip"><span>Chip</span></a><a className="itemMenuName level3 nochild" href="/loja/22-cilindro"><span>Cilindro</span></a><a className="itemMenuName level3 nochild" href="/loja/23-revelador"><span>Revelador</span></a><a className="itemMenuName level3 nochild" href="/loja/24-toner"><span>Toner</span></a></div></div>
<div className="clearBoth"></div>
</div>
</div>
</div>
                    </div>
                </div>
                        </div> 
                    </div> 
                </div> 
                            {children}</header>
        </div>
    </>
  );
}
