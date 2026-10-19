// One-off patch: wire email (confirmation, password reset, campaigns) into db, server, app and admin page.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---------- db ----------
rep('src/db.js', 'CREATE TABLE IF NOT EXISTS reports (', `CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS email_tokens (
  hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS mail_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  total INTEGER NOT NULL,
  sent INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (`);
rep('src/db.js', "  ['allow_calls', 'allow_calls INTEGER DEFAULT 1'],", "  ['allow_calls', 'allow_calls INTEGER DEFAULT 1'],\n  ['email_verified', 'email_verified INTEGER DEFAULT 1'],\n  ['marketing_optout', 'marketing_optout INTEGER DEFAULT 0'],");

// ---------- server ----------
rep('server.js', "app.post('/api/register', authLimiter,", "const authMail = require('./src/auth-mail').install(app, { db, fail, clean, now, needAdmin, startSession });\n\napp.post('/api/register', authLimiter,");
rep('server.js', "  const info = db.prepare(\n    'INSERT INTO users (email, pass_hash, name, birth_year, gender, city, address, lat, lng, role, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'\n  ).run(email, hash, name, birthYear, gender, clean(req.body.city, 60), place.address, place.lat, place.lng, role, now());\n  startSession(req, res, Number(info.lastInsertRowid));\n  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);\n  res.json({ user: selfUser(u) });",
`  const needVerify = role !== 'admin' && authMail.configured() && authMail.requireVerification(); // admin can switch this on/off
  const info = db.prepare(
    'INSERT INTO users (email, pass_hash, name, birth_year, gender, city, address, lat, lng, role, email_verified, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(email, hash, name, birthYear, gender, clean(req.body.city, 60), place.address, place.lat, place.lng, role, needVerify ? 0 : 1, now());
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  if (needVerify) { // no session until the email is confirmed
    try { await authMail.sendVerification(u, req); } catch (e) { console.error('verification mail failed:', e.message); }
    return res.json({ needVerify: true, email });
  }
  startSession(req, res, Number(info.lastInsertRowid));
  res.json({ user: selfUser(u) });`);
rep('server.js', "  if (u.banned) return fail(res, 403, 'Tài khoản đã bị khóa');\n  startSession(req, res, u.id);",
  "  if (u.banned) return fail(res, 403, 'Tài khoản đã bị khóa');\n  if (u.email_verified === 0) return res.status(403).json({ error: 'Bạn cần xác nhận email trước khi đăng nhập. Hãy kiểm tra hộp thư (cả mục Spam).', code: 'unverified' });\n  startSession(req, res, u.id);");

// ---------- client: api error code ----------
rep('public/js/app.js', "const e = new Error(data.error || 'Có lỗi xảy ra'); e.status = r.status; throw e;", "const e = new Error(data.error || 'Có lỗi xảy ra'); e.status = r.status; e.code = data.code; throw e;");

// ---------- client: sign-up / login / forgot ----------
rep('public/js/app.js', "        const r = await api(reg ? '/register' : '/login', { method: 'POST', body: d });\n        S.user = r.user; m.close(); afterAuth(); toast(reg ? 'Chào mừng đến với xgaigu 💖' : 'Đã đăng nhập');\n      } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; }",
`        const r = await api(reg ? '/register' : '/login', { method: 'POST', body: d });
        if (r.needVerify) { m.box.querySelector('form').replaceWith(verifyNotice(r.email, m)); return; }
        S.user = r.user; m.close(); afterAuth(); toast(reg ? 'Chào mừng đến với xgaigu 💖' : 'Đã đăng nhập');
      } catch (ex) {
        err.textContent = ex.message; err.hidden = false; btn.disabled = false;
        if (ex.code === 'unverified') { err.append(' ', h('button', { type: 'button', class: 'linkbtn', onclick: () => m.box.querySelector('form').replaceWith(verifyNotice(d.email, m, true)) }, 'Gửi lại email xác nhận')); }
      }`);
rep('public/js/app.js', "      h('button', { class: 'btn primary lg', style: 'width:100%', type: 'submit' }, reg ? 'Tạo tài khoản' : 'Đăng nhập'));",
  "      h('button', { class: 'btn primary lg', style: 'width:100%', type: 'submit' }, reg ? 'Tạo tài khoản' : 'Đăng nhập'),\n      !reg && h('p', { style: 'text-align:center;margin-top:12px' }, h('button', { type: 'button', class: 'linkbtn', onclick: () => m.box.querySelector('form').replaceWith(forgotForm(m)) }, 'Quên mật khẩu?')));");
rep('public/js/app.js', "function openAuth(mode = 'login') {", `// shown after sign-up when the site requires email confirmation
function verifyNotice(email, m, resendNow = false) {
  const note = h('p', { class: 'muted', style: 'margin-top:10px;font-size:14px' });
  const send = async () => { try { await api('/resend-verification', { method: 'POST', body: { email } }); note.textContent = 'Đã gửi lại email xác nhận. Hãy kiểm tra hộp thư.'; } catch (e) { note.textContent = e.message; } };
  if (resendNow) send();
  return h('form', { onsubmit: (e) => e.preventDefault() }, h('h3', {}, 'Kiểm tra email của bạn 📬'),
    h('p', { class: 'sub' }, 'Chúng tôi đã gửi liên kết xác nhận tới ' + email + '. Bấm vào liên kết trong email để kích hoạt tài khoản (nhớ xem cả mục Spam).'),
    h('button', { type: 'button', class: 'btn', onclick: send }, 'Gửi lại email'), h('button', { type: 'button', class: 'btn ghost', style: 'margin-left:8px', onclick: () => m.close() }, 'Đóng'), note);
}
function forgotForm(m) {
  const msg = h('div', { class: 'err', hidden: true });
  const f = h('form', { novalidate: true }, h('h3', {}, 'Quên mật khẩu'), h('p', { class: 'sub' }, 'Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.'), msg,
    h('label', { class: 'f' }, h('span', {}, 'Email'), h('input', { name: 'email', type: 'email', autocomplete: 'email', required: true })),
    h('button', { class: 'btn primary lg', style: 'width:100%', type: 'submit' }, 'Gửi liên kết đặt lại'),
    h('p', { style: 'text-align:center;margin-top:12px' }, h('button', { type: 'button', class: 'linkbtn', onclick: () => { m.close(); openAuth('login'); } }, 'Quay lại đăng nhập')));
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    try { await api('/forgot', { method: 'POST', body: { email: f.email.value } }); msg.hidden = false; msg.style.color = '#34d399'; msg.textContent = 'Nếu email này đã đăng ký, bạn sẽ nhận được thư trong ít phút. Hãy kiểm tra cả mục Spam.'; }
    catch (ex) { msg.hidden = false; msg.textContent = ex.message; btn.disabled = false; }
  });
  return f;
}
function pageReset(query) {
  const token = new URLSearchParams(query || '').get('token') || '';
  const err = h('div', { class: 'err', hidden: true });
  const f = h('form', { novalidate: true, class: 'card', style: 'padding:24px;max-width:440px;margin:40px auto' }, h('h2', { class: 'title' }, 'Đặt lại mật khẩu'), err,
    h('label', { class: 'f' }, h('span', {}, 'Mật khẩu mới'), h('input', { name: 'p1', type: 'password', minlength: 8, autocomplete: 'new-password', required: true }), h('small', {}, 'Tối thiểu 8 ký tự')),
    h('label', { class: 'f' }, h('span', {}, 'Nhập lại mật khẩu'), h('input', { name: 'p2', type: 'password', minlength: 8, autocomplete: 'new-password', required: true })),
    h('button', { class: 'btn primary lg', style: 'width:100%', type: 'submit' }, 'Đổi mật khẩu'));
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); err.hidden = true;
    if (f.p1.value !== f.p2.value) { err.textContent = 'Hai mật khẩu chưa giống nhau'; err.hidden = false; return; }
    try { await api('/reset', { method: 'POST', body: { token, password: f.p1.value } }); toast('Đã đổi mật khẩu, hãy đăng nhập'); location.hash = '#/'; openAuth('login'); }
    catch (ex) { err.textContent = ex.message; err.hidden = false; }
  });
  main.append(h('div', { class: 'wrap' }, f));
}
function pageEmailVerified(query) {
  const ok = new URLSearchParams(query || '').get('ok') === '1';
  main.append(h('div', { class: 'wrap' }, h('div', { class: 'card empty', style: 'margin:60px auto;max-width:480px' }, h('h2', {}, ok ? 'Đã xác nhận email ✅' : 'Liên kết không hợp lệ'),
    h('p', { class: 'muted' }, ok ? 'Tài khoản của bạn đã được kích hoạt và đã đăng nhập.' : 'Liên kết đã hết hạn hoặc đã dùng rồi. Hãy đăng nhập để nhận lại email xác nhận.'),
    h('a', { class: 'btn primary', style: 'margin-top:14px', href: '#/' }, 'Vào xgaigu'))));
  if (ok) api('/me').then((r) => { S.user = r.user; renderNav(); connectEvents(); }).catch(() => {});
}

function openAuth(mode = 'login') {`);
rep('public/js/app.js', "    if (a === 'terms') return pageTerms();", "    if (a === 'terms') return pageTerms();\n    if (a === 'reset') return pageReset(query);\n    if (a === 'email-verified') return pageEmailVerified(query);");

// ---------- client: admin ----------
rep('public/js/app.js', "  // SEO text of every area (region / province / district)", `  // email: confirmation switch, test mail, campaigns
  const ml = await api('/admin/mail').catch(() => null);
  const mailBox = ml && (() => {
    const chk = h('input', { type: 'checkbox', checked: ml.requireVerification });
    chk.addEventListener('change', async () => { try { await api('/admin/mail', { method: 'PUT', body: { requireVerification: chk.checked } }); toast(chk.checked ? 'Đã BẬT: khách phải xác nhận email mới đăng nhập được' : 'Đã TẮT xác nhận email'); } catch (e) { chk.checked = !chk.checked; fail(e); } });
    const testTo = h('input', { type: 'email', placeholder: 'Email nhận thư thử (để trống = email của bạn)', style: 'flex:1;min-width:220px' });
    const testRes = h('p', { class: 'muted', style: 'font-size:14px;margin-top:8px' });
    const subj = h('input', { placeholder: 'Tiêu đề email', maxlength: 150 }), body = h('textarea', { rows: 8, maxlength: 8000, placeholder: 'Nội dung email. Dùng {name} để chèn tên người nhận. Để trống một dòng giữa các đoạn.' });
    const lim = h('input', { type: 'number', min: 1, max: 1000, value: 100, style: 'width:110px' }), ver = h('input', { type: 'checkbox' });
    const camp = h('div', { style: 'margin-top:12px;display:grid;gap:8px' });
    const drawC = (list) => camp.replaceChildren(...list.map((c) => h('div', { class: 'muted', style: 'font-size:13px' }, '#' + c.id + ' · ' + c.subject + ' — ' + ({ running: 'đang gửi…', done: 'xong', interrupted: 'bị gián đoạn' }[c.status] || c.status) + ' · gửi được ' + c.sent + '/' + c.total + (c.failed ? ' · lỗi ' + c.failed : '') + ' · ' + new Date(c.created_at).toLocaleString('vi-VN'))));
    drawC(ml.campaigns);
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Email'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, ml.configured ? 'Gửi từ: ' + ml.from + ' (đã cấu hình)' : '⚠️ Chưa cấu hình email gửi đi. Hãy thêm biến SMTP_USER và SMTP_PASS trên Hostinger.'),
        h('label', { class: 'check' }, chk, h('span', {}, 'Bắt buộc khách xác nhận email mới được đăng ký / đăng nhập (chỉ áp dụng cho người đăng ký mới)')),
        h('p', { class: 'muted', style: 'font-size:13px' }, 'Thành viên: ' + ml.counts.total + ' · đã xác nhận: ' + ml.counts.verified + ' · đã hủy nhận email quảng bá: ' + (ml.counts.optout || 0)),
        h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, testTo, h('button', { class: 'btn', type: 'button', onclick: async (ev) => { ev.target.disabled = true; testRes.textContent = 'Đang gửi…'; try { const r = await api('/admin/mail/test', { method: 'POST', body: { to: testTo.value } }); testRes.textContent = '✅ Đã gửi thư thử tới ' + r.to + '. Hãy kiểm tra hộp thư (cả Spam).'; } catch (e) { testRes.textContent = '❌ ' + e.message; } ev.target.disabled = false; } }, 'Gửi email thử')), testRes,
        h('hr', { style: 'border:0;border-top:1px solid var(--line);width:100%' }),
        h('b', {}, 'Gửi email quảng bá cho thành viên'), subj, body,
        h('div', { class: 'row', style: 'gap:10px;flex-wrap:wrap;align-items:center' }, h('label', { class: 'muted', style: 'font-size:14px' }, 'Tối đa '), lim, h('span', { class: 'muted', style: 'font-size:14px' }, 'người nhận'), h('label', { class: 'check' }, ver, h('span', {}, 'Chỉ người đã xác nhận email'))),
        h('p', { class: 'muted', style: 'font-size:13px' }, 'Mỗi email có liên kết "Hủy nhận email quảng bá". Gửi chậm khoảng 1,5 giây/email để tránh bị nhà cung cấp chặn. Hãy hỏi Hostinger giới hạn số email mỗi giờ của gói bạn.'),
        h('button', { class: 'btn primary', type: 'button', onclick: async (ev) => { if (!confirm('Gửi email này cho tối đa ' + lim.value + ' thành viên?')) return; ev.target.disabled = true; try { const r = await api('/admin/mail/campaign', { method: 'POST', body: { subject: subj.value, body: body.value, limit: lim.value, verifiedOnly: ver.checked } }); toast('Đang gửi cho ' + r.total + ' người…'); const poll = setInterval(async () => { try { const x = await api('/admin/mail'); drawC(x.campaigns); if (!x.campaigns.some((c) => c.status === 'running')) { clearInterval(poll); ev.target.disabled = false; toast('Đã gửi xong'); } } catch { clearInterval(poll); } }, 4000); S.cleanups.push(() => clearInterval(poll)); drawC((await api('/admin/mail')).campaigns); } catch (e) { fail(e); ev.target.disabled = false; } } }, 'Gửi email'), camp));
  })();
  // SEO text of every area (region / province / district)`);
rep('public/js/app.js', "trafficBox, videosBox, seoBox, membersBox, statBox,", "trafficBox, videosBox, seoBox, mailBox, membersBox, statBox,");
fs.appendFileSync('public/css/app.css', `
.linkbtn{background:none;border:0;color:#ff8ab4;text-decoration:underline;cursor:pointer;font:inherit;padding:0}
`);
console.log('patched');
