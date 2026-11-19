import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../../db';
import { registrar } from '../../lib/acessos';
import { responderArquivo } from '../../lib/arquivos';

// Arquivo do cliente logado. De outro cliente (ou inexistente): 404, sem revelar que existe.
export const GET: APIRoute = ({ params, url, locals, request }) => {
  const cliente = locals.cliente!;
  const id = Number(params.id);
  const arquivo = Number.isInteger(id)
    ? db.select().from(schema.arquivos).where(and(eq(schema.arquivos.id, id), eq(schema.arquivos.clienteId, cliente.id))).get()
    : undefined;
  if (!arquivo) return new Response('Não encontrado', { status: 404 });
  const inline = url.searchParams.has('ver');
  if (!inline && !request.headers.has('range')) {
    registrar({ evento: 'baixou_arquivo', clienteId: cliente.id, alvo: arquivo.nome, ip: locals.ip, userAgent: locals.userAgent });
  }
  return responderArquivo(arquivo, inline, request);
};
