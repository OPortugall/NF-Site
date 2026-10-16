import Image from 'next/image';
import Link from 'next/link';
import { TIPOS, formatarModelo, tituloProduto, urlProduto } from '@/lib/produtos';
import { BotoesAdicionar } from './Carrinho';
import { CONTAS_ATIVAS } from '@/lib/ambiente';
import Tinta from './Tinta';

export { formatarModelo, tituloProduto };

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
          {produto.impressao ? <Tinta impressao={produto.impressao} /> : <span className="tinta">{TIPOS[produto.tipo]}</span>}
          <span className="cartao__condicao">{novo ? 'Novo' : 'Seminovo'}</span>
        </div>
        {CONTAS_ATIVAS ? (
          <BotoesAdicionar produto={produto} />
        ) : (
          <span className="cartao__orcamento">Ver detalhes e pedir orçamento</span>
        )}
      </div>
    </article>
  );
}
