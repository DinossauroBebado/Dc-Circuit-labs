import { describe, expect, it } from 'vitest';
import { cnpjDaPagina, propriedades, renderizarPagina, rotuloDaVersao, slug, valorEmReais } from '../src/lib/renderizar';

// HTML no formato do export_view do Confluence (dados fictícios)
const anexo = (nome: string) => `/arquivos/99?nome=${encodeURIComponent(nome)}`;
const urlDoAnexo = (nome: string) => (['esquema.png', 'placa.pdf'].includes(nome) ? anexo(nome) : null);

describe('dados da página', () => {
  it('acha o CNPJ válido escrito na página', () => {
    expect(cnpjDaPagina('<table><tr><th>CNPJ</th><td>11.222.333/0001-81</td></tr></table>')).toBe('11222333000181');
    expect(cnpjDaPagina('<p>CNPJ 11222333000181</p>')).toBe('11222333000181');
    expect(cnpjDaPagina('<p>11.222.333/0001-82 (inválido)</p>')).toBeNull();
  });
  it('lê a tabela de propriedades', () => {
    const p = propriedades('<table><tbody><tr><th>Status</th><td>Em produção</td></tr><tr><td>Valor total</td><td>R$ 12.500,00</td></tr></tbody></table>');
    expect(p).toEqual({ status: 'Em produção', valor_total: 'R$ 12.500,00' });
  });
  it('entende valores em reais', () => {
    expect(valorEmReais('R$ 12.500,00')).toBe(12500);
    expect(valorEmReais('1500.5')).toBe(1500.5);
    expect(valorEmReais('a combinar')).toBeNull();
    expect(valorEmReais(undefined)).toBeNull();
  });
  it('tira o número da versão do título', () => {
    expect(rotuloDaVersao('Versão 1.0')).toBe('1.0');
    expect(rotuloDaVersao('v1.1')).toBe('1.1');
    expect(rotuloDaVersao('Documentação')).toBe('Documentação');
    expect(rotuloDaVersao('Wi-Fi Connect — Versão 1.0')).toBe('1.0');
    expect(rotuloDaVersao('ESP32 Gateway — Versão 2.1')).toBe('2.1');
    expect(rotuloDaVersao('Placa 4 canais v1.1')).toBe('1.1');
  });
  it('slug sem acentos', () => {
    expect(slug('Observações de Campo!')).toBe('observacoes-de-campo');
  });
});

describe('renderizarPagina', () => {
  it('remove scripts, estilos e atributos perigosos', () => {
    const { html } = renderizarPagina(
      '<h1>Visão geral</h1><p onclick="x()" style="color:red">Texto<script>alert(1)</script></p><iframe src="https://mal.example"></iframe><a href="javascript:alert(1)">x</a>',
      urlDoAnexo,
    );
    expect(html).not.toMatch(/script|onclick|style=|iframe|javascript:/i);
    expect(html).toContain('Texto');
  });

  it('desce os títulos um nível e monta o sumário com ids', () => {
    const { html, sumario } = renderizarPagina('<h1>Visão geral</h1><p>a</p><h2>Detalhes</h2><p>b</p><h1>Visão geral</h1><p>c</p>', urlDoAnexo);
    expect(html).toContain('<h2 id="visao-geral">Visão geral</h2>');
    expect(html).toContain('<h3 id="detalhes">');
    expect(html).toContain('<h2 id="visao-geral-2">');
    expect(sumario.map((s) => [s.id, s.nivel])).toEqual([
      ['visao-geral', 2],
      ['detalhes', 3],
      ['visao-geral-2', 2],
    ]);
  });

  it('apaga seções vazias do modelo (também com parágrafo vazio)', () => {
    const { html, sumario } = renderizarPagina(
      '<h1>Visão geral</h1><p>Placa de controle.</p><h1>Firmware</h1><p>&nbsp;</p><h1>Testes</h1><h2>Bancada</h2><p><br/></p><h1>Observações</h1><p>ok</p>',
      urlDoAnexo,
    );
    expect(sumario.map((s) => s.titulo)).toEqual(['Visão geral', 'Observações']);
    expect(html).not.toContain('Firmware');
    expect(html).not.toContain('Bancada');
  });

  it('reescreve imagens e links de anexos da própria página; o resto sai', () => {
    const { html, anexosNoTexto } = renderizarPagina(
      '<h1>Esquemático</h1>' +
        '<p><img src="https://dc.atlassian.net/wiki/download/attachments/123/esquema.png?version=2&api=v2" alt="Esquema"></p>' +
        '<p><img src="https://dc.atlassian.net/wiki/images/icons/emoticons/smile.png"></p>' +
        '<p><a href="/wiki/download/attachments/123/placa.pdf?api=v2">PDF</a> · <a href="https://dc.atlassian.net/wiki/spaces/X/pages/1">interna</a> · <a href="https://www.ti.com/x">datasheet</a></p>',
      urlDoAnexo,
    );
    expect(html).toContain(`<img src="${(anexo('esquema.png') + '&ver').replace(/&/g, '&amp;')}" alt="Esquema" loading="lazy" />`);
    expect(html).not.toContain('smile.png');
    expect(html).toContain(`<a href="${anexo('placa.pdf').replace(/&/g, '&amp;')}">PDF</a>`);
    expect(html).not.toContain('atlassian.net');
    expect(html).toContain('interna');
    expect(html).toContain('<a href="https://www.ti.com/x" rel="noopener noreferrer" target="_blank">datasheet</a>');
    expect(anexosNoTexto.sort()).toEqual(['esquema.png', 'placa.pdf']);
  });

  it('mantém a imagem que o Confluence embrulha em <span> dentro do <p>', () => {
    const { html } = renderizarPagina(
      '<h1>Fotos</h1><p><span class="confluence-embedded-file-wrapper"><img class="confluence-embedded-image" src="/wiki/download/attachments/1/esquema.png?api=v2"></span></p>',
      urlDoAnexo,
    );
    expect(html).toContain('<img src=');
    expect(html).toContain('<h2 id="fotos">');
  });

  it('painéis do Confluence viram avisos do portal', () => {
    const { html } = renderizarPagina(
      '<h1>Ligações</h1><div class="confluence-information-macro confluence-information-macro-warning"><p>Cuidado com 24 V</p></div><div class="qualquer"><p>x</p></div>',
      urlDoAnexo,
    );
    expect(html).toContain('<div class="aviso aviso--erro">'); // "warning" do Confluence é o painel vermelho
    expect(html).not.toContain('qualquer');
  });
});
