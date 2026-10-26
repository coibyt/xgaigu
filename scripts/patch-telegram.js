// One-off patch: admin sets a Telegram group link; a "Vào nhóm Telegram" button then shows in every video's "Xem thông tin".
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('server.js', [["app.get('/api/admin/videos', needAdmin,", `// ---------- site settings shown to everybody (Telegram group link) ----------
const getConf = (k) => { const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(k); return r ? r.value : ''; };
app.get('/api/site-config', (_req, res) => res.set('Cache-Control', 'no-cache').json({ telegram: getConf('telegram_url') }));
app.put('/api/admin/site-config', needAdmin, (req, res) => {
  let tg = clean(req.body.telegram, 300);
  if (tg && !/^https?:\\/\\//i.test(tg)) tg = 'https://' + tg;
  if (tg) {
    let host = ''; try { host = new URL(tg).hostname.toLowerCase(); } catch {}
    if (!/^(www\\.)?(t\\.me|telegram\\.me|telegram\\.dog)$/.test(host)) return fail(res, 400, 'Link nhóm Telegram phải có dạng https://t.me/...');
    tg = tg.replace(/^http:/i, 'https:');
  }
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('telegram_url', tg);
  res.json({ ok: true, telegram: tg });
});

app.get('/api/admin/videos', needAdmin,`]]);

edit('public/js/app.js', [
  // load the public site settings once at start-up
  ["  try { S.user = (await api('/me')).user; } catch {}", "  try { S.user = (await api('/me')).user; } catch {}\n  api('/site-config').then((c) => { S.conf = c || {}; }).catch(() => { S.conf = {}; });"],
  // the button in "Xem thông tin"
  ["    !rows.length && !i.boundaries && h('p', { class: 'muted' }, 'Người đăng chưa điền thêm thông tin.'),",
   "    !rows.length && !i.boundaries && h('p', { class: 'muted' }, 'Người đăng chưa điền thêm thông tin.'),\n    S.conf && S.conf.telegram && h('a', { class: 'btn tgbtn', href: S.conf.telegram, target: '_blank', rel: 'noopener', html: TG_ICON + '<span>Vào nhóm Telegram</span>' }),"],
  ["function openInfo(v) {", `const TG_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M21.4 3.6 2.9 10.8c-1.3.5-1.3 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.2-15c.3-1.3-.5-1.9-1.6-1.4zM8.7 13.4l9.6-6c.5-.3.9-.1.5.2l-8.2 7.4-.3 3.4-1.6-5z"/></svg>';

function openInfo(v) {`],
  // admin card
  ["  // video optimisation: shrink big videos so they load fast", `  // Telegram group link shown in every video's info sheet
  const tgBox = (() => {
    const inp = h('input', { type: 'url', placeholder: 'https://t.me/ten_nhom_cua_ban', value: (S.conf && S.conf.telegram) || '', style: 'flex:1;min-width:220px' });
    api('/site-config').then((c) => { inp.value = c.telegram || ''; }).catch(() => {});
    const save = async (val) => { try { const r = await api('/admin/site-config', { method: 'PUT', body: { telegram: val } }); S.conf = { ...(S.conf || {}), telegram: r.telegram }; inp.value = r.telegram; toast(r.telegram ? 'Đã lưu link nhóm Telegram' : 'Đã tắt nút Telegram'); } catch (e) { fail(e); } };
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Nhóm Telegram'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Dán link nhóm Telegram. Khi có link, nút "Vào nhóm Telegram" sẽ hiện trong mục "Xem thông tin" của mọi video. Xoá trống rồi bấm Lưu để ẩn nút.'),
        h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: () => save(inp.value.trim()) }, 'Lưu'), h('button', { class: 'btn', type: 'button', onclick: () => { inp.value = ''; save(''); } }, 'Ẩn nút'))));
  })();
  // video optimisation: shrink big videos so they load fast`],
  ["trafficBox, shareBox, statBox,", "trafficBox, shareBox, tgBox, statBox,"],
]);

fs.appendFileSync('public/css/app.css', `
/* Telegram group button in the info sheet */
.btn.tgbtn{display:flex;justify-content:center;width:100%;margin:14px 0 4px;background:linear-gradient(135deg,#2aabee,#229ed9);border-color:transparent;color:#fff;font-weight:800;box-shadow:0 8px 22px rgba(34,158,217,.45)}
.btn.tgbtn:hover{filter:brightness(1.08)}
`);
console.log('patched');
