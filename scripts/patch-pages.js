// Numbered pages (default 15 videos per page) on area pages and member profiles; the admin sets the page size.
const fs = require('fs');
function between(file, startMarker, endMarker, replacement, keepEnd = true) {
  const s = fs.readFileSync(file, 'utf8');
  const a = s.indexOf(startMarker), b = s.indexOf(endMarker, a + 1);
  if (a < 0 || b < 0) throw new Error('markers not found in ' + file + ': ' + startMarker.slice(0, 50));
  fs.writeFileSync(file, s.slice(0, a) + replacement + (keepEnd ? s.slice(b) : s.slice(b + endMarker.length)));
}
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

// ---------- server ----------
between('server.js', "app.get('/api/area-videos', (req, res) => {", '// How many videos each region / province / district has', `// Videos per page on area pages and profiles (admin setting, default 15)
const pageSize = () => { const r = db.prepare('SELECT value FROM settings WHERE key = ?').get('page_size'); const n = r ? Number(r.value) : 15; return n >= 3 && n <= 60 ? n : 15; };
const seededRandom = (seed) => { let a = (Number(seed) >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// Videos of one area, one numbered page at a time. The order is random per visit (the browser sends a seed) but stays the same while
// the visitor moves between pages, and every page follows the admin's verified / not-verified mix.
app.get('/api/area-videos', (req, res) => {
  const area = readArea(req.query);
  if (!area.region) return fail(res, 400, 'Khu vực không hợp lệ');
  const size = pageSize(), rnd = seededRandom(req.query.seed || Date.now());
  const rows = db.prepare(
    \`SELECT v.id, (v.verified OR u.verified) AS ver FROM videos v JOIN users u ON u.id = v.user_id
     WHERE v.hidden = 0 AND u.banned = 0 AND v.region = ? AND (? = '' OR v.province = ?) AND (? = '' OR v.district = ?) ORDER BY v.id\`
  ).all(area.region, area.province, area.province, area.district, area.district);
  const shuffle = (list) => { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; };
  const ver = shuffle(rows.filter((r) => r.ver).map((r) => r.id)), oth = shuffle(rows.filter((r) => !r.ver).map((r) => r.id));
  const share = feedConf().verifiedShare, order = [];
  while (ver.length || oth.length) { // build page after page with the admin's mix
    let nV = Math.round(size * share / 100), nO = size - nV;
    if (ver.length < nV) { nO += nV - ver.length; nV = ver.length; }
    if (oth.length < nO) { nV = Math.min(ver.length, nV + nO - oth.length); nO = oth.length; }
    order.push(...shuffle([...ver.splice(0, nV), ...oth.splice(0, nO)]));
  }
  const pages = Math.max(1, Math.ceil(order.length / size)), page = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1));
  const pick = order.slice((page - 1) * size, page * size);
  const byId = new Map(pick.length ? listVideos(req.user, { ids: pick, limit: pick.length }).map((v) => [v.id, v]) : []);
  res.json({ videos: pick.map((id) => byId.get(id)).filter(Boolean), total: order.length, page, pages, pageSize: size });
});

// A member's videos, newest first, one numbered page at a time (the owner also sees the videos they hid)
app.get('/api/users/:id(\\\\d+)/videos-page', (req, res) => {
  const uid = Number(req.params.id);
  if (!db.prepare('SELECT 1 FROM users WHERE id = ? AND banned = 0').get(uid)) return fail(res, 404, 'Không tìm thấy người dùng');
  const own = req.user && req.user.id === uid ? uid : 0, size = pageSize();
  const where = "v.user_id = ? AND (v.hidden = 0 OR (v.hidden_by = 'owner' AND v.locked = 0 AND v.user_id = ?))";
  const total = db.prepare('SELECT COUNT(*) AS n FROM videos v WHERE ' + where).get(uid, own).n;
  const pages = Math.max(1, Math.ceil(total / size)), page = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1));
  const ids = db.prepare('SELECT v.id FROM videos v WHERE ' + where + ' ORDER BY v.id DESC LIMIT ? OFFSET ?').all(uid, own, size, (page - 1) * size).map((r) => r.id);
  const byId = new Map(ids.length ? listVideos(req.user, { ids, limit: ids.length }).map((v) => [v.id, v]) : []);
  res.json({ videos: ids.map((id) => byId.get(id)).filter(Boolean), total, page, pages, pageSize: size });
});
app.put('/api/admin/page-size', needAdmin, (req, res) => {
  const n = Math.round(Number(req.body.pageSize));
  if (!(n >= 3 && n <= 60)) return fail(res, 400, 'Số video mỗi trang phải từ 3 đến 60');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('page_size', String(n));
  res.json({ ok: true, pageSize: n });
});

`);
edit('server.js', [["telegram: t[0] || '', partner: getConf('partner_url') });", "telegram: t[0] || '', partner: getConf('partner_url'), pageSize: pageSize() });"]]);

// ---------- client: pager ----------
edit('public/js/app.js', [["// One tile of the area / profile grids (cover image, badges, likes)", `// Numbered page buttons: ‹ 1 … 4 5 [6] 7 8 … 20 ›
function renderPager(el, page, pages, onGo) {
  el.replaceChildren();
  if (pages <= 1) return;
  const btn = (label, p, cls = '') => h('button', { type: 'button', class: 'pg ' + cls, disabled: p < 1 || p > pages || p === page, 'aria-label': 'Trang ' + p, onclick: () => onGo(p) }, label);
  let a = Math.max(1, page - 2), b = Math.min(pages, a + 4); a = Math.max(1, b - 4);
  const items = [btn('‹', page - 1, 'nav')];
  if (a > 1) items.push(btn('1', 1), a > 2 && h('span', { class: 'pg-dots' }, '…'));
  for (let i = a; i <= b; i++) items.push(btn(String(i), i, i === page ? 'on' : ''));
  if (b < pages) items.push(b < pages - 1 && h('span', { class: 'pg-dots' }, '…'), btn(String(pages), pages));
  items.push(btn('›', page + 1, 'nav'));
  el.append(h('div', { class: 'pg-row' }, items.filter(Boolean)), h('div', { class: 'pg-info muted' }, 'Trang ' + page + ' / ' + pages));
}

// One tile of the area / profile grids (cover image, badges, likes)`]]);

// ---------- client: area pages ----------
between('public/js/app.js', "    const more = h('button', { class: 'btn', type: 'button', hidden: true, style: 'margin:18px auto 0;display:flex' }, 'Xem thêm video');",
  "  main.append(wrap, footer());\n}\n\n// ---------- search", `    const pagerEl = h('div', { class: 'pager' });
    const first = h('div', { class: 'spin' });
    wrap.append(h('h2', { class: 'title' }, dist || prov, count), chips, first, grid, pagerEl, seoBox(info));
    const seed = Math.floor(Math.random() * 1e9); // new random order on each visit, kept while moving between pages
    const go = async (page) => {
      grid.replaceChildren(h('div', { class: 'spin', style: 'grid-column:1/-1' }));
      try {
        const d = await api('/area-videos?page=' + page + '&seed=' + seed + '&region=' + reg + '&province=' + enc(prov) + (dist ? '&district=' + enc(dist) : ''));
        first.remove();
        count.textContent = d.total ? '· ' + d.total + ' video' : '';
        if (!d.total) grid.replaceChildren(h('div', { class: 'card empty', style: 'grid-column:1/-1' }, h('div', { class: 'ico', html: icon('video') }), h('h3', {}, 'Chưa có video ở khu vực này'), h('p', {}, 'Hãy là người đầu tiên đăng video tại đây.'), h('a', { class: 'btn primary', style: 'margin-top:12px', href: '#/upload' }, 'Đăng video')));
        else grid.replaceChildren(...d.videos.map(areaTile));
        renderPager(pagerEl, d.page, d.pages, (p) => { go(p); wrap.querySelector('h2.title').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      } catch (e) { first.remove(); grid.replaceChildren(); fail(e); }
    };
    go(1);
  }
`);

// ---------- client: profile ----------
edit('public/js/app.js', [["  const videosNodes = [videos.length ? h('div', { class: 'tgrid' }, videos.map(cell)) : h('div', { class: 'card empty' }, h('p', {}, 'Chưa có video.'))];",
  `  // the member's videos, one numbered page at a time
  const userGrid = h('div', { class: 'tgrid' }), userPager = h('div', { class: 'pager' });
  const goUser = async (p) => {
    userGrid.replaceChildren(h('div', { class: 'spin', style: 'grid-column:1/-1' }));
    try {
      const d = await api('/users/' + user.id + '/videos-page?page=' + p);
      if (!d.total) userGrid.replaceChildren(h('div', { class: 'card empty', style: 'grid-column:1/-1' }, h('p', {}, 'Chưa có video.')));
      else userGrid.replaceChildren(...d.videos.map(cell));
      renderPager(userPager, d.page, d.pages, (x) => { goUser(x); userGrid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    } catch (e) { userGrid.replaceChildren(); fail(e); }
  };
  const videosNodes = [userGrid, userPager];
  goUser(1);`]]);
between('public/js/app.js', '  // members with many videos: keep loading older ones while scrolling, until all are shown', '\n}\n\nasync function pageMe()', '', true);

// ---------- client: admin setting ----------
edit('public/js/app.js', [["  // link to another website (\"Xem Video Hẹn Hò\" button in every info sheet)", `  // how many videos per page on area pages and profiles
  const pageBox = (() => {
    const inp = h('input', { type: 'number', min: 3, max: 60, value: 15, style: 'width:110px' });
    api('/site-config').then((c) => { inp.value = c.pageSize || 15; }).catch(() => {});
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Số video mỗi trang'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Số video hiện trên mỗi trang ở các trang khu vực và trang hồ sơ thành viên. Nhiều hơn số này thì có nút chuyển sang trang tiếp theo. Ít video mỗi trang giúp trang tải nhanh hơn.'),
        h('div', { class: 'row', style: 'gap:10px;align-items:center;flex-wrap:wrap' }, inp, h('span', { class: 'muted' }, 'video / trang (từ 3 đến 60)'),
          h('button', { class: 'btn primary', type: 'button', onclick: async () => { try { const r = await api('/admin/page-size', { method: 'PUT', body: { pageSize: inp.value } }); inp.value = r.pageSize; toast('Đã lưu: ' + r.pageSize + ' video mỗi trang'); } catch (e) { fail(e); } } }, 'Lưu'))));
  })();
  // link to another website ("Xem Video Hẹn Hò" button in every info sheet)`],
  ["trafficBox, shareBox, feedBox, tgBox, partnerBox, statBox,", "trafficBox, shareBox, feedBox, pageBox, tgBox, partnerBox, statBox,"],
]);

fs.appendFileSync('public/css/app.css', `
/* numbered pages */
.pager{margin:18px 0 6px;display:grid;gap:8px;justify-items:center}
.pg-row{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.pg{min-width:42px;height:42px;padding:0 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--text);font:inherit;font-weight:700;cursor:pointer}
.pg.on{background:var(--grad);border-color:transparent;color:#fff;opacity:1}
.pg:disabled:not(.on){opacity:.35;cursor:default}
.pg.nav{font-size:20px;line-height:1}
.pg-dots{align-self:center;color:var(--muted);padding:0 2px}
.pg-info{font-size:13px}
`);
console.log('patched');
