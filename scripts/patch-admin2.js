// One-off patch: follow system, visitor analytics (online now / per day) and a member list for the admin page.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---------- db ----------
rep('src/db.js', 'CREATE TABLE IF NOT EXISTS reports (', `CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER NOT NULL,
  followee_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);
CREATE TABLE IF NOT EXISTS presence (
  did TEXT NOT NULL,
  day TEXT NOT NULL,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (did, day)
);
CREATE INDEX IF NOT EXISTS idx_presence_last ON presence(last_seen);
CREATE TABLE IF NOT EXISTS reports (`);

// ---------- server ----------
rep('server.js', "app.get('/api/admin/reports', needAdmin,", `// ---------- visitor analytics ----------
// Every open page pings now and then with an anonymous device id; "online now" = pinged in the last ~70 s.
const vnDay = (t = now()) => new Date(t + 7 * 3600_000).toISOString().slice(0, 10); // Vietnam time (UTC+7)
const pingLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false });
app.post('/api/ping', pingLimiter, (req, res) => {
  const did = String(req.body.did || '').replace(/[^\\w-]/g, '').slice(0, 40);
  if (did.length < 8) return res.json({ ok: true });
  const t = now();
  db.prepare(
    \`INSERT INTO presence (did, day, first_seen, last_seen, hits) VALUES (?,?,?,?,?)
     ON CONFLICT(did, day) DO UPDATE SET last_seen = excluded.last_seen, hits = hits + excluded.hits\`
  ).run(did, vnDay(t), t, t, req.body.pv ? 1 : 0);
  res.json({ ok: true });
});
app.get('/api/admin/traffic', needAdmin, (_req, res) => {
  const t = now(), today = vnDay(t), yesterday = vnDay(t - 86400_000);
  const day = (d) => db.prepare('SELECT COUNT(*) AS visitors, COALESCE(SUM(hits), 0) AS views FROM presence WHERE day = ?').get(d);
  const daily = db.prepare('SELECT day, COUNT(*) AS visitors, COALESCE(SUM(hits), 0) AS views FROM presence WHERE day >= ? GROUP BY day ORDER BY day DESC').all(vnDay(t - 13 * 86400_000));
  res.json({
    online: db.prepare('SELECT COUNT(*) AS n FROM presence WHERE last_seen > ?').get(t - 70_000).n,
    today: day(today), yesterday: day(yesterday), daily,
    allTime: db.prepare('SELECT COUNT(DISTINCT did) AS n FROM presence').get().n,
  });
});

// ---------- members (admin) ----------
app.get('/api/admin/users', needAdmin, (req, res) => {
  const q = '%' + String(req.query.q || '').toLowerCase().replace(/[%_]/g, '').slice(0, 60) + '%';
  const page = Math.max(parseInt(req.query.page, 10) || 0, 0), size = 30;
  const where = "(lower(u.email) LIKE ? OR lower(u.name) LIKE ?)";
  const total = db.prepare('SELECT COUNT(*) AS n FROM users u WHERE ' + where).get(q, q).n;
  const users = db.prepare(
    \`SELECT u.id, u.email, u.name, u.role, u.banned, u.created_at,
       (SELECT COUNT(*) FROM videos v WHERE v.user_id = u.id AND v.hidden = 0) AS videos,
       (SELECT COUNT(*) FROM likes l JOIN videos v ON v.id = l.video_id WHERE v.user_id = u.id) AS likes,
       (SELECT COUNT(*) FROM follows f WHERE f.followee_id = u.id) AS followers
     FROM users u WHERE \${where} ORDER BY u.id DESC LIMIT ? OFFSET ?\`).all(q, q, size, page * size);
  res.json({ users, total, page, size });
});

// ---------- follow ----------
app.post('/api/users/:id(\\\\d+)/follow', needUser, postLimiter, (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return fail(res, 400, 'Không thể tự theo dõi mình');
  if (!db.prepare('SELECT 1 FROM users WHERE id = ? AND banned = 0').get(id)) return fail(res, 404, 'Không tìm thấy người dùng');
  const had = db.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').run(req.user.id, id).changes;
  if (!had) db.prepare('INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?,?,?)').run(req.user.id, id, now());
  res.json({ following: !had, followers: db.prepare('SELECT COUNT(*) AS n FROM follows WHERE followee_id = ?').get(id).n });
});

app.get('/api/admin/reports', needAdmin,`);

rep('server.js', "  res.json({ user: publicUser(u), videos: listVideos(req.user, { userId: u.id, limit: 60 }), stats });",
`  stats.followers = db.prepare('SELECT COUNT(*) AS n FROM follows WHERE followee_id = ?').get(u.id).n;
  const following = !!(req.user && db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?').get(req.user.id, u.id));
  res.json({ user: publicUser(u), videos: listVideos(req.user, { userId: u.id, limit: 60 }), stats, following });`);

// ---------- client: ping ----------
rep('public/js/app.js', "  window.addEventListener('hashchange', route);\n  route();", `  window.addEventListener('hashchange', () => { route(); ping(true); });
  route();
  ping(true);
  setInterval(() => { if (document.visibilityState === 'visible') ping(false); }, 25000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ping(false); });`);
rep('public/js/app.js', "// ---------- install app (PWA) ----------", `// ---------- visitor ping (anonymous device id; lets the admin see online visitors and daily traffic) ----------
function ping(pv) {
  try {
    let d = localStorage.getItem('xg_did');
    if (!d) { d = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^\\w-]/g, ''); localStorage.setItem('xg_did', d); }
    fetch('/api/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ did: d, pv: !!pv }), keepalive: true }).catch(() => {});
  } catch {}
}

// ---------- install app (PWA) ----------`);

// ---------- client: follow on profile ----------
rep('public/js/app.js', "  const { user, videos, stats } = await api('/users/' + id);", "  const { user, videos, stats, following } = await api('/users/' + id);");
rep('public/js/app.js', "h('div', { class: 'tk-stats' }, stat(stats.videos, 'Video'), stat(stats.likes, 'Lượt thích'), stat(stats.views, 'Lượt xem')),",
  "h('div', { class: 'tk-stats' }, stat(stats.followers, 'Người theo dõi'), stat(stats.videos, 'Video'), stat(stats.likes, 'Lượt thích'), stat(stats.views, 'Lượt xem')),");
rep('public/js/app.js', "      ? [h('button', { class: 'btn primary', onclick: () => startChat(user), html: icon('send') + '<span>Nhắn tin</span>' }),",
`      ? [followBtn,
        h('button', { class: 'btn', onclick: () => startChat(user), html: icon('send') + '<span>Nhắn tin</span>' }),`);
rep('public/js/app.js', "  const head = h('div', { class: 'tk-head' },", `  const followBtn = h('button', { class: 'btn primary follow' + (following ? ' on' : '') }, following ? 'Đang theo dõi' : 'Theo dõi');
  followBtn.addEventListener('click', async () => {
    if (!(await needLogin())) return;
    try {
      const r = await api('/users/' + user.id + '/follow', { method: 'POST' });
      followBtn.classList.toggle('on', r.following); followBtn.textContent = r.following ? 'Đang theo dõi' : 'Theo dõi';
      const n = document.querySelector('.tk-stats .pstat b'); if (n) n.textContent = fmtCount(r.followers);
    } catch (e) { fail(e); }
  });
  const head = h('div', { class: 'tk-head' },`);

// ---------- client: admin ----------
rep('public/js/app.js', "  const [{ reports }, st] = await Promise.all([api('/admin/reports'), api('/admin/app-stats')]);",
  "  const [{ reports }, st, tr] = await Promise.all([api('/admin/reports'), api('/admin/app-stats'), api('/admin/traffic')]);");
rep('public/js/app.js', "  main.append(h('div', { class: 'wrap', style: 'padding:32px 0' }, statBox,", `  const big = (label, val, note) => h('div', { class: 'card', style: 'padding:16px;flex:1;min-width:150px' }, h('div', { class: 'muted', style: 'font-size:13px' }, label), h('div', { style: 'font-size:32px;font-weight:800;margin:4px 0' }, val), note && h('div', { class: 'muted', style: 'font-size:12px' }, note));
  const onlineEl = h('span', {}, String(tr.online));
  const trafficBox = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:16px' }, 'Lượng truy cập website'),
    h('div', { class: 'row', style: 'gap:14px;flex-wrap:wrap;margin-bottom:16px' },
      big('Đang xem website lúc này', h('span', {}, h('span', { style: 'color:#34d399' }, '● '), onlineEl), 'Tự cập nhật mỗi 20 giây'),
      big('Khách truy cập hôm nay', String(tr.today.visitors), 'Mỗi thiết bị tính 1 lần/ngày · hôm qua: ' + tr.yesterday.visitors),
      big('Lượt xem trang hôm nay', String(tr.today.views), 'Hôm qua: ' + tr.yesterday.views),
      big('Tổng số thiết bị đã vào', String(tr.allTime), 'Từ khi bật thống kê')),
    tr.daily.length ? h('div', { class: 'card', style: 'overflow:auto' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['Ngày (giờ Việt Nam)', 'Khách truy cập', 'Lượt xem trang'].map((x) => h('th', {}, x)))),
      h('tbody', {}, tr.daily.map((d) => h('tr', {}, h('td', {}, d.day), h('td', {}, String(d.visitors)), h('td', {}, String(d.views))))))) : h('p', { class: 'muted' }, 'Chưa có dữ liệu. Số liệu bắt đầu đếm từ khi website cập nhật bản này.'));
  const tick = setInterval(async () => { try { onlineEl.textContent = String((await api('/admin/traffic')).online); } catch {} }, 20000);
  S.cleanups.push(() => clearInterval(tick));
  // member list
  const memBody = h('tbody', {}), memInfo = h('div', { class: 'muted', style: 'margin:10px 0;font-size:14px' }), pager = h('div', { class: 'row', style: 'gap:8px;margin-top:12px' });
  const qIn = h('input', { type: 'search', placeholder: 'Tìm theo email hoặc tên…', style: 'max-width:340px' });
  let page = 0, qt;
  const loadMembers = async () => {
    const d = await api('/admin/users?page=' + page + '&q=' + encodeURIComponent(qIn.value.trim()));
    memInfo.textContent = 'Tổng số thành viên: ' + d.total;
    memBody.replaceChildren(...d.users.map((u) => h('tr', {}, h('td', {}, String(u.id)), h('td', { translate: 'no', style: 'word-break:break-all' }, u.email), h('td', { translate: 'no' }, u.name + (u.role === 'admin' ? ' (admin)' : '')),
      h('td', {}, String(u.videos)), h('td', {}, String(u.followers)), h('td', {}, String(u.likes)), h('td', {}, new Date(u.created_at).toLocaleDateString('vi-VN')),
      h('td', {}, u.banned ? h('span', { class: 'muted' }, 'Đã khoá') : u.role === 'admin' ? '' : h('button', { class: 'btn sm', onclick: async () => { if (confirm('Khoá tài khoản ' + u.email + '?')) { await api('/admin/users/' + u.id + '/ban', { method: 'POST' }); loadMembers(); } } }, 'Khoá')))));
    pager.replaceChildren(page > 0 && h('button', { class: 'btn sm', onclick: () => { page--; loadMembers(); } }, '← Trước'), (page + 1) * d.size < d.total && h('button', { class: 'btn sm', onclick: () => { page++; loadMembers(); } }, 'Sau →'));
  };
  qIn.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(() => { page = 0; loadMembers().catch(fail); }, 300); });
  await loadMembers().catch(fail);
  const membersBox = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Thành viên đã đăng ký'), qIn, memInfo,
    h('div', { class: 'card', style: 'overflow:auto' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['ID', 'Email', 'Tên', 'Video', 'Theo dõi', 'Lượt thích', 'Ngày đăng ký', ''].map((x) => h('th', {}, x)))), memBody)), pager);
  main.append(h('div', { class: 'wrap', style: 'padding:32px 0' }, trafficBox, membersBox, statBox,`);

fs.appendFileSync('public/css/app.css', `
.btn.follow.on{background:var(--surface2);border:1px solid var(--line);color:var(--text);box-shadow:none}
.tk-actions .btn span{white-space:nowrap}
.tk-stats .pstat span{font-size:12.5px;text-align:center}
.tk-stats .pstat b{font-size:19px}
`);
console.log('patched');
