// Notas fiscais enviadas à mão pelo painel (PDF obrigatório, XML opcional).
// Com o XML de uma NF-e, número/série/data/valor saem dele e o CNPJ do destinatário é conferido.
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { guardarArquivo, removerArquivo } from './arquivos';
import { dataDoFormulario, projetoDoFormulario } from './contratos';
import { formatarCnpj } from './cnpj';
import { valorEmReais } from './renderizar';
import { texto } from './requisicao';

export const LIMITE_NOTA = 20 * 1024 * 1024; // 20 MB por arquivo
export const SITUACOES_MANUAIS = ['Autorizada', 'Cancelada'] as const;

export interface DadosNfe {
  numero?: string;
  serie?: string;
  emissao?: Date;
  valor?: number;
  cnpjDestinatario?: string;
}

/** Lê os campos principais do XML de uma NF-e (nfeProc/NFe). Outro formato (ex.: NFS-e) devolve null. */
export function lerXmlNfe(xml: string): DadosNfe | null {
  if (!/<(?:\w+:)?infNFe[\s>]/.test(xml)) return null;
  const tag = (nome: string, dentro = xml) => new RegExp(`<(?:\\w+:)?${nome}>([^<]*)</(?:\\w+:)?${nome}>`).exec(dentro)?.[1]?.trim();
  const dest = /<(?:\w+:)?dest>([\s\S]*?)<\/(?:\w+:)?dest>/.exec(xml)?.[1] ?? '';
  const total = /<(?:\w+:)?ICMSTot>([\s\S]*?)<\/(?:\w+:)?ICMSTot>/.exec(xml)?.[1] ?? '';
  const emissaoTexto = tag('dhEmi') ?? tag('dEmi');
  const emissao = emissaoTexto ? new Date(emissaoTexto.length === 10 ? `${emissaoTexto}T12:00:00-03:00` : emissaoTexto) : undefined;
  const valor = Number(tag('vNF', total));
  return {
    numero: tag('nNF')?.replace(/^0+(?=\d)/, ''),
    serie: tag('serie'),
    emissao: emissao && !Number.isNaN(emissao.getTime()) ? emissao : undefined,
    valor: Number.isFinite(valor) && tag('vNF', total) ? valor : undefined,
    cnpjDestinatario: tag('CNPJ', dest),
  };
}

const ehPdf = (b: Buffer) => b.subarray(0, 5).toString('latin1') === '%PDF-';
const ehXml = (b: Buffer) => /^\s*(?:﻿)?</.test(b.subarray(0, 64).toString('utf8'));

async function lerArquivo(form: FormData, campo: string): Promise<{ nome: string; dados: Buffer } | null> {
  const f = form.get(campo);
  if (!(f instanceof File) || f.size === 0) return null;
  if (f.size > LIMITE_NOTA) throw new Error(`O arquivo ${f.name} passa de 20 MB.`);
  return { nome: f.name, dados: Buffer.from(await f.arrayBuffer()) };
}

/**
 * Cadastra a NF a partir do formulário (campos: pdf, xml, numero, serie, emissao, valor, situacao, projeto).
 * O que vier do XML vale mais que o digitado.
 */
export async function enviarNota(form: FormData, cliente: { id: number; cnpj: string }): Promise<{ erro?: string; numero?: string }> {
  let pdf, xml;
  try {
    pdf = await lerArquivo(form, 'pdf');
    xml = await lerArquivo(form, 'xml');
  } catch (e) {
    return { erro: (e as Error).message };
  }
  if (!pdf) return { erro: 'Escolha o PDF da nota (DANFE).' };
  if (!ehPdf(pdf.dados)) return { erro: 'O arquivo da nota não é um PDF.' };
  if (xml && !ehXml(xml.dados)) return { erro: 'O arquivo XML não é um XML.' };

  const doXml = xml ? lerXmlNfe(xml.dados.toString('utf8')) : null;
  if (doXml?.cnpjDestinatario && doXml.cnpjDestinatario !== cliente.cnpj) {
    return { erro: `O XML é de uma nota para o CNPJ ${formatarCnpj(doXml.cnpjDestinatario)}, não para este cliente (${formatarCnpj(cliente.cnpj)}).` };
  }
  const numero = doXml?.numero ?? texto(form, 'numero').replace(/^0+(?=\d)/, '');
  const serie = doXml?.serie ?? (texto(form, 'serie') || null);
  const emissao = doXml?.emissao ?? dataDoFormulario(texto(form, 'emissao'));
  const valor = doXml?.valor ?? valorEmReais(texto(form, 'valor'));
  const situacao = (SITUACOES_MANUAIS as readonly string[]).includes(texto(form, 'situacao')) ? texto(form, 'situacao') : 'Autorizada';
  if (!numero) return { erro: 'Informe o número da nota (ou envie o XML da NF-e).' };
  if (!emissao) return { erro: 'Informe a data de emissão (ou envie o XML da NF-e).' };

  const repetida = db
    .select({ id: schema.notasFiscais.id })
    .from(schema.notasFiscais)
    .where(and(eq(schema.notasFiscais.clienteId, cliente.id), eq(schema.notasFiscais.numero, numero)))
    .all()
    .length;
  if (repetida) return { erro: `A nota ${numero} já está no portal para este cliente. Remova a antiga antes de enviar de novo.` };

  const projetoId = projetoDoFormulario(form, cliente.id);
  const base = { clienteId: cliente.id, projetoId, categoria: 'nota_fiscal' as const, origem: 'upload' as const };
  db.transaction((tx) => {
    const pdfSalvo = guardarArquivo(pdf.dados, { ...base, nome: `NF-${numero}.pdf`, mime: 'application/pdf' });
    const xmlSalvo = xml ? guardarArquivo(xml.dados, { ...base, nome: `NF-${numero}.xml`, mime: 'application/xml' }) : null;
    tx.insert(schema.notasFiscais)
      .values({ clienteId: cliente.id, projetoId, origem: 'manual', numero, serie, emissao, valor, situacao, pdfArquivoId: pdfSalvo.id, xmlArquivoId: xmlSalvo?.id ?? null })
      .run();
  });
  return { numero };
}

/** Marca a nota como cancelada (ou autorizada de novo). Só notas manuais. */
export function mudarSituacao(notaId: number, clienteId: number | null, situacao: string): string | null {
  if (!(SITUACOES_MANUAIS as readonly string[]).includes(situacao)) return null;
  const nota = buscarManual(notaId, clienteId);
  if (!nota) return null;
  db.update(schema.notasFiscais).set({ situacao }).where(eq(schema.notasFiscais.id, nota.id)).run();
  return nota.numero;
}

/** Remove a nota manual e os arquivos dela. */
export function removerNota(notaId: number, clienteId: number | null): { numero: string; clienteId: number } | null {
  const nota = buscarManual(notaId, clienteId);
  if (!nota) return null;
  db.delete(schema.notasFiscais).where(eq(schema.notasFiscais.id, nota.id)).run();
  for (const id of [nota.pdfArquivoId, nota.xmlArquivoId]) {
    const a = id ? db.select().from(schema.arquivos).where(eq(schema.arquivos.id, id)).get() : undefined;
    if (a) removerArquivo(a);
  }
  return { numero: nota.numero, clienteId: nota.clienteId };
}

function buscarManual(notaId: number, clienteId: number | null) {
  if (!Number.isInteger(notaId)) return undefined;
  const filtros = [eq(schema.notasFiscais.id, notaId), eq(schema.notasFiscais.origem, 'manual')];
  if (clienteId != null) filtros.push(eq(schema.notasFiscais.clienteId, clienteId));
  return db.select().from(schema.notasFiscais).where(and(...filtros)).get();
}
