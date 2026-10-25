// Todas as fotos, vídeos e modelos 3D do site passam por aqui.
//
// Para trocar um placeholder pelo arquivo real:
//   1. Processe o arquivo bruto com `npm run midia` (veja scripts/processar-midia.sh) — ele salva em public/media/
//   2. Preencha `src` (e `poster`, para vídeo) no item correspondente abaixo
//   3. Apague o comentário PLACEHOLDER da linha
// Enquanto `src` estiver vazio, o site mostra um bloco com o gradiente da marca no lugar.
//
// `sugestao` aponta o material que já existe na pasta "marketing" do Google Drive.

export type TipoMidia = 'video' | 'imagem' | 'modelo';

export interface Midia {
  tipo: TipoMidia;
  /** O que deve entrar aqui — só para o time, nunca aparece no build de produção. */
  descricao: string;
  sugestao?: string;
  src?: string;
  poster?: string;
  /** Texto alternativo por idioma. */
  alt: { pt: string; en: string; zh: string };
}

export const MIDIA = {
  // PLACEHOLDER: substituir pelo vídeo do laboratório (loop de 6 a 10 s, sem áudio)
  'hero-laboratorio': {
    tipo: 'video',
    descricao: 'Vídeo do laboratório em loop: bancada, soldagem, teste de placa',
    sugestao: 'Gravar no laboratório — evitar imagens de projeto de cliente sem autorização',
    alt: {
      pt: 'Bancada do laboratório da DC Circuit Labs',
      en: 'DC Circuit Labs lab bench',
      zh: 'DC Circuit Labs 实验室工作台',
    },
  },
  // PLACEHOLDER: substituir pela foto de eletrônica/PCB
  'servico-eletronica-pcb': {
    tipo: 'imagem',
    descricao: 'Foto de placa montada ou do layout na tela',
    alt: { pt: 'Placa de circuito impresso projetada pela DC Circuit Labs', en: 'Printed circuit board designed by DC Circuit Labs', zh: 'DC Circuit Labs 设计的印刷电路板' },
  },
  // PLACEHOLDER: substituir pela foto de firmware (placa ligada ao computador, monitor serial)
  'servico-firmware': {
    tipo: 'imagem',
    descricao: 'Foto de placa conectada ao computador durante gravação/teste de firmware',
    alt: { pt: 'Teste de firmware em bancada', en: 'Firmware testing on the bench', zh: '工作台上的固件测试' },
  },
  // PLACEHOLDER: substituir pela foto/render de mecânica (gabinete, peça impressa)
  'servico-mecanica': {
    tipo: 'imagem',
    descricao: 'Render do CAD ou foto de gabinete/peça',
    alt: { pt: 'Modelo 3D de gabinete', en: '3D enclosure model', zh: '外壳 3D 模型' },
  },
  // PLACEHOLDER: substituir pela foto de integração (sistema completo montado, app no celular)
  'servico-integracao': {
    tipo: 'imagem',
    descricao: 'Foto do sistema completo funcionando (hardware + app)',
    alt: { pt: 'Sistema integrado em funcionamento', en: 'Integrated system in operation', zh: '运行中的集成系统' },
  },
  // PLACEHOLDER: substituir pela foto de manufatura (lote de placas, componentes)
  'servico-manufatura': {
    tipo: 'imagem',
    descricao: 'Foto de lote de placas ou bandeja de componentes',
    alt: { pt: 'Lote de placas montadas', en: 'Batch of assembled boards', zh: '一批已组装的电路板' },
  },
  // PLACEHOLDER: substituir pela foto de Edge AI (câmera, detecção na tela)
  'servico-edge-ai': {
    tipo: 'imagem',
    descricao: 'Foto de câmera/placa rodando visão computacional',
    alt: { pt: 'Visão computacional rodando no hardware', en: 'Computer vision running on the hardware', zh: '在硬件上运行的计算机视觉' },
  },
  // PLACEHOLDER: substituir pela foto de robótica (robô móvel, atuadores)
  'servico-robotica': {
    tipo: 'imagem',
    descricao: 'Foto de robô móvel ou mecanismo automatizado',
    alt: { pt: 'Robô móvel em teste', en: 'Mobile robot under test', zh: '测试中的移动机器人' },
  },

  // Modelos 3D — os arquivos atuais são placeholders gerados por `npm run modelos`.
  // PLACEHOLDER: substituir pelo GLB real da placa Metabee (exportado do CAD; há um .step em metabee/wifi-connect/1_0/fabricacao/)
  'modelo-placa': {
    tipo: 'modelo',
    descricao: 'Placa Metabee em glTF/GLB (rotável, zoom)',
    src: '/models/placa-placeholder.glb',
    poster: '/models/placa-poster.svg',
    alt: { pt: 'Modelo 3D de uma placa de circuito', en: '3D model of a circuit board', zh: '电路板 3D 模型' },
  },
  // PLACEHOLDER: substituir pelo GLB real do controle DNK Agro em visão explodida (com animação chamada "explodir")
  'modelo-controle': {
    tipo: 'modelo',
    descricao: 'Controle DNK Agro em visão explodida, com animação "explodir"',
    src: '/models/controle-explodido-placeholder.glb',
    poster: '/models/controle-poster.svg',
    alt: { pt: 'Modelo 3D de um controle em visão explodida', en: 'Exploded 3D model of a controller', zh: '控制器 3D 爆炸视图' },
  },

  // Cases (só aparecem no build de produção depois da autorização por escrito)
  // PLACEHOLDER: substituir pelo vídeo do controle DNK Agro em uso
  'case-dnk': {
    tipo: 'video',
    descricao: 'Controle DNK Agro em uso no campo',
    sugestao: 'Ainda não há material da DNK na pasta do Drive',
    alt: { pt: 'Controle remoto desenvolvido para a DNK Agro', en: 'Remote control developed for DNK Agro', zh: '为 DNK Agro 开发的遥控器' },
  },
  // PLACEHOLDER: substituir pelo vídeo da placa Metabee funcionando
  'case-metabee': {
    tipo: 'video',
    descricao: 'Gateway Wi-Fi Metabee funcionando',
    sugestao: 'Drive › Mídia › Metabee (≈20 vídeos de 19/09 e 3 fotos)',
    alt: { pt: 'Gateway Wi-Fi desenvolvido para a Metabee', en: 'Wi-Fi gateway developed for Metabee', zh: '为 Metabee 开发的 Wi-Fi 网关' },
  },
  // PLACEHOLDER: substituir por foto que NÃO identifique o cliente (nome nunca pode aparecer)
  'case-industrial': {
    tipo: 'imagem',
    descricao: 'Foto da IHM/placa principal sem marca ou nome do cliente',
    sugestao: 'Pasta do cliente industrial no Drive — só usar após autorização e sem identificar o cliente',
    alt: { pt: 'Interface de operação de equipamento industrial', en: 'Industrial equipment operator interface', zh: '工业设备操作界面' },
  },

  // Apoios
  // PLACEHOLDER: substituir pelo vídeo da Maker Faire Curitiba
  'apoio-maker-faire': {
    tipo: 'video',
    descricao: 'Participação na Maker Faire Curitiba',
    sugestao: 'Drive › Mídia › Maker Faire › 20260906_172743.mp4',
    alt: { pt: 'Estande da DC Circuit Labs na Maker Faire Curitiba', en: 'DC Circuit Labs at Maker Faire Curitiba', zh: 'DC Circuit Labs 参加库里蒂巴创客嘉年华' },
  },
  // PLACEHOLDER: substituir pelo vídeo da Copa Pinhão (obstáculos, cronometragem)
  'apoio-copa-pinhao': {
    tipo: 'video',
    descricao: 'Sistema de obstáculos e cronometragem da Copa Pinhão',
    sugestao: 'Drive › Mídia › Copa pinhão (4 vídeos de 05 e 07/09)',
    alt: { pt: 'Sistema de obstáculos da Copa Pinhão', en: 'Copa Pinhão obstacle system', zh: 'Copa Pinhão 障碍系统' },
  },

  // Sobre
  // PLACEHOLDER: substituir pela foto do laboratório/equipe trabalhando
  'sobre-laboratorio': {
    tipo: 'imagem',
    descricao: 'Foto do laboratório ou da equipe trabalhando',
    alt: { pt: 'Equipe da DC Circuit Labs no laboratório', en: 'DC Circuit Labs team in the lab', zh: 'DC Circuit Labs 团队在实验室' },
  },
} satisfies Record<string, Midia>;

export type IdMidia = keyof typeof MIDIA;
