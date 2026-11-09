// Profile page: the member's areas as filters (only their own videos), and a video opened from the profile plays the rest of
// that member's videos first, then random videos of other members in the same area, then random videos from everywhere.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('server.js', [
  [`  const own = req.user && req.user.id === uid ? uid : 0, size = pageSize();
  const where = "v.user_id = ? AND (v.hidden = 0 OR (v.hidden_by = 'owner' AND v.locked = 0 AND v.user_id = ?))";
  const total = db.prepare('SELECT COUNT(*) AS n FROM videos v WHERE ' + where).get(uid, own).n;
  const pages = Math.max(1, Math.ceil(total / size)), page = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1));
  const ids = db.prepare('SELECT v.id FROM videos v WHERE ' + where + ' ORDER BY v.id DESC LIMIT ? OFFSET ?').all(uid, own, size, (page - 1) * size).map((r) => r.id);`,
  `  const own = req.user && req.user.id === uid ? uid : 0, size = pageSize();
  const { where, args } = userVideoWhere(uid, own, req.query);
  const total = db.prepare('SELECT COUNT(*) AS n FROM videos v WHERE ' + where).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / size)), page = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1));
  const ids = db.prepare('SELECT v.id FROM videos v WHERE ' + where + ' ORDER BY v.id DESC LIMIT ? OFFSET ?').all(...args, size, (page - 1) * size).map((r) => r.id);`],
  ["app.get('/api/users/:id(\\\\d+)/videos-page', (req, res) => {", `// a member's videos, optionally in one area only (the owner also sees the videos they hid themselves)
function userVideoWhere(uid, own, q) {
  const area = readArea(q || {});
  return {
    where: "v.user_id = ? AND (v.hidden = 0 OR (v.hidden_by = 'owner' AND v.locked = 0 AND v.user_id = ?)) AND (? = '' OR v.region = ?) AND (? = '' OR v.province = ?) AND (? = '' OR v.district = ?)",
    args: [uid, own, area.region, area.region, area.province, area.province, area.district, area.district],
  };
}
// the areas a member has videos in (for the filter on their profile)
app.get('/api/users/:id(\\\\d+)/areas', (req, res) => {
  const uid = Number(req.params.id);
  const rows = db.prepare(\`SELECT region, province, district, COUNT(*) AS n FROM videos WHERE user_id = ? AND hidden = 0 AND region <> '' AND province <> ''
    GROUP BY region, province, district ORDER BY n DESC\`).all(uid);
  res.json({ areas: rows.map((r) => ({ region: r.region, province: r.province, district: r.district || '', count: r.n })) });
});
// every id of a member's videos (in one area if asked), in the profile grid's order: used to play them one after another
app.get('/api/users/:id(\\\\d+)/video-ids', (req, res) => {
  const uid = Number(req.params.id), own = req.user && req.user.id === uid ? uid : 0;
  const { where, args } = userVideoWhere(uid, own, req.query);
  res.json({ ids: db.prepare('SELECT v.id FROM videos v WHERE ' + where + ' ORDER BY v.id DESC LIMIT 3000').all(...args).map((r) => r.id) });
});
// random videos of OTHER members in the same area (district, else province, else region), never repeating what was seen
app.get('/api/area-random', (req, res) => {
  let area = readArea(req.query);
  if (!area.region && req.query.from) { const v = db.prepare('SELECT region, province, district FROM videos WHERE id = ?').get(Number(req.query.from)); if (v) area = readArea(v); }
  const exclude = Number(req.query.exclude) || 0;
  const seen = String(req.query.seen || '').split(',').map(Number).filter((n) => n > 0).slice(-800);
  const seenList = ',' + seen.join(',') + ',';
  const levels = [area.district && { ...area }, area.province && { ...area, district: '' }, area.region && { region: area.region, province: '', district: '' }].filter(Boolean);
  for (const a of levels) {
    const ids = db.prepare(\`SELECT v.id FROM videos v JOIN users u ON u.id = v.user_id
      WHERE v.hidden = 0 AND u.banned = 0 AND v.user_id <> ? AND v.region = ? AND (? = '' OR v.province = ?) AND (? = '' OR v.district = ?)
        AND instr(?, ',' || v.id || ',') = 0 ORDER BY RANDOM() LIMIT 8\`).all(exclude, a.region, a.province, a.province, a.district, a.district, seenList).map((r) => r.id);
    if (ids.length) {
      const byId = new Map(listVideos(req.user, { ids, limit: ids.length }).map((v) => [v.id, v]));
      return res.json({ videos: ids.map((id) => byId.get(id)).filter(Boolean), area: a });
    }
  }
  res.json({ videos: [], area: null });
});
app.get('/api/users/:id(\\\\d+)/videos-page', (req, res) => {`],
]);

edit('public/js/app.js', [
  // ---- profile: area filter ----
  [`  // the member's videos, one numbered page at a time
  const userGrid = h('div', { class: 'tgrid' }), userPager = h('div', { class: 'pager' });
  const goUser = async (p) => {
    userGrid.replaceChildren(h('div', { class: 'spin', style: 'grid-column:1/-1' }));
    try {
      const d = await api('/users/' + user.id + '/videos-page?page=' + p);`,
  `  // the member's videos, one numbered page at a time, optionally in one of their areas
  const userGrid = h('div', { class: 'tgrid' }), userPager = h('div', { class: 'pager' });
  let area = { region: '', province: '', district: '' };
  const areaQ = () => new URLSearchParams(area).toString();
  const areaBar = h('div', { class: 'tk-areas' });
  api('/users/' + user.id + '/areas').then(({ areas }) => {
    if (!areas.length) return;
    // provinces as chips; a chosen province with several districts shows them below
    const provs = new Map();
    for (const a of areas) { const k = a.region + '|' + a.province; if (!provs.has(k)) provs.set(k, { region: a.region, province: a.province, count: 0, districts: [] }); const p = provs.get(k); p.count += a.count; if (a.district) p.districts.push(a); }
    const list = [...provs.values()].sort((a, b) => b.count - a.count);
    const total = areas.reduce((n, a) => n + a.count, 0);
    const paint = () => {
      const chip = (label, n, on, pick) => h('button', { type: 'button', class: 'chip' + (on ? ' on' : ''), onclick: pick }, label, h('span', { class: 'tk-n' }, String(n)));
      const choose = (a) => { area = a; paint(); goUser(1); };
      const row1 = h('div', { class: 'row chips-scroll tk-arow' }, chip('Tất cả khu vực', total, !area.province, () => choose({ region: '', province: '', district: '' })),
        list.map((p) => chip(p.province, p.count, area.province === p.province && area.region === p.region, () => choose({ region: p.region, province: p.province, district: '' }))));
      const cur = list.find((p) => p.province === area.province && p.region === area.region);
      const row2 = cur && cur.districts.length > 1 ? h('div', { class: 'row chips-scroll tk-arow sub' }, chip('Cả ' + cur.province, cur.count, !area.district, () => choose({ ...area, district: '' })),
        cur.districts.map((d) => chip(d.district, d.count, area.district === d.district, () => choose({ ...area, district: d.district })))) : '';
      areaBar.replaceChildren(h('div', { class: 'tk-alabel', html: icon('pin') + '<span>Khu vực của ' + esc(user.name) + '</span>' }), row1, row2);
    };
    paint();
  }).catch(() => {});
  const goUser = async (p) => {
    userGrid.replaceChildren(h('div', { class: 'spin', style: 'grid-column:1/-1' }));
    try {
      const d = await api('/users/' + user.id + '/videos-page?page=' + p + '&' + areaQ());`],
  ["      else userGrid.replaceChildren(...d.videos.map(cell));\n      renderPager(userPager, d.page, d.pages, (x) => { goUser(x); userGrid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });",
   "      else userGrid.replaceChildren(...d.videos.map((v) => { const c = cell(v); c.addEventListener('click', () => { S.feedCtx = { kind: 'user', userId: user.id, ...area, startId: v.id }; }); return c; }));\n      renderPager(userPager, d.page, d.pages, (x) => { goUser(x); userGrid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });"],
  ["  const videosNodes = [userGrid, userPager];", "  const videosNodes = [areaBar, userGrid, userPager];"],
  // ---- feed: profile context ----
  [`  let queue = null;
  if (ctx) {
    try {
      const q = new URLSearchParams({ region: ctx.region, province: ctx.province, district: ctx.district, seed: ctx.seed });
      const { ids } = await api('/area-order?' + q);`,
  `  let queue = null, others = null; // others: after a member's own videos, random videos of other members in the same area
  if (ctx && ctx.kind === 'user') {
    try {
      const q = new URLSearchParams({ region: ctx.region || '', province: ctx.province || '', district: ctx.district || '' });
      const { ids } = await api('/users/' + ctx.userId + '/video-ids?' + q);
      const pos = ids.indexOf(Number(startId));
      queue = pos >= 0 ? [...ids.slice(pos + 1), ...ids.slice(0, pos)] : ids.filter((x) => x !== Number(startId));
      seen.push(Number(startId));
      others = { ...Object.fromEntries(q), exclude: ctx.userId, from: startId };
    } catch { queue = null; }
  } else if (ctx) {
    try {
      const q = new URLSearchParams({ region: ctx.region, province: ctx.province, district: ctx.district, seed: ctx.seed });
      const { ids } = await api('/area-order?' + q);`],
  [`      if (queue) home = true; // the area is finished: continue with random videos from everywhere (never repeating)`,
   `      if (others) { // the member's videos are done: other members of the same area, at random, never repeating
        const { videos } = await api('/area-random?' + new URLSearchParams({ ...others, seen: seen.slice(-500).join(',') }));
        if (videos.length) {
          if (!others.told) { others.told = true; box.append(h('div', { class: 'slide' }, h('div', { class: 'endcap' }, 'Bạn đã xem hết video của người này 🎉', h('small', {}, 'Tiếp theo: video khác cùng khu vực ↓')))); }
          videos.forEach((v) => { seen.push(v.id); box.append(slide(v)); });
          first = false; loading = false; return;
        }
        others = null;
      }
      if (queue) home = true; // the area is finished: continue with random videos from everywhere (never repeating)`],
]);

fs.appendFileSync('public/css/app.css', `
/* profile: the member's areas */
.tk-areas{margin:14px 0 4px;display:grid;gap:8px}
.tk-areas:empty{display:none}
.tk-alabel{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:var(--muted)}
.tk-alabel svg{width:16px;height:16px}
.tk-arow{gap:8px;flex-wrap:wrap}
.tk-arow .chip{min-height:36px;font-size:13.5px}
.tk-arow.sub .chip{min-height:32px;font-size:13px;background:rgba(255,255,255,.03)}
.tk-n{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:rgba(255,255,255,.14);font-size:11.5px;font-weight:700}
.chip.on .tk-n{background:rgba(0,0,0,.2)}
.endcap small{display:block;margin-top:8px;font-size:14px;font-weight:500;opacity:.8}
`);
console.log('patched');
