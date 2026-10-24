// One-off patch: "Lưu" (bookmark) button on every video and a private "Đã lưu" tab on the member's own profile.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/db.js', [["CREATE TABLE IF NOT EXISTS reports (", `CREATE TABLE IF NOT EXISTS saves (
  user_id INTEGER NOT NULL,
  video_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, video_id)
);
CREATE INDEX IF NOT EXISTS idx_saves_video ON saves(video_id);
CREATE TABLE IF NOT EXISTS reports (`]]);

edit('server.js', [
  // listVideos: save count + whether the viewer saved it
  ["  return rows.map((r) => {\n    let info = {}; try { info = r.info ? JSON.parse(r.info) : {}; } catch {}",
   `  const saveCount = new Map(), savedByMe = new Set();
  if (rows.length) {
    const marks = rows.map(() => '?').join(','), vids = rows.map((r) => r.id);
    for (const x of db.prepare('SELECT video_id, COUNT(*) AS n FROM saves WHERE video_id IN (' + marks + ') GROUP BY video_id').all(...vids)) saveCount.set(x.video_id, x.n);
    if (viewer) for (const x of db.prepare('SELECT video_id FROM saves WHERE user_id = ? AND video_id IN (' + marks + ')').all(viewer.id, ...vids)) savedByMe.add(x.video_id);
  }
  return rows.map((r) => {
    let info = {}; try { info = r.info ? JSON.parse(r.info) : {}; } catch {}`],
  ["      verified: !!r.verified, selfHidden:", "      saves: saveCount.get(r.id) || 0, saved: savedByMe.has(r.id), verified: !!r.verified, selfHidden:"],
  // endpoints
  ["app.post('/api/videos/:id/like', needUser,", `// Save / unsave a video (private bookmark list shown on the member's own profile)
app.post('/api/videos/:id(\\\\d+)/save', needUser, postLimiter, (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT 1 FROM videos v JOIN users u ON u.id = v.user_id WHERE v.id = ? AND v.hidden = 0 AND u.banned = 0').get(id)) return fail(res, 404, 'Không tìm thấy video');
  const had = db.prepare('DELETE FROM saves WHERE user_id = ? AND video_id = ?').run(req.user.id, id).changes;
  if (!had) db.prepare('INSERT INTO saves (user_id, video_id, created_at) VALUES (?,?,?)').run(req.user.id, id, now());
  res.json({ saved: !had, saves: db.prepare('SELECT COUNT(*) AS n FROM saves WHERE video_id = ?').get(id).n });
});
app.get('/api/me/saved', needUser, (req, res) => {
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0), limit = 36;
  const ids = db.prepare(
    \`SELECT s.video_id AS id FROM saves s JOIN videos v ON v.id = s.video_id JOIN users u ON u.id = v.user_id
     WHERE s.user_id = ? AND v.hidden = 0 AND u.banned = 0 ORDER BY s.created_at DESC LIMIT ? OFFSET ?\`).all(req.user.id, limit + 1, offset).map((r) => r.id);
  const page = ids.slice(0, limit);
  const byId = new Map(page.length ? listVideos(req.user, { ids: page, limit: page.length }).map((v) => [v.id, v]) : []);
  res.json({ videos: page.map((id) => byId.get(id)).filter(Boolean), more: ids.length > limit, next: offset + limit });
});

app.post('/api/videos/:id/like', needUser,`],
]);

edit('public/js/app.js', [
  ["  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z',",
   "  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z',\n  bookmark: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4.2L5 21V4a1 1 0 0 1 1-1z',"],
  // rail button after the like / comment buttons
  ["    like, cm,\n", "    like, cm, saveBtn,\n"],
  ["  const cm = actBtn('', 'Bình luận', 'msg', v.comments, () => openComments(v, cm.querySelector('.n')));",
   `  const cm = actBtn('', 'Bình luận', 'msg', v.comments, () => openComments(v, cm.querySelector('.n')));
  const saveBtn = actBtn('save' + (v.saved ? ' saved' : ''), 'Lưu', 'bookmark', v.saves || 0, async () => {
    if (!(await needLogin())) return;
    try {
      const r = await api('/videos/' + v.id + '/save', { method: 'POST' });
      v.saved = r.saved; v.saves = r.saves; saveBtn.classList.toggle('saved', r.saved); saveBtn.querySelector('span.n').textContent = r.saves;
      toast(r.saved ? 'Đã lưu video. Xem lại trong Hồ sơ → Đã lưu' : 'Đã bỏ lưu');
    } catch (e) { fail(e); }
  });`],
]);

fs.appendFileSync('public/css/app.css', `
/* save (bookmark) button */
.rail .act.save.saved .iconbtn{background:linear-gradient(135deg,#ffcc33,#ff9f1c);border-color:transparent;color:#2a1700}
.rail .act.save.saved svg{fill:currentColor}
.tk-tabs button{flex:1;display:flex;justify-content:center;align-items:center;gap:8px;padding:12px;font:inherit;font-weight:700;background:none;border:0;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.tk-tabs button.on{color:var(--text);border-bottom-color:var(--text)}
.tk-tabs button svg{width:18px;height:18px}
`);
console.log('patched');
