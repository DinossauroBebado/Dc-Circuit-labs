import type { Dicionario } from './pt';

export const en: Dicionario = {
  meta: {
    tag: 'en',
    og: 'en_US',
    nome: 'English',
    sigla: 'EN',
  },

  marca: {
    nome: 'DC Circuit Labs',
    tagline: 'Enabling high-complexity MVPs so great ideas can prove themselves.',
    resumo:
      'Engineering company in Curitiba, Brazil, focused on rapid hardware prototyping. Under the Hardware as a Service model, it delivers a documented, tested and validated prototype in 6 weeks, with electronics, firmware, mechanics, supply and integration under a single contract.',
    regiao: 'Curitiba and region · Paraná, Brazil',
  },

  nav: {
    servicos: 'Services',
    cases: 'Cases',
    apoios: 'Community',
    sobre: 'About',
    faq: 'FAQ',
    contato: 'Contact',
    entreEmContato: 'Contact Us',
    iniciar: 'Start a Project',
    menu: 'Open menu',
    fechar: 'Close menu',
    pular: 'Skip to content',
    idioma: 'Language',
    inicio: 'Home page',
  },

  comum: {
    saibaMais: 'Learn more',
    iniciarProjeto: 'Start a Project',
    nossosServicos: 'Our Services',
    prazoNota: 'Reference timeline. It varies with project complexity and component delivery.',
    pendente: 'Pending written authorization',
    carregar3d: 'View in 3D',
    dica3d: 'Drag to rotate · Scroll or pinch to zoom',
    montado: 'Assembled',
    explodido: 'Exploded',
    vistaExplodida: 'Exploded view',
    reproduzir: 'Play video',
    msgWhatsapp: 'Hello, DC Circuit Labs! I came from the website and would like to discuss a project.',
    pausar: 'Pause video',
  },

  home: {
    titulo: 'DC Circuit Labs — Rapid hardware prototyping in Curitiba, Brazil',
    descricao:
      'Enabling high-complexity MVPs so great ideas can prove themselves. A documented, tested and validated prototype in 6 weeks, under the Hardware as a Service model.',
    hero: {
      eyebrow: 'HARDWARE AS A SERVICE',
      texto:
        'An engineering team and a lab at your disposal until the prototype is ready. Electronics, firmware and mechanics under a single contract.',
    },
    prazo: {
      eyebrow: 'TIMELINE',
      numero: '6',
      unidade: 'weeks',
      texto: 'From kickoff to a documented, tested and validated prototype in your hands.',
    },
    modelo: {
      eyebrow: 'HOW IT WORKS',
      titulo: "You don't need to build an R&D team. Use ours.",
      passos: [
        {
          t: 'You bring the idea.',
          d: 'A sketch, a problem in your operation or a prototype that needs to evolve.',
        },
        {
          t: 'We bring the engineering.',
          d: 'Electronics, firmware, mechanics, supply and integration working together in our lab.',
        },
        {
          t: 'You get the prototype.',
          d: 'Documented, tested and validated — ready to show investors, customers or your team.',
        },
      ],
    },
    servicos: {
      eyebrow: 'WHAT WE DO',
      titulo: 'Every engineering discipline. One contract.',
      texto:
        'A multidisciplinary team delivers the complete, integrated prototype, with documentation, testing and validation — not loose parts.',
    },
    visualizador: {
      eyebrow: 'TAKE A CLOSER LOOK',
      titulo: 'Engineering you can turn in your hands.',
      texto: 'Every project leaves with a 3D model, schematics, bill of materials and manufacturing files.',
    },
    processo: {
      eyebrow: 'OUR PROCESS',
      titulo: 'Four stages. One accountable team.',
    },
    paraQuem: {
      eyebrow: "WHO IT'S FOR",
      titulo: 'For people who have the idea and want to see it work.',
      perfis: [
        {
          t: 'You took over the family business.',
          d: 'And want to innovate with technology: add value to the product, automate processes and collect data to deliver more to your customers.',
        },
        {
          t: 'You have a product idea.',
          d: 'And need an MVP to raise investment or to refine a product that already exists.',
        },
      ],
    },
    cases: {
      eyebrow: 'CASES',
      titulo: 'Ideas that became hardware.',
      link: 'See all cases',
    },
    apoios: {
      eyebrow: 'BEYOND PROJECTS',
      titulo: 'Technology is also built outside the contract.',
      texto: 'We support events and competitions that bring people closer to engineering and innovation.',
      link: 'See our community work',
    },
    cta: {
      eyebrow: "LET'S START",
      titulo: 'What stage is your idea at?',
      texto: 'Pick the closest option. The conversation starts from there.',
    },
  },

  processo: [
    {
      t: 'Kickoff',
      d: 'We understand the idea, its maturity and its constraints, and leave with technical requirements, scope and timeline.',
    },
    {
      t: 'Engineering',
      d: 'Electronics, firmware and mechanics move in parallel, with plan Bs and risks mapped from day one.',
    },
    {
      t: 'Prototype',
      d: 'We handle component purchasing, board manufacturing and assembly in our lab.',
    },
    {
      t: 'Validation and delivery',
      d: 'We test, document and deliver the validated prototype, with a test report and the project files.',
    },
  ],

  servicosPagina: {
    titulo: 'Hardware engineering services | DC Circuit Labs',
    descricao:
      'Electronics and PCB, firmware, mechanics, systems integration, manufacturing and supply, Edge AI and robotics — under a single contract, in Curitiba, Brazil.',
    eyebrow: 'SERVICES',
    h1: 'Everything a prototype needs to leave the drawing board.',
    lead: 'Seven engineering disciplines working together — and one team accountable for the result.',
  },

  servico: {
    entregas: 'WHAT WE DELIVER',
    stack: 'TECHNOLOGIES',
    processo: 'HOW WE WORK',
    outros: 'OTHER DISCIPLINES',
    ctaTitulo: "Let's get your idea off the drawing board.",
    ctaTexto: "Tell us what stage it's at and we'll suggest the best starting point.",
    sufixoTitulo: 'in Curitiba | DC Circuit Labs',
  },

  servicos: {
    'eletronica-pcb': {
      nome: 'Electronics and PCB',
      curto: 'Schematics, multilayer layout and files ready to manufacture.',
      h1: 'Boards that leave the schematic ready to manufacture.',
      lead: "We design your product's electronics from schematic to multilayer layout, choosing components for availability and cost — not just on spec.",
      descricao:
        'Electronics and PCB design in Curitiba, Brazil: schematics, multilayer layout, optimized bill of materials and manufacturing-ready Gerber files.',
      entregas: [
        { t: 'Schematics and components', d: 'Electrical architecture with components assessed for performance, availability and cost.' },
        { t: 'Multilayer layout', d: 'Routing designed for signal integrity, power and assembly.' },
        { t: 'Optimized bill of materials', d: 'BOM with cost per board and batch-size analysis.' },
        { t: 'Manufacturing files', d: 'Gerber, drill files, interactive BOM and production documentation.' },
      ],
      stack: ['Schematics', 'Multilayer layout', 'BOM', 'Gerber', 'Interactive BOM', 'Batch costing'],
    },
    firmware: {
      nome: 'Firmware and embedded',
      curto: 'C/C++ for microcontrollers, with communication and testing.',
      h1: 'The code that makes hardware work.',
      lead: 'We write C/C++ firmware for microcontrollers such as ESP32 and STM32, focused on efficiency, stability and reliable communication.',
      descricao:
        'C/C++ firmware development for ESP32 and STM32: drivers, RS-485, Wi-Fi and BLE communication, PLC integration and bench testing.',
      entregas: [
        { t: 'Low\u2060-\u2060level firmware', d: "Drivers, peripherals and control logic written for your product's hardware." },
        { t: 'Communication', d: 'RS-485, Wi-Fi, Bluetooth Low Energy and PLC integration.' },
        { t: 'Interfaces', d: 'Displays, buttons and indicators with instant response.' },
        { t: 'Bench testing', d: 'Every function validated and recorded in the test report.' },
      ],
      stack: ['C/C++', 'ESP32', 'STM32', 'RS-485', 'Wi-Fi', 'BLE'],
    },
    mecanica: {
      nome: 'Mechanics and CAD',
      curto: 'Parametric 3D modeling and manufacturing-ready files.',
      h1: 'The right shape for every board.',
      lead: 'We model enclosures, brackets and mechanisms in parametric CAD and check every fit before a single part is made.',
      descricao:
        'Mechanical design and CAD in Curitiba, Brazil: parametric 3D modeling, fit simulation, enclosures and manufacturing-ready technical files.',
      entregas: [
        { t: 'Parametric 3D modeling', d: 'Models that are easy to adjust with every new product version.' },
        { t: 'Fit simulation', d: 'Board, connectors and enclosure checked in the model before manufacturing.' },
        { t: 'Electromechanical integration', d: 'Mechanics and electronics designed together, with no rework at assembly.' },
        { t: 'Technical files', d: 'Drawings and models ready for manufacturing.' },
      ],
      stack: ['Parametric CAD', 'Assemblies', 'Fit simulation', 'Technical drawings', 'STEP'],
    },
    integracao: {
      nome: 'Systems integration',
      curto: 'Electronics, firmware, mechanics and apps working as one product.',
      h1: 'Parts that work together.',
      lead: 'We integrate electronics, firmware, mechanics and software into a single product — including apps that control the hardware over Bluetooth and Wi-Fi.',
      descricao:
        'Hardware systems integration: electronics, firmware and mechanics in one product, control apps over BLE and Wi-Fi and PLC communication.',
      entregas: [
        { t: 'End\u2060-\u2060to\u2060-\u2060end integration', d: 'One team responsible for making every part talk to the others.' },
        { t: 'Control apps', d: 'Native or cross-platform apps that control the hardware over BLE and Wi-Fi.' },
        { t: 'Equipment integration', d: 'Communication with PLCs, sensors and systems already running in your operation.' },
        { t: 'Operator interfaces', d: 'Controls and touchscreens designed for daily use.' },
      ],
      stack: ['BLE', 'Wi-Fi', 'PLC', 'Apps', 'Touchscreens', 'Sensors'],
    },
    manufatura: {
      nome: 'Manufacturing and supply',
      curto: 'Components, manufacturing and unit cost under control.',
      h1: 'From prototype to batch, with no cost surprises.',
      lead: 'We handle component purchasing and board manufacturing, and calculate the unit cost and the right batch size for your product.',
      descricao:
        'Hardware manufacturing and supply: component purchasing, board manufacturing and assembly, unit cost and batch-size analysis.',
      entregas: [
        { t: 'Component purchasing', d: 'Components quoted and purchased with lead time and availability in mind.' },
        { t: 'Manufacturing and assembly', d: 'Boards manufactured and assembled with partner suppliers.' },
        { t: 'Unit cost', d: 'Total cost per board, including taxes and shipping, so you decide with numbers.' },
        { t: 'Batch size', d: 'Minimum order, price breaks and shipping per board in one calculation.' },
      ],
      stack: ['BOM', 'Minimum order', 'Price breaks', 'Shipping per board', 'SMD assembly'],
    },
    'edge-ai': {
      nome: 'Edge AI and computer vision',
      curto: "Intelligence running right on your product's hardware.",
      h1: 'Intelligence that runs on the product itself.',
      lead: 'We implement Edge AI, computer vision and predictive algorithms that run directly on the hardware — no connection needed to make decisions.',
      descricao:
        "Embedded Edge AI and computer vision: optimized models and predictive algorithms running directly on your product's hardware.",
      entregas: [
        { t: 'Computer vision', d: 'Detection and inspection with cameras built into the product.' },
        { t: 'Embedded models', d: "Models optimized to run on your hardware's processor." },
        { t: 'Predictive algorithms', d: 'Sensor data turned into decisions and alerts.' },
        { t: 'Product integration', d: 'AI connected to the electronics, firmware and interface.' },
      ],
      stack: ['Edge AI', 'Computer vision', 'Embedded models', 'Predictive algorithms'],
    },
    robotica: {
      nome: 'Robotics and automation',
      curto: 'Sensors, actuators and autonomous control for mobile robots.',
      h1: 'Machines that move with precision.',
      lead: 'We integrate sensors, actuators, kinematics and autonomous control systems for mobile robots and process automation.',
      descricao:
        'Robotics and automation in Curitiba, Brazil: sensors, actuators, kinematics and autonomous control systems for mobile robots.',
      entregas: [
        { t: 'Sensors and actuators', d: 'Selection and integration of the parts that sense and act.' },
        { t: 'Kinematics', d: 'Motion modeling for precision and repeatability.' },
        { t: 'Autonomous control', d: 'Control systems for mobile robots.' },
        { t: 'Process automation', d: 'Repetitive tasks in your operation done by machines.' },
      ],
      stack: ['Sensors', 'Actuators', 'Kinematics', 'Autonomous control', 'Motors'],
    },
  },

  cases: {
    titulo: 'Cases | DC Circuit Labs',
    descricao: 'Hardware projects developed by DC Circuit Labs with clients in Paraná, Brazil.',
    eyebrow: 'CASES',
    h1: 'Ideas that became hardware.',
    lead: 'Projects developed with clients in Paraná, published with each client’s authorization.',
    vazio: 'New cases coming soon.',
    desafio: 'Challenge',
    solucao: 'What we did',
    resultado: 'Result',
    explore: 'Explore the 3D model',
    itens: {
      dnk: {
        cliente: 'DNK Agro',
        setor: 'Agribusiness',
        titulo: 'Technology for the field, from the silo to the remote control.',
        desafio: 'Automate operations and collect data in the field, with equipment that withstands agribusiness routine.',
        solucao:
          'We developed a remote control with a touchscreen and PLC communication, plus silo instrumentation and water-flow measurement.',
        resultado: '[To be filled in with the client: project results and figures.]',
      },
      metabee: {
        cliente: 'Metabee',
        setor: 'Payments',
        titulo: 'A Wi\u2060-\u2060Fi gateway for secure Pix payments.',
        desafio: 'Protect the network used for Pix payments.',
        solucao:
          'We designed the board for a dedicated Wi-Fi gateway, with ESP32 firmware and complete manufacturing documentation.',
        resultado: '[To be filled in with the client: project results and figures.]',
      },
      industrial: {
        cliente: 'Industrial client',
        setor: 'Industry',
        titulo: 'Operator interface and control board for industrial equipment.',
        desafio: 'Modernize the electronics of industrial equipment already in operation.',
        solucao: 'We developed the main control board and the operator interface (HMI) board for the equipment.',
        resultado: '[To be filled in: project results, without identifying the client.]',
      },
    },
  },

  apoios: {
    titulo: 'Community | DC Circuit Labs',
    descricao:
      'How DC Circuit Labs supports technology and innovation beyond paid projects: taking part in events and sponsoring competitions.',
    eyebrow: 'COMMUNITY',
    h1: 'Technology is also built outside the contract.',
    lead: 'We support events and competitions that bring people closer to engineering and innovation — in line with SDG 9: Industry, Innovation and Infrastructure.',
    vazio: 'More community projects coming soon.',
    itens: {
      makerFaire: {
        nome: 'Maker Faire Curitiba',
        tipo: 'Participation',
        texto:
          'We took part in Maker Faire Curitiba, bringing hardware prototyping closer to students, makers and entrepreneurs.',
      },
      copaPinhao: {
        nome: 'Copa Pinhão',
        tipo: 'Sponsorship',
        texto:
          'We sponsored Copa Pinhão with technology: we developed the modular obstacle system, a moving obstacle and PoE timing.',
      },
    },
  },

  sobre: {
    titulo: 'About DC Circuit Labs | Hardware as a Service in Paraná, Brazil',
    descricao:
      'Engineering company in Curitiba, Brazil, focused on rapid prototyping. DC Circuit Labs mission, vision and values.',
    eyebrow: 'ABOUT',
    h1: 'Closing the gap between the idea and the factory.',
    lead: 'DC Circuit Labs is an engineering company in Curitiba, Brazil, focused on rapid prototyping. We work under the Hardware as a Service model: you rent an engineering team and a lab until the project is ready, instead of building your own R&D.',
    missao: 'MISSION',
    missaoTexto:
      'To shorten the distance between the conception of an innovative product and its manufacturing in Brazil, bringing together university knowledge and the entrepreneur’s vision to keep developing the national industry.',
    visao: 'VISION',
    visaoTexto: 'A Brazil that develops and manufactures innovative products at competitive costs.',
    valores: 'VALUES',
    valoresLista: [
      {
        t: 'Clear and constant communication',
        d: 'With the team and with the client, because it decides whether the product works in the first iterations.',
      },
      { t: 'Agility', d: 'What can be done now gets done now.' },
      {
        t: 'Fail cheap',
        d: 'Choose with plan Bs and identified risks, instead of spending time and money on an exhaustive study.',
      },
      { t: 'Clearly defined skills', d: 'Knowing when to say no matters as much as saying yes.' },
      { t: 'Creativity', d: 'Treat every product as R&D, looking for the solution that cuts cost and time.' },
    ],
    publico: {
      eyebrow: 'WHO WE SERVE',
      titulo: 'People who have the idea and want to develop it.',
      texto:
        'Our client is not necessarily the person operating in the field or on the factory floor — it is the person who has the idea and wants to see it work.',
      setores: ['Agribusiness and food', 'Small and mid-sized manufacturers', 'Academic projects'],
    },
    ods: 'In public funding calls and institutional partnerships, our focus is SDG 9: Industry, Innovation and Infrastructure.',
    laboratorio: {
      eyebrow: 'THE LAB',
      titulo: 'Where ideas become hardware.',
    },
  },

  faq: {
    titulo: 'Hardware prototyping FAQ | DC Circuit Labs',
    descricao:
      'How long a prototype takes, what Hardware as a Service is, how much a hardware MVP costs and other common questions.',
    eyebrow: 'FAQ',
    h1: 'Frequently asked questions.',
    lead: 'Straight answers to the most common questions before starting a project.',
    maisDuvidas: 'Still have questions?',
    maisDuvidasTexto: 'Talk to us — we reply on WhatsApp or by email.',
    perguntas: [
      {
        p: 'What is Hardware as a Service?',
        r: 'It is a model where you rent an engineering team and a lab until your project is ready, instead of building your own R&D. DC Circuit Labs covers electronics and PCB, firmware, mechanics, manufacturing and supply, and systems integration under a single contract.',
      },
      {
        p: 'How long does a prototype take?',
        r: 'The reference is 6 weeks, from kickoff to a documented, tested and validated prototype in your hands. The timeline varies with project complexity and component delivery.',
      },
      {
        p: 'How much does a hardware MVP cost?',
        r: 'It depends on the scope: how many engineering disciplines the project involves, the complexity of the electronics and how many prototype units you need. After an initial conversation about your idea, we send a proposal with scope, timeline and investment.',
      },
      {
        p: 'Do I need a finished design to get started?',
        r: 'No. You can come with just the idea. In the first contact we ask what stage it is at — idea, prototype or product — to suggest the best starting point.',
      },
      {
        p: 'What do I get at the end?',
        r: 'A working, documented, tested and validated prototype, together with the project’s technical documentation: schematics, board layout, bill of materials, manufacturing files, firmware and test report.',
      },
      {
        p: 'Is the prototype under warranty?',
        r: 'We deliver a complete test report and, if a failure not mapped within the initial scope shows up, we revise the design at no extra cost. Boards and components for a new version are paid by the client.',
      },
      {
        p: 'Can you help with production at scale?',
        r: 'Yes, through our manufacturing and supply discipline: component quoting and purchasing, board manufacturing and assembly with partner suppliers, and unit-cost and batch-size analysis.',
      },
      {
        p: 'What kind of clients do you work with?',
        r: 'Mainly people who took over a family business and want to innovate with technology, and people with a product idea who need an MVP to raise investment. We work mostly in agribusiness and food, small and mid-sized manufacturing and academic projects.',
      },
      {
        p: 'Where do you operate?',
        r: 'We are based in Curitiba and serve Curitiba, its region and the whole state of Paraná, Brazil.',
      },
    ],
  },

  contato: {
    titulo: 'Contact | Start your project with DC Circuit Labs',
    descricao: 'Tell us what stage your idea is at and talk to DC Circuit Labs on WhatsApp or by email.',
    eyebrow: 'CONTACT',
    h1: "Let's get your idea off the drawing board.",
    lead: 'Three quick questions so we understand where you are — and start the conversation at the right point.',
    etapa: 'Step',
    de: 'of',
    perguntaFase: 'What stage is your idea at?',
    fases: [
      {
        id: 'ideia',
        t: "It's an idea",
        d: 'Nothing physical exists yet.',
        resposta: 'Great starting point. The first stage turns the idea into technical requirements, scope and timeline.',
      },
      {
        id: 'prototipo',
        t: 'I have a prototype',
        d: 'Something already works, but it needs to evolve.',
        resposta: "We'll assess what exists and define the shortest path to a validated prototype.",
      },
      {
        id: 'produto',
        t: 'I have a product',
        d: 'I want to improve it, cut costs or prepare it for scale.',
        resposta: 'We can review the design, optimize the bill of materials and prepare batch manufacturing.',
      },
    ],
    perguntaPerfil: 'Which best describes you?',
    perfis: [
      { id: 'familia', t: 'Family business or operating company' },
      { id: 'startup', t: 'Startup or product idea raising investment' },
      { id: 'academico', t: 'Academic project' },
      { id: 'outro', t: 'Other' },
    ],
    perguntaProjeto: 'Tell us a bit about the project.',
    campos: {
      nome: 'Your name',
      empresa: 'Company (optional)',
      projeto: 'What do you want to build?',
      projetoExemplo: 'E.g. a sensor that measures the silo level and sends an alert to my phone.',
    },
    whatsapp: 'Continue on WhatsApp',
    email: 'Send by email',
    voltar: 'Back',
    recomecar: 'Start over',
    mensagem: {
      saudacao: 'Hello, DC Circuit Labs!',
      nome: 'Name',
      empresa: 'Company',
      fase: 'Idea stage',
      perfil: 'Profile',
      projeto: 'Project',
      origem: 'Source',
      assunto: 'New project from the website',
    },
    privacidade: 'Your details go straight to our WhatsApp or email. Nothing is stored on this website.',
    direto: 'Prefer to talk directly?',
    rotuloEmail: 'Email',
    rotuloWhatsapp: 'WhatsApp',
    rotuloRegiao: 'Service area',
  },

  rodape: {
    navegacao: 'Navigation',
    contato: 'Contact',
    direitos: 'All rights reserved.',
    cookies: 'Cookie preferences',
    geoip: 'IP geolocation by DB-IP',
  },

  consentimento: {
    texto: 'We use analytics cookies (Google Analytics) only with your permission, to understand how the website is used.',
    aceitar: 'Accept',
    recusar: 'Decline',
  },

  erro: {
    titulo: 'Page not found | DC Circuit Labs',
    h1: 'Page not found.',
    texto: 'The link may be broken or the page may have moved.',
    voltar: 'Back to home',
  },
};
