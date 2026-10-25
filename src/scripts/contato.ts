// Fluxo de captação (DC-98): fase da ideia → perfil → projeto → mensagem pronta no WhatsApp ou e-mail.
// Nada é enviado a servidor nenhum: o texto é montado aqui e aberto no app do visitante.

interface Textos {
  mensagem: Record<'saudacao' | 'nome' | 'empresa' | 'fase' | 'perfil' | 'projeto' | 'origem' | 'assunto', string>;
  fases: Record<string, { t: string; resposta: string }>;
  perfis: Record<string, string>;
}

const form = document.querySelector<HTMLFormElement>('[data-fluxo]');

if (form) {
  const textos = JSON.parse(form.dataset.textos ?? '{}') as Textos;
  const etapas = [...form.querySelectorAll<HTMLFieldSetElement>('[data-etapa]')];
  const indicador = form.querySelector<HTMLElement>('[data-etapa-atual]');
  const voltar = form.querySelector<HTMLButtonElement>('[data-voltar]');
  const resposta = form.querySelector<HTMLElement>('[data-resposta]');
  const respostaTexto = form.querySelector<HTMLElement>('[data-resposta-texto]');
  let atual = 1;

  const irPara = (n: number, focar = true) => {
    atual = n;
    etapas.forEach((e) => (e.hidden = Number(e.dataset.etapa) !== n));
    if (resposta) resposta.hidden = n !== 2 || !respostaTexto?.textContent;
    if (indicador) indicador.textContent = String(n);
    form.style.setProperty('--etapa', String(n));
    if (voltar) voltar.hidden = n === 1;
    if (focar) {
      const alvo = etapas[n - 1].querySelector<HTMLElement>('input, textarea');
      alvo?.focus({ preventScroll: true });
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const valor = (nome: string) => (new FormData(form).get(nome) as string | null)?.trim() ?? '';

  const escolherFase = (id: string) => {
    if (respostaTexto) respostaTexto.textContent = textos.fases[id]?.resposta ?? '';
  };

  form.querySelectorAll<HTMLInputElement>('input[name="fase"]').forEach((r) =>
    r.addEventListener('change', () => {
      escolherFase(r.value);
      setTimeout(() => irPara(2), 220);
    }),
  );
  form.querySelectorAll<HTMLInputElement>('input[name="perfil"]').forEach((r) =>
    r.addEventListener('change', () => setTimeout(() => irPara(3), 220)),
  );
  voltar?.addEventListener('click', () => irPara(Math.max(1, atual - 1)));

  // Fase vinda do CTA da home (?fase=ideia) já chega selecionada.
  const faseInicial = new URLSearchParams(location.search).get('fase');
  const radioInicial = faseInicial
    ? form.querySelector<HTMLInputElement>(`input[name="fase"][value="${CSS.escape(faseInicial)}"]`)
    : null;
  if (radioInicial) {
    radioInicial.checked = true;
    escolherFase(radioInicial.value);
    irPara(2, false);
  } else {
    irPara(1, false);
  }

  const origem = () => {
    try {
      return sessionStorage.getItem('origem') ?? 'site';
    } catch {
      return 'site';
    }
  };

  const montarMensagem = () => {
    const m = textos.mensagem;
    const linhas = [m.saudacao, '', `${m.nome}: ${valor('nome')}`];
    if (valor('empresa')) linhas.push(`${m.empresa}: ${valor('empresa')}`);
    linhas.push(
      `${m.fase}: ${textos.fases[valor('fase')]?.t ?? '-'}`,
      `${m.perfil}: ${textos.perfis[valor('perfil')] ?? '-'}`,
      `${m.projeto}: ${valor('projeto')}`,
      '',
      `${m.origem}: ${origem()}`,
    );
    return linhas.join('\n');
  };

  const validar = () => {
    const campos = etapas[2].querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[required]');
    for (const campo of campos) {
      if (!campo.value.trim()) {
        campo.reportValidity();
        campo.focus();
        return false;
      }
    }
    return true;
  };

  const registrarLead = (canal: 'whatsapp' | 'email') => {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    gtag?.('event', 'generate_lead', { fase: valor('fase'), perfil: valor('perfil'), canal, origem: origem() });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validar()) return;
    registrarLead('whatsapp');
    const link = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(montarMensagem())}`;
    if (!window.open(link, '_blank', 'noopener')) location.href = link;
  });

  form.querySelector('[data-enviar-email]')?.addEventListener('click', () => {
    if (!validar()) return;
    registrarLead('email');
    const assunto = encodeURIComponent(textos.mensagem.assunto);
    location.href = `mailto:${form.dataset.email}?subject=${assunto}&body=${encodeURIComponent(montarMensagem())}`;
  });
}
