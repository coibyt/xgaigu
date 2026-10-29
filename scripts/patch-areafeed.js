// Watching a video opened from an area page continues with the other videos of that same area (same order as the grid),
// and only after all of them moves on to random videos from everywhere.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

// ---------- server ----------
edit('server.js', [
  ["app.get('/api/area-videos', (req, res) => {\n  const area = readArea(req.query);\n  if (!area.region) return fail(res, 400, 'Khu vực không hợp lệ');\n  const size = pageSize(), rnd = seededRandom(req.query.seed || Date.now());",
   `// Full ordered id list of an area for a given seed (the same order the grid pages show)
function areaOrder(area, seed) {
  const size = pageSize(), rnd = seededRandom(seed || Date.now());
  const rows = db.prepare(
    \`SELECT v.id, (v.verified OR u.verified) AS ver FROM videos v JOIN users u ON u.id = v.user_id
     WHERE v.hidden = 0 AND u.banned = 0 AND v.region = ? AND (? = '' OR v.province = ?) AND (? = '' OR v.district = ?) ORDER BY v.id\`
  ).all(area.region, area.province, area.province, area.district, area.district);
  const shuffle = (list) => { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; };
  const ver = shuffle(rows.filter((r) => r.ver).map((r) => r.id)), oth = shuffle(rows.filter((r) => !r.ver).map((r) => r.id));
  const share = feedConf().verifiedShare, order = [];
  while (ver.length || oth.length) {
    let nV = Math.round(size * share / 100), nO = size - nV;
    if (ver.length < nV) { nO += nV - ver.length; nV = ver.length; }
    if (oth.length < nO) { nV = Math.min(ver.length, nV + nO - oth.length); nO = oth.length; }
    order.push(...shuffle([...ver.splice(0, nV), ...oth.splice(0, nO)]));
  }
  return order;
}
app.get('/api/area-order', (req, res) => {
  const area = readArea(req.query);
  if (!area.region) return fail(res, 400, 'Khu vực không hợp lệ');
  res.json({ ids: areaOrder(area, req.query.seed) });
});
// a batch of videos by id, in the order asked (used to continue an area while watching)
app.get('/api/videos-by-ids', (req, res) => {
  const ids = String(req.query.ids || '').split(',').map(Number).filter((n) => n > 0).slice(0, 24);
  const byId = new Map(ids.length ? listVideos(req.user, { ids, limit: ids.length }).map((v) => [v.id, v]) : []);
  res.json({ videos: ids.map((id) => byId.get(id)).filter(Boolean) });
});

app.get('/api/area-videos', (req, res) => {
  const area = readArea(req.query);
  if (!area.region) return fail(res, 400, 'Khu vực không hợp lệ');
  const size = pageSize(), rnd = seededRandom(req.query.seed || Date.now());`],
]);

// ---------- client ----------
edit('public/js/app.js', [
  // remember which area (and which order) a video was opened from
  ["        else grid.replaceChildren(...d.videos.map(areaTile));",
   "        else grid.replaceChildren(...d.videos.map((v) => { const t = areaTile(v); t.addEventListener('click', () => { S.feedCtx = { region: reg, province: prov, district: dist || '', seed, startId: v.id }; }); return t; }));"],
  // the feed: area first, then everything else
  ["  let before = null, done = false, loading = false, first = true;\n  const seen = []; // home feed: ids already shown, so the random order never repeats a video\n  const more = async () => {\n    if (loading || done) return; loading = true;\n    try {\n      const { videos } = home ?",
   `  let before = null, done = false, loading = false, first = true;
  const seen = []; // home feed: ids already shown, so the random order never repeats a video
  // opened from an area page: play the rest of that area first (same order as its grid), then random videos from everywhere
  const ctx = startId && S.feedCtx && String(S.feedCtx.startId) === String(startId) ? S.feedCtx : null;
  let queue = null;
  if (ctx) {
    try {
      const q = new URLSearchParams({ region: ctx.region, province: ctx.province, district: ctx.district, seed: ctx.seed });
      const { ids } = await api('/area-order?' + q);
      const pos = ids.indexOf(Number(startId));
      queue = pos >= 0 ? [...ids.slice(pos + 1), ...ids.slice(0, pos)] : ids.filter((x) => x !== Number(startId));
      seen.push(Number(startId));
    } catch { queue = null; }
  }
  const more = async () => {
    if (loading || done) return; loading = true;
    try {
      if (queue && queue.length) { // next videos of the same area
        const batch = queue.splice(0, 8);
        const { videos } = await api('/videos-by-ids?ids=' + batch.join(','));
        videos.forEach((v) => { seen.push(v.id); box.append(slide(v)); });
        if (first) box.querySelectorAll('video').forEach((el, i) => { if (i < 2) el.preload = 'auto'; });
        first = false; loading = false; return;
      }
      if (queue) home = true; // the area is finished: continue with random videos from everywhere (never repeating)
      const { videos } = home ?`],
]);
console.log('patched');
