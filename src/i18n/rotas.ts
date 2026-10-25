import { SERVICOS, type SlugServico } from '../data/servicos';

export const IDIOMAS = ['pt', 'en', 'zh'] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_PADRAO: Idioma = 'pt';

export type IdPagina = 'home' | 'servicos' | 'servico' | 'cases' | 'apoios' | 'sobre' | 'faq' | 'contato';

export interface Pagina {
  id: IdPagina;
  /** Caminho sem o prefixo de idioma, sempre terminando em "/" (ou vazio para a home). */
  caminho: string;
  slug?: SlugServico;
}

// Os caminhos são os mesmos nos três idiomas — só muda o prefixo (/en/, /zh/).
// Isso permite que o Nginx redirecione por IP sem tabela de tradução de URLs.
export const PAGINAS: Pagina[] = [
  { id: 'home', caminho: '' },
  { id: 'servicos', caminho: 'servicos/' },
  ...SERVICOS.map((s) => ({ id: 'servico' as const, caminho: `servicos/${s.slug}/`, slug: s.slug })),
  { id: 'cases', caminho: 'cases/' },
  { id: 'apoios', caminho: 'apoios/' },
  { id: 'sobre', caminho: 'sobre/' },
  { id: 'faq', caminho: 'faq/' },
  { id: 'contato', caminho: 'contato/' },
];

export function prefixo(lang: Idioma): string {
  return lang === IDIOMA_PADRAO ? '/' : `/${lang}/`;
}

export function url(lang: Idioma, caminho: string): string {
  return prefixo(lang) + caminho;
}

export function urlPagina(lang: Idioma, id: IdPagina, slug?: SlugServico): string {
  const pagina = PAGINAS.find((p) => p.id === id && (!slug || p.slug === slug));
  if (!pagina) throw new Error(`Página desconhecida: ${id} ${slug ?? ''}`);
  return url(lang, pagina.caminho);
}
