// Dados de contato e conteúdo institucional da NF Soluções Digitais.
// Fonte: site e loja antigos (capturas de 2024–2025 no Wayback Machine).

export const empresa = {
  nome: 'NF Soluções Digitais',
  fundacao: 2010,
  telefones: [
    { rotulo: '(12) 3029-3838', numero: '+551230293838' },
    { rotulo: '(12) 3322-0345', numero: '+551233220345' },
  ],
  whatsapp: { rotulo: '(12) 97405-2176', numero: '5512974052176' },
  email: 'contato@nfsolucoesdigitais.com.br',
  // O site antigo (2024) e a loja antiga mostravam endereços diferentes; aqui está o do site, mais recente.
  endereco: {
    linha1: 'Av. Gisele Martins, 541',
    linha2: 'Residencial Bosque dos Ipês',
    cidade: 'São José dos Campos – SP',
    cep: '12236-500',
    mapa: 'https://maps.google.com/maps?q=-23.2510094,-45.8973812&z=16&output=embed',
  },
  horario: 'Segunda a sexta, das 8h às 18h',
  redes: [
    { nome: 'Facebook', url: 'https://www.facebook.com/nfcopiadoras/?locale=pt_BR' },
    { nome: 'Instagram', url: 'https://www.instagram.com/nfcopiadoras/' },
    { nome: 'TikTok', url: 'https://www.tiktok.com/@nfsolucoes' },
  ],
};

// Dados jurídicos usados na Política de Privacidade e nos Termos de Uso.
// Valores entre [A PREENCHER: ...] aparecem destacados nas páginas até serem preenchidos.
export const juridico = {
  // Grafia exatamente como está no cadastro da Receita Federal ("SOLICOES" mesmo); não corrigir.
  razaoSocial: 'NF COMERCIO E SOLICOES DIGITAIS LTDA',
  cnpj: '13.025.128/0001-51',
  // Encarregado pelo tratamento de dados (LGPD, art. 41). Pode ser o sócio/dono da empresa.
  // Microempresas e empresas de pequeno porte podem dispensar a indicação (Resolução CD/ANPD nº 2/2022),
  // mas precisam manter este canal de contato.
  encarregado: 'Ricardo Nunes Fonseca',
  emailPrivacidade: 'contato@nfsolucoesdigitais.com.br',
  foro: 'São José dos Campos – SP',
  atualizadoEm: '23 de outubro de 2026',
};

// Marcas com que a NF trabalha (rodapé do site e da loja antigos).
export const marcas = [
  { nome: 'Ricoh', logo: '/marcas/ricoh.png' },
  { nome: 'Brother', logo: '/marcas/brother.png' },
  { nome: 'Canon', logo: '/marcas/canon.png' },
  { nome: 'HP', logo: '/marcas/hp.png' },
  { nome: 'Kyocera', logo: '/marcas/kyocera.png' },
  { nome: 'Lexmark', logo: '/marcas/lexmark.png' },
  { nome: 'Samsung', logo: '/marcas/samsung.png' },
  { nome: 'Xerox', logo: '/marcas/xerox.png' },
  { nome: 'Konica Minolta', logo: '/marcas/konica.png' },
];

export const servicos = [
  {
    id: 'venda',
    titulo: 'Venda',
    texto:
      'Equipamentos novos e seminovos revisados, suprimentos e acessórios das principais marcas, com pronta entrega e várias formas de pagamento.',
  },
  {
    id: 'locacao',
    titulo: 'Locação de impressoras e copiadoras',
    texto:
      'Sua empresa não investe na compra nem perde com a desvalorização do equipamento. A assistência técnica já vem incluída no plano.',
  },
  {
    id: 'assistencia',
    titulo: 'Assistência técnica',
    texto:
      'Técnicos treinados nas principais linhas de impressoras e multifuncionais. Orçamento rápido, preciso e sem custo.',
  },
  {
    id: 'notebooks',
    titulo: 'Locação de notebooks',
    texto: 'Diversos modelos para alugar, de uma unidade a grandes volumes para empresas e indústrias.',
  },
];

// Banner de locação da página inicial. Só o que a NF já oferece hoje (confirmar com o cliente antes de
// acrescentar condições de contrato, como franquia de cópias ou suprimentos incluídos).
export const locacao = {
  titulo: 'Locação de impressoras e copiadoras para empresas',
  texto:
    'Em vez de comprar, sua empresa paga um valor mensal e usa equipamentos revisados, com a assistência técnica incluída no plano. Sem investimento inicial e sem perder com a desvalorização do equipamento.',
  vantagens: [
    'Sem investimento na compra do equipamento',
    'Assistência técnica incluída no plano',
    'Equipamento indicado para o volume de impressão da sua empresa',
    'Atendimento em São José dos Campos e região',
  ],
  passos: [
    'Você conta como sua empresa imprime, copia e digitaliza',
    'Indicamos o equipamento e o plano que custam menos no dia a dia',
    'Sua empresa usa o equipamento e nós cuidamos da assistência técnica',
  ],
  publico: 'Locação disponível para empresas (CNPJ).',
};

export const institucional = {
  resumo:
    'Fundada em 2010, a NF Soluções Digitais atende empresas de São José dos Campos e região com equipamentos de cópia, impressão e digitalização. Nossa equipe soma mais de 10 anos de experiência, com formação nos próprios fabricantes.',
  missao:
    'Atender nossos clientes com a equipe técnica mais eficiente, no menor prazo, com qualidade e sempre buscando reduzir custos.',
  visao: 'Ser referência na região em produtos e serviços de impressão digital e tecnologia.',
  valores: 'Respeito e honestidade com todos os clientes. Qualidade nos produtos e nos serviços.',
};
