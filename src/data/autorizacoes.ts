// Cases e apoios que citam terceiros. Regra do Manual de Marca: nome, foto ou vídeo de cliente só vai ao ar
// com autorização POR ESCRITO (DC-87, DC-88). Marque `autorizado: true` só depois que ela existir.
//
// Em `npm run dev` tudo aparece, com o selo "Pendente de autorização".
// No build de produção, o que não está autorizado fica de fora (a menos que INCLUIR_NAO_AUTORIZADOS=true no .env).

import type { IdMidia } from './midia';

export interface ItemAutorizado {
  id: string;
  autorizado: boolean;
  midia: IdMidia;
  modelo?: { midia: IdMidia; explodido?: boolean };
}

export const CASES: ItemAutorizado[] = [
  // DNK Agro — autorizado verbalmente, falta formalizar por escrito (DC-87)
  { id: 'dnk', autorizado: false, midia: 'case-dnk', modelo: { midia: 'modelo-controle', explodido: true } },
  // Metabee — autorizado verbalmente, falta formalizar por escrito (DC-87)
  { id: 'metabee', autorizado: false, midia: 'case-metabee', modelo: { midia: 'modelo-placa' } },
  // Cliente industrial — NÃO autorizou o uso do nome (DC-88). Mesmo autorizado, o case fica anônimo.
  { id: 'industrial', autorizado: false, midia: 'case-industrial' },
];

export const APOIOS: ItemAutorizado[] = [
  // Participação própria em evento público — não depende de autorização de cliente
  { id: 'makerFaire', autorizado: true, midia: 'apoio-maker-faire' },
  // Copa Pinhão — patrocínio, autorizado verbalmente; falta formalizar por escrito (DC-87)
  { id: 'copaPinhao', autorizado: false, midia: 'apoio-copa-pinhao' },
];

export const MOSTRAR_NAO_AUTORIZADOS =
  import.meta.env.DEV || import.meta.env.INCLUIR_NAO_AUTORIZADOS === 'true';

export function visiveis<T extends ItemAutorizado>(itens: T[]): T[] {
  return itens.filter((i) => i.autorizado || MOSTRAR_NAO_AUTORIZADOS);
}
