// Hearts: tap the heart (or double-tap the video) as many times as you like, every tap counts, and hearts float up on the
// screen of everybody watching that video at the same moment.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/db.js', [["  ['optimized', 'optimized INTEGER DEFAULT 0'],", "  ['optimized', 'optimized INTEGER DEFAULT 0'],\n  ['hearts', 'hearts INTEGER DEFAULT 0'],"]]);

edit('server.js', [
  // shown count = classic likes + heart taps
  ["likes: r.likes, comments: r.comments, liked: !!r.liked", "likes: r.likes + (r.hearts || 0), comments: r.comments, liked: !!r.liked"],
  ["COALESCE(SUM((SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id)), 0) AS likes", "COALESCE(SUM((SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id) + v.hearts), 0) AS likes"],
  ["app.get('/api/events', needUser, (req, res) => {", `// ---------- live hearts: everybody watching a video sees the hearts others send ----------
const heartWatchers = new Map(); // video id -> Set of open streams
app.get('/api/videos/:id(\\\\d+)/live', (req, res) => {
  const id = Number(req.params.id);
  sse(res);
  const set = heartWatchers.get(id) || new Set();
  if (set.size >= 500) { send(res, 'full', {}); return res.end(); }
  set.add(res); heartWatchers.set(id, set);
  send(res, 'hello', { ok: true });
  req.on('close', () => { set.delete(res); if (!set.size) heartWatchers.delete(id); });
});
const heartLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false });
app.post('/api/videos/:id(\\\\d+)/heart', heartLimiter, (req, res) => {
  const id = Number(req.params.id);
  const n = Math.min(Math.max(parseInt(req.body.n, 10) || 1, 1), 50); // taps are sent in small batches
  const v = db.prepare('SELECT v.id, v.province FROM videos v JOIN users u ON u.id = v.user_id WHERE v.id = ? AND v.hidden = 0 AND u.banned = 0').get(id);
  if (!v) return fail(res, 404, 'Không tìm thấy video');
  db.prepare('UPDATE videos SET hearts = hearts + ? WHERE id = ?').run(n, id);
  act(id, 'like');
  const total = db.prepare('SELECT (SELECT COUNT(*) FROM likes WHERE video_id = ?) + hearts AS n FROM videos WHERE id = ?').get(id, id).n;
  const cid = String(req.body.cid || '').slice(0, 40);
  for (const s of heartWatchers.get(id) || []) send(s, 'heart', { n, total, cid });
  res.json({ ok: true, likes: total });
});

app.get('/api/events', needUser, (req, res) => {`],
]);

edit('public/js/app.js', [
  ["  const like = actBtn('like' + (v.liked ? ' liked' : ''), 'Thích', 'heart', v.likes, () => toggleLike(v, like));",
   "  const like = actBtn('like' + (v.liked ? ' liked' : ''), 'Thả tim', 'heart', v.likes, () => Hearts.tap(v, like));"],
  ["    media.addEventListener('click', () => { if (performance.now() - (S.unmutedAt",
   "    media.addEventListener('dblclick', (e) => { e.preventDefault(); Hearts.tap(v, like); }); // double-tap the video = heart\n    media.addEventListener('click', () => { if (performance.now() - (S.unmutedAt"],
  // follow the hearts of the video that is on screen
  ["        if (on && !v.src) v.src", "        if (on) Hearts.watch(v.dataset.vid, v.closest('.slide'));\n        if (on && !v.src) v.src"],
  ["        v._active = true; v.preload = 'auto';", "        v._active = true; v.preload = 'auto'; Hearts.watch(v.dataset.vid, v.closest('.slide'));"],
  ["// ---------- feed ----------\nfunction actBtn(", `// ---------- hearts (every tap counts, everyone watching sees them float up) ----------
const Hearts = (() => {
  const cid = Math.random().toString(36).slice(2, 12); // this tab; our own hearts are already drawn locally
  let es = null, watchingId = null, watchingSlide = null;
  const pending = new Map(); // video id -> { n, timer, v, btn }
  const COLORS = ['#ff2e7e', '#ff6b4a', '#ff8ab4', '#ffb33a', '#e11d48', '#ff4fa3'];
  function fly(slideEl, count = 1) {
    const layer = slideEl && slideEl.querySelector('.heart-layer'); if (!layer) return;
    for (let i = 0; i < Math.min(count, 15); i++) {
      const el = document.createElement('span');
      el.className = 'fly-heart';
      el.style.setProperty('--dx', (Math.random() * 90 - 45).toFixed(0) + 'px');
      el.style.setProperty('--rot', (Math.random() * 50 - 25).toFixed(0) + 'deg');
      el.style.setProperty('--dur', (1.6 + Math.random() * 1.1).toFixed(2) + 's');
      el.style.animationDelay = (i * 0.09).toFixed(2) + 's';
      el.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      el.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><path fill="currentColor" d="M12 21s-7.5-4.6-10-9.3C.4 8.5 2.3 4.5 6 4.5c2.2 0 3.6 1.2 4.4 2.4h3.2c.8-1.2 2.2-2.4 4.4-2.4 3.7 0 5.6 4 4 7.2C19.5 16.4 12 21 12 21z"/></svg>';
      el.addEventListener('animationend', () => el.remove());
      layer.append(el);
    }
  }
  function setCount(btn, total) { const n = btn && btn.querySelector('span.n'); if (n) n.textContent = fmtCount(total); }
  function tap(v, btn) {
    v.likes = (v.likes || 0) + 1;
    btn.classList.add('liked'); setCount(btn, v.likes);
    btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
    fly(btn.closest('.slide'), 1);
    if (!v._prefBumped) { v._prefBumped = true; Pref.bump(v.province, 3); }
    const p = pending.get(v.id) || { n: 0, timer: null, v, btn };
    p.n++; clearTimeout(p.timer);
    p.timer = setTimeout(async () => { // send the taps in one small batch
      pending.delete(v.id);
      try { const r = await api('/videos/' + v.id + '/heart', { method: 'POST', body: { n: p.n, cid } }); v.likes = Math.max(v.likes, r.likes); setCount(btn, v.likes); } catch {}
    }, 450);
    pending.set(v.id, p);
  }
  function watch(id, slideEl) {
    if (!id || String(id) === String(watchingId)) return;
    if (es) { es.close(); es = null; }
    watchingId = id; watchingSlide = slideEl;
    try {
      es = new EventSource('/api/videos/' + id + '/live');
      es.addEventListener('heart', (ev) => {
        const d = JSON.parse(ev.data); if (d.cid === cid) return;
        fly(watchingSlide, d.n);
        const btn = watchingSlide && watchingSlide.querySelector('.act.like'); if (btn && d.total) setCount(btn, d.total);
      });
      es.onerror = () => {}; // the browser reconnects by itself
    } catch {}
  }
  window.addEventListener('hashchange', () => { if (es) { es.close(); es = null; watchingId = null; } });
  return { tap, watch };
})();

// ---------- feed ----------
function actBtn(`],
  // a layer on each player where the hearts fly
  ["    h('div', { class: 'player' }, media, attachLoader(media), mute,", "    h('div', { class: 'player' }, media, attachLoader(media), h('div', { class: 'heart-layer', 'aria-hidden': 'true' }), mute,"],
]);

fs.appendFileSync('public/css/app.css', `
/* flying hearts */
.heart-layer{position:absolute;right:6px;bottom:90px;width:110px;height:72%;pointer-events:none;z-index:4;overflow:visible}
.fly-heart{position:absolute;bottom:0;right:22px;opacity:0;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35));animation:heartfly var(--dur,2s) ease-out forwards}
@keyframes heartfly{0%{transform:translate(0,0) scale(.4) rotate(0);opacity:0}12%{opacity:1;transform:translate(calc(var(--dx)*.2),-30px) scale(1.15) rotate(var(--rot))}
  100%{transform:translate(var(--dx),-340px) scale(.85) rotate(calc(var(--rot)*-1));opacity:0}}
.rail .act.like.pop .iconbtn{animation:heartpop .35s ease}
@keyframes heartpop{40%{transform:scale(1.28)}}
@media (prefers-reduced-motion:reduce){.fly-heart{animation-duration:.01s}}
`);
console.log('patched');
