// Leitura do Confluence (API REST v2). Só leitura: o portal nunca altera o Confluence.
// Credenciais no .env: CONFLUENCE_EMAIL + CONFLUENCE_TOKEN (token de API da conta Atlassian).

const BASE = (process.env.CONFLUENCE_URL ?? 'https://dccircuitlabs.atlassian.net/wiki').replace(/\/$/, '');
export const ESPACO = process.env.CONFLUENCE_ESPACO ?? 'PORTAL';

export interface PaginaResumo {
  id: string;
  title: string;
  status?: string;
}

export interface Pagina extends PaginaResumo {
  version: { number: number };
  body: { export_view?: { value: string } };
}

export interface Anexo {
  id: string;
  title: string;
  mediaType?: string;
  fileSize?: number;
  version?: { number: number };
  downloadLink: string;
}

export function confluenceConfigurado(): boolean {
  return Boolean(process.env.CONFLUENCE_EMAIL && process.env.CONFLUENCE_TOKEN);
}

function autorizacao() {
  return 'Basic ' + Buffer.from(`${process.env.CONFLUENCE_EMAIL}:${process.env.CONFLUENCE_TOKEN}`).toString('base64');
}

async function pedir(caminho: string): Promise<Response> {
  // Os links de paginação (_links.next) já vêm com "/wiki/..."; os de download vêm relativos à base.
  const url = caminho.startsWith('http') ? caminho : caminho.startsWith('/wiki/') ? new URL(BASE).origin + caminho : BASE + caminho;
  const r = await fetch(url, { headers: { authorization: autorizacao(), accept: 'application/json' }, redirect: 'follow' });
  if (!r.ok) throw new Error(`Confluence respondeu ${r.status} em ${caminho.split('?')[0]}`);
  return r;
}

async function json<T>(caminho: string): Promise<T> {
  return (await pedir(caminho)).json() as Promise<T>;
}

/** Percorre todas as páginas de uma listagem paginada (_links.next). */
async function todos<T>(caminho: string): Promise<T[]> {
  const itens: T[] = [];
  let proximo: string | undefined = caminho;
  while (proximo) {
    const r: { results: T[]; _links?: { next?: string } } = await json(proximo);
    itens.push(...r.results);
    proximo = r._links?.next;
  }
  return itens;
}

export async function espaco(): Promise<{ id: string; homepageId?: string }> {
  const r = await json<{ results: { id: string; key: string; homepageId?: string }[] }>(`/api/v2/spaces?keys=${encodeURIComponent(ESPACO)}`);
  const e = r.results[0];
  if (!e) throw new Error(`Espaço "${ESPACO}" não encontrado no Confluence`);
  return { id: e.id, homepageId: e.homepageId };
}

/**
 * Páginas de cliente: no Confluence Cloud as páginas do espaço ficam abaixo da página inicial (Home),
 * então os clientes são as filhas dela — mais qualquer outra página solta na raiz.
 */
export async function paginasDeCliente(): Promise<PaginaResumo[]> {
  const { id, homepageId } = await espaco();
  const raiz = await todos<PaginaResumo>(`/api/v2/spaces/${id}/pages?depth=root&status=current&limit=250`);
  const soltas = raiz.filter((p) => p.id !== homepageId);
  return homepageId ? [...(await filhas(homepageId)), ...soltas] : soltas;
}

export function filhas(paginaId: string) {
  return todos<PaginaResumo>(`/api/v2/pages/${paginaId}/children?limit=250`);
}

export function pagina(paginaId: string) {
  return json<Pagina>(`/api/v2/pages/${paginaId}?body-format=export_view`);
}

export async function rotulos(paginaId: string): Promise<string[]> {
  return (await todos<{ name: string }>(`/api/v2/pages/${paginaId}/labels?limit=250`)).map((l) => l.name.toLowerCase());
}

export function anexos(paginaId: string) {
  return todos<Anexo>(`/api/v2/pages/${paginaId}/attachments?limit=250`);
}

export async function baixarAnexo(anexo: Anexo): Promise<Buffer> {
  return Buffer.from(await (await pedir(anexo.downloadLink)).arrayBuffer());
}
