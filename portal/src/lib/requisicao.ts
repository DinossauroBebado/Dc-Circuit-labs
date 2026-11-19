import type { APIContext } from 'astro';

type Contexto = Pick<APIContext, 'request' | 'clientAddress'>;

/** IP do visitante. Atrás do Nginx vem no X-Real-IP (o Nginx sobrescreve o que o navegador mandar). */
export function ipDe({ request, clientAddress }: Contexto): string {
  const doProxy = request.headers.get('x-real-ip');
  let direto = '';
  try {
    direto = clientAddress;
  } catch {
    /* sem endereço (pré-renderização) */
  }
  const local = direto === '127.0.0.1' || direto === '::1' || direto === '::ffff:127.0.0.1';
  return (local && doProxy) || direto || 'desconhecido';
}

export function userAgentDe({ request }: Pick<APIContext, 'request'>): string {
  return (request.headers.get('user-agent') ?? '').slice(0, 300);
}

/** Lê um formulário POST; devolve null em outros métodos. */
export async function lerFormulario(request: Request): Promise<FormData | null> {
  if (request.method !== 'POST') return null;
  try {
    return await request.formData();
  } catch {
    return new FormData();
  }
}

/** Destino depois do login: só caminhos internos (evita redirecionar para outro site). */
export function destinoSeguro(voltar: string | null, padrao = '/'): string {
  if (!voltar || !voltar.startsWith('/') || voltar.startsWith('//') || voltar.startsWith('/\\')) return padrao;
  return voltar;
}

export function texto(form: FormData, campo: string): string {
  const v = form.get(campo);
  return typeof v === 'string' ? v.trim() : '';
}
