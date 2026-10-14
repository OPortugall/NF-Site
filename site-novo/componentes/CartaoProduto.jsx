import Image from 'next/image';
import Link from 'next/link';
import { formatarPreco, urlProduto } from '@/lib/produtos';
import Tinta from './Tinta';

// "MPC3502" -> "MP C3502"; "SPC430DN" -> "SP C430DN"; "MP5001" -> "MP 5001"
export function formatarModelo(modelo) {
  return modelo.replace(/^(MP|SP)(C?)(\d)/, (_, linha, c, d) => `${linha} ${c}${d}`);
}

export function tituloProduto(produto) {
  return produto.modelo ? `${produto.marca} ${formatarModelo(produto.modelo)}` : produto.nome;
}

export default function CartaoProduto({ produto, preload = false }) {
  const novo = produto.condicao === 'Novo';
  return (
    <article className="cartao">
      <div className="cartao__foto">
        <Image
          src={produto.fotos[0]}
          alt=""
          fill
          sizes="(max-width: 720px) 50vw, (max-width: 1040px) 33vw, 280px"
          preload={preload}
        />
      </div>
      <div className="cartao__corpo">
        <h3 className="cartao__titulo">
          <Link href={urlProduto(produto)} className="cartao__link">
            {produto.modelo ? (
              <>
                <span className="cartao__marca">{produto.marca}</span>
                <span className="cartao__modelo">{formatarModelo(produto.modelo)}</span>
              </>
            ) : (
              <span className="cartao__modelo cartao__modelo--longo">{produto.nome}</span>
            )}
          </Link>
        </h3>
        <p className="cartao__resumo">{produto.resumo}</p>
        <div className="cartao__rodape">
          <Tinta impressao={produto.impressao} />
          <span className="cartao__condicao">{novo ? 'Novo' : 'Seminovo'}</span>
        </div>
        <p className="cartao__preco">{formatarPreco(produto.precoCentavos)}</p>
      </div>
    </article>
  );
}
