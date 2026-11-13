// xgaigu – Nhóm Chat: the shared "Chợ xgaigu" group and members' own groups (list, chat, members, invites).
(() => {
const { h, api, apiUpload, toast, fail, modal: baseModal, avatar, esc, timeAgo, openAuth, S, main, onLeave, footer } = window.XG;
const modal = (content, opts) => { const m = baseModal(content, opts); window.addEventListener('hashchange', () => m.close(), { once: true }); return m; };
const EMOJIS = ['😀', '😂', '🥰', '😍', '😘', '😎', '🤩', '😉', '😭', '😡', '👍', '👏', '🙏', '💪', '🔥', '❤️', '💖', '💯', '🎉', '🌹', '💋', '🍀', '✨', '📍', '📞', '💬', '🛍️', '🎁'];
const REACTS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];
const HUES = [330, 270, 200, 160, 25, 45, 290, 0];
const gAvatar = (g, size = 'md') => g.kind === 'main'
  ? h('span', { class: 'gav main ' + size }, '🛍️')
  : h('span', { class: 'gav ' + size, style: `--hue:${HUES[g.id % HUES.length]}` }, (g.name || '?').trim().charAt(0).toUpperCase());
const clock = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const when = (t) => (Date.now() - t < 20 * 3600_000 ? clock(t) : new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' + clock(t));

// text with line breaks; xgaigu links become clickable (inside the app when possible)
function richText(body) {
  const box = h('div', { class: 'gp-text' });
  const re = /\b(?:https?:\/\/|www\.)[^\s<>"']+|\bxgaigu\.com\b[^\s<>"']*/gi;
  let last = 0, m;
  const str = String(body || '');
  while ((m = re.exec(str))) {
    if (m.index > last) box.append(str.slice(last, m.index));
    let href = m[0]; if (!/^https?:/i.test(href)) href = 'https://' + href;
    let inApp = '';
    try { const u = new URL(href); if (/xgaigu\.com$|^localhost|^127\./i.test(u.hostname) || u.host === location.host) inApp = u.hash || (u.pathname.match(/^\/v\/(\d+)/) ? '#/feed/' + u.pathname.split('/')[2] : ''); } catch {}
    box.append(h('a', inApp ? { href: inApp } : { href, target: '_blank', rel: 'noopener nofollow' }, m[0]));
    last = m.index + m[0].length;
  }
  if (last < str.length) box.append(str.slice(last));
  return box;
}
function viewImage(src) {
  modal(h('div', { class: 'gp-viewer' }, h('img', { src, alt: '' })), { sheet: false });
}

// ---------- list of groups ----------
async function pageList() {
  const wrap = h('div', { class: 'wrap groups-page' });
  main.append(wrap, footer());
  const d = await api('/groups');
  const create = h('button', { type: 'button', class: 'btn primary', onclick: () => (S.user ? createDialog() : openAuth('register')) }, '+ Tạo nhóm');
  const mainCard = h('a', { class: 'card gmain', href: '#/groups/' + d.main.id },
    h('div', { class: 'gmain-top' }, gAvatar(d.main, 'lg'), h('div', {}, h('span', { class: 'gmain-tag' }, 'NHÓM CHUNG'), h('h3', {}, d.main.name), h('p', {}, d.main.about))),
    h('div', { class: 'gmain-meta' }, h('span', {}, '👥 ' + d.main.members.toLocaleString('vi-VN') + ' thành viên'), h('span', {}, '📝 ' + d.main.today + ' bài trong 24 giờ'),
      d.main.unread ? h('span', { class: 'gbadge' }, d.main.unread + ' mới') : ''),
    d.main.last ? h('p', { class: 'glast' }, d.main.last) : '');
  const row = (g, extra) => h('a', { class: 'grow', href: '#/groups/' + g.id }, gAvatar(g),
    h('div', { class: 'grow-t' }, h('b', {}, g.name, g.privacy === 'private' ? h('span', { class: 'glock', title: 'Nhóm riêng tư' }, ' 🔒') : ''),
      h('p', {}, g.last || g.about || g.members + ' thành viên')),
    h('div', { class: 'grow-r' }, g.lastAt ? h('small', {}, timeAgo(g.lastAt)) : '', extra || ''));
  wrap.append(
    h('div', { class: 'groups-head' }, h('div', {}, h('h2', { class: 'title' }, 'Nhóm Chat'), h('p', { class: 'muted' }, 'Giao lưu, đăng tin, chia sẻ hình ảnh và video với mọi người.')), create),
    mainCard,
    !S.user ? h('div', { class: 'card gguest' }, h('p', {}, 'Bạn đang xem với tư cách khách. Đăng ký miễn phí để đăng bài, bình luận và tạo nhóm của riêng bạn.'),
      h('div', { class: 'row' }, h('button', { class: 'btn primary sm', onclick: () => openAuth('register') }, 'Đăng ký'), h('button', { class: 'btn sm', onclick: () => openAuth('login') }, 'Đăng nhập'))) : '',
    S.user ? h('section', { class: 'gsec' }, h('h3', {}, 'Nhóm của tôi'),
      d.mine.length ? h('div', { class: 'card glist' }, d.mine.map((g) => row(g, g.unread ? h('span', { class: 'gbadge' }, String(g.unread)) : '')))
        : h('div', { class: 'card gempty' }, h('p', {}, 'Bạn chưa ở nhóm nào. Tạo nhóm riêng cho bạn bè, khách hàng, hoặc tham gia các nhóm công khai bên dưới.'))) : '',
    h('section', { class: 'gsec' }, h('h3', {}, 'Nhóm công khai'),
      d.discover.length ? h('div', { class: 'card glist' }, d.discover.map((g) => row(g, h('span', { class: 'gmem' }, g.members + ' TV'))))
        : h('div', { class: 'card gempty' }, h('p', { class: 'muted' }, 'Chưa có nhóm công khai nào. Hãy là người tạo nhóm đầu tiên!'))));
}

function groupForm(g, onSave) {
  const name = h('input', { maxlength: 60, placeholder: 'VD: Hội bạn Sài Gòn', value: g ? g.name : '' });
  const about = h('textarea', { rows: 3, maxlength: 300, placeholder: 'Nhóm này để làm gì? (không bắt buộc)' }); about.value = g ? g.about : '';
  let privacy = g ? g.privacy : 'public';
  const opt = (val, title, desc) => h('label', { class: 'gopt' }, h('input', { type: 'radio', name: 'gpriv', value: val, checked: privacy === val, onchange: () => { privacy = val; } }), h('span', {}, h('b', {}, title), h('small', {}, desc)));
  const btn = h('button', { type: 'submit', class: 'btn primary', style: 'width:100%' }, g ? 'Lưu' : 'Tạo nhóm');
  const f = h('form', { class: 'gform' }, h('label', {}, 'Tên nhóm', name), h('label', {}, 'Giới thiệu', about),
    h('div', { class: 'gopts' }, opt('public', '🌐 Công khai', 'Ai cũng thấy và tham gia được. Khách chưa có tài khoản vẫn xem được.'), opt('private', '🔒 Riêng tư', 'Chỉ người có link mời mới vào được và xem được.')), btn);
  f.addEventListener('submit', async (e) => { e.preventDefault(); btn.disabled = true; try { await onSave({ name: name.value, about: about.value, privacy }); } catch (ex) { fail(ex); } finally { btn.disabled = false; } });
  setTimeout(() => name.focus(), 50);
  return f;
}
function createDialog() {
  const m = modal(h('div', {}, h('h3', { style: 'margin-bottom:12px' }, 'Tạo nhóm chat'), groupForm(null, async (b) => {
    const r = await api('/groups', { method: 'POST', body: b }); m.close(); toast('Đã tạo nhóm'); location.hash = '#/groups/' + r.id;
  })));
}

// ---------- one group ----------
async function pageGroup(id) {
  let info;
  try { info = await api('/groups/' + id); }
  catch (e) { main.append(h('div', { class: 'empty', style: 'padding:90px 20px' }, h('div', { class: 'ico' }, '🔒'), h('h3', {}, e.message), h('a', { class: 'btn primary', style: 'margin-top:14px', href: '#/groups' }, 'Về danh sách nhóm'))); return; }
  let g = info.group;
  const stream = h('div', { class: 'gstream' });
  const moreBtn = h('button', { type: 'button', class: 'btn sm gmore', hidden: true }, 'Xem bài cũ hơn');
  stream.append(moreBtn);
  const byId = new Map();
  let since = 0, firstId = 0, alive = true;
  onLeave(() => { alive = false; });

  const head = h('header', { class: 'ghead' },
    h('a', { class: 'iconbtn', href: '#/groups', 'aria-label': 'Danh sách nhóm', html: window.XG.icon('back') }),
    h('button', { type: 'button', class: 'ghead-info', onclick: () => infoDialog() }, gAvatar(g),
      h('span', {}, h('b', {}, g.name), h('small', {}, (g.kind === 'main' ? 'Nhóm chung · ' : g.privacy === 'private' ? '🔒 Riêng tư · ' : '🌐 Công khai · ') + g.members.toLocaleString('vi-VN') + ' thành viên'))),
    h('button', { type: 'button', class: 'iconbtn', 'aria-label': 'Thông tin nhóm', onclick: () => infoDialog() }, 'ⓘ'));

  // --- one post ---
  function postEl(p) {
    if (p.deleted) return h('div', { class: 'gpost gone', 'data-id': p.id }, h('i', {}, 'Bài viết đã bị xoá'));
    const me = S.user && p.user.id === S.user.id;
    const media = p.media.length ? h('div', { class: 'gp-media n' + Math.min(p.media.filter((x) => x.t === 'img').length, 4) },
      p.media.map((x) => (x.t === 'img' ? h('img', { src: x.u, alt: '', loading: 'lazy', onclick: () => viewImage(x.u) })
        : h('video', { src: x.u + '#t=0.1', controls: true, playsinline: true, preload: 'metadata', class: 'gp-vid' })))) : '';
    const prev = p.previews.map((x) => h('a', { class: 'gp-prev', href: x.type === 'video' ? '#/feed/' + x.id : '#/u/' + x.id },
      x.thumb ? h('img', { src: x.thumb, alt: '', loading: 'lazy' }) : h('span', { class: 'gp-noimg' }, x.type === 'video' ? '🎬' : '👤'),
      h('span', {}, h('small', {}, x.type === 'video' ? '▶ Video trên xgaigu' + (x.place ? ' · ' + x.place : '') : '👤 Hồ sơ trên xgaigu'), h('b', {}, x.title), x.text ? h('em', {}, x.text) : '')));
    const counts = Object.entries(p.reacts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
    const total = counts.reduce((n, [, c]) => n + c, 0);
    const reactBar = h('div', { class: 'gp-reacts' + (total ? '' : ' none') }, counts.slice(0, 3).map(([e]) => h('span', {}, e)), total ? h('small', {}, String(total)) : '');
    const picker = h('div', { class: 'gp-picker', hidden: true }, REACTS.map((e) => h('button', { type: 'button', class: p.mine === e ? 'on' : '', onclick: () => react(p, p.mine === e ? '' : e) }, e)));
    const likeBtn = h('button', { type: 'button', class: 'gp-act' + (p.mine ? ' on' : ''), onclick: () => { if (!S.user) return openAuth('login'); picker.hidden = !picker.hidden; } }, p.mine || '🤍', ' ', p.mine ? 'Đã thả' : 'Thả cảm xúc');
    const cBox = h('div', { class: 'gp-comments', hidden: true });
    const cBtn = h('button', { type: 'button', class: 'gp-act', onclick: () => toggleComments(p, cBox) }, '💬 ', p.comments ? p.comments + ' bình luận' : 'Bình luận');
    const menu = p.canDelete ? h('button', { type: 'button', class: 'gp-del', 'aria-label': 'Xoá bài', title: 'Xoá bài', onclick: () => delPost(p) }, '🗑') : '';
    const el = h('article', { class: 'gpost' + (me ? ' me' : ''), 'data-id': p.id },
      h('div', { class: 'gp-head' }, h('a', { href: '#/u/' + p.user.id }, avatar(p.user, 'sm')), h('div', {}, h('a', { href: '#/u/' + p.user.id, class: 'gp-name' }, p.user.name), h('time', {}, when(p.at))), menu),
      p.body ? richText(p.body) : '', media, prev.length ? h('div', { class: 'gp-prevs' }, prev) : '',
      h('div', { class: 'gp-foot' }, reactBar, h('div', { class: 'gp-acts' }, likeBtn, cBtn)), picker, cBox);
    el._cBox = cBox;
    return el;
  }
  function put(p, { atTop = false } = {}) {
    const old = byId.get(p.id);
    const el = postEl(p);
    if (old) { if (old._cBox && !old._cBox.hidden) { el._cBox.replaceWith(old._cBox); el._cBox = old._cBox; } old.replaceWith(el); }
    else if (atTop) moreBtn.after(el);
    else stream.append(el);
    byId.set(p.id, el);
    if (!firstId || p.id < firstId) firstId = p.id;
  }
  const nearBottom = () => stream.scrollHeight - stream.scrollTop - stream.clientHeight < 160;
  async function react(p, emoji) {
    try { const r = await api('/chat-posts/' + p.id + '/react', { method: 'POST', body: { emoji } }); put(r.post); } catch (e) { fail(e); }
  }
  async function delPost(p) {
    if (!confirm('Xoá bài viết này?')) return;
    try { await api('/chat-posts/' + p.id, { method: 'DELETE' }); put({ id: p.id, deleted: true }); toast('Đã xoá bài'); } catch (e) { fail(e); }
  }
  async function toggleComments(p, box) {
    if (!box.hidden) { box.hidden = true; return; }
    box.hidden = false; box.replaceChildren(h('div', { class: 'spin' }));
    let d; try { d = await api('/chat-posts/' + p.id + '/comments'); } catch (e) { box.replaceChildren(h('p', { class: 'muted' }, e.message)); return; }
    const list = h('div', { class: 'gc-list' });
    const cEl = (c) => h('div', { class: 'gc' }, avatar(c.user, 'xs'), h('div', { class: 'gc-b' }, h('b', {}, c.user.name), richText(c.body),
      h('small', {}, when(c.at), c.canDelete ? h('button', { type: 'button', class: 'gc-del', onclick: async (e) => { if (!confirm('Xoá bình luận?')) return; try { await api('/chat-comments/' + c.id, { method: 'DELETE' }); e.target.closest('.gc').remove(); } catch (ex) { fail(ex); } } }, ' · Xoá') : '')));
    d.comments.forEach((c) => list.append(cEl(c)));
    let form;
    if (!S.user) form = h('button', { type: 'button', class: 'btn sm', onclick: () => openAuth('login') }, 'Đăng nhập để bình luận');
    else if (!g.me.canPost) form = h('p', { class: 'muted', style: 'font-size:13px' }, 'Tham gia nhóm để bình luận.');
    else {
      const inp = h('input', { placeholder: 'Viết bình luận…', maxlength: 1000, autocomplete: 'off' });
      form = h('form', { class: 'gc-form' }, inp, h('button', { type: 'submit', class: 'btn primary sm' }, 'Gửi'));
      form.addEventListener('submit', async (e) => {
        e.preventDefault(); const body = inp.value.trim(); if (!body) return; inp.value = '';
        try { const r = await api('/chat-posts/' + p.id + '/comments', { method: 'POST', body: { body } }); list.append(cEl(r.comment)); } catch (ex) { fail(ex); inp.value = body; }
      });
    }
    box.replaceChildren(list, form);
  }

  async function loadOlder() {
    moreBtn.disabled = true;
    try {
      const h0 = stream.scrollHeight;
      const d = await api('/groups/' + id + '/posts?before=' + firstId);
      [...d.posts].reverse().forEach((p) => put(p, { atTop: true }));
      moreBtn.hidden = !d.more;
      stream.scrollTop = stream.scrollHeight - h0;
    } catch (e) { fail(e); } finally { moreBtn.disabled = false; }
  }
  moreBtn.addEventListener('click', loadOlder);
  async function poll() {
    if (!alive) return;
    if (!document.hidden) {
      try {
        const stick = nearBottom();
        const d = await api('/groups/' + id + '/posts?since=' + since);
        since = d.now; d.posts.forEach((p) => put(p));
        if (stick && d.posts.length) stream.scrollTop = stream.scrollHeight;
      } catch {}
    }
    setTimeout(poll, 4000);
  }

  // --- composer ---
  function composer() {
    if (!S.user) return h('div', { class: 'gcompose guest' }, h('span', {}, 'Đăng nhập để đăng bài, bình luận và thả cảm xúc'),
      h('button', { type: 'button', class: 'btn primary sm', onclick: () => openAuth('login') }, 'Đăng nhập'), h('button', { type: 'button', class: 'btn sm', onclick: () => openAuth('register') }, 'Đăng ký'));
    if (!g.me.canPost) return h('div', { class: 'gcompose guest' }, h('span', {}, 'Tham gia nhóm để đăng bài và bình luận'),
      h('button', { type: 'button', class: 'btn primary sm', onclick: async () => { try { await api('/groups/' + id + '/join', { method: 'POST' }); toast('Đã tham gia nhóm'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { fail(e); } } }, 'Tham gia nhóm'));
    let files = [];
    const text = h('textarea', { rows: 1, maxlength: 3000, placeholder: g.kind === 'main' ? 'Đăng tin lên Chợ xgaigu…' : 'Viết gì đó cho nhóm…', 'aria-label': 'Nội dung' });
    const grow = () => { text.style.height = 'auto'; text.style.height = Math.min(text.scrollHeight, 160) + 'px'; };
    text.addEventListener('input', grow);
    const pick = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm', multiple: true, hidden: true });
    const strip = h('div', { class: 'gfiles', hidden: true });
    const paintFiles = () => {
      strip.hidden = !files.length;
      strip.replaceChildren(...files.map((f, i) => h('span', { class: 'gfile' }, f.type.startsWith('image/') ? h('img', { src: URL.createObjectURL(f), alt: '' }) : h('span', { class: 'gfile-v' }, '🎬'),
        h('button', { type: 'button', 'aria-label': 'Bỏ tệp', onclick: () => { files.splice(i, 1); paintFiles(); } }, '×'))));
    };
    pick.addEventListener('change', () => {
      for (const f of pick.files) {
        const isV = f.type.startsWith('video/');
        if (isV && files.some((x) => x.type.startsWith('video/'))) { toast('Mỗi bài chỉ 1 video', true); continue; }
        if (isV && f.size > 100 * 1024 * 1024) { toast('Video tối đa 100 MB', true); continue; }
        if (!isV && files.filter((x) => x.type.startsWith('image/')).length >= 6) { toast('Tối đa 6 ảnh mỗi bài', true); continue; }
        files.push(f);
      }
      pick.value = ''; paintFiles();
    });
    const emojiBox = h('div', { class: 'gemoji', hidden: true }, EMOJIS.map((e) => h('button', { type: 'button', onclick: () => {
      const s = text.selectionStart ?? text.value.length; text.value = text.value.slice(0, s) + e + text.value.slice(text.selectionEnd ?? s); text.focus(); text.selectionStart = text.selectionEnd = s + e.length; grow();
    } }, e)));
    const bar = h('div', { class: 'gprog', hidden: true }, h('i'));
    const send = h('button', { type: 'submit', class: 'btn primary gsend', 'aria-label': 'Đăng', html: window.XG.icon('send') });
    const form = h('form', { class: 'gcompose' }, bar, strip, emojiBox,
      h('div', { class: 'grow-c' },
        h('button', { type: 'button', class: 'iconbtn', 'aria-label': 'Thêm ảnh / video', title: 'Thêm ảnh / video', onclick: () => pick.click() }, '📷'),
        h('button', { type: 'button', class: 'iconbtn', 'aria-label': 'Biểu tượng cảm xúc', title: 'Biểu tượng cảm xúc', onclick: () => { emojiBox.hidden = !emojiBox.hidden; } }, '😊'),
        text, send), pick);
    text.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(min-width: 900px)').matches) { e.preventDefault(); form.requestSubmit(); } });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = text.value.trim();
      if (!body && !files.length) return;
      const fd = new FormData(); fd.set('body', body); files.forEach((f) => fd.append('media', f));
      send.disabled = true; bar.hidden = !files.length; bar.firstChild.style.width = '0%';
      try {
        const r = await apiUpload('/groups/' + id + '/posts', fd, (a, b) => { bar.firstChild.style.width = Math.round(a / b * 100) + '%'; });
        text.value = ''; files = []; paintFiles(); grow(); emojiBox.hidden = true;
        put(r.post); stream.scrollTop = stream.scrollHeight;
      } catch (ex) { fail(ex); } finally { send.disabled = false; bar.hidden = true; }
    });
    return form;
  }

  // --- info / members / invite ---
  async function infoDialog() {
    const body = h('div', { class: 'ginfo' });
    const m = modal(body);
    const paint = async () => {
      const link = g.invite ? location.origin + '/#/groups/join/' + g.invite : '';
      const copy = (txt, msg) => { navigator.clipboard && navigator.clipboard.writeText(txt).then(() => toast(msg)).catch(() => {}); };
      const parts = [h('div', { class: 'ginfo-top' }, gAvatar(g, 'lg'), h('div', {}, h('h3', {}, g.name), h('small', { class: 'muted' }, (g.kind === 'main' ? 'Nhóm chung của xgaigu' : g.privacy === 'private' ? '🔒 Nhóm riêng tư' : '🌐 Nhóm công khai') + ' · ' + g.members.toLocaleString('vi-VN') + ' thành viên'))),
        g.about ? h('p', { class: 'ginfo-about' }, g.about) : ''];
      if (g.kind === 'main') parts.push(h('div', { class: 'notice' }, '📌 Quy định: chỉ gửi link của xgaigu.com, không spam, không nội dung vi phạm pháp luật. Bài vi phạm sẽ bị xoá.'));
      if (link) parts.push(h('div', { class: 'ginvite' }, h('small', {}, 'Link mời vào nhóm'), h('div', { class: 'ginvite-row' }, h('code', {}, link), h('button', { type: 'button', class: 'btn sm', onclick: () => copy(link, 'Đã sao chép link mời') }, 'Sao chép')),
        g.me.mod ? h('button', { type: 'button', class: 'btn sm ghost', onclick: async () => { if (!confirm('Tạo link mời mới? Link cũ sẽ không dùng được nữa.')) return; try { const r = await api('/groups/' + id + '/invite', { method: 'POST' }); g.invite = r.invite; paint(); } catch (e) { fail(e); } } }, 'Đổi link mời') : ''));
      else if (g.kind !== 'main' && g.privacy === 'public') parts.push(h('div', { class: 'ginvite' }, h('small', {}, 'Link nhóm'), h('div', { class: 'ginvite-row' }, h('code', {}, location.origin + '/#/groups/' + id), h('button', { type: 'button', class: 'btn sm', onclick: () => copy(location.origin + '/#/groups/' + id, 'Đã sao chép link nhóm') }, 'Sao chép'))));
      const actions = h('div', { class: 'ginfo-acts' });
      if (g.me.mod && g.kind !== 'main') actions.append(h('button', { type: 'button', class: 'btn sm', onclick: () => { body.replaceChildren(h('h3', { style: 'margin-bottom:12px' }, 'Sửa nhóm'), groupForm(g, async (b) => { const r = await api('/groups/' + id, { method: 'PUT', body: b }); g = r.group; toast('Đã lưu'); m.close(); window.dispatchEvent(new HashChangeEvent('hashchange')); })); } }, '✏️ Sửa nhóm'));
      if (g.kind !== 'main' && g.me.member && g.me.role !== 'owner') actions.append(h('button', { type: 'button', class: 'btn sm ghost', onclick: async () => { if (!confirm('Rời nhóm ' + g.name + '?')) return; try { await api('/groups/' + id + '/leave', { method: 'POST' }); toast('Đã rời nhóm'); m.close(); location.hash = '#/groups'; } catch (e) { fail(e); } } }, 'Rời nhóm'));
      if (g.kind !== 'main' && (g.me.role === 'owner' || (S.user && S.user.role === 'admin'))) actions.append(h('button', { type: 'button', class: 'btn sm ghost danger', onclick: async () => { if (!confirm('Xoá nhóm ' + g.name + '? Mọi người sẽ không vào được nhóm này nữa.')) return; try { await api('/groups/' + id, { method: 'DELETE' }); toast('Đã xoá nhóm'); m.close(); location.hash = '#/groups'; } catch (e) { fail(e); } } }, '🗑 Xoá nhóm'));
      parts.push(actions);
      if (g.kind !== 'main') {
        const list = h('div', { class: 'gmembers' }, h('div', { class: 'spin' }));
        parts.push(h('h4', { style: 'margin:16px 0 8px' }, 'Thành viên'), list);
        api('/groups/' + id + '/members').then(({ members }) => {
          const ROLE = { owner: 'Chủ nhóm', admin: 'Quản trị' };
          list.replaceChildren(...members.map((u) => h('div', { class: 'gmember' }, h('a', { href: '#/u/' + u.id }, avatar(u, 'sm')), h('a', { href: '#/u/' + u.id, class: 'gmember-n' }, u.name, ROLE[u.role] ? h('small', {}, ROLE[u.role]) : ''),
            g.me.mod && u.role !== 'owner' && (!S.user || u.id !== S.user.id) ? h('div', { class: 'gmember-a' },
              g.me.role === 'owner' || (S.user && S.user.role === 'admin') ? h('button', { type: 'button', class: 'btn xs', onclick: () => setRole(u, u.role === 'admin' ? 'member' : 'admin') }, u.role === 'admin' ? 'Bỏ quản trị' : 'Cho làm quản trị') : '',
              h('button', { type: 'button', class: 'btn xs ghost', onclick: () => { if (confirm('Mời ' + u.name + ' ra khỏi nhóm?')) setRole(u, 'remove'); } }, 'Mời ra')) : '')));
        }).catch((e) => list.replaceChildren(h('p', { class: 'muted' }, e.message)));
      }
      body.replaceChildren(...parts);
    };
    const setRole = async (u, action) => { try { await api('/groups/' + id + '/members/' + u.id, { method: 'POST', body: { action } }); paint(); } catch (e) { fail(e); } };
    paint();
  }

  main.append(h('div', { class: 'gchat' }, head, stream, composer()));
  const d = await api('/groups/' + id + '/posts');
  since = d.now;
  if (!d.posts.length) stream.append(h('div', { class: 'gfirst' }, h('div', {}, g.kind === 'main' ? '🛍️' : '👋'), h('b', {}, 'Chưa có bài nào'), h('p', { class: 'muted' }, S.user ? 'Hãy đăng bài đầu tiên!' : 'Đăng nhập để đăng bài đầu tiên.')));
  d.posts.forEach((p) => put(p));
  moreBtn.hidden = !d.more;
  stream.scrollTop = stream.scrollHeight;
  setTimeout(() => { stream.scrollTop = stream.scrollHeight; }, 300); // after pictures load
  setTimeout(poll, 4000);
}

// ---------- invite link ----------
async function pageJoin(code) {
  const box = h('div', { class: 'wrap', style: 'max-width:480px;padding:60px 0' });
  main.append(box);
  let d; try { d = await api('/groups/invite/' + encodeURIComponent(code)); } catch (e) { box.append(h('div', { class: 'card empty' }, h('h3', {}, e.message), h('a', { class: 'btn', href: '#/groups', style: 'margin-top:12px' }, 'Xem các nhóm'))); return; }
  const g = d.group;
  if (g.member) { location.hash = '#/groups/' + g.id; return; }
  const go = h('button', { type: 'button', class: 'btn primary', style: 'width:100%' }, 'Tham gia nhóm');
  go.addEventListener('click', async () => {
    if (!S.user) return openAuth('register');
    go.disabled = true;
    try { const r = await api('/groups/invite/' + encodeURIComponent(code), { method: 'POST' }); toast('Đã tham gia ' + g.name); location.hash = '#/groups/' + r.id; } catch (e) { go.disabled = false; fail(e); }
  });
  box.append(h('div', { class: 'card gjoin' }, gAvatar(g, 'lg'), h('small', { class: 'muted' }, 'Bạn được mời vào nhóm'), h('h2', {}, g.name), g.about ? h('p', {}, g.about) : '',
    h('p', { class: 'muted' }, (g.privacy === 'private' ? '🔒 Nhóm riêng tư · ' : '🌐 Nhóm công khai · ') + g.members + ' thành viên'), go,
    !S.user ? h('small', { class: 'muted' }, 'Bạn cần có tài khoản xgaigu (miễn phí) để tham gia.') : ''));
}

window.XGGroups = {
  page(b, c) {
    if (b === 'join' && c) return pageJoin(c);
    if (b && /^\d+$/.test(b)) return pageGroup(b);
    return pageList();
  },
};
})();
