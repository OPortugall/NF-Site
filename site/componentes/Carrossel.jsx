'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * Banner da página inicial: um slide por linha de produtos (copiadoras, impressoras 3D, equipamentos
 * gráficos e suprimentos). Passa sozinho a cada 7 segundos; para quando o mouse ou o foco do teclado está
 * nele, quando a aba fica escondida ou quando a pessoa pede menos movimento no sistema (acessibilidade).
 * Setas, bolinhas e teclado (← →) trocam o slide. As setas ficam nas laterais, na altura do meio do banner e
 * recuadas para dentro, longe dos botões flutuantes do canto direito; as bolinhas ficam no centro, embaixo.
 * Na tela de toque dá para arrastar o banner para o lado (no celular as setas somem).
 */

const INTERVALO = 7000;
// arrasto mínimo para trocar de slide: 20% da largura, ou um gesto rápido de pelo menos 30px
const ARRASTO_MINIMO = 0.2;
const GESTO_RAPIDO = { px: 30, pxPorMs: 0.4 };

export default function Carrossel({ slides }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [semMovimento, setSemMovimento] = useState(false);
  const [deslocamento, setDeslocamento] = useState(null); // px arrastados com o dedo; null = sem arrasto
  const raiz = useRef(null);
  const arraste = useRef(null);
  const ignorarClique = useRef(false);
  const total = slides.length;

  const ir = useCallback((i) => setAtual(((i % total) + total) % total), [total]);

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSemMovimento(m.matches);
    const mudou = (e) => setSemMovimento(e.matches);
    m.addEventListener('change', mudou);
    return () => m.removeEventListener('change', mudou);
  }, []);

  useEffect(() => {
    // recomeça a contar a cada troca de slide, para não pular logo depois de a pessoa passar um
    if (pausado || semMovimento || deslocamento !== null) return undefined;
    const t = setInterval(() => {
      if (!document.hidden) setAtual((a) => (a + 1) % total);
    }, INTERVALO);
    return () => clearInterval(t);
  }, [pausado, semMovimento, deslocamento, total, atual]);

  const teclado = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(atual + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); ir(atual - 1); }
  };

  // Arrastar só no toque (o mouse usa as setas). O trilho tem touch-action: pan-y, então a rolagem vertical
  // da página continua com o navegador e o gesto na horizontal fica com o carrossel.
  const tocou = (e) => {
    ignorarClique.current = false; // nem todo navegador dispara o clique depois de um arrasto
    if (e.pointerType === 'mouse') return;
    arraste.current = { x: e.clientX, y: e.clientY, inicio: e.timeStamp, horizontal: false };
  };

  const moveu = (e) => {
    const a = arraste.current;
    if (!a) return;
    const dx = e.clientX - a.x;
    if (!a.horizontal) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - a.y)) return;
      a.horizontal = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setDeslocamento(dx);
  };

  const soltou = (e) => {
    const a = arraste.current;
    arraste.current = null;
    if (!a?.horizontal) return;
    const dx = e.clientX - a.x;
    const rapido = Math.abs(dx) >= GESTO_RAPIDO.px && Math.abs(dx) / (e.timeStamp - a.inicio) >= GESTO_RAPIDO.pxPorMs;
    if (rapido || Math.abs(dx) >= e.currentTarget.offsetWidth * ARRASTO_MINIMO) ir(atual + (dx < 0 ? 1 : -1));
    setDeslocamento(null);
    ignorarClique.current = true; // o dedo pode ter saído em cima do botão do slide
  };

  const cancelou = () => {
    arraste.current = null;
    setDeslocamento(null);
  };

  return (
    <div
      ref={raiz}
      className="carrossel"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Nossas linhas de produtos"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={(e) => { if (!raiz.current?.contains(e.relatedTarget)) setPausado(false); }}
      onKeyDown={teclado}
    >
      <div
        className={`carrossel__trilho${deslocamento !== null ? ' carrossel__trilho--arrastando' : ''}`}
        style={{ transform: `translateX(calc(${-atual * 100}% + ${deslocamento ?? 0}px))` }}
        onPointerDown={tocou}
        onPointerMove={moveu}
        onPointerUp={soltou}
        onPointerCancel={cancelou}
        onClickCapture={(e) => {
          if (!ignorarClique.current) return;
          ignorarClique.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {slides.map((s, i) => (
          <div
            key={s.rotulo}
            className={`carrossel__slide carrossel__slide--${s.cor}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${total}: ${s.rotulo}`}
            aria-hidden={i !== atual}
            inert={i !== atual ? true : undefined}
          >
            <div className="conteudo carrossel__miolo">
              <div className="carrossel__texto">
                <p className="carrossel__selo">{s.selo}</p>
                <h2 className="carrossel__titulo">{s.rotulo}</h2>
                <p className="carrossel__frase">{s.frase}</p>
                <ul className="carrossel__pontos">
                  {s.pontos.map((p) => <li key={p}>{p}</li>)}
                </ul>
                <Link href={s.link} className="botao carrossel__botao">
                  {s.botao} <span aria-hidden="true">›</span>
                </Link>
              </div>
              <div className="carrossel__palco">
                {s.imagens.map((im) => {
                  const [x, y, l, a] = im.pos;
                  return (
                    <div key={im.src} className="carrossel__foto" style={{ left: `${x}%`, top: `${y}%`, width: `${l}%`, height: `${a}%` }}>
                      <Image src={im.src} alt={im.alt} fill sizes={im.principal ? '(max-width: 860px) 85vw, 560px' : '(max-width: 860px) 45vw, 320px'} preload={i === 0 && im.principal} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="carrossel__seta carrossel__seta--anterior" onClick={() => ir(atual - 1)} aria-label="Slide anterior">‹</button>
      <button type="button" className="carrossel__seta carrossel__seta--proxima" onClick={() => ir(atual + 1)} aria-label="Próximo slide">›</button>

      <div className="carrossel__bolinhas">
        {slides.map((s, i) => (
          <button
            key={s.rotulo}
            type="button"
            className={`carrossel__bolinha carrossel__bolinha--${s.cor}`}
            aria-label={`Mostrar ${s.rotulo}`}
            aria-current={i === atual ? 'true' : undefined}
            onClick={() => ir(i)}
          />
        ))}
      </div>
    </div>
  );
}
