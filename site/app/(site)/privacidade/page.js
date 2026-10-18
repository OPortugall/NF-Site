import Link from 'next/link';
import { empresa, juridico } from '@/dados/empresa';
import { CONTAS_ATIVAS } from '@/lib/ambiente';
import { Dado, Secao, Sumario } from '@/componentes/TextoLegal';

export const metadata = {
  title: 'Política de Privacidade',
  description: `Como a ${empresa.nome} coleta, usa, guarda e protege dados pessoais, de acordo com a LGPD (Lei nº 13.709/2018).`,
  alternates: { canonical: '/privacidade' },
};

// O texto acompanha o que o site faz em cada ambiente: na vitrine (sem contas) não fala de cadastro.
const SECOES = [
  ['quem-somos', 'Quem cuida dos seus dados'],
  ['dados', 'Quais dados tratamos'],
  ['finalidades', 'Para que usamos e com qual base legal'],
  ['compartilhamento', 'Com quem compartilhamos'],
  ['internacional', 'Transferência para fora do Brasil'],
  ['retencao', 'Por quanto tempo guardamos'],
  ['seguranca', 'Como protegemos'],
  ['direitos', 'Seus direitos'],
  ['cookies', 'Cookies e armazenamento no navegador'],
  ['menores', 'Crianças e adolescentes'],
  ['alteracoes', 'Mudanças nesta política'],
  ['contato', 'Contato e encarregado'],
];

export default function PaginaPrivacidade() {
  const { endereco } = empresa;
  return (
    <div className="conteudo pagina pagina--estreita texto-legal">
      <header className="pagina__cabeca">
        <h1 className="pagina__titulo">Política de Privacidade</h1>
        <p className="pagina__lead">
          Esta política explica, em linguagem direta, quais dados pessoais a {empresa.nome} trata quando você usa este
          site ou fala com a gente, por que tratamos e quais são os seus direitos pela Lei Geral de Proteção de Dados
          (LGPD, Lei nº 13.709/2018).
        </p>
        <p className="texto-legal__data">Última atualização: {juridico.atualizadoEm}</p>
      </header>

      <Sumario secoes={SECOES} />

      <Secao id="quem-somos" titulo="1. Quem cuida dos seus dados">
        <p>
          O controlador dos dados é a <strong><Dado>{juridico.razaoSocial}</Dado></strong>, nome fantasia {empresa.nome},
          CNPJ <Dado>{juridico.cnpj}</Dado>, com sede na {endereco.linha1}, {endereco.linha2}, {endereco.cidade},
          CEP {endereco.cep}. Neste texto, “NF”, “nós” e “nosso” se referem a ela.
        </p>
      </Secao>

      <Secao id="dados" titulo="2. Quais dados tratamos">
        <p>Coletamos só o necessário para atender você. Dependendo de como você usa o site, isso inclui:</p>
        <ul>
          <li>
            <strong>Navegação:</strong> endereço IP, data e hora do acesso, página visitada, navegador e sistema
            operacional. Esses registros são gerados automaticamente pelo servidor do site.
          </li>
          <li>
            <strong>Contato e orçamento:</strong> nome, telefone, e-mail, empresa e o conteúdo da mensagem quando você
            nos chama por WhatsApp, telefone ou e-mail, ou pede um orçamento.
          </li>
          {CONTAS_ATIVAS && (
            <>
              <li>
                <strong>Cadastro:</strong> nome, e-mail, telefone, CPF ou CNPJ, razão social e nome fantasia (para
                empresas), endereços de entrega e cobrança, os tipos de equipamento que interessam a você e a senha. A
                senha nunca é guardada como foi digitada: guardamos só um resumo criptográfico (hash) que não permite
                recuperá-la.
              </li>
              <li>
                <strong>Entrar com Google:</strong> se você escolher essa opção, recebemos do Google seu nome, e-mail e
                foto de perfil. Não recebemos sua senha do Google.
              </li>
              <li>
                <strong>Pedidos de orçamento pelo site:</strong> os produtos escolhidos, quantidades, modalidade (compra ou
                locação), endereço e observações. Você acompanha a situação de cada pedido em “Minha conta”.
              </li>
              <li>
                <strong>Produtos de interesse:</strong> os equipamentos que você marca no cadastro, para a equipe da NF
                entrar em contato com propostas adequadas.
              </li>
              <li>
                <strong>Situação de pagamento:</strong> se há pagamento pendente com a NF, e quando enviamos avisos sobre isso.
              </li>
              <li>
                <strong>Segurança da conta:</strong> tentativas de login (guardadas de forma cifrada, sem o e-mail ou o IP
                legíveis) e códigos temporários para confirmar e-mail ou trocar a senha.
              </li>
            </>
          )}
        </ul>
        <p>
          Não pedimos dados sensíveis (como saúde, religião, biometria ou origem racial) e pedimos que você não os envie
          nas mensagens.
        </p>
      </Secao>

      <Secao id="finalidades" titulo="3. Para que usamos e com qual base legal">
        <p>Cada uso tem uma base legal prevista no art. 7º da LGPD:</p>
        <div className="texto-legal__tabela" role="region" aria-label="Finalidades e bases legais" tabIndex={0}>
          <table>
            <thead>
              <tr><th scope="col">Finalidade</th><th scope="col">Base legal</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Responder contatos, preparar orçamentos e negociar venda, locação ou assistência técnica</td>
                <td>Procedimentos preliminares e execução de contrato (art. 7º, V)</td>
              </tr>
              {CONTAS_ATIVAS && (
                <tr>
                  <td>Criar e manter sua conta, liberar compra (CPF) ou compra e locação (CNPJ)</td>
                  <td>Execução de contrato (art. 7º, V)</td>
                </tr>
              )}
              {CONTAS_ATIVAS && (
                <tr>
                  <td>Avisar a equipe da NF sobre o seu cadastro e os produtos de interesse, para o atendimento comercial</td>
                  <td>Procedimentos preliminares de contrato (art. 7º, V)</td>
                </tr>
              )}
              {CONTAS_ATIVAS && (
                <tr>
                  <td>Enviar aviso por e-mail quando houver pagamento pendente</td>
                  <td>Execução de contrato (art. 7º, V) e exercício regular de direitos (art. 7º, VI)</td>
                </tr>
              )}
              {CONTAS_ATIVAS && (
                <tr>
                  <td>Registrar o que a equipe altera nos cadastros (quem, o quê e quando)</td>
                  <td>Legítimo interesse (art. 7º, IX), para segurança e prestação de contas (art. 6º, X)</td>
                </tr>
              )}
              {CONTAS_ATIVAS && (
                <tr>
                  <td>Conferir a situação do CNPJ e preencher o endereço pelo CEP</td>
                  <td>Procedimentos preliminares de contrato (art. 7º, V) e legítimo interesse na prevenção de fraude (art. 7º, IX)</td>
                </tr>
              )}
              <tr>
                <td>Emitir notas fiscais e cumprir obrigações contábeis e fiscais</td>
                <td>Cumprimento de obrigação legal (art. 7º, II)</td>
              </tr>
              <tr>
                <td>Manter registros de acesso ao site</td>
                <td>Cumprimento de obrigação legal (Marco Civil da Internet, art. 15) (art. 7º, II)</td>
              </tr>
              <tr>
                <td>Proteger o site e as contas contra invasões, fraudes e abusos{CONTAS_ATIVAS ? ', inclusive limitando tentativas de login' : ''}</td>
                <td>Legítimo interesse (art. 7º, IX) e prevenção à fraude</td>
              </tr>
              <tr>
                <td>Defender a NF em processos judiciais, administrativos ou arbitrais</td>
                <td>Exercício regular de direitos (art. 7º, VI)</td>
              </tr>
              <tr>
                <td>Enviar novidades e ofertas, só se você autorizar</td>
                <td>Consentimento (art. 7º, I), que você pode retirar a qualquer momento</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Não vendemos dados pessoais e não usamos seus dados para decisões automatizadas.</p>
      </Secao>

      <Secao id="compartilhamento" titulo="4. Com quem compartilhamos">
        <p>Só compartilhamos o necessário, com:</p>
        <ul>
          <li><strong>Hospedagem:</strong> a Hostinger, que mantém o servidor e o banco de dados do site.</li>
          <li>
            <strong>Google:</strong> o mapa da seção de contato é carregado do Google Maps, que recebe seu IP e dados de
            navegação ao exibi-lo{CONTAS_ATIVAS ? '; e o Google, se você usar “Entrar com Google”' : ''}.
          </li>
          <li>
            <strong>WhatsApp (Meta):</strong> quando você clica nos botões de WhatsApp, a conversa acontece no aplicativo
            e segue a política de privacidade do WhatsApp.
          </li>
          {CONTAS_ATIVAS && (
            <li>
              <strong>Consultas públicas:</strong> o número do CNPJ é consultado na BrasilAPI ou no CNPJ.ws (dados públicos
              da Receita Federal) e o CEP no ViaCEP, direto do seu navegador.
            </li>
          )}
          <li><strong>E-mail:</strong> o provedor que envia as mensagens da NF.</li>
          <li>
            <strong>Contabilidade:</strong> o escritório de contabilidade terceirizado que atende a NF, para emissão de
            notas e cumprimento de obrigações fiscais.
          </li>
          <li>
            <strong>Entregas:</strong> Correios, Loggi e outras transportadoras, que recebem nome, telefone e endereço de
            entrega quando enviamos equipamentos ou suprimentos.
          </li>
          <li>
            <strong>Autoridades:</strong> quando a lei exigir ou houver ordem judicial.
          </li>
        </ul>
      </Secao>

      <Secao id="internacional" titulo="5. Transferência para fora do Brasil">
        <p>
          Alguns desses serviços (como Google e WhatsApp) podem guardar dados em servidores fora do Brasil. Nesses casos,
          a transferência segue o art. 33 da LGPD, com fornecedores que adotam cláusulas contratuais e medidas de
          proteção compatíveis com a lei brasileira.
        </p>
      </Secao>

      <Secao id="retencao" titulo="6. Por quanto tempo guardamos">
        <ul>
          <li><strong>Registros de acesso ao site:</strong> 6 meses, como exige o Marco Civil da Internet.</li>
          <li><strong>Conversas e orçamentos que não viraram negócio:</strong> até 2 anos, para retomar o atendimento.</li>
          {CONTAS_ATIVAS && (
            <>
              <li>
                <strong>Conta:</strong> enquanto ela existir. Você pode excluí-la quando quiser, em “Minha conta”: o
                cadastro, os endereços e os produtos de interesse são apagados na hora.
              </li>
              <li>
                <strong>Depois da exclusão da conta:</strong> os pedidos de orçamento ficam no histórico da NF sem ligação
                com o seu nome; a equipe recebe um aviso com seu nome, e-mail e telefone, para encerrar algum atendimento
                em aberto, que é apagado do painel em 90 dias.
              </li>
              <li><strong>Tentativas de login:</strong> 24 horas.</li>
              <li><strong>Registro de alterações feitas pela equipe no seu cadastro:</strong> até 5 anos, sem senhas e com o IP só de forma cifrada.</li>
              <li><strong>Códigos de confirmação e troca de senha:</strong> até 48 horas, e deixam de valer depois do uso.</li>
            </>
          )}
          <li>
            <strong>Vendas, locações e notas fiscais:</strong> pelo prazo exigido pela legislação fiscal e para defesa
            em processos (em geral, 5 anos), mesmo depois de um pedido de exclusão.
          </li>
        </ul>
        <p>Terminado o prazo, os dados são apagados ou anonimizados.</p>
      </Secao>

      <Secao id="seguranca" titulo="7. Como protegemos">
        <p>Adotamos medidas técnicas e administrativas para proteger os dados, entre elas:</p>
        <ul>
          <li>conexão sempre cifrada (HTTPS);</li>
          {CONTAS_ATIVAS && <li>senhas guardadas com algoritmo próprio para senhas (argon2id), nunca em texto;</li>}
          {CONTAS_ATIVAS && <li>limite de tentativas de login para impedir ataques de força bruta;</li>}
          <li>acesso aos dados só por quem precisa deles para trabalhar;</li>
          <li>proteções do navegador contra conteúdo de terceiros não autorizado.</li>
        </ul>
        <p>
          Nenhum sistema é totalmente imune. Se ocorrer um incidente que possa trazer risco ou dano relevante a você,
          avisaremos você e a Autoridade Nacional de Proteção de Dados (ANPD), como manda a lei.
        </p>
      </Secao>

      <Secao id="direitos" titulo="8. Seus direitos">
        <p>Pelo art. 18 da LGPD, você pode pedir a qualquer momento, sem custo:</p>
        <ul>
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos, errados ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a lei;</li>
          <li>portabilidade dos dados a outro fornecedor;</li>
          <li>eliminação dos dados tratados com base no seu consentimento, e a retirada desse consentimento;</li>
          <li>informação sobre com quem compartilhamos seus dados;</li>
          <li>informação sobre a possibilidade de não dar consentimento e o que acontece nesse caso;</li>
          {CONTAS_ATIVAS && <li>exclusão da sua conta, que você mesmo faz em “Minha conta”, no site;</li>}
          <li>oposição a um tratamento que descumpra a lei.</li>
        </ul>
        <p>
          Para exercer qualquer direito, escreva para{' '}
          <a href={`mailto:${juridico.emailPrivacidade}`}>{juridico.emailPrivacidade}</a>. Podemos pedir uma
          confirmação de identidade para proteger você. Respondemos em até 15 dias. Se não ficar satisfeito, você também
          pode reclamar à ANPD em <a href="https://www.gov.br/anpd" rel="noopener noreferrer">gov.br/anpd</a>.
        </p>
      </Secao>

      <Secao id="cookies" titulo="9. Cookies e armazenamento no navegador">
        <p>
          O site não usa cookies de publicidade nem ferramentas de estatística ou rastreamento.
          {CONTAS_ATIVAS
            ? ' Usamos só o essencial para o site funcionar: um cookie de sessão (nf_sessao), que mantém você conectado à sua conta por até 7 dias e protege os formulários contra uso indevido, e os itens do carrinho, guardados no seu próprio navegador. Você pode apagar esses dados nas configurações do navegador.'
            : ' Ele não guarda nada no seu navegador para identificar você.'}
        </p>
        <p>
          O mapa do Google Maps, na seção de contato, pode gravar cookies do próprio Google, regidos pela política de
          privacidade dele.
        </p>
      </Secao>

      <Secao id="menores" titulo="10. Crianças e adolescentes">
        <p>
          O site é voltado a empresas e adultos. Não coletamos de propósito dados de menores de 18 anos
          {CONTAS_ATIVAS ? ', e o cadastro é permitido só para maiores de idade' : ''}.
        </p>
      </Secao>

      <Secao id="alteracoes" titulo="11. Mudanças nesta política">
        <p>
          Podemos atualizar esta política quando o site ou a lei mudarem. A data no topo mostra a versão em vigor. Se a
          mudança for importante, avisaremos no site{CONTAS_ATIVAS ? ' ou por e-mail a quem tem conta' : ''}.
        </p>
      </Secao>

      <Secao id="contato" titulo="12. Contato e encarregado">
        <p>
          Encarregado pelo tratamento de dados pessoais: <strong><Dado>{juridico.encarregado}</Dado></strong>.
          <br />
          E-mail: <a href={`mailto:${juridico.emailPrivacidade}`}>{juridico.emailPrivacidade}</a>
          <br />
          Endereço: {endereco.linha1}, {endereco.linha2}, {endereco.cidade}, CEP {endereco.cep}
        </p>
        <p>
          Veja também os <Link href="/termos">Termos de Uso</Link>.
        </p>
      </Secao>
    </div>
  );
}
