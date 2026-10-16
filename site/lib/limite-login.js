// Limite de tentativas de login (proteção contra força bruta).
//
// Roda NO SERVIDOR, dentro da rota de login, quando o banco estiver ligado.
// (Limite feito só no navegador não protege: o robô fala direto com o servidor.)
//
// Uso na rota de login:
//   const bloqueio = await verificarBloqueio(consulta, { email, ip }, segredo);
//   if (bloqueio.bloqueado) -> responder "Muitas tentativas. Tente de novo em X minutos." (HTTP 429)
//   ...confere a senha...
//   await registrarTentativa(consulta, { email, ip, sucesso }, segredo);
//
// "consulta(sql, parametros)" executa SQL parametrizado e devolve as linhas.
// "segredo" vem de variável de ambiente (ex.: LIMITE_LOGIN_SEGREDO), nunca do código.

import { createHmac } from 'node:crypto';

export const REGRAS = {
  porEmail: { maximo: 5, minutos: 15 },
  porIp: { maximo: 20, minutos: 15 },
  guardarPorHoras: 24,
};

// O banco guarda só um código do e-mail/IP (LGPD), não o valor em si.
export function chave(valor, segredo) {
  if (!segredo || segredo.length < 32) throw new Error('Segredo do limite de login ausente ou curto (mínimo 32 caracteres).');
  return createHmac('sha256', segredo).update(String(valor).trim().toLowerCase()).digest('hex');
}

const segundosRestantes = (primeira, minutos, agora) =>
  Math.max(1, Math.ceil((new Date(primeira).getTime() + minutos * 60_000 - new Date(agora).getTime()) / 1000));

export async function verificarBloqueio(consulta, { email, ip }, segredo) {
  const chaveEmail = chave(email, segredo);
  const chaveIp = chave(ip, segredo);

  // E-mail: erros na janela, contando só depois do último login certo daquele e-mail.
  const [porEmail] = await consulta(
    `SELECT COUNT(*) AS erros, MIN(criado_em) AS primeira, NOW(3) AS agora
       FROM tentativas_login
      WHERE chave_email = ? AND sucesso = 0
        AND criado_em > NOW(3) - INTERVAL ? MINUTE
        AND criado_em > COALESCE((SELECT MAX(criado_em) FROM tentativas_login WHERE chave_email = ? AND sucesso = 1), '1970-01-01')`,
    [chaveEmail, REGRAS.porEmail.minutos, chaveEmail],
  );
  if (Number(porEmail.erros) >= REGRAS.porEmail.maximo) {
    return { bloqueado: true, motivo: 'email', tentarEmSegundos: segundosRestantes(porEmail.primeira, REGRAS.porEmail.minutos, porEmail.agora) };
  }

  // IP: erros na janela, sem zerar com login certo (senão o robô zeraria entrando na própria conta).
  const [porIp] = await consulta(
    `SELECT COUNT(*) AS erros, MIN(criado_em) AS primeira, NOW(3) AS agora
       FROM tentativas_login
      WHERE chave_ip = ? AND sucesso = 0 AND criado_em > NOW(3) - INTERVAL ? MINUTE`,
    [chaveIp, REGRAS.porIp.minutos],
  );
  if (Number(porIp.erros) >= REGRAS.porIp.maximo) {
    return { bloqueado: true, motivo: 'ip', tentarEmSegundos: segundosRestantes(porIp.primeira, REGRAS.porIp.minutos, porIp.agora) };
  }

  return { bloqueado: false, errosEmail: Number(porEmail.erros), errosIp: Number(porIp.erros) };
}

export async function registrarTentativa(consulta, { email, ip, sucesso }, segredo) {
  await consulta('INSERT INTO tentativas_login (chave_email, chave_ip, sucesso) VALUES (?, ?, ?)', [
    chave(email, segredo),
    chave(ip, segredo),
    sucesso ? 1 : 0,
  ]);
}

// Rodar de tempos em tempos (ou a cada login): apaga registros com mais de 1 dia.
export async function limparTentativasAntigas(consulta) {
  await consulta('DELETE FROM tentativas_login WHERE criado_em < NOW() - INTERVAL ? HOUR', [REGRAS.guardarPorHoras]);
}
