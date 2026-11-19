// Financeiro (parcelas do Bling), fiscal (NF-e do Bling) e jurídico (contratos enviados pelo painel).
// As funções "doCliente" recebem o id da sessão: nunca o id que vem da URL.
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db, schema } from '../db';
import { NF_VISIVEIS } from './bling';

export type Parcela = typeof schema.parcelas.$inferSelect;
export type Estado = 'paga' | 'parcial' | 'a_vencer' | 'vence_logo' | 'atrasada' | 'cancelada';

export const ROTULO_ESTADO: Record<Estado, string> = {
  paga: 'paga',
  parcial: 'paga em parte',
  a_vencer: 'a vencer',
  vence_logo: 'vence em breve',
  atrasada: 'atrasada',
  cancelada: 'cancelada',
};

export const CLASSE_ESTADO: Record<Estado, string> = {
  paga: 'etiqueta--ok',
  parcial: 'etiqueta--alerta',
  a_vencer: '',
  vence_logo: 'etiqueta--alerta',
  atrasada: 'etiqueta--erro',
  cancelada: '',
};

const DIA = 24 * 3600 * 1000;
/** "Vence em breve": dentro dos próximos 7 dias. */
export const JANELA_VENCIMENTO = 7 * DIA;

function inicioDoDia(d = new Date()): number {
  // meia-noite em São Paulo (UTC−3, sem horário de verão desde 2019)
  const sp = new Date(d.getTime() - 3 * 3600 * 1000);
  return Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth(), sp.getUTCDate()) + 3 * 3600 * 1000;
}

export function estadoDaParcela(p: Parcela, agora = new Date()): Estado {
  if (p.situacao === 'Cancelado' || p.situacao === 'Devolvido') return 'cancelada';
  if (p.situacao === 'Recebido' || p.valorPago >= p.valor - 0.005) return 'paga';
  const hoje = inicioDoDia(agora);
  if (p.vencimento.getTime() < hoje) return 'atrasada';
  if (p.valorPago > 0) return 'parcial';
  return p.vencimento.getTime() < hoje + JANELA_VENCIMENTO ? 'vence_logo' : 'a_vencer';
}

export interface Resumo {
  total: number;
  pago: number;
  aReceber: number;
  vencido: number;
}

/** Soma ignorando parcelas canceladas/devolvidas. */
export function resumir(parcelas: Parcela[], agora = new Date()): Resumo {
  const r: Resumo = { total: 0, pago: 0, aReceber: 0, vencido: 0 };
  for (const p of parcelas) {
    const estado = estadoDaParcela(p, agora);
    if (estado === 'cancelada') continue;
    const falta = Math.max(0, p.valor - p.valorPago);
    r.total += p.valor;
    r.pago += Math.min(p.valorPago, p.valor);
    r.aReceber += falta;
    if (estado === 'atrasada') r.vencido += falta;
  }
  return r;
}

export function diasDeAtraso(p: Parcela, agora = new Date()): number {
  return Math.max(0, Math.floor((inicioDoDia(agora) - inicioDoDia(p.vencimento)) / DIA));
}

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function formatarReais(v: number | null | undefined): string {
  return v == null ? '—' : reais.format(v);
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1).replace('.', ',')} MB`;
}

// ---------- Consultas ----------

export function parcelasDoCliente(clienteId: number) {
  return db.select().from(schema.parcelas).where(eq(schema.parcelas.clienteId, clienteId)).orderBy(asc(schema.parcelas.vencimento)).all();
}

/** Só as NF que fazem sentido para o cliente (sem rascunhos, rejeitadas, pendentes). */
export function notasDoCliente(clienteId: number) {
  return db
    .select()
    .from(schema.notasFiscais)
    .where(and(eq(schema.notasFiscais.clienteId, clienteId), inArray(schema.notasFiscais.situacao, NF_VISIVEIS)))
    .orderBy(desc(schema.notasFiscais.emissao))
    .all();
}

export function contratosDoCliente(clienteId: number) {
  return db
    .select({ contrato: schema.contratos, arquivo: schema.arquivos })
    .from(schema.contratos)
    .innerJoin(schema.arquivos, eq(schema.arquivos.id, schema.contratos.arquivoId))
    .where(eq(schema.contratos.clienteId, clienteId))
    .orderBy(desc(schema.contratos.assinadoEm), desc(schema.contratos.id))
    .all();
}

/** Nome dos projetos do cliente por id (para mostrar a que projeto a parcela/NF/contrato pertence). */
export function nomesDeProjetos(clienteId?: number): Map<number, string> {
  const consulta = db.select({ id: schema.projetos.id, nome: schema.projetos.nome }).from(schema.projetos);
  const linhas = clienteId == null ? consulta.all() : consulta.where(eq(schema.projetos.clienteId, clienteId)).all();
  return new Map(linhas.map((p) => [p.id, p.nome]));
}

// ---------- Painel (todos os clientes) ----------

export function todasAsParcelas() {
  return db
    .select({ parcela: schema.parcelas, cliente: { id: schema.clientes.id, razaoSocial: schema.clientes.razaoSocial } })
    .from(schema.parcelas)
    .innerJoin(schema.clientes, eq(schema.clientes.id, schema.parcelas.clienteId))
    .orderBy(asc(schema.parcelas.vencimento))
    .all();
}

export function todasAsNotas() {
  return db
    .select({ nota: schema.notasFiscais, cliente: { id: schema.clientes.id, razaoSocial: schema.clientes.razaoSocial } })
    .from(schema.notasFiscais)
    .innerJoin(schema.clientes, eq(schema.clientes.id, schema.notasFiscais.clienteId))
    .orderBy(desc(schema.notasFiscais.emissao))
    .all();
}

export function todosOsContratos() {
  return db
    .select({
      contrato: schema.contratos,
      arquivo: schema.arquivos,
      cliente: { id: schema.clientes.id, razaoSocial: schema.clientes.razaoSocial },
    })
    .from(schema.contratos)
    .innerJoin(schema.arquivos, eq(schema.arquivos.id, schema.contratos.arquivoId))
    .innerJoin(schema.clientes, eq(schema.clientes.id, schema.contratos.clienteId))
    .orderBy(desc(schema.contratos.assinadoEm), desc(schema.contratos.id))
    .all();
}

/** NF emitidas no mês corrente (São Paulo), sem canceladas. */
export function notasDoMes(agora = new Date()) {
  const sp = new Date(agora.getTime() - 3 * 3600 * 1000);
  const inicio = Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth(), 1) + 3 * 3600 * 1000;
  return todasAsNotas().filter((n) => n.nota.emissao && n.nota.emissao.getTime() >= inicio && n.nota.situacao !== 'Cancelada' && NF_VISIVEIS.includes(n.nota.situacao ?? ''));
}

// ---------- Avisos da página inicial do cliente ----------

export interface AvisoCliente {
  tipo: 'atrasada' | 'vence_logo' | 'nf_nova' | 'contrato_novo';
  texto: string;
  href: string;
}

/** Parcela atrasada ou vencendo em 7 dias; NF e contrato chegados nos últimos 15 dias. */
export function avisosDoCliente(clienteId: number, agora = new Date()): AvisoCliente[] {
  const avisos: AvisoCliente[] = [];
  const parcelas = parcelasDoCliente(clienteId);
  const atrasadas = parcelas.filter((p) => estadoDaParcela(p, agora) === 'atrasada');
  const logo = parcelas.filter((p) => estadoDaParcela(p, agora) === 'vence_logo');
  if (atrasadas.length) {
    const soma = atrasadas.reduce((s, p) => s + p.valor - p.valorPago, 0);
    avisos.push({
      tipo: 'atrasada',
      texto: `${atrasadas.length === 1 ? '1 parcela em atraso' : `${atrasadas.length} parcelas em atraso`} (${formatarReais(soma)}).`,
      href: '/financeiro',
    });
  }
  for (const p of logo) {
    avisos.push({
      tipo: 'vence_logo',
      texto: `Parcela de ${formatarReais(p.valor - p.valorPago)} vence em ${p.vencimento.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.`,
      href: '/financeiro',
    });
  }
  const recente = agora.getTime() - 15 * DIA;
  const notas = notasDoCliente(clienteId).filter((n) => n.situacao !== 'Cancelada' && n.criadoEm.getTime() >= recente);
  if (notas.length) {
    avisos.push({
      tipo: 'nf_nova',
      texto: notas.length === 1 ? `Nova nota fiscal disponível: NF ${notas[0].numero}.` : `${notas.length} novas notas fiscais disponíveis.`,
      href: '/notas',
    });
  }
  const contratos = contratosDoCliente(clienteId).filter((c) => c.contrato.criadoEm.getTime() >= recente);
  if (contratos.length) {
    avisos.push({ tipo: 'contrato_novo', texto: `Novo contrato disponível: ${contratos[0].contrato.titulo}.`, href: '/contratos' });
  }
  return avisos;
}
