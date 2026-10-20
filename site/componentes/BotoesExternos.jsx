import { empresa } from '@/dados/empresa';
import { IconeFacebook, IconeInstagram, IconeTikTok } from './Icones';

export const ICONES_REDES = { Facebook: IconeFacebook, Instagram: IconeInstagram, TikTok: IconeTikTok };

// Botões das redes sociais da empresa (Facebook, Instagram e TikTok).
export function BotoesRedes({ claro = false }) {
  return (
    <ul className={`redes${claro ? ' redes--claro' : ''}`}>
      {empresa.redes.map((r) => {
        const Icone = ICONES_REDES[r.nome];
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
