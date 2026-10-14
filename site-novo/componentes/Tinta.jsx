// Indicador de impressão no estilo da barra de registro das gráficas:
// colorida = as quatro tintas (CMYK); preto e branco = só o preto (K).
import { IMPRESSAO } from '@/lib/produtos';

const CORES = ['c', 'm', 'y', 'k'];

export default function Tinta({ impressao }) {
  const tintas = impressao === 'colorida' ? CORES : ['k'];
  return (
    <span className="tinta">
      <span className="tinta__blocos" aria-hidden="true">
        {tintas.map((c) => (
          <span key={c} className={`tinta__bloco tinta__bloco--${c}`} />
        ))}
      </span>
      {IMPRESSAO[impressao]}
    </span>
  );
}

// Faixa de registro no topo do site: as quatro tintas, como na borda de uma folha impressa.
export function FaixaRegistro() {
  return (
    <div className="faixa-registro" aria-hidden="true">
      {CORES.map((c) => (
        <span key={c} className={`faixa-registro__cor faixa-registro__cor--${c}`} />
      ))}
    </div>
  );
}
