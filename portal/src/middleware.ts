// Porteiro do portal: toda rota é fechada, exceto as listadas em PUBLICAS.
import { defineMiddleware } from 'astro:middleware';
import { ipDe, userAgentDe } from './lib/requisicao';
import { adminDaSessao, clienteDaSessao } from './lib/sessao';
import { iniciarAgenda } from './lib/tarefas';

// Publicação diária do Confluence e sincronização do Bling: só no app de produção (pm2).
// AGENDA=false desliga (ex.: segunda instância, testes).
if (import.meta.env.PROD && process.env.AGENDA !== 'false') iniciarAgenda();

const PUBLICAS = [/^\/entrar\/?$/, /^\/esqueci-senha\/?$/, /^\/redefinir-senha\/[^/]+\/?$/, /^\/confirmar-email\/[^/]+\/?$/];
const ADMIN_PUBLICAS = [/^\/admin\/entrar\/?$/];
const ADMIN_SEM_2FA = [/^\/admin\/2fa\/?$/, /^\/admin\/sair\/?$/];
const ADMIN_TROCA_SENHA = [/^\/admin\/trocar-senha\/?$/, /^\/admin\/sair\/?$/];
const CLIENTE_TROCA_SENHA = [/^\/primeiro-acesso\/?$/, /^\/sair\/?$/];

const casa = (lista: RegExp[], caminho: string) => lista.some((r) => r.test(caminho));

export const onRequest = defineMiddleware(async (contexto, proximo) => {
  const { url, cookies, locals, redirect } = contexto;
  const caminho = url.pathname;
  locals.ip = ipDe(contexto);
  locals.userAgent = userAgentDe(contexto);
  locals.cliente = null;
  locals.admin = null;
  locals.sessaoAdminId = null;

  const resposta = await (async () => {
    // ---------- Painel interno ----------
    if (caminho === '/admin' || caminho.startsWith('/admin/')) {
      const sessao = adminDaSessao(cookies);
      if (sessao) {
        locals.admin = sessao.admin;
        locals.sessaoAdminId = sessao.sessao.id;
      }
      if (casa(ADMIN_PUBLICAS, caminho)) return sessao?.sessao.segundoFatorOk ? redirect('/admin') : proximo();
      if (!sessao) return redirect('/admin/entrar');
      if (!sessao.sessao.segundoFatorOk) return casa(ADMIN_SEM_2FA, caminho) ? proximo() : redirect('/admin/2fa');
      if (sessao.admin.deveTrocarSenha && !casa(ADMIN_TROCA_SENHA, caminho)) return redirect('/admin/trocar-senha');
      return proximo();
    }

    // ---------- Área do cliente ----------
    locals.cliente = clienteDaSessao(cookies);
    if (casa(PUBLICAS, caminho)) {
      return locals.cliente && caminho.startsWith('/entrar') ? redirect('/') : proximo();
    }
    if (!locals.cliente) {
      const voltar = caminho === '/' ? '' : `?voltar=${encodeURIComponent(caminho + url.search)}`;
      return redirect(`/entrar${voltar}`);
    }
    if (locals.cliente.deveTrocarSenha && !casa(CLIENTE_TROCA_SENHA, caminho)) return redirect('/primeiro-acesso');
    return proximo();
  })();

  // Nada do portal pode ficar em cache compartilhado (proxy, navegador de outra pessoa).
  if (!resposta.headers.has('cache-control')) resposta.headers.set('cache-control', 'private, no-store');
  resposta.headers.set('x-robots-tag', 'noindex, nofollow');
  return resposta;
});
