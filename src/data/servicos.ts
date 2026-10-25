// Ordem e ícones das frentes de engenharia. Os textos de cada uma ficam nos dicionários (src/i18n/*.ts).
export const SERVICOS = [
  { slug: 'eletronica-pcb', icone: 'circuit-board', midia: 'servico-eletronica-pcb' },
  { slug: 'firmware', icone: 'code-xml', midia: 'servico-firmware' },
  { slug: 'mecanica', icone: 'cuboid', midia: 'servico-mecanica' },
  { slug: 'integracao', icone: 'workflow', midia: 'servico-integracao' },
  { slug: 'manufatura', icone: 'factory', midia: 'servico-manufatura' },
  { slug: 'edge-ai', icone: 'scan-eye', midia: 'servico-edge-ai' },
  { slug: 'robotica', icone: 'bot', midia: 'servico-robotica' },
] as const;

export type SlugServico = (typeof SERVICOS)[number]['slug'];
