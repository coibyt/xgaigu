// Up to 5 Telegram group links; the info sheet shows one of them at random each time it opens.
const fs = require('fs');
function between(file, startMarker, endMarker, replacement) {
  const s = fs.readFileSync(file, 'utf8');
  const a = s.indexOf(startMarker), b = s.indexOf(endMarker, a + 1);
  if (a < 0 || b < 0) throw new Error('markers not found in ' + file + ': ' + startMarker.slice(0, 50));
  fs.writeFileSync(file, s.slice(0, a) + replacement + s.slice(b));
}
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

between('server.js', '// ---------- site settings shown to everybody (Telegram group link) ----------', "app.get('/api/admin/videos', needAdmin,", `// ---------- site settings shown to everybody (up to 5 Telegram group links) ----------
const getConf = (k) => { const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(k); return r ? r.value : ''; };
const telegramLinks = () => {
  let list = []; try { list = JSON.parse(getConf('telegram_urls') || '[]'); } catch {}
  if (!list.length && getConf('telegram_url')) list = [getConf('telegram_url')]; // the single link saved by the earlier version
  return list.filter(Boolean).slice(0, 5);
};
app.get('/api/site-config', (_req, res) => { const t = telegramLinks(); res.set('Cache-Control', 'no-cache').json({ telegrams: t, telegram: t[0] || '' }); });
app.put('/api/admin/site-config', needAdmin, (req, res) => {
  const raw = Array.isArray(req.body.telegrams) ? req.body.telegrams : [req.body.telegram];
  const out = [];
  for (let [i, v] of raw.slice(0, 5).entries()) {
    v = clean(v, 300);
    if (!v) continue;
    if (!/^https?:\\/\\//i.test(v)) v = 'https://' + v;
    let host = ''; try { host = new URL(v).hostname.toLowerCase(); } catch {}
    if (!/^(www\\.)?(t\\.me|telegram\\.me|telegram\\.dog)$/.test(host)) return fail(res, 400, 'Ô số ' + (i + 1) + ': link nhóm Telegram phải có dạng https://t.me/...');
    out.push(v.replace(/^http:/i, 'https:'));
  }
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('telegram_urls', JSON.stringify(out));
  db.prepare('DELETE FROM settings WHERE key = ?').run('telegram_url');
  res.json({ ok: true, telegrams: out });
});

`);

edit('public/js/app.js', [
  ["    S.conf && S.conf.telegram && h('a', { class: 'btn tgbtn', href: S.conf.telegram, target: '_blank', rel: 'noopener', html: TG_ICON + '<span>Vào nhóm Telegram</span>' }),",
   "    (() => { const list = (S.conf && S.conf.telegrams) || []; if (!list.length) return null; const link = list[Math.floor(Math.random() * list.length)]; // a different group at random each time\n      return h('a', { class: 'btn tgbtn', href: link, target: '_blank', rel: 'noopener', html: TG_ICON + '<span>Vào nhóm Telegram</span>' }); })(),"],
]);

between('public/js/app.js', "  // Telegram group link shown in every video's info sheet", '  // video optimisation: shrink big videos so they load fast', `  // up to 5 Telegram group links; the info sheet shows one of them at random
  const tgBox = (() => {
    const inputs = [1, 2, 3, 4, 5].map((n) => h('input', { type: 'url', placeholder: 'Nhóm ' + n + ': https://t.me/ten_nhom', style: 'width:100%' }));
    const fill = (list) => inputs.forEach((inp, i) => { inp.value = list[i] || ''; });
    api('/site-config').then((c) => fill(c.telegrams || [])).catch(() => {});
    const save = async () => {
      try {
        const r = await api('/admin/site-config', { method: 'PUT', body: { telegrams: inputs.map((x) => x.value.trim()) } });
        S.conf = { ...(S.conf || {}), telegrams: r.telegrams, telegram: r.telegrams[0] || '' }; fill(r.telegrams);
        toast(r.telegrams.length ? 'Đã lưu ' + r.telegrams.length + ' nhóm Telegram' : 'Đã ẩn nút Telegram');
      } catch (e) { fail(e); }
    };
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Nhóm Telegram'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:10px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Điền tối đa 5 link nhóm Telegram. Mỗi lần khách mở "Xem thông tin", nút "Vào nhóm Telegram" sẽ dẫn tới một trong các nhóm này, chọn ngẫu nhiên, để chia đều khách giữa các nhóm. Để trống ô nào thì bỏ qua ô đó; để trống hết rồi Lưu thì nút bị ẩn.'),
        ...inputs,
        h('div', { class: 'row', style: 'gap:8px' }, h('button', { class: 'btn primary', type: 'button', onclick: save }, 'Lưu'), h('button', { class: 'btn', type: 'button', onclick: () => { fill([]); save(); } }, 'Xoá hết'))));
  })();
`);
console.log('patched');
