// Logo da NF Soluções Digitais redesenhado em vetor a partir do arquivo original (LOGONFPQN.png, 50×59 px),
// com as mesmas cores: preto, petróleo #003a48 e ciano #11a0af.
export function MarcaNF({ className, titulo = 'NF Soluções Digitais' }) {
  return (
    <svg className={className} viewBox="0 0 50 38" role="img" aria-label={titulo}>
      <polygon points="0,0 26,0 26,19" fill="var(--logo-preto, #000)" />
      <polygon points="9,20 9,38 34,38" fill="#003a48" />
      <path fillRule="evenodd" fill="#11a0af" d="M35 8H50V38H35Z M35 23H46.2V15H47.4V24.2H35Z" />
    </svg>
  );
}

export default function Logo({ claro = false }) {
  return (
    <span className={`logo${claro ? ' logo--claro' : ''}`}>
      <MarcaNF className="logo__marca" titulo="" />
      <span className="logo__texto">
        <span className="visualmente-oculto">NF </span>Soluções
        <br />
        Digitais
      </span>
    </span>
  );
}
