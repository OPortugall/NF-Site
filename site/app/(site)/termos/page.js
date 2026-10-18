import Link from 'next/link';
import { empresa, juridico } from '@/dados/empresa';
import { CONTAS_ATIVAS } from '@/lib/ambiente';
import { Dado, Secao, Sumario } from '@/componentes/TextoLegal';

export const metadata = {
  title: 'Termos de Uso',
  description: `Regras para usar o site da ${empresa.nome}: catálogo, pedidos de orçamento, cadastro e responsabilidades.`,
  alternates: { canonical: '/termos' },
};

const SECOES = [
  ['aceite', 'Quem somos e aceite'],
  ['site', 'O que o site oferece'],
  ['orcamentos', 'Orçamentos, compra e locação'],
  ...(CONTAS_ATIVAS ? [['conta', 'Sua conta']] : []),
  ['uso', 'Uso permitido e proibido'],
  ['arrependimento', 'Direito de arrependimento'],
  ['propriedade', 'Marcas e conteúdo'],
  ['terceiros', 'Links e serviços de terceiros'],
  ['responsabilidade', 'Responsabilidades'],
  ['privacidade', 'Privacidade'],
  ['alteracoes', 'Mudanças nestes termos'],
  ['lei', 'Lei aplicável e foro'],
];

export default function PaginaTermos() {
  const { endereco } = empresa;
  let n = 0;
  const t = (titulo) => `${++n}. ${titulo}`; // numera só as seções que aparecem neste ambiente
  return (
    <div className="conteudo pagina pagina--estreita texto-legal">
      <header className="pagina__cabeca">
        <h1 className="pagina__titulo">Termos de Uso</h1>
        <p className="pagina__lead">
          Estes termos explicam as regras para usar o site da {empresa.nome}. Ao navegar
          {CONTAS_ATIVAS ? ', criar uma conta' : ''} ou pedir um orçamento por aqui, você concorda com eles.
        </p>
        <p className="texto-legal__data">Última atualização: {juridico.atualizadoEm}</p>
      </header>

      <Sumario secoes={SECOES.map(([id, titulo], i) => [id, `${i + 1}. ${titulo}`])} />

      <Secao id="aceite" titulo={t('Quem somos e aceite')}>
        <p>
          Este site pertence à <strong><Dado>{juridico.razaoSocial}</Dado></strong> ({empresa.nome}), CNPJ{' '}
          <Dado>{juridico.cnpj}</Dado>, {endereco.linha1}, {endereco.linha2}, {endereco.cidade}, CEP {endereco.cep}.
        </p>
        <p>Se você não concordar com estes termos, não use o site. Você ainda pode falar com a gente por telefone.</p>
      </Secao>

      <Secao id="site" titulo={t('O que o site oferece')}>
        <p>
          O site é um catálogo de impressoras, copiadoras, impressoras 3D, equipamentos gráficos e suprimentos, além de
          informações sobre locação e assistência técnica. Ele <strong>não mostra preços nem fecha vendas</strong>: você
          escolhe o que interessa e pede um orçamento.
        </p>
        <p>
          Fotos, descrições e especificações servem de referência e podem variar conforme o fabricante, o modelo ou o
          lote. Disponibilidade, configuração, prazo e condições são confirmados no orçamento.
        </p>
      </Secao>

      <Secao id="orcamentos" titulo={t('Orçamentos, compra e locação')}>
        <ul>
          <li>Pedir um orçamento não obriga você a comprar nem a NF a vender.</li>
          <li>
            O orçamento informa preço, prazo, forma de pagamento e validade. A venda ou locação só se conclui quando as
            duas partes aceitam essas condições, e a locação é formalizada em contrato próprio.
          </li>
          <li>
            Locação de equipamentos é feita para empresas (CNPJ). Pessoas físicas (CPF) podem comprar.
          </li>
          <li>
            Garantia, assistência técnica e trocas seguem o Código de Defesa do Consumidor, quando aplicável, e o que
            estiver no orçamento ou no contrato.
          </li>
        </ul>
      </Secao>

      {CONTAS_ATIVAS && (
        <Secao id="conta" titulo={t('Sua conta')}>
          <ul>
            <li>O cadastro é permitido para maiores de 18 anos e para empresas, por meio de seus representantes.</li>
            <li>Você deve informar dados verdadeiros e mantê-los atualizados.</li>
            <li>
              Contas com CPF podem pedir orçamento de compra. Contas com CNPJ ativo na Receita Federal podem pedir compra
              e locação.
            </li>
            <li>
              A senha é pessoal. Não a compartilhe e avise a NF se suspeitar de uso indevido. Você responde pelo que for
              feito na sua conta, salvo se provar que não teve culpa.
            </li>
            <li>
              Podemos suspender ou encerrar contas com dados falsos, uso fraudulento ou que violem estes termos. Você pode
              pedir o encerramento da sua conta a qualquer momento.
            </li>
          </ul>
        </Secao>
      )}

      <Secao id="uso" titulo={t('Uso permitido e proibido')}>
        <p>Você pode usar o site para conhecer os produtos e falar com a NF. É proibido:</p>
        <ul>
          <li>tentar invadir, sobrecarregar ou burlar a segurança do site;</li>
          <li>usar robôs ou programas para copiar o conteúdo em massa{CONTAS_ATIVAS ? ' ou criar contas' : ''};</li>
          <li>usar dados de outra pessoa ou empresa sem autorização;</li>
          <li>enviar conteúdo ilegal, ofensivo ou com vírus.</li>
        </ul>
      </Secao>

      <Secao id="arrependimento" titulo={t('Direito de arrependimento')}>
        <p>
          Se você for consumidor e a compra for fechada fora da loja física (pela internet, telefone ou WhatsApp), pode
          desistir em até 7 dias depois de receber o produto, como garante o art. 49 do Código de Defesa do Consumidor.
          Os valores pagos são devolvidos. Para isso, fale com a NF pelos canais do fim desta página.
        </p>
      </Secao>

      <Secao id="propriedade" titulo={t('Marcas e conteúdo')}>
        <p>
          Os textos, o logotipo e o layout do site pertencem à NF e não podem ser copiados sem autorização. Ricoh,
          Brother, Canon, HP, Kyocera, Lexmark, Samsung, Xerox, Konica Minolta e as demais marcas citadas pertencem aos
          seus donos e aparecem só para identificar os produtos com que trabalhamos.
        </p>
      </Secao>

      <Secao id="terceiros" titulo={t('Links e serviços de terceiros')}>
        <p>
          O site tem links e recursos de terceiros, como WhatsApp, Facebook, Instagram e Google Maps. Eles seguem os
          próprios termos e políticas, e a NF não responde pelo conteúdo deles.
        </p>
      </Secao>

      <Secao id="responsabilidade" titulo={t('Responsabilidades')}>
        <p>
          Trabalhamos para manter o site no ar e as informações corretas, mas ele pode ficar fora do ar para manutenção
          ou por falhas alheias à nossa vontade, e pode conter erros de digitação. Em caso de erro evidente em uma
          informação, prevalece o que for confirmado no orçamento. Nada nestes termos limita os direitos garantidos ao
          consumidor por lei.
        </p>
      </Secao>

      <Secao id="privacidade" titulo={t('Privacidade')}>
        <p>
          O uso dos seus dados pessoais está explicado na <Link href="/privacidade">Política de Privacidade</Link>, que
          faz parte destes termos.
        </p>
      </Secao>

      <Secao id="alteracoes" titulo={t('Mudanças nestes termos')}>
        <p>
          Podemos atualizar estes termos. A versão em vigor é sempre a publicada nesta página, com a data no topo.
          Orçamentos e contratos já aceitos continuam valendo nas condições combinadas.
        </p>
      </Secao>

      <Secao id="lei" titulo={t('Lei aplicável e foro')}>
        <p>
          Estes termos seguem as leis do Brasil. Se você for consumidor, pode entrar com ação no foro do seu domicílio
          (art. 101 do Código de Defesa do Consumidor). Nos demais casos, fica eleito o foro de {juridico.foro}.
        </p>
        <p>
          Dúvidas: <a href={`mailto:${empresa.email}`}>{empresa.email}</a>
          {empresa.telefones.map((tel) => (
            <span key={tel.numero}> · <a href={`tel:${tel.numero}`}>{tel.rotulo}</a></span>
          ))}
        </p>
      </Secao>
    </div>
  );
}
