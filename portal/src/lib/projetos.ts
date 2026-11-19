// Projetos e versões, sempre filtrados pelo cliente da sessão.
import { and, desc, eq } from 'drizzle-orm';
import { db, schema } from '../db';

export function projetoDoCliente(clienteId: number, slug: string) {
  return db
    .select()
    .from(schema.projetos)
    .where(and(eq(schema.projetos.clienteId, clienteId), eq(schema.projetos.slug, slug)))
    .get();
}

export function versoesDoProjeto(projetoId: number) {
  return db
    .select()
    .from(schema.documentos)
    .where(eq(schema.documentos.projetoId, projetoId))
    .orderBy(desc(schema.documentos.publicadoEm))
    .all()
    .filter((d) => d.publicadoEm);
}

export function versaoDoProjeto(projetoId: number, versao: string) {
  return db
    .select()
    .from(schema.documentos)
    .where(and(eq(schema.documentos.projetoId, projetoId), eq(schema.documentos.versao, versao)))
    .get();
}

export function urlDaVersao(projetoSlug: string, versao: string) {
  return `/projetos/${projetoSlug}/${encodeURIComponent(versao)}`;
}
