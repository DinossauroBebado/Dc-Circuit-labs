// Regras de conta do cliente: cadastro, senha temporária, e-mail e redefinição.
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db, schema } from '../db';
import { enviarConfirmacaoEmail, enviarRedefinicaoSenha } from './email';
import { gerarHash, gerarSenhaTemporaria } from './senha';
import { encerrarSessoesDoCliente } from './sessao';
import { gerarToken, hashToken } from './tokens';

const HORA = 3600 * 1000;

export function emailValido(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Cria o cliente com uma senha temporária. Devolve a senha (mostrada uma única vez no painel). */
export async function cadastrarCliente(cnpj: string, razaoSocial: string): Promise<string> {
  const senha = gerarSenhaTemporaria();
  db.insert(schema.clientes)
    .values({ cnpj, razaoSocial, senhaHash: await gerarHash(senha), deveTrocarSenha: true })
    .run();
  return senha;
}

/** Nova senha temporária (cliente esqueceu e não tem e-mail): derruba as sessões e exige troca no próximo login. */
export async function redefinirSenhaPeloAdmin(clienteId: number): Promise<string> {
  const senha = gerarSenhaTemporaria();
  db.update(schema.clientes)
    .set({ senhaHash: await gerarHash(senha), deveTrocarSenha: true })
    .where(eq(schema.clientes.id, clienteId))
    .run();
  encerrarSessoesDoCliente(clienteId);
  return senha;
}

export async function definirSenha(clienteId: number, senha: string): Promise<void> {
  db.update(schema.clientes)
    .set({ senhaHash: await gerarHash(senha), deveTrocarSenha: false })
    .where(eq(schema.clientes.id, clienteId))
    .run();
}

/** Guarda o e-mail como "a confirmar" e envia o link. O e-mail só vale para recuperação depois de confirmado. */
export async function pedirConfirmacaoEmail(clienteId: number, email: string): Promise<void> {
  const token = gerarToken();
  db.insert(schema.tokensSenha)
    .values({ tokenHash: hashToken(token), clienteId, tipo: 'verificar_email', email, expiraEm: new Date(Date.now() + 24 * HORA) })
    .run();
  await enviarConfirmacaoEmail(email, token);
}

function tokenValido(token: string, tipo: 'redefinir_senha' | 'verificar_email') {
  return db
    .select()
    .from(schema.tokensSenha)
    .where(
      and(
        eq(schema.tokensSenha.tokenHash, hashToken(token)),
        eq(schema.tokensSenha.tipo, tipo),
        isNull(schema.tokensSenha.usadoEm),
        gt(schema.tokensSenha.expiraEm, new Date()),
      ),
    )
    .get();
}

function marcarUsado(id: number) {
  db.update(schema.tokensSenha).set({ usadoEm: new Date() }).where(eq(schema.tokensSenha.id, id)).run();
}

export function confirmarEmail(token: string): { clienteId: number } | null {
  const t = tokenValido(token, 'verificar_email');
  if (!t?.email) return null;
  marcarUsado(t.id);
  db.update(schema.clientes)
    .set({ email: t.email, emailVerificadoEm: new Date() })
    .where(eq(schema.clientes.id, t.clienteId))
    .run();
  return { clienteId: t.clienteId };
}

/** "Esqueci a senha": só envia se o cliente existe, está ativo e tem e-mail confirmado. A tela responde igual sempre. */
export async function pedirRedefinicao(cnpj: string): Promise<{ clienteId: number } | null> {
  const cliente = db.select().from(schema.clientes).where(eq(schema.clientes.cnpj, cnpj)).get();
  if (!cliente?.ativo || !cliente.email || !cliente.emailVerificadoEm) return null;
  const token = gerarToken();
  db.insert(schema.tokensSenha)
    .values({ tokenHash: hashToken(token), clienteId: cliente.id, tipo: 'redefinir_senha', expiraEm: new Date(Date.now() + HORA) })
    .run();
  await enviarRedefinicaoSenha(cliente.email, token);
  return { clienteId: cliente.id };
}

export function tokenDeRedefinicao(token: string) {
  return tokenValido(token, 'redefinir_senha') ?? null;
}

export async function redefinirComToken(token: string, novaSenha: string): Promise<{ clienteId: number } | null> {
  const t = tokenValido(token, 'redefinir_senha');
  if (!t) return null;
  marcarUsado(t.id);
  await definirSenha(t.clienteId, novaSenha);
  encerrarSessoesDoCliente(t.clienteId);
  return { clienteId: t.clienteId };
}
