import type { APIRoute } from 'astro';
import { registrar } from '../lib/acessos';
import { encerrarSessao } from '../lib/sessao';

export const POST: APIRoute = ({ cookies, locals, redirect }) => {
  if (locals.cliente) registrar({ evento: 'logout', clienteId: locals.cliente.id, ip: locals.ip, userAgent: locals.userAgent });
  encerrarSessao(cookies, 'cliente');
  return redirect('/entrar?saiu=1');
};

export const GET: APIRoute = ({ redirect }) => redirect('/');
