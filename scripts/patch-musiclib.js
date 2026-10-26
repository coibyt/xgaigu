// One-off patch: admins upload songs (with vocals) to the music library; members pick them in the video editor.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/db.js', [["CREATE TABLE IF NOT EXISTS reports (", `CREATE TABLE IF NOT EXISTS music_tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT DEFAULT '',
  style TEXT DEFAULT '',
  file TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (`]]);

edit('server.js', [
  ["const rmUpload = (name) => {", `// songs uploaded by admins for the editor's music library
const AUDIO_TYPES = { 'audio/mpeg': '.mp3', 'audio/mp3': '.mp3', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a', 'audio/aac': '.aac', 'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/wave': '.wav', 'audio/ogg': '.ogg', 'audio/webm': '.weba' };
const audioUpload = multer({
  storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (_req, file, cb) => cb(null, 'music-' + crypto.randomBytes(12).toString('hex') + (AUDIO_TYPES[file.mimetype] || '.mp3')) }),
  limits: { fileSize: 30 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, !!AUDIO_TYPES[file.mimetype]),
});
const rmUpload = (name) => {`],
  ["app.get('/api/admin/videos', needAdmin,", `// ---------- music library (songs uploaded by admins) ----------
const musicRow = (r) => ({ id: r.id, title: r.title, artist: r.artist || '', style: r.style || 'Nhạc có lời', url: r.file, createdAt: r.created_at });
app.get('/api/music', (_req, res) => {
  res.set('Cache-Control', 'no-cache').json({ tracks: db.prepare('SELECT * FROM music_tracks ORDER BY id DESC').all().map(musicRow) });
});
app.post('/api/admin/music', needAdmin, audioUpload.single('file'), (req, res) => {
  const f = req.file;
  if (!f) return fail(res, 400, 'Hãy chọn một file nhạc (MP3, M4A, AAC, WAV, OGG), tối đa 30 MB');
  const title = clean(req.body.title, 120) || clean(f.originalname.replace(/\\.[^.]+$/, ''), 120);
  if (!title) { rmUpload(f.filename); return fail(res, 400, 'Hãy nhập tên bài hát'); }
  const r = db.prepare('INSERT INTO music_tracks (title, artist, style, file, created_at) VALUES (?,?,?,?,?)')
    .run(title, clean(req.body.artist, 80), clean(req.body.style, 40) || 'Nhạc có lời', '/uploads/' + f.filename, now());
  res.json({ ok: true, track: musicRow(db.prepare('SELECT * FROM music_tracks WHERE id = ?').get(r.lastInsertRowid)) });
});
app.put('/api/admin/music/:id(\\\\d+)', needAdmin, (req, res) => {
  const t = db.prepare('SELECT * FROM music_tracks WHERE id = ?').get(req.params.id);
  if (!t) return fail(res, 404, 'Không tìm thấy bài hát');
  db.prepare('UPDATE music_tracks SET title = ?, artist = ?, style = ? WHERE id = ?').run(clean(req.body.title, 120) || t.title, clean(req.body.artist, 80), clean(req.body.style, 40) || 'Nhạc có lời', t.id);
  res.json({ ok: true, track: musicRow(db.prepare('SELECT * FROM music_tracks WHERE id = ?').get(t.id)) });
});
app.delete('/api/admin/music/:id(\\\\d+)', needAdmin, (req, res) => {
  const t = db.prepare('SELECT * FROM music_tracks WHERE id = ?').get(req.params.id);
  if (!t) return fail(res, 404, 'Không tìm thấy bài hát');
  db.prepare('DELETE FROM music_tracks WHERE id = ?').run(t.id);
  rmUpload(t.file); // videos already made with this song keep their own copy of the audio
  res.json({ ok: true });
});

app.get('/api/admin/videos', needAdmin,`],
]);

// ---------- editor library: admin songs first ----------
edit('public/js/music.js', [
  ["async function loadCatalog() {\n  try {", `async function loadCatalog() {
  // drop songs loaded earlier so calling this again never duplicates them
  for (let i = tracks.length - 1; i >= 0; i--) if (tracks[i].url) tracks.splice(i, 1);
  try { // songs uploaded by the site's admins (with vocals), shown first
    const d = await (await fetch('/api/music', { cache: 'no-cache' })).json();
    const list = (d && Array.isArray(d.tracks) ? d.tracks : []).slice().reverse();
    for (const t of list) if (t && t.url && t.title) tracks.unshift({ id: 'lib-' + t.id, style: 'lib-' + (t.style || 'Nhạc có lời'), styleName: '🎤 ' + (t.style || 'Nhạc có lời'), title: t.title, meta: t.artist || 'Bài hát', url: t.url });
  } catch {}
  try {`],
]);

// ---------- admin page section ----------
edit('public/js/app.js', [
  ["  // video optimisation: shrink big videos so they load fast", `  // music library: songs uploaded by admins for the video editor
  const musicBox = (() => {
    const list = h('div', { style: 'display:grid;gap:8px' }), info = h('p', { class: 'muted', style: 'font-size:13px' });
    const fileIn = h('input', { type: 'file', accept: 'audio/*,.mp3,.m4a,.aac,.wav,.ogg' });
    const title = h('input', { placeholder: 'Tên bài hát (để trống = lấy theo tên file)', maxlength: 120 }), artist = h('input', { placeholder: 'Ca sĩ / nghệ sĩ (không bắt buộc)', maxlength: 80 });
    const style = h('input', { placeholder: 'Thể loại, VD: Nhạc có lời, Remix, Bolero, Nhạc Hoa…', maxlength: 40, value: 'Nhạc có lời' });
    const prog = h('div', { class: 'muted', style: 'font-size:13px' }), upBtn = h('button', { class: 'btn primary', type: 'button' }, 'Tải bài hát lên');
    const load = async () => {
      try {
        const { tracks } = await api('/music');
        info.textContent = tracks.length + ' bài hát trong thư viện';
        list.replaceChildren(...tracks.map((t) => h('div', { class: 'card', style: 'padding:10px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap' },
          h('div', { style: 'flex:1;min-width:160px' }, h('b', { translate: 'no' }, t.title), h('div', { class: 'muted', style: 'font-size:13px' }, [t.artist, t.style].filter(Boolean).join(' · '))),
          h('audio', { controls: true, preload: 'none', src: t.url, style: 'height:36px;max-width:100%' }),
          h('button', { class: 'btn sm', type: 'button', onclick: async () => { const nt = prompt('Tên bài hát', t.title); if (nt == null) return; const na = prompt('Ca sĩ / nghệ sĩ', t.artist) ?? t.artist; const ns = prompt('Thể loại', t.style) ?? t.style; try { await api('/admin/music/' + t.id, { method: 'PUT', body: { title: nt, artist: na, style: ns } }); load(); } catch (e) { fail(e); } } }, 'Sửa'),
          h('button', { class: 'btn sm live', type: 'button', onclick: async () => { if (!confirm('Xoá bài "' + t.title + '" khỏi thư viện?')) return; try { await api('/admin/music/' + t.id, { method: 'DELETE' }); toast('Đã xoá'); load(); } catch (e) { fail(e); } } }, 'Xoá'))));
      } catch (e) { fail(e); }
    };
    upBtn.addEventListener('click', async () => {
      const f = fileIn.files[0]; if (!f) return toast('Hãy chọn file nhạc', true);
      if (f.size > 30 * 1024 * 1024) return toast('File quá lớn (tối đa 30 MB)', true);
      const fd = new FormData(); fd.append('file', f); fd.append('title', title.value); fd.append('artist', artist.value); fd.append('style', style.value);
      upBtn.disabled = true;
      try {
        await apiUpload('/admin/music', fd, (a, b) => { prog.textContent = 'Đang tải lên… ' + Math.round(a / b * 100) + '%'; }).promise;
        prog.textContent = ''; toast('Đã thêm bài hát vào thư viện'); fileIn.value = ''; title.value = ''; artist.value = ''; load();
      } catch (e) { prog.textContent = ''; fail(e); }
      upBtn.disabled = false;
    });
    load();
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Thư viện nhạc có lời'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Bài hát tải lên đây hiện ngay đầu thư viện nhạc trong trình chỉnh sửa video, để thành viên chọn chèn vào video. Chỉ tải lên bài bạn có quyền sử dụng; nhạc có bản quyền có thể khiến video bị khiếu nại.'),
        fileIn, h('div', { class: 'two' }, title, artist), style, h('div', { class: 'row', style: 'gap:10px;align-items:center' }, upBtn, prog), info, list));
  })();
  // video optimisation: shrink big videos so they load fast`],
  ["trafficBox, shareBox, statBox, videosBox, optBox, seoBox, mailBox, membersBox,", "trafficBox, shareBox, statBox, videosBox, optBox, musicBox, seoBox, mailBox, membersBox,"],
]);
console.log('patched');
