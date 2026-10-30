/* xgaigu – Livestream: list, going live (camera / long video on loop / link), and the live room */
(() => {
'use strict';
const { h, api, apiUpload, fmtMB, modal: baseModal, toast, fail, icon, avatar, fmtCount, needLogin, openAuth, startChat, openBook, openReport, rtcConfig, footer, main, S, onLeave } = window.XG;
const modal = (content, opts) => { const m = baseModal(content, opts); window.addEventListener('hashchange', () => m.close(), { once: true }); return m; };

let CATALOG = null; // { gifts, reacts, daily, wallet }
const catalog = async (fresh) => { if (!CATALOG || fresh) CATALOG = await api('/live/gifts'); return CATALOG; };
const giftOf = (id) => (CATALOG && CATALOG.gifts.find((g) => g.id === id)) || { id, name: 'Quà', icon: '🎁', price: 1 };
const COIN = '<svg viewBox="0 0 24 24" aria-hidden="true" class="coin"><circle cx="12" cy="12" r="10" fill="#f6b73c"/><circle cx="12" cy="12" r="7.2" fill="#ffd66b"/><path d="M9.5 9.2h5l-3 5.6h3" fill="none" stroke="#a8620a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SMILE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 14.2c1 1.4 2.3 2.1 4 2.1s3-.7 4-2.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="9.8" r="1.2" fill="currentColor"/><circle cx="15" cy="9.8" r="1.2" fill="currentColor"/></svg>';
const GIFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18v4H3zM5 14h14v7H5zM12 10v11M12 10c-1.5-3.5-5.5-4.5-6-2s3.5 2 6 2zM12 10c1.5-3.5 5.5-4.5 6-2s-3.5 2-6 2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const LOOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CAM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 7l-7 5 7 5V7zM1 5h15v14H1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const LINK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h6l-1 6 4 4H6l4-4zM12 14v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';
const fmtDur = (s) => { s = Math.round(s); const hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60; return (hh ? hh + ':' + String(mm).padStart(2, '0') : mm) + ':' + String(ss).padStart(2, '0'); };

// ---------- live list (#/live) ----------
function liveCard(s) {
  const cover = s.thumb || s.host.avatar;
  return h('a', { class: 'lvcard', href: '#/live/' + s.id },
    h('div', { class: 'lvcard-bg', style: cover ? 'background-image:url("' + cover + '")' : '' }),
    !s.thumb && h('div', { class: 'lvcard-ava' }, avatar(s.host, 'xl')),
    h('div', { class: 'lvcard-top' }, h('span', { class: 'lvpill' }, h('i', { class: 'eq' }, h('b'), h('b'), h('b')), 'LIVE'),
      h('span', { class: 'lvview', html: icon('eye') + fmtCount(s.viewers) })),
    s.kind === 'video' && h('span', { class: 'lvkind', html: LOOP + 'Phát video' }),
    h('div', { class: 'lvcard-info' }, h('b', { translate: 'no' }, s.title), h('span', {}, avatar(s.host, 'sm'), s.host.name, s.gifts > 0 && h('em', { html: COIN + fmtCount(s.gifts) }))));
}
async function pageLive() {
  const { streams } = await api('/streams');
  const go = S.user ? h('a', { class: 'btn primary lg', href: '#/golive', html: icon('live') + '<span>Phát trực tiếp</span>' }) : h('button', { type: 'button', class: 'btn primary lg', onclick: () => openAuth('register'), html: icon('live') + '<span>Đăng ký để phát live</span>' });
  main.append(h('div', { class: 'lvx' }, h('div', { class: 'wrap' },
    h('section', { class: 'lv-hero' },
      h('div', {}, h('span', { class: 'lvpill big' }, h('i', { class: 'eq' }, h('b'), h('b'), h('b')), 'LIVE'), h('h1', {}, 'Livestream'),
        h('p', {}, 'Trò chuyện trực tiếp, thả tim, tặng quà cho người bạn yêu thích. Bận không live được? Đăng video dài và để nó phát liên tục.'),
        h('div', { class: 'row' }, go, h('span', { class: 'muted' }, streams.length ? streams.length + ' phòng đang mở' : ''))),
      h('ul', { class: 'lv-perks' }, [['💬', 'Bình luận trực tiếp'], ['🎁', 'Tặng quà, nhận xu mỗi ngày'], ['😍', 'Thả cảm xúc bay khắp màn hình'], ['🔁', 'Live bằng video, phát lặp lại']].map(([e, t]) => h('li', {}, h('span', {}, e), t)))),
    streams.length ? h('div', { class: 'lvgrid' }, streams.map(liveCard))
      : h('div', { class: 'card empty' }, h('div', { class: 'ico', html: icon('live') }), h('h3', {}, 'Hiện chưa có buổi live nào'), h('p', {}, 'Hãy mở buổi live đầu tiên và mời mọi người vào trò chuyện!'), S.user && h('a', { class: 'btn primary', style: 'margin-top:14px', href: '#/golive' }, 'Bắt đầu phát')))), footer());
}

// ---------- going live (#/golive) ----------
async function pageGoLive() {
  if (!S.user) { openAuth('login'); location.hash = '#/'; return; }
  let mode = 'webrtc';
  const err = h('div', { class: 'err', hidden: true });
  const title = h('input', { name: 'title', maxlength: 80, required: true, placeholder: 'VD: Trò chuyện tối thứ 6 ✨' });
  // --- long video ---
  const fileIn = h('input', { type: 'file', accept: 'video/mp4,video/webm,video/quicktime', class: 'sr', id: 'lvfile' });
  const pickInfo = h('div', { class: 'lv-pickinfo', hidden: true });
  const loop = h('input', { type: 'checkbox', checked: true });
  let chosen = null; // { file?, videoId?, duration, thumb? }
  const probe = (src) => new Promise((resolve) => {
    const v = document.createElement('video'); v.muted = true; v.preload = 'metadata'; v.playsInline = true; v.crossOrigin = 'anonymous';
    v.onloadedmetadata = () => { const d = v.duration; v.currentTime = Math.min(2, d / 3); v.onseeked = () => {
      let thumb = null;
      try { const k = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight)); const c = document.createElement('canvas'); c.width = v.videoWidth * k; c.height = v.videoHeight * k; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); c.toBlob((b) => resolve({ duration: d, thumb: b }), 'image/jpeg', 0.85); return; } catch {}
      resolve({ duration: d, thumb });
    }; };
    v.onerror = () => resolve(null); v.src = src;
  });
  const showPick = (label, sub, thumbUrl) => { pickInfo.hidden = false; pickInfo.replaceChildren(thumbUrl ? h('img', { src: thumbUrl, alt: '' }) : h('span', { class: 'lv-pickph', html: LOOP }), h('div', {}, h('b', {}, label), h('small', {}, sub))); };
  fileIn.addEventListener('change', async () => {
    const f = fileIn.files[0]; if (!f) return;
    if (f.size > 1024 * 1024 * 1024) { toast('Video tối đa 1GB', true); fileIn.value = ''; return; }
    showPick(f.name, 'Đang đọc video…');
    const url = URL.createObjectURL(f), p = await probe(url);
    if (!p || !isFinite(p.duration)) { toast('Không đọc được video này, hãy thử video MP4 khác', true); pickInfo.hidden = true; chosen = null; return; }
    chosen = { file: f, duration: p.duration, thumb: p.thumb };
    showPick(f.name, fmtDur(p.duration) + ' · ' + fmtMB(f.size) + ' MB', p.thumb ? URL.createObjectURL(p.thumb) : '');
  });
  const mine = h('div', { class: 'lv-mine' });
  (async () => {
    try {
      const d = await api('/users/' + S.user.id + '/videos-page?page=1');
      const own = d.videos.filter((v) => v.file);
      if (!own.length) return;
      mine.append(h('p', { class: 'muted', style: 'font-size:13px;margin:4px 0 8px' }, 'Hoặc chọn một video bạn đã đăng:'),
        h('div', { class: 'lv-minegrid' }, own.map((v) => h('button', { type: 'button', onclick: async (e) => {
          mine.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget));
          fileIn.value = ''; showPick(v.caption || 'Video #' + v.id, 'Đang đọc video…', v.thumb);
          const p = await probe(v.file);
          if (!p) { toast('Không đọc được video này', true); return; }
          chosen = { videoId: v.id, duration: p.duration, thumb: v.thumb ? null : p.thumb };
          showPick(v.caption || 'Video #' + v.id, fmtDur(p.duration) + ' · video đã đăng', v.thumb);
        } }, v.thumb ? h('img', { src: v.thumb, alt: '' }) : h('span', { html: icon('play') })))));
    } catch {}
  })();
  const videoBox = h('div', { class: 'lv-mode-body', hidden: true },
    h('label', { class: 'lv-drop', for: 'lvfile' }, h('span', { html: LOOP }), h('b', {}, 'Chọn video dài để phát'), h('small', {}, 'MP4/WebM/MOV, tối đa 1GB')), fileIn, pickInfo, mine,
    h('label', { class: 'check lv-loop' }, loop, h('span', {}, h('b', {}, 'Phát lặp lại liên tục'), ' — video tự phát lại từ đầu khi hết, buổi live mở cho tới khi bạn bấm Kết thúc. Bỏ chọn để buổi live tự kết thúc khi video chạy hết.')),
    h('p', { class: 'muted', style: 'font-size:13px' }, 'Mọi người vào phòng đều xem cùng một thời điểm như đang live thật, vẫn bình luận, thả tim và tặng quà được, kể cả khi bạn tắt máy.'));
  // --- link ---
  const linkKind = h('select', {}, h('option', { value: 'youtube' }, 'YouTube Live'), h('option', { value: 'hls' }, 'Luồng HLS (.m3u8) từ OBS / dịch vụ stream'));
  const source = h('input', { type: 'url', placeholder: 'https://…' });
  const linkBox = h('div', { class: 'lv-mode-body', hidden: true }, h('label', { class: 'f' }, h('span', {}, 'Loại liên kết'), linkKind), h('label', { class: 'f' }, h('span', {}, 'Liên kết phát'), source));
  const camBox = h('div', { class: 'lv-mode-body' }, h('p', { class: 'muted' }, 'Phát trực tiếp bằng camera và micro của điện thoại hoặc máy tính. Hãy cho phép trình duyệt dùng camera khi được hỏi.'));
  const modeBtn = (k, svg, t, sub) => h('button', { type: 'button', class: 'lv-mode' + (k === mode ? ' on' : ''), onclick: (e) => {
    mode = k; modes.querySelectorAll('.lv-mode').forEach((b) => b.classList.toggle('on', b === e.currentTarget));
    camBox.hidden = k !== 'webrtc'; videoBox.hidden = k !== 'video'; linkBox.hidden = k !== 'link';
  } }, h('span', { class: 'lv-mode-ic', html: svg }), h('b', {}, t), h('small', {}, sub));
  const modes = h('div', { class: 'lv-modes' }, modeBtn('webrtc', CAM, 'Live bằng camera', 'Trực tiếp ngay'), modeBtn('video', LOOP, 'Live bằng video', 'Phát video dài, lặp lại'), modeBtn('link', LINK, 'Liên kết ngoài', 'YouTube / OBS'));
  const up = h('div', { class: 'upbar', hidden: true }, h('i'), h('span'));
  const btn = h('button', { class: 'btn primary lg', style: 'width:100%', type: 'submit', html: icon('live') + '<span>Bắt đầu phát</span>' });
  const f = h('form', { class: 'card lv-go' }, h('h1', { class: 'title' }, 'Bắt đầu livestream'), h('p', { class: 'muted', style: 'margin-bottom:18px' }, 'Chọn cách phát phù hợp với bạn.'), err,
    modes, h('label', { class: 'f' }, h('span', {}, 'Tiêu đề buổi live'), title), camBox, videoBox, linkBox,
    h('div', { class: 'notice', style: 'margin:6px 0 16px', html: icon('shield') + '<span>Livestream phải tuân thủ quy tắc cộng đồng: không nội dung khiêu dâm, không kêu gọi chuyển tiền.</span>' }), up, btn);
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); err.hidden = true;
    const fd = new FormData(); fd.set('title', title.value.trim());
    if (mode === 'video') {
      if (!chosen) { err.textContent = 'Hãy chọn video để phát'; err.hidden = false; return; }
      fd.set('kind', 'video'); fd.set('duration', String(chosen.duration)); fd.set('loop', loop.checked ? '1' : '0');
      if (chosen.file) fd.set('file', chosen.file, chosen.file.name); else fd.set('videoId', String(chosen.videoId));
      if (chosen.thumb) fd.set('thumb', chosen.thumb, 'cover.jpg');
    } else if (mode === 'link') { fd.set('kind', linkKind.value); fd.set('source', source.value.trim()); }
    else fd.set('kind', 'webrtc');
    btn.disabled = true;
    try {
      const job = apiUpload('/streams', fd, (l, t) => { up.hidden = false; const p = Math.floor(l / t * 100); up.firstChild.style.width = p + '%'; up.lastChild.textContent = p >= 100 ? 'Đang chuẩn bị phòng live…' : 'Đang tải video lên… ' + p + '% (' + fmtMB(l) + '/' + fmtMB(t) + ' MB)'; });
      const r = await job.promise;
      location.hash = '#/live/' + r.id + (mode === 'webrtc' ? '?host=1' : '');
    } catch (ex) { btn.disabled = false; up.hidden = true; if (ex.status === 401) return openAuth('login'); err.textContent = ex.message; err.hidden = false; }
  });
  main.append(h('div', { class: 'lvx' }, h('div', { class: 'wrap', style: 'max-width:720px;padding:28px 0 60px' }, f)));
}

// ---------- the live room (#/live/:id) ----------
async function pageStream(id, wantHost) {
  const [{ stream, serverNow }, cat] = await Promise.all([api('/streams/' + id), catalog(true).catch(() => null)]);
  const skew = serverNow - Date.now();
  if (!stream.live) {
    main.append(h('div', { class: 'lvx' }, h('div', { class: 'empty', style: 'padding:100px 20px' }, h('div', { class: 'ico', html: icon('live') }), h('h3', {}, 'Buổi live đã kết thúc'), h('p', { class: 'muted' }, 'Theo dõi ' + stream.host.name + ' để không bỏ lỡ buổi live sau.'),
      h('div', { class: 'row', style: 'justify-content:center;margin-top:14px' }, h('a', { class: 'btn primary', href: '#/live' }, 'Xem buổi live khác'), h('a', { class: 'btn', href: '#/u/' + stream.host.id }, 'Xem hồ sơ')))));
    return;
  }
  const me = S.user, isHost = !!me && me.id === stream.host.id;
  const cid = Math.random().toString(36).slice(2, 12);
  const stage = h('div', { class: 'lv-stage' });
  const fx = h('div', { class: 'lv-fx', 'aria-hidden': 'true' }); // floating reactions
  const banners = h('div', { class: 'lv-banners', 'aria-live': 'polite' }); // gift banners
  const big = h('div', { class: 'lv-big', 'aria-hidden': 'true' }); // big gift animation
  const chat = h('div', { class: 'lv-chat', 'aria-live': 'polite' });
  const vcount = h('b', {}, fmtCount(stream.viewers));
  const fansRow = h('div', { class: 'lv-fans' });
  const giftTotal = h('span', { class: 'lv-total', html: COIN + '<b>' + fmtCount(stream.gifts) + '</b>' });
  const pinBar = h('div', { class: 'lv-pin', hidden: true });
  const fansList = h('ol', { class: 'lv-fanlist' });

  // --- media ---
  const video = h('video', { playsinline: true, autoplay: true, muted: true });
  video.muted = true;
  const wait = h('div', { class: 'lv-wait' }, h('div', { class: 'spin' }), h('p', {}, isHost && stream.kind === 'webrtc' ? 'Đang bật camera…' : 'Đang kết nối…'));
  const unmute = h('button', { type: 'button', class: 'lv-unmute', hidden: true, onclick: (e) => { e.stopPropagation(); video.muted = !video.muted; unmute.textContent = video.muted ? '🔇 Bật tiếng' : '🔊 Đang bật tiếng'; video.play().catch(() => {}); } }, '🔇 Bật tiếng');
  if (stream.kind === 'youtube') stage.append(h('iframe', { src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(stream.source)}?autoplay=1&mute=1&rel=0&playsinline=1`, allow: 'autoplay; encrypted-media; picture-in-picture', allowfullscreen: true, title: stream.title }));
  else if (stream.kind === 'hls') {
    stage.append(video); unmute.hidden = false;
    if (window.Hls && Hls.isSupported()) { const hls = new Hls({ lowLatencyMode: true }); hls.loadSource(stream.source); hls.attachMedia(video); onLeave(() => hls.destroy()); } else video.src = stream.source;
    video.play().catch(() => {});
  } else if (stream.kind === 'video') {
    // everyone sees the same moment: position = time since the start (modulo the length when looping)
    stage.append(video, wait); video.loop = stream.loop; video.preload = 'auto'; video.src = stream.file;
    const target = () => {
      const d = isFinite(video.duration) && video.duration > 0 ? video.duration : stream.duration;
      const t = (Date.now() + skew - stream.startedAt) / 1000;
      return stream.loop ? t % d : Math.min(t, d);
    };
    const sync = (force) => { const t = target(); if (force || Math.abs(video.currentTime - t) > 4) { try { video.currentTime = t; } catch {} } };
    video.addEventListener('loadedmetadata', () => { sync(true); video.play().catch(() => {}); }, { once: true });
    video.addEventListener('playing', () => { wait.remove(); unmute.hidden = false; });
    video.addEventListener('pause', () => { if (!video.ended) setTimeout(() => video.play().catch(() => {}), 300); });
    const t = setInterval(() => { if (!video.paused) sync(false); }, 15000); onLeave(() => clearInterval(t));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(false); });
  } else stage.append(video, wait);

  // --- header ---
  let following = false;
  const followBtn = !isHost && h('button', { type: 'button', class: 'lv-follow' }, '+ Theo dõi');
  if (followBtn) {
    if (me) api('/users/' + stream.host.id).then((d) => { following = d.following; followBtn.hidden = following; }).catch(() => {});
    followBtn.addEventListener('click', async (e) => { e.stopPropagation(); if (!(await needLogin())) return; try { const r = await api('/users/' + stream.host.id + '/follow', { method: 'POST' }); following = r.following; followBtn.hidden = following; toast(following ? 'Đã theo dõi ' + stream.host.name : 'Đã bỏ theo dõi'); } catch (er) { fail(er); } });
  }
  const endLive = async () => { if (!confirm('Kết thúc buổi live?')) return; await api('/streams/' + id + '/end', { method: 'POST' }); toast('Đã kết thúc buổi live'); location.hash = '#/live'; };
  const top = h('div', { class: 'lv-top' },
    h('div', { class: 'lv-host' }, h('a', { href: '#/u/' + stream.host.id }, avatar(stream.host, 'md')), h('div', {}, h('b', { translate: 'no' }, stream.host.name), giftTotal), followBtn),
    h('div', { class: 'lv-topr' }, fansRow, h('span', { class: 'lv-vc', html: icon('eye') }, vcount),
      h('button', { type: 'button', class: 'lv-x', 'aria-label': isHost ? 'Kết thúc' : 'Rời phòng', onclick: () => (isHost ? endLive() : (location.hash = '#/live')), html: icon('x') })));
  const titleBar = h('div', { class: 'lv-title' }, h('span', { class: 'lvpill' }, h('i', { class: 'eq' }, h('b'), h('b'), h('b')), 'LIVE'), stream.kind === 'video' && h('span', { class: 'lvkind sm', html: LOOP + (stream.loop ? 'Phát lặp lại' : 'Phát video') }), h('span', { translate: 'no' }, stream.title));

  // --- chat rows ---
  const addRow = (el) => { chat.append(el); while (chat.children.length > 120) chat.firstChild.remove(); const near = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 140; if (near) chat.scrollTop = chat.scrollHeight; };
  const addMsg = (m) => {
    const hostMsg = m.user.id === stream.host.id;
    if (m.kind === 'gift') { const g = giftOf(m.gift); addRow(h('div', { class: 'lv-row gift' }, avatar(m.user, 'sm'), h('div', {}, h('b', {}, m.user.name), ' đã tặng ', h('span', { class: 'lv-gname' }, g.name + ' ' + g.icon), m.qty > 1 ? ' x' + m.qty : ''))); return; }
    const row = h('div', { class: 'lv-row' + (hostMsg ? ' host' : '') }, avatar(m.user, 'sm'), h('div', { translate: 'no' }, h('b', {}, m.user.name, hostMsg && h('i', { class: 'lv-hosttag' }, 'Chủ phòng')), ' ', m.body));
    if (isHost && m.body) { row.classList.add('pinnable'); row.title = 'Bấm để ghim bình luận'; row.addEventListener('click', () => { if (confirm('Ghim bình luận này lên đầu phòng live?')) api('/streams/' + id + '/pin', { method: 'POST', body: { body: m.body, name: m.user.name } }).catch(fail); }); }
    addRow(row);
  };
  const setPin = (p) => {
    pinBar.hidden = !p; if (!p) return;
    pinBar.replaceChildren(...[h('span', { class: 'lv-pin-ic', html: PIN }), h('div', {}, h('small', {}, 'Đã ghim · ' + p.user), h('p', { translate: 'no' }, p.body)),
      isHost && h('button', { type: 'button', 'aria-label': 'Bỏ ghim', onclick: () => api('/streams/' + id + '/pin', { method: 'POST', body: { body: '' } }).catch(fail), html: icon('x') })].filter(Boolean));
  };
  setPin(stream.pinned);
  const paintFans = (list) => {
    fansRow.replaceChildren(...list.slice(0, 3).map((u, i) => h('span', { class: 'lv-fan r' + i, title: u.name + ' · ' + u.value + ' xu' }, avatar(u, 'sm'))));
    fansList.replaceChildren(...(list.length ? list.map((u, i) => h('li', {}, h('span', { class: 'lv-rank r' + i }, String(i + 1)), avatar(u, 'sm'), h('b', {}, u.name), h('em', { html: COIN + fmtCount(u.value) })))
      : [h('li', { class: 'muted' }, 'Chưa có ai tặng quà. Hãy là người đầu tiên! 🎁')]));
  };

  // --- floating reactions ---
  const float = (emoji, n = 1, x) => {
    for (let i = 0; i < Math.min(n, 12); i++) {
      const el = h('span', { class: 'lv-float' + (Math.random() < .3 ? ' glow' : '') }, emoji);
      el.style.setProperty('--dx', (Math.random() * 120 - 60).toFixed(0) + 'px');
      el.style.setProperty('--rot', (Math.random() * 60 - 30).toFixed(0) + 'deg');
      el.style.setProperty('--dur', (2.2 + Math.random() * 1.4).toFixed(2) + 's');
      el.style.setProperty('--s', (0.8 + Math.random() * 0.7).toFixed(2));
      el.style.animationDelay = (i * 0.12).toFixed(2) + 's';
      if (x != null) { el.style.left = x + 'px'; el.style.right = 'auto'; }
      el.addEventListener('animationend', () => el.remove());
      fx.append(el);
    }
  };
  const pend = new Map(); let sendT = null;
  const react = (emoji, x) => {
    float(emoji, 1, x);
    pend.set(emoji, (pend.get(emoji) || 0) + 1);
    clearTimeout(sendT);
    sendT = setTimeout(() => { for (const [e, n] of pend) api('/streams/' + id + '/react', { method: 'POST', body: { emoji: e, n, cid } }).catch(() => {}); pend.clear(); }, 400);
  };
  stage.addEventListener('dblclick', (e) => { const r = stage.getBoundingClientRect(); const hb = h('span', { class: 'lv-tapheart', style: `left:${e.clientX - r.left}px;top:${e.clientY - r.top}px` }, '❤️'); stage.append(hb); setTimeout(() => hb.remove(), 900); react('❤️'); });

  // --- gift banners & big animation ---
  const combos = new Map();
  const showGift = (d) => {
    const g = giftOf(d.gift), key = d.user.id + '|' + g.id;
    let c = combos.get(key);
    if (c) { c.n += d.qty; c.count.textContent = 'x' + c.n; c.count.classList.remove('bump'); void c.count.offsetWidth; c.count.classList.add('bump'); clearTimeout(c.t); }
    else {
      const count = h('b', { class: 'lv-combo' }, 'x' + d.qty);
      const el = h('div', { class: 'lv-banner' + (g.price >= 99 ? ' rich' : '') }, avatar(d.user, 'sm'), h('div', {}, h('b', {}, d.user.name), h('small', {}, 'đã tặng ' + g.name)), h('span', { class: 'lv-banner-ic' }, g.icon), count);
      c = { n: d.qty, count, el }; combos.set(key, c); banners.append(el);
      while (banners.children.length > 3) banners.firstChild.remove();
    }
    c.t = setTimeout(() => { c.el.classList.add('out'); setTimeout(() => c.el.remove(), 400); combos.delete(key); }, 3500);
    if (g.price * d.qty >= 99 || g.price >= 99) {
      const burst = h('div', { class: 'lv-burst' }, h('span', { class: 'lv-big-ic' }, g.icon), h('div', { class: 'lv-big-txt' }, h('b', {}, d.user.name), ' tặng ', g.name, d.qty > 1 ? ' x' + d.qty : ''),
        ...Array.from({ length: 14 }, (_, i) => h('i', { style: `--a:${i * (360 / 14)}deg;--d:${80 + Math.random() * 90}px` })));
      big.replaceChildren(burst); setTimeout(() => { if (burst.isConnected) burst.remove(); }, 3200);
    } else float(g.icon, Math.min(d.qty, 6));
  };

  // --- bottom bar ---
  const input = h('input', { placeholder: me ? 'Bình luận…' : 'Đăng nhập để bình luận', maxlength: 200, 'aria-label': 'Bình luận', autocomplete: 'off', enterkeyhint: 'send' });
  const form = h('form', { class: 'lv-input' }, input, h('button', { type: 'submit', 'aria-label': 'Gửi', html: icon('send') }));
  input.addEventListener('focus', () => { if (!me) { input.blur(); openAuth('login'); } });
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!me) return openAuth('login');
    const body = input.value.trim(); if (!body) return; input.value = '';
    try { await api('/streams/' + id + '/chat', { method: 'POST', body: { body } }); } catch (ex) { fail(ex); input.value = body; }
  });
  const reacts = (cat && cat.reacts) || ['❤️', '😍', '🔥', '👏', '😂', '😮', '🌹', '🎉', '💋', '🥰'];
  const picker = h('div', { class: 'lv-picker', hidden: true }, reacts.map((e) => h('button', { type: 'button', 'aria-label': 'Thả ' + e, onclick: (ev) => { ev.stopPropagation(); react(e); ev.currentTarget.classList.remove('pop'); void ev.currentTarget.offsetWidth; ev.currentTarget.classList.add('pop'); } }, e)));
  const smile = h('button', { type: 'button', class: 'lv-btn', 'aria-label': 'Thả cảm xúc', html: SMILE, onclick: (e) => { e.stopPropagation(); picker.hidden = !picker.hidden; } });
  const giftBtn = !isHost && h('button', { type: 'button', class: 'lv-btn gift', 'aria-label': 'Tặng quà', html: GIFT, onclick: () => openGifts() });
  const heartBtn = h('button', { type: 'button', class: 'lv-btn heart', 'aria-label': 'Thả tim', onclick: () => react('❤️') }, '❤️');
  const moreBtn = h('button', { type: 'button', class: 'lv-btn', 'aria-label': 'Thêm', html: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>', onclick: () => {
    let m;
    const item = (ic, label, fn) => h('button', { type: 'button', class: 'menu-item', onclick: () => { m.close(); fn(); }, html: icon(ic) + '<span>' + label + '</span>' });
    m = modal(h('div', { class: 'menu-list' }, h('h3', {}, stream.title),
      !isHost && item('send', 'Nhắn riêng cho ' + stream.host.name, () => startChat(stream.host)),
      !isHost && item('cal', 'Hẹn gặp', () => openBook(stream.host)),
      item('share', 'Chia sẻ buổi live', async () => { const url = location.origin + '/#/live/' + id; try { if (navigator.share) return await navigator.share({ title: stream.title, url }); } catch { return; } try { await navigator.clipboard.writeText(url); toast('Đã sao chép liên kết'); } catch { toast(url); } }),
      item('users', 'Top fan', () => modal(h('div', { class: 'lvx' }, h('h3', {}, '🏆 Top fan buổi live'), fansList), { sheet: true })),
      isHost ? item('x', 'Kết thúc buổi live', endLive) : item('flag', 'Báo cáo', () => openReport('stream', id))), { sheet: true });
  } });
  document.addEventListener('click', (e) => { if (!picker.hidden && !picker.contains(e.target) && e.target !== smile) picker.hidden = true; });
  const bottom = h('div', { class: 'lv-bottom' }, picker, form, smile, giftBtn, heartBtn, moreBtn);

  // --- gifts sheet ---
  async function openGifts() {
    if (!(await needLogin())) return;
    let c; try { c = await catalog(true); } catch (e) { return fail(e); }
    let pick = c.gifts[0], qty = 1;
    const coins = h('b', {}, fmtCount(c.wallet ? c.wallet.coins : 0));
    const grid = h('div', { class: 'gf-grid' }, c.gifts.map((g, i) => h('button', { type: 'button', class: 'gf' + (i ? '' : ' on'), onclick: (e) => { pick = g; grid.querySelectorAll('.gf').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); paint(); } },
      h('span', { class: 'gf-ic' }, g.icon), h('b', {}, g.name), h('small', { html: COIN + g.price }))));
    const qtys = h('div', { class: 'gf-qty' }, [1, 5, 10, 99].map((n) => h('button', { type: 'button', class: n === 1 ? 'on' : '', onclick: (e) => { qty = n; qtys.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); paint(); } }, 'x' + n)));
    const send = h('button', { type: 'button', class: 'btn primary' });
    const paint = () => { const v = pick.price * qty; send.innerHTML = 'Tặng ' + pick.icon + ' · ' + COIN + v; send.disabled = c.wallet && c.wallet.coins < v; };
    paint();
    send.addEventListener('click', async () => {
      send.disabled = true;
      try { const r = await api('/streams/' + id + '/gift', { method: 'POST', body: { gift: pick.id, qty } }); c.wallet = r.wallet; CATALOG.wallet = r.wallet; coins.textContent = fmtCount(r.wallet.coins); toast('Đã tặng ' + pick.name + ' ' + pick.icon); }
      catch (e) { fail(e); }
      paint();
    });
    modal(h('div', { class: 'lvx gf-sheet' }, h('div', { class: 'gf-head' }, h('h3', {}, '🎁 Tặng quà cho ' + stream.host.name), h('span', { class: 'gf-wallet', html: COIN }, coins, ' xu')),
      h('p', { class: 'muted gf-note' }, 'Mỗi ngày bạn được tặng ' + c.daily + ' xu miễn phí để tặng quà.'), grid, h('div', { class: 'gf-foot' }, qtys, send)), { sheet: true });
  }

  // --- layout ---
  stage.append(fx, big, h('div', { class: 'lv-shade' }), top, titleBar, pinBar, banners, chat, bottom, unmute);
  const side = h('aside', { class: 'lv-side' },
    h('section', { class: 'card' }, h('h3', {}, '🏆 Top fan'), fansList),
    h('section', { class: 'card lv-about' }, h('a', { href: '#/u/' + stream.host.id, class: 'lv-about-host' }, avatar(stream.host, 'lg'), h('div', {}, h('b', {}, stream.host.name), h('small', { class: 'muted' }, stream.host.city || ''))),
      h('p', {}, stream.title),
      !isHost && h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn sm', onclick: () => startChat(stream.host), html: icon('send') + '<span>Nhắn riêng</span>' }), h('button', { type: 'button', class: 'btn sm', onclick: () => openBook(stream.host), html: icon('cal') + '<span>Hẹn gặp</span>' })),
      isHost && h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn live sm', onclick: endLive }, 'Kết thúc buổi live')),
      isHost && h('p', { class: 'muted', style: 'font-size:13px' }, 'Mẹo: bấm vào một bình luận để ghim lên đầu phòng.')),
    !isHost && h('button', { type: 'button', class: 'btn primary lg', onclick: () => openGifts(), html: GIFT + '<span>Tặng quà</span>' }));
  main.append(h('div', { class: 'lvx lv-room' }, stage, side));
  paintFans([]);

  // --- WebRTC (camera lives) ---
  let clientId = null; const peers = new Map(); let localStream = null;
  let RTC = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] };
  if (me && stream.kind === 'webrtc') { try { RTC = await rtcConfig(); } catch {} }
  const signal = (to, data) => api('/streams/' + id + '/signal', { method: 'POST', body: { from: clientId, to, data } }).catch(() => {});
  async function hostPeer(viewerId) {
    const pc = new RTCPeerConnection(RTC); peers.set(viewerId, pc);
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    pc.onicecandidate = (e) => e.candidate && signal(viewerId, { ice: e.candidate });
    pc.onconnectionstatechange = () => { if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) { pc.close(); peers.delete(viewerId); } };
    await pc.setLocalDescription(await pc.createOffer()); signal(viewerId, { sdp: pc.localDescription });
  }
  async function viewerSignal(from, data) {
    let pc = peers.get(from);
    if (!pc) {
      pc = new RTCPeerConnection(RTC); peers.set(from, pc);
      pc.ontrack = (e) => { video.srcObject = e.streams[0]; video.muted = true; video.play().catch(() => {}); wait.remove(); unmute.hidden = false; };
      pc.onicecandidate = (e) => e.candidate && signal(from, { ice: e.candidate });
    }
    if (data.sdp) { await pc.setRemoteDescription(data.sdp); if (data.sdp.type === 'offer') { await pc.setLocalDescription(await pc.createAnswer()); signal(from, { sdp: pc.localDescription }); } }
    else if (data.ice) pc.addIceCandidate(data.ice).catch(() => {});
  }
  if (stream.kind === 'webrtc' && isHost && wantHost) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' }, audio: true });
      video.srcObject = localStream; video.muted = true; video.classList.add('mirror'); wait.remove();
      onLeave(() => localStream.getTracks().forEach((t) => t.stop()));
    } catch { wait.replaceChildren(h('p', {}, 'Không truy cập được camera/micro. Hãy cấp quyền cho trình duyệt rồi tải lại trang.')); }
  } else if (stream.kind === 'webrtc' && isHost) wait.replaceChildren(h('p', {}, 'Bạn đang xem phòng live của mình.'), h('a', { class: 'btn primary', href: '#/live/' + id + '?host=1' }, 'Mở camera trên thiết bị này'));

  // --- realtime ---
  const es = new EventSource(`/api/streams/${id}/events${isHost && wantHost && stream.kind === 'webrtc' ? '?host=1' : ''}`);
  onLeave(() => { es.close(); peers.forEach((p) => p.close()); });
  es.addEventListener('hello', (e) => { const d = JSON.parse(e.data); clientId = d.clientId; vcount.textContent = fmtCount(d.viewers); chat.replaceChildren(h('div', { class: 'lv-row sys' }, '👋 Chào mừng bạn đến phòng live! Hãy bình luận văn minh, tôn trọng mọi người.')); d.chat.forEach(addMsg); paintFans(d.fans); giftTotal.lastChild.textContent = fmtCount(d.gifts); });
  es.addEventListener('viewers', (e) => { vcount.textContent = fmtCount(JSON.parse(e.data).viewers); });
  es.addEventListener('chat', (e) => addMsg(JSON.parse(e.data)));
  es.addEventListener('join', (e) => { const d = JSON.parse(e.data); addRow(h('div', { class: 'lv-row sys join' }, h('b', {}, d.user.name), ' đã vào phòng 👋')); });
  es.addEventListener('react', (e) => { const d = JSON.parse(e.data); if (d.cid !== cid) float(d.emoji, d.n); });
  es.addEventListener('gift', (e) => { const d = JSON.parse(e.data); showGift(d); addMsg({ kind: 'gift', user: d.user, gift: d.gift, qty: d.qty }); giftTotal.lastChild.textContent = fmtCount(d.total); });
  es.addEventListener('fans', (e) => paintFans(JSON.parse(e.data).fans));
  es.addEventListener('pin', (e) => setPin(JSON.parse(e.data).pinned));
  es.addEventListener('ended', () => { toast('Buổi live đã kết thúc'); setTimeout(() => { if (location.hash.startsWith('#/live/' + id)) location.hash = '#/live'; }, 1500); });
  es.addEventListener('viewer-join', (e) => { if (localStream) hostPeer(JSON.parse(e.data).clientId); });
  es.addEventListener('viewer-leave', (e) => { const k = JSON.parse(e.data).clientId; const p = peers.get(k); if (p) { p.close(); peers.delete(k); } });
  es.addEventListener('signal', (e) => { const { from, data } = JSON.parse(e.data); if (!isHost || !localStream) viewerSignal(from, data); else { const pc = peers.get(from); if (pc) { if (data.sdp) pc.setRemoteDescription(data.sdp).catch(() => {}); else if (data.ice) pc.addIceCandidate(data.ice).catch(() => {}); } } });
}

window.XGLive = { pageLive, pageGoLive, pageStream, liveCard };
})();
