import nodemailer from 'nodemailer';

const transporte = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORTA ?? 1025),
  secure: (process.env.SMTP_SEGURO ?? 'false') === 'true',
  auth: process.env.SMTP_USUARIO ? { user: process.env.SMTP_USUARIO, pass: process.env.SMTP_SENHA ?? '' } : undefined,
});

const REMETENTE = process.env.EMAIL_REMETENTE ?? 'DC Circuit Labs <portal@dccircuitlabs.com>';
const PORTAL_URL = (process.env.PORTAL_URL ?? 'https://portal.dccircuitlabs.com').replace(/\/$/, '');

function escapar(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function modelo(titulo: string, paragrafos: string[], botao: { texto: string; url: string }) {
  const corpo = paragrafos.map((p) => `<p style="margin:0 0 16px;line-height:1.6">${escapar(p)}</p>`).join('');
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:32px 16px;background:#f4f7f9;font-family:Montserrat,Arial,sans-serif;color:#333">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;padding:32px">
    <p style="margin:0 0 24px;font-weight:700;color:#121212">DC CIRCUIT <span style="color:#007bff">LABS</span></p>
    <h1 style="margin:0 0 16px;font-size:22px;color:#121212">${escapar(titulo)}</h1>
    ${corpo}
    <p style="margin:24px 0"><a href="${botao.url}" style="display:inline-block;background:#007bff;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:4px">${escapar(botao.texto)}</a></p>
    <p style="margin:0;font-size:13px;color:#555">Se o botão não funcionar, copie este endereço no navegador:<br>${escapar(botao.url)}</p>
  </div></body></html>`;
}

async function enviar(para: string, assunto: string, html: string, textoPuro: string, responderPara?: string) {
  await transporte.sendMail({ from: REMETENTE, to: para, subject: assunto, html, text: textoPuro, ...(responderPara ? { replyTo: responderPara } : {}) });
}

// Avisos internos (erros reportados pelos clientes): EMAIL_AVISOS no .env; sem ele, a própria caixa que envia.
const EMAIL_AVISOS = process.env.EMAIL_AVISOS || process.env.SMTP_USUARIO || '';

export interface DadosReporte {
  cliente: { razaoSocial: string; cnpj: string; email: string | null };
  documento: { id: number; titulo: string };
  projeto: string;
  secao: { id: string; titulo: string } | null;
  trecho: string | null;
  arquivoNome: string | null;
  comentario: string;
}

/** "Reportar erro" na documentação → e-mail para a DC. Responder o e-mail responde ao cliente (se o e-mail dele estiver confirmado). */
export function enviarReporte(r: DadosReporte) {
  if (!EMAIL_AVISOS) throw new Error('Sem destinatário para avisos (EMAIL_AVISOS ou SMTP_USUARIO).');
  const link = `${PORTAL_URL}/admin/documentos/${r.documento.id}${r.secao ? `#${r.secao.id}` : ''}`;
  const linhas: [string, string][] = [
    ['Cliente', `${r.cliente.razaoSocial} (CNPJ ${r.cliente.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')})`],
    ['Projeto', r.projeto],
    ['Documento', r.documento.titulo],
    ['Seção', r.secao?.titulo ?? '(não identificada)'],
    ...(r.arquivoNome ? ([['Imagem marcada', r.arquivoNome]] as [string, string][]) : []),
  ];
  const tabela = linhas
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#555;vertical-align:top">${escapar(k)}</td><td style="padding:4px 0;font-weight:600">${escapar(v)}</td></tr>`)
    .join('');
  const citacao = (t: string) => `<blockquote style="margin:0 0 16px;padding:10px 14px;border-left:3px solid #007bff;background:#f4f7f9;white-space:pre-wrap">${escapar(t)}</blockquote>`;
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px 16px;background:#f4f7f9;font-family:Arial,sans-serif;color:#333">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:28px">
    <p style="margin:0 0 6px;font-weight:700;color:#121212">Erro reportado na documentação</p>
    <table style="margin:0 0 18px;font-size:14px;border-collapse:collapse">${tabela}</table>
    ${r.trecho ? `<p style="margin:0 0 6px;color:#555;font-size:13px">Trecho marcado</p>${citacao(r.trecho)}` : ''}
    <p style="margin:0 0 6px;color:#555;font-size:13px">Comentário do cliente</p>${citacao(r.comentario)}
    <p style="margin:20px 0 0"><a href="${link}" style="display:inline-block;background:#007bff;color:#fff;text-decoration:none;font-weight:600;padding:10px 20px;border-radius:4px">Abrir no painel</a></p>
    <p style="margin:16px 0 0;font-size:12px;color:#777">${r.cliente.email ? 'Responder este e-mail responde direto ao cliente.' : 'O cliente não tem e-mail confirmado: responda pelo seu canal habitual.'}</p>
  </div></body></html>`;
  const texto = [
    'Erro reportado na documentação',
    ...linhas.map(([k, v]) => `${k}: ${v}`),
    ...(r.trecho ? ['', 'Trecho marcado:', r.trecho] : []),
    '',
    'Comentário do cliente:',
    r.comentario,
    '',
    `Abrir no painel: ${link}`,
  ].join('\n');
  return enviar(EMAIL_AVISOS, `Erro reportado — ${r.cliente.razaoSocial} · ${r.documento.titulo}`, html, texto, r.cliente.email ?? undefined);
}

export function enviarConfirmacaoEmail(para: string, token: string) {
  const url = `${PORTAL_URL}/confirmar-email/${token}`;
  return enviar(
    para,
    'Confirme seu e-mail no Portal DC Circuit Labs',
    modelo('Confirme seu e-mail', ['Use o botão abaixo para confirmar este e-mail no Portal do Cliente da DC Circuit Labs. Ele será usado para recuperar sua senha.', 'O link vale por 24 horas.'], { texto: 'Confirmar e-mail', url }),
    `Confirme seu e-mail no Portal DC Circuit Labs: ${url}\nO link vale por 24 horas.`,
  );
}

export function enviarRedefinicaoSenha(para: string, token: string) {
  const url = `${PORTAL_URL}/redefinir-senha/${token}`;
  return enviar(
    para,
    'Redefinição de senha — Portal DC Circuit Labs',
    modelo('Redefinir sua senha', ['Recebemos um pedido para redefinir a senha do seu acesso ao Portal do Cliente.', 'O link vale por 1 hora e só pode ser usado uma vez. Se não foi você, ignore este e-mail: sua senha continua a mesma.'], { texto: 'Criar nova senha', url }),
    `Redefina sua senha no Portal DC Circuit Labs: ${url}\nO link vale por 1 hora. Se não foi você, ignore este e-mail.`,
  );
}
