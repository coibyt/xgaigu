// One-off patch: use the new email templates (welcome, password-changed notice, campaign button, nicer test mail).
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};
const A = 'src/auth-mail.js';

rep(A, "const mail = require('./mail');", "const mail = require('./mail');\nconst T = require('./mail-templates');");

// verification + reset use the templates
const s = fs.readFileSync(A, 'utf8');
const a = s.indexOf('  async function sendVerification(user, req) {');
const b = s.indexOf('  const mailLimiter');
if (a < 0 || b < 0) throw new Error('send functions not found');
fs.writeFileSync(A, s.slice(0, a) + `  async function sendVerification(user, req) {
    const url = \`\${baseOf(req)}/verify?token=\${makeToken(user.id, 'verify', 48 * 3600_000)}\`;
    await mail.send({ to: user.email, ...T.verify({ name: user.name, url }) });
  }
  async function sendReset(user, req) {
    const url = \`\${baseOf(req)}/reset?token=\${makeToken(user.id, 'reset', 3600_000)}\`;
    await mail.send({ to: user.email, ...T.reset({ name: user.name, url }) });
  }
  // Welcome mail once the account is usable. Never blocks or breaks sign-up if mail fails.
  function sendWelcome(user, req) {
    if (!mail.configured()) return;
    mail.send({ to: user.email, ...T.welcome({ name: user.name, url: baseOf(req) + '/' }) }).catch((e) => console.error('welcome mail:', e.message));
  }

` + s.slice(b));

// welcome after confirming the email
rep(A, "    if (u && !u.banned) startSession(req, res, u.id); // the link proves the email belongs to them: sign them in",
  "    if (u && !u.banned) startSession(req, res, u.id); // the link proves the email belongs to them: sign them in\n    if (u && !u.banned) sendWelcome(db.prepare('SELECT * FROM users WHERE id = ?').get(u.id), req);");

// forgot-password shortcut used by the security notice, plus a notice after the password changed
rep(A, "  app.get('/reset', (req, res)", "  app.get('/forgot', (_req, res) => res.redirect('/#/forgot-password'));\n  app.get('/reset', (req, res)");
rep(A, "    useToken(t);\n    res.json({ ok: true });\n  });\n\n  // ---------- unsubscribe", `    useToken(t);
    const who = db.prepare('SELECT name, email FROM users WHERE id = ?').get(t.user_id);
    if (who && mail.configured()) mail.send({ to: who.email, ...T.passwordChanged({ name: who.name, when: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) + ' (giờ Việt Nam)', resetUrl: baseOf(req) + '/forgot' }) }).catch((e) => console.error('notice mail:', e.message));
    res.json({ ok: true });
  });

  // ---------- unsubscribe`);

// test mail
rep(A, "const info = await mail.send({ to, subject: 'Email thử từ xgaigu', html: mail.layout('Email gửi thử', '<p>Nếu bạn đọc được email này, cấu hình gửi email của xgaigu.com đang hoạt động bình thường. ✅</p>') });", "const info = await mail.send({ to, ...T.test() });");

// campaign: optional button
rep(A, "    const limit = Math.min(Math.max(parseInt(req.body.limit, 10) || 100, 1), 1000);",
  `    const limit = Math.min(Math.max(parseInt(req.body.limit, 10) || 100, 1), 1000);
    let cta = null;
    const ctaLabel = clean(req.body.ctaLabel, 40); let ctaUrl = clean(req.body.ctaUrl, 400);
    if (ctaLabel || ctaUrl) {
      if (ctaUrl.startsWith('/')) ctaUrl = baseOf(req) + ctaUrl;
      if (!ctaLabel || !/^https?:\\/\\/\\S+$/.test(ctaUrl)) return fail(res, 400, 'Nút trong email cần có chữ trên nút và địa chỉ bắt đầu bằng https:// (hoặc /)');
      cta = { label: ctaLabel, url: ctaUrl };
    }`);
const s2 = fs.readFileSync(A, 'utf8');
const c1 = s2.indexOf("        const text = body.replace(/\\{name\\}/g, u.name);");
const c2 = s2.indexOf("          db.prepare('UPDATE mail_campaigns SET sent = sent + 1");
if (c1 < 0 || c2 < 0) throw new Error('campaign loop not found');
fs.writeFileSync(A, s2.slice(0, c1) + `        try {
          const msg = T.campaign({ name: u.name, subject, text: body, cta, unsubscribeUrl: unsub });
          await mail.send({ to: u.email, ...msg, headers: { 'List-Unsubscribe': \`<\${unsub}>\`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
` + s2.slice(c2));
rep(A, "return { requireVerification, configured: mail.configured, sendVerification };", "return { requireVerification, configured: mail.configured, sendVerification, sendWelcome };");

// ---------- server: welcome mail right after sign-up without confirmation ----------
rep('server.js', "  startSession(req, res, Number(info.lastInsertRowid));\n  res.json({ user: selfUser(u) });", "  startSession(req, res, Number(info.lastInsertRowid));\n  authMail.sendWelcome(u, req);\n  res.json({ user: selfUser(u) });");

// ---------- client: forgot-password route + campaign button fields ----------
rep('public/js/app.js', "    if (a === 'reset') return pageReset(query);", "    if (a === 'reset') return pageReset(query);\n    if (a === 'forgot-password') { const holder = h('div'); const mm = modal(holder); holder.append(forgotForm(mm)); location.hash = '#/'; return; }");
rep('public/js/app.js', "    const lim = h('input', { type: 'number', min: 1, max: 1000, value: 100, style: 'width:110px' }), ver = h('input', { type: 'checkbox' });",
  "    const lim = h('input', { type: 'number', min: 1, max: 1000, value: 100, style: 'width:110px' }), ver = h('input', { type: 'checkbox' });\n    const ctaL = h('input', { placeholder: 'Chữ trên nút (không bắt buộc), VD: Xem ngay', maxlength: 40, style: 'flex:1;min-width:180px' }), ctaU = h('input', { placeholder: 'Địa chỉ của nút, VD: https://xgaigu.com/khu-vuc', maxlength: 400, style: 'flex:2;min-width:220px' });");
rep('public/js/app.js', "h('b', {}, 'Gửi email quảng bá cho thành viên'), subj, body,", "h('b', {}, 'Gửi email quảng bá cho thành viên'), subj, body, h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, ctaL, ctaU),");
rep('public/js/app.js', "body: { subject: subj.value, body: body.value, limit: lim.value, verifiedOnly: ver.checked } }", "body: { subject: subj.value, body: body.value, limit: lim.value, verifiedOnly: ver.checked, ctaLabel: ctaL.value, ctaUrl: ctaU.value } }");
console.log('patched');
