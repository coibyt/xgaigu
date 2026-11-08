// Video compression the admin can set: size tiers (over 20 MB -> 50 %, over 100 MB -> 40 % by default), quality level,
// max resolution, auto-compress new uploads and already-posted videos.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/db.js', [
  ["  ['thumb_try', 'thumb_try INTEGER DEFAULT 0'],", "  ['thumb_try', 'thumb_try INTEGER DEFAULT 0'],\n  ['opt_level', 'opt_level INTEGER DEFAULT 0'],\n  ['opt_claim', 'opt_claim INTEGER DEFAULT 0'],"],
]);

edit('server.js', [
  ["const transcode = require('./src/transcode').create({ ffmpeg: FFMPEG, uploadDir: UPLOAD_DIR, db, afterNotSmaller: (stored) => faststart.enqueue(stored) });",
   "const transcode = require('./src/transcode').create({ ffmpeg: FFMPEG, uploadDir: UPLOAD_DIR, db, afterNotSmaller: (stored) => faststart.enqueue(stored), settings: () => getConf('video_compress') });"],
  ["  if (file) setTimeout(() => transcode.enqueue('/uploads/' + file.filename, newId), 1500); // shrink for fast loading, in the background",
   "  if (file) setTimeout(() => transcode.enqueueNew('/uploads/' + file.filename, newId), 1500); // shrink for fast loading, in the background"],
  [`function optimizable(limit = 3000) {
  const rows = db.prepare("SELECT id, file FROM videos WHERE file != '' AND optimized = 0 ORDER BY id DESC LIMIT ?").all(limit);
  const out = [];
  for (const r of rows) { try { const size = fs.statSync(path.join(UPLOAD_DIR, path.basename(r.file))).size; if (size > 2 * MB) out.push({ id: r.id, file: r.file, size }); } catch {} }
  return out;
}`, 'const optimizable = (limit) => transcode.candidates(limit);'],
  ["  res.json({ available: !!FFMPEG, pending: list.length,", "  res.json({ available: !!FFMPEG, settings: transcode.conf(), pending: list.length,"],
  ["app.post('/api/admin/optimize/stop',", `app.put('/api/admin/optimize/settings', needAdmin, (req, res) => {
  const s = require('./src/transcode').readSettings(JSON.stringify(req.body || {}));
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('video_compress', JSON.stringify(s));
  res.json({ ok: true, settings: s });
});
app.post('/api/admin/optimize/stop',`],
]);

edit('public/js/app.js', [
  ["    const startB = h('button', { class: 'btn primary', type: 'button' }, 'Nén video cũ'), stopB = h('button', { class: 'btn', type: 'button', hidden: true }, 'Dừng');",
   `    const startB = h('button', { class: 'btn primary', type: 'button' }, 'Nén video cũ ngay'), stopB = h('button', { class: 'btn', type: 'button', hidden: true }, 'Dừng');
    // compression settings
    const cs = o.settings || {};
    const num = (v, min, max) => h('input', { type: 'number', min, max, value: v, style: 'width:84px' });
    const chk = (v) => h('input', { type: 'checkbox', checked: !!v, style: 'width:18px;height:18px;min-height:0;padding:0' });
    const enabled = chk(cs.enabled), autoNew = chk(cs.autoNew), autoOld = chk(cs.autoOld);
    const t1 = num(cs.tier1Mb, 3, 2000), p1 = num(cs.tier1Pct, 10, 90), t2 = num(cs.tier2Mb, 5, 5000), p2 = num(cs.tier2Pct, 10, 90);
    const side = h('select', { style: 'width:auto' }, [[480, '480p (nhẹ nhất)'], [540, '540p'], [720, '720p (khuyên dùng)'], [1080, '1080p (nét nhất, nặng)']].map(([v, l]) => h('option', { value: v, selected: Number(cs.maxSide) === v }, l)));
    const quality = h('select', { style: 'width:auto' }, [['light', 'Nhẹ máy nhất'], ['balanced', 'Cân bằng (khuyên dùng)'], ['sharp', 'Nét hơn']].map(([v, l]) => h('option', { value: v, selected: cs.quality === v }, l)));
    const saveS = h('button', { class: 'btn primary', type: 'button' }, 'Lưu cài đặt nén');
    const line = (...kids) => h('label', { class: 'row', style: 'gap:8px;flex-wrap:wrap;align-items:center;font-size:15px' }, ...kids);
    saveS.addEventListener('click', async () => {
      try {
        const r = await api('/admin/optimize/settings', { method: 'PUT', body: { enabled: enabled.checked, autoNew: autoNew.checked, autoOld: autoOld.checked, tier1Mb: t1.value, tier1Pct: p1.value, tier2Mb: t2.value, tier2Pct: p2.value, maxSide: side.value, quality: quality.value } });
        Object.assign(cs, r.settings); t1.value = cs.tier1Mb; p1.value = cs.tier1Pct; t2.value = cs.tier2Mb; p2.value = cs.tier2Pct;
        toast('Đã lưu cài đặt nén video'); paint(await api('/admin/optimize'));
      } catch (e) { fail(e); }
    });
    const settingsCard = h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px;margin-bottom:12px' },
      h('h3', { style: 'font-size:17px' }, 'Cài đặt nén'),
      line(enabled, 'Bật nén video'),
      line('Video nặng trên', t1, 'MB → nén còn', p1, '% dung lượng'),
      line('Video nặng trên', t2, 'MB → nén còn', p2, '% dung lượng'),
      line('Độ phân giải tối đa', side),
      line('Chất lượng', quality),
      h('p', { class: 'muted', style: 'font-size:13px;margin-top:-4px' }, 'Video nhỏ hơn mức đầu chỉ được nén khi nặng hơn mức điện thoại cần. Mức “Chất lượng” đặt giới hạn thấp nhất, nên video luôn xem rõ trên điện thoại (khi đó dung lượng có thể cao hơn % đã đặt một chút).'),
      line(autoNew, 'Tự nén video mới đăng'),
      line(autoOld, 'Tự nén dần các video đã đăng (chạy nền, mỗi lần một video, không làm chậm website)'),
      h('div', {}, saveS));`],
  ["        ? 'Còn ' + s.pending + ' video lớn hơn 2 MB chưa nén (khoảng ' + s.pendingMB + ' MB).",
   "        ? 'Còn ' + s.pending + ' video cần xem xét để nén (khoảng ' + s.pendingMB + ' MB).' + (s.settings && s.settings.autoOld ? ' Đang bật tự nén dần.' : '') + '"],
  ["      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },\n        h('p', { class: 'muted', style: 'font-size:14px' }, 'Chỉ video lớn hơn 2 MB mới được xem xét; video dưới 2 MB giữ nguyên. Video đã nhẹ (từ 720p trở xuống và dưới khoảng 1,6 Mbit/s, mức tương đương các trang video ngắn khác) cũng giữ nguyên để không mất chất lượng. Video nặng hơn được nén về tối đa 720p, khoảng 1–1,8 Mbit/s, từng video một ở nền. File gốc chỉ bị thay khi bản nén nhỏ hơn rõ rệt.'),",
   "      settingsCard, h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },\n        h('p', { class: 'muted', style: 'font-size:14px' }, 'Nén từng video một ở nền. File gốc chỉ bị thay khi bản nén nhỏ hơn rõ rệt và chạy tốt. Video dưới 2 MB giữ nguyên.'),"],
]);
console.log('patched');
