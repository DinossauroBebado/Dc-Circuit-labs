import type { APIRoute } from 'astro';
import { registrar } from '../../../lib/acessos';
import { concluirAutorizacao } from '../../../lib/bling';
import { dispararBling } from '../../../lib/tarefas';

// O Bling volta para cá depois que o admin autoriza o app (OAuth).
export const GET: APIRoute = async ({ url, cookies, locals, redirect }) => {
  const estado = cookies.get('dc_bling_estado')?.value;
  cookies.delete('dc_bling_estado', { path: '/admin/bling' });
  const codigo = url.searchParams.get('code');
  if (!estado || estado !== url.searchParams.get('state') || !codigo) {
    return redirect('/admin/bling?erro=' + encodeURIComponent('pedido expirado ou de outra sessão; tente de novo'));
  }
  try {
    await concluirAutorizacao(codigo);
  } catch (e) {
    return redirect('/admin/bling?erro=' + encodeURIComponent(e instanceof Error ? e.message : 'erro desconhecido'));
  }
  registrar({ evento: 'admin_acao', adminId: locals.admin!.id, alvo: `Conectou o Bling (${locals.admin!.nome})`, ip: locals.ip });
  dispararBling(locals.admin!.id);
  return redirect('/admin/bling');
};
