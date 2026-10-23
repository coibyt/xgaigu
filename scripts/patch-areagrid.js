// One-off patch: videos of an area appear in random order (new every time) in a dense TikTok-style grid with infinite scroll.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---------- server ----------
rep('server.js', "// How many videos each region / province / district has", `// Videos of one area in random order. The browser sends the ids it already shows, so scrolling never repeats a video.
app.get('/api/area-videos', (req, res) => {
  const area = readArea(req.query);
  if (!area.region) return fail(res, 400, 'Khu vực không hợp lệ');
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 36, 1), 60);
  const seen = new Set(String(req.query.seen || '').split(',').map(Number).filter(Boolean).slice(0, 2000));
  const ids = db.prepare(
    \`SELECT v.id FROM videos v JOIN users u ON u.id = v.user_id
     WHERE v.hidden = 0 AND u.banned = 0 AND v.region = ? AND (? = '' OR v.province = ?) AND (? = '' OR v.district = ?)\`
  ).all(area.region, area.province, area.province, area.district, area.district).map((r) => r.id);
  const left = ids.filter((id) => !seen.has(id));
  for (let i = left.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [left[i], left[j]] = [left[j], left[i]]; } // Fisher-Yates shuffle
  const pick = left.slice(0, limit);
  const byId = new Map(pick.length ? listVideos(req.user, { ids: pick, limit: pick.length }).map((v) => [v.id, v]) : []);
  res.json({ videos: pick.map((id) => byId.get(id)).filter(Boolean), total: ids.length, remaining: Math.max(0, left.length - pick.length) });
});

// How many videos each region / province / district has`);

// ---------- client ----------
rep('public/js/app.js', "async function pageRegions(reg, prov, dist) {", `// One tile of the area / profile grids (cover image, badges, likes)
function areaTile(v) {
  const yt = !v.file && ytId(v.url);
  const poster = v.thumb || (yt ? \`https://i.ytimg.com/vi/\${yt}/hqdefault.jpg\` : '');
  const media = poster ? h('img', { src: poster, alt: v.caption || 'Video', loading: 'lazy', decoding: 'async' })
    : (() => { const m = mediaEl(v); if (m instanceof HTMLVideoElement) m.setAttribute('preload', 'metadata'); else m.style.pointerEvents = 'none'; return m; })();
  return h('a', { class: 'tcell', href: '#/feed/' + v.id, 'aria-label': 'Xem video' }, media, vflags(v, true),
    h('span', { class: 'tviews', html: isAdmin() ? icon('play') + fmtCount(v.views || 0) : icon('heart') + fmtCount(v.likes || 0) }));
}

async function pageRegions(reg, prov, dist) {`);
rep('public/js/app.js', "    const grid = h('div', { class: 'grid g4' }, h('div', { class: 'spin' }));\n    wrap.append(h('h2', { class: 'title' }, dist || prov), chips, grid, seoBox(info));",
  "    const grid = h('div', { class: 'tgrid area-grid' });\n    const count = h('span', { class: 'muted', style: 'font-size:14px;margin-left:8px;font-weight:500' });\n    const more = h('button', { class: 'btn', type: 'button', hidden: true, style: 'margin:18px auto 0;display:flex' }, 'Xem thêm video');\n    const first = h('div', { class: 'spin' });\n    wrap.append(h('h2', { class: 'title' }, dist || prov, count), chips, first, grid, more, seoBox(info));");
const s = fs.readFileSync('public/js/app.js', 'utf8');
const a = s.indexOf("    const q = `/videos?limit=48&region=${reg}&province=${enc(prov)}`");
const b = s.indexOf("  main.append(wrap, footer());\n}\n\n// ---------- search (nickname or address)");
if (a < 0 || b < 0) throw new Error('regions video block not found');
fs.writeFileSync('public/js/app.js', s.slice(0, a) + `    // random order, 36 at a time; scrolling loads more until everything was shown once
    const seen = []; let busy = false, finished = false;
    const load = async () => {
      if (busy || finished) return; busy = true;
      try {
        const d = await api('/area-videos?limit=36&region=' + reg + '&province=' + enc(prov) + (dist ? '&district=' + enc(dist) : '') + '&seen=' + seen.slice(-1500).join(','));
        first.remove();
        if (!seen.length) count.textContent = d.total ? '· ' + d.total + ' video' : '';
        if (!seen.length && !d.videos.length) grid.replaceWith(h('div', { class: 'card empty' }, h('div', { class: 'ico', html: icon('video') }), h('h3', {}, 'Chưa có video ở khu vực này'), h('p', {}, 'Hãy là người đầu tiên đăng video tại đây.'), h('a', { class: 'btn primary', style: 'margin-top:12px', href: '#/upload' }, 'Đăng video')));
        d.videos.forEach((v) => { seen.push(v.id); grid.append(areaTile(v)); });
        if (!d.remaining) { finished = true; more.hidden = true; io && io.disconnect(); } else more.hidden = false;
      } catch (e) { first.remove(); fail(e); }
      busy = false;
    };
    more.addEventListener('click', load);
    const sentinel = h('div', { style: 'height:1px' }); more.before(sentinel);
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) load().then(() => { if (!finished) { io.unobserve(sentinel); io.observe(sentinel); } }); }, { rootMargin: '700px' });
    io.observe(sentinel); S.cleanups.push(() => io.disconnect());
    load();
  }
` + s.slice(b));
fs.appendFileSync('public/css/app.css', `
/* area video grid: dense, 3 columns like a profile */
.area-grid{margin-inline:-16px}
@media (min-width:721px){.area-grid{margin-inline:0;grid-template-columns:repeat(4,1fr)}}
`);
console.log('patched');
