// Admin can switch off any running live, optionally barring the member from going live again for a while.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/db.js', [
  ["  ['verified', 'verified INTEGER DEFAULT 0'],\n]) if (!userCols", "  ['verified', 'verified INTEGER DEFAULT 0'],\n  ['live_ban_until', 'live_ban_until INTEGER DEFAULT 0'],\n  ['live_ban_reason', \"live_ban_reason TEXT DEFAULT ''\"],\n]) if (!userCols"],
  ["  ['pinned', \"pinned TEXT DEFAULT ''\"],\n]) if (!streamCols", "  ['pinned', \"pinned TEXT DEFAULT ''\"],\n  ['ended_by', \"ended_by TEXT DEFAULT ''\"],\n  ['end_reason', \"end_reason TEXT DEFAULT ''\"],\n]) if (!streamCols"],
]);

edit('server.js', [
  ["require('./src/live').install(app, { db, fail, clean, now, needUser,", "require('./src/live').install(app, { db, fail, clean, now, needUser, needAdmin,"],
]);

edit('src/live.js', [
  ["const DAILY = 300, WALLET_CAP = 3000;", "const DAILY = 300, WALLET_CAP = 3000;\nconst FOREVER = 253402300799000; // live ban without an end date"],
  ["function install(app, { db, fail, clean, now, needUser,", "function install(app, { db, fail, clean, now, needUser, needAdmin,"],
  [`  function endStream(s) {
    db.prepare('UPDATE streams SET live = 0, ended_at = ? WHERE id = ?').run(now(), s.id);
    const room = rooms.get(s.id);
    if (room) broadcast(room, 'ended', {});
  }`, `  // by = 'admin' when a moderator switched it off: everyone is disconnected, so the camera relay stops too
  function endStream(s, by = '', reason = '') {
    db.prepare('UPDATE streams SET live = 0, ended_at = ?, ended_by = ?, end_reason = ? WHERE id = ?').run(now(), by, reason, s.id);
    const room = rooms.get(s.id);
    if (!room) return;
    broadcast(room, 'ended', { byAdmin: by === 'admin', reason });
    if (by === 'admin') { for (const c of room.clients.values()) c.res.end(); rooms.delete(s.id); }
  }
  const liveBan = (uid) => {
    const u = db.prepare('SELECT live_ban_until, live_ban_reason FROM users WHERE id = ?').get(uid);
    return u && u.live_ban_until > now() ? { until: u.live_ban_until, forever: u.live_ban_until >= FOREVER, reason: u.live_ban_reason || '' } : null;
  };
  const vnTime = (t) => { const d = new Date(t + 7 * 3600_000).toISOString(); return d.slice(11, 16) + ' ngày ' + d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4); };
  const banText = (b) => 'Bạn đã bị quản trị viên khoá quyền phát live ' + (b.forever ? 'vĩnh viễn' : 'đến ' + vnTime(b.until)) + (b.reason ? '. Lý do: ' + b.reason : '') + '.';`],
  ["    live: !!s.live, startedAt: s.started_at,", "    live: !!s.live, startedAt: s.started_at, endedByAdmin: s.ended_by === 'admin', endReason: s.ended_by === 'admin' ? s.end_reason || '' : '',"],
  ["  app.get('/api/live/gifts', (req, res) =>", "  app.get('/api/live/me', needUser, (req, res) => { const b = liveBan(req.user.id); res.json({ ban: b && { ...b, text: banText(b) } }); });\n  app.get('/api/live/gifts', (req, res) =>"],
  ["    const b = req.body || {};\n    const file = req.files", "    const b = req.body || {};\n    const ban = liveBan(req.user.id);\n    const file = req.files"],
  ["    if (title.length < 3) { drop(); return fail(res, 400, 'Vui lòng nhập tiêu đề buổi live'); }", "    if (ban) { drop(); return fail(res, 403, banText(ban)); }\n    if (title.length < 3) { drop(); return fail(res, 400, 'Vui lòng nhập tiêu đề buổi live'); }"],
  ["    if (!s || (s.user_id !== req.user.id && req.user.role !== 'admin')) return fail(res, 403, 'Không có quyền');\n    endStream(s);", "    if (!s || (s.user_id !== req.user.id && req.user.role !== 'admin')) return fail(res, 403, 'Không có quyền');\n    if (s.live) endStream(s, s.user_id === req.user.id ? '' : 'admin');"],
  ["  return { rooms };\n}", `  // ---------- admin ----------
  app.get('/api/admin/live', needAdmin, (_req, res) => {
    expire();
    const live = db.prepare('SELECT s.*, u.email AS u_email FROM streams s JOIN users u ON u.id = s.user_id WHERE s.live = 1 ORDER BY s.started_at DESC').all()
      .map((s) => ({ ...mapStream(s, db.prepare('SELECT * FROM users WHERE id = ?').get(s.user_id)), email: s.u_email }));
    const banned = db.prepare('SELECT id, name, avatar, email, live_ban_until, live_ban_reason FROM users WHERE live_ban_until > ? ORDER BY live_ban_until').all(now())
      .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar, email: u.email, until: u.live_ban_until, forever: u.live_ban_until >= FOREVER, reason: u.live_ban_reason || '' }));
    res.json({ live, banned });
  });
  // switch a live off; days = 0 (just stop), 1 / 7 / 30, or -1 (never again)
  app.post('/api/admin/live/:id(\\\\d+)/stop', needAdmin, (req, res) => {
    const s = db.prepare('SELECT * FROM streams WHERE id = ?').get(Number(req.params.id));
    if (!s) return fail(res, 404, 'Không tìm thấy buổi live');
    const reason = clean(req.body.reason, 200), days = Number(req.body.days) || 0;
    if (s.live) endStream(s, 'admin', reason);
    if (days) setBan(s.user_id, days, reason);
    res.json({ ok: true });
  });
  function setBan(uid, days, reason) {
    const until = days < 0 ? FOREVER : days > 0 ? now() + Math.min(days, 3650) * 86400_000 : 0;
    db.prepare('UPDATE users SET live_ban_until = ?, live_ban_reason = ? WHERE id = ?').run(until, until ? reason : '', uid);
    if (until) for (const x of db.prepare('SELECT * FROM streams WHERE user_id = ? AND live = 1').all(uid)) endStream(x, 'admin', reason);
  }
  app.post('/api/admin/users/:id(\\\\d+)/live-ban', needAdmin, (req, res) => {
    setBan(Number(req.params.id), Number(req.body.days) || 0, clean(req.body.reason, 200));
    res.json({ ok: true });
  });

  return { rooms };
}`],
]);
console.log('patched');
