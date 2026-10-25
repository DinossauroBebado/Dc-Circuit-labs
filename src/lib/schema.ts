// Dados estruturados Schema.org (JSON-LD). Organization na home; Service em cada página de serviço;
// FAQPage no FAQ. Endereço: só a área atendida — a empresa ainda não tem sede própria divulgável.
import { CONTATO, t, url, urlPagina, type Idioma } from '../i18n';
import { SERVICOS, type SlugServico } from '../data/servicos';

const SITE = 'https://dccircuitlabs.com';
const ID_ORGANIZACAO = `${SITE}/#organizacao`;
const absoluta = (caminho: string) => new URL(caminho, SITE).href;

const AREA_ATENDIDA = [
  { '@type': 'City', name: 'Curitiba' },
  { '@type': 'State', name: 'Paraná' },
];

export function organizacao(lang: Idioma) {
  const d = t(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ID_ORGANIZACAO,
    name: 'DC Circuit Labs',
    url: absoluta(urlPagina(lang, 'home')),
    logo: absoluta('/icon-512.png'),
    image: absoluta('/og.png'),
    slogan: d.marca.tagline,
    description: d.marca.resumo,
    email: CONTATO.email,
    telephone: `+${CONTATO.whatsapp}`,
    taxID: CONTATO.cnpj,
    areaServed: AREA_ATENDIDA,
    knowsAbout: SERVICOS.map((s) => d.servicos[s.slug].nome),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: CONTATO.email,
      telephone: `+${CONTATO.whatsapp}`,
      areaServed: 'BR',
    },
  };
}

export function servico(lang: Idioma, slug: SlugServico) {
  const s = t(lang).servicos[slug];
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.nome,
    serviceType: s.nome,
    description: s.lead,
    url: absoluta(urlPagina(lang, 'servico', slug)),
    inLanguage: t(lang).meta.tag,
    areaServed: AREA_ATENDIDA,
    provider: { '@type': 'Organization', '@id': ID_ORGANIZACAO, name: 'DC Circuit Labs' },
  };
}

export function perguntasFrequentes(lang: Idioma) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: t(lang).meta.tag,
    mainEntity: t(lang).faq.perguntas.map((q) => ({
      '@type': 'Question',
      name: q.p,
      acceptedAnswer: { '@type': 'Answer', text: q.r },
    })),
  };
}

export function trilhaDeNavegacao(itens: { nome: string; caminho: string }[], lang: Idioma) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.nome,
      item: absoluta(url(lang, item.caminho)),
    })),
  };
}
