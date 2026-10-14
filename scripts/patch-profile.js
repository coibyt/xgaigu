// One-off patch: TikTok-style member profile page.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 60));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---- server: totals over all of the member's videos ----
rep('server.js', "  res.json({ user: publicUser(u), videos: listVideos(req.user, { userId: u.id, limit: 30 }) });",
`  const stats = db.prepare(
    \`SELECT COUNT(*) AS videos, COALESCE(SUM(v.views), 0) AS views, COALESCE(SUM((SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id)), 0) AS likes
     FROM videos v WHERE v.user_id = ? AND v.hidden = 0\`).get(u.id);
  res.json({ user: publicUser(u), videos: listVideos(req.user, { userId: u.id, limit: 60 }), stats });`);

// ---- client ----
const s = fs.readFileSync('public/js/app.js', 'utf8');
const a = s.indexOf('async function pageUser(id) {');
const b = s.indexOf('async function pageMe()');
if (a < 0 || b < 0) throw new Error('pageUser not found');
const page = `async function pageUser(id) {
  const { user, videos, stats } = await api('/users/' + id);
  const me = S.user && S.user.id === user.id;
  const stat = (n, label) => h('div', { class: 'pstat' }, h('b', {}, fmtCount(n)), h('span', {}, label));
  const profileLink = location.origin + '/#/u/' + user.id;
  const shareProfile = async () => {
    try { if (navigator.share) { await navigator.share({ title: user.name + ' – xgaigu', url: profileLink }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(profileLink); toast('Đã sao chép liên kết hồ sơ'); } catch { toast(profileLink); }
  };
  const more = () => {
    let m;
    const item = (ic, label, fn) => h('button', { type: 'button', class: 'menu-item', onclick: () => { m.close(); fn(); }, html: icon(ic) + '<span>' + label + '</span>' });
    m = modal(h('div', { class: 'menu-list' }, h('h3', {}, user.name),
      item('phone', 'Gọi thoại', () => openCall(user)), item('video', 'Gọi video', () => startVideoCall(user)),
      item('share', 'Chia sẻ hồ sơ', shareProfile), item('flag', 'Báo cáo', () => openReport('user', user.id))), { sheet: true });
  };
  const facts = [['Nghề nghiệp', user.occupation], ['Xuất xứ', user.origin], ['Chiều cao', user.height && user.height + ' cm'], ['Cân nặng', user.weight && user.weight + ' kg'], ['Thời gian rảnh', user.availability]].filter((x) => x[1]);
  const head = h('div', { class: 'tk-head' },
    avatar(user, 'xl'),
    h('h2', { class: 'tk-name' }, user.name + (user.age ? ', ' + user.age : '')),
    h('div', { class: 'tk-handle', translate: 'no' }, user.nickname ? '@' + user.nickname : ''),
    h('div', { class: 'tk-stats' }, stat(stats.videos, 'Video'), stat(stats.likes, 'Lượt thích'), stat(stats.views, 'Lượt xem')),
    h('div', { class: 'tk-actions' }, !me
      ? [h('button', { class: 'btn primary', onclick: () => startChat(user), html: icon('send') + '<span>Nhắn tin</span>' }),
        h('button', { class: 'btn', onclick: () => openBook(user), html: icon('cal') + '<span>Hẹn gặp</span>' }),
        h('button', { class: 'btn more', 'aria-label': 'Thêm', onclick: more, html: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 10l5 6 5-6z"/></svg>' })]
      : [h('a', { class: 'btn primary', href: '#/me' }, 'Sửa hồ sơ'), h('button', { class: 'btn', onclick: shareProfile, html: icon('share') + '<span>Chia sẻ hồ sơ</span>' })]),
    user.bio && h('p', { class: 'tk-bio', translate: 'no' }, user.bio),
    (user.city || user.address) && h('div', { class: 'tk-loc', html: icon('pin') + ' ' + esc(user.city || 'Việt Nam') }),
    facts.length > 0 && h('div', { class: 'facts tk-facts' }, facts.map(([k, v]) => h('span', { class: 'fact' }, h('b', {}, k), v))),
    user.interests && user.interests.length > 0 && h('div', { class: 'facts tk-facts' }, user.interests.map((t) => h('span', { class: 'fact tag' }, t))),
    user.lookingFor && h('p', { class: 'tk-more' }, h('b', {}, 'Kiểu người mong muốn: '), user.lookingFor),
    user.boundaries && h('p', { class: 'tk-more muted' }, h('b', {}, 'Điều không muốn: '), user.boundaries));
  const cell = (v) => {
    const yt = !v.file && ytId(v.url);
    const poster = v.thumb || (yt ? \`https://i.ytimg.com/vi/\${yt}/hqdefault.jpg\` : '');
    const media = poster ? h('img', { src: poster, alt: v.caption || 'Video', loading: 'lazy' })
      : (() => { const m = mediaEl(v); if (m instanceof HTMLVideoElement) m.setAttribute('preload', 'metadata'); else m.style.pointerEvents = 'none'; return m; })();
    const c = h('a', { class: 'tcell', href: '#/feed/' + v.id, 'aria-label': 'Xem video' }, media,
      h('span', { class: 'tviews', html: icon('play') + fmtCount(v.views || 0) }));
    if (me) c.append(h('button', { class: 'iconbtn tdel', 'aria-label': 'Xoá video', html: icon('trash'), onclick: async (e) => { e.preventDefault(); e.stopPropagation(); if (!confirm('Xoá video này?')) return; try { await api('/videos/' + v.id, { method: 'DELETE' }); route(); } catch (er) { fail(er); } } }));
    return c;
  };
  const w = h('div', { class: 'wrap tk' }, head,
    h('div', { class: 'tk-tabs' }, h('span', { class: 'on', html: icon('video') + '<span>Video</span>' })),
    videos.length ? h('div', { class: 'tgrid' }, videos.map(cell)) : h('div', { class: 'card empty' }, h('p', {}, 'Chưa có video.')));
  main.append(w, footer());
}

`;
fs.writeFileSync('public/js/app.js', s.slice(0, a) + page + s.slice(b));

// ---- css ----
fs.appendFileSync('public/css/app.css', `
/* TikTok-style profile */
.avatar.xl{width:112px;height:112px;font-size:42px;border-width:3px}
.tk{max-width:720px}
.tk-head{display:flex;flex-direction:column;align-items:center;text-align:center;padding:26px 0 8px;gap:8px}
.tk-name{font-size:22px;font-weight:800;margin-top:6px}
.tk-handle{color:var(--muted);font-size:15px;margin-top:-4px;min-height:0}
.tk-handle:empty{display:none}
.tk-stats{display:flex;gap:6px;margin:10px 0 6px;width:100%;max-width:420px;justify-content:center}
.pstat{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:0 6px}
.pstat+.pstat{border-left:1px solid var(--line)}
.pstat b{font-size:22px;font-weight:800}
.pstat span{color:var(--muted);font-size:14px}
.tk-actions{display:flex;gap:8px;justify-content:center;width:100%;max-width:420px;margin-top:6px}
.tk-actions .btn{flex:1;justify-content:center;min-height:46px}
.tk-actions .btn.more{flex:none;width:48px;padding:0}
.tk-bio{max-width:520px;white-space:pre-line;line-height:1.5;margin-top:8px}
.tk-loc{color:var(--muted);font-size:14px;display:flex;gap:6px;align-items:center}
.tk-facts{justify-content:center}
.tk-more{max-width:520px;font-size:14px}
.tk-tabs{display:flex;border-bottom:1px solid var(--line);margin-top:16px}
.tk-tabs span{flex:1;display:flex;justify-content:center;align-items:center;gap:8px;padding:12px;font-weight:700;border-bottom:2px solid var(--text);margin-bottom:-1px}
.tk-tabs svg{width:18px;height:18px}
.tgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin:2px -16px 0}
@media (min-width:721px){.tgrid{margin-inline:0}}
.tcell{position:relative;aspect-ratio:3/4;background:var(--surface2);overflow:hidden;display:block}
.tcell img,.tcell video{width:100%;height:100%;object-fit:cover;display:block}
.tcell .tviews{position:absolute;left:8px;bottom:8px;display:flex;align-items:center;gap:4px;font-weight:700;font-size:14px;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.8)}
.tcell .tviews svg{width:15px;height:15px}
.tcell .tdel{position:absolute;top:6px;right:6px;width:34px;height:34px;background:rgba(0,0,0,.6)}
.menu-list{display:grid;gap:4px}
.menu-list h3{margin-bottom:8px}
.menu-item{display:flex;align-items:center;gap:12px;padding:14px 10px;background:none;border:0;color:var(--text);font:inherit;font-weight:600;border-radius:12px;cursor:pointer;text-align:left}
.menu-item:hover{background:var(--surface2)}
.menu-item svg{width:20px;height:20px}
`);
console.log('patched');
