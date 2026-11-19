// Arquivos protegidos (anexos do Confluence, NF do Bling, contratos). Ficam em ARQUIVOS_DIR, fora da pasta
// pública; só saem pela rota /arquivos/<id>, depois de conferir se o arquivo é do cliente logado.
import { createHash } from 'node:crypto';
import { chmodSync, createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';

export const ARQUIVOS_DIR = resolve(process.env.ARQUIVOS_DIR ?? './dados/arquivos');
// No VPS o Nginx entrega o arquivo (X-Accel-Redirect): mais rápido e com suporte a vídeo/Range de graça.
const USAR_NGINX = process.env.ARQUIVOS_X_ACCEL === 'true';

export type Arquivo = typeof schema.arquivos.$inferSelect;
export type Categoria = Arquivo['categoria'];

const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/mp4',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.zip': 'application/zip',
  '.step': 'model/step',
  '.stp': 'model/step',
  '.xml': 'application/xml',
};

export function mimeDe(nome: string): string {
  return MIME[extname(nome).toLowerCase()] ?? 'application/octet-stream';
}

/** Como o portal mostra o anexo de uma documentação. */
export function tipoDeExibicao(nome: string): 'modelo3d' | 'video' | 'pdf' | 'ibom' | 'imagem' | 'download' {
  const ext = extname(nome).toLowerCase();
  if (ext === '.glb') return 'modelo3d';
  if (['.mp4', '.webm'].includes(ext)) return 'video';
  if (ext === '.pdf') return 'pdf';
  if (['.html', '.htm'].includes(ext) && /ibom|interactive.?bom/i.test(nome)) return 'ibom';
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) return 'imagem';
  return 'download';
}

export function categoriaDeAnexo(nome: string): Categoria {
  const t = tipoDeExibicao(nome);
  if (t === 'modelo3d') return 'modelo3d';
  if (t === 'video') return 'video';
  if (/gerber|\.zip$|\.drl$|\.step$|\.stp$|bom.*\.csv$/i.test(nome)) return 'fabricacao';
  return 'tecnico';
}

export function sha256(dados: Buffer): string {
  return createHash('sha256').update(dados).digest('hex');
}

/** Grava o conteúdo (nome pelo hash: o mesmo arquivo não ocupa espaço duas vezes) e registra no banco. */
export function guardarArquivo(dados: Buffer, info: Omit<typeof schema.arquivos.$inferInsert, 'caminho' | 'tamanho' | 'sha256' | 'mime'> & { mime?: string }): Arquivo {
  const hash = sha256(dados);
  const caminho = join(hash.slice(0, 2), hash + extname(info.nome).toLowerCase());
  const completo = join(ARQUIVOS_DIR, caminho);
  if (!existsSync(completo)) {
    mkdirSync(dirname(completo), { recursive: true });
    writeFileSync(completo, dados);
  }
  return db
    .insert(schema.arquivos)
    .values({ ...info, mime: info.mime ?? mimeDe(info.nome), caminho, tamanho: dados.length, sha256: hash })
    .returning()
    .get();
}

/** Como `guardarArquivo`, mas para um arquivo que já está no disco (upload grande): move em vez de copiar. */
export function guardarArquivoDoDisco(
  recebido: { caminhoTemporario: string; tamanho: number; sha256: string },
  info: Omit<typeof schema.arquivos.$inferInsert, 'caminho' | 'tamanho' | 'sha256' | 'mime'> & { mime?: string },
): Arquivo {
  const caminho = join(recebido.sha256.slice(0, 2), recebido.sha256 + extname(info.nome).toLowerCase());
  const completo = join(ARQUIVOS_DIR, caminho);
  if (existsSync(completo)) unlinkSync(recebido.caminhoTemporario);
  else {
    mkdirSync(dirname(completo), { recursive: true });
    renameSync(recebido.caminhoTemporario, completo);
    chmodSync(completo, 0o644); // o Nginx (X-Accel) precisa ler
  }
  return db
    .insert(schema.arquivos)
    .values({ ...info, mime: info.mime ?? mimeDe(info.nome), caminho, tamanho: recebido.tamanho, sha256: recebido.sha256 })
    .returning()
    .get();
}

/** Remove o registro; apaga o arquivo do disco se nenhum outro registro usa o mesmo conteúdo. */
export function removerArquivo(arquivo: Arquivo): void {
  db.delete(schema.arquivos).where(eq(schema.arquivos.id, arquivo.id)).run();
  const outro = db.select({ id: schema.arquivos.id }).from(schema.arquivos).where(eq(schema.arquivos.caminho, arquivo.caminho)).get();
  const completo = join(ARQUIVOS_DIR, arquivo.caminho);
  if (!outro && existsSync(completo)) unlinkSync(completo);
}

// HTML anexado (BOM interativa do EasyEDA/KiCad): roda isolado do portal (sandbox sem allow-same-origin: origem
// "nula", sem acesso aos cookies, à sessão ou às outras páginas), mas com o que o visualizador 3D precisa:
// eval, WebAssembly, workers e fontes/estilos externos.
const CSP_HTML = [
  'sandbox allow-scripts allow-popups',
  "default-src 'self' data: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' data: blob:",
  "worker-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline' https:",
  'font-src https: data:',
  "img-src 'self' data: blob: https:",
  "connect-src 'self' data: blob:",
].join('; ');
const CSP_SVG = "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:";

// No isolamento o navegador bloqueia o localStorage, e a iBOM trava ao tentar ler as preferências dela.
// Este trecho, colocado no início do <head>, troca por um armazenamento em memória (some ao fechar).
const ARMAZENAMENTO_EM_MEMORIA = Buffer.from(
  '<script>(function(){try{window.localStorage.length}catch(e){var m=function(){var d={};return{getItem:function(k){return k in d?d[k]:null},' +
    'setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},' +
    'get length(){return Object.keys(d).length}}};try{Object.defineProperty(window,"localStorage",{value:m(),configurable:true});' +
    'Object.defineProperty(window,"sessionStorage",{value:m(),configurable:true})}catch(_){}}})()</script>',
);

function comArmazenamentoEmMemoria(html: Buffer): Buffer {
  const inicio = html.subarray(0, 8192).toString('latin1').search(/<head[\s>]/i);
  if (inicio < 0) return Buffer.concat([ARMAZENAMENTO_EM_MEMORIA, html]);
  const fim = html.indexOf('>', inicio) + 1;
  return Buffer.concat([html.subarray(0, fim), ARMAZENAMENTO_EM_MEMORIA, html.subarray(fim)]);
}

function nomeSeguro(nome: string) {
  return nome.replace(/["\\\r\n]/g, '_');
}

/**
 * Resposta HTTP do arquivo. `inline`: mostrar no navegador (PDF, vídeo, imagem, 3D, BOM interativa);
 * senão força o download. HTML e SVG sempre vão "em quarentena" (CSP sandbox): os scripts deles rodam
 * isolados e não enxergam o portal nem a sessão do cliente.
 */
export function responderArquivo(arquivo: Arquivo, inline: boolean, request: Request): Response {
  const perigoso = /^(text\/html|image\/svg\+xml)/.test(arquivo.mime);
  const cabecalhos = new Headers({
    'content-type': arquivo.mime,
    'content-disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(nomeSeguro(arquivo.nome))}`,
    // no-cache: o navegador guarda, mas pergunta antes de reusar — a permissão é conferida toda vez
    // (depois de sair, ou se o arquivo foi retirado, o cache não serve mais). Sem mudança: 304, nada é baixado de novo.
    'cache-control': 'private, no-cache',
    etag: `"${arquivo.sha256}"`,
    'x-content-type-options': 'nosniff',
  });
  if (request.headers.get('if-none-match')?.includes(arquivo.sha256)) return new Response(null, { status: 304, headers: cabecalhos });
  const html = arquivo.mime.startsWith('text/html');
  if (perigoso) cabecalhos.set('content-security-policy', html ? CSP_HTML : CSP_SVG);

  // HTML: o app entrega (precisa acrescentar o trecho do armazenamento), mesmo com o Nginx na frente.
  if (html) {
    const completo = join(ARQUIVOS_DIR, arquivo.caminho);
    if (!existsSync(completo)) return new Response('Arquivo não encontrado', { status: 404 });
    const corpo = comArmazenamentoEmMemoria(readFileSync(completo));
    cabecalhos.set('content-length', String(corpo.length));
    return new Response(new Uint8Array(corpo), { status: 200, headers: cabecalhos });
  }

  if (USAR_NGINX) {
    cabecalhos.set('x-accel-redirect', `/_arquivos/${arquivo.caminho}`);
    return new Response(null, { status: 200, headers: cabecalhos });
  }

  // Sem Nginx (desenvolvimento): o próprio app entrega, com suporte a Range para vídeos.
  const completo = join(ARQUIVOS_DIR, arquivo.caminho);
  if (!existsSync(completo)) return new Response('Arquivo não encontrado', { status: 404 });
  const tamanho = statSync(completo).size;
  cabecalhos.set('accept-ranges', 'bytes');
  const faixa = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '');
  if (faixa && (faixa[1] || faixa[2])) {
    const inicio = faixa[1] ? Number(faixa[1]) : Math.max(0, tamanho - Number(faixa[2]));
    const fim = faixa[1] && faixa[2] ? Math.min(Number(faixa[2]), tamanho - 1) : tamanho - 1;
    if (inicio >= tamanho || inicio > fim) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${tamanho}` } });
    cabecalhos.set('content-range', `bytes ${inicio}-${fim}/${tamanho}`);
    cabecalhos.set('content-length', String(fim - inicio + 1));
    const corpo = Readable.toWeb(createReadStream(completo, { start: inicio, end: fim })) as ReadableStream;
    return new Response(corpo, { status: 206, headers: cabecalhos });
  }
  cabecalhos.set('content-length', String(tamanho));
  return new Response(Readable.toWeb(createReadStream(completo)) as ReadableStream, { status: 200, headers: cabecalhos });
}
