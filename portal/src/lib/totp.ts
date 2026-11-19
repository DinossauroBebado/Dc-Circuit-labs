import { Secret, TOTP } from 'otpauth';
import QRCode from 'qrcode';

// Segundo fator do painel: código de 6 dígitos de um app autenticador (Google Authenticator, Authy…).
function totp(segredo: string, email: string) {
  return new TOTP({ issuer: 'DC Circuit Labs', label: email, algorithm: 'SHA1', digits: 6, period: 30, secret: Secret.fromBase32(segredo) });
}

export function novoSegredo(): string {
  return new Secret({ size: 20 }).base32;
}

export function codigoValido(segredo: string, email: string, codigo: string): boolean {
  const limpo = codigo.replace(/\s/g, '');
  if (!/^\d{6}$/.test(limpo)) return false;
  return totp(segredo, email).validate({ token: limpo, window: 1 }) !== null;
}

export function qrCodeSvg(segredo: string, email: string): Promise<string> {
  return QRCode.toString(totp(segredo, email).toString(), { type: 'svg', margin: 1, width: 220 });
}
