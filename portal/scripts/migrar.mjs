// Aplica as migrações de drizzle/ no banco (roda no deploy, antes de reiniciar o app).
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const arquivo = process.env.DB_ARQUIVO ?? './dados/portal.db';
mkdirSync(dirname(arquivo), { recursive: true });
const sqlite = new Database(arquivo);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
migrate(drizzle(sqlite), { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
sqlite.close();
console.log(`Banco atualizado: ${arquivo}`);
