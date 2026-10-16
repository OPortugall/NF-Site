import { AMBIENTE } from '@/lib/ambiente';

// Aviso no topo das páginas fora da produção, para ninguém confundir o teste com o site real.
const TEXTOS = {
  teste: 'Ambiente de TESTE: dados fictícios, pedidos não são atendidos.',
  desenvolvimento: 'Ambiente de DESENVOLVIMENTO (computador local).',
};

export default function FaixaAmbiente() {
  const texto = TEXTOS[AMBIENTE];
  if (!texto) return null;
  return (
    <div className={`faixa-ambiente faixa-ambiente--${AMBIENTE}`} role="note">
      {texto}
    </div>
  );
}
