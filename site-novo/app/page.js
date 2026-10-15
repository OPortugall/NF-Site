import Image from 'next/image';
import Link from 'next/link';
import CartaoProduto, { tituloProduto } from '@/componentes/CartaoProduto';
import { empresa, institucional, marcas, servicos } from '@/dados/empresa';
import { BotoesRedes } from '@/componentes/BotoesExternos';
import { linkWhatsApp, produtoPorSlug, todosOsProdutos } from '@/lib/produtos';

// Banner da abertura: uma coluna por linha de produtos, com a palavra exatamente acima da máquina.
// Cada coluna leva à loja já filtrada no seu setor ("tipo" = filtro da loja).
// "cor" é a tinta do arco de neon atrás da imagem (ciano, magenta, amarelo e preto, como na faixa do topo).
const VITRINE = [
  { rotulo: 'Copiadoras', produto: 'konica-minolta-bizhub-c361i', cor: 'ciano', tipo: 'impressoras-e-copiadoras' },
  { rotulo: 'Impressoras 3D', produto: 'anycubic-kobra-s1-v2-combo', cor: 'magenta', tipo: 'impressoras-3d' },
  { rotulo: 'Equipamentos Gráficos', produto: 'adgl-cc3348-titanium', cor: 'amarelo', tipo: 'acabamento' },
  {
    rotulo: 'Suprimentos',
    cor: 'preto',
    tipo: 'suprimentos',
    // Não é um produto: só ilustra a coluna. Foto oficial das garrafas Epson EcoTank T544.
    imagem: '/destaques/suprimentos-tintas-epson-t544.png',
    nome: 'Tintas e toners',
    resumo: 'Tintas, toners e peças para as principais marcas de impressoras e copiadoras',
  },
];

// Seleção de "Equipamentos em estoque", logo abaixo.
const DESTAQUES = ['18-mpc3502', '17-mp7500', '1-mpc2050', '16-spc430dn'];

export default function PaginaInicial() {
  const produtos = todosOsProdutos();
  const destaques = DESTAQUES.map(produtoPorSlug);
  const vitrine = VITRINE.map((v) => {
    const link = `/loja?tipo=${v.tipo}`;
    if (!v.produto) return { ...v, link, fundo: 'transparente' };
    const p = produtoPorSlug(v.produto);
    return {
      ...v,
      link,
      imagem: p.destaque?.imagem ?? p.fotos[0],
      fundo: p.destaque?.fundo ?? 'transparente',
      nome: tituloProduto(p),
      resumo: p.resumo,
    };
  });
  const nomesMarcas = marcas.map((m) => m.nome);

  return (
    <>
      {/* Banner de ponta a ponta da tela, no topo da página: degradê como o folheto da ADGL e o rodapé.
          Cada coluna tem a sua palavra (h2) exatamente acima da máquina. O <h1> da página é lido pelo Google
          e por leitores de tela, mas não aparece, porque as quatro palavras já dizem o mesmo na tela. */}
      <section className="vitrine" aria-labelledby="titulo-principal">
        <div className="conteudo">
          <h1 id="titulo-principal" className="visualmente-oculto">
            NF Soluções Digitais: copiadoras, impressoras 3D, equipamentos gráficos e suprimentos
          </h1>
          <ul className="vitrine__lista">
            {vitrine.map((v) => (
              <li key={v.rotulo} className={`vitrine__item vitrine__item--${v.cor}`}>
                <h2 className="vitrine__rotulo">{v.rotulo}</h2>
                <div className={`vitrine__foto vitrine__foto--${v.fundo}`}>
                  <Image src={v.imagem} alt="" fill sizes="(max-width: 900px) 50vw, 300px" preload />
                </div>
                <div className="vitrine__texto">
                  <Link href={v.link} className="vitrine__link" aria-label={`${v.rotulo}: ver na loja`}>{v.nome}</Link>
                  <span className="vitrine__resumo">{v.resumo}</span>
                  <span className="vitrine__ver" aria-hidden="true">Ver {v.rotulo.toLowerCase()}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
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

      <div className="faixa-marcas">
        <p className="conteudo">
          Trabalhamos com {nomesMarcas.slice(0, -1).join(', ')} e {nomesMarcas.at(-1)}.
        </p>
      </div>

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

      <section id="servicos" className="secao secao--escura" aria-labelledby="titulo-servicos">
        <div className="conteudo servicos">
          <div className="servicos__intro">
            <h2 id="titulo-servicos" className="secao__titulo">O que fazemos</h2>
            <p>
              Analisamos como sua empresa imprime, copia e digitaliza para indicar a solução que custa menos no dia a dia,
              seja comprando, alugando ou mantendo os equipamentos que você já tem.
            </p>
          </div>
          <dl className="servicos__lista">
            {servicos.map((s) => (
              <div key={s.id} className="servicos__item">
                <dt>{s.titulo}</dt>
                <dd>{s.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

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
          <div className="contato__info">
            <h2 id="titulo-contato" className="secao__titulo">Fale com a gente</h2>
            <p>Orçamento sem custo. Respondemos pelo WhatsApp em horário comercial.</p>
            <a className="botao botao--whatsapp" href={linkWhatsApp('Olá! Vim pelo site.')}>
              Conversar pelo WhatsApp
            </a>
            <div className="contato__redes">
              <p>Siga a NF nas redes sociais</p>
              <BotoesRedes />
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
                <dt>Endereço</dt>
                <dd>
                  {empresa.endereco.linha1}, {empresa.endereco.linha2}<br />
                  {empresa.endereco.cidade}, CEP {empresa.endereco.cep}
                </dd>
              </div>
              <div>
                <dt>Horário</dt>
                <dd>{empresa.horario}</dd>
              </div>
            </dl>
          </div>
          <div className="contato__mapa">
            <iframe src={empresa.endereco.mapa} title="Mapa: localização da NF Soluções Digitais" loading="lazy" />
          </div>
        </div>
      </section>
    </>
  );
}
