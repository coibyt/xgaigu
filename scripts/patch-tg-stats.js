// Telegram statistics for members: posts sent / failed per day and per group, and the views each group brings
// (the link in every post carries the group, so a visit from it is counted for that group, once per person per video per day).
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/db.js', [[
  'CREATE TABLE IF NOT EXISTS tg_ar_seen (chat_id TEXT NOT NULL, user_id TEXT NOT NULL, kind TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (chat_id, user_id, kind));',
  `CREATE TABLE IF NOT EXISTS tg_ar_seen (chat_id TEXT NOT NULL, user_id TEXT NOT NULL, kind TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (chat_id, user_id, kind));
CREATE TABLE IF NOT EXISTS tg_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, target_id INTEGER NOT NULL, video_id INTEGER NOT NULL,
  day TEXT NOT NULL, ok INTEGER NOT NULL, error TEXT DEFAULT '', at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tg_log_user ON tg_log(user_id, day);
CREATE TABLE IF NOT EXISTS tg_views (
  target_id INTEGER NOT NULL, video_id INTEGER NOT NULL, day TEXT NOT NULL, did TEXT NOT NULL, at INTEGER NOT NULL,
  PRIMARY KEY (target_id, video_id, day, did)
);
CREATE INDEX IF NOT EXISTS idx_tg_views_day ON tg_views(day, target_id);`]]);

edit('src/telegram.js', [
  // the link names the group it was posted in
  ["    const url = base() + '/v/' + v.id;\n    const tail =", "    const url = base() + '/v/' + v.id + (target.id ? '?tg=' + target.id : '');\n    const tail ="],
  // every result is logged; a failure only once per group, video and day (failed sends are retried every minute)
  ["      await postVideo(t, v, owner);\n      db.prepare(\"UPDATE tg_queue SET status = 'sent'",
   "      await postVideo(t, v, owner);\n      db.prepare('INSERT INTO tg_log (user_id, target_id, video_id, day, ok, at) VALUES (?,?,?,?,1,?)').run(row.user_id, t.id, v.id, nowParts().day, now());\n      db.prepare(\"UPDATE tg_queue SET status = 'sent'"],
  ["      const gone = e.code === 403 || /chat not found|kicked|not a member/i.test(e.message); // bot removed, blocked, or the group is gone\n",
   "      const gone = e.code === 403 || /chat not found|kicked|not a member/i.test(e.message); // bot removed, blocked, or the group is gone\n" +
   "      const d = nowParts().day;\n" +
   "      if (!db.prepare('SELECT 1 FROM tg_log WHERE target_id = ? AND video_id = ? AND day = ? AND ok = 0').get(t.id, v.id, d))\n" +
   "        db.prepare('INSERT INTO tg_log (user_id, target_id, video_id, day, ok, error, at) VALUES (?,?,?,?,0,?,?)').run(row.user_id, t.id, v.id, d, e.message.slice(0, 250), now());\n"],
  ["        db.prepare('DELETE FROM tg_daily WHERE day < ?').run(nowParts(Date.now() - 30 * 86400_000).day);",
   "        db.prepare('DELETE FROM tg_daily WHERE day < ?').run(nowParts(Date.now() - 30 * 86400_000).day);\n" +
   "        db.prepare('DELETE FROM tg_log WHERE day < ?').run(nowParts(Date.now() - 95 * 86400_000).day);\n" +
   "        db.prepare('DELETE FROM tg_views WHERE day < ?').run(nowParts(Date.now() - 95 * 86400_000).day);"],
  ["  app.get('/api/me/telegram', needUser, (req, res) => {", `  // a visit that came from a Telegram post: counted for that group (link-preview robots are not people)
  const BOT_UA = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|zalo|slurp|curl|wget|python|headless/i;
  app.get('/v/:id(\\\\d+)', (req, res, next) => {
    const tid = Number(req.query.tg);
    if (tid > 0 && !BOT_UA.test(req.get('user-agent') || '')) {
      try {
        const vid = Number(req.params.id);
        if (db.prepare('SELECT 1 FROM tg_targets t JOIN videos v ON v.user_id = t.user_id WHERE t.id = ? AND v.id = ?').get(tid, vid)) {
          const did = crypto.createHash('sha1').update((req.ip || '') + '|' + (req.get('user-agent') || '')).digest('hex').slice(0, 16);
          db.prepare('INSERT INTO tg_views (target_id, video_id, day, did, at) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING').run(tid, vid, nowParts().day, did, now());
        }
      } catch (e) { console.error('[telegram] view:', e.message); }
    }
    next();
  });

  // the member's numbers: sent, failed and views, per day and per group, for today / yesterday / the last 7 or 30 days
  app.get('/api/me/telegram/stats', needUser, (req, res) => {
    const uid = req.user.id, range = ['today', 'yesterday', '7', '30'].includes(req.query.range) ? req.query.range : 'today';
    const dayAgo = (n) => nowParts(Date.now() - n * 86400_000).day;
    const from = range === 'today' ? dayAgo(0) : range === 'yesterday' ? dayAgo(1) : dayAgo(Number(range) - 1);
    const to = range === 'yesterday' ? dayAgo(1) : dayAgo(0);
    const targets = db.prepare('SELECT id, title, type, username FROM tg_targets WHERE user_id = ? ORDER BY id').all(uid);
    const sent = db.prepare('SELECT target_id AS t, day, COUNT(*) AS n FROM tg_log WHERE user_id = ? AND ok = 1 AND day BETWEEN ? AND ? GROUP BY target_id, day').all(uid, from, to);
    const failed = db.prepare(\`SELECT l.target_id AS t, l.day, COUNT(*) AS n FROM tg_log l WHERE l.user_id = ? AND l.ok = 0 AND l.day BETWEEN ? AND ?
      AND NOT EXISTS (SELECT 1 FROM tg_log s WHERE s.ok = 1 AND s.target_id = l.target_id AND s.video_id = l.video_id AND s.day >= l.day) GROUP BY l.target_id, l.day\`).all(uid, from, to);
    const views = db.prepare(\`SELECT w.target_id AS t, w.day, COUNT(*) AS n FROM tg_views w JOIN tg_targets g ON g.id = w.target_id
      WHERE g.user_id = ? AND w.day BETWEEN ? AND ? GROUP BY w.target_id, w.day\`).all(uid, from, to);
    const days = new Map(), groups = new Map(targets.map((t) => [t.id, { ...t, sent: 0, failed: 0, views: 0 }]));
    const add = (rows, k) => rows.forEach((r) => {
      if (!days.has(r.day)) days.set(r.day, { day: r.day, sent: 0, failed: 0, views: 0 });
      days.get(r.day)[k] += r.n;
      if (groups.has(r.t)) groups.get(r.t)[k] += r.n;
    });
    add(sent, 'sent'); add(failed, 'failed'); add(views, 'views');
    const list = []; // every day of the range, newest first, also the empty ones
    const count = range === '7' ? 7 : range === '30' ? 30 : 1, skip = range === 'yesterday' ? 1 : 0;
    for (let i = 0; i < count; i++) { const d = dayAgo(skip + i); list.push(days.get(d) || { day: d, sent: 0, failed: 0, views: 0 }); }
    const total = list.reduce((a, x) => ({ sent: a.sent + x.sent, failed: a.failed + x.failed, views: a.views + x.views }), { sent: 0, failed: 0, views: 0 });
    const errors = db.prepare(\`SELECT l.error, l.at, l.video_id AS videoId, g.title AS target FROM tg_log l JOIN tg_targets g ON g.id = l.target_id
      WHERE l.user_id = ? AND l.ok = 0 AND l.day BETWEEN ? AND ? ORDER BY l.at DESC LIMIT 5\`).all(uid, from, to);
    res.json({ range, from, to, total, days: list, groups: [...groups.values()].sort((a, b) => b.views - a.views || b.sent - a.sent), errors });
  });

  app.get('/api/me/telegram', needUser, (req, res) => {`],
]);

edit('public/js/telegram.js', [
  ["    card.replaceChildren(head, groupsBlock(d), prefsBlock(d), queueBlock(d));", "    card.replaceChildren(head, statsBlock(), groupsBlock(d), prefsBlock(d), queueBlock(d));"],
  ["  // --- groups ---\n", `  // --- statistics ---
  let range = 'today';
  function statsBlock() {
    const RANGES = [['today', 'Hôm nay'], ['yesterday', 'Hôm qua'], ['7', '7 ngày'], ['30', '30 ngày']];
    const body = h('div', { class: 'tg-stats-body' }, h('div', { class: 'spin' }));
    const tabs = h('div', { class: 'tg-ranges' });
    const fmtDay = (d) => d.slice(8, 10) + '/' + d.slice(5, 7);
    const paint = async () => {
      tabs.replaceChildren(...RANGES.map(([k, label]) => h('button', { type: 'button', class: 'chip' + (range === k ? ' on' : ''), onclick: () => { range = k; paint(); } }, label)));
      let s; try { s = await api('/me/telegram/stats?range=' + range); } catch (e) { body.replaceChildren(h('p', { class: 'muted' }, e.message)); return; }
      const tile = (cls, ico, label, n) => h('div', { class: 'tg-tile ' + cls }, h('span', { class: 'tg-tico' }, ico), h('b', {}, n.toLocaleString('vi-VN')), h('small', {}, label));
      const tiles = h('div', { class: 'tg-tiles' }, tile('ok', '✓', 'Đăng thành công', s.total.sent), tile('bad', '✕', 'Bị lỗi', s.total.failed), tile('view', '👁', 'Lượt xem từ Telegram', s.total.views));
      const num = (n, cls) => h('span', { class: 'tg-n ' + (n ? cls : 'zero') }, String(n));
      const head = (first) => h('div', { class: 'tg-trow tg-thead' }, h('span', {}, first), h('span', {}, 'Thành công'), h('span', {}, 'Lỗi'), h('span', {}, 'Lượt xem'));
      const groupsTbl = s.groups.length ? h('div', { class: 'tg-table' }, head('Nhóm / kênh'), s.groups.map((g) => h('div', { class: 'tg-trow' },
        h('span', { class: 'tg-tname' }, (g.type === 'channel' ? '📢 ' : '👥 ') + g.title), num(g.sent, 'ok'), num(g.failed, 'bad'), num(g.views, 'view')))) : '';
      const maxV = Math.max(1, ...s.days.map((d) => d.views));
      const daysTbl = s.days.length > 1 ? h('details', { class: 'tg-recent', open: range === '7' }, h('summary', {}, 'Theo từng ngày'),
        h('div', { class: 'tg-table' }, head('Ngày'), s.days.map((d) => h('div', { class: 'tg-trow' },
          h('span', { class: 'tg-tname' }, fmtDay(d.day)), num(d.sent, 'ok'), num(d.failed, 'bad'),
          h('span', { class: 'tg-vbar' }, h('i', { style: 'width:' + Math.round(d.views / maxV * 100) + '%' }), num(d.views, 'view')))))) : '';
      const errs = s.errors.length ? h('details', { class: 'tg-recent' }, h('summary', {}, 'Lỗi gần đây'), h('div', { class: 'tg-list' }, s.errors.map((e) =>
        h('div', { class: 'tg-item' }, h('span', { class: 'tg-pill bad' }, '✕'), h('div', {}, h('a', { href: '/v/' + e.videoId, target: '_blank' }, 'Video #' + e.videoId), h('small', { class: 'muted' }, '→ ' + e.target + ' · ' + new Date(e.at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })), h('small', { class: 'tg-err' }, e.error)))))) : '';
      body.replaceChildren(tiles, groupsTbl, daysTbl, errs);
    };
    paint();
    return h('div', { class: 'tg-block tg-stats' }, h('div', { class: 'tg-btitle' }, h('h4', {}, '📊 Thống kê'), tabs),
      h('p', { class: 'muted tg-note' }, 'Lượt xem = số người bấm vào link video trong nhóm/kênh đó (mỗi người tính 1 lần cho mỗi video mỗi ngày).'), body);
  }
  // --- groups ---
`],
]);

fs.appendFileSync('public/css/telegram.css', `
/* statistics */
.tg-stats .tg-btitle{flex-wrap:wrap;gap:10px}
.tg-ranges{display:flex;gap:6px;flex-wrap:wrap}
.tg-ranges .chip{padding:6px 12px;font-size:13px}
.tg-note{font-size:12.5px;margin:6px 0 12px}
.tg-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.tg-tile{border-radius:16px;padding:14px 12px;display:grid;gap:2px;border:1px solid var(--line,rgba(255,255,255,.08));background:var(--surface-2,rgba(255,255,255,.03))}
.tg-tile b{font-size:26px;line-height:1.1}
.tg-tile small{color:var(--muted);font-size:12px;line-height:1.3}
.tg-tico{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:700;margin-bottom:4px}
.tg-tile.ok .tg-tico{background:rgba(34,197,94,.16);color:#4ade80}
.tg-tile.bad .tg-tico{background:rgba(239,68,68,.16);color:#f87171}
.tg-tile.view .tg-tico{background:rgba(56,189,248,.16);color:#38bdf8}
.tg-table{display:grid;gap:2px;margin-bottom:10px}
.tg-trow{display:grid;grid-template-columns:minmax(0,1fr) 72px 48px 92px;gap:8px;align-items:center;padding:9px 10px;border-radius:10px;font-size:14px}
.tg-trow:nth-child(even){background:rgba(255,255,255,.03)}
.tg-thead{font-size:12px;color:var(--muted);padding-top:2px;padding-bottom:2px}
.tg-thead span:not(:first-child),.tg-trow > .tg-n{text-align:right}
.tg-tname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tg-n{font-weight:700;font-variant-numeric:tabular-nums}
.tg-n.ok{color:#4ade80}.tg-n.bad{color:#f87171}.tg-n.view{color:#38bdf8}.tg-n.zero{color:var(--muted);font-weight:500}
.tg-vbar{position:relative;display:flex;justify-content:flex-end;align-items:center;height:22px}
.tg-vbar i{position:absolute;left:0;top:4px;bottom:4px;border-radius:6px;background:rgba(56,189,248,.18)}
.tg-vbar .tg-n{position:relative}
@media (max-width:480px){.tg-trow{grid-template-columns:minmax(0,1fr) 60px 36px 70px;gap:6px;font-size:13px;padding:8px 6px}.tg-tile b{font-size:22px}}
`);
console.log('patched');
