// Recebe o formulário de contato da página inicial.
// Por enquanto só responde; o envio de e-mail entra na etapa do servidor.
// O formato da resposta ({ info, msg }) é o que o JavaScript original do template espera.

export async function POST() {
  return Response.json({
    info: 'error',
    msg: 'O formulário de contato está temporariamente indisponível. Por favor, fale conosco por telefone ou e-mail.',
  });
}
