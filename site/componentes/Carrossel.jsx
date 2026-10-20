'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * Banner da página inicial: um slide por linha de produtos (copiadoras, impressoras 3D, equipamentos
 * gráficos e suprimentos). Passa sozinho a cada 7 segundos; para quando o mouse ou o foco do teclado está
 * nele, quando a aba fica escondida ou quando a pessoa pede menos movimento no sistema (acessibilidade).
 * Setas, bolinhas e teclado (← →) trocam o slide. Setas e bolinhas ficam juntas no centro, embaixo, longe
 * dos botões flutuantes do canto direito.
 */

const INTERVALO = 7000;

export default function Carrossel({ slides }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [semMovimento, setSemMovimento] = useState(false);
  const raiz = useRef(null);
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
    if (pausado || semMovimento) return undefined;
    const t = setInterval(() => {
      if (!document.hidden) setAtual((a) => (a + 1) % total);
    }, INTERVALO);
    return () => clearInterval(t);
  }, [pausado, semMovimento, total]);

  const teclado = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(atual + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); ir(atual - 1); }
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
      <div className="carrossel__trilho" style={{ transform: `translateX(-${atual * 100}%)` }}>
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

      <div className="carrossel__controles">
        <button type="button" className="carrossel__seta" onClick={() => ir(atual - 1)} aria-label="Slide anterior">‹</button>
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
        <button type="button" className="carrossel__seta" onClick={() => ir(atual + 1)} aria-label="Próximo slide">›</button>
      </div>
    </div>
  );
}
