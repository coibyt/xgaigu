// xgaigu – admin dashboard (#/admin/<section>): a left sidebar on computers, a drawer menu on phones,
// and one section shown at a time so the page stays light and easy to read.
(() => {
const { h, api, apiUpload, toast, fail, modal, ask, S, main, renderPager, timeAgo, geoPicker, countryName, REGION_NAMES, adminVideoDialog } = window.XG;

// ---------- icons (simple line icons) ----------
const P = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  flag: 'M4 22V4M4 4h13l-2 4 2 4H4',
  film: 'M4 4h16v16H4zM8 4v16M16 4v16M4 9h4M16 9h4M4 15h4M16 15h4',
  radio: 'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2',
  bag: 'M6 7h12l1 14H5zM9 7a3 3 0 0 1 6 0',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  phone: 'M7 2h10v20H7zM11 18h2',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  zip: 'M21 8v13H3V8M1 3h22v5H1zM10 12h4',
  music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  menu: 'M3 6h18M3 12h18M3 18h18',
  x: 'M18 6 6 18M6 6l12 12',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  disk: 'M22 12H2M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6zM6 16h.01M10 16h.01',
  cart: 'M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2M20 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M20 6 9 17l-5-5',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20',
  home: 'M3 10.5 12 3l9 7.5V21H3zM9 21v-6h6v6',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
const fmtBytes = (b) => { if (b == null) return '–'; const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; } return (b >= 100 || i === 0 ? Math.round(b) : b.toFixed(1)).toString().replace('.', ',') + ' ' + u[i]; };
const vnDate = (d) => d.split('-').reverse().join('/');

// ---------- the menu ----------
const NAV = [
  ['Tổng quan', [['overview', 'Tổng quan', 'grid', 'Số liệu chính của website'], ['traffic', 'Lượt truy cập', 'chart', 'Khách đang xem, theo ngày']]],
  ['Kiểm duyệt', [['reports', 'Báo cáo', 'flag', 'Nội dung bị khách báo cáo'], ['videos', 'Video', 'film', 'Ẩn, cấm, sửa, xác minh video'], ['live', 'Livestream', 'radio', 'Buổi live đang phát, khoá live'], ['shop', 'Gian hàng', 'bag', 'Sản phẩm và đơn hàng']]],
  ['Thành viên', [['members', 'Thành viên', 'users', 'Tài khoản, xác minh, khoá, mật khẩu'], ['mail', 'Email', 'mail', 'Xác nhận email, gửi thư quảng bá']]],
  ['Tăng trưởng', [['seo', 'SEO khu vực', 'search', 'Nội dung Google cho trang khu vực'], ['telegram', 'Telegram', 'send', 'Nhóm, bot, tự đăng, tự trả lời'], ['app', 'Ứng dụng & QR', 'phone', 'Link tải app, mã QR, lượt cài']]],
  ['Cài đặt', [['display', 'Hiển thị & đề xuất', 'sliders', 'Tỉ lệ đề xuất, số video mỗi trang'], ['compress', 'Nén video', 'zip', 'Giúp video tải nhanh hơn'], ['music', 'Thư viện nhạc', 'music', 'Nhạc cho trình chỉnh sửa video']]],
];
const ITEMS = Object.fromEntries(NAV.flatMap(([g, list]) => list.map(([k, label, icon, desc]) => [k, { k, label, icon, desc, group: g }])));
let counts = {}; // little numbers on the menu (reports waiting, lives running)

// ---------- shared building blocks ----------
// a section card: title, short help text, then its content
const panel = (title, desc, ...kids) => h('section', { class: 'adm-panel' }, (title || desc) && h('header', { class: 'adm-panel-h' }, title && h('h3', {}, title), desc && h('p', {}, desc)), h('div', { class: 'adm-panel-b' }, ...kids));
// a number card
const kpi = ({ label, value, sub, icon, tone = '', href, live }) => h(href ? 'a' : 'div', { class: 'adm-kpi ' + tone, href },
  h('div', { class: 'adm-kpi-top' }, h('span', { class: 'adm-kpi-ic', html: ic(icon) }), h('span', { class: 'adm-kpi-l' }, label), live && h('span', { class: 'adm-pulse', 'aria-hidden': 'true' })),
  h('div', { class: 'adm-kpi-v' }, value), sub && h('div', { class: 'adm-kpi-s' }, sub));
const stat = (label, value) => h('div', { class: 'adm-stat' }, h('span', {}, label), h('b', {}, value));
// a switch that looks like a toggle; still a real checkbox for screen readers
const sw = (checked, label, onchange) => { const i = h('input', { type: 'checkbox', class: 'adm-sw', role: 'switch', checked: !!checked }); if (onchange) i.addEventListener('change', () => onchange(i.checked, i)); return label ? h('label', { class: 'adm-swl' }, i, h('span', {}, label)) : i; };
const searchBox = (ph) => h('input', { type: 'search', class: 'adm-search', placeholder: ph, enterkeyhint: 'search' });
const table = (cols, body, cls = '') => h('div', { class: 'adm-tw' }, h('table', { class: 't adm-t ' + cls }, h('thead', {}, h('tr', {}, cols.map((c) => h('th', {}, c)))), body));
const td = (label, ...kids) => h('td', { 'data-l': label }, ...kids);
const pill = (text, tone) => h('span', { class: 'adm-pill ' + (tone || '') }, text);
// on a phone the table header (with its tick-all box) is hidden, so this button does the same job
const selAll = (root) => h('button', { class: 'btn sm ghost adm-selall', type: 'button', onclick: () => { const c = root.querySelector('thead input[type=checkbox]'); if (c) c.click(); } }, 'Chọn tất cả');
const empty = (title, text) => h('div', { class: 'adm-empty' }, h('b', {}, title), text && h('p', {}, text));
// the bar that appears when rows are ticked
function bulkBar() {
  const n = h('b'), acts = h('div', { class: 'adm-bulk-act' });
  const el = h('div', { class: 'adm-bulk', hidden: true }, h('span', {}, 'Đã chọn ', n), acts);
  return { el, set: (count, ...buttons) => { n.textContent = String(count); el.hidden = !count; if (buttons.length) acts.replaceChildren(...buttons); } };
}

// ---------- sections ----------
const SECTIONS = {};

// Tổng quan
SECTIONS.overview = async () => {
  const d = await api('/admin/overview');
  const tones = { reports: d.reports.open ? 'warn' : '', live: d.live ? 'hot' : '' };
  const onlineV = h('span', {}, fmt(d.traffic.online));
  const tick = setInterval(async () => { try { onlineV.textContent = fmt((await api('/admin/traffic')).online); } catch {} }, 20000);
  S.cleanups.push(() => clearInterval(tick));
  const diff = (a, b) => (b ? (a >= b ? '▲ ' : '▼ ') + Math.round(Math.abs(a - b) / b * 100) + '% so với hôm qua' : 'Hôm qua: ' + fmt(b));
  const storageV = h('span', {}, '…'), storageS = h('span', {}, 'Đang tính dung lượng…');
  api('/admin/storage').then(({ storage: s }) => {
    if (!s) { storageV.textContent = '–'; storageS.textContent = 'Không đọc được'; return; }
    storageV.textContent = fmtBytes(s.uploads + s.db);
    storageS.textContent = fmt(s.files) + ' file' + (s.free != null ? ' · ổ đĩa còn trống ' + fmtBytes(s.free) : '');
  }).catch(() => { storageV.textContent = '–'; storageS.textContent = ''; });
  const alerts = [
    d.reports.open && h('a', { class: 'adm-alert warn', href: '#/admin/reports' }, h('span', { html: ic('flag') }), h('span', {}, h('b', {}, fmt(d.reports.open) + ' báo cáo'), ' đang chờ bạn xử lý'), h('span', { class: 'adm-alert-go', html: ic('arrow') })),
    d.live && h('a', { class: 'adm-alert hot', href: '#/admin/live' }, h('span', { html: ic('radio') }), h('span', {}, h('b', {}, d.live + ' buổi live'), ' đang phát lúc này'), h('span', { class: 'adm-alert-go', html: ic('arrow') })),
    d.orders.open && h('a', { class: 'adm-alert', href: '#/admin/shop' }, h('span', { html: ic('cart') }), h('span', {}, h('b', {}, fmt(d.orders.open) + ' đơn hàng mới'), ' chưa được người bán xử lý'), h('span', { class: 'adm-alert-go', html: ic('arrow') })),
  ].filter(Boolean);
  // 14 days of visitors, sign-ups and new videos
  const days = []; for (let i = 13; i >= 0; i--) days.push(new Date(Date.parse(d.today + 'T00:00:00Z') - i * 86400_000).toISOString().slice(0, 10));
  const pick = (list, k) => Object.fromEntries((list || []).map((x) => [x.day, x[k]]));
  const vis = pick(d.traffic.daily, 'visitors'), sig = pick(d.signups, 'n'), upl = pick(d.uploads, 'n');
  const max = Math.max(1, ...days.map((x) => vis[x] || 0));
  const chart = h('div', { class: 'adm-chart', role: 'img', 'aria-label': 'Khách truy cập 14 ngày gần nhất' }, days.map((x) => {
    const v = vis[x] || 0;
    return h('div', { class: 'adm-bar' + (x === d.today ? ' now' : ''), title: vnDate(x) + ': ' + fmt(v) + ' khách · ' + (sig[x] || 0) + ' đăng ký · ' + (upl[x] || 0) + ' video mới' },
      h('span', { class: 'adm-bar-v' }, v ? fmt(v) : ''), h('i', { style: 'height:' + Math.max(2, Math.round(v / max * 100)) + '%' }), h('small', {}, x.slice(8) + '/' + x.slice(5, 7)));
  }));
  const vtot = Math.max(1, d.videos.visible + d.videos.hidden + d.videos.banned);
  const share = (n) => (n / vtot * 100).toFixed(1) + '%';
  const shortcuts = NAV.flatMap(([, list]) => list).filter((x) => x[0] !== 'overview').map(([k, label, icon, desc]) =>
    h('a', { class: 'adm-short', href: '#/admin/' + k }, h('span', { class: 'adm-short-ic', html: ic(icon) }), h('span', {}, h('b', {}, label), h('small', {}, desc)), counts[k] ? h('span', { class: 'adm-count' }, String(counts[k])) : ''));
  return [
    alerts.length ? h('div', { class: 'adm-alerts' }, alerts) : h('div', { class: 'adm-alert ok' }, h('span', { html: ic('check') }), h('span', {}, 'Mọi thứ ổn: không có báo cáo nào đang chờ.')),
    h('div', { class: 'adm-kpis' },
      kpi({ label: 'Đang xem website', value: onlineV, sub: 'Tự cập nhật mỗi 20 giây', icon: 'eye', tone: 'gold', live: true, href: '#/admin/traffic' }),
      kpi({ label: 'Khách hôm nay', value: fmt(d.traffic.visitors), sub: diff(d.traffic.visitors, d.traffic.yesterday), icon: 'globe', href: '#/admin/traffic' }),
      kpi({ label: 'Thành viên', value: fmt(d.members.total), sub: '+' + fmt(d.members.today) + ' hôm nay · +' + fmt(d.members.week) + ' trong 7 ngày', icon: 'users', href: '#/admin/members' }),
      kpi({ label: 'Video', value: fmt(d.videos.total), sub: '+' + fmt(d.videos.today) + ' hôm nay · ' + fmt(d.videos.views) + ' lượt xem', icon: 'film', href: '#/admin/videos' }),
      kpi({ label: 'Báo cáo chờ xử lý', value: fmt(d.reports.open), sub: d.reports.today ? d.reports.today + ' báo cáo mới hôm nay' : 'Không có báo cáo mới hôm nay', icon: 'flag', tone: tones.reports, href: '#/admin/reports' }),
      kpi({ label: 'Livestream đang phát', value: fmt(d.live), sub: 'Bấm để xem hoặc tắt live', icon: 'radio', tone: tones.live, href: '#/admin/live' }),
      kpi({ label: 'Đơn hàng hôm nay', value: fmt(d.orders.today), sub: fmt(d.orders.open) + ' đơn mới chưa xử lý', icon: 'cart', href: '#/admin/shop' }),
      kpi({ label: 'Dung lượng đã dùng', value: storageV, sub: storageS, icon: 'disk', href: '#/admin/compress' })),
    h('div', { class: 'adm-cols' },
      panel('Khách truy cập 14 ngày', 'Mỗi thiết bị tính 1 lần mỗi ngày (giờ Việt Nam). Chạm vào cột để xem số đăng ký và video mới.', chart),
      panel('Tình trạng nội dung', null,
        h('div', { class: 'adm-split', 'aria-hidden': 'true' }, h('i', { class: 'ok', style: 'width:' + share(d.videos.visible) }), h('i', { class: 'warn', style: 'width:' + share(d.videos.hidden) }), h('i', { class: 'bad', style: 'width:' + share(d.videos.banned) })),
        h('div', { class: 'adm-stats' }, stat('Video đang hiển thị', fmt(d.videos.visible)), stat('Video admin đã ẩn', fmt(d.videos.hidden)), stat('Video bị cấm xuất bản', fmt(d.videos.banned)),
          stat('Tài khoản đã xác minh', fmt(d.members.verified)), stat('Tài khoản bị khoá', fmt(d.members.banned)), stat('Nhóm Telegram đã kết nối', fmt(d.telegram.groups)), stat('Bài Telegram đang chờ gửi', fmt(d.telegram.queued))))),
    h('h3', { class: 'adm-sub' }, 'Đi nhanh tới'),
    h('div', { class: 'adm-shorts' }, shortcuts),
  ];
};

// Lượt truy cập
SECTIONS.traffic = async () => {
  const tr = await api('/admin/traffic');
  const onlineEl = h('span', {}, fmt(tr.online));
  const tick = setInterval(async () => { try { onlineEl.textContent = fmt((await api('/admin/traffic')).online); } catch {} }, 20000);
  S.cleanups.push(() => clearInterval(tick));
  return [
    h('div', { class: 'adm-kpis' },
      kpi({ label: 'Đang xem website lúc này', value: onlineEl, sub: 'Tự cập nhật mỗi 20 giây', icon: 'eye', tone: 'gold', live: true }),
      kpi({ label: 'Khách truy cập hôm nay', value: fmt(tr.today.visitors), sub: 'Mỗi thiết bị tính 1 lần/ngày · hôm qua: ' + fmt(tr.yesterday.visitors), icon: 'globe' }),
      kpi({ label: 'Lượt xem trang hôm nay', value: fmt(tr.today.views), sub: 'Hôm qua: ' + fmt(tr.yesterday.views), icon: 'chart' }),
      kpi({ label: 'Tổng số thiết bị đã vào', value: fmt(tr.allTime), sub: 'Từ khi bật thống kê', icon: 'phone' })),
    panel('Theo từng ngày', 'Giờ Việt Nam, 14 ngày gần nhất.',
      tr.daily.length ? table(['Ngày', 'Khách truy cập', 'Lượt xem trang'], h('tbody', {}, tr.daily.map((x) => h('tr', {}, td('Ngày', vnDate(x.day)), td('Khách', fmt(x.visitors)), td('Lượt xem', fmt(x.views))))), 'stack')
        : empty('Chưa có dữ liệu', 'Số liệu bắt đầu đếm từ khi website cập nhật bản có thống kê.')),
  ];
};

// Báo cáo
SECTIONS.reports = async () => {
  const wrapEl = h('div');
  const q = searchBox('Tìm theo lý do, người báo, email…');
  const type = h('select', { class: 'adm-sel', 'aria-label': 'Loại' }, [['', 'Tất cả loại'], ['video', 'Video'], ['user', 'Thành viên'], ['other', 'Khác']].map(([v, l]) => h('option', { value: v }, l)));
  const bulk = bulkBar();
  let list = [], picked = new Set();
  const load = async () => { list = (await api('/admin/reports')).reports; picked = new Set([...picked].filter((id) => list.some((r) => r.id === id))); paint(); };
  const resolve = async (ids) => {
    try { await api('/admin/reports/resolve-many', { method: 'POST', body: { ids } }); toast(ids.length > 1 ? 'Đã xử lý xong ' + ids.length + ' báo cáo' : 'Đã đánh dấu xong'); ids.forEach((i) => picked.delete(i)); await load(); badge('reports', list.length); } catch (e) { fail(e); }
  };
  const hideVideo = async (id) => { await api('/admin/videos/' + id + '/status', { method: 'POST', body: { status: 'hidden', note: 'Ẩn do bị báo cáo' } }); };
  const paintBulk = () => {
    const sel = list.filter((r) => picked.has(r.id)), vids = [...new Set(sel.filter((r) => r.target_type === 'video').map((r) => r.target_id))];
    bulk.set(sel.length,
      h('button', { class: 'btn sm primary', type: 'button', onclick: () => resolve(sel.map((r) => r.id)) }, h('span', { html: ic('check') }), 'Đánh dấu đã xử lý'),
      vids.length ? h('button', { class: 'btn sm', type: 'button', onclick: async () => {
        if (!(await ask('Ẩn ' + vids.length + ' video bị báo cáo?', 'Các video này sẽ không hiện trên website cho tới khi bạn bấm “Hiện lại”. Các báo cáo được đánh dấu đã xử lý.', { ok: 'Ẩn video' }))) return;
        try { await api('/admin/videos/bulk-status', { method: 'POST', body: { ids: vids, status: 'hidden', note: 'Ẩn do bị báo cáo' } }); toast('Đã ẩn ' + vids.length + ' video'); await resolve(sel.map((r) => r.id)); } catch (e) { fail(e); }
      } }, 'Ẩn ' + vids.length + ' video & xử lý') : '',
      h('button', { class: 'btn sm ghost', type: 'button', onclick: () => { picked.clear(); paint(); } }, 'Bỏ chọn'));
  };
  const paint = () => {
    const s = q.value.trim().toLowerCase(), t = type.value;
    const rows = list.filter((r) => (!t || (t === 'other' ? !['video', 'user'].includes(r.target_type) : r.target_type === t))
      && (!s || [r.reason, r.reporter, r.target && (r.target.email || ''), r.target && (r.target.caption || r.target.name || ''), '#' + r.target_id].join(' ').toLowerCase().includes(s)));
    const all = h('input', { type: 'checkbox', 'aria-label': 'Chọn tất cả', checked: rows.length > 0 && rows.every((r) => picked.has(r.id)), onchange: (e) => { rows.forEach((r) => (e.target.checked ? picked.add(r.id) : picked.delete(r.id))); paint(); } });
    const what = (r) => {
      const x = r.target;
      if (r.target_type === 'video') return h('div', { class: 'adm-obj' }, x && x.thumb ? h('img', { src: x.thumb, alt: '' }) : h('span', { class: 'adm-obj-ph', html: ic('film') }),
        h('div', {}, h('b', {}, 'Video #' + r.target_id), h('small', { translate: 'no' }, x ? (x.caption || x.nickname || '(không có nội dung)').slice(0, 70) : 'Video đã bị xoá'), x && (x.locked ? pill('Bị cấm', 'bad') : x.hidden ? pill('Đã ẩn', 'warn') : '')));
      if (r.target_type === 'user') return h('div', { class: 'adm-obj' }, h('span', { class: 'adm-obj-ph', html: ic('user') }),
        h('div', {}, h('b', { translate: 'no' }, x ? x.name : 'Thành viên #' + r.target_id), h('small', { translate: 'no' }, x ? x.email : 'Tài khoản đã bị xoá'), x && x.banned ? pill('Đã khoá', 'bad') : ''));
      return h('div', { class: 'adm-obj' }, h('div', {}, h('b', {}, r.target_type + ' #' + r.target_id)));
    };
    const body = h('tbody', {}, rows.map((r) => h('tr', { class: picked.has(r.id) ? 'sel' : '' },
      h('td', { class: 'adm-ck' }, h('input', { type: 'checkbox', 'aria-label': 'Chọn báo cáo #' + r.id, checked: picked.has(r.id), onchange: (e) => { e.target.checked ? picked.add(r.id) : picked.delete(r.id); paint(); } })),
      td('Đối tượng', what(r)),
      td('Lý do', h('span', { class: 'adm-reason' }, r.reason)),
      td('Người báo', h('div', {}, h('span', { translate: 'no' }, r.reporter), h('small', { class: 'muted', style: 'display:block' }, r.created_at ? timeAgo(r.created_at) : ''))),
      td('', h('div', { class: 'adm-acts' },
        r.target_type === 'video' && r.target && h('button', { class: 'btn sm', type: 'button', onclick: () => adminVideoDialog(r.target_id, () => load().catch(fail)) }, 'Mở video'),
        r.target_type === 'video' && r.target && !r.target.hidden && h('button', { class: 'btn sm', type: 'button', onclick: async () => { try { await hideVideo(r.target_id); toast('Đã ẩn video'); load(); } catch (e) { fail(e); } } }, 'Ẩn video'),
        r.target_type === 'user' && r.target && !r.target.banned && h('button', { class: 'btn sm danger-soft', type: 'button', onclick: async () => {
          if (!(await ask('Khoá tài khoản này?', (r.target.email || '') + ' sẽ bị đăng xuất và không đăng nhập được nữa.', { ok: 'Khoá tài khoản', danger: true }))) return;
          try { await api('/admin/users/' + r.target_id + '/ban', { method: 'POST' }); toast('Đã khoá'); load(); } catch (e) { fail(e); } } }, 'Khoá tài khoản'),
        h('button', { class: 'btn sm primary', type: 'button', onclick: () => resolve([r.id]) }, 'Xong'))))));
    wrapEl.replaceChildren(list.length
      ? (rows.length ? table([all, 'Bị báo cáo', 'Lý do', 'Người báo', ''], body, 'stack sel-rows') : empty('Không có báo cáo khớp với tìm kiếm'))
      : empty('Không có báo cáo nào 🎉', 'Khi khách báo cáo video hoặc thành viên, báo cáo sẽ hiện ở đây.'));
    paintBulk();
  };
  let qt; q.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(paint, 150); }); type.addEventListener('change', paint);
  await load();
  return [h('div', { class: 'adm-tools' }, q, type, selAll(wrapEl)), bulk.el, h('div', { class: 'adm-panel flush' }, wrapEl)];
};

// Video
SECTIONS.videos = async () => {
  const vBody = h('tbody', {}), vInfo = h('span', { class: 'adm-total' }), vPager = h('div', { class: 'adm-pager' });
  const vq = searchBox('Tìm theo nội dung, biệt danh, email chủ video hoặc số ID…');
  const vst = h('select', { class: 'adm-sel', 'aria-label': 'Trạng thái' }, [['', 'Tất cả video'], ['visible', 'Đang hiển thị'], ['hidden', 'Đã ẩn'], ['banned', 'Bị cấm xuất bản']].map(([a, b]) => h('option', { value: a }, b)));
  const BADGE = { visible: ['Hiển thị', 'ok'], hidden: ['Đã ẩn', 'warn'], self: ['Chủ tự ẩn', 'violet'], banned: ['Bị cấm', 'bad'] };
  const bulk = bulkBar(), picked = new Set();
  let vpage = 0, rows = [];
  const setMany = async (status) => {
    const ids = [...picked];
    let note = '';
    if (status === 'banned') {
      const inp = h('input', { maxlength: 300, placeholder: 'Lý do (không bắt buộc, chỉ admin thấy)' });
      const ok = await new Promise((res) => { let yes = false; const m = modal(h('div', { class: 'askbox' }, h('div', { class: 'askbox-ic danger' }, '!'), h('h3', {}, 'Cấm xuất bản ' + ids.length + ' video?'), h('p', { class: 'sub' }, 'Các video sẽ bị gỡ khỏi website cho tới khi bạn bấm “Hiện lại”.'), inp,
        h('div', { class: 'askbox-act' }, h('button', { class: 'btn', type: 'button', onclick: () => m.close() }, 'Huỷ'), h('button', { class: 'btn danger', type: 'button', onclick: () => { yes = true; m.close(); } }, 'Cấm xuất bản'))), { onClose: () => res(yes) }); });
      if (!ok) return; note = inp.value;
    } else if (status === 'hidden' && !(await ask('Ẩn ' + ids.length + ' video?', 'Video không hiện trên website cho tới khi bạn bấm “Hiện lại”.', { ok: 'Ẩn video' }))) return;
    try { const r = await api('/admin/videos/bulk-status', { method: 'POST', body: { ids, status, note } }); toast({ visible: 'Đã hiện lại ', hidden: 'Đã ẩn ', banned: 'Đã cấm xuất bản ' }[status] + r.done + ' video'); picked.clear(); loadVideos().catch(fail); } catch (e) { fail(e); }
  };
  const paintBulk = () => bulk.set(picked.size,
    h('button', { class: 'btn sm', type: 'button', onclick: () => setMany('visible') }, 'Hiện lại'),
    h('button', { class: 'btn sm', type: 'button', onclick: () => setMany('hidden') }, 'Ẩn'),
    h('button', { class: 'btn sm danger-soft', type: 'button', onclick: () => setMany('banned') }, 'Cấm xuất bản'),
    h('button', { class: 'btn sm ghost', type: 'button', onclick: () => { picked.clear(); paint(); } }, 'Bỏ chọn'));
  const paint = () => {
    const all = rows.length && rows.every((x) => picked.has(x.id));
    vBody.replaceChildren(...rows.map((x) => h('tr', { class: picked.has(x.id) ? 'sel' : '' },
      h('td', { class: 'adm-ck' }, h('input', { type: 'checkbox', 'aria-label': 'Chọn video #' + x.id, checked: picked.has(x.id), onchange: (e) => { e.target.checked ? picked.add(x.id) : picked.delete(x.id); paint(); } })),
      td('Video', h('div', { class: 'adm-obj' }, x.thumb ? h('img', { src: x.thumb, alt: '', loading: 'lazy' }) : h('span', { class: 'adm-obj-ph', html: ic('film') }),
        h('div', {}, h('b', {}, '#' + x.id, x.verified && h('span', { class: 'adm-verified', title: 'Đã xác minh' }, ' ✔')), h('small', { translate: 'no' }, (x.caption || x.nickname || '(không có nội dung)').slice(0, 80))))),
      td('Chủ video', h('span', { translate: 'no', class: 'adm-break' }, x.owner.email)),
      td('Lượt xem', fmt(x.views)),
      td('Trạng thái', pill(BADGE[x.status][0], BADGE[x.status][1])),
      td('', h('button', { class: 'btn sm', type: 'button', onclick: () => adminVideoDialog(x.id, () => loadVideos().catch(fail)) }, 'Quản lý')))));
    head.firstChild.firstChild.replaceChildren(h('input', { type: 'checkbox', 'aria-label': 'Chọn cả trang', checked: !!all, onchange: (e) => { rows.forEach((x) => (e.target.checked ? picked.add(x.id) : picked.delete(x.id))); paint(); } }));
    paintBulk();
  };
  const loadVideos = async () => {
    const d = await api('/admin/videos?page=' + vpage + '&status=' + vst.value + '&q=' + encodeURIComponent(vq.value.trim()));
    vInfo.textContent = fmt(d.total) + ' video';
    rows = d.videos; paint();
    const pages = Math.max(1, Math.ceil(d.total / d.size));
    vPager.replaceChildren(vpage > 0 ? h('button', { class: 'btn sm', type: 'button', onclick: () => { vpage--; loadVideos().catch(fail); } }, '← Trước') : h('span'),
      h('span', { class: 'muted' }, 'Trang ' + (vpage + 1) + ' / ' + pages),
      (vpage + 1) * d.size < d.total ? h('button', { class: 'btn sm', type: 'button', onclick: () => { vpage++; loadVideos().catch(fail); } }, 'Sau →') : h('span'));
  };
  const vReload = () => { vpage = 0; loadVideos().catch(fail); };
  let vqt; vq.addEventListener('input', () => { clearTimeout(vqt); vqt = setTimeout(vReload, 300); }); vst.addEventListener('change', vReload);
  const head = h('thead', {}, h('tr', {}, h('th', { class: 'adm-ck' }), ['Video', 'Chủ video', 'Lượt xem', 'Trạng thái', ''].map((c) => h('th', {}, c))));
  await loadVideos();
  const tbl = h('div', { class: 'adm-tw' }, h('table', { class: 't adm-t stack sel-rows' }, head, vBody));
  return [h('div', { class: 'adm-tools' }, vq, vst, selAll(tbl), vInfo), bulk.el, h('div', { class: 'adm-panel flush' }, tbl), vPager];
};

// Livestream & Gian hàng: built by their own modules
SECTIONS.live = async () => [await window.XGLive.adminBox()];
SECTIONS.shop = async () => [await window.XGShop.adminBox()];

// Thành viên
SECTIONS.members = async () => {
  const memBody = h('tbody', {}), memInfo = h('span', { class: 'adm-total' }), pager = h('div', { class: 'adm-pager' });
  const qIn = searchBox('Tìm theo email hoặc tên…');
  const filterSel = h('select', { class: 'adm-sel', 'aria-label': 'Lọc' }, [['', 'Tất cả thành viên'], ['today', 'Đăng ký 24 giờ qua'], ['verified', 'Đã xác minh'], ['banned', 'Đã khoá'], ['telegram', 'Được gửi Telegram'], ['admin', 'Quản trị viên']].map(([v, l]) => h('option', { value: v }, l)));
  const sortSel = h('select', { class: 'adm-sel', 'aria-label': 'Sắp xếp' }, [['newest', 'Mới đăng ký nhất'], ['videos', 'Nhiều video nhất'], ['followers', 'Nhiều người theo dõi nhất'], ['likes', 'Nhiều lượt thích nhất'], ['oldest', 'Đăng ký lâu nhất']].map(([v, l]) => h('option', { value: v }, l)));
  let page = 0, qt;
  const reload = () => { page = 0; loadMembers().catch(fail); };
  sortSel.addEventListener('change', reload); filterSel.addEventListener('change', reload);
  const loadMembers = async () => {
    const d = await api('/admin/users?page=' + page + '&q=' + encodeURIComponent(qIn.value.trim()) + '&sort=' + sortSel.value + '&filter=' + filterSel.value);
    memInfo.textContent = fmt(d.total) + ' thành viên';
    memBody.replaceChildren(...d.users.map((u) => h('tr', { class: u.banned ? 'dim' : '' },
      td('Thành viên', h('div', { class: 'adm-who' }, h('b', { translate: 'no' }, h('a', { href: '#/u/' + u.id, title: 'Xem hồ sơ' }, u.name), u.role === 'admin' ? pill('Admin', 'gold') : '', u.banned ? pill('Đã khoá', 'bad') : ''), h('small', { translate: 'no', class: 'adm-break' }, '#' + u.id + ' · ' + u.email))),
      td('Hoạt động', h('span', { class: 'adm-act-n' }, h('b', {}, fmt(u.videos)), ' video', h('br'), h('small', {}, fmt(u.followers) + ' theo dõi · ' + fmt(u.likes) + ' thích'))), td('Ngày đăng ký', new Date(u.created_at).toLocaleDateString('vi-VN')),
      td('Đã xác minh', sw(u.verified, null, async (on, el) => { try { const r = await api('/admin/users/' + u.id + '/verified', { method: 'POST', body: { verified: on } }); toast(on ? 'Đã xác minh tài khoản, ' + r.videos + ' video có huy hiệu' : 'Đã gỡ xác minh tài khoản'); } catch (er) { el.checked = !on; fail(er); } })),
      td('Gửi Telegram', u.role === 'admin' ? h('span', { class: 'muted', title: 'Quản trị viên luôn được dùng' }, 'Luôn bật')
        : h('span', { class: 'adm-inl' }, sw(u.telegram_allowed, null, async (on, el) => { try { await api('/admin/users/' + u.id + '/telegram', { method: 'POST', body: { allowed: on } }); toast(on ? 'Đã cho phép ' + u.name + ' gửi lên Telegram' : 'Đã tắt gửi Telegram của ' + u.name); } catch (er) { el.checked = !on; fail(er); } }),
          u.tg_groups ? h('small', { class: 'muted' }, u.tg_groups + ' nhóm') : '')),
      td('', h('div', { class: 'adm-acts' },
        h('button', { class: 'btn sm', type: 'button', title: 'Đặt mật khẩu mới cho tài khoản này', onclick: () => adminPasswordDialog(u) }, '🔑 Mật khẩu'),
        u.role === 'admin' ? '' : u.banned
          ? h('button', { class: 'btn sm', type: 'button', onclick: async () => { if (!(await ask('Mở khoá tài khoản?', u.email + ' sẽ đăng nhập lại được.', { ok: 'Mở khoá' }))) return; try { await api('/admin/users/' + u.id + '/unban', { method: 'POST' }); toast('Đã mở khoá ' + u.email); loadMembers(); } catch (e) { fail(e); } } }, 'Mở khoá')
          : h('button', { class: 'btn sm danger-soft', type: 'button', onclick: async () => { if (!(await ask('Khoá tài khoản ' + u.email + '?', 'Tài khoản bị đăng xuất khỏi mọi thiết bị và không đăng nhập được nữa. Bạn có thể mở khoá lại sau.', { ok: 'Khoá tài khoản', danger: true }))) return; try { await api('/admin/users/' + u.id + '/ban', { method: 'POST' }); toast('Đã khoá ' + u.email); loadMembers(); } catch (e) { fail(e); } } }, 'Khoá'))))));
    if (!d.users.length) memBody.replaceChildren(h('tr', {}, h('td', { colspan: 6 }, empty('Không có thành viên nào khớp'))));
    const pages = Math.max(1, Math.ceil(d.total / d.size));
    pager.replaceChildren(page > 0 ? h('button', { class: 'btn sm', type: 'button', onclick: () => { page--; loadMembers().catch(fail); } }, '← Trước') : h('span'),
      h('span', { class: 'muted' }, 'Trang ' + (page + 1) + ' / ' + pages),
      (page + 1) * d.size < d.total ? h('button', { class: 'btn sm', type: 'button', onclick: () => { page++; loadMembers().catch(fail); } }, 'Sau →') : h('span'));
  };
  qIn.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(reload, 300); });
  await loadMembers();
  return [h('div', { class: 'adm-tools' }, qIn, filterSel, sortSel, memInfo),
    h('div', { class: 'adm-panel flush' }, table(['Thành viên', 'Hoạt động', 'Ngày đăng ký', 'Xác minh', 'Gửi Telegram', ''], memBody, 'stack')), pager,
    h('p', { class: 'adm-hint' }, '“Đã xác minh”: mọi video của thành viên có huy hiệu Đã xác minh. “Gửi Telegram”: cho phép tài khoản tự động gửi video lên nhóm Telegram của họ.')];
};
// set a new password for a member: typed by the admin or made up at random, shown so the admin can pass it on
function adminPasswordDialog(u) {
  const makeUp = () => { const abc = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = crypto.getRandomValues(new Uint8Array(10)); return [...b].map((x) => abc[x % abc.length]).join(''); };
  const pw = h('input', { type: 'text', minlength: 8, maxlength: 200, autocomplete: 'off', placeholder: 'Mật khẩu mới (ít nhất 8 ký tự)', style: 'flex:1;min-width:0' });
  const err = h('p', { class: 'err', hidden: true });
  const done = h('div', { hidden: true, class: 'notice', style: 'display:grid;gap:8px' });
  const save = h('button', { type: 'submit', class: 'btn primary', style: 'width:100%' }, 'Đổi mật khẩu');
  const form = h('form', { style: 'display:grid;gap:12px' },
    h('p', { class: 'muted', style: 'font-size:14px' }, 'Tài khoản: ', h('b', { translate: 'no' }, u.email), ' (' + u.name + ')'),
    h('div', { class: 'row', style: 'gap:8px;flex-wrap:nowrap' }, pw, h('button', { type: 'button', class: 'btn sm', onclick: () => { pw.value = makeUp(); } }, 'Tạo ngẫu nhiên')),
    h('small', { class: 'muted' }, 'Sau khi đổi, tài khoản này bị đăng xuất khỏi mọi thiết bị và phải đăng nhập lại bằng mật khẩu mới.'),
    err, save, done);
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); err.hidden = true;
    if (pw.value.length < 8) { err.textContent = 'Mật khẩu mới tối thiểu 8 ký tự'; err.hidden = false; return; }
    save.disabled = true;
    try {
      await api('/admin/users/' + u.id + '/password', { method: 'POST', body: { password: pw.value } });
      const val = pw.value;
      done.replaceChildren(h('b', {}, '✅ Đã đổi mật khẩu cho ' + u.email), h('span', {}, 'Mật khẩu mới: ', h('code', { translate: 'no' }, val)),
        h('button', { type: 'button', class: 'btn sm', style: 'justify-self:start', onclick: () => { navigator.clipboard && navigator.clipboard.writeText(val).then(() => toast('Đã sao chép mật khẩu')).catch(() => {}); } }, 'Sao chép mật khẩu'));
      done.hidden = false; save.hidden = true; pw.disabled = true;
      toast('Đã đổi mật khẩu');
    } catch (ex) { err.textContent = ex.message; err.hidden = false; save.disabled = false; }
  });
  modal(h('div', {}, h('h3', { style: 'margin-bottom:10px' }, '🔑 Đổi mật khẩu tài khoản'), form));
  setTimeout(() => pw.focus(), 50);
}

// Email
SECTIONS.mail = async () => {
  const ml = await api('/admin/mail');
  const chk = sw(ml.requireVerification, null, async (on, el) => { try { await api('/admin/mail', { method: 'PUT', body: { requireVerification: on } }); toast(on ? 'Đã BẬT: khách phải xác nhận email mới đăng nhập được' : 'Đã TẮT xác nhận email'); } catch (e) { el.checked = !on; fail(e); } });
  const testTo = h('input', { type: 'email', placeholder: 'Email nhận thư thử (để trống = email của bạn)', style: 'flex:1;min-width:220px' });
  const testRes = h('p', { class: 'muted', style: 'font-size:14px' });
  const subj = h('input', { placeholder: 'Tiêu đề email', maxlength: 150 }), body = h('textarea', { rows: 8, maxlength: 8000, placeholder: 'Nội dung email. Dùng {name} để chèn tên người nhận. Để trống một dòng giữa các đoạn.' });
  const lim = h('input', { type: 'number', min: 1, max: 1000, value: 100, style: 'width:110px' });
  const ver = h('input', { type: 'checkbox', class: 'adm-sw', role: 'switch' });
  const ctaL = h('input', { placeholder: 'Chữ trên nút (không bắt buộc), VD: Xem ngay', maxlength: 40, style: 'flex:1;min-width:180px' }), ctaU = h('input', { placeholder: 'Địa chỉ của nút, VD: https://xgaigu.com/khu-vuc', maxlength: 400, style: 'flex:2;min-width:220px' });
  const camp = h('div', { class: 'adm-list' });
  const ST = { running: ['Đang gửi…', 'gold'], done: ['Xong', 'ok'], interrupted: ['Bị gián đoạn', 'warn'] };
  const drawC = (list) => camp.replaceChildren(...(list.length ? list.map((c) => h('div', { class: 'adm-li' }, h('div', {}, h('b', {}, '#' + c.id + ' · ' + c.subject), h('small', {}, 'Gửi được ' + c.sent + '/' + c.total + (c.failed ? ' · lỗi ' + c.failed : '') + ' · ' + new Date(c.created_at).toLocaleString('vi-VN'))), pill(...(ST[c.status] || [c.status])))) : [h('p', { class: 'muted' }, 'Chưa gửi đợt nào.')]));
  drawC(ml.campaigns);
  const sendB = h('button', { class: 'btn primary', type: 'button', onclick: async () => {
    if (!subj.value.trim() || !body.value.trim()) return toast('Hãy nhập tiêu đề và nội dung', true);
    if (!(await ask('Gửi email cho tối đa ' + lim.value + ' thành viên?', 'Tiêu đề: “' + subj.value.trim() + '”. Đã gửi thì không thu hồi được.', { ok: 'Gửi email' }))) return;
    sendB.disabled = true;
    try {
      const r = await api('/admin/mail/campaign', { method: 'POST', body: { subject: subj.value, body: body.value, limit: lim.value, verifiedOnly: ver.checked, ctaLabel: ctaL.value, ctaUrl: ctaU.value } });
      toast('Đang gửi cho ' + r.total + ' người…');
      const poll = setInterval(async () => { try { const x = await api('/admin/mail'); drawC(x.campaigns); if (!x.campaigns.some((c) => c.status === 'running')) { clearInterval(poll); sendB.disabled = false; toast('Đã gửi xong'); } } catch { clearInterval(poll); } }, 4000);
      S.cleanups.push(() => clearInterval(poll)); drawC((await api('/admin/mail')).campaigns);
    } catch (e) { fail(e); sendB.disabled = false; }
  } }, 'Gửi email');
  return [
    h('div', { class: 'adm-kpis three' },
      kpi({ label: 'Thành viên', value: fmt(ml.counts.total), icon: 'users' }), kpi({ label: 'Đã xác nhận email', value: fmt(ml.counts.verified), icon: 'check' }), kpi({ label: 'Đã huỷ nhận quảng bá', value: fmt(ml.counts.optout || 0), icon: 'mail' })),
    panel('Cài đặt gửi thư', ml.configured ? 'Gửi từ: ' + ml.from + ' (đã cấu hình)' : '⚠️ Chưa cấu hình email gửi đi. Hãy thêm biến SMTP_USER và SMTP_PASS trên Hostinger.',
      h('label', { class: 'adm-swl' }, chk, h('span', {}, 'Bắt buộc khách xác nhận email mới được đăng ký / đăng nhập', h('small', {}, 'Chỉ áp dụng cho người đăng ký mới.'))),
      h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, testTo, h('button', { class: 'btn', type: 'button', onclick: async (ev) => { ev.currentTarget.disabled = true; const b = ev.currentTarget; testRes.textContent = 'Đang gửi…'; try { const r = await api('/admin/mail/test', { method: 'POST', body: { to: testTo.value } }); testRes.textContent = '✅ Đã gửi thư thử tới ' + r.to + '. Hãy kiểm tra hộp thư (cả Spam).'; } catch (e) { testRes.textContent = '❌ ' + e.message; } b.disabled = false; } }, 'Gửi email thử')), testRes),
    panel('Gửi email quảng bá cho thành viên', 'Mỗi email có liên kết “Hủy nhận email quảng bá”. Gửi chậm khoảng 1,5 giây/email để tránh bị nhà cung cấp chặn. Hãy hỏi Hostinger giới hạn số email mỗi giờ của gói bạn.',
      subj, body, h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, ctaL, ctaU),
      h('div', { class: 'row', style: 'gap:10px;flex-wrap:wrap;align-items:center' }, h('span', { class: 'muted' }, 'Tối đa'), lim, h('span', { class: 'muted' }, 'người nhận'), h('label', { class: 'adm-swl' }, ver, h('span', {}, 'Chỉ người đã xác nhận email'))),
      h('div', {}, sendB)),
    panel('Các đợt đã gửi', null, camp),
  ];
};

// SEO khu vực
SECTIONS.seo = async () => {
  const geoSeo = geoPicker({}, { countries: true });
  const sf = { title: h('input', { maxlength: 120, placeholder: 'Tiêu đề trang (nên dưới 60 ký tự)' }), description: h('textarea', { rows: 3, maxlength: 300, placeholder: 'Mô tả ngắn hiện trên Google (nên 120–160 ký tự)' }),
    keywords: h('textarea', { rows: 2, maxlength: 600, placeholder: 'Từ khóa, cách nhau bằng dấu phẩy' }), intro: h('textarea', { rows: 10, maxlength: 6000, placeholder: 'Nội dung giới thiệu khu vực. Để trống một dòng giữa các đoạn.' }) };
  const seoInfo = h('p', { class: 'adm-hint' }, 'Chọn quốc gia và khu vực ở trên (Việt Nam: ít nhất là miền; nước khác: chọn nước, có thể gõ thêm tỉnh / thành phố) để sửa.');
  const seoPrev = h('div', { class: 'seo-prev', hidden: true });
  const seoAdd = Object.fromEntries(['title', 'description', 'keywords', 'intro'].map((k) => [k, h('small', { class: 'seo-add', hidden: true })]));
  const paintAdd = (added) => { for (const [k, el] of Object.entries(seoAdd)) { const w = (added && added[k]) || []; el.hidden = !w.length; el.textContent = w.length ? '➕ Tự thêm khi hiển thị: ' + w.join(', ') : ''; } };
  const counter = (el, n) => { const c = h('small', { class: 'muted' }); const u = () => { c.textContent = el.value.length + ' ký tự' + (n ? ' (nên ≤ ' + n + ')' : ''); c.style.color = n && el.value.length > n ? '#fbbf24' : ''; }; el.addEventListener('input', u); u(); return [c, u]; };
  const [cTitle, uTitle] = counter(sf.title, 60), [cDesc, uDesc] = counter(sf.description, 160);
  let seoDef = null;
  const seoView = h('a', { class: 'btn sm ghost', target: '_blank', rel: 'noopener', hidden: true }, 'Xem trang này ↗');
  const seoBody = () => {
    const val = (n) => ((geoSeo.el.querySelector('[name="' + n + '"]') || {}).value || '').trim();
    const cc = geoSeo.country();
    return cc === 'VN' ? { region: val('region'), province: val('province'), district: val('district') } : { region: 'qt', country: cc, province: val('province'), district: val('district') };
  };
  const loadSeo = async () => {
    const b = seoBody();
    if (!b.region) { seoInfo.textContent = 'Chọn khu vực ở trên (ít nhất là miền) để sửa.'; seoView.hidden = true; seoPrev.hidden = true; seoDef = null; return; }
    try {
      const d = await api('/admin/area-seo?' + new URLSearchParams(b));
      seoDef = d.defaults;
      const s = d.saved || {};
      sf.title.value = s.title || d.defaults.title; sf.description.value = s.description || d.defaults.description; sf.keywords.value = s.keywords || d.defaults.keywords; sf.intro.value = s.intro || d.defaults.intro;
      sf.title.placeholder = d.defaults.title; sf.description.placeholder = d.defaults.description; sf.keywords.placeholder = d.defaults.keywords; sf.intro.placeholder = d.defaults.intro;
      uTitle(); uDesc(); paintAdd(d.final && d.final.added);
      seoInfo.textContent = d.saved ? 'Khu vực này đang dùng nội dung bạn đã viết.' : 'Đang dùng nội dung mẫu có sẵn (đã điền trong các ô). Cần thì sửa trực tiếp rồi bấm Lưu. Nếu bạn không bấm Lưu, trang vẫn dùng mẫu này và số video tự cập nhật.';
      seoView.href = d.url; seoView.hidden = false;
      if (b.region === 'qt' && !d.total && !d.saved) seoInfo.textContent += ' Nơi này chưa có video: trang chỉ hiện trên Google sau khi bạn bấm Lưu hoặc khi có người đăng video ở đây.';
      seoPrev.hidden = false;
      seoPrev.replaceChildren(h('small', {}, 'Bản hiển thị trên Google (đã tự thêm từ khóa riêng của bạn):'), h('div', { class: 'seo-prev-g' }, h('span', { class: 'seo-prev-url' }, location.host + d.url), h('b', {}, d.final.title), h('p', {}, d.final.description)));
    } catch (e) { fail(e); }
  };
  let seoT = 0;
  geoSeo.el.addEventListener('change', () => setTimeout(loadSeo, 0));
  geoSeo.el.addEventListener('input', (e) => { if (e.target.tagName === 'INPUT') { clearTimeout(seoT); seoT = setTimeout(loadSeo, 800); } });
  const seoForm = h('div', { class: 'adm-form' },
    h('label', { class: 'f' }, h('span', {}, 'Tiêu đề SEO'), sf.title, cTitle, seoAdd.title), h('label', { class: 'f' }, h('span', {}, 'Mô tả SEO (meta description)'), sf.description, cDesc, seoAdd.description),
    h('label', { class: 'f' }, h('span', {}, 'Từ khóa'), sf.keywords, seoAdd.keywords), h('label', { class: 'f' }, h('span', {}, 'Nội dung giới thiệu khu vực'), sf.intro, seoAdd.intro),
    h('div', { class: 'adm-btns' },
      h('button', { class: 'btn primary', type: 'button', onclick: async () => { const b = seoBody(); if (!b.region) return toast('Hãy chọn khu vực', true); try { await api('/admin/area-seo', { method: 'PUT', body: { ...b, title: sf.title.value, description: sf.description.value, keywords: sf.keywords.value, intro: sf.intro.value } }); toast('Đã lưu nội dung SEO'); loadSeo(); } catch (e) { fail(e); } } }, 'Lưu'),
      h('button', { class: 'btn', type: 'button', onclick: () => { if (!seoDef) return toast('Hãy chọn khu vực', true); sf.title.value = seoDef.title; sf.description.value = seoDef.description; sf.keywords.value = seoDef.keywords; sf.intro.value = seoDef.intro; uTitle(); uDesc(); } }, 'Điền nội dung mẫu để sửa'),
      h('button', { class: 'btn', type: 'button', onclick: async () => { if (!(await ask('Xoá nội dung đang viết?', 'Các ô sẽ trống. Bấm Lưu sau đó để khu vực quay về nội dung tự động.', { ok: 'Xoá nội dung' }))) return; sf.title.value = sf.description.value = sf.keywords.value = sf.intro.value = ''; uTitle(); uDesc(); toast('Đã xoá nội dung, bấm Lưu để quay về nội dung tự động'); } }, 'Về nội dung tự động'), seoView));
  // the admin's own keyword sets: added automatically to every area, or only to the areas the admin picks
  const areaLabel = (k) => { const p = k.split('|'); return p[0] === 'qt' ? [countryName(p[1]), ...p.slice(2)].join(' › ') : [REGION_NAMES[p[0]] || p[0], ...p.slice(1)].join(' › '); };
  const areaKey = (x) => (x.region === 'qt' ? ['qt', x.country, x.province, x.district] : [x.region, x.province, x.district]).filter(Boolean).join('|');
  let kwSets = [];
  const setsBox = h('div', { style: 'display:grid;gap:12px' });
  const chk = (val, label, on) => sw(val, label, on);
  const newSet = () => ({ keywords: '', inName: true, inTitle: true, inDesc: true, inIntro: true, inKeywords: true, titleCount: 1, withName: false, scope: 'all', areas: [] });
  const drawSets = () => {
    setsBox.replaceChildren(...kwSets.map((s, i) => {
      const kw = h('textarea', { rows: 2, maxlength: 2000, placeholder: 'VD: Giá rẻ, Uy tín, Gần đây' }); kw.value = s.keywords || '';
      kw.addEventListener('input', () => { s.keywords = kw.value; });
      const cnt = h('input', { type: 'number', min: 0, max: 5, value: s.titleCount, style: 'width:70px', oninput: (e) => { s.titleCount = e.target.value; } });
      const nm = 'kwscope' + i + '_' + Math.random().toString(36).slice(2, 6);
      const scopeOpt = (val, label) => h('label', { class: 'adm-radio' }, h('input', { type: 'radio', name: nm, checked: (s.scope || 'all') === val, onchange: () => { s.scope = val; drawSets(); } }), h('span', {}, label));
      let pickBox = '';
      if (s.scope === 'some') {
        const gp = geoPicker({}, { countries: true });
        const read = () => {
          const v = (n) => ((gp.el.querySelector('[name="' + n + '"]') || {}).value || '').trim();
          const cc = gp.country();
          return cc === 'VN' ? { region: v('region'), province: v('province'), district: v('district') } : { region: 'qt', country: cc, province: v('province'), district: v('district') };
        };
        const add = h('button', { type: 'button', class: 'btn sm', onclick: () => {
          const x = read();
          if (x.region !== 'qt' && !x.region) return toast('Hãy chọn miền, hoặc chọn một nước khác', true);
          const k = areaKey(x);
          if (!s.areas.includes(k)) s.areas.push(k);
          drawSets();
        } }, '+ Thêm khu vực này');
        pickBox = h('div', { class: 'adm-dash' },
          h('small', { class: 'muted' }, 'Chọn khu vực rồi bấm “Thêm”. Chọn cả miền hoặc cả nước thì mọi tỉnh, quận bên trong cũng được áp dụng.'),
          gp.el, h('div', {}, add),
          s.areas.length ? h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, s.areas.map((k) => h('span', { class: 'chip on', style: 'display:inline-flex;gap:6px;align-items:center' }, areaLabel(k),
            h('button', { type: 'button', 'aria-label': 'Bỏ', style: 'background:none;border:0;color:inherit;cursor:pointer;font-size:15px;padding:0', onclick: () => { s.areas = s.areas.filter((x) => x !== k); drawSets(); } }, '×'))))
            : h('small', { style: 'color:#fbbf24' }, 'Chưa chọn khu vực nào: bộ này sẽ chưa áp dụng ở đâu cả.'));
      }
      return h('div', { class: 'adm-sub-card' },
        h('div', { class: 'row', style: 'justify-content:space-between;align-items:center' }, h('b', {}, 'Bộ từ khóa ' + (i + 1)),
          h('button', { type: 'button', class: 'btn sm ghost', onclick: async () => { if (await ask('Xoá bộ từ khóa ' + (i + 1) + '?', 'Bấm “Lưu từ khóa” sau đó để áp dụng.', { ok: 'Xoá', danger: true })) { kwSets.splice(i, 1); drawSets(); } } }, 'Xoá')),
        kw,
        chk(s.withName, 'Tự ghép tên khu vực sau mỗi từ khóa (VD “Giá rẻ” → “Giá rẻ Bangkok”)', (v) => { s.withName = v; }),
        h('div', { class: 'adm-group' }, h('small', { class: 'muted' }, 'Thêm vào:'),
          chk(s.inTitle, 'Tiêu đề SEO', (v) => { s.inTitle = v; }), h('label', { class: 'muted', style: 'font-size:13px;margin-left:54px;display:flex;gap:8px;align-items:center;flex-wrap:wrap' }, 'Số từ khóa của bộ này đưa vào tiêu đề:', cnt),
          chk(s.inDesc, 'Mô tả SEO', (v) => { s.inDesc = v; }), chk(s.inIntro, 'Nội dung giới thiệu khu vực', (v) => { s.inIntro = v; }), chk(s.inKeywords, 'Ô từ khóa', (v) => { s.inKeywords = v; }), chk(s.inName, 'Trước tên khu vực hiện trên web và trang SEO (VD “Giá rẻ Phuket”, chỉ dùng từ khóa đầu tiên)', (v) => { s.inName = v; })),
        h('div', { class: 'adm-group' }, h('small', { class: 'muted' }, 'Áp dụng cho:'), scopeOpt('all', 'Tất cả khu vực (Việt Nam và các nước)'), scopeOpt('some', 'Chỉ những khu vực tôi chọn')),
        pickBox);
    }));
  };
  api('/admin/seo-global').then((g) => { kwSets = (g.sets || []).map((s) => ({ ...s, areas: [...(s.areas || [])] })); if (!kwSets.length) kwSets.push(newSet()); drawSets(); }).catch((e) => console.error('seo keyword sets:', e));
  return [
    h('p', { class: 'adm-hint' }, 'Nội dung này hiện trên trang khu vực (xgaigu.com/khu-vuc/…) và trong kết quả Google, cho cả Việt Nam và các nước khác. Hãy viết tự nhiên, đúng sự thật, và đừng nhồi nhét từ khóa.'),
    panel('🔑 Từ khóa riêng của bạn', 'Gõ từ khóa riêng, VD “Giá rẻ”, rồi chọn áp dụng cho tất cả khu vực hay chỉ những khu vực bạn chọn. Từ khóa tự được thêm vào tiêu đề SEO, mô tả SEO, ô từ khóa và nội dung giới thiệu của các khu vực đó, cả nội dung mẫu lẫn nội dung bạn đã viết. Viết {khu vực} trong từ khóa để tự thay bằng tên nơi đó. Từ khóa đã có sẵn trong nội dung thì không thêm lần nữa.',
      setsBox,
      h('div', { class: 'adm-btns' },
        h('button', { class: 'btn', type: 'button', onclick: () => { kwSets.push(newSet()); drawSets(); } }, '+ Thêm bộ từ khóa'),
        h('button', { class: 'btn primary', type: 'button', onclick: async () => {
          try { const r = await api('/admin/seo-global', { method: 'PUT', body: { sets: kwSets } }); kwSets = r.sets.map((s) => ({ ...s, areas: [...s.areas] })); if (!kwSets.length) kwSets.push(newSet()); drawSets(); toast('Đã lưu từ khóa riêng'); loadSeo(); } catch (e) { fail(e); }
        } }, 'Lưu từ khóa'))),
    panel('Nội dung từng khu vực', 'Chọn một khu vực để xem và sửa tiêu đề, mô tả, từ khóa và bài giới thiệu.', geoSeo.el, seoInfo, seoPrev, seoForm),
  ];
};

// Telegram
SECTIONS.telegram = async () => {
  const statsBody = h('tbody', {}), statsNote = h('p', { class: 'adm-hint' });
  const loadTgStats = async () => {
    try {
      const d = await api('/admin/tg-stats');
      const cell = (label, x) => td(label, h('b', {}, String(x.clicks)), h('span', { class: 'muted', style: 'font-size:12px' }, ' lượt · ' + x.people + ' người'));
      statsBody.replaceChildren(...(d.links.length ? d.links.map((l, i) => h('tr', {},
        td('Link nhóm', (l.active ? 'Nhóm ' + (i + 1) + ': ' : '(link cũ) '), h('a', { href: l.url, target: '_blank', rel: 'noopener', class: 'adm-link adm-break' }, l.url.replace(/^https:\/\//, ''))),
        cell('Hôm nay', l.today), cell('7 ngày', l.week), cell('Tổng', l.total))) : [h('tr', {}, h('td', { colspan: 4, class: 'muted' }, 'Chưa có lượt bấm nào.'))]));
      statsNote.textContent = 'Hôm nay là ' + vnDate(d.today) + ' (giờ Việt Nam). “Người” = số thiết bị khác nhau đã bấm.';
    } catch (e) { fail(e); }
  };
  loadTgStats();
  const inputs = [1, 2, 3, 4, 5].map((n) => h('input', { type: 'url', placeholder: 'Nhóm ' + n + ': https://t.me/ten_nhom' }));
  const fill = (list) => inputs.forEach((inp, i) => { inp.value = list[i] || ''; });
  api('/site-config').then((c) => fill(c.telegrams || [])).catch(() => {});
  const save = async () => {
    try {
      const r = await api('/admin/site-config', { method: 'PUT', body: { telegrams: inputs.map((x) => x.value.trim()) } });
      S.conf = { ...(S.conf || {}), telegrams: r.telegrams, telegram: r.telegrams[0] || '' }; fill(r.telegrams);
      toast(r.telegrams.length ? 'Đã lưu ' + r.telegrams.length + ' nhóm Telegram' : 'Đã ẩn nút Telegram');
    } catch (e) { fail(e); }
  };
  return [
    window.XGTele.adminBox(),
    panel('Nút “Vào nhóm Telegram” trên website', 'Điền tối đa 5 link nhóm Telegram. Mỗi lần khách mở “Xem thông tin”, nút “Vào nhóm Telegram” sẽ dẫn tới một trong các nhóm này, chọn ngẫu nhiên, để chia đều khách giữa các nhóm. Để trống ô nào thì bỏ qua ô đó; để trống hết rồi Lưu thì nút bị ẩn.',
      h('div', { class: 'adm-form' }, ...inputs),
      h('div', { class: 'adm-btns' }, h('button', { class: 'btn primary', type: 'button', onclick: save }, 'Lưu'), h('button', { class: 'btn', type: 'button', onclick: async () => { if (!(await ask('Xoá hết link nhóm?', 'Nút “Vào nhóm Telegram” sẽ bị ẩn khỏi website.', { ok: 'Xoá hết', danger: true }))) return; fill([]); save(); } }, 'Xoá hết'))),
    panel('Lượt bấm vào từng nhóm', null,
      h('div', { class: 'adm-btns', style: 'justify-content:flex-end;margin-top:-6px' }, h('button', { class: 'btn sm ghost', type: 'button', onclick: loadTgStats, html: ic('refresh') + 'Làm mới' })),
      table(['Link nhóm', 'Hôm nay', '7 ngày', 'Tổng'], statsBody, 'stack'), statsNote),
  ];
};

// Ứng dụng & QR
SECTIONS.app = async () => {
  const st = await api('/admin/app-stats');
  const link = location.origin + '/app', text = 'Tải ứng dụng xgaigu về máy chỉ một chạm: ';
  const qrBox = h('div', { class: 'adm-qr' }, h('span', { style: 'color:#555;font-size:13px' }, 'Đang tạo mã QR…'));
  let qr = null;
  const draw = () => { try { qrBox.replaceChildren(); qrBox.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 0, scalable: true }); const s = qrBox.querySelector('svg'); if (s) { s.setAttribute('width', 190); s.setAttribute('height', 190); } } catch { qrBox.textContent = 'Không tạo được mã QR'; } };
  const make = () => { try { qr = window.qrcode(0, 'M'); qr.addData(link); qr.make(); draw(); } catch { qrBox.textContent = 'Không tạo được mã QR'; } };
  if (window.qrcode) make();
  else { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'; sc.onload = make; sc.onerror = () => { qrBox.textContent = 'Không tải được thư viện mã QR'; }; document.head.append(sc); }
  const copy = async () => { try { await navigator.clipboard.writeText(link); toast('Đã sao chép liên kết'); } catch { prompt('Sao chép liên kết này:', link); } };
  const open = (u) => window.open(u, '_blank', 'noopener');
  const png = () => {
    if (!qr) return toast('Mã QR chưa sẵn sàng', true);
    const n = qr.getModuleCount(), cell = 12, pad = 24, c = document.createElement('canvas'); c.width = c.height = n * cell + pad * 2;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000';
    for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) if (qr.isDark(r, q)) g.fillRect(pad + q * cell, pad + r * cell, cell, cell);
    c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'xgaigu-tai-ung-dung-qr.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
  };
  const blk = (b) => 'Hôm nay: ' + fmt(b.today) + ' · 7 ngày: ' + fmt(b.week) + ' · 30 ngày: ' + fmt(b.month) + ' · ' + fmt(b.devices) + ' thiết bị';
  const dev = (k, d) => (st.byDevice.find((x) => x.kind === k && x.device === d) || {}).n || 0;
  const days = [...new Set(st.daily.map((x) => x.day))];
  const dayVal = (day, k) => (st.daily.find((x) => x.day === day && x.kind === k) || {}).n || 0;
  return [
    panel('Link tải ứng dụng', 'Gửi liên kết này cho khách. Khách chỉ cần bấm vào, trang sẽ mở ra với nút “Cài đặt ứng dụng”, bấm thêm một lần là ứng dụng được cài vào máy (iPhone sẽ có hướng dẫn 3 bước).',
      h('div', { class: 'row', style: 'gap:8px;flex-wrap:nowrap' }, h('input', { readonly: true, value: link, style: 'flex:1;min-width:0', onclick: (e) => e.target.select() }), h('button', { class: 'btn primary', type: 'button', onclick: copy }, 'Sao chép')),
      h('div', { class: 'adm-btns' },
        navigator.share && h('button', { class: 'btn sm', type: 'button', onclick: () => navigator.share({ title: 'Ứng dụng xgaigu', text, url: link }).catch(() => {}) }, 'Chia sẻ…'),
        h('button', { class: 'btn sm', type: 'button', onclick: () => open('https://zalo.me/share?url=' + encodeURIComponent(link)) }, 'Zalo'),
        h('button', { class: 'btn sm', type: 'button', onclick: () => open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link)) }, 'Facebook'),
        h('button', { class: 'btn sm', type: 'button', onclick: () => open('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text)) }, 'Telegram'),
        h('a', { class: 'btn sm ghost', href: '/app', target: '_blank', rel: 'noopener' }, 'Xem trang tải ↗')),
      h('div', { class: 'row', style: 'gap:18px;align-items:flex-end;flex-wrap:wrap' }, qrBox, h('div', { style: 'display:grid;gap:8px;max-width:260px' }, h('span', { class: 'muted', style: 'font-size:13px' }, 'Mã QR: in ra hoặc đăng lên để khách quét bằng camera.'), h('button', { class: 'btn', type: 'button', onclick: png }, 'Tải mã QR (PNG)')))),
    h('h3', { class: 'adm-sub' }, 'Thống kê ứng dụng'),
    h('div', { class: 'adm-kpis' },
      kpi({ label: 'Lượt vào link tải ứng dụng', value: fmt(st.visit.total), sub: blk(st.visit), icon: 'globe' }),
      kpi({ label: 'Lượt bấm “Tải ứng dụng”', value: fmt(st.click.total), sub: blk(st.click), icon: 'upload' }),
      kpi({ label: 'Đã cài về máy', value: fmt(st.install.total), sub: blk(st.install) + '. Android/Chrome/Edge báo khi cài xong.', icon: 'phone', tone: 'gold' }),
      kpi({ label: 'Lượt mở ứng dụng', value: fmt(st.open.total), sub: blk(st.open) + '. iPhone không báo “đã cài”, nên xem số này.', icon: 'eye' })),
    h('div', { class: 'adm-cols' },
      panel('Theo thiết bị', null, table(['Thiết bị', 'Bấm tải', 'Đã cài', 'Đang dùng app'], h('tbody', {}, [['android', 'Android'], ['ios', 'iPhone/iPad'], ['desktop', 'Máy tính'], ['other', 'Khác']].map(([dv, n]) => h('tr', {}, td('Thiết bị', n), td('Bấm tải', String(dev('click', dv))), td('Đã cài', String(dev('install', dv))), td('Đang dùng', String(dev('open', dv)))))), 'stack')),
      panel('14 ngày gần nhất', null, days.length ? table(['Ngày', 'Bấm tải', 'Đã cài', 'Mở app'], h('tbody', {}, days.map((x) => h('tr', {}, td('Ngày', vnDate(x)), td('Bấm tải', String(dayVal(x, 'click'))), td('Đã cài', String(dayVal(x, 'install'))), td('Mở app', String(dayVal(x, 'open')))))), 'stack') : empty('Chưa có dữ liệu'))),
  ];
};

// Hiển thị & đề xuất
SECTIONS.display = async () => {
  // recommendation mix: how much verified / new / hot / favourite-region videos are suggested
  const share = h('input', { type: 'range', min: 0, max: 100, step: 5, value: 60, class: 'adm-range' }), shareOut = h('b', { class: 'adm-range-out' });
  const num = (v) => h('input', { type: 'number', min: 0, max: 20, value: v, style: 'width:90px' });
  const newB = num(8), hotB = num(5), regB = num(7);
  const fstat = h('p', { class: 'adm-hint' });
  const paint = () => { shareOut.textContent = share.value + '% đã xác minh · ' + (100 - share.value) + '% chưa xác minh'; share.style.setProperty('--p', share.value + '%'); };
  share.addEventListener('input', paint);
  const fillF = (c) => { share.value = c.verifiedShare; newB.value = c.newBoost; hotB.value = c.hotBoost; regB.value = c.regionBoost; paint(); };
  api('/admin/feed-conf').then((d) => { fillF(d.conf); fstat.textContent = 'Hiện có ' + d.verifiedVideos + ' / ' + d.totalVideos + ' video đã xác minh. Nếu một nhóm hết video, website tự lấy thêm từ nhóm còn lại.'; }).catch(() => {});
  const saveF = async (body) => { try { const r = await api('/admin/feed-conf', { method: 'PUT', body }); fillF(r.conf); toast('Đã lưu cách đề xuất video'); } catch (e) { fail(e); } };
  const frow = (label, el, hint) => h('div', { class: 'adm-frow' }, h('span', { class: 'adm-frow-l' }, label, hint && h('small', {}, hint)), el);
  paint();
  // videos per page
  const ps = h('input', { type: 'number', min: 3, max: 60, value: 15, style: 'width:110px' });
  // the "Xem Video Hẹn Hò" button
  const partner = h('input', { type: 'url', placeholder: 'https://ten-website-khac.com', style: 'flex:1;min-width:220px' });
  api('/site-config').then((c) => { ps.value = c.pageSize || 15; partner.value = c.partner || ''; }).catch(() => {});
  const saveP = async (val) => { try { const r = await api('/admin/partner', { method: 'PUT', body: { url: val } }); S.conf = { ...(S.conf || {}), partner: r.url }; partner.value = r.url; toast(r.url ? 'Đã lưu, nút “Xem Video Hẹn Hò” đã hiện' : 'Đã ẩn nút “Xem Video Hẹn Hò”'); } catch (e) { fail(e); } };
  return [
    panel('Đề xuất video', 'Quyết định loại video nào khách được xem nhiều hơn ở trang chủ (“Dành cho bạn”) và các trang khu vực. Thứ tự vẫn ngẫu nhiên, chỉ thay đổi tỉ lệ.',
      frow('Tỉ lệ video đã xác minh', h('div', { class: 'adm-range-w' }, share, shareOut)),
      frow('Ưu tiên video mới đăng (24 giờ)', newB, '1 = không ưu tiên, càng lớn càng hay xuất hiện'),
      frow('Ưu tiên video đang hot', hotB, '1 = không ưu tiên'),
      frow('Ưu tiên khu vực khách quan tâm', regB, '0 = không ưu tiên'),
      fstat,
      h('div', { class: 'adm-btns' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => saveF({ verifiedShare: share.value, newBoost: newB.value, hotBoost: hotB.value, regionBoost: regB.value }) }, 'Lưu'),
        h('button', { class: 'btn', type: 'button', onclick: async () => { if (await ask('Về cài đặt mặc định?', 'Tỉ lệ 60% đã xác minh, ưu tiên mới 8, hot 5, khu vực 7.', { ok: 'Về mặc định' })) saveF({ verifiedShare: 60, newBoost: 8, hotBoost: 5, regionBoost: 7 }); } }, 'Về mặc định'))),
    panel('Số video mỗi trang', 'Số video hiện trên mỗi trang ở các trang khu vực và trang hồ sơ thành viên. Nhiều hơn số này thì có nút chuyển sang trang tiếp theo. Ít video mỗi trang giúp trang tải nhanh hơn.',
      h('div', { class: 'row', style: 'gap:10px;align-items:center;flex-wrap:wrap' }, ps, h('span', { class: 'muted' }, 'video / trang (từ 3 đến 60)'),
        h('button', { class: 'btn primary', type: 'button', onclick: async () => { try { const r = await api('/admin/page-size', { method: 'PUT', body: { pageSize: ps.value } }); ps.value = r.pageSize; toast('Đã lưu: ' + r.pageSize + ' video mỗi trang'); } catch (e) { fail(e); } } }, 'Lưu'))),
    panel('Nút “Xem Video Hẹn Hò”', 'Dán đường link của một website khác. Khi có link, nút nổi bật “Xem Video Hẹn Hò” sẽ hiện trong mục “Xem thông tin” của mọi video; khách bấm vào sẽ mở website đó ở tab mới. Để trống rồi Lưu (hoặc bấm Ẩn nút) để ẩn.',
      h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, partner, h('button', { class: 'btn primary', type: 'button', onclick: () => saveP(partner.value.trim()) }, 'Lưu'), h('button', { class: 'btn', type: 'button', onclick: () => { partner.value = ''; saveP(''); } }, 'Ẩn nút'))),
  ];
};

// Nén video
SECTIONS.compress = async () => {
  const o = await api('/admin/optimize');
  const info = h('p', { class: 'adm-hint', style: 'font-size:14.5px' }), limit = h('input', { type: 'number', min: 1, max: 1000, value: 50, style: 'width:100px' });
  const startB = h('button', { class: 'btn primary', type: 'button' }, 'Nén video cũ ngay'), stopB = h('button', { class: 'btn', type: 'button', hidden: true }, 'Dừng');
  const cs = o.settings || {};
  const num = (v, min, max) => h('input', { type: 'number', min, max, value: v, style: 'width:84px' });
  const enabled = h('input', { type: 'checkbox', class: 'adm-sw', role: 'switch', checked: !!cs.enabled }), autoNew = h('input', { type: 'checkbox', class: 'adm-sw', role: 'switch', checked: !!cs.autoNew }), autoOld = h('input', { type: 'checkbox', class: 'adm-sw', role: 'switch', checked: !!cs.autoOld });
  const t1 = num(cs.tier1Mb, 3, 2000), p1 = num(cs.tier1Pct, 10, 90), t2 = num(cs.tier2Mb, 5, 5000), p2 = num(cs.tier2Pct, 10, 90);
  const side = h('select', { class: 'adm-sel' }, [[480, '480p (nhẹ nhất)'], [540, '540p'], [720, '720p (khuyên dùng)'], [1080, '1080p (nét nhất, nặng)']].map(([v, l]) => h('option', { value: v, selected: Number(cs.maxSide) === v }, l)));
  const quality = h('select', { class: 'adm-sel' }, [['light', 'Nhẹ máy nhất'], ['balanced', 'Cân bằng (khuyên dùng)'], ['sharp', 'Nét hơn']].map(([v, l]) => h('option', { value: v, selected: cs.quality === v }, l)));
  const saveS = h('button', { class: 'btn primary', type: 'button' }, 'Lưu cài đặt nén');
  const line = (...kids) => h('label', { class: 'adm-line' }, ...kids);
  const kOpt = h('span'), kPend = h('span'), kSaved = h('span');
  let timer;
  const paint = (s) => {
    kOpt.textContent = fmt(s.optimized); kPend.textContent = fmt(s.pending); kSaved.textContent = fmt(s.savedMB) + ' MB';
    info.textContent = s.available
      ? 'Còn ' + s.pending + ' video cần xem xét để nén (khoảng ' + s.pendingMB + ' MB).' + (s.settings && s.settings.autoOld ? ' Đang bật tự nén dần.' : '') + ' Đã nén: ' + s.optimized + ' video. Phiên này: nén xong ' + s.done + ', tiết kiệm ' + s.savedMB + ' MB' + (s.skipped ? ', bỏ qua ' + s.skipped + ' video đã đủ nhẹ' : '') + (s.failed ? ', lỗi ' + s.failed : '') + (s.running ? ' · đang chạy, còn ' + s.queued + ' video trong hàng đợi…' : '.')
      : 'Máy chủ này không có ffmpeg nên không nén được video.';
    startB.disabled = !s.available || s.running; stopB.hidden = !s.running;
    if (s.running && !timer) timer = setInterval(async () => { try { paint(await api('/admin/optimize')); } catch {} }, 5000);
    if (!s.running && timer) { clearInterval(timer); timer = null; }
  };
  saveS.addEventListener('click', async () => {
    try {
      const r = await api('/admin/optimize/settings', { method: 'PUT', body: { enabled: enabled.checked, autoNew: autoNew.checked, autoOld: autoOld.checked, tier1Mb: t1.value, tier1Pct: p1.value, tier2Mb: t2.value, tier2Pct: p2.value, maxSide: side.value, quality: quality.value } });
      Object.assign(cs, r.settings); t1.value = cs.tier1Mb; p1.value = cs.tier1Pct; t2.value = cs.tier2Mb; p2.value = cs.tier2Pct;
      toast('Đã lưu cài đặt nén video'); paint(await api('/admin/optimize'));
    } catch (e) { fail(e); }
  });
  startB.addEventListener('click', async () => { try { const r = await api('/admin/optimize/start', { method: 'POST', body: { limit: limit.value } }); toast('Đã xếp hàng ' + r.queued + ' video'); paint(await api('/admin/optimize')); } catch (e) { fail(e); } });
  stopB.addEventListener('click', async () => { try { await api('/admin/optimize/stop', { method: 'POST' }); toast('Sẽ dừng sau video hiện tại'); } catch (e) { fail(e); } });
  paint(o); S.cleanups.push(() => timer && clearInterval(timer));
  return [
    h('div', { class: 'adm-kpis three' }, kpi({ label: 'Video đã nén', value: kOpt, icon: 'check' }), kpi({ label: 'Video còn cần xem xét', value: kPend, icon: 'film' }), kpi({ label: 'Tiết kiệm phiên này', value: kSaved, icon: 'disk', tone: 'gold' })),
    panel('Cài đặt nén', 'Video nhỏ hơn mức đầu chỉ được nén khi nặng hơn mức điện thoại cần. Mức “Chất lượng” đặt giới hạn thấp nhất, nên video luôn xem rõ trên điện thoại (khi đó dung lượng có thể cao hơn % đã đặt một chút).',
      line(enabled, h('b', {}, 'Bật nén video')),
      line('Video nặng trên', t1, 'MB → nén còn', p1, '% dung lượng'),
      line('Video nặng trên', t2, 'MB → nén còn', p2, '% dung lượng'),
      line('Độ phân giải tối đa', side),
      line('Chất lượng', quality),
      line(autoNew, 'Tự nén video mới đăng'),
      line(autoOld, 'Tự nén dần các video đã đăng (chạy nền, mỗi lần một video, không làm chậm website)'),
      h('div', {}, saveS)),
    panel('Nén video cũ', 'Nén từng video một ở nền. File gốc chỉ bị thay khi bản nén nhỏ hơn rõ rệt và chạy tốt. Video dưới 2 MB giữ nguyên.',
      info, h('div', { class: 'row', style: 'gap:10px;flex-wrap:wrap;align-items:center' }, h('span', { class: 'muted' }, 'Nén tối đa'), limit, h('span', { class: 'muted' }, 'video mỗi lần'), startB, stopB)),
  ];
};

// Thư viện nhạc
SECTIONS.music = async () => {
  const list = h('div', { class: 'adm-list' }), info = h('span', { class: 'adm-total' });
  const fileIn = h('input', { type: 'file', accept: 'audio/*,.mp3,.m4a,.aac,.wav,.ogg' });
  const title = h('input', { placeholder: 'Tên bài hát (để trống = lấy theo tên file)', maxlength: 120 }), artist = h('input', { placeholder: 'Ca sĩ / nghệ sĩ (không bắt buộc)', maxlength: 80 });
  const style = h('input', { placeholder: 'Thể loại, VD: Nhạc có lời, Remix, Bolero, Nhạc Hoa…', maxlength: 40, value: 'Nhạc có lời' });
  const prog = h('div', { class: 'muted', style: 'font-size:13px' }), upBtn = h('button', { class: 'btn primary', type: 'button', html: ic('upload') + 'Tải bài hát lên' });
  const q = searchBox('Tìm bài hát, ca sĩ, thể loại…');
  let tracks = [];
  const paint = () => {
    const s = q.value.trim().toLowerCase();
    const rows = tracks.filter((t) => !s || [t.title, t.artist, t.style].join(' ').toLowerCase().includes(s));
    info.textContent = tracks.length + ' bài hát' + (s ? ' · ' + rows.length + ' khớp' : '');
    list.replaceChildren(...(rows.length ? rows.map((t) => h('div', { class: 'adm-li' },
      h('div', { style: 'flex:1;min-width:160px' }, h('b', { translate: 'no' }, t.title), h('small', {}, [t.artist, t.style].filter(Boolean).join(' · '))),
      h('audio', { controls: true, preload: 'none', src: t.url, style: 'height:36px;max-width:100%' }),
      h('div', { class: 'adm-acts' },
        h('button', { class: 'btn sm', type: 'button', onclick: () => editTrack(t) }, 'Sửa'),
        h('button', { class: 'btn sm danger-soft', type: 'button', onclick: async () => { if (!(await ask('Xoá bài “' + t.title + '”?', 'Bài hát bị xoá khỏi thư viện nhạc.', { ok: 'Xoá', danger: true }))) return; try { await api('/admin/music/' + t.id, { method: 'DELETE' }); toast('Đã xoá'); load(); } catch (e) { fail(e); } } }, 'Xoá'))))
      : [empty(tracks.length ? 'Không có bài nào khớp' : 'Thư viện còn trống', tracks.length ? '' : 'Tải bài hát đầu tiên lên ở trên.')]));
  };
  const editTrack = (t) => {
    const ti = h('input', { value: t.title, maxlength: 120 }), ar = h('input', { value: t.artist || '', maxlength: 80 }), stl = h('input', { value: t.style || '', maxlength: 40 });
    const f = h('form', { style: 'display:grid;gap:12px' }, h('h3', {}, 'Sửa bài hát'), h('label', { class: 'f' }, h('span', {}, 'Tên bài hát'), ti), h('label', { class: 'f' }, h('span', {}, 'Ca sĩ / nghệ sĩ'), ar), h('label', { class: 'f' }, h('span', {}, 'Thể loại'), stl), h('button', { class: 'btn primary', type: 'submit' }, 'Lưu'));
    const m = modal(f);
    f.addEventListener('submit', async (e) => { e.preventDefault(); try { await api('/admin/music/' + t.id, { method: 'PUT', body: { title: ti.value, artist: ar.value, style: stl.value } }); toast('Đã lưu'); m.close(); load(); } catch (er) { fail(er); } });
  };
  const load = async () => { try { tracks = (await api('/music')).tracks; paint(); } catch (e) { fail(e); } };
  q.addEventListener('input', paint);
  upBtn.addEventListener('click', async () => {
    const f = fileIn.files[0]; if (!f) return toast('Hãy chọn file nhạc', true);
    if (f.size > 30 * 1024 * 1024) return toast('File quá lớn (tối đa 30 MB)', true);
    const fd = new FormData(); fd.append('file', f); fd.append('title', title.value); fd.append('artist', artist.value); fd.append('style', style.value);
    upBtn.disabled = true;
    try {
      await apiUpload('/admin/music', fd, (a, b) => { prog.textContent = 'Đang tải lên… ' + Math.round(a / b * 100) + '%'; }).promise;
      prog.textContent = ''; toast('Đã thêm bài hát vào thư viện'); fileIn.value = ''; title.value = ''; artist.value = ''; load();
    } catch (e) { prog.textContent = ''; fail(e); }
    upBtn.disabled = false;
  });
  await load();
  return [
    panel('Tải bài hát lên', 'Bài hát tải lên đây hiện ngay đầu thư viện nhạc trong trình chỉnh sửa video, để thành viên chọn chèn vào video. Chỉ tải lên bài bạn có quyền sử dụng; nhạc có bản quyền có thể khiến video bị khiếu nại.',
      fileIn, h('div', { class: 'two' }, title, artist), style, h('div', { class: 'row', style: 'gap:10px;align-items:center' }, upBtn, prog)),
    h('div', { class: 'adm-tools' }, q, info),
    list,
  ];
};

// ---------- the page ----------
function badge(k, n) { counts[k] = n; document.querySelectorAll('[data-count="' + k + '"]').forEach((el) => { el.textContent = n ? String(n) : ''; el.hidden = !n; }); }
const refreshCounts = () => api('/admin/overview').then((d) => { badge('reports', d.reports.open); badge('live', d.live); }).catch(() => {});

function navList(cur, onPick) {
  return h('nav', { class: 'adm-nav', 'aria-label': 'Mục quản trị' }, NAV.map(([g, list]) => h('div', { class: 'adm-nav-g' }, h('div', { class: 'adm-nav-gl' }, g),
    list.map(([k, label, icon]) => h('a', { href: '#/admin/' + k, class: 'adm-nav-i' + (k === cur ? ' on' : ''), 'aria-current': k === cur ? 'page' : null, onclick: onPick },
      h('span', { html: ic(icon) }), h('span', { class: 'adm-nav-t' }, label), h('span', { class: 'adm-count', 'data-count': k, hidden: !counts[k] }, counts[k] ? String(counts[k]) : ''))))));
}

async function page(sub) {
  if (!S.user || S.user.role !== 'admin') { location.hash = '#/'; return; }
  const cur = ITEMS[sub] ? sub : 'overview';
  if (sub && !ITEMS[sub]) { history.replaceState(null, '', '#/admin/overview'); }
  const it = ITEMS[cur];
  document.title = it.label + ' · Quản trị xgaigu';
  // phone drawer
  let drawer = null;
  const closeDrawer = () => { if (drawer) { drawer.remove(); drawer = null; document.body.style.overflow = ''; } };
  const openDrawer = () => {
    closeDrawer();
    drawer = h('div', { class: 'adm-drawer', onclick: (e) => { if (e.target === drawer) closeDrawer(); } },
      h('div', { class: 'adm-drawer-p', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu quản trị' },
        h('div', { class: 'adm-brand' }, h('span', { class: 'adm-brand-m' }, 'XG'), h('span', {}, h('b', {}, 'Quản trị'), h('small', {}, 'xgaigu.com')),
          h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Đóng menu', onclick: closeDrawer, html: ic('x') })),
        navList(cur, closeDrawer), h('a', { class: 'adm-back', href: '#/', onclick: closeDrawer, html: ic('home') + 'Về trang chủ website' })));
    document.body.append(drawer); document.body.style.overflow = 'hidden';
    const on = drawer.querySelector('.adm-nav-i.on'); on && on.focus();
  };
  S.cleanups.push(closeDrawer);
  const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };
  document.addEventListener('keydown', onKey); S.cleanups.push(() => document.removeEventListener('keydown', onKey));

  const body = h('div', { class: 'adm-body' }, h('div', { class: 'adm-loading' }, h('div', { class: 'spin' })));
  const refresh = h('button', { class: 'btn sm ghost adm-refresh', type: 'button', title: 'Tải lại mục này', onclick: () => window.XG.route(), html: ic('refresh') + '<span>Làm mới</span>' });
  main.append(h('div', { class: 'adm' },
    h('aside', { class: 'adm-side' },
      h('div', { class: 'adm-brand' }, h('span', { class: 'adm-brand-m' }, 'XG'), h('span', {}, h('b', {}, 'Quản trị'), h('small', {}, 'xgaigu.com'))),
      navList(cur), h('a', { class: 'adm-back', href: '#/', html: ic('home') + 'Về trang chủ website' })),
    h('div', { class: 'adm-main' },
      h('div', { class: 'adm-mbar' }, h('button', { class: 'adm-menu', type: 'button', 'aria-label': 'Mở menu quản trị', onclick: openDrawer, html: ic('menu') },
        h('span', { class: 'adm-count', 'data-count': 'reports', hidden: !counts.reports }, counts.reports ? String(counts.reports) : '')),
        h('span', { class: 'adm-mbar-t' }, h('small', {}, it.group), h('b', {}, it.label)), refresh.cloneNode(true)),
      h('header', { class: 'adm-head' }, h('div', {}, h('div', { class: 'adm-eyebrow' }, it.group), h('h1', {}, cur === 'overview' ? 'Chào ' + (S.user.name || 'bạn') + ' 👋' : it.label), h('p', {}, cur === 'overview' ? 'Hôm nay ' + new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '. Đây là tình hình website.' : it.desc)), refresh),
      body)));
  main.querySelector('.adm-mbar .adm-refresh').addEventListener('click', () => window.XG.route());
  refreshCounts();
  try {
    const kids = await SECTIONS[cur]();
    if (!body.isConnected) return;
    body.replaceChildren(...[].concat(kids).filter(Boolean));
  } catch (e) {
    if (!body.isConnected) return;
    body.replaceChildren(empty('Không tải được mục này', e.message), h('button', { class: 'btn', type: 'button', onclick: () => window.XG.route() }, 'Thử lại'));
  }
}

window.XGAdmin = { page };
})();
