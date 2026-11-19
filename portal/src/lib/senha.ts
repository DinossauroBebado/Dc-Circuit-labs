import { hash, verify } from '@node-rs/argon2';
import { randomInt } from 'node:crypto';

// argon2id com os parâmetros recomendados pela OWASP (19 MiB, 2 iterações).
const OPCOES = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function gerarHash(senha: string): Promise<string> {
  return hash(senha, OPCOES);
}

export async function conferir(hashGuardado: string, senha: string): Promise<boolean> {
  try {
    return await verify(hashGuardado, senha);
  } catch {
    return false;
  }
}

// Hash de uma senha qualquer, usado quando o CNPJ/e-mail não existe: a resposta demora o mesmo tempo
// e não denuncia quais cadastros existem.
let hashFalso: Promise<string> | null = null;
export async function conferirFalso(senha: string): Promise<false> {
  hashFalso ??= gerarHash('senha-que-nao-existe');
  await conferir(await hashFalso, senha);
  return false;
}

// Senha temporária para o primeiro acesso: 12 letras/números sem caracteres ambíguos (0/O, 1/l/I).
const ALFABETO = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function gerarSenhaTemporaria(): string {
  const c = Array.from({ length: 12 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`;
}

/** Devolve a mensagem de erro, ou null se a senha serve. */
export function problemaNaSenha(senha: string, cnpj?: string): string | null {
  if (senha.length < 10) return 'A senha precisa ter pelo menos 10 caracteres.';
  if (senha.length > 200) return 'A senha é longa demais.';
  if (/^\d+$/.test(senha)) return 'Use letras além de números.';
  if (cnpj && senha.replace(/\D/g, '').includes(cnpj.slice(0, 8))) return 'A senha não pode conter o CNPJ.';
  return null;
}
