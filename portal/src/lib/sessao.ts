import type { AstroCookies } from 'astro';
import { and, eq, gt, lt } from 'drizzle-orm';
import { db, schema } from '../db';
import type { Admin, Cliente } from '../db/schema';
import { gerarToken, hashToken } from './tokens';

// Cliente e admin usam cookies diferentes: entrar como admin não loga como cliente e vice-versa.
export const COOKIE_CLIENTE = 'dc_portal';
export const COOKIE_ADMIN = 'dc_admin';
const DURACAO = { cliente: 30 * 24 * 3600 * 1000, admin: 12 * 3600 * 1000 };

type Tipo = keyof typeof DURACAO;
type Sessao = typeof schema.sessoes.$inferSelect;

function opcoesCookie(expira: Date) {
  return {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax' as const,
    expires: expira,
  };
}

export function criarSessao(
  cookies: AstroCookies,
  tipo: Tipo,
  dono: { clienteId?: number; adminId?: number },
  meta: { ip: string; userAgent: string },
): void {
  const token = gerarToken();
  const expiraEm = new Date(Date.now() + DURACAO[tipo]);
  db.insert(schema.sessoes)
    .values({
      tokenHash: hashToken(token),
      clienteId: dono.clienteId ?? null,
      adminId: dono.adminId ?? null,
      expiraEm,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })
    .run();
  cookies.set(tipo === 'cliente' ? COOKIE_CLIENTE : COOKIE_ADMIN, token, opcoesCookie(expiraEm));
}

/** Sessão válida do cookie, renovando o prazo quando passa da metade (sessão "deslizante"). */
function sessaoDoCookie(cookies: AstroCookies, tipo: Tipo): Sessao | null {
  const nome = tipo === 'cliente' ? COOKIE_CLIENTE : COOKIE_ADMIN;
  const token = cookies.get(nome)?.value;
  if (!token) return null;
  const sessao = db
    .select()
    .from(schema.sessoes)
    .where(and(eq(schema.sessoes.tokenHash, hashToken(token)), gt(schema.sessoes.expiraEm, new Date())))
    .get();
  if (!sessao) {
    cookies.delete(nome, { path: '/' });
    return null;
  }
  if (sessao.expiraEm.getTime() - Date.now() < DURACAO[tipo] / 2) {
    const expiraEm = new Date(Date.now() + DURACAO[tipo]);
    db.update(schema.sessoes).set({ expiraEm }).where(eq(schema.sessoes.id, sessao.id)).run();
    cookies.set(nome, token, opcoesCookie(expiraEm));
  }
  return sessao;
}

export function clienteDaSessao(cookies: AstroCookies): Cliente | null {
  const sessao = sessaoDoCookie(cookies, 'cliente');
  if (!sessao?.clienteId) return null;
  const cliente = db.select().from(schema.clientes).where(eq(schema.clientes.id, sessao.clienteId)).get();
  return cliente?.ativo ? cliente : null;
}

export function adminDaSessao(cookies: AstroCookies): { admin: Admin; sessao: Sessao } | null {
  const sessao = sessaoDoCookie(cookies, 'admin');
  if (!sessao?.adminId) return null;
  const admin = db.select().from(schema.admins).where(eq(schema.admins.id, sessao.adminId)).get();
  return admin?.ativo ? { admin, sessao } : null;
}

export function encerrarSessao(cookies: AstroCookies, tipo: Tipo): void {
  const nome = tipo === 'cliente' ? COOKIE_CLIENTE : COOKIE_ADMIN;
  const token = cookies.get(nome)?.value;
  if (token) db.delete(schema.sessoes).where(eq(schema.sessoes.tokenHash, hashToken(token))).run();
  cookies.delete(nome, { path: '/' });
}

/** Derruba todas as sessões de um cliente (troca de senha, "sair de todos os aparelhos", desativação). */
export function encerrarSessoesDoCliente(clienteId: number, excetoCookies?: AstroCookies): void {
  const atual = excetoCookies?.get(COOKIE_CLIENTE)?.value;
  const sessoes = db.select().from(schema.sessoes).where(eq(schema.sessoes.clienteId, clienteId)).all();
  for (const s of sessoes) {
    if (atual && s.tokenHash === hashToken(atual)) continue;
    db.delete(schema.sessoes).where(eq(schema.sessoes.id, s.id)).run();
  }
}

export function atualizarSessaoAdmin(id: number, dados: Partial<Pick<Sessao, 'segundoFatorOk' | 'totpPendente'>>): void {
  db.update(schema.sessoes).set(dados).where(eq(schema.sessoes.id, id)).run();
}

export function limparSessoesVencidas(): void {
  db.delete(schema.sessoes).where(lt(schema.sessoes.expiraEm, new Date())).run();
}
