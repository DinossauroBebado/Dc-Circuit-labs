// Todas as fotos, vídeos e modelos 3D do site passam por aqui.
//
// Os arquivos ficam em public/media/ e public/models/ e são gerados a partir da mídia bruta por:
//   npm run midia:site                 — fotos e vídeos (scripts/gerar-midia-site.sh)
//   npm run midia -- <arquivo> <nome>  — um arquivo avulso (scripts/processar-midia.sh)
//   npm run modelo:controle -- <glb>   — modelo do controle DNK (scripts/preparar-modelo-controle.mjs)
//   node scripts/otimizar-glb.mjs …    — outros modelos 3D
// Item sem `src` não aparece no site (o layout se ajusta sem ele).
//
// Mídia de cliente (cases, modelos 3D) só vai ao ar se o item correspondente em src/data/autorizacoes.ts
// estiver autorizado por escrito. Nas mídias de uso geral (hero, serviços, sobre) nunca entra nome ou logo de cliente.

export type TipoMidia = 'video' | 'imagem' | 'modelo';

export interface Midia {
  tipo: TipoMidia;
  /** O que é este item — só para o time, nunca aparece no site. */
  descricao: string;
  src?: string;
  /** Vídeo: primeiro quadro. Modelo 3D: imagem estática mostrada antes de carregar. */
  poster?: string;
  /** Texto alternativo por idioma. */
  alt: { pt: string; en: string; zh: string };
}

export const MIDIA = {
  'hero-laboratorio': {
    tipo: 'video',
    descricao: 'Montagem de bancada em loop (13 s, sem áudio), termina com o logo da DC na tela',
    src: '/media/hero-laboratorio.mp4',
    poster: '/media/hero-laboratorio.jpg',
    alt: {
      pt: 'Bancada do laboratório da DC Circuit Labs',
      en: 'DC Circuit Labs lab bench',
      zh: 'DC Circuit Labs 实验室工作台',
    },
  },
  'servico-eletronica-pcb': {
    tipo: 'imagem',
    descricao: 'Placa montada / layout de PCB',
    src: '/media/servico-eletronica-pcb.webp',
    alt: { pt: 'Placa de circuito impresso projetada pela DC Circuit Labs', en: 'Printed circuit board designed by DC Circuit Labs', zh: 'DC Circuit Labs 设计的印刷电路板' },
  },
  'servico-firmware': {
    tipo: 'imagem',
    descricao: 'Placa conectada ao computador durante gravação/teste de firmware',
    src: '/media/servico-firmware.webp',
    alt: { pt: 'Teste de firmware em bancada', en: 'Firmware testing on the bench', zh: '工作台上的固件测试' },
  },
  'servico-mecanica': {
    tipo: 'imagem',
    descricao: 'Gabinete / peça mecânica',
    src: '/media/servico-mecanica.webp',
    alt: { pt: 'Modelo 3D de gabinete', en: '3D enclosure model', zh: '外壳 3D 模型' },
  },
  'servico-integracao': {
    tipo: 'imagem',
    descricao: 'Sistema completo funcionando (hardware + app)',
    src: '/media/servico-integracao.webp',
    alt: { pt: 'Sistema integrado em funcionamento', en: 'Integrated system in operation', zh: '运行中的集成系统' },
  },
  'servico-manufatura': {
    tipo: 'imagem',
    descricao: 'Lote de placas / componentes',
    src: '/media/servico-manufatura.webp',
    alt: { pt: 'Lote de placas montadas', en: 'Batch of assembled boards', zh: '一批已组装的电路板' },
  },
  'servico-edge-ai': {
    tipo: 'imagem',
    descricao: 'Câmera/placa rodando visão computacional',
    src: '/media/servico-edge-ai.webp',
    alt: { pt: 'Visão computacional rodando no hardware', en: 'Computer vision running on the hardware', zh: '在硬件上运行的计算机视觉' },
  },
  'servico-robotica': {
    tipo: 'imagem',
    descricao: 'Robô móvel / mecanismo automatizado',
    src: '/media/servico-robotica.webp',
    alt: { pt: 'Robô móvel em teste', en: 'Mobile robot under test', zh: '测试中的移动机器人' },
  },

  // Modelos 3D (projetos de cliente — só aparecem com o case autorizado)
  'modelo-placa': {
    tipo: 'modelo',
    descricao: 'Placa do gateway Wi-Fi Metabee (do STEP de fabricação, scripts/otimizar-glb.mjs)',
    src: '/models/placa-metabee.glb',
    poster: '/models/placa-metabee-poster.webp',
    alt: { pt: 'Modelo 3D de uma placa de circuito', en: '3D model of a circuit board', zh: '电路板 3D 模型' },
  },
  'modelo-controle': {
    tipo: 'modelo',
    descricao: 'Controle DNK Agro, com animação "explodir" (npm run modelo:controle)',
    src: '/models/controle-dnk.glb',
    poster: '/models/controle-dnk-poster.webp',
    alt: { pt: 'Modelo 3D de um controle em visão explodida', en: 'Exploded 3D model of a controller', zh: '控制器 3D 爆炸视图' },
  },

  // Cases (só aparecem no build de produção depois da autorização por escrito)
  'case-dnk': {
    tipo: 'imagem',
    descricao: 'Render do modelo 3D do controle DNK Agro (não há foto da DNK)',
    src: '/media/case-dnk.webp',
    alt: { pt: 'Controle remoto desenvolvido para a DNK Agro', en: 'Remote control developed for DNK Agro', zh: '为 DNK Agro 开发的遥控器' },
  },
  'case-metabee': {
    tipo: 'video',
    descricao: 'Gateway Wi-Fi Metabee funcionando (mostra o logo MetaBee — só no case)',
    src: '/media/case-metabee.mp4',
    poster: '/media/case-metabee.jpg',
    alt: { pt: 'Gateway Wi-Fi desenvolvido para a Metabee', en: 'Wi-Fi gateway developed for Metabee', zh: '为 Metabee 开发的 Wi-Fi 网关' },
  },
  // O nome do cliente industrial nunca pode aparecer — a foto não tem marca nem nome.
  'case-industrial': {
    tipo: 'imagem',
    descricao: 'IHM/placa principal do equipamento industrial, sem marca nem nome do cliente',
    src: '/media/case-industrial.webp',
    alt: { pt: 'Interface de operação de equipamento industrial', en: 'Industrial equipment operator interface', zh: '工业设备操作界面' },
  },

  // Apoios
  'apoio-maker-faire': {
    tipo: 'video',
    descricao: 'Participação na Maker Faire Curitiba',
    src: '/media/apoio-maker-faire.mp4',
    poster: '/media/apoio-maker-faire.jpg',
    alt: { pt: 'Estande da DC Circuit Labs na Maker Faire Curitiba', en: 'DC Circuit Labs at Maker Faire Curitiba', zh: 'DC Circuit Labs 参加库里蒂巴创客嘉年华' },
  },
  'apoio-copa-pinhao': {
    tipo: 'video',
    descricao: 'Sistema de obstáculos e cronometragem da Copa Pinhão',
    src: '/media/apoio-copa-pinhao.mp4',
    poster: '/media/apoio-copa-pinhao.jpg',
    alt: { pt: 'Sistema de obstáculos da Copa Pinhão', en: 'Copa Pinhão obstacle system', zh: 'Copa Pinhão 障碍系统' },
  },

  // Sobre
  'sobre-laboratorio': {
    tipo: 'imagem',
    descricao: 'Laboratório / equipe trabalhando',
    src: '/media/sobre-laboratorio.webp',
    alt: { pt: 'Equipe da DC Circuit Labs no laboratório', en: 'DC Circuit Labs team in the lab', zh: 'DC Circuit Labs 团队在实验室' },
  },
} satisfies Record<string, Midia>;

export type IdMidia = keyof typeof MIDIA;

/** O item tem arquivo? Use para não renderizar a moldura (proporção, cantos) de uma mídia que não existe. */
export function temMidia(id: IdMidia): boolean {
  return Boolean((MIDIA[id] as Midia).src);
}
