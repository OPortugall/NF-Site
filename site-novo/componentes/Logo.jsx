// Logo da NF Soluções Digitais (versão nova, arquivo logo-NF.jpeg), redesenhado em vetor para ficar nítido
// em qualquer tamanho: triângulo amarelo, triângulo magenta e o "F" ciano, as tintas de impressão.
export function MarcaNF({ className, titulo = 'NF Soluções Digitais' }) {
  return (
    <svg className={className} viewBox="0 0 581 453" role="img" aria-label={titulo || undefined} aria-hidden={titulo ? undefined : true}>
      <polygon points="0,0 300,0 300,230" fill="#fff033" />
      <polygon points="105,232 105,453 405,453" fill="#f02a8c" />
      <path fill="#00ade6" d="M413 94H581V453H413V276H542V176H413Z" />
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

// O selo redondo original (fundo escuro), usado onde há espaço para ele ser lido.
export function SeloNF({ tamanho = 120 }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="selo-nf" src="/logo-nf.jpg" alt="NF Soluções Digitais" width={tamanho} height={tamanho} />
  );
}
