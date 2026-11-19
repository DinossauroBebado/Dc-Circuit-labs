// Cria um admin do painel (ou redefine o acesso de um existente) e imprime a senha temporária.
//
//   node scripts/criar-admin.mjs "Nome" email@dominio          → cria
//   node scripts/criar-admin.mjs --redefinir email@dominio      → nova senha temporária + refazer o 2FA
//
// No VPS: cd /srv/apps/portal/app/portal && set -a && . ../../.env && set +a && node scripts/criar-admin.mjs …
import { hash } from '@node-rs/argon2';
import Database from 'better-sqlite3';
import { randomInt } from 'node:crypto';

const ALFABETO = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const senha = Array.from({ length: 16 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');
const senhaHash = await hash(senha, { memoryCost: 19456, timeCost: 2, parallelism: 1 });

const db = new Database(process.env.DB_ARQUIVO ?? './dados/portal.db');
db.pragma('foreign_keys = ON');

const [a, b] = process.argv.slice(2);
if (a === '--redefinir' && b) {
  const email = b.toLowerCase();
  const r = db.prepare('UPDATE admins SET senha_hash = ?, deve_trocar_senha = 1, totp_segredo = NULL WHERE email = ?').run(senhaHash, email);
  if (!r.changes) {
    console.error(`Nenhum admin com o e-mail ${email}.`);
    process.exit(1);
  }
  db.prepare('DELETE FROM sessoes WHERE admin_id = (SELECT id FROM admins WHERE email = ?)').run(email);
  console.log(`Acesso de ${email} redefinido. O 2FA será configurado de novo no próximo login.`);
} else if (a && b && !a.startsWith('--')) {
  const email = b.toLowerCase();
  db.prepare('INSERT INTO admins (nome, email, senha_hash) VALUES (?, ?, ?)').run(a, email, senhaHash);
  console.log(`Admin criado: ${a} <${email}>`);
} else {
  console.error('Uso: criar-admin.mjs "Nome" email   |   criar-admin.mjs --redefinir email');
  process.exit(1);
}
console.log(`Senha temporária: ${senha}`);
console.log('Entre em /admin/entrar: vai pedir para configurar o app autenticador e trocar a senha.');
