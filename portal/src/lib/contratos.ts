// Contratos assinados: o admin envia o PDF pelo painel; o cliente só vê e baixa.
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { guardarArquivo, removerArquivo } from './arquivos';
import { texto } from './requisicao';

export const LIMITE_CONTRATO = 50 * 1024 * 1024; // 50 MB

/** Lê "AAAA-MM-DD" (campo date do formulário) como meio-dia em São Paulo, para não virar o dia anterior. */
export function dataDoFormulario(valor: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const d = new Date(`${valor}T12:00:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Projeto informado no formulário, se for mesmo do cliente. */
export function projetoDoFormulario(form: FormData, clienteId: number): number | null {
  const id = Number(texto(form, 'projeto'));
  if (!Number.isInteger(id) || id <= 0) return null;
  const p = db
    .select({ id: schema.projetos.id })
    .from(schema.projetos)
    .where(and(eq(schema.projetos.id, id), eq(schema.projetos.clienteId, clienteId)))
    .get();
  return p?.id ?? null;
}

/** Cadastra o contrato a partir do formulário (campos: titulo, assinado_em, projeto, arquivo). Devolve o erro, se houver. */
export async function enviarContrato(form: FormData, clienteId: number): Promise<{ erro?: string; titulo?: string }> {
  const titulo = texto(form, 'titulo');
  const arquivo = form.get('arquivo');
  if (titulo.length < 2) return { erro: 'Informe o título do contrato.' };
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: 'Escolha o PDF do contrato.' };
  if (arquivo.size > LIMITE_CONTRATO) return { erro: 'O PDF passa de 50 MB.' };
  const dados = Buffer.from(await arquivo.arrayBuffer());
  if (dados.subarray(0, 5).toString('latin1') !== '%PDF-') return { erro: 'O arquivo não é um PDF.' };

  const projetoId = projetoDoFormulario(form, clienteId);
  const nome = /\.pdf$/i.test(arquivo.name) ? arquivo.name : `${titulo}.pdf`;
  db.transaction((tx) => {
    const salvo = guardarArquivo(dados, { clienteId, projetoId, categoria: 'contrato', origem: 'upload', nome, mime: 'application/pdf' });
    tx.insert(schema.contratos)
      .values({ clienteId, projetoId, titulo, assinadoEm: dataDoFormulario(texto(form, 'assinado_em')), arquivoId: salvo.id })
      .run();
  });
  return { titulo };
}

/** Remove o contrato (e o PDF, se nada mais usa o mesmo arquivo). */
export function removerContrato(contratoId: number, clienteId?: number): string | null {
  const filtro = clienteId == null ? eq(schema.contratos.id, contratoId) : and(eq(schema.contratos.id, contratoId), eq(schema.contratos.clienteId, clienteId));
  const contrato = db.select().from(schema.contratos).where(filtro).get();
  if (!contrato) return null;
  db.delete(schema.contratos).where(eq(schema.contratos.id, contrato.id)).run();
  const arquivo = db.select().from(schema.arquivos).where(eq(schema.arquivos.id, contrato.arquivoId)).get();
  if (arquivo) removerArquivo(arquivo);
  return contrato.titulo;
}
