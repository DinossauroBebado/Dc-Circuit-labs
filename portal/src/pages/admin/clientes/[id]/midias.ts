import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../../../../db';
import { registrar } from '../../../../lib/acessos';
import { cadastrarMidias, LIMITE_MIDIA, MAX_ARQUIVOS_POR_ENVIO } from '../../../../lib/midias';
import { receberUpload } from '../../../../lib/upload';

// Envio de fotos/vídeos para o cliente. Upload lido em fluxo direto para o disco (vídeos grandes não passam pela memória).
export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const admin = locals.admin!;
  const id = Number(params.id);
  const cliente = Number.isInteger(id) ? db.select().from(schema.clientes).where(eq(schema.clientes.id, id)).get() : undefined;
  if (!cliente) return new Response(null, { status: 404 });
  const voltar = (q: Record<string, string>) => redirect(`/admin/clientes/${id}?${new URLSearchParams(q)}#midias`);

  const upload = await receberUpload(request, { porArquivo: LIMITE_MIDIA, arquivos: MAX_ARQUIVOS_POR_ENVIO });
  if (upload.erro) return voltar({ midias_erro: upload.erro });
  const arquivos = upload.arquivos.filter((a) => a.campo === 'arquivos');
  if (!arquivos.length) return voltar({ midias_erro: 'Escolha pelo menos uma foto ou vídeo.' });

  const projetoPedido = Number(upload.campos.projeto);
  const projeto = Number.isInteger(projetoPedido) && projetoPedido > 0
    ? db.select({ id: schema.projetos.id }).from(schema.projetos).where(and(eq(schema.projetos.id, projetoPedido), eq(schema.projetos.clienteId, id))).get()
    : undefined;

  const { enviados, erros } = await cadastrarMidias(arquivos, id, projeto?.id ?? null);
  if (enviados) registrar({ evento: 'admin_acao', adminId: admin.id, clienteId: id, alvo: `Enviou ${enviados} mídia(s) (${admin.nome})`, ip: locals.ip });
  return voltar({ midias_ok: String(enviados), ...(erros.length ? { midias_erro: erros.join('\n').slice(0, 1500) } : {}) });
};
