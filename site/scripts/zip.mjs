// Gera o .zip do site para enviar ao cPanel, com as permissões certas para o servidor Linux:
// arquivos 644 (só o dono altera) e pastas 755. Zips feitos no Windows (tar, "Enviar para")
// não guardam permissões, e o cPanel extrai tudo como 666/777: qualquer conta do servidor
// poderia alterar o site.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

const ARQUIVO = 0o100644;
const PASTA = 0o040755;

function dataDos(d) {
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const dia = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { hora, dia };
}

function listar(raiz, rel = '') {
  const itens = [];
  for (const e of readdirSync(path.join(raiz, rel), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) itens.push({ nome: `${r}/`, pasta: true }, ...listar(raiz, r));
    else if (e.isFile()) itens.push({ nome: r, pasta: false });
  }
  return itens;
}

export function criarZip(pastaOrigem, destino) {
  const partes = [];
  const central = [];
  let posicao = 0;
  const { hora, dia } = dataDos(new Date());

  for (const item of listar(pastaOrigem)) {
    const nome = Buffer.from(item.nome, 'utf8');
    const dados = item.pasta ? Buffer.alloc(0) : readFileSync(path.join(pastaOrigem, item.nome));
    const comprimido = item.pasta ? dados : deflateRawSync(dados, { level: 9 });
    const metodo = item.pasta ? 0 : 8;
    const crc = item.pasta ? 0 : crc32(dados);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);           // versão necessária
    local.writeUInt16LE(0x0800, 6);       // nomes em UTF-8
    local.writeUInt16LE(metodo, 8);
    local.writeUInt16LE(hora, 10);
    local.writeUInt16LE(dia, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(dados.length, 22);
    local.writeUInt16LE(nome.length, 26);
    local.writeUInt16LE(0, 28);
    partes.push(local, nome, comprimido);

    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt16LE((3 << 8) | 20, 4);    // feito em "Unix": o cPanel respeita as permissões abaixo
    c.writeUInt16LE(20, 6);
    c.writeUInt16LE(0x0800, 8);
    c.writeUInt16LE(metodo, 10);
    c.writeUInt16LE(hora, 12);
    c.writeUInt16LE(dia, 14);
    c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(comprimido.length, 20);
    c.writeUInt32LE(dados.length, 24);
    c.writeUInt16LE(nome.length, 28);
    c.writeUInt32LE((((item.pasta ? PASTA : ARQUIVO) << 16) | (item.pasta ? 0x10 : 0)) >>> 0, 38);
    c.writeUInt32LE(posicao, 42);
    central.push(c, nome);
    posicao += local.length + nome.length + comprimido.length;
  }

  const tamanhoCentral = central.reduce((s, b) => s + b.length, 0);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(central.length / 2, 8);
  fim.writeUInt16LE(central.length / 2, 10);
  fim.writeUInt32LE(tamanhoCentral, 12);
  fim.writeUInt32LE(posicao, 16);
  writeFileSync(destino, Buffer.concat([...partes, ...central, fim]));
  return { itens: central.length / 2, bytes: statSync(destino).size };
}
