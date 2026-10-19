// One-off patch: "Đã xác minh" badge. Only admins can set it; it shows prominently on every video.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---------- db ----------
rep('src/db.js', "  ['hidden_by', \"hidden_by TEXT DEFAULT ''\"],", "  ['hidden_by', \"hidden_by TEXT DEFAULT ''\"],\n  ['verified', 'verified INTEGER DEFAULT 0'],");

// ---------- server ----------
rep('server.js', "      selfHidden: r.hidden === 1, badge:", "      verified: !!r.verified, selfHidden: r.hidden === 1, badge:");
rep('server.js', "    info, views: r.views || 0, badge: r.badge || '', likes: r.likes,", "    info, views: r.views || 0, badge: r.badge || '', verified: !!r.verified, likes: r.likes,");
rep('server.js', "app.get('/api/admin/videos', needAdmin,", `// "Đã xác minh": only admins can grant or remove it (members have no endpoint that touches this column).
app.post('/api/admin/videos/:id(\\\\d+)/verified', needAdmin, (req, res) => {
  if (!db.prepare('SELECT 1 FROM videos WHERE id = ?').get(req.params.id)) return fail(res, 404, 'Không tìm thấy video');
  db.prepare('UPDATE videos SET verified = ? WHERE id = ?').run(req.body.verified ? 1 : 0, req.params.id);
  res.json({ ok: true, video: adminVideoRow(req.params.id) });
});
app.get('/api/admin/videos', needAdmin,`);

// ---------- client ----------
rep('public/js/app.js', "const vtag = (v) =>", `// "Đã xác minh" seal: bright blue pill with a white check, shown on every verified video
const SEAL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.6l2.5 1.8 3.1-.2 1.2 2.9 2.8 1.5-.4 3.1 1.6 2.6-1.6 2.7.4 3.1-2.8 1.5-1.2 2.9-3.1-.2L12 22.4l-2.5-1.8-3.1.2-1.2-2.9-2.8-1.5.4-3.1L1.2 12.7l1.6-2.7-.4-3.1 2.8-1.5 1.2-2.9 3.1.2z" fill="#fff"/><path d="M7.9 12.4l2.7 2.7 5.5-5.7" fill="none" stroke="#1d6bff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const vbadge = (small) => h('span', { class: 'vbadge' + (small ? ' sm' : ''), title: 'Video đã được quản trị viên xác minh', html: SEAL + '<b>Đã xác minh</b>' });
const vflags = (v, small) => (v.verified || v.badge ? h('span', { class: 'vflags' }, v.verified && vbadge(small), v.badge && vtag(v)) : null);
const vtag = (v) =>`);
rep('public/js/app.js', "      h('div', { class: 'meta' }, vtag(v),\n", "      h('div', { class: 'meta' }, vflags(v),\n");
rep('public/js/app.js', "    vtag(v),\n    h('span', { class: 'views', title: isAdmin()", "    vflags(v),\n    h('span', { class: 'views', title: isAdmin()");
rep('public/js/app.js', "      vtag(v), h('span', { class: 'tviews'", "      vflags(v, true), h('span', { class: 'tviews'");
rep('public/js/app.js', "  const body = h('div', {}, h('h3', {}, v.user.name), (v.caption ?", "  const body = h('div', {}, h('h3', {}, v.user.name), v.verified && h('div', { style: 'margin:2px 0 12px' }, vbadge()), (v.caption ?");
// admin dialog: tick box (admins only – this dialog's admin part is only reachable by admins and the endpoint checks the role)
rep('public/js/app.js', "  const geo = geoPicker();\n  const input = (name, label, val, attrs = {}) =>", `  const verChk = h('input', { type: 'checkbox', checked: !!v.verified });
  verChk.addEventListener('change', async () => { try { v = (await api('/admin/videos/' + v.id + '/verified', { method: 'POST', body: { verified: verChk.checked } })).video; toast(v.verified ? 'Đã gắn huy hiệu ĐÃ XÁC MINH' : 'Đã gỡ huy hiệu xác minh'); onChange && onChange(); } catch (e) { verChk.checked = !verChk.checked; fail(e); } });
  const geo = geoPicker();
  const input = (name, label, val, attrs = {}) =>`);
rep('public/js/app.js', "    own ? null : h('div', { class: 'row', style: 'margin-bottom:10px' }, badgeSel), note,", "    own ? null : h('label', { class: 'check verify-tick' }, verChk, h('span', {}, h('b', {}, 'Đã xác minh'), ' – hiện huy hiệu xác minh nổi bật trên video này (chỉ admin được chọn)')), own ? null : h('div', { class: 'row', style: 'margin-bottom:10px' }, badgeSel), note,");
rep('public/js/app.js', "      h('td', {}, '#' + x.id),", "      h('td', {}, '#' + x.id, x.verified && h('span', { title: 'Đã xác minh', style: 'color:#38bdf8;margin-left:4px' }, '✔')),");

fs.appendFileSync('public/css/app.css', `
/* "Đã xác minh" badge */
.vflags{display:inline-flex;flex-wrap:wrap;align-items:center;gap:6px}
.vbadge{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:7px;padding:4px 13px 4px 5px;border-radius:999px;color:#fff;font-size:12px;line-height:1;white-space:nowrap;
  background:linear-gradient(135deg,#19b6ff 0%,#2563ff 55%,#7c3aed 100%);box-shadow:0 0 0 1.5px rgba(255,255,255,.55) inset,0 6px 20px rgba(37,99,255,.6),0 0 22px rgba(25,182,255,.45)}
.vbadge svg{width:22px;height:22px;flex:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}
.vbadge b{font-weight:800;letter-spacing:.8px;text-transform:uppercase;text-shadow:0 1px 2px rgba(0,0,0,.35)}
.vbadge::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:vshine 3.4s ease-in-out infinite}
@keyframes vshine{0%,55%{left:-60%}100%{left:130%}}
.vbadge.sm{gap:4px;padding:3px 9px 3px 3px;font-size:9.5px}.vbadge.sm svg{width:16px;height:16px}
.vcard .vflags,.tcell .vflags{position:absolute;top:10px;left:10px;z-index:2;display:flex;flex-direction:column;align-items:flex-start;gap:5px}
.tcell .vflags{top:6px;left:6px}
.vflags .vtag{position:static}
.meta .vflags{margin-bottom:10px}
.verify-tick{padding:12px 14px;border:1px solid rgba(56,189,248,.5);background:rgba(37,99,255,.12);border-radius:12px;margin-bottom:12px}
@media (prefers-reduced-motion:reduce){.vbadge::after{animation:none;display:none}}
`);
console.log('patched');
