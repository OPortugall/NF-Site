import './admin.css';

// Painel administrativo: fora da busca do Google e sem a moldura da loja.
export const metadata = {
  title: { default: 'Painel', template: '%s | Painel NF' },
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }) {
  return children;
}
