// Em qual ambiente o site está rodando, e o que fica ligado em cada um.
//
// Estas duas variáveis começam com NEXT_PUBLIC_, então vão para o código do navegador:
// elas NUNCA podem conter segredos (senhas e chaves ficam em variáveis sem esse prefixo).
// Os valores são gravados na compilação: cada ambiente compila com a própria configuração.
//
//   NEXT_PUBLIC_AMBIENTE       producao | teste | desenvolvimento
//   NEXT_PUBLIC_CONTAS_ATIVAS  true = login, cadastro e carrinho ligados; false = só vitrine
//
// Se nada for configurado, o site fica no modo mais seguro: vitrine, sem contas.

export const AMBIENTES = ['producao', 'teste', 'desenvolvimento'];

export const AMBIENTE = process.env.NEXT_PUBLIC_AMBIENTE || 'desenvolvimento';
export const CONTAS_ATIVAS = process.env.NEXT_PUBLIC_CONTAS_ATIVAS === 'true';

export const EH_PRODUCAO = AMBIENTE === 'producao';
export const EH_TESTE = AMBIENTE === 'teste';
