import { empresa } from '@/dados/empresa';
import { IconeFacebook, IconeInstagram } from './Icones';

const ICONES = { Facebook: IconeFacebook, Instagram: IconeInstagram };

// Botões do Facebook e do Instagram da empresa.
export function BotoesRedes({ claro = false }) {
  return (
    <ul className={`redes${claro ? ' redes--claro' : ''}`}>
      {empresa.redes.map((r) => {
        const Icone = ICONES[r.nome];
        return (
          <li key={r.nome}>
            <a className={`redes__botao redes__botao--${r.nome.toLowerCase()}`} href={r.url} target="_blank" rel="noopener">
              <Icone />
              <span>{r.nome}</span>
              <span className="visualmente-oculto"> (abre em outra aba)</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
