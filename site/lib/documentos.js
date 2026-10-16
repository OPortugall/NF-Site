// Validação e máscaras de CPF, CNPJ, telefone e CEP (dígitos verificadores oficiais).

export const soDigitos = (v = '') => v.replace(/\D/g, '');

export function cpfValido(valor) {
  const d = soDigitos(valor);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dv = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

export function cnpjValido(valor) {
  const d = soDigitos(valor);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const dv = (n) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((s, p, i) => s + Number(d[i]) * p, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return dv(12) === Number(d[12]) && dv(13) === Number(d[13]);
}

export function mascaraCpf(v) {
  return soDigitos(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function mascaraCnpj(v) {
  return soDigitos(v)
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function mascaraTelefone(v) {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

export const telefoneValido = (v) => [10, 11].includes(soDigitos(v).length);

export function mascaraCep(v) {
  return soDigitos(v).slice(0, 8).replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

// Regras da senha, mostradas ao usuário enquanto ele digita.
export const REGRAS_SENHA = [
  { id: 'tamanho', texto: 'Pelo menos 8 caracteres', ok: (s) => s.length >= 8 },
  { id: 'letra', texto: 'Uma letra', ok: (s) => /[A-Za-zÀ-ÿ]/.test(s) },
  { id: 'numero', texto: 'Um número', ok: (s) => /\d/.test(s) },
];
