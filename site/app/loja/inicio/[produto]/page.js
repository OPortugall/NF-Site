import Link from 'next/link';
import { notFound } from 'next/navigation';
import CartaoProduto, { tituloProduto } from '@/componentes/CartaoProduto';
import { BotoesAdicionar } from '@/componentes/Carrinho';
import { CONTAS_ATIVAS } from '@/lib/ambiente';
import Galeria from '@/componentes/Galeria';
import Tinta from '@/componentes/Tinta';
import { empresa } from '@/dados/empresa';
import {
  TIPOS,
  linkWhatsApp,
  mensagemProduto,
  produtoAlugavel,
  produtoPorSlug,
  todosOsProdutos,
} from '@/lib/produtos';

// Endereço antigo da loja: /loja/inicio/15-mp5001.html
const slugDoParametro = (p) => decodeURIComponent(p).replace(/\.html$/, '');

export const dynamicParams = false;

export function generateStaticParams() {
  return todosOsProdutos().map((p) => ({ produto: `${p.slug}.html` }));
}

export async function generateMetadata({ params }) {
  const produto = produtoPorSlug(slugDoParametro((await params).produto));
  return produto ? { title: tituloProduto(produto), description: produto.resumo } : {};
}

function Descricao({ blocos }) {
  return blocos.map((b, i) => {
    if (b.tipo === 'titulo') return <h3 key={i} className="descricao__titulo">{b.texto}</h3>;
    if (b.tipo === 'lista')
      return (
        <ul key={i} className="descricao__lista">
          {b.itens.map((t, j) => <li key={j}>{t}</li>)}
        </ul>
      );
    if (b.tipo === 'specs')
      return (
        <dl key={i} className="specs">
          {b.linhas.map(([k, v], j) => (
            <div key={j} className="specs__linha"><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      );
    return <p key={i}>{b.texto}</p>;
  });
}

export default async function PaginaProduto({ params }) {
  const produto = produtoPorSlug(slugDoParametro((await params).produto));
  if (!produto) notFound();

  const titulo = tituloProduto(produto);
  const relacionados = todosOsProdutos()
    .filter((p) => p.tipo === produto.tipo && p.slug !== produto.slug)
    .slice(0, 4);

  return (
    <div className="conteudo pagina">
      <nav className="trilha" aria-label="Você está em">
        <ol>
          <li><Link href="/">Início</Link></li>
          <li><Link href="/loja">Equipamentos</Link></li>
          <li aria-current="page">{titulo}</li>
        </ol>
      </nav>

      <div className="produto">
        <Galeria fotos={produto.fotos} nome={titulo} />

        <div className="produto__info">
          <p className="produto__tipo">{TIPOS[produto.tipo]}</p>
          <h1 className="produto__titulo">{titulo}</h1>
          <p className="produto__resumo">{produto.resumo}</p>
          <div className="produto__etiquetas">
            <Tinta impressao={produto.impressao} />
            <span className="cartao__condicao">{produto.condicao === 'Novo' ? 'Novo' : 'Seminovo revisado'}</span>
          </div>
          <div className="produto__orcamento">
            <p className="produto__orcamento-titulo">Preço sob consulta</p>
            <p>Fale com a nossa equipe e receba o orçamento sem custo, com condições de pagamento e entrega.</p>
          </div>
          {CONTAS_ATIVAS && <BotoesAdicionar produto={produto} completo />}
          <div className="produto__acoes">
            <a className="botao botao--whatsapp botao--largo" href={linkWhatsApp(mensagemProduto(produto))}>
              Pedir orçamento pelo WhatsApp
            </a>
            {!CONTAS_ATIVAS && produtoAlugavel(produto) && (
              <p className="produto__locacao-aviso">
                Empresas também podem alugar este equipamento, com assistência técnica incluída.{' '}
                <a href={linkWhatsApp(`Olá! Gostaria de saber sobre a locação do ${produto.nome}.`)}>Consultar locação</a>
              </p>
            )}
            <p className="produto__ligar">
              Prefere falar por telefone? <a href={`tel:${empresa.telefones[0].numero}`}>Ligue {empresa.telefones[0].rotulo}</a>
            </p>
          </div>
        </div>
      </div>

      {produto.descricao.length > 0 && (
        <section className="descricao" aria-labelledby="titulo-descricao">
          <h2 id="titulo-descricao" className="secao__titulo">Descrição e especificações</h2>
          <div className="descricao__corpo">
            <Descricao blocos={produto.descricao} />
          </div>
        </section>
      )}

      {relacionados.length > 0 && (
        <section className="secao secao--colada" aria-labelledby="titulo-relacionados">
          <div className="secao__cabeca">
            <h2 id="titulo-relacionados" className="secao__titulo">Outros {TIPOS[produto.tipo].toLowerCase()}</h2>
          </div>
          <div className="grade-produtos">
            {relacionados.map((p) => <CartaoProduto key={p.slug} produto={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
