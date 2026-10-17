// One-off patch: real view counts only for admins, "Đang hot" / "Mới" badges (automatic or set by admin), boosted in the home feed.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---------- db ----------
rep('src/db.js', 'CREATE TABLE IF NOT EXISTS reports (', `CREATE TABLE IF NOT EXISTS video_activity (
  video_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_video_activity ON video_activity(video_id, at);
CREATE TABLE IF NOT EXISTS reports (`);
rep('src/db.js', "  ['locked', 'locked INTEGER DEFAULT 0'],", "  ['locked', 'locked INTEGER DEFAULT 0'],\n  ['badge', \"badge TEXT DEFAULT ''\"],");

// ---------- server: activity log + badge logic ----------
rep('server.js', "const now = () => Date.now();\n", `const now = () => Date.now();
// Recent activity (view = 1 point, like or comment = 3 points) decides which videos are "hot". Only the last 3 days are kept.
const DAY_MS = 86400_000, HOT_MIN = Number(process.env.HOT_MIN) || 12;
const act = (videoId, kind) => { try { db.prepare('INSERT INTO video_activity (video_id, kind, at) VALUES (?,?,?)').run(videoId, kind, Date.now()); } catch {} };
setInterval(() => { try { db.prepare('DELETE FROM video_activity WHERE at < ?').run(Date.now() - 3 * DAY_MS); } catch {} }, 3600_000).unref();
// badge: admin choice first ("hot" / "new" / "off" = none), otherwise automatic
const badgeOf = (setting, heat, createdAt) => (setting === 'off' ? '' : setting === 'hot' || setting === 'new' ? setting : heat >= HOT_MIN ? 'hot' : Date.now() - createdAt < DAY_MS ? 'new' : '');
`);
rep('server.js', "      db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?').run(v.id);", "      db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?').run(v.id); act(v.id, 'view');");
rep('server.js', "  if (!had) db.prepare('INSERT INTO likes (video_id, user_id) VALUES (?,?)').run(id, req.user.id);", "  if (!had) { db.prepare('INSERT INTO likes (video_id, user_id) VALUES (?,?)').run(id, req.user.id); act(id, 'like'); }");
rep('server.js', "  db.prepare('INSERT INTO comments (video_id, user_id, body, created_at) VALUES (?,?,?,?)')", "  act(Number(req.params.id), 'comment');\n  db.prepare('INSERT INTO comments (video_id, user_id, body, created_at) VALUES (?,?,?,?)')");

// ---------- server: listVideos ----------
rep('server.js', "       (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id AND l.user_id = ?) AS liked\n     FROM videos v JOIN users u ON u.id = v.user_id\n     WHERE v.hidden = 0",
  "       (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id AND l.user_id = ?) AS liked,\n       (SELECT COALESCE(SUM(CASE a.kind WHEN 'view' THEN 1 ELSE 3 END), 0) FROM video_activity a WHERE a.video_id = v.id AND a.at > ?) AS heat\n     FROM videos v JOIN users u ON u.id = v.user_id\n     WHERE v.hidden = 0");
rep('server.js', "  ).all(viewer ? viewer.id : 0, userId ?? null,", "  ).all(viewer ? viewer.id : 0, Date.now() - DAY_MS, userId ?? null,");
rep('server.js', "      views: r.views || 0, likes: r.likes, comments: r.comments, liked: !!r.liked,", "      // the real view count is for admins only; everybody else sees no view numbers at all\n      ...(viewer && viewer.role === 'admin' ? { views: r.views || 0, heat: r.heat } : {}),\n      badge: badgeOf(r.badge, r.heat, r.created_at), likes: r.likes, comments: r.comments, liked: !!r.liked,");

// profile totals: views only for admins
rep('server.js', "  stats.followers = db.prepare(", "  if (!(req.user && req.user.role === 'admin')) delete stats.views;\n  stats.followers = db.prepare(");

// ---------- server: home feed boost ----------
rep('server.js', "    `SELECT v.id, v.province FROM videos v JOIN users u ON u.id = v.user_id WHERE v.hidden = 0 AND u.banned = 0 ORDER BY v.id DESC LIMIT 1500`).all();",
  "    `SELECT v.id, v.province, v.badge, v.created_at FROM videos v JOIN users u ON u.id = v.user_id WHERE v.hidden = 0 AND u.banned = 0 ORDER BY v.id DESC LIMIT 1500`).all();\n  const heatOf = new Map(db.prepare(\"SELECT video_id, SUM(CASE kind WHEN 'view' THEN 1 ELSE 3 END) AS h FROM video_activity WHERE at > ? GROUP BY video_id\").all(Date.now() - DAY_MS).map((x) => [x.video_id, x.h]));");
rep('server.js', "    const w = 1 + 7 * interest; // a favourite region is up to 8x as likely as an unknown one",
  "    const b = badgeOf(r.badge, heatOf.get(r.id) || 0, r.created_at);\n    const w = (1 + 7 * interest) * (b === 'new' ? 8 : b === 'hot' ? 5 : 1); // favourite regions up to 8x; new videos 8x and hot videos 5x so they surface first");

// ---------- server: admin ----------
rep('server.js', "    info, views: r.views || 0, likes: r.likes,", "    info, views: r.views || 0, badge: r.badge || '', likes: r.likes,");
rep('server.js', "app.put('/api/admin/videos/:id(\\\\d+)', needAdmin,", `app.post('/api/admin/videos/:id(\\\\d+)/badge', needAdmin, (req, res) => {
  const badge = ['', 'hot', 'new', 'off'].includes(req.body.badge) ? req.body.badge : null;
  if (badge === null) return fail(res, 400, 'Huy hiệu không hợp lệ');
  if (!db.prepare('SELECT 1 FROM videos WHERE id = ?').get(req.params.id)) return fail(res, 404, 'Không tìm thấy video');
  db.prepare('UPDATE videos SET badge = ? WHERE id = ?').run(badge, req.params.id);
  res.json({ ok: true, video: adminVideoRow(req.params.id) });
});
app.put('/api/admin/videos/:id(\\\\d+)', needAdmin,`);

// ---------- client ----------
rep('public/js/app.js', "// ---------- feed ----------\nfunction actBtn(", `// "Đang hot" / "Mới" badge on a video (automatic, or chosen by an admin)
const isAdmin = () => !!(S.user && S.user.role === 'admin');
const vtag = (v) => (v.badge ? h('span', { class: 'vtag ' + v.badge }, v.badge === 'hot' ? '🔥 Đang hot' : '🆕 Mới') : null);

// ---------- feed ----------
function actBtn(`);
rep('public/js/app.js', "      h('div', { class: 'meta' },\n", "      h('div', { class: 'meta' }, vtag(v),\n");
rep('public/js/app.js', "    h('span', { class: 'views', title: fmtCount(v.views || 0) + ' lượt xem', html: icon('heart') + v.likes + '<span class=\"vsep\">·</span>' + icon('eye2') + fmtCount(v.views || 0) }),",
  "    vtag(v),\n    h('span', { class: 'views', title: isAdmin() ? fmtCount(v.views || 0) + ' lượt xem' : '', html: icon('heart') + v.likes + (isAdmin() ? '<span class=\"vsep\">·</span>' + icon('eye2') + fmtCount(v.views || 0) : '') }),");
rep('public/js/app.js', "stat(stats.likes, 'Lượt thích'), stat(stats.views, 'Lượt xem')),", "stat(stats.likes, 'Lượt thích'), isAdmin() && stats.views != null && stat(stats.views, 'Lượt xem')),");
rep('public/js/app.js', "      h('span', { class: 'tviews', html: icon('play') + fmtCount(v.views || 0) }));", "      vtag(v), h('span', { class: 'tviews', html: isAdmin() ? icon('play') + fmtCount(v.views || 0) : icon('heart') + fmtCount(v.likes || 0) }));");
rep('public/js/app.js', "    ['Lượt xem', fmtCount(v.views || 0)],", "    isAdmin() && ['Lượt xem (thật, chỉ admin thấy)', fmtCount(v.views || 0)],");

// admin dialog: badge picker
rep('public/js/app.js', "  const STATUS = { visible: 'Đang hiển thị', hidden: 'Đã ẩn', banned: 'Bị cấm xuất bản' };", `  const STATUS = { visible: 'Đang hiển thị', hidden: 'Đã ẩn', banned: 'Bị cấm xuất bản' };
  const badgeSel = h('select', { 'aria-label': 'Huy hiệu', style: 'width:auto' }, [['', 'Huy hiệu: tự động'], ['hot', '🔥 Luôn hiện “Đang hot”'], ['new', '🆕 Luôn hiện “Mới”'], ['off', 'Không hiện huy hiệu']].map(([a, b]) => h('option', { value: a, selected: (v.badge || '') === a }, b)));
  badgeSel.addEventListener('change', async () => { try { v = (await api('/admin/videos/' + v.id + '/badge', { method: 'POST', body: { badge: badgeSel.value } })).video; toast('Đã cập nhật huy hiệu'); onChange && onChange(); } catch (e) { fail(e); } });`);
rep('public/js/app.js', "    note, h('div', { style: 'height:12px' }), f), { wide: true });", "    h('div', { class: 'row', style: 'margin-bottom:10px' }, badgeSel), note, h('div', { style: 'height:12px' }), f), { wide: true });");

fs.appendFileSync('public/css/app.css', `
/* video badges */
.vtag{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:800;color:#fff;line-height:1.4;white-space:nowrap}
.vtag.hot{background:linear-gradient(135deg,#ff5a1f,#e11d48);box-shadow:0 4px 14px rgba(255,90,31,.45)}
.vtag.new{background:linear-gradient(135deg,#10b981,#0ea5e9);box-shadow:0 4px 14px rgba(16,185,129,.4)}
.vcard .vtag,.tcell .vtag{position:absolute;top:10px;left:10px;z-index:2}
.tcell .vtag{top:6px;left:6px;font-size:11px;padding:2px 8px}
.vcard .distance{top:44px}
.meta .vtag{margin-bottom:8px;align-self:flex-start}
`);
console.log('patched');
