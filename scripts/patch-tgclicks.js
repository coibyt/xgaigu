// Click counts for each Telegram group link (today, 7 days, total) shown in the admin's "Nhóm Telegram" card.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/db.js', [["CREATE TABLE IF NOT EXISTS reports (", `CREATE TABLE IF NOT EXISTS tg_clicks (
  url TEXT NOT NULL,
  did TEXT NOT NULL,
  day TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tg_clicks ON tg_clicks(url, day);
CREATE TABLE IF NOT EXISTS reports (`]]);

edit('server.js', [["app.put('/api/admin/site-config', needAdmin, (req, res) => {", `// a visitor tapped "Vào nhóm Telegram": count it for that link (only links currently configured)
const tgLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });
app.post('/api/tg-click', tgLimiter, (req, res) => {
  const url = String(req.body.url || '');
  if (!telegramLinks().includes(url)) return res.json({ ok: true });
  const did = String(req.body.did || '').replace(/[^\\w-]/g, '').slice(0, 40) || 'anon';
  db.prepare('INSERT INTO tg_clicks (url, did, day, created_at) VALUES (?,?,?,?)').run(url, did, vnDay(), now());
  res.json({ ok: true });
});
app.get('/api/admin/tg-stats', needAdmin, (_req, res) => {
  const today = vnDay(), week = vnDay(now() - 6 * 86400_000);
  const q = (url, from) => db.prepare('SELECT COUNT(*) AS clicks, COUNT(DISTINCT did) AS people FROM tg_clicks WHERE url = ? AND day >= ?').get(url, from);
  const current = telegramLinks();
  const older = db.prepare('SELECT DISTINCT url FROM tg_clicks').all().map((r) => r.url).filter((u) => !current.includes(u));
  res.json({ today, links: [...current.map((u) => ({ url: u, active: true })), ...older.map((u) => ({ url: u, active: false }))].map((l) => ({ ...l, today: q(l.url, today), week: q(l.url, week), total: q(l.url, '0000') })) });
});
app.put('/api/admin/site-config', needAdmin, (req, res) => {`]]);

edit('public/js/app.js', [
  ["      return h('a', { class: 'btn tgbtn', href: link, target: '_blank', rel: 'noopener', html: TG_ICON + '<span>Vào nhóm Telegram</span>' }); }",
   "      return h('a', { class: 'btn tgbtn', href: link, target: '_blank', rel: 'noopener', onclick: () => trackTg(link), html: TG_ICON + '<span>Vào nhóm Telegram</span>' }); }"],
  ["function openInfo(v) {", `// count a tap on a Telegram group link (anonymous device id, same as the visitor statistics)
function trackTg(url) {
  let did = ''; try { did = localStorage.getItem('xg_did') || ''; } catch {}
  try { fetch('/api/tg-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, did }), keepalive: true }).catch(() => {}); } catch {}
}

function openInfo(v) {`],
  ["        h('div', { class: 'row', style: 'gap:8px' }, h('button', { class: 'btn primary', type: 'button', onclick: save }, 'Lưu'), h('button', { class: 'btn', type: 'button', onclick: () => { fill([]); save(); } }, 'Xoá hết'))));",
   `        h('div', { class: 'row', style: 'gap:8px' }, h('button', { class: 'btn primary', type: 'button', onclick: save }, 'Lưu'), h('button', { class: 'btn', type: 'button', onclick: () => { fill([]); save(); } }, 'Xoá hết')),
        statsWrap));`],
  ["  const tgBox = (() => {\n", `  const statsBody = h('tbody', {}), statsNote = h('p', { class: 'muted', style: 'font-size:13px' });
  const loadTgStats = async () => {
    try {
      const d = await api('/admin/tg-stats');
      const cell = (x) => h('td', { style: 'white-space:nowrap' }, h('b', {}, String(x.clicks)), h('span', { class: 'muted', style: 'font-size:12px' }, ' lượt · ' + x.people + ' người'));
      statsBody.replaceChildren(...(d.links.length ? d.links.map((l, i) => h('tr', {},
        h('td', { style: 'max-width:230px;word-break:break-all' }, (l.active ? 'Nhóm ' + (i + 1) + ': ' : '(link cũ) ') , h('a', { href: l.url, target: '_blank', rel: 'noopener', style: 'color:#7cc7ff' }, l.url.replace(/^https:\\/\\//, ''))),
        cell(l.today), cell(l.week), cell(l.total))) : [h('tr', {}, h('td', { colspan: 4, class: 'muted' }, 'Chưa có lượt bấm nào.'))]));
      statsNote.textContent = 'Hôm nay là ' + d.today.split('-').reverse().join('/') + ' (giờ Việt Nam). "Người" = số thiết bị khác nhau đã bấm.';
    } catch (e) { fail(e); }
  };
  const statsWrap = h('div', { style: 'margin-top:8px;display:grid;gap:8px' },
    h('div', { class: 'row', style: 'justify-content:space-between;align-items:center' }, h('b', {}, 'Lượt bấm vào từng nhóm'), h('button', { class: 'btn sm', type: 'button', onclick: loadTgStats }, 'Làm mới')),
    h('div', { style: 'overflow:auto' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['Link nhóm', 'Hôm nay', '7 ngày', 'Tổng'].map((x) => h('th', {}, x)))), statsBody)), statsNote);
  loadTgStats();
  const tgBox = (() => {
`],
]);
console.log('patched');
