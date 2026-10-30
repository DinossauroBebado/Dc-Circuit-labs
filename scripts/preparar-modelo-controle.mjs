// Prepara o GLB do controle DNK exportado do SolidWorks para o site:
//   1. gira o modelo para a posição de uso (o SolidWorks exporta com o comprimento na vertical);
//   2. cria a animação "explodir" (vista explodida), que o controle deslizante da página comanda;
//   3. reduz o arquivo: junta peças repetidas, simplifica as malhas e quantiza os vértices
//      (KHR_mesh_quantization — lido pelo three.js sem baixar decodificador de outro site).
//
// Uso: npm run modelo:controle -- <arquivo-do-solidworks.glb> [saida.glb]
// Precisão da simplificação: ERRO_SIMPLIFICACAO=0.0002 npm run modelo:controle -- … (padrão 0.0005; menor = mais fiel e
// arquivo maior). Se alguma peça pequena sumir no site, reduza esse valor.
// Quando o CAD mudar, exporte de novo e rode este comando — não edite o GLB gerado à mão.

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, join, prune, quantize, simplifyPrimitive, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { statSync } from 'node:fs';

const entrada = process.argv[2];
const saida = process.argv[3] ?? 'public/models/controle-dnk.glb';
if (!entrada) {
  console.error('Uso: npm run modelo:controle -- <arquivo.glb> [saida.glb]');
  process.exit(1);
}

const erroSimplificacao = Number(process.env.ERRO_SIMPLIFICACAO ?? 0.002);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(entrada);
const cena = doc.getRoot().listScenes()[0];

// A câmera exportada pelo SolidWorks é um nó vazio; o visualizador tem a própria câmera.
for (const no of cena.listChildren()) {
  if (!no.getMesh() && no.listChildren().length === 0) no.dispose();
}

const montagem = cena.listChildren().find((no) => no.listChildren().length > 0);
const identidade = (v, ref) => v.every((x, i) => Math.abs(x - ref[i]) < 1e-6);
if (!identidade(montagem.getRotation(), [0, 0, 0, 1]) || !identidade(montagem.getScale(), [1, 1, 1])) {
  console.warn('Aviso: a montagem veio rotacionada/escalada — confira a vista explodida.');
}

// Eixos do SolidWorks: x = espessura (frente do operador em +x), y = comprimento, z = altura.
// Rotação de -120° em torno de (1,1,1): comprimento → horizontal, altura → para cima, frente → câmera.
const controle = doc.createNode('controle').setRotation([-0.5, -0.5, -0.5, 0.5]);
cena.removeChild(montagem);
controle.addChild(montagem);
cena.addChild(controle);

const verticesAntes = contarVertices();

// Peso no navegador: parafusos, porcas, insertos e espaçadores ficam escondidos dentro do corpo e
// somam centenas de milhares de vértices — saem do modelo do site.
const FIXACAO = /screw|nut|rivet|inserto|spacer/i;
for (const peca of montagem.listChildren()) {
  if (FIXACAO.test(peca.getName())) peca.dispose();
}

// O SolidWorks exporta dezenas de materiais quase iguais; cada um vira um shader para compilar.
// Junta os que têm cor e acabamento parecidos.
const porChave = new Map();
for (const material of doc.getRoot().listMaterials()) {
  const r = (v, passo) => Math.round(v / passo) * passo;
  const chave = [...material.getBaseColorFactor().map((v) => r(v, 0.08)), r(material.getMetallicFactor(), 0.5), r(material.getRoughnessFactor(), 0.25)].join();
  const igual = porChave.get(chave);
  if (!igual) {
    porChave.set(chave, material);
    continue;
  }
  for (const pai of material.listParents()) {
    if (pai.propertyType === 'Primitive') pai.setMaterial(igual);
  }
  material.dispose();
}

// Placas e tela: centenas de componentes SMD que só aparecem na vista explodida. Sem normais (sombreamento
// plano, que fica bem em CAD) o simplificador consegue reduzir muito mais; o resto mantém mais detalhe.
const DETALHE_INTERNO = /PCB|HMI/i;
const internas = new Set();
for (const peca of montagem.listChildren()) {
  if (!DETALHE_INTERNO.test(peca.getName())) continue;
  peca.traverse((no) => no.getMesh()?.listPrimitives().forEach((p) => internas.add(p)));
}
for (const p of internas) p.setAttribute('NORMAL', null);

await MeshoptSimplifier.ready;
await doc.transform(dedup(), weld());
for (const malha of doc.getRoot().listMeshes()) {
  for (const p of malha.listPrimitives()) {
    const erro = internas.has(p) ? erroSimplificacao * 6 : erroSimplificacao;
    simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio: 0, error: erro });
  }
}
await doc.transform(
  // Menos chamadas de desenho: junta as partes de cada peça que usam o mesmo material
  // (sem juntar peças diferentes, que precisam se mover separadas na vista explodida).
  join({ keepMeshes: true, keepNamed: false }),
  prune(),
  quantize(),
);

// Vista explodida: quanto cada peça se afasta, nos eixos do SolidWorks (metros; x = frente, z = cima).
function deslocamento(nome) {
  if (/Corpo-Solido/i.test(nome)) return [0, 0, 0];
  if (/Chapa-Fixacao/i.test(nome)) return [-0.045, 0, 0];
  if (/Case-Antena/i.test(nome)) return [0, 0, 0.05];
  if (/HMI/i.test(nome)) return [0.05, 0, 0];
  if (/PCB/i.test(nome)) return [0.085, 0, 0];
  if (/Botoes|Joystick|Knob/i.test(nome)) return [0.12, 0, 0];
  if (/screw/i.test(nome)) return [0.155, 0, 0];
  return [-0.08, 0, 0]; // insertos, porcas e espaçadores saem por trás
}

const buffer = doc.getRoot().listBuffers()[0];
const tempo = doc.createAccessor().setType('SCALAR').setArray(new Float32Array([0, 1.6])).setBuffer(buffer);
const animacao = doc.createAnimation('explodir');
for (const peca of montagem.listChildren()) {
  const d = deslocamento(peca.getName());
  if (d.every((v) => v === 0)) continue;
  const t = peca.getTranslation();
  const posicoes = doc
    .createAccessor()
    .setType('VEC3')
    .setArray(new Float32Array([...t, t[0] + d[0], t[1] + d[1], t[2] + d[2]]))
    .setBuffer(buffer);
  const amostra = doc.createAnimationSampler().setInput(tempo).setOutput(posicoes).setInterpolation('LINEAR');
  const canal = doc.createAnimationChannel().setTargetNode(peca).setTargetPath('translation').setSampler(amostra);
  animacao.addSampler(amostra).addChannel(canal);
}

await io.write(saida, doc);
const mb = (b) => (b / 1024 / 1024).toFixed(1);
console.log(
  `${saida}: ${mb(statSync(entrada).size)} MB → ${mb(statSync(saida).size)} MB, ` +
    `${verticesAntes.toLocaleString('pt-BR')} → ${contarVertices().toLocaleString('pt-BR')} vértices, ` +
    `${animacao.listChannels().length} peças na vista explodida`,
);

function contarVertices() {
  return doc
    .getRoot()
    .listMeshes()
    .reduce((s, m) => s + m.listPrimitives().reduce((a, p) => a + p.getAttribute('POSITION').getCount(), 0), 0);
}
