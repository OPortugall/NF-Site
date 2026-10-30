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
  admin_criado_terminal: 'Administrador criado pelo Terminal do servidor',
  cliente_criar: 'Criou o cliente',
  cliente_editar: 'Editou o cliente',
  cliente_excluir: 'Excluiu o cliente',
  cliente_ativar: 'Reativou o cliente',
  cliente_inativar: 'Inativou o cliente',
  cliente_marcar_atraso: 'Marcou pagamento em atraso',
  cliente_marcar_em_dia: 'Marcou pagamento em dia',
  cliente_aviso_atraso: 'Enviou aviso de pagamento pendente',
  clientes_exportar: 'Exportou a planilha de clientes',
  cliente_autoexcluir: 'O cliente excluiu a própria conta',
  cliente_nova_senha: 'O cliente criou uma nova senha pelo link do e-mail',
  orcamento_status: 'Mudou a situação do pedido',
  orcamento_notas: 'Editou as anotações do pedido',
  orcamento_cancelado_cliente: 'O cliente cancelou o pedido pelo site',
  produto_criar: 'Cadastrou o produto',
  produto_editar: 'Editou o produto',
  produto_duplicar: 'Duplicou o produto',
  produto_excluir: 'Excluiu o produto',
  produto_estoque: 'Mudou o estoque',
  produto_foto_enviar: 'Enviou uma foto',
  produto_foto_excluir: 'Apagou uma foto',
  produto_fotos_ordem: 'Mudou a ordem das fotos',
  produtos_importar: 'Importou os produtos do site',
  site_publicar: 'Pediu a publicação do site',
};

// Situação dos pedidos de orçamento (o cliente vê nomes parecidos em "Minha conta")
export const SITUACOES_ORCAMENTO = {
  novo: 'Novo',
  em_atendimento: 'Em atendimento',
  enviado: 'Orçamento enviado',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  cancelado: 'Cancelado',
};
export const ETIQUETA_ORCAMENTO = {
  novo: 'adm-etiqueta--alerta', em_atendimento: 'adm-etiqueta--y', enviado: 'adm-etiqueta--c',
  aprovado: 'adm-etiqueta--ok', recusado: 'adm-etiqueta--cinza', cancelado: 'adm-etiqueta--cinza',
};

export const CATEGORIAS = {
  multifuncionais: 'Multifuncionais e copiadoras',
  impressoras: 'Impressoras',
  'impressoras-3d': 'Impressoras 3D',
  acabamento: 'Plotters de recorte e vinco',
  suprimentos: 'Suprimentos',
  scooter: 'Scooters',
};

export const CAMPOS = {
  primeiro_nome: 'nome', sobrenome: 'sobrenome', tipo_pessoa: 'tipo', documento: 'CPF/CNPJ', razao_social: 'razão social',
  nome_fantasia: 'nome fantasia', email: 'e-mail', telefone: 'telefone', senha: 'senha',
  'endereco.cep': 'CEP', 'endereco.rua': 'rua', 'endereco.numero': 'número', 'endereco.complemento': 'complemento',
  'endereco.bairro': 'bairro', 'endereco.cidade': 'cidade', 'endereco.uf': 'UF',
  slug: 'endereço', marca: 'marca', modelo: 'modelo', nome: 'nome', categoria: 'categoria', impressao: 'impressão',
  condicao: 'condição', resumo: 'resumo', descricao: 'descrição', disponivel_venda: 'venda', disponivel_locacao: 'locação',
  estoque: 'estoque', estoque_minimo: 'estoque mínimo', preco_referencia_centavos: 'preço de referência', status: 'visibilidade',
  destaque: 'destaque', ordem: 'ordem',
};

export function descreverDetalhes(acao, detalhes) {
  if (!detalhes) return '';
  if (Array.isArray(detalhes.campos)) return `Campos: ${detalhes.campos.map((c) => CAMPOS[c] || c).join(', ')}`;
  if ('enviado' in detalhes) return detalhes.enviado ? 'E-mail enviado' : 'Falha no envio do e-mail';
  if (acao === 'orcamento_status') return `${SITUACOES_ORCAMENTO[detalhes.de] || detalhes.de} → ${SITUACOES_ORCAMENTO[detalhes.para] || detalhes.para}`;
  if (acao === 'produto_estoque') return `${detalhes.de} → ${detalhes.para} unidade(s)${detalhes.minimo ? `, mínimo ${detalhes.minimo}` : ''}`;
  if (acao === 'produtos_importar') return `${detalhes.quantidade} produto(s)`;
  if (acao === 'site_publicar') return `Ramo ${detalhes.ramo}`;
  if (detalhes.slug) return detalhes.nome ? `${detalhes.nome} (${detalhes.slug})` : detalhes.slug;
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
