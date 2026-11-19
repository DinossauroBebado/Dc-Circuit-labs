// Consultas usadas pelas páginas. Toda consulta do lado do cliente recebe o clienteId da sessão:
// nada é buscado só pelo id que vem da URL.
import { and, count, desc, eq, gt, gte, isNull, max } from 'drizzle-orm';
import { db, schema } from '../db';

/** E-mail aguardando confirmação (último link enviado e ainda válido). */
export function emailPendente(clienteId: number): string | null {
  const t = db
    .select({ email: schema.tokensSenha.email })
    .from(schema.tokensSenha)
    .where(
      and(
        eq(schema.tokensSenha.clienteId, clienteId),
        eq(schema.tokensSenha.tipo, 'verificar_email'),
        isNull(schema.tokensSenha.usadoEm),
        gt(schema.tokensSenha.expiraEm, new Date()),
      ),
    )
    .orderBy(desc(schema.tokensSenha.id))
    .get();
  return t?.email ?? null;
}

export function projetosDoCliente(clienteId: number) {
  return db.select().from(schema.projetos).where(eq(schema.projetos.clienteId, clienteId)).orderBy(desc(schema.projetos.atualizadoEm)).all();
}

/** Central do painel: cada cliente com último acesso, logins nos últimos 30 dias e nº de projetos. */
export function resumoClientes() {
  const desde = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const clientes = db.select().from(schema.clientes).orderBy(schema.clientes.razaoSocial).all();
  return clientes.map((c) => {
    const ultimo = db
      .select({ quando: max(schema.acessos.quando) })
      .from(schema.acessos)
      .where(and(eq(schema.acessos.clienteId, c.id), eq(schema.acessos.evento, 'login')))
      .get()?.quando;
    const logins30 =
      db
        .select({ n: count() })
        .from(schema.acessos)
        .where(and(eq(schema.acessos.clienteId, c.id), eq(schema.acessos.evento, 'login'), gte(schema.acessos.quando, desde)))
        .get()?.n ?? 0;
    const projetos = db.select({ n: count() }).from(schema.projetos).where(eq(schema.projetos.clienteId, c.id)).get()?.n ?? 0;
    // max() devolve o número cru do SQLite
    return { ...c, ultimoLogin: ultimo ? new Date(Number(ultimo)) : null, logins30, projetos };
  });
}

export function acessosDoCliente(clienteId: number, limite = 100) {
  return db.select().from(schema.acessos).where(eq(schema.acessos.clienteId, clienteId)).orderBy(desc(schema.acessos.quando)).limit(limite).all();
}

export function formatarData(d: Date | null | undefined, comHora = true): string {
  if (!d) return '—';
  return d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(comHora ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export const NOME_EVENTO: Record<string, string> = {
  login: 'Entrou no portal',
  login_falhou: 'Senha errada',
  login_bloqueado: 'Bloqueado por excesso de tentativas',
  logout: 'Saiu',
  primeiro_acesso: 'Fez o primeiro acesso',
  trocou_senha: 'Trocou a senha',
  pediu_redefinicao: 'Pediu redefinição de senha',
  redefiniu_senha: 'Redefiniu a senha pelo e-mail',
  confirmou_email: 'Confirmou o e-mail',
  viu_documento: 'Abriu documentação',
  baixou_arquivo: 'Baixou arquivo',
  viu_midias: 'Abriu a galeria de mídias',
  viu_midia: 'Visualizou mídia',
  baixou_midia: 'Baixou mídia',
  reportou_erro: 'Reportou erro na documentação',
  admin_acao: 'Ação da DC',
};
