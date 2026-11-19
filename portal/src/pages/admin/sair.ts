import type { APIRoute } from 'astro';
import { encerrarSessao } from '../../lib/sessao';

export const POST: APIRoute = ({ cookies, redirect }) => {
  encerrarSessao(cookies, 'admin');
  return redirect('/admin/entrar');
};

export const GET: APIRoute = ({ redirect }) => redirect('/admin');
