// Gian hàng: hook the shop pages into the app (routes, video product strip, profile, account, upload, edit, admin)
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}
edit('server.js', [
  ["  stats.followers = db.prepare('SELECT COUNT(*) AS n FROM follows WHERE followee_id = ?').get(u.id).n;",
   "  stats.followers = db.prepare('SELECT COUNT(*) AS n FROM follows WHERE followee_id = ?').get(u.id).n;\n  stats.products = db.prepare(\"SELECT COUNT(*) AS n FROM products WHERE user_id = ? AND status = 'active' AND locked = 0\").get(u.id).n;"],
]);
edit('public/js/app.js', [
  ["window.XG = { h, toast, icon };", "window.XG = { h, toast, icon, api, modal, fail, avatar, esc, fmtCount, timeAgo, fmtDate, needLogin, openAuth, startChat, vbadge, renderPager, areaTile, footer, main, S, onLeave };"],
  ["    if (a === 'admin') return pageAdmin();", "    if (a === 'admin') return pageAdmin();\n    if (['shop', 'p', 'seller', 'orders'].includes(a)) return window.XGShop.page(a, seg.slice(1), query);"],
  ["  ['#/', 'Trang chủ', 'home'], ['#/feed', 'Video', 'play'], ['#/regions', 'Khu vực', 'pin'],", "  ['#/', 'Trang chủ', 'home'], ['#/feed', 'Video', 'play'], ['#/shop', 'Mua sắm', 'home'], ['#/regions', 'Khu vực', 'pin'],"],
  // product strip on the video
  ["        h('button', { class: 'infobtn', type: 'button', onclick: () => openInfo(v), html: icon('info') + 'Xem thông tin' }),",
   "        v.product && window.XGShop && window.XGShop.videoCard(v),\n        h('button', { class: 'infobtn', type: 'button', onclick: () => openInfo(v), html: icon('info') + 'Xem thông tin' }),"],
  // profile: shop button
  ["        h('button', { class: 'btn', onclick: () => openBook(user), html: icon('cal') + '<span>Hẹn gặp</span>' }),",
   "        h('button', { class: 'btn', onclick: () => openBook(user), html: icon('cal') + '<span>Hẹn gặp</span>' }),\n        stats.products > 0 && window.XGShop.profileButton(user, false),"],
  ["      : [h('a', { class: 'btn primary', href: '#/me' }, 'Sửa hồ sơ'), h('button', { class: 'btn', onclick: shareProfile, html: icon('share') + '<span>Chia sẻ hồ sơ</span>' })]),",
   "      : [h('a', { class: 'btn primary', href: '#/me' }, 'Sửa hồ sơ'), window.XGShop.profileButton(user, true), h('button', { class: 'btn', onclick: shareProfile, html: icon('share') + '<span>Chia sẻ hồ sơ</span>' })]),"],
  // account page
  ["    apiKeysCard(),", "    window.XGShop.accountCard(),\n    apiKeysCard(),"],
  // upload page
  ["    geoBox, nickBox, detailsBox,", "    geoBox, nickBox, detailsBox, window.XGShop.productPicker(''),"],
  // own video edit dialog
  ["    h('label', { class: 'f' }, h('span', {}, 'Điều không muốn'), h('textarea', { name: 'boundaries', rows: 2, maxlength: 300 }, i.boundaries || '')),",
   "    h('label', { class: 'f' }, h('span', {}, 'Điều không muốn'), h('textarea', { name: 'boundaries', rows: 2, maxlength: 300 }, i.boundaries || '')),\n    own && window.XGShop.productPicker(v.productId),"],
  // admin
  ["trafficBox, shareBox, feedBox, pageBox, tgBox, partnerBox, statBox,", "trafficBox, shareBox, feedBox, pageBox, tgBox, partnerBox, statBox, await window.XGShop.adminBox(),"],
  ["t('#/nearby', 'Quanh đây', 'near'), t('#/live'", "t('#/nearby', 'Quanh đây', 'near'), t('#/shop', 'Mua sắm', 'shop'), t('#/live'"],
  // realtime order notices
  ["  es.addEventListener('booking', ()", "  es.addEventListener('order', (ev) => { const d = JSON.parse(ev.data); toast(d.kind === 'new' ? '🛍️ Đơn hàng mới: ' + d.title : '📦 Đơn ' + d.code + ': ' + d.statusText); window.dispatchEvent(new CustomEvent('xg-order', { detail: d })); });\n  es.addEventListener('booking', ()"],
]);
console.log('patched');
