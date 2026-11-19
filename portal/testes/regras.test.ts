import { describe, expect, it } from 'vitest';
import { cnpjValido, formatarCnpj, soDigitos } from '../src/lib/cnpj';
import { conferir, gerarHash, gerarSenhaTemporaria, problemaNaSenha } from '../src/lib/senha';
import { gerarToken, hashToken } from '../src/lib/tokens';
import { destinoSeguro } from '../src/lib/requisicao';

describe('CNPJ', () => {
  it('valida dígitos verificadores', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true);
    expect(cnpjValido('11222333000181')).toBe(true);
    expect(cnpjValido('11.222.333/0001-82')).toBe(false);
    expect(cnpjValido('00000000000000')).toBe(false);
    expect(cnpjValido('123')).toBe(false);
  });
  it('normaliza e formata', () => {
    expect(soDigitos(' 11.222.333/0001-81 ')).toBe('11222333000181');
    expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('senhas', () => {
  it('hash argon2id confere só com a senha certa', async () => {
    const h = await gerarHash('uma senha boa 123');
    expect(h.startsWith('$argon2id$')).toBe(true);
    expect(await conferir(h, 'uma senha boa 123')).toBe(true);
    expect(await conferir(h, 'outra')).toBe(false);
    expect(await conferir('lixo', 'x')).toBe(false);
  });
  it('senha temporária tem 12 caracteres sem ambíguos', () => {
    const s = gerarSenhaTemporaria();
    expect(s).toMatch(/^[^0O1lI]{4}-[^0O1lI]{4}-[^0O1lI]{4}$/);
    expect(new Set(Array.from({ length: 50 }, gerarSenhaTemporaria)).size).toBe(50);
  });
  it('regras de senha', () => {
    expect(problemaNaSenha('curta')).toMatch(/10 caracteres/);
    expect(problemaNaSenha('1234567890123')).toMatch(/letras/);
    expect(problemaNaSenha('empresa11222333x', '11222333000181')).toMatch(/CNPJ/);
    expect(problemaNaSenha('Prototipo-2026!')).toBeNull();
  });
});

describe('tokens', () => {
  it('são aleatórios e o hash é estável', () => {
    const t = gerarToken();
    expect(t).not.toBe(gerarToken());
    expect(t.length).toBeGreaterThanOrEqual(43);
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toContain(t);
  });
});

describe('redirecionamento após login', () => {
  it('só aceita caminhos internos', () => {
    expect(destinoSeguro('/projetos/x')).toBe('/projetos/x');
    expect(destinoSeguro('https://mal.com')).toBe('/');
    expect(destinoSeguro('//mal.com')).toBe('/');
    expect(destinoSeguro('/\\mal.com')).toBe('/');
    expect(destinoSeguro(null)).toBe('/');
  });
});
