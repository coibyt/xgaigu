// One-off patch: faster video start (preload next, cache, faststart) and a loading ring with % while a video loads.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---------- server ----------
const sv = fs.readFileSync('server.js', 'utf8');
const m = sv.match(/app\.use\('\/uploads', express\.static\(UPLOAD_DIR, \{[\s\S]*?\}\)\);/);
console.log('current uploads handler:\n' + (m ? m[0] : 'NOT FOUND'));
rep('server.js', "// ---------- uploads ----------\n", `// ---------- uploads ----------
const faststart = require('./src/faststart').create({ ffmpeg: FFMPEG, uploadDir: UPLOAD_DIR });
// old files: after start-up, one at a time, fix MP4/MOV files whose index is at the end (slow start)
setTimeout(() => {
  try {
    const files = db.prepare("SELECT file FROM videos WHERE file != '' AND (file LIKE '%.mp4' OR file LIKE '%.mov') ORDER BY id DESC LIMIT 400").all();
    let n = 0; for (const r of files) { const f = path.join(UPLOAD_DIR, path.basename(r.file)); if (faststart.needsFaststart(f)) { faststart.enqueue(r.file); n++; } }
    if (n) console.log('faststart: ' + n + ' video(s) queued for quick-start optimisation');
  } catch (e) { console.error('faststart scan:', e.message); }
}, 45_000).unref();
`);
rep('server.js', "  const dropAll = () => { if (file) rmUpload(file.filename); if (thumb) rmUpload(thumb.filename); };", "  const dropAll = () => { if (file) rmUpload(file.filename); if (thumb) rmUpload(thumb.filename); };\n  if (file) setTimeout(() => faststart.enqueue('/uploads/' + file.filename), 2000); // optimise for quick start in the background");

// ---------- client ----------
rep('public/js/app.js', "  const el = h('video', { playsinline: true, muted: true, preload: 'metadata',", "  const el = h('video', { playsinline: true, muted: true, preload: lazy ? 'none' : 'metadata',");

rep('public/js/app.js', "function slide(v) {", `// Loading ring with a percentage, shown on a video that is still loading (so nobody thinks the site is broken).
function attachLoader(media) {
  const isVideo = media instanceof HTMLVideoElement;
  const pct = h('b', {}, ''), msg = h('span', {}, 'Đang tải video…');
  const ring = h('div', { class: 'vload', role: 'status', 'aria-live': 'polite' }, h('div', { class: 'vring' }), h('div', { class: 'vtext' }, pct, msg));
  const retry = h('button', { type: 'button', class: 'btn sm vretry', hidden: true, onclick: (e) => { e.stopPropagation(); if (isVideo) { media.load(); media.play().catch(() => {}); } retry.hidden = true; started = performance.now(); upd(); } }, 'Thử lại');
  ring.append(retry);
  let started = performance.now(), failed = false;
  const buffered = () => { try { const b = media.buffered, t = media.currentTime; for (let i = 0; i < b.length; i++) if (t >= b.start(i) - 0.1 && t <= b.end(i) + 0.1) return b.end(i); } catch {} return 0; };
  const upd = () => {
    if (!isVideo) return;
    const waiting = media._active && media.readyState < 3 && !media.ended;
    ring.classList.toggle('on', !!(waiting || failed));
    if (failed) { msg.textContent = 'Không tải được video'; pct.textContent = ''; retry.hidden = false; return; }
    retry.hidden = true;
    const dur = media.duration, need = Math.min(isFinite(dur) && dur > 0 ? dur : 3, 3);
    const p = media.readyState >= 1 ? Math.min(99, Math.floor((buffered() - media.currentTime) / need * 100)) : 0;
    pct.textContent = p > 0 ? p + '%' : '';
    msg.textContent = performance.now() - started > 10000 ? 'Mạng hơi chậm, vẫn đang tải…' : 'Đang tải video…';
  };
  if (isVideo) {
    media._upd = upd;
    ['loadstart', 'progress', 'loadedmetadata', 'loadeddata', 'canplay', 'playing', 'waiting', 'stalled', 'timeupdate', 'seeking', 'seeked'].forEach((ev) => media.addEventListener(ev, () => { if (ev === 'waiting' || ev === 'loadstart') started = performance.now(); failed = false; upd(); }));
    media.addEventListener('error', () => { failed = true; upd(); });
    setInterval(() => { if (!media.isConnected) return; if (ring.classList.contains('on')) upd(); }, 1000);
  } else if (media.dataset.yt) { // YouTube frame: ring until the frame has loaded
    ring.classList.add('on'); pct.textContent = '';
    media.addEventListener('load', () => { if (media.src) ring.classList.remove('on'); });
    new MutationObserver(() => { if (media.src) ring.classList.add('on'); else ring.classList.remove('on'); }).observe(media, { attributes: true, attributeFilter: ['src'] });
  }
  return ring;
}

function slide(v) {`);
rep('public/js/app.js', "    h('div', { class: 'player' }, media, mute,", "    h('div', { class: 'player' }, media, attachLoader(media), mute,");

// activation: warm this video and the next one, drive the loader
rep('public/js/app.js', "      if (e.isIntersecting && e.intersectionRatio > 0.6) {\n        v.muted = !S.sound; v._sync && v._sync();", "      if (e.isIntersecting && e.intersectionRatio > 0.6) {\n        v._active = true; v.preload = 'auto';\n        { const nx = v.closest('.slide') && v.closest('.slide').nextElementSibling; const nv = nx && nx.querySelector('video'); if (nv && nv.preload !== 'auto') nv.preload = 'auto'; } // start fetching the next video early\n        v.muted = !S.sound; v._sync && v._sync(); v._upd && v._upd();");
rep('public/js/app.js', "      } else v.pause();\n    }), { threshold: [0, 0.6, 1] });", "      } else { v._active = false; v._upd && v._upd(); v.pause(); }\n    }), { threshold: [0, 0.6, 1] });");

fs.appendFileSync('public/css/app.css', `
/* video loading ring */
.vload{position:absolute;inset:0;z-index:3;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,.35),rgba(0,0,0,.05) 70%)}
.vload.on{display:flex}
.vring{width:58px;height:58px;border-radius:50%;border:4px solid rgba(255,255,255,.18);border-top-color:#ff2e7e;border-right-color:#ff6b4a;animation:rot .85s linear infinite;box-shadow:0 0 28px rgba(255,46,126,.45)}
.vtext{display:flex;gap:8px;align-items:center;padding:7px 16px;border-radius:999px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);font-size:14px;font-weight:600;color:#fff}
.vtext b{font-weight:800;color:#ff8ab4;min-width:0}
.vretry{pointer-events:auto}
@media (prefers-reduced-motion:reduce){.vring{animation-duration:2s}}
`);
console.log('patched');
