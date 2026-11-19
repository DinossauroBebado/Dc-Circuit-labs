import type { APIRoute } from 'astro';
import { and, count, eq, gte, isNotNull } from 'drizzle-orm';
import { db, schema } from '../db';
import { registrar } from '../lib/acessos';
import { enviarReporte } from '../lib/email';
import { lerFormulario, texto } from '../lib/requisicao';

// Seções da documentação que não vêm do Confluence (blocos de anexos montados pelo portal).
const BLOCOS: Record<string, string> = {
  'modelo-3d': 'Modelo 3D',
  videos: 'Vídeos',
  'documentos-pdf': 'Documentos (PDF)',
  'bom-interativa': 'BOM interativa',
  arquivos: 'Arquivos para download',
};
const LIMITE_POR_HORA = 10;

const json = (corpo: object, status = 200) => new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

// "Reportar erro" na documentação: o cliente marca um trecho/imagem e comenta. Fica na ficha e vai por e-mail para a DC.
export const POST: APIRoute = async ({ request, locals }) => {
  const cliente = locals.cliente!;
  const form = await lerFormulario(request);
  if (!form) return json({ erro: 'Pedido inválido.' }, 400);

  const documentoId = Number(texto(form, 'documento'));
  const linha = Number.isInteger(documentoId)
    ? db
        .select({ documento: schema.documentos, projeto: schema.projetos })
        .from(schema.documentos)
        .innerJoin(schema.projetos, eq(schema.projetos.id, schema.documentos.projetoId))
        .where(and(eq(schema.documentos.id, documentoId), eq(schema.projetos.clienteId, cliente.id), isNotNull(schema.documentos.publicadoEm)))
        .get()
    : undefined;
  if (!linha) return json({ erro: 'Documento não encontrado.' }, 404);
  const { documento, projeto } = linha;

  const comentario = texto(form, 'comentario').slice(0, 2000);
  if (comentario.length < 3) return json({ erro: 'Escreva o que está errado.' }, 400);

  const recentes =
    db
      .select({ n: count() })
      .from(schema.reportes)
      .where(and(eq(schema.reportes.clienteId, cliente.id), gte(schema.reportes.criadoEm, new Date(Date.now() - 3600 * 1000))))
      .get()?.n ?? 0;
  if (recentes >= LIMITE_POR_HORA) return json({ erro: 'Muitos reportes em pouco tempo. Tente de novo mais tarde ou fale com a DC.' }, 429);

  // Seção: só aceita ids que existem no documento (o título vem do servidor, não do navegador).
  const secaoId = texto(form, 'secao');
  const doSumario = (documento.sumario ?? []).find((s) => s.id === secaoId);
  const secao = doSumario ? { id: doSumario.id, titulo: doSumario.titulo } : BLOCOS[secaoId] ? { id: secaoId, titulo: BLOCOS[secaoId] } : null;

  // Imagem marcada: precisa ser um anexo deste documento.
  const idImagem = Number(/^\/arquivos\/(\d+)/.exec(texto(form, 'imagem'))?.[1]);
  const imagem = idImagem
    ? db
        .select({ nome: schema.arquivos.nome })
        .from(schema.arquivos)
        .where(and(eq(schema.arquivos.id, idImagem), eq(schema.arquivos.documentoId, documento.id)))
        .get()
    : undefined;
  const trecho = texto(form, 'trecho').replace(/\s+\n/g, '\n').slice(0, 1000) || null;

  db.insert(schema.reportes)
    .values({
      clienteId: cliente.id,
      documentoId: documento.id,
      documentoTitulo: `${projeto.nome} — ${documento.titulo}`,
      secaoId: secao?.id ?? null,
      secaoTitulo: secao?.titulo ?? null,
      trecho,
      arquivoNome: imagem?.nome ?? null,
      comentario,
    })
    .run();
  registrar({ evento: 'reportou_erro', clienteId: cliente.id, alvo: `${documento.titulo}${secao ? ` — ${secao.titulo}` : ''}`, ip: locals.ip, userAgent: locals.userAgent });

  try {
    await enviarReporte({
      cliente: { razaoSocial: cliente.razaoSocial, cnpj: cliente.cnpj, email: cliente.emailVerificadoEm ? cliente.email : null },
      documento: { id: documento.id, titulo: documento.titulo },
      projeto: projeto.nome,
      secao,
      trecho,
      arquivoNome: imagem?.nome ?? null,
      comentario,
    });
  } catch (e) {
    // O reporte já está salvo na ficha do cliente; o e-mail é só o aviso.
    console.error('Falha ao enviar o e-mail do reporte', e);
  }
  return json({ ok: true });
};
