// Integração com o Bling (API v3): notas fiscais e contas a receber de cada cliente, pelo CNPJ.
// Só leitura no Bling. Credenciais do app no .env (BLING_CLIENT_ID, BLING_CLIENT_SECRET); os tokens
// ficam na tabela `configuracoes` e se renovam sozinhos.
import { and, eq, notInArray } from 'drizzle-orm';
import { db, schema } from '../db';
import { guardarArquivo } from './arquivos';

const API = (process.env.BLING_API_URL ?? 'https://api.bling.com.br/Api/v3').replace(/\/$/, '');
const OAUTH = (process.env.BLING_OAUTH_URL ?? 'https://www.bling.com.br/Api/v3/oauth').replace(/\/$/, '');
const CHAVE_TOKENS = 'bling_tokens';
const PAUSA_MS = Number(process.env.BLING_PAUSA_MS ?? 350); // a API aceita ~3 pedidos por segundo

export const SITUACAO_NF: Record<number, string> = {
  1: 'Pendente', 2: 'Cancelada', 3: 'Aguardando recibo', 4: 'Rejeitada', 5: 'Autorizada', 6: 'Emitida', 7: 'Registrada',
  8: 'Aguardando protocolo', 9: 'Denegada', 10: 'Consultando situação', 11: 'Bloqueada',
};
/** Notas que o cliente vê: autorizadas/emitidas/registradas e as canceladas (com a etiqueta). */
export const NF_VISIVEIS = ['Autorizada', 'Emitida', 'Registrada', 'Cancelada'];

export const SITUACAO_CONTA: Record<number, string> = { 1: 'Em aberto', 2: 'Recebido', 3: 'Parcialmente recebido', 4: 'Devolvido', 5: 'Cancelado' };

interface Tokens {
  acesso: string;
  renovacao: string;
  expiraEm: number;
}

/** Integração ligada? (BLING_ATIVO=true no .env). Desligada: notas fiscais só pelo envio manual no painel. */
export const BLING_ATIVO = process.env.BLING_ATIVO === 'true';

export function blingConfigurado(): boolean {
  return Boolean(process.env.BLING_CLIENT_ID && process.env.BLING_CLIENT_SECRET);
}

export function blingConectado(): boolean {
  return Boolean(lerTokens());
}

function lerTokens(): Tokens | null {
  const linha = db.select().from(schema.configuracoes).where(eq(schema.configuracoes.chave, CHAVE_TOKENS)).get();
  return linha ? (JSON.parse(linha.valor) as Tokens) : null;
}

function gravarTokens(t: { access_token: string; refresh_token: string; expires_in: number }) {
  const valor = JSON.stringify({ acesso: t.access_token, renovacao: t.refresh_token, expiraEm: Date.now() + (t.expires_in - 120) * 1000 } satisfies Tokens);
  db.insert(schema.configuracoes)
    .values({ chave: CHAVE_TOKENS, valor })
    .onConflictDoUpdate({ target: schema.configuracoes.chave, set: { valor, atualizadoEm: new Date() } })
    .run();
}

export function desconectarBling() {
  db.delete(schema.configuracoes).where(eq(schema.configuracoes.chave, CHAVE_TOKENS)).run();
}

export function urlDeAutorizacao(estado: string): string {
  return `${OAUTH}/authorize?response_type=code&client_id=${encodeURIComponent(process.env.BLING_CLIENT_ID ?? '')}&state=${encodeURIComponent(estado)}`;
}

async function pedirToken(corpo: Record<string, string>) {
  const basic = Buffer.from(`${process.env.BLING_CLIENT_ID}:${process.env.BLING_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`${OAUTH}/token`, {
    method: 'POST',
    headers: { authorization: `Basic ${basic}`, 'content-type': 'application/x-www-form-urlencoded', accept: '1.0' },
    body: new URLSearchParams(corpo),
  });
  if (!r.ok) throw new Error(`Bling recusou o token (${r.status})`);
  gravarTokens(await r.json());
}

/** Troca o código do retorno do OAuth pelos tokens. */
export function concluirAutorizacao(codigo: string) {
  return pedirToken({ grant_type: 'authorization_code', code: codigo });
}

async function tokenValido(): Promise<string> {
  let t = lerTokens();
  if (!t) throw new Error('Bling não conectado. Use "Conectar Bling" no painel.');
  if (Date.now() > t.expiraEm) {
    await pedirToken({ grant_type: 'refresh_token', refresh_token: t.renovacao });
    t = lerTokens()!;
  }
  return t.acesso;
}

const pausa = () => new Promise((r) => setTimeout(r, PAUSA_MS));

async function api<T>(caminho: string): Promise<T> {
  await pausa();
  const r = await fetch(API + caminho, { headers: { authorization: `Bearer ${await tokenValido()}`, accept: 'application/json' } });
  if (r.status === 404) return { data: [] } as T;
  if (!r.ok) throw new Error(`Bling respondeu ${r.status} em ${caminho.split('?')[0]}`);
  return r.json() as Promise<T>;
}

/** Todas as páginas de uma listagem (100 por página). */
async function todasAsPaginas<T>(caminho: string): Promise<T[]> {
  const itens: T[] = [];
  for (let pagina = 1; pagina < 1000; pagina++) {
    const sep = caminho.includes('?') ? '&' : '?';
    const { data } = await api<{ data: T[] }>(`${caminho}${sep}pagina=${pagina}&limite=100`);
    itens.push(...data);
    if (data.length < 100) break;
  }
  return itens;
}

async function baixar(url: string): Promise<Buffer | null> {
  try {
    await pausa();
    const r = await fetch(url);
    return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

const data = (texto?: string | null) => {
  if (!texto || texto.startsWith('0000')) return null;
  const d = new Date(texto.length <= 10 ? `${texto}T12:00:00-03:00` : `${texto.replace(' ', 'T')}-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

interface NfLista {
  id: number;
  numero: string;
  situacao: number;
  dataEmissao: string;
  contato?: { numeroDocumento?: string };
}
interface NfDetalhe extends NfLista {
  serie?: number;
  valorNota?: number;
  linkPDF?: string;
  linkDanfe?: string;
  xml?: string;
}
interface ContaReceber {
  id: number;
  situacao: number;
  vencimento: string;
  valor: number;
  saldo?: number;
  origem?: { tipoOrigem?: string; numero?: string };
}

export interface RelatorioBling {
  clientes: number;
  notas: number;
  parcelas: number;
  avisos: string[];
}

export async function sincronizarBling(adminId?: number): Promise<RelatorioBling> {
  const sinc = db.insert(schema.sincronizacoes).values({ fonte: 'bling', adminId: adminId ?? null }).returning().get();
  const rel: RelatorioBling = { clientes: 0, notas: 0, parcelas: 0, avisos: [] };
  const fim = (status: 'ok' | 'erro') =>
    db.update(schema.sincronizacoes)
      .set({ fim: new Date(), status, log: [`${rel.clientes} cliente(s), ${rel.notas} nota(s) nova(s) ou atualizada(s), ${rel.parcelas} parcela(s).`, ...rel.avisos].join('\n') })
      .where(eq(schema.sincronizacoes.id, sinc.id))
      .run();
  try {
    if (!blingConfigurado()) throw new Error('Bling não configurado (BLING_CLIENT_ID e BLING_CLIENT_SECRET no .env).');
    const clientes = db.select().from(schema.clientes).where(eq(schema.clientes.ativo, true)).all();

    // 1. Contato do Bling de cada cliente (pelo CNPJ)
    for (const c of clientes) {
      if (c.blingContatoId) continue;
      const { data: contatos } = await api<{ data: { id: number }[] }>(`/contatos?numeroDocumento=${c.cnpj}`);
      if (contatos[0]) {
        c.blingContatoId = String(contatos[0].id);
        db.update(schema.clientes).set({ blingContatoId: c.blingContatoId }).where(eq(schema.clientes.id, c.id)).run();
      } else rel.avisos.push(`${c.razaoSocial}: nenhum contato no Bling com o CNPJ ${c.cnpj}.`);
    }
    const comContato = clientes.filter((c) => c.blingContatoId);
    rel.clientes = comContato.length;

    // 2. Contas a receber → parcelas
    for (const c of comContato) {
      const contas = await todasAsPaginas<ContaReceber>(`/contas/receber?idContato=${c.blingContatoId}&dataInicial=2020-01-01&tipoFiltroData=E`);
      const vistas: string[] = [];
      for (const conta of contas) {
        let valorPago = conta.situacao === 2 ? conta.valor : 0;
        if (conta.situacao === 3) {
          const { data: det } = await api<{ data: ContaReceber }>(`/contas/receber/${conta.id}`);
          if (typeof det?.saldo === 'number') valorPago = Math.max(0, conta.valor - det.saldo);
        }
        const dados = {
          clienteId: c.id,
          blingContaId: String(conta.id),
          descricao: conta.origem?.tipoOrigem === 'notafiscal' && conta.origem.numero ? `NF ${conta.origem.numero}` : null,
          vencimento: data(conta.vencimento) ?? new Date(),
          valor: conta.valor,
          valorPago,
          situacao: SITUACAO_CONTA[conta.situacao] ?? String(conta.situacao),
        };
        const { clienteId: _cliente, ...atualizacao } = dados; // o projeto associado no painel é preservado
        db.insert(schema.parcelas).values(dados).onConflictDoUpdate({ target: schema.parcelas.blingContaId, set: atualizacao }).run();
        vistas.push(dados.blingContaId);
        rel.parcelas++;
      }
      // Conta apagada no Bling sai do portal
      db.delete(schema.parcelas)
        .where(and(eq(schema.parcelas.clienteId, c.id), vistas.length ? notInArray(schema.parcelas.blingContaId, vistas) : undefined))
        .run();
    }

    // 3. Notas fiscais de saída (a listagem do Bling não filtra por contato: separa pelo CNPJ da nota)
    const porCnpj = new Map(comContato.map((c) => [c.cnpj, c]));
    const notas = await todasAsPaginas<NfLista>('/nfe?tipo=1&dataEmissaoInicial=2020-01-01%2000:00:00');
    const vistas = new Set<string>();
    for (const nf of notas) {
      const cliente = porCnpj.get(nf.contato?.numeroDocumento?.replace(/\D/g, '') ?? '');
      if (!cliente) continue;
      vistas.add(String(nf.id));
      await sincronizarNota(cliente.id, nf.id, SITUACAO_NF[nf.situacao] ?? String(nf.situacao), rel);
    }
    // Notas que sumiram da listagem (a listagem esconde as canceladas): confere a situação uma a uma.
    for (const antiga of db.select().from(schema.notasFiscais).where(eq(schema.notasFiscais.origem, 'bling')).all()) {
      if (!antiga.blingId || vistas.has(antiga.blingId) || antiga.situacao === 'Cancelada') continue;
      const { data: det } = await api<{ data: NfDetalhe | NfDetalhe[] }>(`/nfe/${antiga.blingId}`);
      const situacao = !Array.isArray(det) && det?.situacao ? SITUACAO_NF[det.situacao] : 'Cancelada';
      if (situacao !== antiga.situacao) {
        db.update(schema.notasFiscais).set({ situacao }).where(eq(schema.notasFiscais.id, antiga.id)).run();
        rel.notas++;
      }
    }
    fim('ok');
  } catch (e) {
    rel.avisos.push(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    fim('erro');
  }
  return rel;
}

async function sincronizarNota(clienteId: number, blingId: number, situacaoLista: string, rel: RelatorioBling) {
  const existente = db.select().from(schema.notasFiscais).where(eq(schema.notasFiscais.blingId, String(blingId))).get();
  if (existente && existente.situacao === situacaoLista && existente.pdfArquivoId) return;

  const { data: nf } = await api<{ data: NfDetalhe }>(`/nfe/${blingId}`);
  const situacao = SITUACAO_NF[nf.situacao] ?? situacaoLista;
  let pdfArquivoId = existente?.pdfArquivoId ?? null;
  let xmlArquivoId = existente?.xmlArquivoId ?? null;
  const base = { clienteId, categoria: 'nota_fiscal' as const, origem: 'bling' as const, origemId: String(blingId) };
  if (!pdfArquivoId && (nf.linkPDF || nf.linkDanfe)) {
    const pdf = await baixar((nf.linkPDF ?? nf.linkDanfe)!);
    if (pdf) pdfArquivoId = guardarArquivo(pdf, { ...base, nome: `NF-${nf.numero}.pdf`, mime: 'application/pdf' }).id;
  }
  if (!xmlArquivoId && nf.xml) {
    const xml = await baixar(nf.xml);
    if (xml) xmlArquivoId = guardarArquivo(xml, { ...base, nome: `NF-${nf.numero}.xml`, mime: 'application/xml' }).id;
  }
  const dados = {
    clienteId,
    blingId: String(blingId),
    numero: nf.numero,
    serie: nf.serie != null ? String(nf.serie) : null,
    emissao: data(nf.dataEmissao),
    valor: nf.valorNota ?? null,
    situacao,
    pdfArquivoId,
    xmlArquivoId,
  };
  if (existente) db.update(schema.notasFiscais).set({ ...dados, clienteId: existente.clienteId }).where(eq(schema.notasFiscais.id, existente.id)).run();
  else db.insert(schema.notasFiscais).values(dados).run();
  rel.notas++;
}

