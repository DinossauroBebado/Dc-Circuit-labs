// Gera os dois modelos 3D de placeholder usados nos visualizadores do site:
//   public/models/placa-placeholder.glb               — placa de circuito genérica (no lugar da placa Metabee)
//   public/models/controle-explodido-placeholder.glb  — controle com animação "explodir" (no lugar do controle DNK Agro)
// Quando os arquivos reais chegarem (exportados do CAD em .glb), basta salvá-los em public/models/
// e trocar o caminho em src/data/midia.ts — este script deixa de ser necessário.
//
// Uso: npm run modelos

import { Document, NodeIO } from '@gltf-transform/core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SAIDA = fileURLToPath(new URL('../public/models/', import.meta.url));
mkdirSync(SAIDA, { recursive: true });

function srgbParaLinear(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
}

function novoDocumento() {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const cena = doc.createScene('Cena');
  const malhas = new Map();
  const materiais = new Map();

  function material(nome, hex, { metal = 0, rugosidade = 0.6, emissivo } = {}) {
    if (materiais.has(nome)) return materiais.get(nome);
    const m = doc
      .createMaterial(nome)
      .setBaseColorFactor([...srgbParaLinear(hex), 1])
      .setMetallicFactor(metal)
      .setRoughnessFactor(rugosidade);
    if (emissivo) m.setEmissiveFactor(srgbParaLinear(emissivo));
    materiais.set(nome, m);
    return m;
  }

  // Caixa com normais por face (24 vértices), centrada na origem.
  function caixa(l, a, p, mat) {
    const chave = `${l}|${a}|${p}|${mat.getName()}`;
    if (malhas.has(chave)) return malhas.get(chave);
    const [x, y, z] = [l / 2, a / 2, p / 2];
    const faces = [
      [[1, 0, 0], [[x, -y, -z], [x, y, -z], [x, y, z], [x, -y, z]]],
      [[-1, 0, 0], [[-x, -y, z], [-x, y, z], [-x, y, -z], [-x, -y, -z]]],
      [[0, 1, 0], [[-x, y, -z], [-x, y, z], [x, y, z], [x, y, -z]]],
      [[0, -1, 0], [[-x, -y, z], [-x, -y, -z], [x, -y, -z], [x, -y, z]]],
      [[0, 0, 1], [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]],
      [[0, 0, -1], [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]]],
    ];
    const pos = [], nor = [], idx = [];
    faces.forEach(([n, vs], f) => {
      vs.forEach((v) => { pos.push(...v); nor.push(...n); });
      const b = f * 4;
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    const prim = doc
      .createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nor)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(idx)).setBuffer(buffer))
      .setMaterial(mat);
    const malha = doc.createMesh(chave).addPrimitive(prim);
    malhas.set(chave, malha);
    return malha;
  }

  function peca(pai, nome, [l, a, p], [x, y, z], mat, rotY = 0) {
    const no = doc.createNode(nome).setMesh(caixa(l, a, p, mat)).setTranslation([x, y, z]);
    if (rotY) no.setRotation([0, Math.sin(rotY / 2), 0, Math.cos(rotY / 2)]);
    pai.addChild(no);
    return no;
  }

  return { doc, buffer, cena, material, peca };
}

// Componentes de uma placa genérica, sobre a face superior (y = 0) de uma placa centrada na origem.
function popularPlaca(ctx, pai, L, P) {
  const { material, peca } = ctx;
  const ci = material('ci', '#16181c', { rugosidade: 0.35 });
  const metal = material('metal', '#c9ccd1', { metal: 1, rugosidade: 0.25 });
  const ouro = material('ouro', '#d4a94a', { metal: 1, rugosidade: 0.3 });
  const plastico = material('plastico', '#1f2329', { rugosidade: 0.7 });
  const passivo = material('passivo', '#8a7a62', { rugosidade: 0.5 });
  const trilha = material('trilha', '#1d5fa8', { rugosidade: 0.45 });
  const led = material('led-ciano', '#00EDFF', { rugosidade: 0.2, emissivo: '#00EDFF' });

  // Módulo de RF com blindagem metálica + microcontrolador
  peca(pai, 'modulo-rf', [0.018, 0.0032, 0.025], [-L * 0.25, 0.0016, -P * 0.08], metal);
  peca(pai, 'microcontrolador', [0.012, 0.0016, 0.012], [L * 0.02, 0.0008, P * 0.05], ci);
  peca(pai, 'regulador', [0.0065, 0.0022, 0.0065], [L * 0.24, 0.0011, -P * 0.22], ci);
  peca(pai, 'driver', [0.008, 0.0014, 0.005], [L * 0.18, 0.0007, P * 0.2], ci);

  // Conector USB na borda
  peca(pai, 'usb', [0.009, 0.0032, 0.0075], [L * 0.5 - 0.004, 0.0016, -P * 0.02], metal);

  // Barra de pinos
  peca(pai, 'barra-pinos-base', [0.0254, 0.0025, 0.0025], [-L * 0.05, 0.00125, P * 0.5 - 0.004], plastico);
  for (let i = 0; i < 10; i++) {
    peca(pai, `pino-${i}`, [0.0006, 0.009, 0.0006], [-L * 0.05 - 0.01143 + i * 0.00254, 0.0045, P * 0.5 - 0.004], ouro);
  }

  // Passivos espalhados
  const posPassivos = [[0.08, -0.3], [0.12, -0.3], [0.32, 0.05], [0.32, 0.12], [-0.05, 0.3], [0.0, 0.3], [0.38, -0.32], [-0.38, 0.28]];
  posPassivos.forEach(([fx, fz], i) =>
    peca(pai, `passivo-${i}`, [0.002, 0.0008, 0.00125], [L * fx, 0.0004, P * fz], passivo),
  );

  // Trilhas (sob a máscara, levemente acima da superfície)
  peca(pai, 'trilha-1', [0.03, 0.00005, 0.0006], [-L * 0.06, 0.000025, P * 0.05], trilha);
  peca(pai, 'trilha-2', [0.022, 0.00005, 0.0006], [L * 0.12, 0.000025, -P * 0.1], trilha, Math.PI / 4);
  peca(pai, 'trilha-3', [0.026, 0.00005, 0.0006], [L * 0.1, 0.000025, P * 0.14], trilha, -Math.PI / 6);

  // Pads de fixação nos cantos
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    peca(pai, `pad-${sx}-${sz}`, [0.005, 0.00005, 0.005], [sx * (L / 2 - 0.004), 0.000025, sz * (P / 2 - 0.004)], ouro);
  }

  // LED de status em ciano — o "nó" aceso do logo
  peca(pai, 'led', [0.0016, 0.0008, 0.0008], [-L * 0.38, 0.0004, -P * 0.34], led);
}

async function gerarPlaca() {
  const ctx = novoDocumento();
  const L = 0.08, P = 0.05, E = 0.0016;
  const mascara = ctx.material('mascara-solda', '#0b3c6e', { rugosidade: 0.55 });
  const placa = ctx.doc.createNode('placa');
  ctx.cena.addChild(placa);
  ctx.peca(placa, 'substrato', [L, E, P], [0, 0, 0], mascara);
  const topo = ctx.doc.createNode('componentes').setTranslation([0, E / 2, 0]);
  placa.addChild(topo);
  popularPlaca(ctx, topo, L, P);
  await new NodeIO().write(SAIDA + 'placa-placeholder.glb', ctx.doc);
}

async function gerarControleExplodido() {
  const ctx = novoDocumento();
  const { doc, buffer, cena, material, peca } = ctx;
  const carcaca = material('carcaca', '#2b3038', { rugosidade: 0.65 });
  const bateria = material('bateria', '#3a4a5c', { rugosidade: 0.5 });
  const mascara = material('mascara-solda', '#0b3c6e', { rugosidade: 0.55 });
  const vidro = material('tela', '#0a0d12', { rugosidade: 0.08, emissivo: '#06223f' });
  const L = 0.13, P = 0.08;

  const camadas = [
    { nome: 'carcaca-inferior', montado: 0, explodido: 0 },
    { nome: 'bateria', montado: 0.012, explodido: 0.04 },
    { nome: 'placa', montado: 0.02, explodido: 0.075 },
    { nome: 'tela', montado: 0.026, explodido: 0.11 },
    { nome: 'moldura-superior', montado: 0.03, explodido: 0.145 },
  ];
  const nos = {};
  for (const c of camadas) {
    nos[c.nome] = doc.createNode(c.nome).setTranslation([0, c.montado, 0]);
    cena.addChild(nos[c.nome]);
  }

  peca(nos['carcaca-inferior'], 'base', [L, 0.018, P], [0, 0.009, 0], carcaca);
  peca(nos['bateria'], 'celula', [0.07, 0.012, 0.04], [0, 0.006, 0], bateria);
  peca(nos['placa'], 'substrato', [0.12, 0.0016, 0.07], [0, 0, 0], mascara);
  const comps = doc.createNode('componentes').setTranslation([0, 0.0008, 0]);
  nos['placa'].addChild(comps);
  popularPlaca(ctx, comps, 0.12, 0.07);
  peca(nos['tela'], 'display', [0.095, 0.004, 0.058], [0, 0.002, 0], vidro);
  const m = nos['moldura-superior'];
  peca(m, 'borda-frontal', [L, 0.006, 0.011], [0, 0.003, P / 2 - 0.0055], carcaca);
  peca(m, 'borda-traseira', [L, 0.006, 0.011], [0, 0.003, -P / 2 + 0.0055], carcaca);
  peca(m, 'borda-esquerda', [0.0175, 0.006, P - 0.022], [-L / 2 + 0.00875, 0.003, 0], carcaca);
  peca(m, 'borda-direita', [0.0175, 0.006, P - 0.022], [L / 2 - 0.00875, 0.003, 0], carcaca);

  const tempo = doc.createAccessor().setType('SCALAR').setArray(new Float32Array([0, 1.6])).setBuffer(buffer);
  const anim = doc.createAnimation('explodir');
  for (const c of camadas.slice(1)) {
    const saida = doc
      .createAccessor()
      .setType('VEC3')
      .setArray(new Float32Array([0, c.montado, 0, 0, c.explodido, 0]))
      .setBuffer(buffer);
    const amostra = doc.createAnimationSampler().setInput(tempo).setOutput(saida).setInterpolation('LINEAR');
    const canal = doc.createAnimationChannel().setTargetNode(nos[c.nome]).setTargetPath('translation').setSampler(amostra);
    anim.addSampler(amostra).addChannel(canal);
  }
  await new NodeIO().write(SAIDA + 'controle-explodido-placeholder.glb', doc);
}

await gerarPlaca();
await gerarControleExplodido();
console.log('Modelos gerados em public/models/');
