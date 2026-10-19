// Outgoing email (SMTP). Settings come from environment variables, never from the code:
//   SMTP_HOST (default smtp.hostinger.com)  SMTP_PORT (default 465)  SMTP_USER  SMTP_PASS  MAIL_FROM (optional, default: xgaigu <SMTP_USER>)
const nodemailer = require('nodemailer');

const cfg = () => ({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 465,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
});
const configured = () => { const c = cfg(); return !!(c.user && c.pass); };
const fromAddress = () => process.env.MAIL_FROM || (cfg().user ? `xgaigu <${cfg().user}>` : '');

let tr = null, trKey = '';
function transport() {
  const c = cfg(), key = [c.host, c.port, c.user, c.pass].join('|');
  if (!tr || key !== trKey) {
    tr = nodemailer.createTransport({ host: c.host, port: c.port, secure: c.port === 465, auth: { user: c.user, pass: c.pass },
      connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000 });
    trKey = key;
  }
  return tr;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Branded wrapper used by every message.
function layout(title, innerHtml, footerHtml = '') {
  return `<!doctype html><html lang="vi"><body style="margin:0;background:#f4eef8;font-family:Segoe UI,Arial,sans-serif;color:#1d1428">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4eef8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:linear-gradient(135deg,#ff2e7e,#ff6b4a);padding:22px 28px;color:#fff;font-size:24px;font-weight:800">xgaigu</td></tr>
<tr><td style="padding:28px">
<h2 style="margin:0 0 14px;font-size:20px">${esc(title)}</h2>
${innerHtml}
</td></tr>
<tr><td style="padding:16px 28px 26px;color:#7a6d88;font-size:12px;line-height:1.6;border-top:1px solid #eee6f3">${footerHtml || 'Email này được gửi từ xgaigu.com. Dành cho người từ 18 tuổi.'}</td></tr>
</table></td></tr></table></body></html>`;
}
const button = (href, label) => `<p style="margin:22px 0"><a href="${esc(href)}" style="display:inline-block;background:#ff2e7e;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:999px">${esc(label)}</a></p>`;

async function send({ to, subject, html, text, headers }) {
  if (!configured()) throw new Error('Chưa cấu hình email (SMTP_USER / SMTP_PASS)');
  return transport().sendMail({ from: fromAddress(), to, subject, html, text: text || html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<br\s*\/?>/g, '\n').replace(/<\/p>/g, '\n\n').replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim(), headers });
}

module.exports = { configured, fromAddress, send, layout, button, esc };
