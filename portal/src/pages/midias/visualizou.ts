import type { APIRoute } from 'astro';
import { and, desc, eq, gte } from 'drizzle-orm';
import { db, schema } from '../../db';
import { registrar } from '../../lib/acessos';
import { lerFormulario, texto } from '../../lib/requisicao';
import { alvoDaMidia, midiasPorIds } from '../../lib/midias';

// A galeria avisa quando o cliente abre uma mídia em tamanho grande. Mesma mídia aberta de novo em 30 min não repete.
export const POST: APIRoute = async ({ request, locals }) => {
  const cliente = locals.cliente!;
  const form = await lerFormulario(request);
  const [midia] = midiasPorIds(cliente.id, [Number(texto(form ?? new FormData(), 'id'))]);
  if (!midia) return new Response(null, { status: 404 });
  const alvo = alvoDaMidia(midia);
  const recente = db
    .select({ id: schema.acessos.id })
    .from(schema.acessos)
    .where(
      and(
        eq(schema.acessos.clienteId, cliente.id),
        eq(schema.acessos.evento, 'viu_midia'),
        eq(schema.acessos.alvo, alvo),
        gte(schema.acessos.quando, new Date(Date.now() - 30 * 60 * 1000)),
      ),
    )
    .orderBy(desc(schema.acessos.id))
    .get();
  if (!recente) registrar({ evento: 'viu_midia', clienteId: cliente.id, alvo, ip: locals.ip, userAgent: locals.userAgent });
  return new Response(null, { status: 204 });
};
