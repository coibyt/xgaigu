/* xgaigu – Gian hàng: storefronts, product pages, checkout, seller centre and buyer orders */
(() => {
'use strict';
const { h, api, modal: baseModal, toast, fail, icon, avatar, esc, fmtCount, timeAgo, fmtDate, needLogin, openAuth, startChat, vbadge, renderPager, areaTile, footer, main, S, onLeave } = window.XG;

const SVG = {
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l1.2 13.1a1 1 0 0 1-1 1.1H5.8a1 1 0 0 1-1-1.1L6 7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 10V6a3 3 0 0 1 6 0v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  store: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l1.6-5h14.8L21 9M3 9v1.5a3 3 0 0 0 6 0V9m0 0v1.5a3 3 0 0 0 6 0V9m0 0v1.5a3 3 0 0 0 6 0V9M3 9h18M5 13v8h14v-8M10 21v-5h4v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 4h14v12H1zM15 9h4l3 3v4h-7M5.5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18.5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cash: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6 9.5v5M18 9.5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  bank: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  swap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13l-3-3M20 16H7l3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18M7 15l4-4 3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2zM9 7h6M9 11h6M9 15h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  okc: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
// shop dialogs close when the visitor goes to another page
const modal = (content, opts) => { const m = baseModal(content, opts); const off = () => m.close(); window.addEventListener('hashchange', off, { once: true }); return m; };
const ico = (k, cls = '') => h('span', { class: 'si ' + cls, html: SVG[k] });
const vnd = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + '₫';
const stars = (r, big) => h('span', { class: 'stars' + (big ? ' big' : ''), style: '--r:' + (r || 0), 'aria-label': (r || 0) + ' trên 5 sao' }, '★★★★★');
const STATUS = { new: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', done: 'Đã giao', cancelled: 'Đã huỷ' };
const STEPS = ['new', 'confirmed', 'shipping', 'done'];
const ACTION = { confirmed: 'Xác nhận đơn', shipping: 'Bắt đầu giao hàng', done: 'Đã giao thành công', cancelled: 'Huỷ đơn' };
const DEFAULT_POLICIES = ['Thanh toán khi nhận hàng', 'Được kiểm tra hàng trước khi nhận', 'Hỗ trợ đổi trả theo chính sách shop'];
const shareLink = async (title, url) => {
  try { if (navigator.share) { await navigator.share({ title, url }); return; } } catch { return; }
  try { await navigator.clipboard.writeText(url); toast('Đã sao chép liên kết'); } catch { toast(url); }
};
const accentStyle = (shop) => (shop.accent ? '--acc:' + shop.accent : '');

// ---------- product cards ----------
function card(p, { seller = false } = {}) {
  return h('a', { class: 'pc', href: '#/p/' + p.id },
    h('div', { class: 'pc-img' }, p.image ? h('img', { src: p.image, alt: p.title, loading: 'lazy' }) : ico('bag'),
      p.discount > 0 && h('span', { class: 'pc-off' }, '-' + p.discount + '%'),
      p.stock === 0 && h('span', { class: 'pc-out' }, 'Hết hàng')),
    h('div', { class: 'pc-body' },
      h('div', { class: 'pc-title', translate: 'no' }, p.title),
      h('div', { class: 'pc-price' }, h('b', {}, vnd(p.price)), p.comparePrice > 0 && h('s', {}, vnd(p.comparePrice))),
      h('div', { class: 'pc-meta' }, p.rating ? h('span', { class: 'pc-rate' }, '★ ' + p.rating) : null, h('span', {}, 'Đã bán ' + fmtCount(p.sold || 0))),
      seller && p.seller && h('div', { class: 'pc-seller' }, ico('store'), h('span', {}, p.seller.name), p.seller.verified && h('i', { class: 'pc-tick', title: 'Đã xác minh' }, '✓'))));
}
const emptyBox = (k, title, text, action) => h('div', { class: 'sh-empty' }, ico(k, 'big'), h('h3', {}, title), text && h('p', {}, text), action);
function productGrid(box, pager, fetcher, opts) {
  const go = async (page) => {
    box.replaceChildren(...Array.from({ length: 8 }, () => h('div', { class: 'pc skel' }, h('div', { class: 'pc-img' }), h('div', { class: 'pc-body' }, h('i'), h('i'), h('i')))));
    try {
      const d = await fetcher(page);
      if (!d.products.length) box.replaceChildren(emptyBox('bag', 'Chưa có sản phẩm phù hợp', 'Hãy thử từ khoá hoặc danh mục khác.'));
      else box.replaceChildren(...d.products.map((p) => card(p, opts)));
      renderPager(pager, d.page, d.pages, (x) => { go(x); box.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      return d;
    } catch (e) { box.replaceChildren(); fail(e); }
  };
  return go;
}
function toolbar(onChange, { cats = [] } = {}) {
  const st = { q: '', cat: '', sort: 'pop' };
  const q = h('input', { type: 'search', placeholder: 'Tìm sản phẩm…', 'aria-label': 'Tìm sản phẩm', enterkeyhint: 'search' });
  let t; q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { st.q = q.value.trim(); onChange(st); }, 350); });
  const sorts = [['pop', 'Phổ biến'], ['new', 'Mới nhất'], ['best', 'Bán chạy'], ['price_asc', 'Giá thấp'], ['price_desc', 'Giá cao']];
  const sortRow = h('div', { class: 'sh-sorts', role: 'tablist' }, sorts.map(([k, l]) => h('button', { type: 'button', role: 'tab', class: k === st.sort ? 'on' : '', onclick: (e) => {
    st.sort = k; sortRow.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); onChange(st);
  } }, l)));
  const chips = h('div', { class: 'sh-cats' });
  const setCats = (list) => {
    chips.replaceChildren(...(list.length ? [['', 'Tất cả'], ...list.map((c) => [c.name, c.name + ' (' + c.n + ')'])] : []).map(([k, l]) => h('button', { type: 'button', class: k === st.cat ? 'on' : '', onclick: (e) => {
      st.cat = k; chips.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); onChange(st);
    } }, l)));
  };
  setCats(cats);
  return { el: h('div', { class: 'sh-tools' }, h('label', { class: 'sh-search', html: icon('search') }, q), sortRow, chips), st, setCats };
}
const qs = (st, page) => new URLSearchParams({ q: st.q, cat: st.cat, sort: st.sort, page }).toString();

// ---------- storefront (#/shop/:id) ----------
async function pageShop(uid) {
  const { shop, mine } = await api('/shops/' + uid);
  const link = location.origin + '/#/shop/' + shop.id;
  const followBtn = h('button', { type: 'button', class: 'btn primary' + (shop.following ? ' on' : '') }, shop.following ? 'Đang theo dõi' : '+ Theo dõi');
  followBtn.addEventListener('click', async () => {
    if (!(await needLogin())) return;
    try { const r = await api('/users/' + shop.id + '/follow', { method: 'POST' }); followBtn.textContent = r.following ? 'Đang theo dõi' : '+ Theo dõi'; followBtn.classList.toggle('on', r.following); fol.textContent = fmtCount(r.followers); } catch (e) { fail(e); }
  });
  const fol = h('b', {}, fmtCount(shop.stats.followers));
  const stat = (b, l) => h('div', { class: 'sh-stat' }, typeof b === 'string' || typeof b === 'number' ? h('b', {}, String(b)) : b, h('span', {}, l));
  const policies = shop.policies.length ? shop.policies : DEFAULT_POLICIES;
  const head = h('header', { class: 'sh-head' },
    h('div', { class: 'sh-cover' + (shop.banner ? '' : ' plain'), style: shop.banner ? 'background-image:url("' + shop.banner + '")' : '' }, h('div', { class: 'sh-cover-fade' })),
    h('div', { class: 'sh-id' },
      h('div', { class: 'sh-logo' }, shop.logo ? h('img', { src: shop.logo, alt: '' }) : ico('store')),
      h('div', { class: 'sh-name' },
        h('div', { class: 'sh-mall' }, ico('store'), 'GIAN HÀNG'),
        h('h1', { translate: 'no' }, shop.name, shop.verified && vbadge(true)),
        shop.slogan && h('p', { class: 'sh-slogan' }, shop.slogan),
        shop.closed && h('div', { class: 'sh-closed' }, 'Gian hàng đang tạm nghỉ, chưa nhận đơn mới')),
      h('div', { class: 'sh-act' }, mine
        ? [h('a', { class: 'btn primary', href: '#/seller' }, h('span', { html: SVG.gear, class: 'si' }), 'Quản lý gian hàng')]
        : [followBtn, h('button', { type: 'button', class: 'btn', onclick: () => startChat({ id: shop.id, name: shop.ownerName }), html: icon('msg') + '<span>Chat</span>' })],
        h('button', { type: 'button', class: 'btn', 'aria-label': 'Chia sẻ gian hàng', onclick: () => shareLink(shop.name, link), html: icon('share') }))),
    h('div', { class: 'sh-stats' },
      stat(fmtCount(shop.stats.products), 'Sản phẩm'), stat(fmtCount(shop.stats.sold), 'Đã bán'),
      stat(shop.stats.rating ? h('b', {}, shop.stats.rating + ' ', h('em', {}, '★')) : h('b', {}, 'Mới'), shop.stats.reviews ? fmtCount(shop.stats.reviews) + ' đánh giá' : 'Chưa có đánh giá'),
      stat(fol, 'Người theo dõi'), shop.stats.fulfilment != null && stat(shop.stats.fulfilment + '%', 'Giao thành công')),
    h('ul', { class: 'sh-pol' }, policies.map((t, i) => h('li', {}, ico(['cash', 'shield', 'swap', 'truck', 'box', 'okc'][i % 6]), t))));
  // tabs: products / videos / about
  const grid = h('div', { class: 'pgrid' }), pager = h('div', { class: 'pager' });
  const tools = toolbar((st) => go(1), { cats: shop.categories });
  const go = productGrid(grid, pager, (page) => api('/shops/' + shop.id + '/products?' + qs(tools.st, page)));
  const panel = h('div', { class: 'sh-panel' });
  const productsView = [tools.el, grid, pager];
  const tabBtn = (label, n, fn) => h('button', { type: 'button', role: 'tab', onclick: (e) => { tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); fn(); } }, label, n != null && h('small', {}, n));
  const tabs = h('nav', { class: 'sh-tabs', role: 'tablist' },
    tabBtn('Sản phẩm', shop.stats.products, () => panel.replaceChildren(...productsView)),
    tabBtn('Video', shop.videos, async () => {
      panel.replaceChildren(h('div', { class: 'spin' }));
      const { videos } = await api('/shops/' + shop.id + '/videos');
      panel.replaceChildren(videos.length ? h('div', { class: 'tgrid sh-vgrid' }, videos.map(areaTile)) : emptyBox('bag', 'Chưa có video gắn sản phẩm', mine ? 'Khi đăng hoặc sửa video, chọn "Gắn sản phẩm" để khách mua ngay khi xem.' : ''));
    }),
    tabBtn('Giới thiệu', null, () => panel.replaceChildren(h('div', { class: 'sh-about card' },
      h('h3', {}, 'Về ' + shop.name), h('p', { class: 'sh-pre' }, shop.about || 'Gian hàng chưa viết giới thiệu.'),
      h('dl', {}, shop.address && [h('dt', {}, 'Địa chỉ'), h('dd', {}, shop.address)],
        h('dt', {}, 'Tham gia'), h('dd', {}, new Date(shop.createdAt).toLocaleDateString('vi-VN')),
        h('dt', {}, 'Thanh toán'), h('dd', {}, 'Khi nhận hàng (COD)' + (shop.hasBank ? ' · Chuyển khoản' : ''))),
      h('div', { class: 'row', style: 'margin-top:16px' }, h('a', { class: 'btn', href: '#/u/' + shop.id }, 'Xem hồ sơ người bán'))))));
  tabs.firstChild.classList.add('on');
  panel.replaceChildren(...productsView);
  main.append(h('div', { class: 'shopx', style: accentStyle(shop) }, h('div', { class: 'wrap' }, head, tabs, panel)), footer());
  go(1);
}

// ---------- marketplace (#/shop) ----------
async function pageMall() {
  const grid = h('div', { class: 'pgrid' }), pager = h('div', { class: 'pager' });
  const tools = toolbar(() => go(1));
  let catsSet = false;
  const go = productGrid(grid, pager, async (page) => {
    const d = await api('/products?' + qs(tools.st, page));
    if (!catsSet) { catsSet = true; tools.setCats(d.categories || []); }
    return d;
  }, { seller: true });
  main.append(h('div', { class: 'shopx' }, h('div', { class: 'wrap' },
    h('section', { class: 'mall-hero' },
      h('div', {}, h('span', { class: 'mall-kicker' }, ico('bag'), 'XG Shop'), h('h1', {}, 'Mua sắm từ những người bạn yêu thích'),
        h('p', {}, 'Sản phẩm do chính các thành viên giới thiệu qua video. Đặt hàng nhanh, thanh toán khi nhận hàng.'),
        h('div', { class: 'row' }, S.user ? h('a', { class: 'btn primary', href: '#/seller' }, 'Mở gian hàng của bạn') : h('button', { class: 'btn primary', type: 'button', onclick: () => openAuth('register') }, 'Mở gian hàng miễn phí'),
          S.user && h('a', { class: 'btn', href: '#/orders' }, ico('receipt'), 'Đơn mua của tôi'))),
      h('ul', { class: 'mall-perks' }, [['cash', 'Thanh toán khi nhận'], ['shield', 'Kiểm tra trước khi nhận'], ['truck', 'Giao tận nơi'], ['msg', 'Chat trực tiếp người bán']].map(([k, t]) => h('li', {}, k === 'msg' ? h('span', { class: 'si', html: icon('msg') }) : ico(k), t)))),
    tools.el, grid, pager)), footer());
  go(1);
}

// ---------- product page (#/p/:id) ----------
function gallery(images, title) {
  const track = h('div', { class: 'gal-track' }, images.map((src, i) => h('img', { src, alt: title + ' – ảnh ' + (i + 1), loading: i ? 'lazy' : 'eager', onclick: () => zoom(i) })));
  const count = h('span', { class: 'gal-count' }, '1/' + images.length);
  const thumbs = h('div', { class: 'gal-thumbs' }, images.map((src, i) => h('button', { type: 'button', class: i ? '' : 'on', 'aria-label': 'Ảnh ' + (i + 1), onclick: () => track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' }) }, h('img', { src, alt: '' }))));
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    count.textContent = (i + 1) + '/' + images.length;
    [...thumbs.children].forEach((b, k) => b.classList.toggle('on', k === i));
  }, { passive: true });
  const zoom = (i) => {
    const big = h('div', { class: 'zoom-track' }, images.map((src) => h('img', { src, alt: '' })));
    modal(big, { wide: true }); requestAnimationFrame(() => { big.scrollLeft = i * big.clientWidth; });
  };
  return h('div', { class: 'gal' }, h('div', { class: 'gal-main' }, track, images.length > 1 && count), images.length > 1 && thumbs);
}
function qtyStepper(max, onChange) {
  let n = 1;
  const val = h('input', { type: 'number', min: 1, max: max || 99, value: 1, inputmode: 'numeric', 'aria-label': 'Số lượng' });
  const set = (x) => { n = Math.max(1, Math.min(max || 99, x || 1)); val.value = n; onChange && onChange(n); };
  val.addEventListener('change', () => set(parseInt(val.value, 10)));
  return { el: h('div', { class: 'qty' }, h('button', { type: 'button', 'aria-label': 'Giảm', onclick: () => set(n - 1) }, '−'), val, h('button', { type: 'button', 'aria-label': 'Tăng', onclick: () => set(n + 1) }, '+')), get: () => n };
}
function variantPicker(list, onPick) {
  let cur = '';
  const row = h('div', { class: 'vars' }, list.map((x) => h('button', { type: 'button', onclick: (e) => { cur = x; row.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); onPick && onPick(x); } }, x)));
  return { el: row, get: () => cur };
}
// The buying panel: variants, quantity, buy & chat. Used on the product page and in the quick view from a video.
function buyBox(p, shop, { videoId, mine, compact } = {}) {
  const outOfStock = p.stock === 0;
  const vp = p.variants && p.variants.length ? variantPicker(p.variants) : null;
  const qty = qtyStepper(p.stock == null ? 99 : Math.min(99, p.stock));
  const buy = async () => {
    if (!(await needLogin())) return;
    if (vp && !vp.get()) { toast('Vui lòng chọn phân loại', true); vp.el.classList.add('shake'); setTimeout(() => vp.el.classList.remove('shake'), 500); return; }
    checkout(p, shop, { variant: vp ? vp.get() : '', qty: qty.get(), videoId });
  };
  const stockNote = p.stock == null ? null : h('span', { class: 'muted' }, outOfStock ? 'Hết hàng' : 'Còn ' + p.stock + ' sản phẩm');
  return h('div', { class: 'buybox' + (compact ? ' compact' : '') },
    vp && h('div', { class: 'bb-row' }, h('span', { class: 'bb-l' }, 'Phân loại'), vp.el),
    h('div', { class: 'bb-row' }, h('span', { class: 'bb-l' }, 'Số lượng'), h('div', { class: 'row', style: 'gap:12px' }, qty.el, stockNote)),
    mine ? h('div', { class: 'bb-btns' }, h('a', { class: 'btn primary lg', href: '#/seller/products?edit=' + p.id, onclick: () => document.querySelectorAll('.overlay').forEach((o) => o.remove()) }, ico('edit'), 'Sửa sản phẩm'))
      : h('div', { class: 'bb-btns' },
        h('button', { type: 'button', class: 'btn lg', onclick: () => startChat({ id: shop.id, name: shop.ownerName }), html: icon('msg') + '<span>Chat với shop</span>' }),
        h('button', { type: 'button', class: 'btn primary lg buy', disabled: outOfStock || shop.closed, onclick: buy }, ico('bag'), outOfStock ? 'Hết hàng' : shop.closed ? 'Shop tạm nghỉ' : 'Mua ngay')));
}
function priceBox(p) {
  return h('div', { class: 'pbox' }, h('b', {}, vnd(p.price)), p.comparePrice > 0 && h('s', {}, vnd(p.comparePrice)), p.discount > 0 && h('span', { class: 'pbox-off' }, 'Giảm ' + p.discount + '%'));
}
function shopCard(shop) {
  return h('div', { class: 'shopcard' },
    h('a', { href: '#/shop/' + shop.id, class: 'shopcard-logo' }, shop.logo ? h('img', { src: shop.logo, alt: '' }) : ico('store')),
    h('div', { class: 'shopcard-info' }, h('a', { href: '#/shop/' + shop.id, class: 'shopcard-name', translate: 'no' }, shop.name, shop.verified && h('i', { class: 'pc-tick' }, '✓')),
      h('div', { class: 'shopcard-stats' }, h('span', {}, h('b', {}, fmtCount(shop.stats.products)), ' sản phẩm'), h('span', {}, h('b', {}, fmtCount(shop.stats.sold)), ' đã bán'),
        h('span', {}, h('b', {}, shop.stats.rating ? shop.stats.rating + '★' : 'Mới'), shop.stats.reviews ? ' (' + fmtCount(shop.stats.reviews) + ')' : ''))),
    h('a', { class: 'btn sm', href: '#/shop/' + shop.id }, 'Xem shop'));
}
async function pageProduct(id) {
  const d = await api('/products/' + id);
  const { product: p, shop, videos, reviews, stars: dist, more, mine } = d;
  const link = location.origin + '/#/p/' + p.id;
  const trust = h('ul', { class: 'trust' }, (shop.policies.length ? shop.policies : DEFAULT_POLICIES).concat('Bảo mật thông tin người mua').map((t, i) => h('li', {}, ico(['cash', 'shield', 'swap', 'truck', 'box'][i % 5]), t)));
  const descP = h('div', { class: 'desc sh-pre clamp', translate: 'no' }, p.description || 'Người bán chưa thêm mô tả.');
  const descMore = h('button', { type: 'button', class: 'linkbtn', hidden: true, onclick: () => { descP.classList.toggle('clamp'); descMore.textContent = descP.classList.contains('clamp') ? 'Xem thêm ▾' : 'Thu gọn ▴'; } }, 'Xem thêm ▾');
  requestAnimationFrame(() => { if (descP.scrollHeight > descP.clientHeight + 4) descMore.hidden = false; });
  const avg = p.rating || 0, totalR = dist.reduce((a, b) => a + b, 0);
  const reviewsBox = h('section', { class: 'card psec' }, h('h2', {}, 'Đánh giá sản phẩm', totalR ? h('small', {}, ' (' + totalR + ')') : null),
    totalR ? h('div', { class: 'rv-sum' }, h('div', { class: 'rv-avg' }, h('b', {}, avg.toFixed(1)), h('span', {}, 'trên 5'), stars(avg, true)),
      h('div', { class: 'rv-bars' }, dist.map((n, i) => h('div', { class: 'rv-bar' }, h('span', {}, (5 - i) + '★'), h('i', {}, h('u', { style: 'width:' + (totalR ? n / totalR * 100 : 0) + '%' })), h('small', {}, n)))))
      : h('p', { class: 'muted' }, 'Chưa có đánh giá. Người mua đã nhận hàng có thể đánh giá trong mục Đơn mua.'),
    reviews.map((r) => h('article', { class: 'rv' }, avatar(r.user, 'sm'), h('div', {}, h('b', {}, r.user.name), h('div', { class: 'rv-line' }, stars(r.rating), r.variant && h('small', { class: 'muted' }, 'Phân loại: ' + r.variant), h('small', { class: 'muted' }, timeAgo(r.createdAt))), r.body && h('p', {}, r.body)))));
  const info = h('div', { class: 'pinfo' },
    p.category && h('a', { class: 'pcat', href: '#/shop/' + shop.id }, p.category),
    h('h1', { class: 'ptitle', translate: 'no' }, p.title),
    h('div', { class: 'pline' }, p.rating ? [h('span', { class: 'pline-r' }, h('b', {}, String(p.rating)), stars(p.rating)), h('span', {}, p.reviews + ' đánh giá')] : h('span', { class: 'muted' }, 'Chưa có đánh giá'), h('span', {}, 'Đã bán ' + fmtCount(p.sold))),
    priceBox(p),
    mine && (p.status !== 'active' || p.locked) && h('div', { class: 'notice warnbox' }, p.locked ? 'Sản phẩm đang bị quản trị viên ẩn.' : 'Sản phẩm đang ẩn, khách chưa nhìn thấy.'),
    buyBox(p, shop, { mine }), trust,
    h('button', { type: 'button', class: 'linkbtn', onclick: () => shareLink(p.title, link), html: icon('share') + ' Chia sẻ sản phẩm' }));
  const page = h('div', { class: 'shopx pdp', style: accentStyle(shop) }, h('div', { class: 'wrap' },
    h('nav', { class: 'crumbs' }, h('a', { href: '#/shop' }, 'Mua sắm'), ' › ', h('a', { href: '#/shop/' + shop.id }, shop.name), p.category && [' › ', h('span', {}, p.category)]),
    h('div', { class: 'pdp-top card' }, gallery(p.images.length ? p.images : [''], p.title), info),
    h('section', { class: 'card psec' }, shopCard(shop)),
    videos.length > 0 && h('section', { class: 'card psec' }, h('h2', {}, 'Video giới thiệu sản phẩm'), h('div', { class: 'tgrid sh-vgrid' }, videos.map(areaTile))),
    h('section', { class: 'card psec' }, h('h2', {}, 'Mô tả sản phẩm'), p.variants.length > 0 && h('p', { class: 'muted', style: 'margin-bottom:8px' }, 'Phân loại: ' + p.variants.join(' · ')), descP, descMore),
    reviewsBox,
    more.length > 0 && h('section', { class: 'psec' }, h('h2', { class: 'sh-h2' }, 'Sản phẩm khác của shop'), h('div', { class: 'pgrid' }, more.map((x) => card(x)))),
    !mine && h('div', { class: 'pdp-bar' },
      h('a', { class: 'pdp-ic', href: '#/shop/' + shop.id }, ico('store'), h('span', {}, 'Shop')),
      h('button', { type: 'button', class: 'pdp-ic', onclick: () => startChat({ id: shop.id, name: shop.ownerName }) }, h('span', { class: 'si', html: icon('msg') }), h('span', {}, 'Chat')),
      h('button', { type: 'button', class: 'btn primary buy', disabled: p.stock === 0 || shop.closed, onclick: () => { const b = info.querySelector('.buybox .buy'); b && b.click(); } }, p.stock === 0 ? 'Hết hàng' : 'Mua ngay · ' + vnd(p.price)))));
  main.append(page, footer());
}

// Quick view from a video in the feed
async function quickView(id, videoId) {
  let d; try { d = await api('/products/' + id); } catch (e) { return fail(e); }
  const { product: p, shop, mine } = d;
  const m = modal(h('div', { class: 'qv shopx', style: accentStyle(shop) },
    h('div', { class: 'qv-top' }, h('img', { src: p.image, alt: '' }), h('div', {}, h('h3', { translate: 'no' }, p.title), priceBox(p), h('div', { class: 'muted', style: 'font-size:13px' }, 'Đã bán ' + fmtCount(p.sold) + (p.rating ? ' · ★ ' + p.rating : '')))),
    h('div', { class: 'qv-shop' }, h('span', {}, ico('store'), shop.name), h('a', { href: '#/p/' + p.id, class: 'linkbtn', onclick: () => m.close() }, 'Xem chi tiết sản phẩm ›')),
    buyBox(p, shop, { videoId, mine, compact: true })), { sheet: true });
}
// Product strip on a video slide (like the shopping basket on TikTok)
function videoCard(v) {
  const p = v.product;
  return h('button', { type: 'button', class: 'vprod', onclick: (e) => { e.stopPropagation(); quickView(p.id, v.id); } },
    h('span', { class: 'vprod-img' }, p.image ? h('img', { src: p.image, alt: '' }) : ico('bag')),
    h('span', { class: 'vprod-txt' }, h('b', { translate: 'no' }, p.title), h('span', {}, h('em', {}, vnd(p.price)), p.comparePrice > 0 && h('s', {}, vnd(p.comparePrice)))),
    h('span', { class: 'vprod-buy' }, ico('bag'), 'Mua'));
}

// ---------- checkout ----------
const SHIP_KEY = 'xg_ship';
function checkout(p, shop, { variant, qty, videoId }) {
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(SHIP_KEY) || '{}'); } catch {}
  const u = S.user || {};
  const err = h('div', { class: 'err', hidden: true });
  const total = h('b', {}, vnd(p.price * qty));
  const field = (name, label, attrs) => h('label', { class: 'f' }, h('span', {}, label), h(attrs.rows ? 'textarea' : 'input', { name, ...attrs }, attrs.rows ? attrs.value || '' : null));
  const payOpt = (val, k, title, sub, on) => h('label', { class: 'payopt' }, h('input', { type: 'radio', name: 'pay', value: val, checked: on }), ico(k), h('span', {}, h('b', {}, title), h('small', {}, sub)));
  const f = h('form', { class: 'co', autocomplete: 'on' },
    h('h3', {}, 'Xác nhận đặt hàng'),
    h('div', { class: 'co-item' }, h('img', { src: p.image, alt: '' }), h('div', {}, h('b', { translate: 'no' }, p.title), variant && h('small', {}, 'Phân loại: ' + variant), h('small', {}, vnd(p.price) + ' × ' + qty))),
    h('div', { class: 'co-sec' }, h('h4', {}, ico('truck'), 'Thông tin nhận hàng'),
      h('div', { class: 'two' }, field('name', 'Họ tên người nhận', { value: saved.name || u.name || '', maxlength: 60, required: true, autocomplete: 'name' }),
        field('phone', 'Số điện thoại', { value: saved.phone || u.phone || '', type: 'tel', inputmode: 'tel', maxlength: 20, required: true, autocomplete: 'tel' })),
      field('address', 'Địa chỉ nhận hàng', { value: saved.address || '', maxlength: 250, required: true, placeholder: 'Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành', autocomplete: 'street-address' }),
      field('note', 'Lời nhắn cho người bán (không bắt buộc)', { maxlength: 300, placeholder: 'VD: giao giờ hành chính, gọi trước khi giao…' })),
    h('div', { class: 'co-sec' }, h('h4', {}, ico('cash'), 'Phương thức thanh toán'),
      h('div', { class: 'payopts' }, payOpt('cod', 'cash', 'Thanh toán khi nhận hàng', 'Trả tiền mặt cho người giao hàng', true),
        shop.hasBank && payOpt('bank', 'bank', 'Chuyển khoản ngân hàng', 'Thông tin tài khoản hiện sau khi đặt', false))),
    h('div', { class: 'co-sum' }, h('div', {}, h('span', {}, 'Tạm tính (' + qty + ' sản phẩm)'), h('span', {}, vnd(p.price * qty))),
      h('div', {}, h('span', {}, 'Phí vận chuyển'), h('span', { class: 'muted' }, 'Người bán báo khi xác nhận')),
      h('div', { class: 'co-total' }, h('span', {}, 'Tổng thanh toán'), total)),
    err,
    h('button', { class: 'btn primary lg', type: 'submit', style: 'width:100%' }, 'Đặt hàng'),
    h('p', { class: 'muted co-fine' }, 'Bấm "Đặt hàng" là bạn đồng ý cung cấp thông tin nhận hàng cho người bán để giao hàng. Hãy kiểm tra hàng trước khi thanh toán.'));
  const m = modal(h('div', { class: 'shopx', style: accentStyle(shop) }, f), { sheet: true });
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); err.hidden = true;
    const b = Object.fromEntries(new FormData(f));
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Đang đặt hàng…';
    try {
      const r = await api('/products/' + p.id + '/order', { method: 'POST', body: { ...b, variant, qty, videoId } });
      try { localStorage.setItem(SHIP_KEY, JSON.stringify({ name: b.name, phone: b.phone, address: b.address })); } catch {}
      m.box.querySelector('.shopx').replaceChildren(h('div', { class: 'co-done' }, ico('okc', 'ok'), h('h3', {}, 'Đặt hàng thành công!'),
        h('p', {}, 'Mã đơn ', h('b', {}, r.order.code), ' · ', vnd(r.order.total)),
        h('p', { class: 'muted' }, 'Người bán sẽ liên hệ xác nhận và báo phí giao hàng. Bạn theo dõi đơn trong mục Đơn mua.'),
        r.bank && h('div', { class: 'bankbox' }, h('b', {}, 'Thông tin chuyển khoản'), h('p', { class: 'sh-pre' }, r.bank), h('small', {}, 'Nội dung chuyển khoản: ' + r.order.code)),
        h('div', { class: 'row', style: 'justify-content:center' }, h('a', { class: 'btn primary', href: '#/orders', onclick: () => m.close() }, 'Xem đơn mua'), h('button', { type: 'button', class: 'btn', onclick: () => m.close() }, 'Tiếp tục xem'))));
    } catch (ex) {
      btn.disabled = false; btn.textContent = 'Đặt hàng';
      if (ex.status === 401) { m.close(); openAuth('login'); return; }
      err.textContent = ex.message; err.hidden = false;
    }
  });
}

// ---------- order cards ----------
function steps(o) {
  if (o.status === 'cancelled') return h('div', { class: 'osteps cancel' }, 'Đơn đã huỷ' + (o.sellerNote ? ' · ' + o.sellerNote : ''));
  const at = STEPS.indexOf(o.status);
  return h('ol', { class: 'osteps' }, STEPS.map((s, i) => h('li', { class: i <= at ? 'on' : '' }, h('i'), h('span', {}, STATUS[s]))));
}
function orderItem(o) {
  return h('a', { class: 'oitem', href: '#/p/' + o.productId }, h('img', { src: o.image, alt: '' }),
    h('div', {}, h('b', { translate: 'no' }, o.title), o.variant && h('small', {}, 'Phân loại: ' + o.variant), h('small', {}, vnd(o.price) + ' × ' + o.qty)),
    h('span', { class: 'oitem-t' }, vnd(o.total)));
}
const statusPill = (o) => h('span', { class: 'opill ' + o.status }, STATUS[o.status]);
function statusTabs(counts, cur, onPick) {
  const all = Object.values(counts || {}).reduce((a, b) => a + b, 0);
  const row = h('div', { class: 'sh-cats otabs' }, [['', 'Tất cả', all], ...Object.keys(STATUS).map((k) => [k, STATUS[k], (counts || {})[k] || 0])].map(([k, l, n]) =>
    h('button', { type: 'button', class: k === cur ? 'on' : '', onclick: () => onPick(k) }, l, n ? h('small', {}, n) : null)));
  return row;
}

// ---------- buyer: my orders (#/orders) ----------
async function pageOrders(query) {
  if (!S.user) { openAuth('login'); location.hash = '#/'; return; }
  const host = h('div');
  let status = new URLSearchParams(query || '').get('status') || '';
  const load = async () => {
    const d = await api('/me/orders?status=' + status);
    const list = d.orders.map((o) => {
      const acts = [];
      if (o.status === 'new') acts.push(h('button', { type: 'button', class: 'btn sm', onclick: async () => { if (!confirm('Huỷ đơn ' + o.code + '?')) return; try { await api('/me/orders/' + o.id + '/cancel', { method: 'POST' }); toast('Đã huỷ đơn'); load(); } catch (e) { fail(e); } } }, 'Huỷ đơn'));
      if (o.status === 'shipping') acts.push(h('button', { type: 'button', class: 'btn sm primary', onclick: async () => { try { await api('/me/orders/' + o.id + '/received', { method: 'POST' }); toast('Cảm ơn bạn! Hãy đánh giá sản phẩm nhé'); load(); } catch (e) { fail(e); } } }, 'Đã nhận được hàng'));
      if (o.status === 'done' && !o.reviewed) acts.push(h('button', { type: 'button', class: 'btn sm primary', onclick: () => reviewDialog(o, load) }, '★ Đánh giá'));
      if (o.status === 'done' || o.status === 'cancelled') acts.push(h('a', { class: 'btn sm', href: '#/p/' + o.productId }, 'Mua lại'));
      acts.push(h('button', { type: 'button', class: 'btn sm', onclick: () => startChat({ id: o.shop.id, name: o.shop.name }), html: icon('msg') + '<span>Chat shop</span>' }));
      return h('article', { class: 'ocard card' },
        h('header', {}, h('a', { href: '#/shop/' + o.shop.id, class: 'oshop' }, ico('store'), o.shop.name), statusPill(o)),
        orderItem(o), steps(o),
        o.pay === 'bank' && o.bank && o.status !== 'cancelled' && o.status !== 'done' && h('div', { class: 'bankbox' }, h('b', {}, 'Chuyển khoản'), h('p', { class: 'sh-pre' }, o.bank), h('small', {}, 'Nội dung: ' + o.code)),
        o.sellerNote && o.status !== 'cancelled' && h('p', { class: 'onote' }, h('b', {}, 'Người bán: '), o.sellerNote),
        h('footer', {}, h('small', { class: 'muted' }, o.code + ' · ' + fmtDate(o.createdAt) + ' · ' + (o.pay === 'bank' ? 'Chuyển khoản' : 'COD')), h('div', { class: 'row' }, acts)));
    });
    host.replaceChildren(statusTabs(d.counts, status, (k) => { status = k; load(); }),
      list.length ? h('div', { class: 'olist' }, list) : emptyBox('receipt', 'Chưa có đơn hàng', 'Khám phá sản phẩm từ các gian hàng và đặt mua ngay.', h('a', { class: 'btn primary', href: '#/shop' }, 'Đi mua sắm')));
  };
  main.append(h('div', { class: 'shopx' }, h('div', { class: 'wrap narrow' }, h('h1', { class: 'sh-title' }, ico('receipt'), 'Đơn mua của tôi'), host)), footer());
  const onOrder = () => load().catch(() => {});
  window.addEventListener('xg-order', onOrder); onLeave(() => window.removeEventListener('xg-order', onOrder));
  await load();
}
function reviewDialog(o, done) {
  let rating = 5;
  const starsRow = h('div', { class: 'rate-pick', role: 'radiogroup', 'aria-label': 'Số sao' });
  const paint = () => starsRow.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i < rating));
  for (let i = 1; i <= 5; i++) starsRow.append(h('button', { type: 'button', 'aria-label': i + ' sao', onclick: () => { rating = i; paint(); } }, '★'));
  paint();
  const body = h('textarea', { rows: 4, maxlength: 600, placeholder: 'Chất lượng sản phẩm, đóng gói, giao hàng…' });
  const m = modal(h('div', { class: 'shopx' }, h('h3', {}, 'Đánh giá sản phẩm'), orderItem(o), starsRow, h('label', { class: 'f' }, h('span', {}, 'Nhận xét của bạn'), body),
    h('button', { type: 'button', class: 'btn primary', style: 'width:100%', onclick: async () => {
      try { await api('/me/orders/' + o.id + '/review', { method: 'POST', body: { rating, body: body.value } }); toast('Cảm ơn bạn đã đánh giá!'); m.close(); done && done(); } catch (e) { fail(e); }
    } }, 'Gửi đánh giá')));
}

// ---------- seller centre (#/seller/:tab) ----------
async function pageSeller(tab = 'overview', query) {
  if (!S.user) { openAuth('login'); location.hash = '#/'; return; }
  const d = await api('/me/shop');
  const { shop, stats, products } = d;
  const tabs = [['overview', 'Tổng quan', 'chart'], ['products', 'Sản phẩm', 'box'], ['orders', 'Đơn hàng', 'receipt'], ['settings', 'Thiết lập shop', 'gear']];
  const newN = (stats.counts || {}).new || 0;
  const nav = h('nav', { class: 'sc-nav' }, tabs.map(([k, l, ic]) => h('a', { href: '#/seller/' + k, class: k === tab ? 'on' : '' }, ico(ic), h('span', {}, l), k === 'orders' && newN ? h('em', {}, newN) : null)));
  const body = h('div', { class: 'sc-body' });
  const link = location.origin + '/#/shop/' + S.user.id;
  main.append(h('div', { class: 'shopx sc', style: accentStyle(shop) }, h('div', { class: 'wrap' },
    h('header', { class: 'sc-head' }, h('div', { class: 'sc-logo' }, shop.logo ? h('img', { src: shop.logo, alt: '' }) : ico('store')),
      h('div', {}, h('small', {}, 'Kênh người bán'), h('h1', {}, shop.name)), h('div', { class: 'grow' }),
      h('a', { class: 'btn', href: '#/shop/' + S.user.id }, ico('store'), 'Xem gian hàng'), h('button', { type: 'button', class: 'btn', onclick: () => shareLink(shop.name, link), html: icon('share') + '<span>Chia sẻ</span>' })),
    h('div', { class: 'sc-grid' }, nav, body))), footer());
  if (tab === 'products') return sellerProducts(body, products, new URLSearchParams(query || '').get('edit'));
  if (tab === 'orders') return sellerOrders(body, stats.counts);
  if (tab === 'settings') return sellerSettings(body, shop);
  // overview
  const kpi = (k, label, val, sub, href) => h(href ? 'a' : 'div', { class: 'kpi', href }, ico(k), h('span', {}, label), h('b', {}, val), sub && h('small', {}, sub));
  const checklist = [
    [!!shop.logo && !!shop.banner, 'Thêm logo và ảnh bìa cho gian hàng', '#/seller/settings'],
    [products.length > 0, 'Đăng sản phẩm đầu tiên', '#/seller/products?edit=new'],
    [products.some((p) => p.videos > 0), 'Gắn sản phẩm vào video để khách mua khi xem', '#/me'],
    [!!shop.about, 'Viết giới thiệu và chính sách của shop', '#/seller/settings'],
  ];
  body.append(
    h('div', { class: 'kpis' },
      kpi('receipt', 'Đơn chờ xác nhận', String(newN), newN ? 'Xác nhận ngay để giữ khách' : 'Không có đơn chờ', '#/seller/orders'),
      kpi('cash', 'Doanh thu (đã giao)', vnd(stats.revenue.money), stats.revenue.n + ' đơn thành công'),
      kpi('bag', 'Đơn hôm nay', String(stats.today.n), vnd(stats.today.money)),
      kpi('truck', 'Đang xử lý', String(stats.pending.n), vnd(stats.pending.money)),
      kpi('box', 'Sản phẩm', String(products.length), fmtCount(shop.stats.sold) + ' đã bán', '#/seller/products'),
      kpi('chart', 'Lượt xem sản phẩm', fmtCount(stats.views), shop.stats.rating ? '★ ' + shop.stats.rating + ' · ' + shop.stats.reviews + ' đánh giá' : 'Chưa có đánh giá')),
    h('section', { class: 'card sc-card' }, h('h3', {}, 'Bắt đầu bán hàng'), h('ul', { class: 'checklist' }, checklist.map(([ok, t, href]) => h('li', { class: ok ? 'ok' : '' }, h('i', {}, ok ? '✓' : ''), h('a', { href }, t))))),
    h('section', { class: 'card sc-card' }, h('h3', {}, 'Đường dẫn gian hàng'), h('p', { class: 'muted' }, 'Gửi cho khách hoặc dán vào phần giới thiệu trên mạng xã hội.'),
      h('div', { class: 'copyrow' }, h('input', { value: link, readonly: true, onclick: (e) => e.target.select() }), h('button', { type: 'button', class: 'btn primary', onclick: () => shareLink(shop.name, link) }, 'Sao chép'))));
}

function sellerProducts(body, products, editId) {
  const list = h('div', { class: 'sc-plist' });
  const paint = () => list.replaceChildren(...(products.length ? products.map((p) => {
    const hidden = p.status !== 'active';
    return h('article', { class: 'sc-prow' + (hidden || p.locked ? ' dim' : '') },
      h('img', { src: p.image, alt: '' }),
      h('div', { class: 'sc-pinfo' }, h('a', { href: '#/p/' + p.id, translate: 'no' }, p.title),
        h('div', { class: 'sc-pmeta' }, h('b', {}, vnd(p.price)), p.comparePrice > 0 && h('s', {}, vnd(p.comparePrice)),
          h('span', {}, 'Kho: ' + (p.stock == null ? 'không giới hạn' : p.stock)), h('span', {}, 'Đã bán: ' + p.sold), h('span', {}, 'Xem: ' + fmtCount(p.views)), h('span', {}, 'Video: ' + p.videos)),
        h('div', {}, p.locked ? h('span', { class: 'opill cancelled' }, 'Bị quản trị viên ẩn') : h('span', { class: 'opill ' + (hidden ? 'new' : 'done') }, hidden ? 'Đang ẩn' : 'Đang bán'))),
      h('div', { class: 'sc-pact' },
        h('button', { type: 'button', class: 'btn sm', onclick: () => productForm(p, reload) }, ico('edit'), 'Sửa'),
        h('button', { type: 'button', class: 'btn sm', onclick: async () => { try { await api('/me/products/' + p.id + '/status', { method: 'POST', body: { status: hidden ? 'active' : 'hidden' } }); toast(hidden ? 'Sản phẩm đã hiện lại' : 'Đã ẩn sản phẩm'); reload(); } catch (e) { fail(e); } } }, hidden ? 'Hiện' : 'Ẩn'),
        h('button', { type: 'button', class: 'btn sm ghost', 'aria-label': 'Xoá', onclick: async () => { if (!confirm('Xoá sản phẩm "' + p.title + '"? Video đang gắn sản phẩm này sẽ được gỡ liên kết.')) return; try { await api('/me/products/' + p.id + '/status', { method: 'POST', body: { status: 'deleted' } }); toast('Đã xoá sản phẩm'); reload(); } catch (e) { fail(e); } }, html: icon('trash') })));
  }) : [emptyBox('box', 'Chưa có sản phẩm', 'Thêm sản phẩm với ảnh đẹp, giá rõ ràng và mô tả chi tiết để khách tin tưởng.', h('button', { type: 'button', class: 'btn primary', onclick: () => productForm(null, reload) }, '+ Thêm sản phẩm đầu tiên'))]));
  const reload = async () => { const d = await api('/me/shop'); products = d.products; paint(); };
  body.append(h('div', { class: 'sc-bar' }, h('h2', {}, 'Sản phẩm (' + products.length + ')'), h('button', { type: 'button', class: 'btn primary', onclick: () => productForm(null, reload) }, '+ Thêm sản phẩm')), list);
  paint();
  if (editId === 'new') productForm(null, reload);
  else if (editId) { const p = products.find((x) => String(x.id) === String(editId)); if (p) productForm(p, reload); }
}

function productForm(p, onSaved) {
  const imgs = p ? p.images.map((url) => ({ url })) : [];
  const strip = h('div', { class: 'imgstrip' });
  const fileIn = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true, class: 'sr', id: 'pimg' });
  const paint = () => strip.replaceChildren(...imgs.map((x, i) => h('div', { class: 'imgcell' }, h('img', { src: x.url, alt: '' }), i === 0 && h('span', { class: 'imgcover' }, 'Ảnh bìa'),
    h('div', { class: 'imgtools' },
      i > 0 && h('button', { type: 'button', 'aria-label': 'Dời lên trước', onclick: () => { [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]]; paint(); } }, '‹'),
      h('button', { type: 'button', 'aria-label': 'Xoá ảnh', onclick: () => { imgs.splice(i, 1); paint(); } }, '✕'),
      i < imgs.length - 1 && h('button', { type: 'button', 'aria-label': 'Dời ra sau', onclick: () => { [imgs[i + 1], imgs[i]] = [imgs[i], imgs[i + 1]]; paint(); } }, '›')))),
    imgs.length < 9 ? h('label', { class: 'imgadd', for: 'pimg' }, h('b', {}, '+'), h('span', {}, 'Thêm ảnh'), h('small', {}, imgs.length + '/9')) : '');
  fileIn.addEventListener('change', () => {
    for (const f of fileIn.files) {
      if (imgs.length >= 9) break;
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast('Chỉ nhận ảnh JPG/PNG/WebP', true); continue; }
      if (f.size > 8 * 1024 * 1024) { toast('Mỗi ảnh tối đa 8MB', true); continue; }
      imgs.push({ file: f, url: URL.createObjectURL(f) });
    }
    fileIn.value = ''; paint();
  });
  paint();
  const inp = (name, label, attrs = {}, hint) => h('label', { class: 'f' }, h('span', {}, label), attrs.rows ? h('textarea', { name, ...attrs }, attrs.value || '') : h('input', { name, ...attrs }), hint && h('small', {}, hint));
  const err = h('div', { class: 'err', hidden: true });
  const cats = ['Thời trang', 'Mỹ phẩm & làm đẹp', 'Phụ kiện', 'Nước hoa', 'Đồ lót & đồ ngủ', 'Sức khoẻ', 'Đồ ăn & thức uống', 'Gia dụng', 'Điện tử', 'Dịch vụ', 'Khác'];
  const f = h('form', { class: 'pform' },
    h('h3', {}, p ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'),
    h('div', { class: 'f' }, h('span', { class: 'flabel' }, 'Ảnh sản phẩm (tối đa 9 ảnh, ảnh đầu tiên là ảnh bìa)'), strip, fileIn),
    inp('title', 'Tên sản phẩm', { value: p ? p.title : '', maxlength: 120, required: true, placeholder: 'VD: Váy lụa hai dây cao cấp' }),
    h('div', { class: 'two' },
      inp('price', 'Giá bán (₫)', { value: p ? p.price : '', inputmode: 'numeric', required: true, placeholder: '350000' }),
      inp('comparePrice', 'Giá gốc (₫, không bắt buộc)', { value: p && p.comparePrice ? p.comparePrice : '', inputmode: 'numeric', placeholder: '450000' }, 'Hiện giá gạch ngang và % giảm')),
    h('div', { class: 'two' },
      inp('category', 'Danh mục', { value: p ? p.category : '', maxlength: 40, list: 'pcats', placeholder: 'Chọn hoặc tự nhập' }),
      inp('stock', 'Số lượng trong kho', { value: p && p.stock != null ? p.stock : '', inputmode: 'numeric', placeholder: 'Để trống = không giới hạn' })),
    h('datalist', { id: 'pcats' }, cats.map((c) => h('option', { value: c }))),
    inp('variants', 'Phân loại (màu, size…)', { value: p ? p.variants.join(', ') : '', maxlength: 600, placeholder: 'VD: Đỏ - S, Đỏ - M, Đen - S' }, 'Ngăn cách bằng dấu phẩy. Khách sẽ chọn 1 phân loại khi mua.'),
    inp('description', 'Mô tả sản phẩm', { rows: 7, maxlength: 5000, value: p ? p.description : '', placeholder: 'Chất liệu, kích thước, cách dùng, chính sách đổi trả…' }),
    !p && h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'hidden', value: '1' }), h('span', {}, 'Lưu nháp (ẩn, chưa bán ngay)')),
    err,
    h('button', { class: 'btn primary lg', type: 'submit', style: 'width:100%' }, p ? 'Lưu thay đổi' : 'Đăng bán sản phẩm'));
  const m = modal(h('div', { class: 'shopx' }, f), { wide: true });
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); err.hidden = true;
    if (!imgs.length) { err.textContent = 'Hãy thêm ít nhất 1 ảnh sản phẩm'; err.hidden = false; return; }
    const fd = new FormData(f);
    const order = []; let k = 0;
    for (const x of imgs) { if (x.file) { fd.append('images', x.file, x.file.name); order.push('new:' + k++); } else order.push(x.url); }
    fd.set('order', JSON.stringify(order));
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Đang lưu…';
    try {
      if (p) await api('/me/products/' + p.id, { method: 'PUT', body: fd }); else await api('/me/products', { method: 'POST', body: fd });
      toast(p ? 'Đã lưu sản phẩm' : 'Đã đăng bán sản phẩm 🎉'); m.close(); onSaved && onSaved();
      if (/edit=/.test(location.hash)) history.replaceState(null, '', '#/seller/products');
    } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; btn.textContent = p ? 'Lưu thay đổi' : 'Đăng bán sản phẩm'; }
  });
}

function sellerOrders(body, counts) {
  let status = 'new';
  if (!(counts || {}).new) status = '';
  const host = h('div');
  const load = async () => {
    const [{ orders }, { stats }] = await Promise.all([api('/me/sales?status=' + status), api('/me/shop')]);
    const cards = orders.map((o) => h('article', { class: 'ocard card' },
      h('header', {}, h('div', { class: 'obuyer' }, avatar(o.buyer, 'sm'), h('b', {}, o.buyer.name)), statusPill(o)),
      orderItem(o), steps(o),
      h('div', { class: 'oship' },
        h('div', {}, ico('truck'), h('span', {}, h('b', {}, o.name), ' · ', h('a', { href: 'tel:' + o.phone }, o.phone), h('br'), o.address)),
        o.note && h('div', {}, h('span', { class: 'si', html: icon('msg') }), h('span', {}, o.note)),
        h('div', {}, ico(o.pay === 'bank' ? 'bank' : 'cash'), h('span', {}, o.pay === 'bank' ? 'Chuyển khoản (kiểm tra tiền về với nội dung ' + o.code + ')' : 'Thu tiền khi giao (COD): ' + vnd(o.total)))),
      o.sellerNote && h('p', { class: 'onote' }, h('b', {}, 'Ghi chú của bạn: '), o.sellerNote),
      h('footer', {}, h('small', { class: 'muted' }, o.code + ' · ' + fmtDate(o.createdAt)),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn sm', onclick: () => startChat(o.buyer), html: icon('msg') + '<span>Nhắn khách</span>' }),
          o.next.map((st) => h('button', { type: 'button', class: 'btn sm ' + (st === 'cancelled' ? 'ghost' : 'primary'), onclick: async () => {
            let note = null;
            if (st === 'cancelled') { note = prompt('Lý do huỷ đơn (khách sẽ thấy):', 'Hết hàng'); if (note === null) return; }
            if (st === 'confirmed') { note = prompt('Ghi chú cho khách (VD: phí ship 30.000₫, giao trong 2-3 ngày). Có thể để trống:', ''); if (note === null) return; }
            try { await api('/me/sales/' + o.id + '/status', { method: 'POST', body: { status: st, note } }); toast(STATUS[st]); load(); } catch (e) { fail(e); }
          } }, ACTION[st]))))));
    host.replaceChildren(statusTabs(stats.counts, status, (k) => { status = k; load(); }),
      cards.length ? h('div', { class: 'olist' }, cards) : emptyBox('receipt', status === 'new' ? 'Không có đơn chờ xác nhận' : 'Chưa có đơn hàng', 'Đơn mới sẽ hiện ở đây và bạn nhận thông báo ngay khi khách đặt.'));
  };
  body.append(h('div', { class: 'sc-bar' }, h('h2', {}, 'Đơn hàng')), host);
  const onOrder = () => load().catch(() => {});
  window.addEventListener('xg-order', onOrder); onLeave(() => window.removeEventListener('xg-order', onOrder));
  return load();
}

function sellerSettings(body, shop) {
  const ACCENTS = ['#ff2e7e', '#e11d48', '#f59e0b', '#d4a24c', '#10b981', '#0ea5e9', '#8b5cf6', '#f472b6'];
  let accent = shop.accent || '';
  const swatches = h('div', { class: 'swatches' }, ['', ...ACCENTS].map((c) => h('button', { type: 'button', class: 'sw' + (c === accent ? ' on' : ''), style: c ? 'background:' + c : '', 'aria-label': c || 'Mặc định', onclick: (e) => { accent = c; swatches.querySelectorAll('.sw').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); } }, c ? '' : 'Mặc định')));
  const imgPick = (kind, label, cur) => {
    const prev = h('div', { class: 'imgpick ' + kind, style: cur ? 'background-image:url("' + cur + '")' : '' }, !cur && h('span', {}, label));
    const inpF = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', class: 'sr', id: 'up-' + kind });
    inpF.addEventListener('change', async () => {
      const file = inpF.files[0]; if (!file) return;
      const fd = new FormData(); fd.append('file', file);
      try { const r = await api('/me/shop/image?kind=' + kind, { method: 'POST', body: fd }); prev.style.backgroundImage = 'url("' + r.url + '")'; prev.replaceChildren(); toast('Đã cập nhật ' + label.toLowerCase()); } catch (e) { fail(e); }
    });
    return h('div', { class: 'f' }, h('span', { class: 'flabel' }, label), h('label', { for: 'up-' + kind, class: 'imgpick-wrap' }, prev, h('span', { class: 'btn sm' }, 'Đổi ảnh')), inpF);
  };
  const inp = (name, label, attrs = {}, hint) => h('label', { class: 'f' }, h('span', {}, label), attrs.rows ? h('textarea', { name, ...attrs }, attrs.value || '') : h('input', { name, ...attrs }), hint && h('small', {}, hint));
  const f = h('form', { class: 'card sc-card' },
    h('h3', {}, 'Hình ảnh gian hàng'),
    h('div', { class: 'two' }, imgPick('logo', 'Logo shop', shop.logo), imgPick('banner', 'Ảnh bìa (ngang, 1600×500)', shop.banner)),
    h('h3', {}, 'Thông tin'),
    inp('name', 'Tên gian hàng', { value: shop.name, maxlength: 60, placeholder: 'VD: Mây Boutique' }),
    inp('slogan', 'Khẩu hiệu', { value: shop.slogan, maxlength: 120, placeholder: 'VD: Thời trang thiết kế, may đo tận tâm' }),
    inp('about', 'Giới thiệu shop', { rows: 5, maxlength: 2000, value: shop.about }),
    h('div', { class: 'two' }, inp('phone', 'Số điện thoại shop', { value: shop.phone, type: 'tel', maxlength: 20 }), inp('zalo', 'Zalo', { value: shop.zalo, type: 'tel', maxlength: 20 })),
    inp('address', 'Địa chỉ lấy hàng / cửa hàng', { value: shop.address, maxlength: 200 }),
    h('h3', {}, 'Thanh toán & chính sách'),
    inp('bank', 'Thông tin chuyển khoản (không bắt buộc)', { rows: 3, maxlength: 300, value: shop.bank, placeholder: 'VD: Vietcombank – 0123456789 – NGUYEN THI A' }, 'Chỉ hiện cho khách sau khi họ đặt hàng chọn chuyển khoản. Để trống nếu chỉ nhận thanh toán khi nhận hàng.'),
    inp('policies', 'Cam kết của shop (mỗi dòng một ý, tối đa 6)', { rows: 4, maxlength: 600, value: (shop.policies.length ? shop.policies : DEFAULT_POLICIES).join('\n') }),
    h('div', { class: 'f' }, h('span', { class: 'flabel' }, 'Màu chủ đạo của gian hàng'), swatches),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'closed', checked: shop.closed }), h('span', {}, 'Tạm nghỉ bán (khách vẫn xem được sản phẩm nhưng chưa đặt hàng được)')),
    h('button', { class: 'btn primary lg', type: 'submit' }, 'Lưu thiết lập'));
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = Object.fromEntries(new FormData(f));
    b.policies = String(b.policies || '').split('\n').map((x) => x.trim()).filter(Boolean);
    b.closed = f.elements.closed.checked; b.accent = accent;
    try { await api('/me/shop', { method: 'PUT', body: b }); toast('Đã lưu thiết lập gian hàng'); } catch (ex) { fail(ex); }
  });
  body.append(h('div', { class: 'sc-bar' }, h('h2', {}, 'Thiết lập shop')), f);
}

// ---------- pinning a product to a video (upload page & edit dialog) ----------
function productPicker(current) {
  const sel = h('select', { name: 'productId', 'aria-label': 'Sản phẩm gắn kèm' }, h('option', { value: '' }, 'Không gắn sản phẩm'));
  const box = h('div', { class: 'f pick-prod' }, h('span', { class: 'flabel' }, ico('bag'), 'Gắn sản phẩm từ gian hàng (khách bấm "Mua" ngay trên video)'), sel,
    h('small', {}, h('a', { href: '#/seller/products?edit=new' }, '+ Thêm sản phẩm mới vào gian hàng')));
  api('/me/products-mini').then(({ products }) => {
    products.forEach((p) => sel.append(h('option', { value: p.id, selected: String(p.id) === String(current || '') }, p.title + ' – ' + vnd(p.price) + (p.hidden ? ' (đang ẩn)' : ''))));
    if (!products.length) sel.disabled = true;
  }).catch(() => {});
  return box;
}

// ---------- links on the profile & account pages ----------
function profileButton(user, me) {
  return h('a', { class: 'btn shopbtn', href: me ? '#/seller' : '#/shop/' + user.id }, ico('store'), me ? 'Gian hàng của tôi' : 'Gian hàng');
}
function accountCard() {
  return h('div', { class: 'card sc-card acct-shop' }, h('h3', {}, ico('store'), 'Mua sắm & bán hàng'),
    h('p', { class: 'muted' }, 'Mở gian hàng miễn phí, đăng sản phẩm và gắn vào video để khách mua ngay khi xem.'),
    h('div', { class: 'row' }, h('a', { class: 'btn primary', href: '#/seller' }, 'Quản lý gian hàng'), h('a', { class: 'btn', href: '#/orders' }, ico('receipt'), 'Đơn mua của tôi'), h('a', { class: 'btn', href: '#/shop' }, ico('bag'), 'Mua sắm')));
}

// ---------- admin ----------
async function adminBox() {
  const box = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:16px' }, 'Gian hàng & đơn hàng'));
  const q = h('input', { type: 'search', placeholder: 'Tìm theo tên sản phẩm hoặc email người bán', style: 'max-width:380px' });
  const table = h('div'), pager = h('div', { class: 'pager' }), statsRow = h('div', { class: 'row', style: 'gap:10px;margin-bottom:14px;flex-wrap:wrap' });
  const go = async (page) => {
    const d = await api('/admin/shop?page=' + page + '&q=' + encodeURIComponent(q.value.trim()));
    const s = d.stats;
    statsRow.replaceChildren(...[['Gian hàng', s.shops], ['Sản phẩm', s.products], ['Đơn hàng', s.orders], ['Đơn hôm nay', s.ordersToday], ['Doanh số đã giao', vnd(s.revenue)]].map(([l, v]) => h('div', { class: 'card', style: 'padding:12px 16px' }, h('div', { class: 'muted', style: 'font-size:13px' }, l), h('b', { style: 'font-size:22px' }, String(v)))));
    table.replaceChildren(h('div', { class: 'sc-plist' }, d.products.map((p) => {
      const lock = h('button', { type: 'button', class: 'btn sm' + (p.locked ? '' : ' live') }, p.locked ? 'Bỏ ẩn' : 'Ẩn sản phẩm');
      lock.addEventListener('click', async () => { try { await api('/admin/products/' + p.id + '/lock', { method: 'POST', body: { locked: !p.locked } }); toast(p.locked ? 'Đã bỏ ẩn' : 'Đã ẩn sản phẩm'); go(page); } catch (e) { fail(e); } });
      return h('article', { class: 'sc-prow' + (p.locked || p.status !== 'active' ? ' dim' : '') }, h('img', { src: p.image, alt: '' }),
        h('div', { class: 'sc-pinfo' }, h('a', { href: '#/p/' + p.id }, p.title), h('div', { class: 'sc-pmeta' }, h('b', {}, vnd(p.price)), h('span', {}, p.seller.name + ' · ' + p.seller.email), h('span', {}, 'Đơn: ' + p.orders), h('span', {}, 'Đã bán: ' + p.sold), h('span', {}, p.status === 'active' ? 'Đang bán' : 'Chủ shop ẩn'))),
        h('div', { class: 'sc-pact' }, h('a', { class: 'btn sm', href: '#/shop/' + p.seller.id }, 'Gian hàng'), lock));
    })), d.products.length ? '' : h('p', { class: 'muted' }, 'Chưa có sản phẩm.'));
    renderPager(pager, d.page, d.pages, go);
  };
  let t; q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => go(1), 350); });
  box.append(statsRow, h('div', { style: 'margin-bottom:12px' }, q), table, pager);
  go(1).catch(fail);
  return box;
}

// ---------- routing ----------
function page(a, seg, query) {
  if (a === 'p') return pageProduct(seg[0]);
  if (a === 'orders') return pageOrders(query);
  if (a === 'seller') return pageSeller(seg[0] || 'overview', query);
  return seg[0] ? pageShop(seg[0]) : pageMall();
}

window.XGShop = { page, videoCard, quickView, productPicker, profileButton, accountCard, adminBox };
})();
