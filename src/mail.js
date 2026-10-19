// Outgoing email (SMTP) and the shared look of every message.
// Settings come from environment variables, never from the code:
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
const replyTo = () => process.env.MAIL_REPLY_TO || cfg().user || undefined;

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
const site = () => (process.env.SITE_URL || 'https://xgaigu.com').replace(/\/$/, '');

// ---------- building blocks (table based, inline styles: works in Gmail, Apple Mail, Outlook, mobile) ----------
const C = { ink: '#1b0b2e', text: '#3d3248', muted: '#7b6e89', rose: '#ff2e7e', coral: '#ff6b4a', soft: '#fbf3f8', line: '#eadff0', paper: '#ffffff', page: '#f3ecf7' };
const SERIF = "Georgia,'Times New Roman',serif", SANS = "'Segoe UI',Helvetica,Arial,sans-serif";

const p = (html, extra = '') => `<p style="margin:0 0 16px;font:400 16px/1.75 ${SANS};color:${C.text};${extra}">${html}</p>`;
const small = (html) => `<p style="margin:0 0 12px;font:400 13px/1.7 ${SANS};color:${C.muted}">${html}</p>`;
const link = (href, label) => `<a href="${esc(href)}" style="color:${C.rose};text-decoration:underline">${esc(label || href)}</a>`;

// Bulletproof button (renders as a real button in Outlook too).
const button = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 24px"><tr><td align="center" bgcolor="${C.rose}" style="border-radius:999px;background:linear-gradient(135deg,${C.rose},${C.coral})">
<a href="${esc(href)}" target="_blank" style="display:inline-block;padding:16px 38px;font:700 16px/1 ${SANS};color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a></td></tr></table>`;

// Highlighted note with an emoji.
const callout = (emoji, title, html) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 22px"><tr>
<td style="background:${C.soft};border-left:4px solid ${C.rose};border-radius:10px;padding:16px 18px">
<div style="font:700 15px/1.4 ${SANS};color:${C.ink};margin-bottom:4px">${emoji}&nbsp; ${esc(title)}</div>
<div style="font:400 14px/1.7 ${SANS};color:${C.text}">${html}</div></td></tr></table>`;

// Row of icon + heading + text, used for benefits and quick-start steps.
const features = (items) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 10px">${items.map(([emoji, title, text]) =>
  `<tr><td width="52" valign="top" style="padding:10px 0"><div style="width:40px;height:40px;line-height:40px;text-align:center;border-radius:50%;background:${C.soft};font-size:20px">${emoji}</div></td>
<td valign="top" style="padding:10px 0 10px 4px"><div style="font:700 15px/1.4 ${SANS};color:${C.ink}">${esc(title)}</div><div style="font:400 14px/1.65 ${SANS};color:${C.text}">${esc(text)}</div></td></tr>`).join('')}</table>`;

const divider = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${C.line};height:1px;line-height:1px;font-size:1px">&nbsp;</td></tr></table>`;

/**
 * Full message. opts: { preheader, eyebrow, title, body (html), footerNote (html, optional) }
 * The footer always carries site links and the 18+ notice.
 */
function layout({ preheader = '', eyebrow = '', title, body, footerNote = '' }) {
  const base = site();
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page};font-size:1px;line-height:1px">${esc(preheader)}${'&nbsp;&zwnj;'.repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.page}" style="background:${C.page}"><tr><td align="center" style="padding:28px 12px 36px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">
<!-- header -->
<tr><td bgcolor="#3b1050" style="background:#3b1050;background:linear-gradient(135deg,#1b0b2e 0%,#4a1458 55%,#c2185b 100%);border-radius:20px 20px 0 0;padding:30px 40px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td valign="middle"><img src="${base}/icons/icon-192.png" width="44" height="44" alt="" style="display:block;border-radius:12px;border:0"></td>
<td valign="middle" style="padding-left:14px"><div style="font:800 26px/1 ${SANS};color:#ffffff;letter-spacing:.3px">xgai<span style="color:#ff8ab4">gu</span></div>
<div style="font:400 12px/1.4 ${SANS};color:#e8cfe9;margin-top:5px;letter-spacing:.4px">Video · Livestream · Hẹn gặp an toàn</div></td></tr></table></td></tr>
<!-- card -->
<tr><td bgcolor="${C.paper}" style="background:${C.paper};padding:42px 40px 18px">
${eyebrow ? `<div style="font:700 12px/1 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.rose};margin-bottom:14px">${esc(eyebrow)}</div>` : ''}
<h1 style="margin:0 0 22px;font:400 30px/1.3 ${SERIF};color:${C.ink}">${esc(title)}</h1>
${body}
</td></tr>
<tr><td bgcolor="${C.paper}" style="background:${C.paper};padding:6px 40px 34px">${divider}
<p style="margin:18px 0 0;font:400 14px/1.7 ${SANS};color:${C.text}">Cần giúp đỡ? Chỉ cần trả lời email này hoặc viết tới ${link('mailto:info@xgaigu.com', 'info@xgaigu.com')}, đội ngũ xgaigu luôn sẵn lòng hỗ trợ bạn.</p>
<p style="margin:14px 0 0;font:400 17px/1.6 ${SERIF};color:${C.ink}">Thân mến,<br>Đội ngũ xgaigu 💖</p></td></tr>
<!-- footer -->
<tr><td bgcolor="#f9f4fc" style="background:#f9f4fc;border-radius:0 0 20px 20px;padding:24px 40px 28px;border-top:1px solid ${C.line}">
<p style="margin:0 0 10px;font:400 13px/1.8 ${SANS};color:${C.muted};text-align:center">
<a href="${base}/" style="color:${C.ink};text-decoration:none;font-weight:600">Trang chủ</a> &nbsp;·&nbsp; <a href="${base}/khu-vuc" style="color:${C.ink};text-decoration:none;font-weight:600">Khu vực</a> &nbsp;·&nbsp; <a href="${base}/#/terms" style="color:${C.ink};text-decoration:none;font-weight:600">Điều khoản &amp; Quy tắc</a></p>
${footerNote ? `<p style="margin:0 0 10px;font:400 12px/1.7 ${SANS};color:${C.muted};text-align:center">${footerNote}</p>` : ''}
<p style="margin:0;font:400 12px/1.7 ${SANS};color:#a398b0;text-align:center">xgaigu.com · Dành cho người từ 18 tuổi trở lên.<br>Hãy luôn gặp gỡ ở nơi công cộng và không chuyển tiền trước cho người lạ.</p>
</td></tr></table></td></tr></table></body></html>`;
}

// Readable plain-text twin (some people and spam filters prefer it).
const textOf = (parts) => parts.filter(Boolean).join('\n\n') + '\n\n— Đội ngũ xgaigu\nCần giúp đỡ? Trả lời email này hoặc viết tới info@xgaigu.com\nxgaigu.com · Dành cho người từ 18 tuổi trở lên.';

async function send({ to, subject, html, text, headers }) {
  if (!configured()) throw new Error('Chưa cấu hình email (SMTP_USER / SMTP_PASS)');
  return transport().sendMail({ from: fromAddress(), replyTo: replyTo(), to, subject, html,
    text: text || html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|div|h1|tr)>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;|&zwnj;/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(), headers });
}

module.exports = { configured, fromAddress, send, layout, textOf, esc, site, p, small, link, button, callout, features, divider };
