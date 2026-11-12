// Feeds stay in one country: the home feed and "Video" show Việt Nam only; watching a video of another
// country continues with videos of that country only.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('server.js', [
  ['function listVideos(viewer, { userId, before, limit = 12, id, ids, region, province, district } = {}) {',
   'const feedCountry = (q) => { const c = String(q.country || \'\').toUpperCase(); return COUNTRY_RE.test(c) ? c : \'VN\'; };\nfunction listVideos(viewer, { userId, before, limit = 12, id, ids, region, province, district, country } = {}) {'],
  ["AND (? IS NULL OR v.district = ?)\n     ORDER BY v.id DESC LIMIT ?`", "AND (? IS NULL OR v.district = ?) AND (? IS NULL OR COALESCE(v.country, 'VN') = ?)\n     ORDER BY v.id DESC LIMIT ?`"],
  ['district || null, district || null, limit);', 'district || null, district || null, country || null, country || null, limit);'],
  ['res.json({ videos: listVideos(req.user, { before, limit, ...area }) });', "res.json({ videos: listVideos(req.user, { before, limit, ...area, country: area.region === 'qt' ? area.country || null : feedCountry(req.query) }) });"],
  ["  const poolSql = (ver) => db.prepare(\n    `SELECT v.id, v.province, v.badge, v.created_at, (v.verified OR u.verified) AS ver FROM videos v JOIN users u ON u.id = v.user_id\n     WHERE v.hidden = 0 AND u.banned = 0 AND (v.verified OR u.verified) = ? ORDER BY v.id DESC LIMIT 2000`).all(ver);",
   "  const cc = feedCountry(req.query);\n  const poolSql = (ver) => db.prepare(\n    `SELECT v.id, v.province, v.badge, v.created_at, (v.verified OR u.verified) AS ver FROM videos v JOIN users u ON u.id = v.user_id\n     WHERE v.hidden = 0 AND u.banned = 0 AND (v.verified OR u.verified) = ? AND COALESCE(v.country, 'VN') = ? ORDER BY v.id DESC LIMIT 2000`).all(ver, cc);"],
  // a foreign area never widens to every foreign country
  ["area.region === 'qt' && area.country && { region: 'qt', country: area.country, province: '', district: '' }, area.region && { region: area.region, province: '', district: '' }].filter(Boolean);",
   "area.region === 'qt' && area.country && { region: 'qt', country: area.country, province: '', district: '' }, area.region && area.region !== 'qt' && { region: area.region, province: '', district: '' }].filter(Boolean);"],
]);

edit('public/js/app.js', [
  ["  let queue = null, others = null; // others: after a member's own videos, random videos of other members in the same area\n",
   "  let queue = null, others = null; // others: after a member's own videos, random videos of other members in the same area\n" +
   "  // the country the feed stays in: Việt Nam, or the country of the area / video it was opened from\n" +
   "  let cc = ctx && ctx.region === 'qt' && ctx.country ? ctx.country : 'VN', startVideo = null;\n" +
   "  if (startId && cc === 'VN') { try { startVideo = (await api('/videos/' + startId)).video; if (startVideo.country && startVideo.country !== 'VN' && (!ctx || ctx.kind === 'user')) cc = startVideo.country; } catch {} }\n"],
  ["await api('/feed?limit=12&seen=' + seen.slice(-500).join(',') + '&pref=' + encodeURIComponent(Pref.param())) : await api('/videos' + (before ? '?before=' + before : ''));",
   "await api('/feed?limit=12&country=' + cc + '&seen=' + seen.slice(-500).join(',') + '&pref=' + encodeURIComponent(Pref.param())) : await api('/videos?country=' + cc + (before ? '&before=' + before : ''));"],
  ["    try { const { video } = await api('/videos/' + startId); if (box.querySelector('.empty')) box.innerHTML = ''; box.prepend(slide(video)); } catch {}",
   "    try { const video = startVideo || (await api('/videos/' + startId)).video; if (box.querySelector('.empty')) box.innerHTML = ''; box.prepend(slide(video)); } catch {}"],
]);
console.log('patched');
