import { desc, eq } from 'drizzle-orm';
import { db, schema } from '../db';

export function historico(fonte: 'confluence' | 'bling', limite = 10) {
  return db.select().from(schema.sincronizacoes).where(eq(schema.sincronizacoes.fonte, fonte)).orderBy(desc(schema.sincronizacoes.id)).limit(limite).all();
}
