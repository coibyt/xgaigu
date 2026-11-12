// "Gửi ngay" for one group: the member sends right now to a single group — the next video waiting for it,
// or any video they pick — without waiting for the schedule. Manual sends count in today's tally but are not blocked by it.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/telegram.js', [
  // the picker tells, for one group, which videos it already got / has waiting
  [`    const queued = new Set(db.prepare('SELECT DISTINCT video_id FROM tg_queue WHERE user_id = ?').all(req.user.id).map((r) => r.video_id));
    res.json({ videos: rows.map((v) => ({ id: v.id, caption: v.caption, thumb: v.thumb, createdAt: v.created_at, queued: queued.has(v.id) })) });`,
   `    const queued = new Set(db.prepare('SELECT DISTINCT video_id FROM tg_queue WHERE user_id = ?').all(req.user.id).map((r) => r.video_id));
    const tid = Number(req.query.target) || 0;
    const here = new Map(tid ? db.prepare('SELECT q.video_id, q.status FROM tg_queue q JOIN tg_targets t ON t.id = q.target_id WHERE q.target_id = ? AND t.user_id = ?').all(tid, req.user.id).map((r) => [r.video_id, r.status]) : []);
    res.json({ videos: rows.map((v) => ({ id: v.id, caption: v.caption, thumb: v.thumb, createdAt: v.created_at, queued: queued.has(v.id), here: here.get(v.id) || '' })),
      waiting: tid ? db.prepare("SELECT COUNT(*) AS n FROM tg_queue WHERE target_id = ? AND user_id = ? AND status = 'pending'").get(tid, req.user.id).n : 0 });`],
  ["  app.post('/api/me/telegram/targets/:id(\\\\d+)/active', needUser, (req, res) => {", `  app.post('/api/me/telegram/targets/:id(\\\\d+)/send', needUser, async (req, res) => {
    if (!mine(req, res)) return; const t = targetOf(req, res); if (!t) return;
    const owner = userRow(req.user.id), day = nowParts().day, vid = Number(req.body.videoId) || 0;
    let row;
    if (vid) {
      const v = db.prepare('SELECT id FROM videos WHERE id = ? AND user_id = ? AND hidden = 0').get(vid, req.user.id);
      if (!v) return fail(res, 404, 'Không tìm thấy video này hoặc video đang ẩn.');
      db.prepare("INSERT INTO tg_queue (user_id, video_id, target_id, status, created_at) VALUES (?,?,?, 'pending', ?) ON CONFLICT(video_id, target_id) DO NOTHING").run(req.user.id, vid, t.id, now());
      row = db.prepare('SELECT * FROM tg_queue WHERE video_id = ? AND target_id = ?').get(vid, t.id);
      if (row.status === 'sending') return fail(res, 409, 'Video này đang được gửi vào nhóm, hãy đợi một chút.');
      if (row.status !== 'pending') { db.prepare("UPDATE tg_queue SET status = 'pending', error = '' WHERE id = ?").run(row.id); row.status = 'pending'; } // send again
    } else {
      row = db.prepare("SELECT * FROM tg_queue WHERE target_id = ? AND user_id = ? AND status = 'pending' ORDER BY video_id DESC, id LIMIT 1").get(t.id, req.user.id);
      if (!row) return fail(res, 400, 'Nhóm này không còn bài nào trong hàng chờ. Hãy chọn một video để gửi.');
    }
    const wasActive = t.active;
    if (!wasActive) db.prepare('UPDATE tg_targets SET active = 1 WHERE id = ?').run(t.id); // a paused group can still get a manual send
    const ok = await sendRow(row, owner, day).catch(() => false);
    if (!wasActive) db.prepare('UPDATE tg_targets SET active = 0 WHERE id = ? AND active = 1').run(t.id);
    if (!ok) { const r = db.prepare('SELECT error FROM tg_queue WHERE id = ?').get(row.id); return fail(res, 400, 'Không gửi được: ' + ((r && r.error) || 'lỗi không rõ')); }
    db.prepare('INSERT INTO tg_daily (target_id, day, sent) VALUES (?, ?, 1) ON CONFLICT(target_id, day) DO UPDATE SET sent = sent + 1').run(t.id, day);
    const v = db.prepare('SELECT caption FROM videos WHERE id = ?').get(row.video_id);
    res.json({ ok: true, videoId: row.video_id, caption: v ? v.caption : '' });
  });
  app.post('/api/me/telegram/targets/:id(\\\\d+)/active', needUser, (req, res) => {`],
]);

edit('public/js/telegram.js', [
  ["          h('button', { type: 'button', class: 'btn sm', onclick: () => act(() => api('/me/telegram/targets/' + t.id + '/test', { method: 'POST' }), 'Đã gửi tin thử vào ' + t.title) }, 'Gửi thử'),",
   "          h('button', { type: 'button', class: 'btn sm tg-now', onclick: () => sendNow(t) }, '🚀 Gửi ngay'),\n" +
   "          h('button', { type: 'button', class: 'btn sm', onclick: () => act(() => api('/me/telegram/targets/' + t.id + '/test', { method: 'POST' }), 'Đã gửi tin thử vào ' + t.title) }, 'Gửi thử'),"],
  ["  async function pickVideos() {", `  // send right now to one group: the next video waiting for it, or a chosen one
  async function sendNow(t) {
    let d; try { d = await api('/me/telegram/videos?target=' + t.id); } catch (e) { return fail(e); }
    let picked = 0;
    const send = async (btn, videoId) => {
      btn.disabled = true; const old = btn.textContent; btn.textContent = 'Đang gửi…';
      try { const r = await api('/me/telegram/targets/' + t.id + '/send', { method: 'POST', body: videoId ? { videoId } : {} }); toast('Đã gửi vào ' + t.title + ': ' + short(r.caption, 40)); m.close(); load(); }
      catch (e) { fail(e); btn.disabled = false; btn.textContent = old; }
    };
    const nextBtn = h('button', { type: 'button', class: 'btn primary', style: 'width:100%', disabled: !d.waiting }, d.waiting ? '⚡ Gửi bài kế tiếp trong hàng chờ' : 'Hàng chờ của nhóm này đang trống');
    nextBtn.addEventListener('click', () => send(nextBtn, 0));
    const go = h('button', { type: 'button', class: 'btn', style: 'width:100%', disabled: true }, 'Chọn một video ở trên');
    go.addEventListener('click', () => send(go, picked));
    const TAG = { sent: 'đã gửi nhóm này', pending: 'đang chờ', failed: 'lần trước bị lỗi', skipped: '', cancelled: '' };
    const nm = 'tgsn' + t.id;
    const list = d.videos.length ? h('div', { class: 'tg-pick' }, d.videos.map((v) => h('label', { class: 'tg-item' },
      h('input', { type: 'radio', name: nm, onchange: () => { picked = v.id; go.disabled = false; go.textContent = '🚀 Gửi video này ngay'; } }), thumbOf(v.thumb),
      h('div', {}, h('span', {}, short(v.caption, 60)), h('small', { class: 'muted' }, new Date(v.createdAt).toLocaleDateString('vi-VN') + (TAG[v.here] ? ' · ' + TAG[v.here] : '')))))) : h('p', { class: 'muted' }, 'Bạn chưa có video công khai nào.');
    const m = modal(h('div', { class: 'tg-sendnow' }, h('h3', { style: 'margin-bottom:4px' }, '🚀 Gửi ngay vào ' + t.title),
      h('p', { class: 'muted', style: 'margin-bottom:12px;font-size:14px' }, 'Gửi luôn vào riêng nhóm này, không cần chờ giờ hẹn. ' + (d.waiting ? 'Nhóm đang có ' + d.waiting + ' bài chờ gửi.' : '')),
      nextBtn, h('div', { class: 'tg-or' }, h('span', {}, 'hoặc chọn video')), list, go));
  }
  async function pickVideos() {`],
]);

fs.appendFileSync('public/css/telegram.css', `
.tg-gact .tg-now{background:linear-gradient(135deg,#2aabee,#1d8fd1);border-color:transparent;color:#fff}
.tg-gact .tg-now:hover{filter:brightness(1.08)}
.tg-sendnow .tg-pick{margin-top:4px}
`);
console.log('patched');
