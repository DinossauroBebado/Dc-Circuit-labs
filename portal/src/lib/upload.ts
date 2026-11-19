// Recebe uploads grandes (vídeos) direto para o disco, sem carregar na memória: o formulário multipart é lido
// em fluxo (busboy), cada arquivo vai para uma pasta temporária ao lado dos arquivos definitivos e o sha256 é
// calculado no caminho. Depois, `guardarArquivoDoDisco` (arquivos.ts) só move o temporário para o lugar final.
import busboy from 'busboy';
import { createHash, randomBytes } from 'node:crypto';
import { createWriteStream, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { ARQUIVOS_DIR } from './arquivos';

export const PASTA_TEMPORARIA = join(ARQUIVOS_DIR, '.temporarios');

export interface ArquivoRecebido {
  campo: string;
  nome: string;
  caminhoTemporario: string;
  tamanho: number;
  sha256: string;
}

export interface Upload {
  campos: Record<string, string>;
  arquivos: ArquivoRecebido[];
  erro?: string;
}

/** Apaga os temporários que sobraram (erro no meio, arquivo recusado). */
export function descartar(arquivos: ArquivoRecebido[]) {
  for (const a of arquivos) {
    try {
      unlinkSync(a.caminhoTemporario);
    } catch {
      /* já movido ou apagado */
    }
  }
}

export function receberUpload(request: Request, limites: { porArquivo: number; arquivos: number }): Promise<Upload> {
  const tipo = request.headers.get('content-type') ?? '';
  if (!request.body || !tipo.startsWith('multipart/form-data')) return Promise.resolve({ campos: {}, arquivos: [], erro: 'Formulário inválido.' });
  mkdirSync(PASTA_TEMPORARIA, { recursive: true });

  return new Promise((resolve) => {
    const campos: Record<string, string> = {};
    const arquivos: ArquivoRecebido[] = [];
    const gravacoes: Promise<void>[] = [];
    let erro: string | undefined;
    let terminou = false;

    const fim = (e?: string) => {
      if (terminou) return;
      terminou = true;
      Promise.allSettled(gravacoes).then(() => {
        erro ??= e;
        if (erro) descartar(arquivos);
        resolve({ campos, arquivos: erro ? [] : arquivos, erro });
      });
    };

    const bb = busboy({
      headers: { 'content-type': tipo },
      limits: { fileSize: limites.porArquivo, files: limites.arquivos, fields: 50, fieldSize: 10_000 },
      defParamCharset: 'utf8',
    });

    bb.on('field', (nome, valor) => (campos[nome] = valor));
    bb.on('file', (campo, fluxo, info) => {
      if (!info.filename) {
        fluxo.resume();
        return;
      }
      const caminhoTemporario = join(PASTA_TEMPORARIA, randomBytes(16).toString('hex'));
      const hash = createHash('sha256');
      const destino = createWriteStream(caminhoTemporario);
      const recebido: ArquivoRecebido = { campo, nome: info.filename.replace(/[/\\]/g, '_'), caminhoTemporario, tamanho: 0, sha256: '' };
      arquivos.push(recebido);
      fluxo.on('data', (parte: Buffer) => {
        hash.update(parte);
        recebido.tamanho += parte.length;
      });
      fluxo.on('limit', () => (erro = `O arquivo ${recebido.nome} passa do limite de ${Math.round(limites.porArquivo / 1048576)} MB.`));
      gravacoes.push(
        new Promise<void>((ok) => {
          destino.on('close', () => {
            recebido.sha256 = hash.digest('hex');
            ok();
          });
          destino.on('error', () => {
            erro = 'Falha ao gravar o arquivo no servidor.';
            ok();
          });
        }),
      );
      fluxo.pipe(destino);
    });
    bb.on('filesLimit', () => (erro = `Envie no máximo ${limites.arquivos} arquivos por vez.`));
    bb.on('error', () => fim('Envio interrompido. Tente de novo.'));
    bb.on('close', () => fim());

    Readable.fromWeb(request.body as unknown as WebReadableStream).on('error', () => fim('Envio interrompido. Tente de novo.')).pipe(bb);
  });
}
