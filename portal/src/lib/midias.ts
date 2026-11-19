// Mídias (fotos e vídeos dos produtos prontos): envio pelo painel, galeria do cliente, ZIP e registro de quem viu/baixou.
import { and, desc, eq, inArray, like } from 'drizzle-orm';
import { Zip, ZipPassThrough } from 'fflate';
import { closeSync, createReadStream, openSync, readSync } from 'node:fs';
import { extname, join } from 'node:path';
import sharp from 'sharp';
import { db, schema } from '../db';
import { ARQUIVOS_DIR, guardarArquivo, guardarArquivoDoDisco, removerArquivo, type Arquivo } from './arquivos';
import { slug } from './renderizar';
import { descartar, type ArquivoRecebido } from './upload';

export const LIMITE_MIDIA = 500 * 1024 * 1024; // igual ao client_max_body_size do Nginx
export const MAX_ARQUIVOS_POR_ENVIO = 30;
const FOTOS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const VIDEOS = ['.mp4', '.m4v', '.mov', '.webm'];
export const ACEITOS = [...FOTOS, ...VIDEOS].join(',');
const LIMITE_ZIP = 4 * 1024 ** 3 - 64 * 1024 ** 2; // ZIP sem zip64: até ~4 GB

export type Midia = typeof schema.midias.$inferSelect;
export interface MidiaCompleta extends Midia {
  nome: string;
  tamanho: number;
  mime: string;
}

/** Texto do registro de acesso de uma mídia: "midia #12: foto.jpg" (a ficha conta por id). */
export const alvoDaMidia = (m: { id: number; nome: string }) => `midia #${m.id}: ${m.nome}`;

function tipoPeloNome(nome: string): 'foto' | 'video' | null {
  const ext = extname(nome).toLowerCase();
  return FOTOS.includes(ext) ? 'foto' : VIDEOS.includes(ext) ? 'video' : null;
}

/** Vídeo de verdade? (MP4/MOV têm "ftyp" no byte 4; WebM começa com 1A 45 DF A3.) */
function pareceVideo(caminho: string): boolean {
  const cab = Buffer.alloc(12);
  const fd = openSync(caminho, 'r');
  try {
    readSync(fd, cab, 0, 12, 0);
  } finally {
    closeSync(fd);
  }
  return cab.subarray(4, 8).toString('latin1') === 'ftyp' || cab.readUInt32BE(0) === 0x1a45dfa3;
}

/**
 * Cadastra os arquivos recebidos como mídias do cliente. Fotos ganham miniatura (grade) e versão de tela.
 * Devolve quantas entraram e os erros de cada arquivo recusado.
 */
export async function cadastrarMidias(arquivos: ArquivoRecebido[], clienteId: number, projetoId: number | null) {
  const erros: string[] = [];
  let enviados = 0;
  for (const recebido of arquivos) {
    const tipo = tipoPeloNome(recebido.nome);
    const base = { clienteId, projetoId };
    try {
      if (!tipo) throw new Error(`${recebido.nome}: formato não aceito (fotos: JPG, PNG, WebP, AVIF; vídeos: MP4, MOV, WebM). Foto do iPhone (HEIC)? Exporte como JPG.`);
      if (recebido.tamanho === 0) throw new Error(`${recebido.nome}: arquivo vazio.`);
      let miniaturaId: number | null = null;
      let telaId: number | null = null;
      let largura: number | null = null;
      let altura: number | null = null;
      if (tipo === 'foto') {
        const imagem = sharp(recebido.caminhoTemporario, { failOn: 'error' }).rotate(); // rotate(): respeita a orientação da câmera
        const meta = await imagem.metadata().catch(() => null);
        if (!meta?.width) throw new Error(`${recebido.nome}: não é uma imagem válida.`);
        const girada = (meta.orientation ?? 1) >= 5;
        largura = girada ? meta.height! : meta.width;
        altura = girada ? meta.width : meta.height!;
        const nomeBase = recebido.nome.replace(/\.[^.]+$/, '');
        const mini = await imagem.clone().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
        const tela = await imagem.clone().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
        miniaturaId = guardarArquivo(mini, { ...base, categoria: 'miniatura', origem: 'upload', nome: `${nomeBase}-mini.webp`, mime: 'image/webp' }).id;
        telaId = guardarArquivo(tela, { ...base, categoria: 'miniatura', origem: 'upload', nome: `${nomeBase}-tela.webp`, mime: 'image/webp' }).id;
      } else if (!pareceVideo(recebido.caminhoTemporario)) {
        throw new Error(`${recebido.nome}: não é um vídeo válido.`);
      }
      const original = guardarArquivoDoDisco(recebido, { ...base, categoria: 'midia', origem: 'upload', nome: recebido.nome });
      db.insert(schema.midias)
        .values({ ...base, tipo, titulo: recebido.nome.replace(/\.[^.]+$/, ''), arquivoId: original.id, miniaturaId, telaId, largura, altura })
        .run();
      enviados++;
    } catch (e) {
      erros.push(e instanceof Error ? e.message : String(e));
      descartar([recebido]);
    }
  }
  return { enviados, erros };
}

function consulta(clienteId: number) {
  return db
    .select({ midia: schema.midias, nome: schema.arquivos.nome, tamanho: schema.arquivos.tamanho, mime: schema.arquivos.mime })
    .from(schema.midias)
    .innerJoin(schema.arquivos, eq(schema.arquivos.id, schema.midias.arquivoId))
    .where(eq(schema.midias.clienteId, clienteId))
    .orderBy(desc(schema.midias.criadoEm), desc(schema.midias.id));
}

export function midiasDoCliente(clienteId: number): MidiaCompleta[] {
  return consulta(clienteId)
    .all()
    .map((l) => ({ ...l.midia, nome: l.nome, tamanho: l.tamanho, mime: l.mime }));
}

/** Mídias pedidas pelo cliente (só as dele; ids de outro cliente são ignorados). */
export function midiasPorIds(clienteId: number, ids: number[] | 'todas'): MidiaCompleta[] {
  const todas = midiasDoCliente(clienteId);
  if (ids === 'todas') return todas;
  const pedidos = new Set(ids);
  return todas.filter((m) => pedidos.has(m.id));
}

export function removerMidia(id: number, clienteId: number): string | null {
  const m = db.select().from(schema.midias).where(and(eq(schema.midias.id, id), eq(schema.midias.clienteId, clienteId))).get();
  if (!m) return null;
  db.delete(schema.midias).where(eq(schema.midias.id, m.id)).run();
  const ids = [m.arquivoId, m.miniaturaId, m.telaId].filter((x): x is number => x != null);
  const arquivos = ids.length ? db.select().from(schema.arquivos).where(inArray(schema.arquivos.id, ids)).all() : [];
  const nome = arquivos.find((a) => a.id === m.arquivoId)?.nome ?? m.titulo ?? 'mídia';
  for (const a of arquivos) removerArquivo(a);
  return nome;
}

/** Para a ficha: quantas vezes cada mídia foi aberta/baixada e quando foi a última. */
export function estatisticasDasMidias(clienteId: number) {
  const linhas = db
    .select({ evento: schema.acessos.evento, alvo: schema.acessos.alvo, quando: schema.acessos.quando })
    .from(schema.acessos)
    .where(and(eq(schema.acessos.clienteId, clienteId), inArray(schema.acessos.evento, ['viu_midia', 'baixou_midia']), like(schema.acessos.alvo, 'midia #%')))
    .all();
  const porMidia = new Map<number, { vistas: number; downloads: number; ultimaVista?: Date; ultimoDownload?: Date }>();
  for (const l of linhas) {
    const id = Number(/^midia #(\d+):/.exec(l.alvo ?? '')?.[1]);
    if (!id) continue;
    const e = porMidia.get(id) ?? { vistas: 0, downloads: 0 };
    if (l.evento === 'viu_midia') {
      e.vistas++;
      if (!e.ultimaVista || l.quando > e.ultimaVista) e.ultimaVista = l.quando;
    } else {
      e.downloads++;
      if (!e.ultimoDownload || l.quando > e.ultimoDownload) e.ultimoDownload = l.quando;
    }
    porMidia.set(id, e);
  }
  return porMidia;
}

/** Nomes dentro do ZIP: pasta do projeto + nome original, sem repetir. */
function nomesNoZip(midias: MidiaCompleta[], projetos: Map<number, string>): string[] {
  const usados = new Set<string>();
  return midias.map((m) => {
    const pasta = m.projetoId && projetos.get(m.projetoId) ? `${projetos.get(m.projetoId)!.replace(/[/\\:*?"<>|]/g, '-')}/` : '';
    const ext = extname(m.nome);
    const base = m.nome.slice(0, m.nome.length - ext.length).replace(/[/\\:*?"<>|]/g, '-');
    let nome = `${pasta}${base}${ext}`;
    for (let n = 2; usados.has(nome.toLowerCase()); n++) nome = `${pasta}${base} (${n})${ext}`;
    usados.add(nome.toLowerCase());
    return nome;
  });
}

export function cabeZip(midias: MidiaCompleta[]) {
  return midias.reduce((s, m) => s + m.tamanho, 0) < LIMITE_ZIP;
}

/**
 * ZIP gerado em fluxo, sem compressão (foto e vídeo já são comprimidos): começa a baixar na hora, sem montar
 * o arquivo inteiro na memória. Lê o disco aos poucos, conforme o navegador consome.
 */
export function fluxoZip(midias: MidiaCompleta[], projetos: Map<number, string>): ReadableStream<Uint8Array> {
  const arquivos = new Map<number, Arquivo>(
    db.select().from(schema.arquivos).where(inArray(schema.arquivos.id, midias.map((m) => m.arquivoId))).all().map((a) => [a.id, a]),
  );
  const nomes = nomesNoZip(midias, projetos);
  const saida: Uint8Array[] = [];
  let falha: Error | null = null;
  const zip = new Zip((erro, parte) => {
    if (erro) falha = erro;
    else saida.push(parte);
  });

  async function* gerar() {
    for (let i = 0; i < midias.length; i++) {
      const arquivo = arquivos.get(midias[i].arquivoId);
      if (!arquivo) continue;
      const entrada = new ZipPassThrough(nomes[i]);
      entrada.mtime = midias[i].criadoEm;
      zip.add(entrada);
      for await (const pedaco of createReadStream(join(ARQUIVOS_DIR, arquivo.caminho), { highWaterMark: 1024 * 1024 })) {
        entrada.push(pedaco as Buffer);
        if (falha) throw falha;
        while (saida.length) yield saida.shift()!;
      }
      entrada.push(new Uint8Array(0), true);
      while (saida.length) yield saida.shift()!;
    }
    zip.end();
    if (falha) throw falha;
    while (saida.length) yield saida.shift()!;
  }
  const partes = gerar();
  return new ReadableStream<Uint8Array>({
    async pull(controle) {
      try {
        const { value, done } = await partes.next();
        if (done) controle.close();
        else controle.enqueue(value);
      } catch (e) {
        controle.error(e);
      }
    },
    async cancel() {
      await partes.return(undefined); // navegador cancelou: fecha o arquivo aberto
    },
  });
}

export function nomeDoZip(razaoSocial: string, quantidade: number, todas: boolean) {
  return `midias-${slug(razaoSocial).slice(0, 40)}${todas ? '' : `-${quantidade}-arquivos`}.zip`;
}
