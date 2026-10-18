import { notFound } from 'next/navigation';
import PainelAdmin from '@/componentes/admin/PainelAdmin';
import { CONTAS_ATIVAS } from '@/lib/ambiente';

export default function PaginaAdmin() {
  if (!CONTAS_ATIVAS) notFound(); // o painel só existe onde as contas estão ligadas (há API)
  return <PainelAdmin />;
}
