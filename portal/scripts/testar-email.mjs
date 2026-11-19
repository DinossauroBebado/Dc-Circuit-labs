// Confere o login no SMTP e envia um e-mail de teste, com as mesmas configurações do portal.
//
//   node --env-file=/srv/apps/portal/.env scripts/testar-email.mjs destinatario@exemplo.com
import nodemailer from 'nodemailer';

const para = process.argv[2];
if (!para) {
  console.error('Uso: node --env-file=/srv/apps/portal/.env scripts/testar-email.mjs destinatario@exemplo.com');
  process.exit(1);
}
if (!process.env.SMTP_SENHA) {
  console.error('SMTP_SENHA está vazia em /srv/apps/portal/.env.');
  process.exit(1);
}

const transporte = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORTA ?? 465),
  secure: (process.env.SMTP_SEGURO ?? 'true') === 'true',
  auth: { user: process.env.SMTP_USUARIO, pass: process.env.SMTP_SENHA },
});

try {
  await transporte.verify();
  console.log(`Login no SMTP ok (${process.env.SMTP_USUARIO} em ${process.env.SMTP_HOST}).`);
} catch (e) {
  console.error(`Falha no login do SMTP: ${e.message}`);
  if (/auth|535|credentials/i.test(e.message)) console.error('→ Usuário ou senha errados (confira SMTP_USUARIO e SMTP_SENHA).');
  process.exit(1);
}

const info = await transporte.sendMail({
  from: process.env.EMAIL_REMETENTE ?? `DC Circuit Labs <${process.env.SMTP_USUARIO}>`,
  to: para,
  subject: 'Teste do Portal do Cliente',
  text: 'Se você recebeu este e-mail, o Portal do Cliente da DC Circuit Labs consegue enviar e-mails (confirmação de e-mail e recuperação de senha).',
});
console.log(`E-mail de teste enviado para ${para} (${info.response}). Confira a caixa de entrada e o spam.`);
