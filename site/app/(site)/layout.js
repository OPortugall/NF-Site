import { estilos, titulo, favicon } from './estilos-legados';

export const metadata = {
  title: titulo,
  description: 'NF Soluções Digitais — venda, locação e assistência técnica de impressoras e multifuncionais.',
  icons: favicon ? { icon: favicon } : undefined,
};

export default function LayoutSitePrincipal({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {estilos.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
