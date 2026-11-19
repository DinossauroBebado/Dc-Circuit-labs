import { and, count, eq, gte } from 'drizzle-orm';
import { db, schema } from '../db';

export type Evento =
  | 'login'
  | 'login_falhou'
  | 'login_bloqueado'
  | 'logout'
  | 'primeiro_acesso'
  | 'trocou_senha'
  | 'pediu_redefinicao'
  | 'redefiniu_senha'
  | 'confirmou_email'
  | 'viu_documento'
  | 'baixou_arquivo'
  | 'viu_midias'
  | 'viu_midia'
  | 'baixou_midia'
  | 'reportou_erro'
  | 'admin_login'
  | 'admin_login_falhou'
  | 'admin_2fa_falhou'
  | 'admin_acao';

export function registrar(dados: {
  evento: Evento;
  clienteId?: number | null;
  adminId?: number | null;
  alvo?: string | null;
  ip?: string;
  userAgent?: string;
}) {
  db.insert(schema.acessos)
    .values({
      evento: dados.evento,
      clienteId: dados.clienteId ?? null,
      adminId: dados.adminId ?? null,
      alvo: dados.alvo ?? null,
      ip: dados.ip ?? null,
      userAgent: dados.userAgent ?? null,
    })
    .run();
}

// Limite de tentativas: guardado no próprio registro de acessos (sobrevive a reinícios do app).
const JANELA_MS = 15 * 60 * 1000;
export const LIMITE_POR_ALVO = 5;
export const LIMITE_POR_IP = 20;

export function bloqueado(evento: Evento, alvo: string, ip: string): boolean {
  const desde = new Date(Date.now() - JANELA_MS);
  const contar = (filtro: ReturnType<typeof eq>) =>
    db
      .select({ n: count() })
      .from(schema.acessos)
      .where(and(eq(schema.acessos.evento, evento), filtro, gte(schema.acessos.quando, desde)))
      .get()?.n ?? 0;
  return contar(eq(schema.acessos.alvo, alvo)) >= LIMITE_POR_ALVO || contar(eq(schema.acessos.ip, ip)) >= LIMITE_POR_IP;
}
