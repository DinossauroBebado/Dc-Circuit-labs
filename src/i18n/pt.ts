// Textos em português — a versão de referência. en.ts e zh.ts precisam ter exatamente a mesma estrutura.
// Fonte: Manual de Posicionamento de Marca (missão, visão, valores, tagline, regras de comunicação).
// Trechos entre [colchetes] são lacunas a preencher pelo time — não invente números.
// \u2060 (word joiner, invisível) em volta de hífens de títulos impede a quebra de linha em "Wi-Fi", "vê-la" etc.

export const pt = {
  meta: {
    tag: 'pt-BR',
    og: 'pt_BR',
    nome: 'Português',
    sigla: 'PT',
  },

  marca: {
    nome: 'DC Circuit Labs',
    tagline: 'Viabilizando MVPs de alta complexidade para que grandes ideias possam se provar.',
    resumo:
      'Empresa de engenharia em Curitiba focada em prototipagem rápida de hardware. No modelo Hardware as a Service, entrega um protótipo documentado, testado e validado em 6 semanas, com eletrônica, firmware, mecânica, suprimentos e integração sob um único contrato.',
    regiao: 'Curitiba e região · Paraná',
  },

  nav: {
    servicos: 'Serviços',
    cases: 'Cases',
    apoios: 'Apoios',
    sobre: 'Sobre',
    faq: 'FAQ',
    contato: 'Contato',
    entreEmContato: 'Entre em contato',
    iniciar: 'Iniciar Projeto',
    menu: 'Abrir menu',
    fechar: 'Fechar menu',
    pular: 'Pular para o conteúdo',
    idioma: 'Idioma',
    inicio: 'Página inicial',
  },

  comum: {
    saibaMais: 'Saiba mais',
    iniciarProjeto: 'Iniciar Projeto',
    nossosServicos: 'Nossos Serviços',
    prazoNota: 'Prazo de referência. Varia com a complexidade do projeto e a entrega dos componentes.',
    pendente: 'Pendente de autorização por escrito',
    carregar3d: 'Carregar modelo 3D',
    dica3d: 'Arraste para girar · Role ou use dois dedos para aproximar',
    montado: 'Montado',
    explodido: 'Explodido',
    vistaExplodida: 'Vista explodida',
    reproduzir: 'Reproduzir vídeo',
    msgWhatsapp: 'Olá, DC Circuit Labs! Vim pelo site e quero falar sobre um projeto.',
    pausar: 'Pausar vídeo',
  },

  home: {
    titulo: 'DC Circuit Labs — Prototipagem rápida de hardware em Curitiba',
    descricao:
      'Viabilizando MVPs de alta complexidade para que grandes ideias possam se provar. Protótipo documentado, testado e validado em 6 semanas, no modelo Hardware as a Service.',
    hero: {
      eyebrow: 'HARDWARE AS A SERVICE',
      texto:
        'Uma equipe de engenharia e um laboratório à sua disposição até o protótipo ficar pronto. Eletrônica, firmware e mecânica sob um único contrato.',
    },
    prazo: {
      eyebrow: 'PRAZO',
      numero: '6',
      unidade: 'semanas',
      texto: 'Do alinhamento ao protótipo documentado, testado e validado na sua mão.',
    },
    modelo: {
      eyebrow: 'COMO FUNCIONA',
      titulo: 'Você não precisa montar um P&D. Use o nosso.',
      passos: [
        {
          t: 'Você traz a ideia.',
          d: 'Pode ser um esboço, um problema da sua operação ou um protótipo que precisa evoluir.',
        },
        {
          t: 'Nós colocamos a engenharia.',
          d: 'Eletrônica, firmware, mecânica, suprimentos e integração trabalhando juntos no nosso laboratório.',
        },
        {
          t: 'Você recebe o protótipo.',
          d: 'Documentado, testado e validado — pronto para mostrar a investidores, clientes ou à sua equipe.',
        },
      ],
    },
    servicos: {
      eyebrow: 'O QUE FAZEMOS',
      titulo: 'Todas as frentes de engenharia. Um só contrato.',
      texto:
        'Uma equipe multidisciplinar entrega o protótipo completo e integrado, com documentação, testes e validação — não peças soltas.',
    },
    visualizador: {
      eyebrow: 'VEJA DE PERTO',
      titulo: 'Engenharia que você pode girar na mão.',
      texto: 'Cada projeto sai daqui com modelo 3D, esquemático, lista de materiais e arquivos de fabricação.',
    },
    processo: {
      eyebrow: 'NOSSO PROCESSO',
      titulo: 'Quatro etapas. Um só responsável.',
    },
    paraQuem: {
      eyebrow: 'PARA QUEM',
      titulo: 'Para quem tem a ideia e quer vê\u2060-\u2060la funcionando.',
      perfis: [
        {
          t: 'Você assumiu o negócio da família.',
          d: 'E quer inovar com tecnologia: aumentar o valor do produto, automatizar processos e coletar dados para entregar mais aos seus clientes.',
        },
        {
          t: 'Você tem uma ideia de produto.',
          d: 'E precisa de um MVP para buscar investimento ou aperfeiçoar um produto que já existe.',
        },
      ],
    },
    cases: {
      eyebrow: 'CASES',
      titulo: 'Ideias que já viraram hardware.',
      link: 'Ver todos os cases',
    },
    apoios: {
      eyebrow: 'ALÉM DOS PROJETOS',
      titulo: 'Tecnologia também se constrói fora do contrato.',
      texto: 'Apoiamos eventos e competições que aproximam pessoas da engenharia e da inovação.',
      link: 'Conheça nossos apoios',
    },
    cta: {
      eyebrow: 'VAMOS COMEÇAR',
      titulo: 'Em que fase está sua ideia?',
      texto: 'Escolha a opção mais próxima. A conversa começa a partir dela.',
    },
  },

  processo: [
    {
      t: 'Alinhamento',
      d: 'Entendemos a ideia, a maturidade e as restrições. Saímos com requisitos técnicos, escopo e prazo.',
    },
    {
      t: 'Engenharia',
      d: 'Eletrônica, firmware e mecânica avançam em paralelo, com planos B e riscos mapeados desde o início.',
    },
    {
      t: 'Protótipo',
      d: 'Cuidamos da compra de componentes, da fabricação das placas e da montagem no nosso laboratório.',
    },
    {
      t: 'Validação e entrega',
      d: 'Testamos, documentamos e entregamos o protótipo validado, com relatório de testes e os arquivos do projeto.',
    },
  ],

  servicosPagina: {
    titulo: 'Serviços de engenharia de hardware | DC Circuit Labs',
    descricao:
      'Eletrônica e PCB, firmware, mecânica, integração de sistemas, manufatura e suprimentos, Edge AI e robótica — sob um único contrato, em Curitiba.',
    eyebrow: 'SERVIÇOS',
    h1: 'Tudo o que um protótipo precisa para sair do papel.',
    lead: 'Sete frentes de engenharia que trabalham juntas — e um só responsável pelo resultado.',
  },

  servico: {
    entregas: 'O QUE ENTREGAMOS',
    stack: 'TECNOLOGIAS',
    processo: 'COMO TRABALHAMOS',
    outros: 'OUTRAS FRENTES',
    ctaTitulo: 'Vamos tirar sua ideia do papel?',
    ctaTexto: 'Conte em que fase ela está e indicamos o melhor ponto de partida.',
    sufixoTitulo: 'em Curitiba | DC Circuit Labs',
  },

  servicos: {
    'eletronica-pcb': {
      nome: 'Eletrônica e PCB',
      curto: 'Esquemático, layout multicamadas e arquivos prontos para fabricar.',
      h1: 'Placas que saem do esquemático prontas para fabricar.',
      lead: 'Projetamos a eletrônica do seu produto do esquemático ao layout multicamadas, com componentes escolhidos por disponibilidade e custo — não só por especificação.',
      descricao:
        'Projeto de eletrônica e PCB em Curitiba: esquemático, layout multicamadas, lista de materiais otimizada e arquivos Gerber prontos para fabricação.',
      entregas: [
        { t: 'Esquemático e componentes', d: 'Arquitetura elétrica com componentes avaliados por desempenho, disponibilidade e custo.' },
        { t: 'Layout multicamadas', d: 'Roteamento pensado para integridade de sinal, potência e montagem.' },
        { t: 'Lista de materiais otimizada', d: 'BOM com custo por placa e análise de tamanho de lote.' },
        { t: 'Arquivos de fabricação', d: 'Gerber, furação, BOM interativa e documentação para produção.' },
      ],
      stack: ['Esquemático', 'Layout multicamadas', 'BOM', 'Gerber', 'BOM interativa', 'Custo por lote'],
    },
    firmware: {
      nome: 'Firmware e embarcados',
      curto: 'C/C++ para microcontroladores, com comunicação e testes.',
      h1: 'O código que faz o hardware funcionar.',
      lead: 'Desenvolvemos firmware em C/C++ para microcontroladores como ESP32 e STM32, com foco em eficiência, estabilidade e comunicação confiável.',
      descricao:
        'Desenvolvimento de firmware em C/C++ para ESP32 e STM32: drivers, comunicação RS-485, Wi-Fi e BLE, integração com CLP e testes de bancada.',
      entregas: [
        { t: 'Firmware de baixo nível', d: 'Drivers, periféricos e lógica de controle escritos para o hardware do seu produto.' },
        { t: 'Comunicação', d: 'RS-485, Wi-Fi, Bluetooth Low Energy e integração com CLPs.' },
        { t: 'Interfaces', d: 'Telas, botões e indicadores com resposta imediata.' },
        { t: 'Testes de bancada', d: 'Cada função validada e registrada no relatório de testes.' },
      ],
      stack: ['C/C++', 'ESP32', 'STM32', 'RS-485', 'Wi-Fi', 'BLE'],
    },
    mecanica: {
      nome: 'Mecânica e CAD',
      curto: 'Modelagem 3D paramétrica e arquivos prontos para manufatura.',
      h1: 'A forma certa para cada placa.',
      lead: 'Modelamos gabinetes, suportes e mecanismos em CAD paramétrico e conferimos os encaixes antes de qualquer peça ser fabricada.',
      descricao:
        'Projeto mecânico e CAD em Curitiba: modelagem 3D paramétrica, simulação de encaixes, gabinetes e arquivos técnicos prontos para manufatura.',
      entregas: [
        { t: 'Modelagem 3D paramétrica', d: 'Modelos fáceis de ajustar a cada nova versão do produto.' },
        { t: 'Simulação de encaixes', d: 'Placa, conectores e carcaça conferidos no modelo antes da fabricação.' },
        { t: 'Integração eletromecânica', d: 'Mecânica e eletrônica projetadas juntas, sem retrabalho na montagem.' },
        { t: 'Arquivos técnicos', d: 'Desenhos e modelos prontos para manufatura.' },
      ],
      stack: ['CAD paramétrico', 'Montagens', 'Simulação de encaixe', 'Desenho técnico', 'STEP'],
    },
    integracao: {
      nome: 'Integração de sistemas',
      curto: 'Eletrônica, firmware, mecânica e apps funcionando como um só produto.',
      h1: 'Peças que funcionam juntas.',
      lead: 'Integramos eletrônica, firmware, mecânica e software em um só produto — incluindo apps para controlar o hardware por Bluetooth e Wi-Fi.',
      descricao:
        'Integração de sistemas de hardware: eletrônica, firmware e mecânica em um só produto, apps de controle via BLE e Wi-Fi e comunicação com CLPs.',
      entregas: [
        { t: 'Integração ponta a ponta', d: 'Uma só equipe responsável por fazer todas as partes conversarem.' },
        { t: 'Apps de controle', d: 'Aplicativos nativos ou multiplataforma para controlar o hardware via BLE e Wi-Fi.' },
        { t: 'Integração com equipamentos', d: 'Comunicação com CLPs, sensores e sistemas já instalados na sua operação.' },
        { t: 'Interfaces de operação', d: 'Controles e telas touch pensados para quem usa no dia a dia.' },
      ],
      stack: ['BLE', 'Wi-Fi', 'CLP', 'Apps', 'Telas touch', 'Sensores'],
    },
    manufatura: {
      nome: 'Manufatura e suprimentos',
      curto: 'Componentes, fabricação e custo por unidade sob controle.',
      h1: 'Do protótipo ao lote, sem surpresa no custo.',
      lead: 'Cuidamos da compra de componentes e da fabricação das placas, e calculamos o custo por unidade e o tamanho de lote ideal para o seu produto.',
      descricao:
        'Manufatura e suprimentos para hardware: compra de componentes, fabricação e montagem de placas, custo por unidade e análise de tamanho de lote.',
      entregas: [
        { t: 'Compra de componentes', d: 'Componentes cotados e comprados considerando prazo e disponibilidade.' },
        { t: 'Fabricação e montagem', d: 'Placas fabricadas e montadas com fornecedores parceiros.' },
        { t: 'Custo por unidade', d: 'Custo total da placa, com impostos e frete, para decidir com números.' },
        { t: 'Tamanho de lote', d: 'Quantidade mínima, faixas de preço e frete por placa na mesma conta.' },
      ],
      stack: ['BOM', 'Lote mínimo', 'Faixas de preço', 'Frete por placa', 'Montagem SMD'],
    },
    'edge-ai': {
      nome: 'Edge AI e visão computacional',
      curto: 'Inteligência rodando direto no hardware do seu produto.',
      h1: 'Inteligência que roda no próprio produto.',
      lead: 'Implementamos Edge AI, visão computacional e algoritmos preditivos executados direto no hardware — sem depender de conexão para decidir.',
      descricao:
        'Edge AI e visão computacional embarcada: modelos otimizados e algoritmos preditivos rodando direto no hardware do seu produto.',
      entregas: [
        { t: 'Visão computacional', d: 'Detecção e inspeção com câmeras integradas ao produto.' },
        { t: 'Modelos embarcados', d: 'Modelos otimizados para rodar no processador do seu hardware.' },
        { t: 'Algoritmos preditivos', d: 'Dados dos sensores transformados em decisões e alertas.' },
        { t: 'Integração com o produto', d: 'IA conectada à eletrônica, ao firmware e à interface.' },
      ],
      stack: ['Edge AI', 'Visão computacional', 'Modelos embarcados', 'Algoritmos preditivos'],
    },
    robotica: {
      nome: 'Robótica e automação',
      curto: 'Sensores, atuadores e controle autônomo para robôs móveis.',
      h1: 'Máquinas que se movem com precisão.',
      lead: 'Integramos sensores, atuadores, cinemática e sistemas de controle autônomo para robôs móveis e automação de processos.',
      descricao:
        'Robótica e automação em Curitiba: sensores, atuadores, cinemática e sistemas de controle autônomo para robôs móveis.',
      entregas: [
        { t: 'Sensores e atuadores', d: 'Seleção e integração dos componentes que percebem e agem.' },
        { t: 'Cinemática', d: 'Modelagem do movimento para precisão e repetibilidade.' },
        { t: 'Controle autônomo', d: 'Sistemas de controle para robôs móveis.' },
        { t: 'Automação de processos', d: 'Tarefas repetitivas da sua operação feitas por máquina.' },
      ],
      stack: ['Sensores', 'Atuadores', 'Cinemática', 'Controle autônomo', 'Motores'],
    },
  },

  cases: {
    titulo: 'Cases | DC Circuit Labs',
    descricao: 'Projetos de hardware desenvolvidos pela DC Circuit Labs com clientes do Paraná.',
    eyebrow: 'CASES',
    h1: 'Ideias que já viraram hardware.',
    lead: 'Projetos desenvolvidos com clientes do Paraná, publicados com autorização de cada um.',
    vazio: 'Novos cases em breve.',
    desafio: 'Desafio',
    solucao: 'O que fizemos',
    resultado: 'Resultado',
    explore: 'Explore o modelo 3D',
    itens: {
      dnk: {
        cliente: 'DNK Agro',
        setor: 'Agronegócio',
        titulo: 'Tecnologia para o campo, do silo ao controle remoto.',
        desafio: 'Automatizar operações e coletar dados no campo, com equipamentos que aguentem a rotina do agronegócio.',
        solucao:
          'Desenvolvemos um controle remoto com tela touch e comunicação com CLP, além da instrumentação de silos e da medição de fluxo de água.',
        resultado: '[A preencher com o cliente: resultado e números do projeto.]',
      },
      metabee: {
        cliente: 'Metabee',
        setor: 'Pagamentos',
        titulo: 'Um gateway Wi\u2060-\u2060Fi para pagar com Pix com segurança.',
        desafio: 'Proteger a rede usada em pagamentos via Pix.',
        solucao:
          'Projetamos a placa de um gateway Wi-Fi dedicado, com firmware para ESP32 e documentação completa de fabricação.',
        resultado: '[A preencher com o cliente: resultado e números do projeto.]',
      },
      industrial: {
        cliente: 'Cliente industrial',
        setor: 'Indústria',
        titulo: 'Interface de operação e placa de controle para equipamento industrial.',
        desafio: 'Modernizar a eletrônica de um equipamento industrial em operação.',
        solucao: 'Desenvolvemos a placa principal de controle e a placa da interface de operação (IHM) do equipamento.',
        resultado: '[A preencher: resultado do projeto, sem identificar o cliente.]',
      },
    },
  },

  apoios: {
    titulo: 'Apoios | DC Circuit Labs',
    descricao:
      'Como a DC Circuit Labs incentiva tecnologia e inovação fora dos projetos pagos: participação em eventos e patrocínio de competições.',
    eyebrow: 'APOIOS',
    h1: 'Tecnologia também se constrói fora do contrato.',
    lead: 'Apoiamos eventos e competições que aproximam pessoas da engenharia e da inovação — em linha com o ODS 9: Indústria, Inovação e Infraestrutura.',
    vazio: 'Novos apoios em breve.',
    itens: {
      makerFaire: {
        nome: 'Maker Faire Curitiba',
        tipo: 'Participação',
        texto:
          'Participamos da Maker Faire Curitiba, levando a prototipagem de hardware para perto de estudantes, makers e empreendedores.',
      },
      copaPinhao: {
        nome: 'Copa Pinhão',
        tipo: 'Patrocínio',
        texto:
          'Patrocinamos a Copa Pinhão com tecnologia: desenvolvemos o sistema modular de obstáculos, um obstáculo móvel e a cronometragem com PoE.',
      },
    },
  },

  sobre: {
    titulo: 'Sobre a DC Circuit Labs | Hardware as a Service no Paraná',
    descricao:
      'Empresa de engenharia de Curitiba focada em prototipagem rápida. Missão, visão e valores da DC Circuit Labs.',
    eyebrow: 'SOBRE',
    h1: 'Encurtando a distância entre a ideia e a fábrica.',
    lead: 'A DC Circuit Labs é uma empresa de engenharia de Curitiba focada em prototipagem rápida. Trabalhamos no modelo Hardware as a Service: você aluga uma equipe de engenharia e um laboratório até o projeto ficar pronto, em vez de montar um P&D próprio.',
    missao: 'MISSÃO',
    missaoTexto:
      'Encurtar a distância entre a concepção de um produto inovador e a sua fabricação no Brasil, integrando o conhecimento das universidades com a visão do empreendedor, para desenvolver cada vez mais a indústria nacional.',
    visao: 'VISÃO',
    visaoTexto: 'Um Brasil que desenvolve e fabrica produtos inovadores a custos competitivos.',
    valores: 'VALORES',
    valoresLista: [
      {
        t: 'Comunicação clara e constante',
        d: 'Com a equipe e com o cliente, porque decide se o produto funciona nas primeiras iterações.',
      },
      { t: 'Agilidade', d: 'O que pode ser feito agora é feito agora.' },
      {
        t: 'Errar barato',
        d: 'Escolher com planos B e riscos identificados, em vez de gastar tempo e dinheiro em um estudo completo.',
      },
      { t: 'Definição clara das habilidades', d: 'Saber dizer não é tão importante quanto dizer sim.' },
      { t: 'Criatividade', d: 'Tratar cada produto como P&D, buscando a solução que corte custo e tempo.' },
    ],
    publico: {
      eyebrow: 'QUEM ATENDEMOS',
      titulo: 'Quem tem a ideia e quer desenvolvê\u2060-\u2060la.',
      texto:
        'Nosso cliente não é necessariamente quem opera no campo ou na fábrica — é quem tem a ideia e quer vê-la funcionando.',
      setores: ['Agronegócio e alimentos', 'Pequenas e médias indústrias', 'Projetos acadêmicos'],
    },
    ods: 'Em editais e parcerias institucionais, nosso foco é o ODS 9: Indústria, Inovação e Infraestrutura.',
    laboratorio: {
      eyebrow: 'O LABORATÓRIO',
      titulo: 'Onde as ideias viram hardware.',
    },
  },

  faq: {
    titulo: 'Perguntas frequentes sobre prototipagem de hardware | DC Circuit Labs',
    descricao:
      'Quanto tempo leva um protótipo, o que é Hardware as a Service, quanto custa um MVP de hardware e outras dúvidas comuns.',
    eyebrow: 'FAQ',
    h1: 'Perguntas frequentes.',
    lead: 'Respostas diretas para as dúvidas mais comuns antes de começar um projeto.',
    maisDuvidas: 'Ainda tem dúvidas?',
    maisDuvidasTexto: 'Fale com a gente — respondemos pelo WhatsApp ou por e-mail.',
    perguntas: [
      {
        p: 'O que é Hardware as a Service?',
        r: 'É um modelo em que você aluga uma equipe de engenharia e um laboratório até o seu projeto ficar pronto, em vez de montar um P&D próprio. A DC Circuit Labs cobre eletrônica e PCB, firmware, mecânica, manufatura e suprimentos e integração de sistemas em um único contrato.',
      },
      {
        p: 'Quanto tempo leva um protótipo?',
        r: 'A referência é 6 semanas, do alinhamento até o protótipo documentado, testado e validado na sua mão. O prazo varia com a complexidade do projeto e com a entrega dos componentes.',
      },
      {
        p: 'Quanto custa um MVP de hardware?',
        r: 'Depende do escopo: quantas frentes de engenharia o projeto envolve, a complexidade da eletrônica e quantas unidades de protótipo você precisa. Depois de uma conversa inicial sobre a sua ideia, enviamos uma proposta com escopo, prazo e investimento.',
      },
      {
        p: 'Preciso ter um projeto pronto para começar?',
        r: 'Não. Você pode chegar só com a ideia. No primeiro contato perguntamos em que fase ela está — ideia, protótipo ou produto — para indicar o melhor ponto de partida.',
      },
      {
        p: 'O que eu recebo no final?',
        r: 'Um protótipo funcional, documentado, testado e validado, junto com a documentação técnica do projeto: esquemáticos, layout da placa, lista de materiais, arquivos de fabricação, firmware e relatório de testes.',
      },
      {
        p: 'O protótipo tem garantia?',
        r: 'Entregamos um relatório de testes completo e, se aparecer uma falha não mapeada dentro do escopo inicial, fazemos a revisão de projeto sem custo adicional. Placas e componentes de uma nova versão ficam por conta do cliente.',
      },
      {
        p: 'Vocês ajudam a produzir em escala?',
        r: 'Sim, pela frente de manufatura e suprimentos: cotação e compra de componentes, fabricação e montagem das placas com fornecedores parceiros e análise de custo por unidade e de tamanho de lote.',
      },
      {
        p: 'Que tipo de cliente vocês atendem?',
        r: 'Principalmente quem assumiu um negócio de família e quer inovar com tecnologia, e quem tem uma ideia de produto e precisa de um MVP para buscar investimento. Atuamos sobretudo em agronegócio e alimentos, pequenas e médias indústrias e projetos acadêmicos.',
      },
      {
        p: 'Onde vocês atendem?',
        r: 'Somos de Curitiba e atendemos Curitiba e região e todo o Paraná.',
      },
    ],
  },

  contato: {
    titulo: 'Contato | Inicie seu projeto com a DC Circuit Labs',
    descricao: 'Conte em que fase está sua ideia e fale com a DC Circuit Labs pelo WhatsApp ou por e-mail.',
    eyebrow: 'CONTATO',
    h1: 'Vamos tirar sua ideia do papel.',
    lead: 'Três perguntas rápidas para entendermos onde você está — e começar a conversa do ponto certo.',
    etapa: 'Etapa',
    de: 'de',
    perguntaFase: 'Em que fase está sua ideia?',
    fases: [
      {
        id: 'ideia',
        t: 'É uma ideia',
        d: 'Ainda não existe nada físico.',
        resposta: 'Ótimo ponto de partida. A primeira etapa é transformar a ideia em requisitos técnicos, escopo e prazo.',
      },
      {
        id: 'prototipo',
        t: 'Tenho um protótipo',
        d: 'Já existe algo funcionando, mas precisa evoluir.',
        resposta: 'Vamos avaliar o que já existe e definir o caminho mais curto até um protótipo validado.',
      },
      {
        id: 'produto',
        t: 'Tenho um produto',
        d: 'Quero melhorar, reduzir custo ou preparar para escala.',
        resposta: 'Podemos revisar o projeto, otimizar a lista de materiais e preparar a fabricação em lote.',
      },
    ],
    perguntaPerfil: 'Qual é o seu perfil?',
    perfis: [
      { id: 'familia', t: 'Negócio da família ou empresa em operação' },
      { id: 'startup', t: 'Startup ou ideia de produto buscando investimento' },
      { id: 'academico', t: 'Projeto acadêmico' },
      { id: 'outro', t: 'Outro' },
    ],
    perguntaProjeto: 'Conte um pouco do projeto.',
    campos: {
      nome: 'Seu nome',
      empresa: 'Empresa (opcional)',
      projeto: 'O que você quer construir?',
      projetoExemplo: 'Ex.: um sensor que mede o nível do silo e manda um alerta para o celular.',
    },
    whatsapp: 'Continuar no WhatsApp',
    email: 'Enviar por e-mail',
    voltar: 'Voltar',
    recomecar: 'Recomeçar',
    mensagem: {
      saudacao: 'Olá, DC Circuit Labs!',
      nome: 'Nome',
      empresa: 'Empresa',
      fase: 'Fase da ideia',
      perfil: 'Perfil',
      projeto: 'Projeto',
      origem: 'Origem',
      assunto: 'Novo projeto pelo site',
    },
    privacidade: 'Os dados vão direto para o nosso WhatsApp ou e-mail. Nada fica guardado neste site.',
    direto: 'Prefere falar direto?',
    rotuloEmail: 'E-mail',
    rotuloWhatsapp: 'WhatsApp',
    rotuloRegiao: 'Atendimento',
  },

  rodape: {
    navegacao: 'Navegação',
    contato: 'Contato',
    direitos: 'Todos os direitos reservados.',
    cookies: 'Preferências de cookies',
    geoip: 'Geolocalização por IP: DB-IP',
  },

  consentimento: {
    texto: 'Usamos cookies de análise (Google Analytics) só com a sua permissão, para entender como o site é usado.',
    aceitar: 'Aceitar',
    recusar: 'Recusar',
  },

  erro: {
    titulo: 'Página não encontrada | DC Circuit Labs',
    h1: 'Página não encontrada.',
    texto: 'O link pode estar quebrado ou a página mudou de lugar.',
    voltar: 'Voltar para o início',
  },
};

export type Dicionario = typeof pt;
