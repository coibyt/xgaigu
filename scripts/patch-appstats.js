// One-off patch: app download statistics (db table, API, client reporting, admin panel).
const fs = require('fs');
const rep = (file, from, to) => {
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 50));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---- db ----
rep('src/db.js', 'CREATE TABLE IF NOT EXISTS reports (', `CREATE TABLE IF NOT EXISTS app_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  did TEXT NOT NULL,
  kind TEXT NOT NULL,
  device TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_events_kind ON app_events(kind, created_at);
CREATE TABLE IF NOT EXISTS reports (`);

// ---- server ----
rep('server.js', "app.get('/api/admin/reports', needAdmin,", `// ---------- app (PWA) statistics ----------
// click = pressed "Tải ứng dụng", install = browser confirmed installation, open = app launched from the home screen
app.post('/api/app-event', postLimiter, (req, res) => {
  const kind = ['click', 'install', 'open'].includes(req.body.kind) ? req.body.kind : null;
  const did = String(req.body.did || '').replace(/[^\\w-]/g, '').slice(0, 40);
  if (!kind || did.length < 8) return fail(res, 400, 'Sai dữ liệu');
  const ua = String(req.get('user-agent') || '');
  const device = /iphone|ipad|ipod/i.test(ua) ? 'ios' : /android/i.test(ua) ? 'android' : /windows|macintosh|linux|cros/i.test(ua) ? 'desktop' : 'other';
  const recent = now() - (kind === 'open' ? 6 : kind === 'click' ? 1 : 24 * 365) * 3600_000; // install once per device; open once per 6h; click once per hour
  if (db.prepare('SELECT 1 FROM app_events WHERE did = ? AND kind = ? AND created_at > ?').get(did, kind, recent)) return res.json({ ok: true });
  db.prepare('INSERT INTO app_events (did, kind, device, created_at) VALUES (?,?,?,?)').run(did, kind, device, now());
  res.json({ ok: true });
});
app.get('/api/admin/app-stats', needAdmin, (_req, res) => {
  const DAY = 86400_000, t = now();
  const count = (kind, since, distinct) => db.prepare(\`SELECT COUNT(\${distinct ? 'DISTINCT did' : '*'}) AS n FROM app_events WHERE kind = ? AND created_at > ?\`).get(kind, since).n;
  const block = (kind) => ({ total: count(kind, 0), today: count(kind, t - DAY), week: count(kind, t - 7 * DAY), month: count(kind, t - 30 * DAY), devices: count(kind, 0, true) });
  const byDevice = db.prepare("SELECT device, kind, COUNT(DISTINCT did) AS n FROM app_events GROUP BY device, kind").all();
  const daily = db.prepare(
    \`SELECT date(created_at / 1000, 'unixepoch', '+7 hours') AS day, kind, COUNT(*) AS n FROM app_events
     WHERE created_at > ? GROUP BY day, kind ORDER BY day DESC\`).all(t - 14 * DAY);
  res.json({ click: block('click'), install: block('install'), open: block('open'), byDevice, daily });
});
app.get('/api/admin/reports', needAdmin,`);

// ---- client reporting ----
rep('public/js/app.js', "  const steps = (items) =>", `  // anonymous per-device id, only used to count installs and launches without double counting
  const did = (() => { try { let d = localStorage.getItem('xg_did'); if (!d) { d = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^\\w-]/g, ''); localStorage.setItem('xg_did', d); } return d; } catch { return 'nostorage-' + Math.random().toString(36).slice(2); } })();
  const report = (kind) => { try { fetch('/api/app-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, did }), keepalive: true }).catch(() => {}); } catch {} };
  if (running()) { try { if (!sessionStorage.getItem('xg_open_sent')) { sessionStorage.setItem('xg_open_sent', '1'); report('open'); } } catch { report('open'); } }
  const steps = (items) =>`);
rep('public/js/app.js', "  async function run() {\n    if (evt) { const e = evt; evt = null; e.prompt(); await e.userChoice.catch(() => {}); refresh(); return; }",
  "  async function run() {\n    report('click');\n    if (evt) { const e = evt; evt = null; e.prompt(); const c = await e.userChoice.catch(() => null); if (c && c.outcome === 'accepted') report('install'); refresh(); return; }");
rep('public/js/app.js', "window.addEventListener('appinstalled', () => { evt = null; known = true; lsSet(); refresh();", "window.addEventListener('appinstalled', () => { evt = null; known = true; lsSet(); refresh(); report('install');");

// ---- admin panel ----
rep('public/js/app.js', "  const { reports } = await api('/admin/reports');", `  const [{ reports }, st] = await Promise.all([api('/admin/reports'), api('/admin/app-stats')]);
  const kv = (label, b, note) => h('div', { class: 'card', style: 'padding:16px;flex:1;min-width:210px' }, h('div', { class: 'muted', style: 'font-size:13px' }, label),
    h('div', { style: 'font-size:32px;font-weight:800;margin:4px 0' }, String(b.total)),
    h('div', { class: 'muted', style: 'font-size:13px;line-height:1.6' }, 'Hôm nay: ' + b.today + ' · 7 ngày: ' + b.week + ' · 30 ngày: ' + b.month, h('br'), 'Số thiết bị khác nhau: ' + b.devices), note && h('div', { class: 'muted', style: 'font-size:12px;margin-top:6px' }, note));
  const dev = (k, d) => (st.byDevice.find((x) => x.kind === k && x.device === d) || {}).n || 0;
  const devRows = [['android', 'Android'], ['ios', 'iPhone/iPad'], ['desktop', 'Máy tính'], ['other', 'Khác']].map(([d, n]) => h('tr', {}, h('td', {}, n), h('td', {}, String(dev('click', d))), h('td', {}, String(dev('install', d))), h('td', {}, String(dev('open', d)))));
  const days = [...new Set(st.daily.map((x) => x.day))];
  const dayVal = (day, k) => (st.daily.find((x) => x.day === day && x.kind === k) || {}).n || 0;
  const statBox = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:16px' }, 'Thống kê ứng dụng'),
    h('div', { class: 'row', style: 'gap:14px;flex-wrap:wrap;margin-bottom:16px' },
      kv('Lượt bấm “Tải ứng dụng”', st.click), kv('Đã cài về máy', st.install, 'Android/Chrome/Edge: trình duyệt xác nhận cài xong.'), kv('Lượt mở ứng dụng', st.open, 'Mở từ biểu tượng trên màn hình. iPhone không báo “đã cài”, nên xem số này.')),
    h('div', { class: 'card', style: 'overflow:auto;margin-bottom:16px' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['Thiết bị', 'Bấm tải', 'Đã cài', 'Đang dùng app'].map((x) => h('th', {}, x)))), h('tbody', {}, devRows))),
    days.length ? h('div', { class: 'card', style: 'overflow:auto' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['Ngày (14 ngày gần nhất)', 'Bấm tải', 'Đã cài', 'Mở app'].map((x) => h('th', {}, x)))),
      h('tbody', {}, days.map((d) => h('tr', {}, h('td', {}, d), h('td', {}, String(dayVal(d, 'click'))), h('td', {}, String(dayVal(d, 'install'))), h('td', {}, String(dayVal(d, 'open')))))))) : null);`);
rep('public/js/app.js', "main.append(h('div', { class: 'wrap', style: 'padding:32px 0' }, h('h2', { class: 'title', style: 'margin-bottom:20px' }, 'Báo cáo chờ xử lý'),", "main.append(h('div', { class: 'wrap', style: 'padding:32px 0' }, statBox, h('h2', { class: 'title', style: 'margin-bottom:20px' }, 'Báo cáo chờ xử lý'),");
console.log('patched');
