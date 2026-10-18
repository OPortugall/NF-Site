// Formatação e textos usados pelas telas do painel.
import { mascaraCnpj, mascaraCpf, mascaraTelefone, mascaraCep } from '@/lib/documentos';

export const documento = (c) => (c.tipo === 'cnpj' ? mascaraCnpj(c.documento) : mascaraCpf(c.documento));
export const telefone = (t) => mascaraTelefone(t || '');
export const cep = (c) => mascaraCep(c || '');

// "2026-10-17 19:30:12" (horário do servidor) → "17/10/2026 19:30"
export function dataHora(texto) {
  if (!texto) return '—';
  const m = String(texto).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : texto;
}
export const data = (texto) => dataHora(texto).slice(0, 10);

export const ACOES = {
  admin_entrar: 'Entrou no painel',
  admin_sair: 'Saiu do painel',
  admin_autenticador_configurado: 'Ativou a verificação em duas etapas',
  cliente_criar: 'Criou o cliente',
  cliente_editar: 'Editou o cliente',
  cliente_excluir: 'Excluiu o cliente',
  cliente_ativar: 'Reativou o cliente',
  cliente_inativar: 'Inativou o cliente',
  cliente_marcar_atraso: 'Marcou pagamento em atraso',
  cliente_marcar_em_dia: 'Marcou pagamento em dia',
  cliente_aviso_atraso: 'Enviou aviso de pagamento pendente',
  clientes_exportar: 'Exportou a planilha de clientes',
};

export const CAMPOS = {
  primeiro_nome: 'nome', sobrenome: 'sobrenome', tipo_pessoa: 'tipo', documento: 'CPF/CNPJ', razao_social: 'razão social',
  nome_fantasia: 'nome fantasia', email: 'e-mail', telefone: 'telefone', senha: 'senha',
  'endereco.cep': 'CEP', 'endereco.rua': 'rua', 'endereco.numero': 'número', 'endereco.complemento': 'complemento',
  'endereco.bairro': 'bairro', 'endereco.cidade': 'cidade', 'endereco.uf': 'UF',
};

export function descreverDetalhes(acao, detalhes) {
  if (!detalhes) return '';
  if (Array.isArray(detalhes.campos)) return `Campos: ${detalhes.campos.map((c) => CAMPOS[c] || c).join(', ')}`;
  if ('enviado' in detalhes) return detalhes.enviado ? 'E-mail enviado' : 'Falha no envio do e-mail';
  if ('quantidade' in detalhes) return `${detalhes.quantidade} cliente(s)`;
  return '';
}

export function Paginacao({ total, pagina, porPagina, aoMudar }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginas <= 1) return null;
  return (
    <nav className="adm-paginacao" aria-label="Páginas">
      <button type="button" className="adm-botao adm-botao--fantasma" disabled={pagina <= 1} onClick={() => aoMudar(pagina - 1)}>← Anterior</button>
      <span>Página {pagina} de {paginas}</span>
      <button type="button" className="adm-botao adm-botao--fantasma" disabled={pagina >= paginas} onClick={() => aoMudar(pagina + 1)}>Próxima →</button>
    </nav>
  );
}
