import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../db';
import { registrar } from '../../lib/acessos';
import { responderArquivo } from '../../lib/arquivos';
import { nomesDeProjetos } from '../../lib/financeiro';
import { alvoDaMidia, cabeZip, fluxoZip, midiasPorIds, nomeDoZip } from '../../lib/midias';

// /midias/baixar?ids=1,2,3  → uma mídia: o arquivo original; várias: ZIP
// /midias/baixar?todas=1    → ZIP com todas as mídias do cliente
export const GET: APIRoute = ({ url, locals, request }) => {
  const cliente = locals.cliente!;
  const todas = url.searchParams.has('todas');
  const ids = (url.searchParams.get('ids') ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 500);
  const midias = midiasPorIds(cliente.id, todas ? 'todas' : ids);
  if (!midias.length) return new Response('Não encontrado', { status: 404 });

  const registrarDownloads = () => {
    for (const m of midias) registrar({ evento: 'baixou_midia', clienteId: cliente.id, alvo: alvoDaMidia(m), ip: locals.ip, userAgent: locals.userAgent });
  };

  if (midias.length === 1 && !todas) {
    const arquivo = db.select().from(schema.arquivos).where(eq(schema.arquivos.id, midias[0].arquivoId)).get();
    if (!arquivo) return new Response('Não encontrado', { status: 404 });
    if (!request.headers.has('range')) registrarDownloads();
    return responderArquivo(arquivo, false, request);
  }

  if (!cabeZip(midias)) {
    return new Response('A seleção passa de 4 GB. Baixe em partes menores.', { status: 413, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  registrarDownloads();
  return new Response(fluxoZip(midias, nomesDeProjetos(cliente.id)), {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${nomeDoZip(cliente.razaoSocial, midias.length, todas)}"`,
      'cache-control': 'private, no-store',
      'x-accel-buffering': 'no', // o Nginx repassa o ZIP enquanto ele é gerado
    },
  });
};
