import PainelAdmin from '@/componentes/admin/PainelAdmin';

// O painel existe em todos os ambientes (também na vitrine): é por ele que a equipe cuida dos
// produtos e do estoque. As telas de clientes e pedidos só têm dados onde as contas estão ligadas.
export default function PaginaAdmin() {
  return <PainelAdmin />;
}
