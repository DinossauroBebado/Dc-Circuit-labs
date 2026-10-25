// Comportamentos comuns a todas as páginas.

const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- Cabeçalho: borda ao rolar ----------
const topo = document.querySelector<HTMLElement>('[data-topo]');
if (topo) {
  const atualizar = () => topo.classList.toggle('rolou', window.scrollY > 8);
  atualizar();
  window.addEventListener('scroll', atualizar, { passive: true });
}

// ---------- Menu móvel ----------
const botaoMenu = document.querySelector<HTMLButtonElement>('[data-menu-abrir]');
const menu = document.querySelector<HTMLElement>('[data-menu]');
if (botaoMenu && menu) {
  const rotulo = botaoMenu.querySelector<HTMLElement>('[data-menu-rotulo]');
  const iconeAbrir = botaoMenu.querySelector<HTMLElement>('[data-icone="abrir"]');
  const iconeFechar = botaoMenu.querySelector<HTMLElement>('[data-icone="fechar"]');
  const definir = (aberto: boolean) => {
    menu.hidden = !aberto;
    botaoMenu.setAttribute('aria-expanded', String(aberto));
    if (rotulo) rotulo.textContent = (aberto ? botaoMenu.dataset.rotuloFechar : botaoMenu.dataset.rotuloAbrir) ?? '';
    if (iconeAbrir) iconeAbrir.hidden = aberto;
    if (iconeFechar) iconeFechar.hidden = !aberto;
    document.body.style.overflow = aberto ? 'hidden' : '';
  };
  botaoMenu.addEventListener('click', () => definir(menu.hidden));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      definir(false);
      botaoMenu.focus();
    }
  });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => e.matches && definir(false));
}

// ---------- Origem do visitante (primeiro acesso da sessão), enviada junto com o lead ----------
// Use links com ?utm_source=instagram (ou ?origem=instagram) na bio e nos posts para separar as redes.
try {
  if (!sessionStorage.getItem('origem')) {
    const params = new URLSearchParams(location.search);
    const referencia = document.referrer && new URL(document.referrer).hostname;
    const origem =
      params.get('utm_source') ??
      params.get('origem') ??
      (referencia && referencia !== location.hostname ? referencia : 'direto');
    sessionStorage.setItem('origem', origem);
  }
} catch {
  /* armazenamento bloqueado: a mensagem sai com origem "site" */
}

// ---------- Idioma escolhido manualmente vale mais que o IP ----------
document.querySelectorAll<HTMLAnchorElement>('[data-idioma]').forEach((link) => {
  link.addEventListener('click', () => {
    document.cookie = `lang=${link.dataset.idioma}; Path=/; Max-Age=31536000; SameSite=Lax`;
  });
});

// ---------- Entrada suave dos blocos ----------
const revelaveis = document.querySelectorAll<HTMLElement>('.revelar');
if ('IntersectionObserver' in window && !reduzirMovimento.matches) {
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) {
          e.target.classList.add('visivel');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  revelaveis.forEach((el) => io.observe(el));
} else {
  revelaveis.forEach((el) => el.classList.add('visivel'));
}

// ---------- Brilho ciano que segue o cursor nos cards ----------
document.querySelectorAll<HTMLElement>('.card-brilho').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// ---------- Trilha de circuito acesa conforme o scroll ----------
// Cada [data-trilha] recebe --progresso (0 a 1); os nós [data-no] acendem quando a trilha passa por eles.
const trilhas = document.querySelectorAll<HTMLElement>('[data-trilha]');
if (trilhas.length) {
  const atualizarTrilhas = () => {
    const meio = window.innerHeight * 0.55;
    trilhas.forEach((trilha) => {
      const r = trilha.getBoundingClientRect();
      const progresso = reduzirMovimento.matches ? 1 : Math.min(1, Math.max(0, (meio - r.top) / r.height));
      trilha.style.setProperty('--progresso', progresso.toFixed(4));
      trilha.querySelectorAll<HTMLElement>('[data-no]').forEach((no) => {
        const posicao = (no.getBoundingClientRect().top + no.offsetHeight / 2 - r.top) / r.height;
        no.classList.toggle('aceso', progresso >= posicao);
      });
    });
  };
  let agendado = false;
  const agendar = () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => {
      agendado = false;
      atualizarTrilhas();
    });
  };
  atualizarTrilhas();
  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);
}

// ---------- Vídeos em loop: pausam fora da tela e respeitam "reduzir movimento" ----------
document.querySelectorAll<HTMLVideoElement>('video[data-video-auto]').forEach((video) => {
  if (reduzirMovimento.matches) {
    video.removeAttribute('autoplay');
    video.pause();
    return;
  }
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) video.play().catch(() => {});
    else video.pause();
  }).observe(video);
});

// ---------- Google Analytics 4 só depois do consentimento (LGPD) ----------
const idGA = document.documentElement.dataset.ga;
if (idGA) {
  const CHAVE = 'consentimento-analytics';
  const aviso = document.querySelector<HTMLElement>('[data-consentimento]');
  const botaoPreferencias = document.querySelector<HTMLButtonElement>('[data-abrir-consentimento]');
  const ler = () => {
    try {
      return localStorage.getItem(CHAVE);
    } catch {
      return null;
    }
  };
  const gravar = (valor: string) => {
    try {
      localStorage.setItem(CHAVE, valor);
    } catch {
      /* navegação privada: vale só nesta visita */
    }
  };
  let carregado = false;
  const carregarGA = () => {
    if (carregado) return;
    carregado = true;
    const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer.push(arguments);
    };
    w.gtag('js', new Date());
    w.gtag('config', idGA);
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(idGA)}`;
    document.head.append(s);
  };

  const escolha = ler();
  if (escolha === 'aceito') carregarGA();
  else if (!escolha && aviso) aviso.hidden = false;

  aviso?.querySelectorAll<HTMLButtonElement>('[data-consentir]').forEach((b) =>
    b.addEventListener('click', () => {
      const valor = b.dataset.consentir ?? 'recusado';
      gravar(valor);
      aviso.hidden = true;
      if (valor === 'aceito') carregarGA();
    }),
  );
  if (botaoPreferencias && aviso) {
    botaoPreferencias.hidden = false;
    botaoPreferencias.addEventListener('click', () => (aviso.hidden = false));
  }
}
