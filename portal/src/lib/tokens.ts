import { createHash, randomBytes } from 'node:crypto';

/** Token aleatório (vai para o cookie ou para o link do e-mail). O banco guarda só o hash. */
export function gerarToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
