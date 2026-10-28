// Admin sets a link to another website; a prominent "Xem Video Hẹn Hò" button then shows in every video's "Xem thông tin".
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('server.js', [
  ["app.get('/api/site-config', (_req, res) => { const t = telegramLinks(); res.set('Cache-Control', 'no-cache').json({ telegrams: t, telegram: t[0] || '' }); });",
   `app.get('/api/site-config', (_req, res) => { const t = telegramLinks(); res.set('Cache-Control', 'no-cache').json({ telegrams: t, telegram: t[0] || '', partner: getConf('partner_url') }); });
// link to another website shown as "Xem Video Hẹn Hò" in the info sheet
app.put('/api/admin/partner', needAdmin, (req, res) => {
  let u = clean(req.body.url, 500);
  if (u && !/^https?:\\/\\//i.test(u)) u = 'https://' + u;
  if (u) { try { const x = new URL(u); if (!/^https?:$/.test(x.protocol) || !x.hostname.includes('.')) throw 0; } catch { return fail(res, 400, 'Link website không hợp lệ'); } }
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('partner_url', u);
  res.json({ ok: true, url: u });
});`],
]);

edit('public/js/app.js', [
  ["    h('div', { class: 'row', style: 'margin-top:14px' },\n      S.user && S.user.role === 'admin' && h('button', { class: 'btn sm', type: 'button', onclick: () => adminVideoDialog(v.id)",
   "    S.conf && S.conf.partner && h('a', { class: 'btn partnerbtn', href: S.conf.partner, target: '_blank', rel: 'noopener', html: '<span aria-hidden=\"true\">🎬</span><span>Xem Video Hẹn Hò</span>' }),\n    h('div', { class: 'row', style: 'margin-top:14px' },\n      S.user && S.user.role === 'admin' && h('button', { class: 'btn sm', type: 'button', onclick: () => adminVideoDialog(v.id)"],
  ["  // up to 5 Telegram group links; the info sheet shows one of them at random", `  // link to another website ("Xem Video Hẹn Hò" button in every info sheet)
  const partnerBox = (() => {
    const inp = h('input', { type: 'url', placeholder: 'https://ten-website-khac.com', style: 'flex:1;min-width:220px' });
    api('/site-config').then((c) => { inp.value = c.partner || ''; }).catch(() => {});
    const save = async (val) => { try { const r = await api('/admin/partner', { method: 'PUT', body: { url: val } }); S.conf = { ...(S.conf || {}), partner: r.url }; inp.value = r.url; toast(r.url ? 'Đã lưu, nút "Xem Video Hẹn Hò" đã hiện' : 'Đã ẩn nút "Xem Video Hẹn Hò"'); } catch (e) { fail(e); } };
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Nút "Xem Video Hẹn Hò"'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Dán đường link của một website khác. Khi có link, nút nổi bật "Xem Video Hẹn Hò" sẽ hiện trong mục "Xem thông tin" của mọi video; khách bấm vào sẽ mở website đó ở tab mới. Để trống rồi Lưu (hoặc bấm Ẩn nút) để ẩn.'),
        h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: () => save(inp.value.trim()) }, 'Lưu'), h('button', { class: 'btn', type: 'button', onclick: () => { inp.value = ''; save(''); } }, 'Ẩn nút'))));
  })();
  // up to 5 Telegram group links; the info sheet shows one of them at random`],
  ["trafficBox, shareBox, feedBox, tgBox, statBox,", "trafficBox, shareBox, feedBox, tgBox, partnerBox, statBox,"],
]);

fs.appendFileSync('public/css/app.css', `
/* "Xem Video Hẹn Hò" button (link to another website) */
.btn.partnerbtn{display:flex;justify-content:center;gap:10px;width:100%;margin:10px 0 4px;min-height:52px;font-size:17px;font-weight:800;color:#fff;border-color:transparent;
  background:linear-gradient(135deg,#ff2e7e,#ff6b4a 55%,#ffb33a);box-shadow:0 10px 28px rgba(255,46,126,.5);animation:partnerglow 2.2s ease-in-out infinite}
.btn.partnerbtn:hover{filter:brightness(1.08)}
@keyframes partnerglow{50%{box-shadow:0 10px 36px rgba(255,107,74,.85);transform:scale(1.02)}}
@media (prefers-reduced-motion:reduce){.btn.partnerbtn{animation:none}}
`);
console.log('patched');
