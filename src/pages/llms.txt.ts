// llms.txt (https://llmstxt.org): resumo da empresa para agentes de IA, em PT e EN, gerado a partir
// dos mesmos textos do site — assim a frase de posicionamento é idêntica em todo lugar.
import type { APIRoute } from 'astro';
import { CONTATO, t, urlPagina, type Idioma } from '../i18n';
import { SERVICOS } from '../data/servicos';
import { CASES, visiveis } from '../data/autorizacoes';

function secao(lang: Idioma, abs: (c: string) => string) {
  const d = t(lang);
  const casesPublicos = visiveis(CASES).filter((c) => c.autorizado);
  const linhas = [
    `## ${lang === 'pt' ? 'Serviços' : 'Services'}`,
    '',
    ...SERVICOS.map((s) => `- [${d.servicos[s.slug].nome}](${abs(urlPagina(lang, 'servico', s.slug))}): ${d.servicos[s.slug].curto}`),
    '',
    `## ${lang === 'pt' ? 'Páginas' : 'Pages'}`,
    '',
    `- [${d.nav.sobre}](${abs(urlPagina(lang, 'sobre'))}): ${d.sobre.descricao}`,
    `- [${d.nav.faq}](${abs(urlPagina(lang, 'faq'))}): ${d.faq.descricao}`,
    ...(casesPublicos.length ? [`- [${d.nav.cases}](${abs(urlPagina(lang, 'cases'))}): ${d.cases.descricao}`] : []),
    `- [${d.nav.apoios}](${abs(urlPagina(lang, 'apoios'))}): ${d.apoios.descricao}`,
    `- [${d.nav.contato}](${abs(urlPagina(lang, 'contato'))}): ${d.contato.descricao}`,
  ];
  return linhas.join('\n');
}

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://dccircuitlabs.com');
  const abs = (caminho: string) => new URL(caminho, base).href;
  const pt = t('pt');
  const en = t('en');

  const texto = [
    '# DC Circuit Labs',
    '',
    `> ${pt.marca.tagline}`,
    '',
    pt.marca.resumo,
    '',
    `- ${pt.contato.rotuloRegiao}: ${pt.marca.regiao}`,
    `- E-mail: ${CONTATO.email}`,
    `- WhatsApp: ${CONTATO.whatsappExibicao}`,
    `- CNPJ: ${CONTATO.cnpj}`,
    '',
    secao('pt', abs),
    '',
    '## English',
    '',
    `> ${en.marca.tagline}`,
    '',
    en.marca.resumo,
    '',
    secao('en', abs),
    '',
  ].join('\n');

  return new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
