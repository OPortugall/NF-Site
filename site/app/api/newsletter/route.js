// Recebe a inscrição na newsletter da página inicial.
// Por enquanto só responde; o cadastro de e-mails entra na etapa do servidor.
// O formato da resposta ({ info, msg }) é o que o JavaScript original do template espera.

export async function POST() {
  return Response.json({
    info: 'error',
    msg: 'A inscrição na newsletter está temporariamente indisponível.',
  });
}
