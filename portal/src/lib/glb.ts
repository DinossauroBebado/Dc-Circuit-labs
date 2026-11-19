// Otimiza GLBs exportados do CAD para o navegador (mesmo processo do site: scripts/otimizar-glb.mjs).
import { getBounds, NodeIO, type Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize, simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

function caixa(doc: Document): number[] {
  const { min, max } = getBounds(doc.getRoot().listScenes()[0]);
  return [...min, ...max];
}

/** Devolve o GLB otimizado, ou o original se a otimização falhar ou não reduzir o tamanho. */
export async function otimizarGlb(original: Buffer): Promise<Buffer> {
  try {
    await MeshoptSimplifier.ready;
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
    const doc = await io.readBinary(new Uint8Array(original));
    const antes = caixa(doc);
    // Quantiza só normais/UV: quantizar posições depende de devolver a escala pelos nós, o que falha em montagens
    // com peças aninhadas e reaproveitadas (placas com componentes) — elas ficavam dezenas de vezes maiores.
    await doc.transform(
      dedup(),
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio: 0, error: 0.001 }),
      prune(),
      quantize({ pattern: /^(NORMAL|TEXCOORD_\d+|TANGENT)$/ }),
    );
    const depois = caixa(doc);
    const tamanho = Math.max(antes[3] - antes[0], antes[4] - antes[1], antes[5] - antes[2]);
    const diferenca = Math.max(...antes.map((v, i) => Math.abs(v - depois[i])));
    if (!(diferenca <= Math.max(0.0005, tamanho * 0.01))) {
      console.error(`GLB mudou de tamanho ao otimizar (${diferenca}); usando o original`);
      return original;
    }
    const otimizado = Buffer.from(await io.writeBinary(doc));
    return otimizado.length < original.length ? otimizado : original;
  } catch (e) {
    console.error('Falha ao otimizar GLB; usando o original', e);
    return original;
  }
}
