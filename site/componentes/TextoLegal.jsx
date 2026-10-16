// Peças para as páginas de Política de Privacidade e Termos de Uso.

// Mostra um dado jurídico; se ainda estiver "[A PREENCHER: ...]", aparece destacado.
export function Dado({ children }) {
  const pendente = typeof children === 'string' && children.startsWith('[A PREENCHER');
  return pendente ? <mark className="texto-legal__pendente">{children}</mark> : children;
}

export function Sumario({ secoes }) {
  return (
    <nav className="texto-legal__sumario" aria-label="Nesta página">
      <h2 className="texto-legal__sumario-titulo">Nesta página</h2>
      <ol>
        {secoes.map(([id, titulo]) => (
          <li key={id}><a href={`#${id}`}>{titulo}</a></li>
        ))}
      </ol>
    </nav>
  );
}

export function Secao({ id, titulo, children }) {
  return (
    <section id={id} className="texto-legal__secao" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>{titulo}</h2>
      {children}
    </section>
  );
}
