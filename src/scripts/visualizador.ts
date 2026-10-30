// Carrega o <model-viewer> quando o visitante clica em "Ver em 3D" e liga o controle de vista explodida.

interface ModelViewer extends HTMLElement {
  animationName: string;
  currentTime: number;
  duration: number;
  pause(): void;
}

const figuras = document.querySelectorAll<HTMLElement>('[data-v3d]');

let biblioteca: Promise<unknown> | null = null;
const carregarBiblioteca = () => (biblioteca ??= import('@google/model-viewer'));

function ligarExplosao(figura: HTMLElement, viewer: ModelViewer) {
  const controle = figura.querySelector<HTMLInputElement>('[data-v3d-explodir]');
  if (!controle) return;
  viewer.animationName = 'explodir';
  viewer.pause();
  const aplicar = () => {
    viewer.currentTime = Number(controle.value) * (viewer.duration || 1.6);
  };
  controle.disabled = false;
  controle.addEventListener('input', aplicar);
  aplicar();

  // Uma demonstração curta da explosão na primeira vez que o modelo aparece.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const inicio = performance.now();
  const animar = (agora: number) => {
    const t = Math.min(1, (agora - inicio) / 1400);
    const suave = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    controle.value = String(0.7 * suave);
    aplicar();
    if (t < 1) requestAnimationFrame(animar);
  };
  requestAnimationFrame(animar);
}

figuras.forEach((figura) => {
  const viewer = figura.querySelector<ModelViewer>('model-viewer');
  if (!viewer) return;
  viewer.addEventListener('load', () => {
    figura.classList.add('carregado');
    ligarExplosao(figura, viewer);
  });

  // O modelo só é baixado e desenhado quando o visitante pede: carregar sozinho ao rolar travava
  // a página por vários segundos em celulares e computadores sem placa de vídeo.
  const botao = figura.querySelector<HTMLButtonElement>('[data-v3d-carregar]');
  botao?.addEventListener(
    'click',
    () => {
      botao.hidden = true;
      figura.classList.add('carregando');
      carregarBiblioteca();
    },
    { once: true },
  );
});
