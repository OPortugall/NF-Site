// Consulta dos dados públicos de um CNPJ (Receita Federal) por serviços gratuitos.
// Primeiro a BrasilAPI (sem limite fixo); se falhar, o CNPJ.ws público (3 consultas por minuto).
//
// Atenção: esta consulta no navegador serve para preencher o formulário. Quando o servidor existir,
// ele deve repetir a consulta antes de liberar a locação (o navegador pode ser manipulado).

const TEMPO_LIMITE = 8000;

async function buscarJson(url) {
  const controle = new AbortController();
  const tempo = setTimeout(() => controle.abort(), TEMPO_LIMITE);
  try {
    const r = await fetch(url, { signal: controle.signal });
    if (r.status === 404) return { naoEncontrado: true };
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(tempo);
  }
}

const titulo = (t = '') =>
  t
    .toLowerCase()
    .replace(/(^|\s|\/|-)(\p{L})/gu, (m, sep, letra) => sep + letra.toUpperCase())
    .replace(/\b(De|Da|Do|Das|Dos|E)\b/g, (p) => p.toLowerCase());

import { mascaraTelefone } from './documentos';

const mascaraCep = (c = '') => String(c).replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
const telefone = (ddd, numero) => (ddd && numero ? mascaraTelefone(`${ddd}${numero}`) : '');
const numeroEndereco = (n = '') => String(n).replace(/^0+(?=\d)/, ''); // a Receita guarda "070"

function deBrasilApi(j) {
  return {
    razaoSocial: j.razao_social || '',
    nomeFantasia: j.nome_fantasia || '',
    situacao: titulo(j.descricao_situacao_cadastral || ''),
    cep: mascaraCep(j.cep),
    rua: titulo([j.descricao_tipo_de_logradouro, j.logradouro].filter(Boolean).join(' ')),
    numero: numeroEndereco(j.numero),
    complemento: titulo(j.complemento || ''),
    bairro: titulo(j.bairro || ''),
    cidade: titulo(j.municipio || ''),
    uf: j.uf || '',
    telefone: j.ddd_telefone_1 ? telefone(j.ddd_telefone_1.slice(0, 2), j.ddd_telefone_1.slice(2)) : '',
    fonte: 'BrasilAPI',
  };
}

function deCnpjWs(j) {
  const e = j.estabelecimento || {};
  return {
    razaoSocial: j.razao_social || '',
    nomeFantasia: e.nome_fantasia || '',
    situacao: titulo(e.situacao_cadastral || ''),
    cep: mascaraCep(e.cep),
    rua: titulo([e.tipo_logradouro, e.logradouro].filter(Boolean).join(' ')),
    numero: numeroEndereco(e.numero),
    complemento: titulo(e.complemento || ''),
    bairro: titulo(e.bairro || ''),
    cidade: e.cidade?.nome || '',
    uf: e.estado?.sigla || '',
    telefone: telefone(e.ddd1, e.telefone1),
    fonte: 'CNPJ.ws',
  };
}

/**
 * Retorna { estado: 'ok', dados } | { estado: 'nao-encontrado' } | { estado: 'erro' }.
 * dados.ativa indica se a situação cadastral é "Ativa".
 */
export async function consultarCnpj(digitos) {
  const fontes = [
    [`https://brasilapi.com.br/api/cnpj/v1/${digitos}`, deBrasilApi],
    [`https://publica.cnpj.ws/cnpj/${digitos}`, deCnpjWs],
  ];
  let naoEncontrado = false;
  for (const [url, converter] of fontes) {
    try {
      const j = await buscarJson(url);
      if (j.naoEncontrado) {
        naoEncontrado = true;
        continue;
      }
      const dados = converter(j);
      return { estado: 'ok', dados: { ...dados, ativa: dados.situacao.toLowerCase() === 'ativa' } };
    } catch {
      // serviço fora do ar ou limite atingido: tenta o próximo
    }
  }
  return { estado: naoEncontrado ? 'nao-encontrado' : 'erro' };
}
