import { pt } from './pt';
import { en } from './en';
import { zh } from './zh';
import type { Idioma } from './rotas';

export * from './rotas';
export type { Dicionario } from './pt';

const DICIONARIOS = { pt, en, zh };

export function t(lang: Idioma) {
  return DICIONARIOS[lang];
}

// Portal do Cliente (app separado, em português): documentação, notas fiscais, contratos e mídias dos projetos.
export const PORTAL_URL = 'https://portal.dccircuitlabs.com';

export const CONTATO = {
  email: 'contato@dccircuitlabs.com',
  whatsapp: '5511975731817',
  whatsappExibicao: '+55 (11) 97573-1817',
  cnpj: '64.870.544/0001-97',
};
