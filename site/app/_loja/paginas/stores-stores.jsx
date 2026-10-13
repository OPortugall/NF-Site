// Gerado por scripts/gerar_loja.py a partir de reconstrucao/loja/paginas/html-original/lojas-20250118.html
export default function PaginaStoresStores() {
  return (
    <>

                    <div className="columns-container">
            <div id="columns" className="container">
                <div className="row">
                                                            <div id="center_column" className="center_column col-xs-12 col-sm-12">
<div className="breadcrumb clearfix">
	<a className="home" href="/loja" title="Retornar a Home"><span>Home</span></a>
						<span className="navigation_page">Nossas lojas</span>
			</div>
<h1 className="page-heading">
	Nossas lojas
</h1>
	<div id="map"></div>
	<p className="store-title">
		<strong className="dark">
			Insira um local
		</strong>
	</p>
    <div className="store-content">
        <div className="address-input">
            <label htmlFor="addressInput">Seu local</label>
            <input className="form-control grey" type="text" name="location" id="addressInput" defaultValue="Endereço, CEP, Cidade, Estado ou País" />
        </div>
        <div className="radius-input">
            <label htmlFor="radiusSelect">Raio</label> 
            <select name="radius" id="radiusSelect" className="form-control">
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>
            <img src="/loja/img/loader.gif" className="middle" alt="" id="stores_loader" />
        </div>
        <div>
            <button name="search_locations" className="button btn btn-default button-small">
            	<span>
            		Pesquisar<i className="icon-chevron-right right"></i>
            	</span>
            </button>
        </div>
    </div>
    <div className="store-content-select selector3">
    	<select id="locationSelect" className="form-control">
    		<option>-</option>
    	</select>
    </div>
	<table id="stores-table" className="table table-bordered">
    	<thead>
			<tr>
                <th className="num">#</th>
                <th>Loja</th>
                <th>Endereço</th>
                <th>Distância</th>
            </tr>		
        </thead>
        <tbody>
        </tbody>
	</table>
					</div>
										</div>
				</div>
			</div>
                                                                        
    </>
  );
}
