import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../../db';
import { responderArquivo } from '../../../lib/arquivos';

// O painel vê o arquivo de qualquer cliente (pré-visualização, NF, contratos). Não conta como acesso do cliente.
export const GET: APIRoute = ({ params, url, request }) => {
  const id = Number(params.id);
  const arquivo = Number.isInteger(id) ? db.select().from(schema.arquivos).where(eq(schema.arquivos.id, id)).get() : undefined;
  if (!arquivo) return new Response('Não encontrado', { status: 404 });
  return responderArquivo(arquivo, url.searchParams.has('ver'), request);
};
