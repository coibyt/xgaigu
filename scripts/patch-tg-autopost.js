// Telegram auto-posting: tables, hooks where a video becomes public, admin switch per account, account page card.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/db.js', [
  ["db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');", "db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');"],
  ["CREATE TABLE IF NOT EXISTS live_events (", `CREATE TABLE IF NOT EXISTS tg_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL, title TEXT DEFAULT '', type TEXT DEFAULT 'group', username TEXT DEFAULT '',
  active INTEGER DEFAULT 1, last_error TEXT DEFAULT '', last_post_at INTEGER DEFAULT 0, created_at INTEGER NOT NULL,
  UNIQUE (user_id, chat_id)
);
CREATE TABLE IF NOT EXISTS tg_codes (code TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tg_prefs (
  user_id INTEGER PRIMARY KEY, daily_limit INTEGER DEFAULT 10, mode TEXT DEFAULT 'instant', times TEXT DEFAULT '08:00,20:00',
  per_slot INTEGER DEFAULT 1, distribute TEXT DEFAULT 'same', last_slot TEXT DEFAULT '', split_cursor INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tg_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL, video_id INTEGER NOT NULL, target_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', error TEXT DEFAULT '', sent_day TEXT DEFAULT '', sent_at INTEGER DEFAULT 0, created_at INTEGER NOT NULL,
  UNIQUE (video_id, target_id)
);
CREATE INDEX IF NOT EXISTS idx_tg_queue_user ON tg_queue(user_id, status);
CREATE TABLE IF NOT EXISTS tg_daily (target_id INTEGER NOT NULL, day TEXT NOT NULL, sent INTEGER DEFAULT 0, PRIMARY KEY (target_id, day));
CREATE TABLE IF NOT EXISTS live_events (`],
  ["  ['live_ban_until', 'live_ban_until INTEGER DEFAULT 0'],", "  ['live_ban_until', 'live_ban_until INTEGER DEFAULT 0'],\n  ['telegram_allowed', 'telegram_allowed INTEGER DEFAULT 0'],"],
]);

edit('server.js', [
  ["app.use(auth);\n", "app.use(auth);\nlet telegram = null; // installed further down\napp.use((_req, _res, next) => { if (telegram) telegram.tick(); next(); });\n"],
  ["const shop = require('./src/shop').install(", "telegram = require('./src/telegram').install(app, { db, fail, clean, now, needUser, needAdmin, UPLOAD_DIR });\nconst shop = require('./src/shop').install("],
  ["  if (file) setTimeout(() => transcode.enqueue('/uploads/' + file.filename, newId), 1500); // shrink for fast loading, in the background\n  res.json({ ok: true, id: newId, hidden });",
   "  if (file) setTimeout(() => transcode.enqueue('/uploads/' + file.filename, newId), 1500); // shrink for fast loading, in the background\n  if (!hidden) telegram.announce(newId);\n  res.json({ ok: true, id: newId, hidden });"],
  ["    .run(status === 'visible' ? 0 : 1, status === 'banned' ? 1 : 0, status === 'visible' ? '' : 'admin', status === 'visible' ? '' : clean(req.body.note, 300), req.params.id);\n",
   "    .run(status === 'visible' ? 0 : 1, status === 'banned' ? 1 : 0, status === 'visible' ? '' : 'admin', status === 'visible' ? '' : clean(req.body.note, 300), req.params.id);\n  if (status === 'visible') telegram.announce(Number(req.params.id));\n"],
  ["  db.prepare(\"UPDATE videos SET hidden = ?, hidden_by = ? WHERE id = ?\").run(hide ? 1 : 0, hide ? 'owner' : '', v.id);\n",
   "  db.prepare(\"UPDATE videos SET hidden = ?, hidden_by = ? WHERE id = ?\").run(hide ? 1 : 0, hide ? 'owner' : '', v.id);\n  if (!hide) telegram.announce(v.id);\n"],
  ["`SELECT u.id, u.email, u.name, u.role, u.banned, u.verified, u.created_at,", "`SELECT u.id, u.email, u.name, u.role, u.banned, u.verified, u.telegram_allowed, u.created_at,\n       (SELECT COUNT(*) FROM tg_targets t WHERE t.user_id = u.id AND t.active = 1) AS tg_groups,"],
]);

edit('public/js/app.js', [
  // admin member list: Telegram switch per account
  ["      h('td', {}, u.banned ? h('span', { class: 'muted' }, 'Đã khoá')", `      h('td', { style: 'text-align:center;white-space:nowrap' }, u.role === 'admin' ? h('span', { class: 'muted', title: 'Quản trị viên luôn được dùng' }, '✓') : h('input', { type: 'checkbox', checked: !!u.telegram_allowed, title: 'Cho phép tài khoản này tự động gửi video lên nhóm Telegram',
        onchange: async (e) => { const on = e.target.checked; try { await api('/admin/users/' + u.id + '/telegram', { method: 'POST', body: { allowed: on } }); toast(on ? 'Đã cho phép ' + u.name + ' gửi lên Telegram' : 'Đã tắt gửi Telegram của ' + u.name); } catch (er) { e.target.checked = !on; fail(er); } } }),
        u.tg_groups ? h('small', { class: 'muted', style: 'margin-left:6px' }, u.tg_groups + ' nhóm') : ''),
      h('td', {}, u.banned ? h('span', { class: 'muted' }, 'Đã khoá')`],
  ["['ID', 'Email', 'Tên', 'Video', 'Theo dõi', 'Lượt thích', 'Ngày đăng ký', 'Đã xác minh', '']", "['ID', 'Email', 'Tên', 'Video', 'Theo dõi', 'Lượt thích', 'Ngày đăng ký', 'Đã xác minh', 'Gửi Telegram', '']"],
  ["    pager.replaceChildren(page > 0 && h('button', { class: 'btn sm', onclick: () => { page--; loadMembers(); } }, '← Trước'), (page + 1) * d.size < d.total && h('button', { class: 'btn sm', onclick: () => { page++; loadMembers(); } }, 'Sau →'));",
   "    pager.replaceChildren(page > 0 ? h('button', { class: 'btn sm', onclick: () => { page--; loadMembers(); } }, '← Trước') : '', (page + 1) * d.size < d.total ? h('button', { class: 'btn sm', onclick: () => { page++; loadMembers(); } }, 'Sau →') : '');"],
  // account page card, admin bot box
  ["    window.XGShop.accountCard(),\n", "    window.XGShop.accountCard(),\n    window.XGTele.accountCard(),\n"],
  ["statBox, await window.XGLive.adminBox(),", "statBox, window.XGTele.adminBox(), await window.XGLive.adminBox(),"],
]);

edit('public/index.html', [['<link rel="stylesheet" href="/css/live.css">', '<link rel="stylesheet" href="/css/live.css">\n<link rel="stylesheet" href="/css/telegram.css">'], ["<script src=\"/js/live.js\"></script>", "<script src=\"/js/live.js\"></script>\n<script src=\"/js/telegram.js\"></script>"]]);
console.log('patched');
