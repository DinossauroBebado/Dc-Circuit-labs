// Publicação Confluence → portal.
//
// Espaço PORTAL:  página do cliente (com o CNPJ escrito nela), filha da página inicial do espaço
//                 └─ página do projeto (tabela opcional: Status | …, Valor | …)
//                    └─ página da versão (a documentação + anexos)
// Rótulo "rascunho" em qualquer página: ela (e o que estiver abaixo) não é publicada.
// Rótulo "modelo" ou "ignorar" numa página raiz: não é cliente (modelos de página, instruções).
import { and, eq, inArray, notInArray } from 'drizzle-orm';
import { db, schema } from '../db';
import { guardarArquivo, removerArquivo, categoriaDeAnexo } from './arquivos';
import * as confluence from './confluence';
import { otimizarGlb } from './glb';
import { cnpjDaPagina, propriedades, renderizarPagina, rotuloDaVersao, slug, valorEmReais } from './renderizar';

const IGNORAR = ['rascunho', 'modelo', 'ignorar'];

export interface Relatorio {
  paginas: number;
  anexosBaixados: number;
  avisos: string[];
}

function registrarInicio(adminId?: number) {
  return db.insert(schema.sincronizacoes).values({ fonte: 'confluence', adminId: adminId ?? null }).returning().get();
}

function registrarFim(id: number, status: 'ok' | 'erro', log: string) {
  db.update(schema.sincronizacoes).set({ fim: new Date(), status, log }).where(eq(schema.sincronizacoes.id, id)).run();
}

/** Publica todo o espaço, ou só a página de um cliente (`paginaClienteId`). `forcar` reprocessa o que não mudou. */
export async function publicar(opcoes: { paginaClienteId?: string; forcar?: boolean; adminId?: number } = {}): Promise<Relatorio> {
  const sinc = registrarInicio(opcoes.adminId);
  const rel: Relatorio = { paginas: 0, anexosBaixados: 0, avisos: [] };
  try {
    if (!confluence.confluenceConfigurado()) throw new Error('Confluence não configurado (CONFLUENCE_EMAIL e CONFLUENCE_TOKEN no .env).');
    const raiz = opcoes.paginaClienteId
      ? [{ id: opcoes.paginaClienteId, title: '' }]
      : await confluence.paginasDeCliente();
    for (const p of raiz) await publicarCliente(p.id, rel, Boolean(opcoes.forcar));
    registrarFim(sinc.id, 'ok', resumo(rel));
    return rel;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    rel.avisos.push(`Erro: ${msg}`);
    registrarFim(sinc.id, 'erro', resumo(rel));
    return rel;
  }
}

function resumo(rel: Relatorio) {
  return [`${rel.paginas} página(s) publicada(s), ${rel.anexosBaixados} anexo(s) baixado(s).`, ...rel.avisos].join('\n');
}

async function publicarCliente(paginaId: string, rel: Relatorio, forcar: boolean) {
  const [pagina, rotulos] = await Promise.all([confluence.pagina(paginaId), confluence.rotulos(paginaId)]);
  if (rotulos.some((r) => IGNORAR.includes(r))) return;
  const cnpj = cnpjDaPagina(pagina.body.export_view?.value ?? '');
  if (!cnpj) {
    rel.avisos.push(`"${pagina.title}": nenhum CNPJ válido escrito na página — não publicada.`);
    return;
  }
  const cliente = db.select().from(schema.clientes).where(eq(schema.clientes.cnpj, cnpj)).get();
  if (!cliente) {
    rel.avisos.push(`"${pagina.title}": o CNPJ ${cnpj} não está cadastrado no portal. Cadastre o cliente no painel e publique de novo.`);
    return;
  }
  db.update(schema.clientes).set({ confluencePageId: paginaId }).where(eq(schema.clientes.id, cliente.id)).run();

  const vistos: number[] = [];
  for (const filha of await confluence.filhas(paginaId)) {
    const projetoId = await publicarProjeto(cliente.id, filha.id, rel, forcar);
    if (projetoId) vistos.push(projetoId);
  }
  // Projetos que saíram do Confluence (ou viraram rascunho) saem do portal.
  const sairam = db
    .select()
    .from(schema.projetos)
    .where(and(eq(schema.projetos.clienteId, cliente.id), vistos.length ? notInArray(schema.projetos.id, vistos) : undefined))
    .all()
    .filter((p) => p.confluencePageId);
  for (const p of sairam) removerProjeto(p.id);
}

async function publicarProjeto(clienteId: number, paginaId: string, rel: Relatorio, forcar: boolean): Promise<number | null> {
  const [pagina, rotulos] = await Promise.all([confluence.pagina(paginaId), confluence.rotulos(paginaId)]);
  if (rotulos.some((r) => IGNORAR.includes(r))) return null;
  const props = propriedades(pagina.body.export_view?.value ?? '');
  const dados = {
    clienteId,
    nome: pagina.title.trim(),
    slug: slugLivre(clienteId, slug(pagina.title), paginaId),
    status: props.status ?? props.situacao ?? null,
    valorTotal: valorEmReais(props.valor ?? props.valor_total),
    confluencePageId: paginaId,
  };
  const existente = db.select().from(schema.projetos).where(eq(schema.projetos.confluencePageId, paginaId)).get();
  const projeto = existente
    ? db.update(schema.projetos).set(dados).where(eq(schema.projetos.id, existente.id)).returning().get()
    : db.insert(schema.projetos).values(dados).returning().get();

  const vistos: number[] = [];
  let mudou = false;
  for (const filha of await confluence.filhas(paginaId)) {
    const r = await publicarVersao(projeto, filha.id, rel, forcar);
    if (r) {
      vistos.push(r.id);
      mudou ||= r.mudou;
    }
  }
  const sairam = db
    .select()
    .from(schema.documentos)
    .where(and(eq(schema.documentos.projetoId, projeto.id), vistos.length ? notInArray(schema.documentos.id, vistos) : undefined))
    .all();
  for (const d of sairam) removerDocumento(d.id);
  if (mudou || sairam.length || !existente) {
    db.update(schema.projetos).set({ atualizadoEm: new Date() }).where(eq(schema.projetos.id, projeto.id)).run();
  }
  return projeto.id;
}

type Projeto = typeof schema.projetos.$inferSelect;

// Dois projetos (ou duas versões) com o mesmo nome: o segundo ganha um sufixo para não colidir.
function slugLivre(clienteId: number, desejado: string, paginaId: string): string {
  const outro = db
    .select()
    .from(schema.projetos)
    .where(and(eq(schema.projetos.clienteId, clienteId), eq(schema.projetos.slug, desejado)))
    .get();
  return outro && outro.confluencePageId !== paginaId ? `${desejado}-${paginaId.slice(-4)}` : desejado;
}

function versaoLivre(projetoId: number, desejada: string, paginaId: string): string {
  const outra = db
    .select()
    .from(schema.documentos)
    .where(and(eq(schema.documentos.projetoId, projetoId), eq(schema.documentos.versao, desejada)))
    .get();
  return outra && outra.confluencePageId !== paginaId ? `${desejada} (${paginaId.slice(-4)})` : desejada;
}

async function publicarVersao(projeto: Projeto, paginaId: string, rel: Relatorio, forcar: boolean): Promise<{ id: number; mudou: boolean } | null> {
  const [pagina, rotulos] = await Promise.all([confluence.pagina(paginaId), confluence.rotulos(paginaId)]);
  if (rotulos.some((r) => IGNORAR.includes(r))) return null;
  const existente = db.select().from(schema.documentos).where(eq(schema.documentos.confluencePageId, paginaId)).get();
  if (existente && !forcar && existente.confluenceVersao === pagina.version.number) return { id: existente.id, mudou: false };

  // Documento primeiro (os anexos ficam ligados a ele), conteúdo em seguida.
  const versao = versaoLivre(projeto.id, rotuloDaVersao(pagina.title), paginaId);
  const base = { projetoId: projeto.id, versao, titulo: pagina.title.trim(), confluencePageId: paginaId };
  const doc = existente
    ? db.update(schema.documentos).set(base).where(eq(schema.documentos.id, existente.id)).returning().get()
    : db.insert(schema.documentos).values({ ...base, html: '' }).returning().get();

  // Anexos: baixa só os novos ou alterados (pela versão do anexo no Confluence).
  const atuais = db.select().from(schema.arquivos).where(eq(schema.arquivos.documentoId, doc.id)).all();
  const porNome = new Map<string, typeof schema.arquivos.$inferSelect>();
  const manter: number[] = [];
  for (const anexo of await confluence.anexos(paginaId)) {
    const versaoAnexo = anexo.version?.number ?? 1;
    const igual = atuais.find((a) => a.origemId === anexo.id && a.origemVersao === versaoAnexo);
    if (igual) {
      porNome.set(anexo.title, igual);
      manter.push(igual.id);
      continue;
    }
    let dados = await confluence.baixarAnexo(anexo);
    if (anexo.title.toLowerCase().endsWith('.glb')) dados = await otimizarGlb(dados);
    const novo = guardarArquivo(dados, {
      clienteId: projeto.clienteId,
      projetoId: projeto.id,
      documentoId: doc.id,
      categoria: categoriaDeAnexo(anexo.title),
      nome: anexo.title,
      origem: 'confluence',
      origemId: anexo.id,
      origemVersao: versaoAnexo,
    });
    rel.anexosBaixados++;
    porNome.set(anexo.title, novo);
    manter.push(novo.id);
  }
  for (const velho of atuais) if (!manter.includes(velho.id)) removerArquivo(velho);

  const { html, sumario } = renderizarPagina(pagina.body.export_view?.value ?? '', (nome) => {
    const a = porNome.get(nome);
    return a ? `/arquivos/${a.id}` : null;
  });
  db.update(schema.documentos)
    .set({ html, sumario, confluenceVersao: pagina.version.number, publicadoEm: new Date() })
    .where(eq(schema.documentos.id, doc.id))
    .run();
  rel.paginas++;
  return { id: doc.id, mudou: true };
}

function removerDocumento(id: number) {
  for (const a of db.select().from(schema.arquivos).where(eq(schema.arquivos.documentoId, id)).all()) removerArquivo(a);
  db.delete(schema.documentos).where(eq(schema.documentos.id, id)).run();
}

function removerProjeto(id: number) {
  const docs = db.select({ id: schema.documentos.id }).from(schema.documentos).where(eq(schema.documentos.projetoId, id)).all();
  for (const d of docs) removerDocumento(d.id);
  // Arquivos do projeto que não são da documentação (NF, contratos) ficam com o cliente.
  db.update(schema.arquivos).set({ projetoId: null }).where(and(eq(schema.arquivos.projetoId, id), inArray(schema.arquivos.origem, ['bling', 'upload']))).run();
  db.delete(schema.projetos).where(eq(schema.projetos.id, id)).run();
}
