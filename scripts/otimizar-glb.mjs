// Reduz um GLB para o site: junta dados repetidos, simplifica as malhas e quantiza os vértices
// (KHR_mesh_quantization — lido pelo three.js sem decodificador externo).
//
// Uso: node scripts/otimizar-glb.mjs <entrada.glb> <saida.glb> [--girar x:-90[,y:0,z:0]]
//   --girar  gira o modelo (graus, aplicados na ordem dada) antes de centralizar. Ex.: a placa Metabee sai do
//            STEP em pé (plano XY); `--girar x:-90` deita a placa com os componentes para cima.
// O modelo sempre sai centralizado na origem.
//
// Placa Metabee (public/models/placa-metabee.glb):
//   node scripts/otimizar-glb.mjs placa-bruta.glb public/models/placa-metabee.glb --girar x:-90
// O GLB de entrada vem do STEP exportado do EasyEDA (metabee/wifi-connect/1_0/fabricacao/wifi_gate_way_pcb.step).
// Conversão (uma vez):
//   python3 -m venv /tmp/step && /tmp/step/bin/pip install cascadio numpy
//   /tmp/step/bin/python -c "import cascadio; cascadio.step_to_glb('placa.step', 'placa-bruta.glb', tol_linear=0.02, tol_angular=0.5, merge_primitives=True)"

import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize, simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { statSync } from 'node:fs';

const args = process.argv.slice(2);
const iGirar = args.indexOf('--girar');
const girar = iGirar >= 0 ? args.splice(iGirar, 2)[1] : '';
const [entrada, saida] = args;
if (!entrada || !saida) {
  console.error('Uso: node scripts/otimizar-glb.mjs <entrada.glb> <saida.glb> [--girar x:-90]');
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(entrada);
const cena = doc.getRoot().listScenes()[0];

// Junta tudo num nó "modelo" para girar e centralizar sem mexer na hierarquia original.
const modelo = doc.createNode('modelo').setRotation(quaternion(girar));
for (const no of cena.listChildren()) {
  cena.removeChild(no);
  modelo.addChild(no);
}
cena.addChild(modelo);
const { min, max } = getBounds(cena);
modelo.setTranslation(min.map((v, i) => -(v + max[i]) / 2));

await doc.transform(dedup(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0, error: 0.0005 }), prune(), quantize());
await io.write(saida, doc);

const b = getBounds(doc.getRoot().listScenes()[0]);
const mb = (n) => (n / 1024 / 1024).toFixed(1);
const fmt = (v) => v.map((x) => x.toFixed(3)).join(', ');
console.log(`${saida}: ${mb(statSync(entrada).size)} MB → ${mb(statSync(saida).size)} MB, limites [${fmt(b.min)}] a [${fmt(b.max)}]`);

// "x:-90,z:30" → quatérnio [x, y, z, w], rotações aplicadas na ordem escrita.
function quaternion(texto) {
  let q = [0, 0, 0, 1];
  for (const parte of texto.split(',').filter(Boolean)) {
    const [eixo, graus] = parte.split(':');
    const a = (Number(graus) * Math.PI) / 360;
    const v = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[eixo.trim()];
    if (!v || Number.isNaN(a)) throw new Error(`--girar inválido: "${parte}"`);
    q = multiplicar([v[0] * Math.sin(a), v[1] * Math.sin(a), v[2] * Math.sin(a), Math.cos(a)], q);
  }
  return q;
}

function multiplicar([ax, ay, az, aw], [bx, by, bz, bw]) {
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}
