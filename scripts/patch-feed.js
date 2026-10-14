// One-off patch: random home feed that favours the regions a visitor searches / likes / comments on.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 60));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---------- server ----------
rep('server.js', "app.get('/api/videos/:id(\\\\d+)', (req, res) => {", `// Home feed: random order, but provinces the visitor shows interest in (searches, likes, comments) are much more likely to come up.
// Weighted random sampling (Efraimidis-Spirakis): key = -ln(U) / weight, smallest keys win. Nothing is ever excluded, only made rarer.
app.get('/api/feed', (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 24);
  const seen = new Set(String(req.query.seen || '').split(',').map(Number).filter(Boolean).slice(0, 600));
  const score = new Map(); // province -> interest
  for (const part of String(req.query.pref || '').split('|').slice(0, 20)) { // sent by the browser: "Hà Nội~3.5|Đà Nẵng~1"
    const [p, n] = part.split('~'); const v = Number(n);
    if (p && v > 0 && v < 1000) score.set(p.slice(0, 60), (score.get(p.slice(0, 60)) || 0) + v);
  }
  if (req.user) { // members: what they liked / commented on, on any device
    const rows = db.prepare(
      \`SELECT v.province AS p, COUNT(*) AS n FROM (SELECT video_id FROM likes WHERE user_id = ? ORDER BY rowid DESC LIMIT 60) x JOIN videos v ON v.id = x.video_id
       WHERE v.province IS NOT NULL AND v.province <> '' GROUP BY v.province\`).all(req.user.id);
    for (const r of rows) score.set(r.p, (score.get(r.p) || 0) + r.n * 2);
    const rc = db.prepare(
      \`SELECT v.province AS p, COUNT(*) AS n FROM (SELECT video_id FROM comments WHERE user_id = ? ORDER BY rowid DESC LIMIT 60) x JOIN videos v ON v.id = x.video_id
       WHERE v.province IS NOT NULL AND v.province <> '' GROUP BY v.province\`).all(req.user.id);
    for (const r of rc) score.set(r.p, (score.get(r.p) || 0) + r.n * 2);
  }
  const top = Math.max(0, ...score.values());
  const pool = db.prepare(
    \`SELECT v.id, v.province FROM videos v JOIN users u ON u.id = v.user_id WHERE v.hidden = 0 AND u.banned = 0 ORDER BY v.id DESC LIMIT 1500\`).all();
  const picked = pool.filter((r) => !seen.has(r.id)).map((r) => {
    const interest = top ? (score.get(r.province) || 0) / top : 0; // 0..1
    const w = 1 + 7 * interest; // a favourite region is up to 8x as likely as an unknown one
    return { id: r.id, key: -Math.log(1 - Math.random()) / w };
  }).sort((a, b) => a.key - b.key).slice(0, limit).map((r) => r.id);
  if (!picked.length) return res.json({ videos: [] });
  const byId = new Map(listVideos(req.user, { ids: picked, limit: picked.length }).map((v) => [v.id, v]));
  res.json({ videos: picked.map((id) => byId.get(id)).filter(Boolean) });
});

app.get('/api/videos/:id(\\\\d+)', (req, res) => {`);

// ---------- client ----------
rep('public/js/app.js', "// ---------- feed ----------\nfunction actBtn(", `// ---------- region interest (kept on this device; the home feed favours these provinces) ----------
const Pref = {
  get() { try { return JSON.parse(localStorage.getItem('xg_pref') || '{}') || {}; } catch { return {}; } },
  bump(province, w) {
    if (!province) return;
    try {
      const p = this.get();
      for (const k of Object.keys(p)) { p[k] *= 0.97; if (p[k] < 0.2) delete p[k]; } // old interests fade slowly
      p[province] = (p[province] || 0) + w;
      const keep = Object.entries(p).sort((a, b) => b[1] - a[1]).slice(0, 12);
      localStorage.setItem('xg_pref', JSON.stringify(Object.fromEntries(keep)));
    } catch {}
  },
  param() { return Object.entries(this.get()).map(([k, v]) => k.replace(/[|~]/g, ' ') + '~' + v.toFixed(2)).join('|'); },
};

// ---------- feed ----------
function actBtn(`);
rep('public/js/app.js', "    v.liked = r.liked; v.likes = r.likes;", "    v.liked = r.liked; v.likes = r.likes; if (r.liked) Pref.bump(v.province, 3);");
rep('public/js/app.js', "try { await api('/videos/' + v.id + '/comments', { method: 'POST', body: { body: input.value } }); input.value = ''; load(); }", "try { await api('/videos/' + v.id + '/comments', { method: 'POST', body: { body: input.value } }); input.value = ''; Pref.bump(v.province, 3); load(); }");
rep('public/js/app.js', "      const { videos } = await api('/search?q=' + encodeURIComponent(q));\n", `      const { videos } = await api('/search?q=' + encodeURIComponent(q));
      { // searching for a place: remember the province most of the results are in
        const cnt = {}; videos.forEach((v) => { if (v.province) cnt[v.province] = (cnt[v.province] || 0) + 1; });
        const [p, n] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0] || [];
        if (p && n >= Math.ceil(videos.length / 2) && Pref.lastQ !== q) { Pref.lastQ = q; Pref.bump(p, 2); }
      }
`);
rep('public/js/app.js', "async function pageRegions(reg, prov, dist) {\n", "async function pageRegions(reg, prov, dist) {\n  if (prov) Pref.bump(prov, 1.5);\n");
rep('public/js/app.js', `  let before = null, done = false, loading = false, first = true;
  const more = async () => {
    if (loading || done) return; loading = true;
    try {
      const { videos } = await api('/videos' + (before ? '?before=' + before : ''));`, `  let before = null, done = false, loading = false, first = true;
  const seen = []; // home feed: ids already shown, so the random order never repeats a video
  const more = async () => {
    if (loading || done) return; loading = true;
    try {
      const { videos } = home ? await api('/feed?limit=12&seen=' + seen.slice(-500).join(',') + '&pref=' + encodeURIComponent(Pref.param())) : await api('/videos' + (before ? '?before=' + before : ''));
      if (home) videos.forEach((v) => seen.push(v.id));`);
rep('public/js/app.js', "before = videos[videos.length - 1].id; if (videos.length < 12) done = true; }", "before = videos[videos.length - 1].id; if (videos.length < (home ? 1 : 12)) done = true; }");
console.log('patched');
