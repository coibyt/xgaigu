// Email features: confirm email on sign-up (admin can switch it on/off), forgot / reset password, marketing campaigns with unsubscribe.
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const mail = require('./mail');

function install(app, ctx) {
  const { db, fail, clean, now, needAdmin, startSession } = ctx;
  const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
  const baseOf = (req) => (process.env.SITE_URL || req.protocol + '://' + req.get('host')).replace(/\/$/, '');

  // ---------- settings ----------
  const getSetting = (k, def = '') => { const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(k); return r ? r.value : def; };
  const setSetting = (k, v) => db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(k, String(v));
  const requireVerification = () => getSetting('require_email_verification', '0') === '1';
  let secret = getSetting('mail_secret');
  if (!secret) { secret = crypto.randomBytes(32).toString('hex'); setSetting('mail_secret', secret); }
  const unsubSig = (id) => crypto.createHmac('sha256', secret).update('unsub:' + id).digest('hex').slice(0, 32);

  // ---------- one-time tokens (only a hash is stored) ----------
  const makeToken = (userId, kind, ttlMs) => {
    const raw = crypto.randomBytes(24).toString('hex');
    db.prepare('DELETE FROM email_tokens WHERE user_id = ? AND kind = ?').run(userId, kind);
    db.prepare('INSERT INTO email_tokens (hash, user_id, kind, expires_at) VALUES (?,?,?,?)').run(sha(raw), userId, kind, now() + ttlMs);
    return raw;
  };
  const readToken = (raw, kind) => {
    if (!raw || typeof raw !== 'string' || raw.length > 100) return null;
    const r = db.prepare('SELECT * FROM email_tokens WHERE hash = ? AND kind = ?').get(sha(raw), kind);
    return r && r.expires_at > now() ? r : null;
  };
  const useToken = (r) => db.prepare('DELETE FROM email_tokens WHERE hash = ?').run(r.hash);

  // ---------- messages ----------
  async function sendVerification(user, req) {
    const link = `${baseOf(req)}/verify?token=${makeToken(user.id, 'verify', 48 * 3600_000)}`;
    await mail.send({ to: user.email, subject: 'Xác nhận email đăng ký xgaigu',
      html: mail.layout('Xác nhận email của bạn', `<p>Chào ${mail.esc(user.name)},</p><p>Cảm ơn bạn đã đăng ký xgaigu. Bấm nút bên dưới để xác nhận email và kích hoạt tài khoản (liên kết có hiệu lực 48 giờ).</p>${mail.button(link, 'Xác nhận email')}<p style="color:#7a6d88;font-size:13px">Nếu nút không bấm được, hãy dán liên kết này vào trình duyệt:<br>${mail.esc(link)}</p><p style="color:#7a6d88;font-size:13px">Nếu bạn không đăng ký, hãy bỏ qua email này.</p>`) });
  }
  async function sendReset(user, req) {
    const link = `${baseOf(req)}/reset?token=${makeToken(user.id, 'reset', 3600_000)}`;
    await mail.send({ to: user.email, subject: 'Đặt lại mật khẩu xgaigu',
      html: mail.layout('Đặt lại mật khẩu', `<p>Chào ${mail.esc(user.name)},</p><p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Bấm nút bên dưới để chọn mật khẩu mới (liên kết có hiệu lực 1 giờ).</p>${mail.button(link, 'Đặt lại mật khẩu')}<p style="color:#7a6d88;font-size:13px">Nếu bạn không yêu cầu, hãy bỏ qua email này, mật khẩu của bạn vẫn an toàn.</p>`) });
  }

  const mailLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });

  // ---------- email confirmation ----------
  app.get('/verify', (req, res) => {
    const t = readToken(String(req.query.token || ''), 'verify');
    if (!t) return res.redirect('/#/email-verified?ok=0');
    db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(t.user_id);
    useToken(t);
    const u = db.prepare('SELECT id, banned FROM users WHERE id = ?').get(t.user_id);
    if (u && !u.banned) startSession(req, res, u.id); // the link proves the email belongs to them: sign them in
    res.redirect('/#/email-verified?ok=1');
  });
  app.post('/api/resend-verification', mailLimiter, async (req, res) => {
    const u = db.prepare('SELECT * FROM users WHERE email = ? AND email_verified = 0 AND banned = 0').get(clean(req.body.email, 120).toLowerCase());
    if (u && mail.configured()) { try { await sendVerification(u, req); } catch (e) { console.error('mail:', e.message); } }
    res.json({ ok: true });
  });

  // ---------- forgot / reset password ----------
  app.post('/api/forgot', mailLimiter, async (req, res) => {
    const u = db.prepare('SELECT * FROM users WHERE email = ? AND banned = 0').get(clean(req.body.email, 120).toLowerCase());
    if (u && mail.configured()) { try { await sendReset(u, req); } catch (e) { console.error('mail:', e.message); } }
    res.json({ ok: true }); // same answer whether the email exists or not
  });
  app.get('/reset', (req, res) => res.redirect('/#/reset?token=' + encodeURIComponent(String(req.query.token || '').slice(0, 100))));
  app.post('/api/reset', mailLimiter, async (req, res) => {
    const password = String(req.body.password || '');
    if (password.length < 8) return fail(res, 400, 'Mật khẩu tối thiểu 8 ký tự');
    const t = readToken(String(req.body.token || ''), 'reset');
    if (!t) return fail(res, 400, 'Liên kết đã hết hạn hoặc không hợp lệ. Hãy yêu cầu đặt lại mật khẩu lần nữa.');
    db.prepare('UPDATE users SET pass_hash = ?, email_verified = 1 WHERE id = ?').run(await bcrypt.hash(password, 10), t.user_id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(t.user_id); // sign out everywhere
    useToken(t);
    res.json({ ok: true });
  });

  // ---------- unsubscribe from marketing ----------
  app.get('/unsubscribe', (req, res) => {
    const id = Number(req.query.u);
    const ok = id > 0 && String(req.query.t || '') === unsubSig(id);
    if (ok) db.prepare('UPDATE users SET marketing_optout = 1 WHERE id = ?').run(id);
    res.type('html').send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hủy nhận email – xgaigu</title><body style="font-family:Segoe UI,Arial,sans-serif;background:#0B0610;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center"><div style="max-width:420px;padding:24px"><h2>${ok ? 'Đã hủy nhận email quảng bá' : 'Liên kết không hợp lệ'}</h2><p style="color:#c9bcd8">${ok ? 'Bạn sẽ không nhận email khuyến mãi từ xgaigu nữa. Email quan trọng về tài khoản (xác nhận, đặt lại mật khẩu) vẫn được gửi.' : 'Vui lòng dùng liên kết trong email gần nhất.'}</p><p><a href="/" style="color:#ff6b9d">Về xgaigu.com</a></p></div></body>`);
  });

  // ---------- admin: settings, test mail, campaigns ----------
  app.get('/api/admin/mail', needAdmin, (_req, res) => {
    const campaigns = db.prepare('SELECT * FROM mail_campaigns ORDER BY id DESC LIMIT 10').all();
    const counts = db.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) AS verified, SUM(CASE WHEN marketing_optout = 1 THEN 1 ELSE 0 END) AS optout FROM users WHERE banned = 0').get();
    res.json({ requireVerification: requireVerification(), configured: mail.configured(), from: mail.fromAddress(), campaigns, counts });
  });
  app.put('/api/admin/mail', needAdmin, (req, res) => {
    if (req.body.requireVerification && !mail.configured()) return fail(res, 400, 'Chưa cấu hình email gửi đi nên không thể bật xác nhận email');
    setSetting('require_email_verification', req.body.requireVerification ? '1' : '0');
    res.json({ ok: true, requireVerification: requireVerification() });
  });
  app.post('/api/admin/mail/test', needAdmin, async (req, res) => {
    const to = clean(req.body.to, 120).toLowerCase() || req.user.email;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return fail(res, 400, 'Email nhận không hợp lệ');
    try {
      const info = await mail.send({ to, subject: 'Email thử từ xgaigu', html: mail.layout('Email gửi thử', '<p>Nếu bạn đọc được email này, cấu hình gửi email của xgaigu.com đang hoạt động bình thường. ✅</p>') });
      res.json({ ok: true, to, response: String(info.response || '').slice(0, 120) });
    } catch (e) { console.error('mail test:', e.message); fail(res, 502, 'Gửi thất bại: ' + e.message); }
  });

  let running = false;
  db.prepare("UPDATE mail_campaigns SET status = 'interrupted' WHERE status = 'running'").run();
  app.post('/api/admin/mail/campaign', needAdmin, (req, res) => {
    if (!mail.configured()) return fail(res, 400, 'Chưa cấu hình email gửi đi');
    if (running) return fail(res, 409, 'Đang có một chiến dịch gửi, hãy chờ nó xong');
    const subject = clean(req.body.subject, 150), body = String(req.body.body || '').replace(/\r/g, '').trim().slice(0, 8000);
    if (subject.length < 3 || body.length < 10) return fail(res, 400, 'Hãy nhập tiêu đề và nội dung email');
    const limit = Math.min(Math.max(parseInt(req.body.limit, 10) || 100, 1), 1000);
    const rows = db.prepare(
      `SELECT id, email, name FROM users WHERE banned = 0 AND marketing_optout = 0 ${req.body.verifiedOnly ? 'AND email_verified = 1' : ''} ORDER BY id LIMIT ?`).all(limit);
    if (!rows.length) return fail(res, 400, 'Không có người nhận nào phù hợp');
    const c = db.prepare('INSERT INTO mail_campaigns (subject, total, sent, failed, status, created_at) VALUES (?,?,0,0,?,?)').run(subject, rows.length, 'running', now());
    const cid = Number(c.lastInsertRowid), base = baseOf(req);
    running = true;
    (async () => {
      for (const u of rows) {
        const unsub = `${base}/unsubscribe?u=${u.id}&t=${unsubSig(u.id)}`;
        const text = body.replace(/\{name\}/g, u.name);
        const inner = text.split(/\n{2,}/).map((p) => `<p style="line-height:1.6">${mail.esc(p).replace(/\n/g, '<br>')}</p>`).join('');
        try {
          await mail.send({ to: u.email, subject, headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
            html: mail.layout(subject, inner, `Bạn nhận email này vì đã đăng ký tài khoản tại xgaigu.com. <a href="${mail.esc(unsub)}" style="color:#7a6d88">Hủy nhận email quảng bá</a>.`) });
          db.prepare('UPDATE mail_campaigns SET sent = sent + 1 WHERE id = ?').run(cid);
        } catch (e) { console.error('campaign mail:', e.message); db.prepare('UPDATE mail_campaigns SET failed = failed + 1 WHERE id = ?').run(cid); }
        await new Promise((r) => setTimeout(r, 1500)); // gentle pace: shared mail servers limit messages per hour
      }
      db.prepare("UPDATE mail_campaigns SET status = 'done' WHERE id = ?").run(cid);
      running = false;
    })().catch(() => { running = false; });
    res.json({ ok: true, id: cid, total: rows.length });
  });

  return { requireVerification, configured: mail.configured, sendVerification };
}

module.exports = { install };
