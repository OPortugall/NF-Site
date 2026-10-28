import Image from 'next/image';
import Carrossel from '@/componentes/Carrossel';
import Link from 'next/link';
import CartaoProduto from '@/componentes/CartaoProduto';
import { empresa, institucional, locacao, marcas, servicos } from '@/dados/empresa';
import { BotoesRedes } from '@/componentes/BotoesExternos';
import { linkWhatsApp, produtosEmDestaque, todosOsProdutos } from '@/lib/produtos';

// Carrossel da abertura: um slide por linha de produtos, cada um leva à loja filtrada no seu setor.
// "cor" é a tinta do slide (ciano, magenta, amarelo e preto, como na faixa do topo).
// Textos curtos e só com o que a NF vende hoje. Fotos: recortes sem fundo, montados como vitrine sobre o degradê.
// "pos" = [esquerda, topo, largura, altura] em % do palco (5:4); a ordem da lista é a ordem de cima (última na frente).
// Apoiam numa mesma linha de chão (topo + altura ≈ 98), ou em degraus quando a de trás fica mais alta (impressoras 3D).
// "principal" = foto maior, pede a versão de mais resolução. "marcas" (opcional) aparece em linha abaixo da frase.
const SLIDES = [
  {
    rotulo: 'Copiadoras', botao: 'Ver copiadoras', cor: 'ciano', selo: 'Venda e locação', link: '/loja?tipo=impressoras-e-copiadoras',
    imagens: [
      { src: '/destaques/carrossel/konica-bizhub.png', alt: 'Copiadora Konica Minolta bizhub', pos: [0, 4, 70, 76], principal: true },
      { src: '/destaques/carrossel/hp-laserjet.png', alt: 'Multifuncional HP LaserJet', pos: [56, 30, 44, 46] },
      { src: '/destaques/carrossel/epson-workforce.png', alt: 'Multifuncional Epson WorkForce', pos: [32, 58, 40, 40] },
    ],
    frase: 'Multifuncionais e copiadoras para o dia a dia da sua empresa.',
    pontos: ['Novas e seminovas revisadas', 'Locação com assistência técnica incluída', 'Das principais marcas do mercado'],
  },
  {
    rotulo: 'Impressoras 3D', botao: 'Ver impressoras 3D', cor: 'magenta', selo: 'Impressão 3D', link: '/loja?tipo=impressoras-3d',
    imagens: [
      { src: '/destaques/carrossel/anycubic-kobra-s1.png', alt: 'Impressora 3D Anycubic Kobra S1 Combo', pos: [0, 0, 50, 88], principal: true },
      { src: '/destaques/carrossel/bambu-lab-a1.png', alt: 'Impressora 3D Bambu Lab A1', pos: [50, 16, 50, 72] },
      { src: '/destaques/carrossel/bambu-lab-a1-mini.png', alt: 'Impressora 3D Bambu Lab A1 Mini', pos: [30, 44, 38, 54] },
    ],
    frase: 'Impressoras 3D e filamentos para tirar seus projetos do papel.',
    marcas: ['Anycubic', 'Bambu Lab'],
    pontos: ['Impressoras 3D fechadas e abertas', 'Filamentos para impressão 3D', 'Orçamento sem custo'],
  },
  {
    rotulo: 'Equipamentos gráficos', botao: 'Ver equipamentos gráficos', cor: 'amarelo', selo: 'Comunicação visual', link: '/loja?tipo=acabamento',
    imagens: [
      { src: '/destaques/carrossel/adgl-plotter-aberta.png', alt: 'Plotter de recorte ADGL com a tampa aberta', pos: [42, 0, 58, 64] },
      { src: '/destaques/carrossel/adgl-plotter-frente.png', alt: 'Plotter de recorte ADGL vista de frente', pos: [0, 22, 54, 42] },
      { src: '/destaques/carrossel/adgl-pl1300.png', alt: 'Plotter de recorte ADGL PL1300', pos: [12, 40, 76, 58], principal: true },
    ],
    frase: 'Plotters de recorte para gráficas e comunicação visual.',
    pontos: ['Plotters de recorte ADGL', 'Equipamentos novos', 'Orçamento sem custo'],
  },
  {
    rotulo: 'Suprimentos', botao: 'Ver suprimentos', cor: 'preto', selo: 'Para impressoras e copiadoras', link: '/loja?tipo=suprimentos',
    imagens: [
      { src: '/destaques/carrossel/filamentos-e-impressora-3d.png', alt: 'Filamentos para impressão 3D e peças impressas', pos: [26, 0, 74, 48] },
      { src: '/destaques/carrossel/toners-cmyk.png', alt: 'Cartuchos de toner ciano, magenta, amarelo e preto', pos: [14, 30, 86, 68], principal: true },
      { src: '/destaques/carrossel/tintas-corante-nf.png', alt: 'Tintas corante NF Soluções Digitais: ciano, preto, amarelo e magenta', pos: [0, 56, 36, 42] },
    ],
    frase: 'Tintas, toners e filamentos para as principais marcas de impressoras e copiadoras.',
    pontos: ['Toners para copiadoras e impressoras', 'Tintas para impressoras Epson', 'Filamentos para impressão 3D'],
  },
];

export default function PaginaInicial() {
  const produtos = todosOsProdutos();
  // "Equipamentos em estoque": os produtos marcados como destaque no painel (até 8)
  const destaques = produtosEmDestaque().slice(0, 8);
  const nomesMarcas = marcas.map((m) => m.nome);

  return (
    <>
      {/* Banner de ponta a ponta da tela, no topo da página: degradê como o folheto da ADGL e o rodapé.
          Cada coluna tem a sua palavra (h2) exatamente acima da máquina. O <h1> da página é lido pelo Google
          e por leitores de tela, mas não aparece, porque as quatro palavras já dizem o mesmo na tela. */}
      <section className="vitrine" aria-labelledby="titulo-principal">
        <h1 id="titulo-principal" className="visualmente-oculto">
          NF Soluções Digitais: copiadoras, impressoras 3D, equipamentos gráficos e suprimentos
        </h1>
        <Carrossel slides={SLIDES} />
      </section>

      <section className="abertura">
        <div className="conteudo abertura__grade">
          <div className="abertura__texto">
            <p className="abertura__lead">
              Venda, locação e assistência técnica em São José dos Campos e região desde {empresa.fundacao}.
            </p>
            <div className="abertura__acoes">
              <a className="botao botao--whatsapp" href={linkWhatsApp('Olá! Gostaria de um orçamento.')}>
                Pedir orçamento pelo WhatsApp
              </a>
              <Link className="botao botao--secundario" href="/loja">Ver equipamentos</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="servicos" className="secao secao--escura servicos-secao" aria-labelledby="titulo-servicos">
        <div className="conteudo">
          <div className="servicos__intro">
            <h2 id="titulo-servicos" className="secao__titulo">O que fazemos</h2>
            <p>
              Analisamos como sua empresa imprime, copia e digitaliza para indicar a solução que custa menos no dia a dia,
              seja comprando, alugando ou mantendo os equipamentos que você já tem.
            </p>
          </div>
          <dl className="servicos__lista">
            {servicos.map((s) => (
              <div key={s.id} className={`servicos__item servicos__item--${s.id}`}>
                <dt>{s.titulo}</dt>
                <dd>{s.texto}</dd>
              </div>
            ))}
          </dl>

          <div id="locacao" className="locacao">
            <div className="locacao__texto">
              <p className="locacao__selo">Para empresas</p>
              <h3 id="titulo-locacao" className="locacao__titulo">{locacao.titulo}</h3>
              <p>{locacao.texto}</p>
              <ul className="locacao__vantagens">
                {locacao.vantagens.map((v) => <li key={v}>{v}</li>)}
              </ul>
            </div>
            <div className="locacao__como">
              <h4>Como funciona</h4>
              <ol>
                {locacao.passos.map((p) => <li key={p}>{p}</li>)}
              </ol>
              <a className="botao botao--whatsapp botao--largo" href={linkWhatsApp('Olá! Gostaria de um orçamento de locação para a minha empresa.')}>
                Pedir orçamento de locação
              </a>
              <p className="locacao__nota">{locacao.publico}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="faixa-marcas">
        <p className="conteudo">
          Trabalhamos com {nomesMarcas.slice(0, -1).join(', ')} e {nomesMarcas.at(-1)}.
        </p>
      </div>

      {destaques.length > 0 && (
      <section className="secao" aria-labelledby="titulo-destaques">
        <div className="conteudo">
          <div className="secao__cabeca">
            <h2 id="titulo-destaques" className="secao__titulo">Equipamentos em estoque</h2>
            <Link className="link-forte" href="/loja">Ver todos os {produtos.length} produtos</Link>
          </div>
          <div className="grade-produtos">
            {destaques.map((p) => (
              <CartaoProduto key={p.slug} produto={p} />
            ))}
          </div>
        </div>
      </section>
      )}

      <section id="marcas" className="secao" aria-labelledby="titulo-marcas">
        <div className="conteudo">
          <div className="secao__cabeca">
            <h2 id="titulo-marcas" className="secao__titulo">Marcas que vendemos e atendemos</h2>
          </div>
          <ul className="marcas">
            {marcas.map((m) => (
              <li key={m.nome} className="marcas__item">
                <Image src={m.logo} alt={m.nome} width={369} height={164} sizes="120px" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="empresa" className="secao secao--papel" aria-labelledby="titulo-empresa">
        <div className="conteudo empresa">
          <div>
            <h2 id="titulo-empresa" className="secao__titulo">A NF Soluções Digitais</h2>
            <p className="empresa__resumo">{institucional.resumo}</p>
          </div>
          <dl className="empresa__pilares">
            <div><dt>Missão</dt><dd>{institucional.missao}</dd></div>
            <div><dt>Visão</dt><dd>{institucional.visao}</dd></div>
            <div><dt>Valores</dt><dd>{institucional.valores}</dd></div>
          </dl>
        </div>
      </section>

      <section id="contato" className="secao" aria-labelledby="titulo-contato">
        <div className="conteudo contato">
          <div className="contato__cabeca">
            <div>
              <h2 id="titulo-contato" className="secao__titulo">Fale com a gente</h2>
              <p>Orçamento sem custo. Respondemos pelo WhatsApp em horário comercial.</p>
            </div>
            <a className="botao botao--whatsapp" href={linkWhatsApp('Olá! Vim pelo site.')}>
              Conversar pelo WhatsApp
            </a>
          </div>

          <dl className="contato__dados">
            <div>
              <dt>Telefones</dt>
              <dd>
                {empresa.telefones.map((t) => (
                  <a key={t.numero} href={`tel:${t.numero}`}>{t.rotulo}</a>
                ))}
              </dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd><a href={`mailto:${empresa.email}`}>{empresa.email}</a></dd>
            </div>
            <div>
              <dt>Horário</dt>
              <dd>{empresa.horario}</dd>
            </div>
          </dl>

          <div className="contato__local">
            <div className="contato__endereco">
              <h3>Endereço</h3>
              <p>
                {empresa.endereco.linha1}<br />
                {empresa.endereco.linha2}<br />
                {empresa.endereco.cidade}, CEP {empresa.endereco.cep}
              </p>
              <div className="contato__redes">
                <p>Siga a NF nas redes sociais</p>
                <BotoesRedes />
              </div>
            </div>
            <div className="contato__mapa">
              <iframe src={empresa.endereco.mapa} title="Mapa: localização da NF Soluções Digitais" loading="lazy" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
