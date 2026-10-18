// Confere que um banco antigo + a migração fica IGUAL a um banco novo criado pelo schema.sql atual.
// (Colunas, tipos, padrões, índices, chaves estrangeiras e regras CHECK.)
//
// Uso: DB_PORT=3311 DB_ADMIN_USER=root DB_ADMIN_PASSWORD=... node testar-migracao.mjs <commit do schema antigo> <migração>
//   ex.: node testar-migracao.mjs 5479b4d ../migracoes/002-painel-admin.sql

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const AQUI = dirname(fileURLToPath(import.meta.url));
const [commit, migracao] = process.argv.slice(2);
if (!commit || !migracao) { console.error('Uso: node testar-migracao.mjs <commit> <migração.sql>'); process.exit(2); }

const admin = await mysql.createConnection({
  host: process.env.DB_HOST ?? '127.0.0.1', port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_ADMIN_USER, password: process.env.DB_ADMIN_PASSWORD, multipleStatements: true,
});

const antigo = execFileSync('git', ['show', `${commit}:banco-de-dados/schema.sql`], { cwd: join(AQUI, '..', '..'), encoding: 'utf8' });
const novo = readFileSync(join(AQUI, '..', 'schema.sql'), 'utf8');
const sqlMigracao = readFileSync(join(AQUI, migracao), 'utf8');

async function criar(nome, ...scripts) {
  await admin.query(`DROP DATABASE IF EXISTS ${nome}`);
  await admin.query(`CREATE DATABASE ${nome} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.query(`USE ${nome}`);
  for (const s of scripts) await admin.query(s);
}

async function retrato(nome) {
  const q = async (sql) => (await admin.query(sql, [nome]))[0].map((l) => JSON.stringify(l)).sort();
  return {
    colunas: await q(`SELECT table_name, column_name, column_type, is_nullable, column_default, extra, column_comment
                        FROM information_schema.columns WHERE table_schema = ?`),
    indices: await q(`SELECT table_name, index_name, column_name, seq_in_index, non_unique
                        FROM information_schema.statistics WHERE table_schema = ?`),
    estrangeiras: await q(`SELECT r.table_name, r.constraint_name, r.referenced_table_name, r.update_rule, r.delete_rule
                             FROM information_schema.referential_constraints r WHERE r.constraint_schema = ?`),
    checks: await q(`SELECT table_name, constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_schema = ?`),
  };
}

await criar('nf_migracao_a', antigo, sqlMigracao);
await criar('nf_migracao_b', novo);
const a = await retrato('nf_migracao_a');
const b = await retrato('nf_migracao_b');

let diferencas = 0;
for (const parte of Object.keys(a)) {
  const soA = a[parte].filter((x) => !b[parte].includes(x));
  const soB = b[parte].filter((x) => !a[parte].includes(x));
  for (const x of soA) { console.log(`  só no migrado  [${parte}] ${x}`); diferencas++; }
  for (const x of soB) { console.log(`  só no schema   [${parte}] ${x}`); diferencas++; }
  console.log(`${soA.length + soB.length ? '❌' : '✅'} ${parte}: ${a[parte].length} itens`);
}
await admin.query('DROP DATABASE nf_migracao_a');
await admin.query('DROP DATABASE nf_migracao_b');
await admin.end();
console.log(diferencas ? `\n${diferencas} diferenças.` : '\nMigrado e schema novo são idênticos.');
process.exit(diferencas ? 1 : 0);
