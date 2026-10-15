// One-off patch: admin member sorting, roomy address box on phones, full video history on profiles.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---------- server: sorting ----------
rep('server.js', "  const page = Math.max(parseInt(req.query.page, 10) || 0, 0), size = 30;",
  "  const page = Math.max(parseInt(req.query.page, 10) || 0, 0), size = 30;\n  const order = { videos: 'videos DESC, u.id DESC', followers: 'followers DESC, u.id DESC', likes: 'likes DESC, u.id DESC', oldest: 'u.id ASC' }[req.query.sort] || 'u.id DESC';");
rep('server.js', "FROM users u WHERE ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`", "FROM users u WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`");

// ---------- server: every video of a member, in pages ----------
rep('server.js', "app.get('/api/users/:id/phone', needUser,", `app.get('/api/users/:id(\\\\d+)/videos', (req, res) => {
  const u = db.prepare('SELECT id FROM users WHERE id = ? AND banned = 0').get(req.params.id);
  if (!u) return fail(res, 404, 'Không tìm thấy người dùng');
  const before = parseInt(req.query.before, 10) || null;
  res.json({ videos: listVideos(req.user, { userId: u.id, before, limit: 60 }) });
});

app.get('/api/users/:id/phone', needUser,`);

// ---------- client: admin sort ----------
rep('public/js/app.js', "  const qIn = h('input', { type: 'search', placeholder: 'Tìm theo email hoặc tên…', style: 'max-width:340px' });",
`  const qIn = h('input', { type: 'search', placeholder: 'Tìm theo email hoặc tên…', style: 'flex:1;min-width:200px' });
  const sortSel = h('select', { 'aria-label': 'Sắp xếp', style: 'width:auto' }, [['newest', 'Mới đăng ký nhất'], ['videos', 'Nhiều video nhất'], ['followers', 'Nhiều người theo dõi nhất'], ['likes', 'Nhiều lượt thích nhất'], ['oldest', 'Đăng ký lâu nhất']].map(([v, l]) => h('option', { value: v }, l)));
  sortSel.addEventListener('change', () => { page = 0; loadMembers().catch(fail); });`);
rep('public/js/app.js', "+ '&q=' + encodeURIComponent(qIn.value.trim()));", "+ '&q=' + encodeURIComponent(qIn.value.trim()) + '&sort=' + sortSel.value);");
rep('public/js/app.js', "h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Thành viên đã đăng ký'), qIn, memInfo,",
  "h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Thành viên đã đăng ký'), h('div', { class: 'row', style: 'gap:10px;flex-wrap:wrap' }, qIn, sortSel), memInfo,");

// ---------- client: nearby layout ----------
rep('public/js/app.js', "h('div', { class: 'row', style: 'flex-wrap:nowrap;align-items:flex-start' }, h('div', { style: 'flex:1;min-width:0' }, picker.el), go),",
  "h('div', { class: 'near-row' }, h('div', { class: 'near-pick' }, picker.el), go),");

// ---------- client: profile shows every video (infinite scroll) ----------
rep('public/js/app.js', "    videos.length ? h('div', { class: 'tgrid' }, videos.map(cell)) : h('div', { class: 'card empty' }, h('p', {}, 'Chưa có video.')));\n  main.append(w, footer());",
`    videos.length ? h('div', { class: 'tgrid' }, videos.map(cell)) : h('div', { class: 'card empty' }, h('p', {}, 'Chưa có video.')));
  main.append(w, footer());
  // members with many videos: keep loading older ones while scrolling, until all are shown
  const grid = w.querySelector('.tgrid');
  if (grid && videos.length >= 60) {
    let last = videos[videos.length - 1].id, busy = false, finished = false;
    const sentinel = h('div', { style: 'height:1px' });
    grid.after(sentinel);
    const io = new IntersectionObserver(async (en) => {
      if (!en[0].isIntersecting || busy || finished) return;
      busy = true;
      try {
        const r = await api('/users/' + user.id + '/videos?before=' + last);
        r.videos.forEach((v) => grid.append(cell(v)));
        if (r.videos.length) last = r.videos[r.videos.length - 1].id;
        if (r.videos.length < 60) { finished = true; io.disconnect(); sentinel.remove(); }
      } catch {}
      busy = false;
      if (!finished) { io.unobserve(sentinel); io.observe(sentinel); } // re-check in case the sentinel is still on screen
    }, { rootMargin: '600px' });
    io.observe(sentinel);
    S.cleanups.push(() => io.disconnect());
  }`);
rep('public/js/app.js', "h('span', { class: 'on', html: icon('video') + '<span>Video</span>' })", "h('span', { class: 'on', html: icon('video') + '<span>Video (' + stats.videos + ')</span>' })");

fs.appendFileSync('public/css/app.css', `
/* "Tìm quanh đây": address box + button */
.near-row{display:flex;gap:10px;align-items:flex-start}
.near-pick{flex:1;min-width:0}
@media (max-width:760px){
  .near-row{flex-direction:column;align-items:stretch}
  .near-row .btn{width:100%;min-height:50px;justify-content:center}
  .near-pick input{min-height:52px;font-size:16px}
  .near-pick .picker{width:100%}
}
`);
console.log('patched');
