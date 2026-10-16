'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Galeria({ fotos, nome }) {
  const [atual, setAtual] = useState(0);
  return (
    <div className="galeria">
      <div className="galeria__principal">
        <Image
          src={fotos[atual]}
          alt={`${nome}, foto ${atual + 1} de ${fotos.length}`}
          fill
          sizes="(max-width: 860px) 100vw, 560px"
          preload
        />
      </div>
      {fotos.length > 1 && (
        <ul className="galeria__miniaturas" aria-label="Outras fotos">
          {fotos.map((f, i) => (
            <li key={f}>
              <button
                type="button"
                className="galeria__miniatura"
                aria-current={i === atual}
                aria-label={`Ver foto ${i + 1}`}
                onClick={() => setAtual(i)}
              >
                <Image src={f} alt="" fill sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
