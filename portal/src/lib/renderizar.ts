// Converte o HTML renderizado do Confluence (export_view) no HTML da documentação do portal.
// Funções puras (sem banco nem rede), cobertas por testes em testes/renderizar.test.ts.
import sanitizeHtml from 'sanitize-html';
import { cnpjValido, soDigitos } from './cnpj';

export interface ItemSumario {
  id: string;
  titulo: string;
  nivel: number;
}

export function slug(texto: string): string {
  return (
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'item'
  );
}

export function textoPuro(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Primeiro CNPJ válido escrito na página do cliente. */
export function cnpjDaPagina(html: string): string | null {
  for (const m of textoPuro(html).matchAll(/\d{2}\.?\d{3}\.?\d{3}\s*\/?\s*\d{4}\s*-?\s*\d{2}/g)) {
    const c = soDigitos(m[0]);
    if (cnpjValido(c)) return c;
  }
  return null;
}

/** Tabela de propriedades ("Status | Em produção") → { status: 'Em produção' }. Chaves sem acento, minúsculas. */
export function propriedades(html: string): Record<string, string> {
  const props: Record<string, string> = {};
  for (const linha of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const celulas = [...linha[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => textoPuro(c[1]));
    if (celulas.length === 2 && celulas[0] && celulas[1]) {
      const chave = slug(celulas[0]).replace(/-/g, '_');
      if (!(chave in props)) props[chave] = celulas[1];
    }
  }
  return props;
}

export function valorEmReais(texto: string | undefined): number | null {
  if (!texto) return null;
  const limpo = texto.replace(/[^\d,.-]/g, '');
  if (!limpo) return null;
  const numero = Number(limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo);
  return Number.isFinite(numero) ? numero : null;
}

/** "Versão 1.0", "v1.1", "1.2 — revisão" → "1.0", "1.1", "1.2". Sem número: o próprio título. */
export function rotuloDaVersao(titulo: string): string {
  // Prefere o número depois de "Versão"/"v" ("ESP32 Gateway — Versão 1.0" → "1.0"); senão, o primeiro número.
  const m = /(?:vers[aã]o|\bv)\s*(\d+(?:[.,_]\d+)*)/i.exec(titulo) ?? /(\d+(?:[.,_]\d+)*)/.exec(titulo);
  return m ? m[1].replace(/[,_]/g, '.') : titulo.trim();
}

// Painéis do Confluence (info, nota, aviso, dica) viram os avisos do portal.
const PAINEIS: Record<string, string> = {
  information: 'aviso aviso--info',
  info: 'aviso aviso--info',
  note: 'aviso aviso--alerta',
  warning: 'aviso aviso--erro',
  tip: 'aviso aviso--ok',
  success: 'aviso aviso--ok',
  error: 'aviso aviso--erro',
};

export interface Resultado {
  html: string;
  sumario: ItemSumario[];
  /** Nomes de anexos usados dentro do texto (imagens/links), já reescritos para o portal. */
  anexosNoTexto: string[];
}

/**
 * @param urlDoAnexo devolve a URL do portal para um anexo (pelo nome do arquivo), ou null se ele não existe.
 */
export function renderizarPagina(html: string, urlDoAnexo: (nome: string) => string | null): Resultado {
  const anexosNoTexto = new Set<string>();
  const reescrever = (url: string | undefined): string | null => {
    if (!url) return null;
    const m = /\/download\/(?:attachments|thumbnails)\/\d+\/([^?#]+)/.exec(url);
    if (!m) return null;
    const nome = decodeURIComponent(m[1]);
    const nova = urlDoAnexo(nome);
    if (nova) anexosNoTexto.add(nome);
    return nova;
  };

  const limpo = sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'sup', 'sub',
      'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      'colgroup', 'col', 'a', 'img', 'span', 'div', 'figure', 'figcaption', 'details', 'summary', 'kbd', 'mark',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      div: ['class'],
      code: ['class'],
      pre: ['class'],
      col: ['span'],
    },
    allowedClasses: { div: ['aviso', 'aviso--info', 'aviso--alerta', 'aviso--erro', 'aviso--ok'], code: [/^language-/], pre: [/^language-/] },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      // Títulos descem um nível: o h1 da página é o título da versão.
      h1: 'h2',
      h2: 'h3',
      h3: 'h4',
      h4: 'h5',
      h5: 'h6',
      div: (_tag, attribs): sanitizeHtml.Tag => {
        const classe = attribs.class ?? '';
        const painel = /confluence-information-macro-(\w+)|panel-(\w+)|(?:^|\s)(info|note|warning|tip|success|error)(?:\s|$)/.exec(classe);
        const tipo = painel?.[1] ?? painel?.[2] ?? painel?.[3];
        const atributos: sanitizeHtml.Attributes = tipo && PAINEIS[tipo] ? { class: PAINEIS[tipo] } : {};
        return { tagName: 'div', attribs: atributos };
      },
      img: (_tag, attribs): sanitizeHtml.Tag => {
        const src = reescrever(attribs.src) ?? reescrever(attribs['data-image-src']);
        // Imagem que não é anexo desta página (ícones do Confluence, links externos) sai do documento.
        if (!src) return { tagName: 'span', attribs: {} };
        // ?ver: mostrar no navegador (não conta como download na linha do tempo do cliente)
        return { tagName: 'img', attribs: { src: src + (src.includes('?') ? '&' : '?') + 'ver', alt: attribs.alt ?? '', loading: 'lazy' } };
      },
      a: (_tag, attribs): sanitizeHtml.Tag => {
        const href = attribs.href ?? '';
        const anexo = reescrever(href);
        if (anexo) return { tagName: 'a', attribs: { href: anexo } };
        // Links internos do Confluence não abrem para o cliente: fica só o texto.
        if (/atlassian\.net|^\/wiki\//.test(href) || !/^(https?:|mailto:)/.test(href)) return { tagName: 'span', attribs: {} };
        return { tagName: 'a', attribs: { href, rel: 'noopener noreferrer', target: '_blank' } };
      },
    },
    exclusiveFilter: (frame) => frame.tag === 'span' && !frame.text.trim() && !frame.mediaChildren?.length,
  })
    // Parágrafos vazios (sobras do modelo: "&nbsp;", <br>) saem, para a seção que ficou sem texto sumir.
    // Feito depois de limpar porque o filtro do sanitize-html não enxerga imagem dentro de <span> no <p>.
    .replace(/<p>(?:\s|&nbsp;|\u00a0|<br\s*\/?>)*<\/p>/g, '');

  // Ids nos títulos para o sumário lateral (h2 e h3 do portal = h1 e h2 do Confluence).
  const sumario: ItemSumario[] = [];
  const usados = new Set<string>();
  const comIds = limpo.replace(/<(h[23])>([\s\S]*?)<\/\1>/g, (_, tag: string, conteudo: string) => {
    const titulo = textoPuro(conteudo);
    if (!titulo) return '';
    let id = slug(titulo);
    for (let n = 2; usados.has(id); n++) id = `${slug(titulo)}-${n}`;
    usados.add(id);
    sumario.push({ id, titulo, nivel: tag === 'h2' ? 2 : 3 });
    return `<${tag} id="${id}">${conteudo}</${tag}>`;
  });

  // Seções vazias do modelo não aparecem: título seguido de outro título do mesmo nível ou maior
  // (ou do fim). Repete porque tirar um subtítulo vazio pode esvaziar o título de cima.
  let semVazias = comIds;
  for (let antes = ''; antes !== semVazias; ) {
    antes = semVazias;
    semVazias = semVazias
      // O conteúdo do título não pode atravessar o </hN> (senão engoliria a seção de cima, que tem texto).
      .replace(/<h3 id="[^"]+">(?:(?!<\/h3>)[\s\S])*<\/h3>(?=\s*(?:<h[23][\s>]|$))/g, '')
      .replace(/<h2 id="[^"]+">(?:(?!<\/h2>)[\s\S])*<\/h2>(?=\s*(?:<h2[\s>]|$))/g, '');
  }
  const restantes = new Set([...semVazias.matchAll(/<h[23] id="([^"]+)"/g)].map((m) => m[1]));
  for (let i = sumario.length - 1; i >= 0; i--) if (!restantes.has(sumario[i].id)) sumario.splice(i, 1);

  return { html: semVazias.trim(), sumario, anexosNoTexto: [...anexosNoTexto] };
}
