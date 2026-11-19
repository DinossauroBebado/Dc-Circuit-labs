// Tarefas longas (publicar do Confluence, sincronizar o Bling) rodam em segundo plano: o painel dispara e
// acompanha pelo histórico em `sincronizacoes`. Uma de cada tipo por vez.
import { publicar } from './publicar';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { BLING_ATIVO, blingConectado, sincronizarBling } from './bling';
import { confluenceConfigurado } from './confluence';

const rodando = { confluence: false, bling: false };

export function emAndamento(fonte: keyof typeof rodando): boolean {
  return rodando[fonte];
}

export function dispararPublicacao(opcoes: Parameters<typeof publicar>[0] = {}): boolean {
  if (rodando.confluence) return false;
  rodando.confluence = true;
  publicar(opcoes)
    .catch((e) => console.error('Publicação falhou', e))
    .finally(() => (rodando.confluence = false));
  return true;
}

export function dispararBling(adminId?: number): boolean {
  if (rodando.bling) return false;
  rodando.bling = true;
  sincronizarBling(adminId)
    .catch((e) => console.error('Sincronização do Bling falhou', e))
    .finally(() => (rodando.bling = false));
  return true;
}

// Agenda: Confluence todo dia às 3h; Bling a cada hora. Só em produção (no app rodando pelo pm2).
let agendado = false;
export function iniciarAgenda(): void {
  if (agendado) return;
  agendado = true;
  // Execução que estava rodando quando o app reiniciou nunca vai terminar: marca como interrompida.
  db.update(schema.sincronizacoes)
    .set({ status: 'erro', fim: new Date(), log: 'Interrompida (o portal reiniciou durante a execução).' })
    .where(eq(schema.sincronizacoes.status, 'rodando'))
    .run();
  let ultimoDia = '';
  setInterval(() => {
    const agora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const dia = agora.toDateString();
    if (agora.getHours() === 3 && ultimoDia !== dia) {
      ultimoDia = dia;
      if (confluenceConfigurado()) dispararPublicacao();
    }
  }, 60 * 1000).unref();
  if (BLING_ATIVO) setInterval(() => blingConectado() && dispararBling(), 60 * 60 * 1000).unref();
}
