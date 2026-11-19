import { describe, expect, it } from 'vitest';
import { diasDeAtraso, estadoDaParcela, formatarReais, resumir, type Parcela } from '../src/lib/financeiro';

// Dados fictícios. "Hoje" = 17/11/2026 10h em São Paulo.
const HOJE = new Date('2026-11-17T10:00:00-03:00');
let id = 0;
const parcela = (vencimento: string, valor: number, valorPago = 0, situacao = 'Em aberto'): Parcela => ({
  id: ++id,
  clienteId: 1,
  projetoId: null,
  blingContaId: String(id),
  descricao: null,
  vencimento: new Date(`${vencimento}T00:00:00-03:00`),
  valor,
  valorPago,
  pagoEm: null,
  situacao,
  criadoEm: HOJE,
});

describe('estado da parcela', () => {
  it('classifica pelo vencimento e pelo pagamento', () => {
    expect(estadoDaParcela(parcela('2026-11-01', 100, 100, 'Recebido'), HOJE)).toBe('paga');
    expect(estadoDaParcela(parcela('2026-11-16', 100), HOJE)).toBe('atrasada');
    expect(estadoDaParcela(parcela('2026-11-17', 100), HOJE)).toBe('vence_logo'); // vence hoje: ainda não atrasou
    expect(estadoDaParcela(parcela('2026-11-23', 100), HOJE)).toBe('vence_logo');
    expect(estadoDaParcela(parcela('2026-12-20', 100), HOJE)).toBe('a_vencer');
    expect(estadoDaParcela(parcela('2026-12-20', 100, 40, 'Parcialmente recebido'), HOJE)).toBe('parcial');
    expect(estadoDaParcela(parcela('2026-10-01', 100, 40, 'Parcialmente recebido'), HOJE)).toBe('atrasada');
    expect(estadoDaParcela(parcela('2026-10-01', 100, 0, 'Cancelado'), HOJE)).toBe('cancelada');
  });
  it('conta os dias de atraso', () => {
    expect(diasDeAtraso(parcela('2026-11-07', 100), HOJE)).toBe(10);
    expect(diasDeAtraso(parcela('2026-11-30', 100), HOJE)).toBe(0);
  });
});

describe('resumo', () => {
  it('soma total, pago, a receber e vencido sem as canceladas', () => {
    const r = resumir(
      [
        parcela('2026-10-01', 1000, 1000, 'Recebido'),
        parcela('2026-11-01', 1000, 300, 'Parcialmente recebido'), // atrasada: 700 vencido
        parcela('2026-12-01', 1000),
        parcela('2026-09-01', 5000, 0, 'Cancelado'),
      ],
      HOJE,
    );
    expect(r).toEqual({ total: 3000, pago: 1300, aReceber: 1700, vencido: 700 });
  });
  it('formata em reais', () => {
    expect(formatarReais(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50');
    expect(formatarReais(null)).toBe('—');
  });
});

import { lerXmlNfe } from '../src/lib/notas';

describe('XML da NF-e (dados fictícios)', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><NFe><infNFe Id="NFe35261100000000000000550010000001231000001234" versao="4.00">
    <ide><cUF>35</cUF><serie>1</serie><nNF>000123</nNF><dhEmi>2026-11-10T10:00:00-03:00</dhEmi></ide>
    <emit><CNPJ>99999999000191</CNPJ><xNome>Emitente</xNome></emit>
    <dest><CNPJ>11222333000181</CNPJ><xNome>Destinatário</xNome></dest>
    <total><ICMSTot><vProd>1000.00</vProd><vNF>1234.56</vNF></ICMSTot></total></infNFe></NFe></nfeProc>`;
  it('lê número, série, emissão, valor e o CNPJ do destinatário (não o do emitente)', () => {
    const d = lerXmlNfe(xml)!;
    expect(d.numero).toBe('123');
    expect(d.serie).toBe('1');
    expect(d.emissao?.toISOString()).toBe('2026-11-10T13:00:00.000Z');
    expect(d.valor).toBe(1234.56);
    expect(d.cnpjDestinatario).toBe('11222333000181');
  });
  it('outro formato (ex.: NFS-e) não é lido', () => {
    expect(lerXmlNfe('<CompNfse><Nfse><Numero>5</Numero></Nfse></CompNfse>')).toBeNull();
  });
});
