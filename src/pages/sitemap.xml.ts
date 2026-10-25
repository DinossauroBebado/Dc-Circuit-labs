// sitemap.xml gerado no build a partir da mesma tabela de rotas do site, com as versões de idioma
// de cada página (xhtml:link hreflang), como o Google recomenda para sites multilíngues.
import type { APIRoute } from 'astro';
import { IDIOMAS, PAGINAS, t, url } from '../i18n';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://dccircuitlabs.com');
  const abs = (caminho: string) => new URL(caminho, base).href;
  const hoje = new Date().toISOString().slice(0, 10);

  const entradas = IDIOMAS.flatMap((lang) =>
    PAGINAS.map((p) => {
      const alternativas = IDIOMAS.map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${t(l).meta.tag}" href="${abs(url(l, p.caminho))}"/>`,
      );
      alternativas.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(url('pt', p.caminho))}"/>`);
      return [
        '  <url>',
        `    <loc>${abs(url(lang, p.caminho))}</loc>`,
        `    <lastmod>${hoje}</lastmod>`,
        ...alternativas,
        '  </url>',
      ].join('\n');
    }),
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entradas,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
