// One-off patch: compress uploaded videos in the background + admin tool to compress the old ones.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};

rep('src/db.js', "  ['verified', 'verified INTEGER DEFAULT 0'],", "  ['verified', 'verified INTEGER DEFAULT 0'],\n  ['optimized', 'optimized INTEGER DEFAULT 0'],");

rep('server.js', "const faststart = require('./src/faststart').create({ ffmpeg: FFMPEG, uploadDir: UPLOAD_DIR });",
  "const faststart = require('./src/faststart').create({ ffmpeg: FFMPEG, uploadDir: UPLOAD_DIR });\nconst transcode = require('./src/transcode').create({ ffmpeg: FFMPEG, uploadDir: UPLOAD_DIR, db, afterNotSmaller: (stored) => faststart.enqueue(stored) });");
rep('server.js', "\n  if (file) setTimeout(() => faststart.enqueue('/uploads/' + file.filename), 2000); // optimise for quick start in the background", "");
rep('server.js', "area.region, area.province, area.district, JSON.stringify(info), phone, nickname, place.lat, place.lng, now());",
  "area.region, area.province, area.district, JSON.stringify(info), phone, nickname, place.lat, place.lng, now());\n  if (file) { const newId = db.prepare('SELECT last_insert_rowid() AS id').get().id; setTimeout(() => transcode.enqueue('/uploads/' + file.filename, newId), 1500); } // shrink for fast loading, in the background");

rep('server.js', "app.get('/api/admin/videos', needAdmin,", `// ---------- video optimisation (admin) ----------
const MB = 1048576;
function optimizable(limit = 3000) {
  const rows = db.prepare("SELECT id, file FROM videos WHERE file != '' AND optimized = 0 ORDER BY id DESC LIMIT ?").all(limit);
  const out = [];
  for (const r of rows) { try { const size = fs.statSync(path.join(UPLOAD_DIR, path.basename(r.file))).size; if (size > 2 * MB) out.push({ id: r.id, file: r.file, size }); } catch {} }
  return out;
}
app.get('/api/admin/optimize', needAdmin, (_req, res) => {
  const list = FFMPEG ? optimizable() : [];
  res.json({ available: !!FFMPEG, pending: list.length, pendingMB: Math.round(list.reduce((n, x) => n + x.size, 0) / MB),
    optimized: db.prepare('SELECT COUNT(*) AS n FROM videos WHERE optimized = 1').get().n, queued: transcode.pending(),
    running: transcode.stats.running, done: transcode.stats.done, failed: transcode.stats.failed, skipped: transcode.stats.skipped, savedMB: Math.round(transcode.stats.savedBytes / MB) });
});
app.post('/api/admin/optimize/start', needAdmin, (req, res) => {
  if (!FFMPEG) return fail(res, 400, 'Máy chủ này không có ffmpeg nên không nén được video');
  const limit = Math.min(Math.max(parseInt(req.body.limit, 10) || 50, 1), 1000);
  const list = optimizable().slice(0, limit);
  list.forEach((x) => transcode.enqueue(x.file, x.id));
  res.json({ ok: true, queued: list.length });
});
app.post('/api/admin/optimize/stop', needAdmin, (_req, res) => { transcode.stop(); res.json({ ok: true }); });

app.get('/api/admin/videos', needAdmin,`);

// ---------- client ----------
rep('public/js/app.js', "  // email: confirmation switch, test mail, campaigns", `  // video optimisation: shrink big videos so they load fast
  const optBox = await (async () => {
    const o = await api('/admin/optimize').catch(() => null); if (!o) return null;
    const info = h('p', { class: 'muted', style: 'font-size:14px;line-height:1.7' }), limit = h('input', { type: 'number', min: 1, max: 1000, value: 50, style: 'width:100px' });
    const startB = h('button', { class: 'btn primary', type: 'button' }, 'Nén video cũ'), stopB = h('button', { class: 'btn', type: 'button', hidden: true }, 'Dừng');
    let timer;
    const paint = (s) => {
      info.textContent = s.available
        ? 'Còn ' + s.pending + ' video lớn hơn 2 MB chưa nén (khoảng ' + s.pendingMB + ' MB). Đã nén: ' + s.optimized + ' video. Phiên này: nén xong ' + s.done + ', tiết kiệm ' + s.savedMB + ' MB' + (s.failed ? ', lỗi ' + s.failed : '') + (s.running ? ' · đang chạy, còn ' + s.queued + ' video trong hàng đợi…' : '.')
        : 'Máy chủ này không có ffmpeg nên không nén được video.';
      startB.disabled = !s.available || s.running; stopB.hidden = !s.running;
      if (s.running && !timer) timer = setInterval(async () => { try { paint(await api('/admin/optimize')); } catch {} }, 5000);
      if (!s.running && timer) { clearInterval(timer); timer = null; }
    };
    paint(o); S.cleanups.push(() => timer && clearInterval(timer));
    startB.addEventListener('click', async () => { try { const r = await api('/admin/optimize/start', { method: 'POST', body: { limit: limit.value } }); toast('Đã xếp hàng ' + r.queued + ' video'); paint(await api('/admin/optimize')); } catch (e) { fail(e); } });
    stopB.addEventListener('click', async () => { try { await api('/admin/optimize/stop', { method: 'POST' }); toast('Sẽ dừng sau video hiện tại'); } catch (e) { fail(e); } });
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Tối ưu video'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Video mới đăng được nén tự động (độ phân giải tối đa 720p, khoảng 1–2 MB) để tải nhanh. Nút dưới đây nén các video đã đăng trước đó, từng video một ở nền. File gốc chỉ bị thay khi bản nén nhỏ hơn rõ rệt.'),
        info, h('div', { class: 'row', style: 'gap:10px;flex-wrap:wrap;align-items:center' }, h('span', { class: 'muted', style: 'font-size:14px' }, 'Nén tối đa'), limit, h('span', { class: 'muted', style: 'font-size:14px' }, 'video mỗi lần'), startB, stopB)));
  })();
  // email: confirmation switch, test mail, campaigns`);
rep('public/js/app.js', "trafficBox, videosBox, seoBox, mailBox, membersBox, statBox,", "trafficBox, videosBox, optBox, seoBox, mailBox, membersBox, statBox,");
console.log('patched');
