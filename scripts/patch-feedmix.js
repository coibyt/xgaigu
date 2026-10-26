// Recommendation mix set by the admin: share of verified videos (default 60%) and the strength of the other boosts.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('server.js', [
  ["const VERIFIED_BOOST = Number(process.env.VERIFIED_BOOST) || 10; // how much more often verified videos are suggested",
   `// Recommendation settings (admin page → "Đề xuất video"). verifiedShare = % of suggested videos that carry the verified badge.
const FEED_DEFAULT = { verifiedShare: 60, newBoost: 8, hotBoost: 5, regionBoost: 7 };
const feedConf = () => {
  let c = {}; try { c = JSON.parse((db.prepare('SELECT value FROM settings WHERE key = ?').get('feed_conf') || {}).value || '{}'); } catch {}
  return { ...FEED_DEFAULT, ...c };
};
// Builds one page: about verifiedShare % from the verified list and the rest from the others (each list already in weighted-random order),
// topping up from the other list when one runs out, then mixes the two so they alternate naturally.
function mixByShare(verified, others, limit, share) {
  let nV = Math.round(limit * share / 100), nO = limit - nV;
  if (verified.length < nV) { nO += nV - verified.length; nV = verified.length; }
  if (others.length < nO) { nV = Math.min(verified.length, nV + (nO - others.length)); nO = others.length; }
  const out = [...verified.slice(0, nV), ...others.slice(0, nO)];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}`],
  ["  const picked = pool.filter((r) => !seen.has(r.id)).map((r) => {\n    const interest = top ? (score.get(pk(r.province)) || 0) / top : 0; // 0..1\n    const b = badgeOf(r.badge, heatOf.get(r.id) || 0, r.created_at);\n    const w = (1 + 7 * interest) * (b === 'new' ? 8 : b === 'hot' ? 5 : 1) * (r.ver ? VERIFIED_BOOST : 1); // favourite regions up to 8x; new 8x, hot 5x; verified videos far ahead of the rest\n    return { id: r.id, key: -Math.log(1 - Math.random()) / w };\n  }).sort((a, b) => a.key - b.key).slice(0, limit).map((r) => r.id);",
   `  const fc = feedConf();
  const ranked = pool.filter((r) => !seen.has(r.id)).map((r) => {
    const interest = top ? (score.get(pk(r.province)) || 0) / top : 0; // 0..1
    const b = badgeOf(r.badge, heatOf.get(r.id) || 0, r.created_at);
    const w = (1 + fc.regionBoost * interest) * (b === 'new' ? fc.newBoost : b === 'hot' ? fc.hotBoost : 1); // boosts set by the admin
    return { id: r.id, ver: !!r.ver, key: -Math.log(1 - Math.random()) / w };
  }).sort((a, b) => a.key - b.key);
  const picked = mixByShare(ranked.filter((r) => r.ver).map((r) => r.id), ranked.filter((r) => !r.ver).map((r) => r.id), limit, fc.verifiedShare);`],
  ["  // random order, but verified videos are much more likely to come first (weighted random sampling)\n  const left = rows.filter((r) => !seen.has(r.id)).map((r) => ({ id: r.id, key: -Math.log(1 - Math.random()) / (r.ver ? VERIFIED_BOOST : 1) })).sort((a, b) => a.key - b.key).map((r) => r.id);\n  const pick = left.slice(0, limit);",
   `  // random order with the admin's verified / unverified mix
  const shuffled = rows.filter((r) => !seen.has(r.id)).map((r) => ({ id: r.id, ver: !!r.ver, key: Math.random() })).sort((a, b) => a.key - b.key);
  const left = shuffled.map((r) => r.id);
  const pick = mixByShare(shuffled.filter((r) => r.ver).map((r) => r.id), shuffled.filter((r) => !r.ver).map((r) => r.id), limit, feedConf().verifiedShare);`],
  ["app.get('/api/admin/videos', needAdmin,", `app.get('/api/admin/feed-conf', needAdmin, (_req, res) => {
  const counts = db.prepare('SELECT SUM(CASE WHEN (v.verified OR u.verified) THEN 1 ELSE 0 END) AS ver, COUNT(*) AS total FROM videos v JOIN users u ON u.id = v.user_id WHERE v.hidden = 0 AND u.banned = 0').get();
  res.json({ conf: feedConf(), defaults: FEED_DEFAULT, verifiedVideos: counts.ver || 0, totalVideos: counts.total || 0 });
});
app.put('/api/admin/feed-conf', needAdmin, (req, res) => {
  const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d; };
  const b = req.body || {};
  const conf = { verifiedShare: num(b.verifiedShare, 0, 100, 60), newBoost: num(b.newBoost, 1, 20, 8), hotBoost: num(b.hotBoost, 1, 20, 5), regionBoost: num(b.regionBoost, 0, 20, 7) };
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('feed_conf', JSON.stringify(conf));
  res.json({ ok: true, conf });
});
app.get('/api/admin/videos', needAdmin,`],
]);

// ---------- admin card ----------
edit('public/js/app.js', [
  ["  // up to 5 Telegram group links; the info sheet shows one of them at random", `  // recommendation mix: how much verified / new / hot / favourite-region videos are suggested
  const feedBox = (() => {
    const share = h('input', { type: 'range', min: 0, max: 100, step: 5, value: 60, style: 'flex:1' }), shareOut = h('b', { style: 'min-width:150px' });
    const num = (v) => h('input', { type: 'number', min: 0, max: 20, value: v, style: 'width:90px' });
    const newB = num(8), hotB = num(5), regB = num(7);
    const stat = h('p', { class: 'muted', style: 'font-size:13px' });
    const paint = () => { shareOut.textContent = share.value + '% đã xác minh · ' + (100 - share.value) + '% chưa xác minh'; };
    share.addEventListener('input', paint);
    const fill = (c) => { share.value = c.verifiedShare; newB.value = c.newBoost; hotB.value = c.hotBoost; regB.value = c.regionBoost; paint(); };
    api('/admin/feed-conf').then((d) => { fill(d.conf); stat.textContent = 'Hiện có ' + d.verifiedVideos + ' / ' + d.totalVideos + ' video đã xác minh. Nếu một nhóm hết video, website tự lấy thêm từ nhóm còn lại.'; }).catch(() => {});
    const save = async (body) => { try { const r = await api('/admin/feed-conf', { method: 'PUT', body }); fill(r.conf); toast('Đã lưu cách đề xuất video'); } catch (e) { fail(e); } };
    const row = (label, el, hint) => h('label', { class: 'row', style: 'gap:10px;align-items:center;flex-wrap:wrap' }, h('span', { style: 'min-width:230px' }, label), el, hint && h('span', { class: 'muted', style: 'font-size:12px' }, hint));
    paint();
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Đề xuất video'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:14px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Quyết định loại video nào khách được xem nhiều hơn ở trang chủ ("Dành cho bạn") và các trang khu vực. Thứ tự vẫn ngẫu nhiên, chỉ thay đổi tỉ lệ.'),
        row('Tỉ lệ video đã xác minh', h('div', { class: 'row', style: 'gap:10px;flex:1;min-width:220px;align-items:center' }, share, shareOut)),
        row('Ưu tiên video mới đăng (24 giờ)', newB, '1 = không ưu tiên, càng lớn càng hay xuất hiện'),
        row('Ưu tiên video đang hot', hotB, '1 = không ưu tiên'),
        row('Ưu tiên khu vực khách quan tâm', regB, '0 = không ưu tiên'),
        stat,
        h('div', { class: 'row', style: 'gap:8px' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => save({ verifiedShare: share.value, newBoost: newB.value, hotBoost: hotB.value, regionBoost: regB.value }) }, 'Lưu'),
          h('button', { class: 'btn', type: 'button', onclick: () => save({ verifiedShare: 60, newBoost: 8, hotBoost: 5, regionBoost: 7 }) }, 'Về mặc định'))));
  })();
  // up to 5 Telegram group links; the info sheet shows one of them at random`],
  ["trafficBox, shareBox, tgBox, statBox,", "trafficBox, shareBox, feedBox, tgBox, statBox,"],
]);
console.log('patched');
