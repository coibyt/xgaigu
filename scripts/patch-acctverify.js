// Account-level "Đã xác minh": the admin verifies a member once and every video of that member (also future ones) carries the badge.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/db.js', [["  ['marketing_optout', 'marketing_optout INTEGER DEFAULT 0'],", "  ['marketing_optout', 'marketing_optout INTEGER DEFAULT 0'],\n  ['verified', 'verified INTEGER DEFAULT 0'],"]]);

edit('server.js', [
  ["    role: u.role, createdAt: u.created_at,", "    role: u.role, verified: !!u.verified, createdAt: u.created_at,"],
  ["       u.show_phone AS u_sp, u.phone AS u_phone,", "       u.show_phone AS u_sp, u.phone AS u_phone, u.verified AS u_verified,"],
  ["verified: !!r.verified, selfHidden:", "verified: !!(r.verified || r.u_verified), accountVerified: !!r.u_verified, selfHidden:"],
  ["    `SELECT v.*, u.email AS u_email, u.name AS u_name,", "    `SELECT v.*, u.email AS u_email, u.name AS u_name, u.verified AS u_verified,"],
  ["badge: r.badge || '', verified: !!r.verified, likes: r.likes,", "badge: r.badge || '', verified: !!r.verified, accountVerified: !!r.u_verified, likes: r.likes,"],
  ["    `SELECT u.id, u.email, u.name, u.role, u.banned, u.created_at,", "    `SELECT u.id, u.email, u.name, u.role, u.banned, u.verified, u.created_at,"],
  ["app.get('/api/admin/videos', needAdmin,", `// Verify a whole account: all its videos (past and future) show "Đã xác minh". Only admins can do this.
app.post('/api/admin/users/:id(\\\\d+)/verified', needAdmin, (req, res) => {
  if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(req.params.id)) return fail(res, 404, 'Không tìm thấy thành viên');
  db.prepare('UPDATE users SET verified = ? WHERE id = ?').run(req.body.verified ? 1 : 0, req.params.id);
  res.json({ ok: true, verified: !!req.body.verified, videos: db.prepare('SELECT COUNT(*) AS n FROM videos WHERE user_id = ? AND hidden = 0').get(req.params.id).n });
});
app.get('/api/admin/videos', needAdmin,`],
]);

edit('public/js/app.js', [
  ["    h('h2', { class: 'tk-name' }, user.name + (user.age ? ', ' + user.age : '')),", "    h('h2', { class: 'tk-name' }, user.name + (user.age ? ', ' + user.age : '')),\n    user.verified && vbadge(),"],
  ["h('td', {}, new Date(u.created_at).toLocaleDateString('vi-VN')),",
   `h('td', {}, new Date(u.created_at).toLocaleDateString('vi-VN')),
      h('td', { style: 'text-align:center' }, h('input', { type: 'checkbox', checked: !!u.verified, title: 'Xác minh tài khoản: mọi video của thành viên này sẽ có huy hiệu Đã xác minh',
        onchange: async (e) => { const on = e.target.checked; try { const r = await api('/admin/users/' + u.id + '/verified', { method: 'POST', body: { verified: on } }); toast(on ? 'Đã xác minh tài khoản, ' + r.videos + ' video có huy hiệu' : 'Đã gỡ xác minh tài khoản'); } catch (er) { e.target.checked = !on; fail(er); } } })),`],
  ["'Ngày đăng ký', ''].map", "'Ngày đăng ký', 'Đã xác minh', ''].map"],
  ["' – hiện huy hiệu xác minh nổi bật trên video này (chỉ admin được chọn)')", "' – hiện huy hiệu xác minh nổi bật trên video này (chỉ admin được chọn)' + (v.accountVerified ? '. Lưu ý: tài khoản chủ video đã được xác minh nên mọi video của họ đều có huy hiệu.' : ''))"],
]);
console.log('patched');
