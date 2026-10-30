// Gian hàng: every member can run a small shop (like a TikTok Shop showcase). Products with photos, prices and
// variants, orders paid on delivery or by bank transfer, buyer reviews, and a product can be pinned to a video so
// viewers can buy straight from the feed.
const crypto = require('crypto');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

const STATUS = { new: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', done: 'Đã giao', cancelled: 'Đã huỷ' };
const NEXT = { new: ['confirmed', 'cancelled'], confirmed: ['shipping', 'cancelled'], shipping: ['done', 'cancelled'], done: [], cancelled: [] };
const PAGE = 20;

function install(app, { db, fail, clean, now, needUser, needAdmin, postLimiter, rmUpload, pushUser, listVideos, UPLOAD_DIR, IMAGE_TYPES }) {
  const mail = require('./mail');

  const imgUpload = multer({
    storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (_req, file, cb) => cb(null, 'p-' + crypto.randomBytes(14).toString('hex') + (IMAGE_TYPES[file.mimetype] || '.jpg')) }),
    limits: { fileSize: 8 * 1024 * 1024, files: 9 },
    fileFilter: (_req, file, cb) => cb(null, !!IMAGE_TYPES[file.mimetype]),
  });
  const orderLimiter = rateLimit({ windowMs: 10 * 60_000, limit: 15, standardHeaders: true, legacyHeaders: false, message: { error: 'Bạn đặt hàng quá nhanh, vui lòng thử lại sau ít phút' } });

  const json = (s, d) => { try { const v = JSON.parse(s || ''); return v == null ? d : v; } catch { return d; } };
  const money = (n) => new Intl.NumberFormat('vi-VN').format(n) + '₫';
  const intIn = (v, lo, hi) => { const n = Math.round(Number(String(v ?? '').replace(/[^\d.-]/g, ''))); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
  const PUBLIC = "p.status = 'active' AND p.locked = 0 AND u.banned = 0";

  function shopRow(uid) {
    return db.prepare('SELECT * FROM shops WHERE user_id = ?').get(uid) || null;
  }
  function shopInfo(u, viewer) {
    const s = shopRow(u.id) || {};
    const st = db.prepare(`SELECT COUNT(*) AS products, COALESCE(SUM(p.sold), 0) AS sold FROM products p WHERE p.user_id = ? AND p.status = 'active' AND p.locked = 0`).get(u.id);
    const rv = db.prepare('SELECT COUNT(*) AS n, AVG(r.rating) AS avg FROM product_reviews r JOIN products p ON p.id = r.product_id WHERE p.user_id = ?').get(u.id);
    const followers = db.prepare('SELECT COUNT(*) AS n FROM follows WHERE followee_id = ?').get(u.id).n;
    const done = db.prepare("SELECT COUNT(*) AS n FROM orders WHERE seller_id = ? AND status = 'done'").get(u.id).n;
    const all = db.prepare("SELECT COUNT(*) AS n FROM orders WHERE seller_id = ? AND status <> 'new'").get(u.id).n;
    return {
      id: u.id, name: s.name || u.name, ownerName: u.name, slogan: s.slogan || '', about: s.about || '', banner: s.banner || '', logo: s.logo || u.avatar || '',
      phone: s.phone || '', zalo: s.zalo || '', address: s.address || '', policies: json(s.policies, []), accent: s.accent || '', closed: !!s.closed,
      hasBank: !!s.bank, verified: !!u.verified, createdAt: s.created_at || u.created_at,
      stats: { products: st.products, sold: st.sold, rating: rv.n ? Math.round(rv.avg * 10) / 10 : null, reviews: rv.n, followers, fulfilment: all ? Math.round(done / all * 100) : null },
      following: !!(viewer && db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?').get(viewer.id, u.id)),
      categories: db.prepare(`SELECT category AS name, COUNT(*) AS n FROM products WHERE user_id = ? AND status = 'active' AND locked = 0 AND category <> '' GROUP BY category ORDER BY n DESC`).all(u.id),
    };
  }
  function product(r, full = false) {
    const images = json(r.images, []);
    const out = {
      id: r.id, title: r.title, price: r.price, comparePrice: r.compare_price > r.price ? r.compare_price : 0,
      discount: r.compare_price > r.price ? Math.round((1 - r.price / r.compare_price) * 100) : 0,
      image: images[0] || '', images, category: r.category || '', sold: r.sold || 0, stock: r.stock,
      rating: r.r_n ? Math.round(r.r_avg * 10) / 10 : null, reviews: r.r_n || 0, createdAt: r.created_at,
      seller: r.u_name != null ? { id: r.user_id, name: r.s_name || r.u_name, avatar: r.s_logo || r.u_avatar || '', verified: !!r.u_verified } : undefined,
    };
    if (full) Object.assign(out, { description: r.description || '', variants: json(r.variants, []), status: r.status, locked: !!r.locked, views: r.views || 0 });
    return out;
  }
  const SELECT = `SELECT p.*, u.name AS u_name, u.avatar AS u_avatar, u.verified AS u_verified, s.name AS s_name, s.logo AS s_logo,
      (SELECT COUNT(*) FROM product_reviews r WHERE r.product_id = p.id) AS r_n, (SELECT AVG(rating) FROM product_reviews r WHERE r.product_id = p.id) AS r_avg
    FROM products p JOIN users u ON u.id = p.user_id LEFT JOIN shops s ON s.user_id = p.user_id`;
  const ORDER = { new: 'p.id DESC', best: 'p.sold DESC, p.id DESC', price_asc: 'p.price ASC, p.id DESC', price_desc: 'p.price DESC, p.id DESC', pop: '(p.sold * 5 + p.views) DESC, p.id DESC' };

  function listProducts({ uid = null, q = '', cat = '', sort = 'pop', page = 1, size = PAGE }) {
    const where = PUBLIC + ' AND (? IS NULL OR p.user_id = ?) AND (? = \'\' OR p.title LIKE ? OR p.category LIKE ?) AND (? = \'\' OR p.category = ?)';
    const args = [uid, uid, q, '%' + q + '%', '%' + q + '%', cat, cat];
    const total = db.prepare('SELECT COUNT(*) AS n FROM products p JOIN users u ON u.id = p.user_id WHERE ' + where).get(...args).n;
    const pages = Math.max(1, Math.ceil(total / size)), pg = Math.min(pages, Math.max(1, page));
    const rows = db.prepare(SELECT + ' WHERE ' + where + ' ORDER BY ' + (ORDER[sort] || ORDER.pop) + ' LIMIT ? OFFSET ?').all(...args, size, (pg - 1) * size);
    return { products: rows.map((r) => product(r)), total, page: pg, pages };
  }
  const readQuery = (q) => ({ q: clean(q.q, 60), cat: clean(q.cat, 40), sort: String(q.sort || 'pop'), page: parseInt(q.page, 10) || 1 });

  // Small product cards for the videos a product is pinned to (used by the feed).
  function cardsFor(ids) {
    const out = new Map();
    const list = [...new Set(ids.filter(Boolean))];
    if (!list.length) return out;
    const rows = db.prepare(`SELECT p.id, p.title, p.price, p.compare_price, p.images, p.sold FROM products p JOIN users u ON u.id = p.user_id
      WHERE ${PUBLIC} AND p.id IN (${list.map(() => '?').join(',')})`).all(...list);
    for (const r of rows) out.set(r.id, { id: r.id, title: r.title, price: r.price, comparePrice: r.compare_price > r.price ? r.compare_price : 0, image: json(r.images, [])[0] || '', sold: r.sold || 0 });
    return out;
  }
  // A product id a member may pin to their own video (null = none, false = not allowed)
  function ownProductId(uid, v) {
    if (v == null || v === '' || v === '0') return null;
    const p = db.prepare("SELECT id FROM products WHERE id = ? AND user_id = ? AND status <> 'deleted'").get(Number(v), uid);
    return p ? p.id : false;
  }

  // ---------- public: shops & products ----------
  const userOr404 = (res, id) => {
    const u = db.prepare('SELECT * FROM users WHERE id = ? AND banned = 0').get(Number(id));
    if (!u) fail(res, 404, 'Không tìm thấy gian hàng');
    return u;
  };
  app.get('/api/shops/:uid(\\d+)', (req, res) => {
    const u = userOr404(res, req.params.uid); if (!u) return;
    const shop = shopInfo(u, req.user);
    shop.videos = db.prepare("SELECT COUNT(*) AS n FROM videos v JOIN products p ON p.id = v.product_id WHERE v.user_id = ? AND v.hidden = 0 AND p.status = 'active' AND p.locked = 0").get(u.id).n;
    res.json({ shop, mine: !!(req.user && req.user.id === u.id) });
  });
  app.get('/api/shops/:uid(\\d+)/products', (req, res) => {
    const u = userOr404(res, req.params.uid); if (!u) return;
    res.json(listProducts({ uid: u.id, ...readQuery(req.query) }));
  });
  app.get('/api/shops/:uid(\\d+)/videos', (req, res) => {
    const ids = db.prepare(`SELECT v.id FROM videos v JOIN products p ON p.id = v.product_id
      WHERE v.user_id = ? AND v.hidden = 0 AND p.status = 'active' AND p.locked = 0 ORDER BY v.id DESC LIMIT 60`).all(Number(req.params.uid)).map((r) => r.id);
    res.json({ videos: ids.length ? listVideos(req.user, { ids, limit: ids.length }) : [] });
  });
  // Mua sắm: products from every shop
  app.get('/api/products', (req, res) => {
    const out = listProducts(readQuery(req.query));
    out.categories = db.prepare(`SELECT p.category AS name, COUNT(*) AS n FROM products p JOIN users u ON u.id = p.user_id WHERE ${PUBLIC} AND p.category <> '' GROUP BY p.category ORDER BY n DESC LIMIT 16`).all();
    res.json(out);
  });
  const seenView = new Map();
  app.get('/api/products/:id(\\d+)', (req, res) => {
    const r = db.prepare(SELECT + ' WHERE p.id = ?').get(Number(req.params.id));
    const owner = r && req.user && (req.user.id === r.user_id || req.user.role === 'admin');
    const seller = r && db.prepare('SELECT * FROM users WHERE id = ?').get(r.user_id);
    if (!r || r.status === 'deleted' || (!owner && (r.status !== 'active' || r.locked || seller.banned))) return fail(res, 404, 'Sản phẩm không tồn tại hoặc đã ngừng bán');
    const who = (req.user ? 'u' + req.user.id : req.ip) + '|' + r.id, t = Date.now();
    if (!owner && !(seenView.get(who) > t - 30 * 60_000)) {
      seenView.set(who, t); db.prepare('UPDATE products SET views = views + 1 WHERE id = ?').run(r.id);
      if (seenView.size > 50_000) seenView.clear();
    }
    const vids = db.prepare('SELECT id FROM videos WHERE product_id = ? AND hidden = 0 ORDER BY id DESC LIMIT 12').all(r.id).map((x) => x.id);
    const reviews = db.prepare(`SELECT r.rating, r.body, r.variant, r.created_at, u.id AS uid, u.name, u.avatar FROM product_reviews r JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ? ORDER BY r.id DESC LIMIT 30`).all(r.id).map((x) => ({ rating: x.rating, body: x.body, variant: x.variant, createdAt: x.created_at, user: { id: x.uid, name: x.name, avatar: x.avatar } }));
    const stars = [5, 4, 3, 2, 1].map((s) => db.prepare('SELECT COUNT(*) AS n FROM product_reviews WHERE product_id = ? AND rating = ?').get(r.id, s).n);
    const more = db.prepare(SELECT + ` WHERE ${PUBLIC} AND p.user_id = ? AND p.id <> ? ORDER BY p.sold DESC, p.id DESC LIMIT 8`).all(r.user_id, r.id).map((x) => product(x));
    res.json({ product: product(r, true), shop: shopInfo(seller, req.user), videos: vids.length ? listVideos(req.user, { ids: vids, limit: vids.length }) : [], reviews, stars, more, mine: !!(req.user && req.user.id === r.user_id) });
  });

  // ---------- ordering ----------
  const orderOut = (o, extra = {}) => ({
    id: o.id, code: o.code, productId: o.product_id, title: o.title, image: o.image, variant: o.variant, price: o.price, qty: o.qty, total: o.total,
    name: o.name, phone: o.phone, address: o.address, note: o.note, pay: o.pay, status: o.status, statusText: STATUS[o.status], sellerNote: o.seller_note || '',
    createdAt: o.created_at, updatedAt: o.updated_at, next: NEXT[o.status] || [], ...extra,
  });
  const newCode = () => 'XG' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + crypto.randomBytes(3).toString('hex').toUpperCase();

  function mailSeller(sellerId, o) {
    try {
      if (!mail.configured()) return;
      const s = db.prepare('SELECT email, name FROM users WHERE id = ?').get(sellerId);
      if (!s || !s.email) return;
      const url = mail.site() + '/#/seller/orders';
      const body = mail.p(`Chào <b>${mail.esc(s.name)}</b>,`) + mail.p('Gian hàng của bạn vừa có <b>đơn hàng mới</b>. Hãy xác nhận sớm để khách yên tâm nhé!') +
        mail.features([['🛍️', o.title + (o.variant ? ' · ' + o.variant : ''), 'Số lượng: ' + o.qty + ' · Thành tiền: ' + money(o.total)],
          ['👤', o.name + ' · ' + o.phone, o.address], ['💳', o.pay === 'bank' ? 'Chuyển khoản' : 'Thanh toán khi nhận hàng (COD)', 'Mã đơn: ' + o.code]]) +
        mail.button(url, 'Xem và xác nhận đơn hàng');
      mail.send({ to: s.email, subject: `🛍️ Đơn hàng mới ${o.code} – ${money(o.total)}`,
        html: mail.layout({ preheader: o.title + ' · ' + money(o.total), eyebrow: 'Đơn hàng mới', title: 'Bạn có đơn hàng mới!', body }),
        text: mail.textOf([`Chào ${s.name},`, `Đơn hàng mới ${o.code}: ${o.title} x${o.qty} = ${money(o.total)}`, `Người mua: ${o.name} · ${o.phone} · ${o.address}`, 'Xác nhận: ' + url]) }).catch(() => {});
    } catch {}
  }

  app.post('/api/products/:id(\\d+)/order', needUser, orderLimiter, (req, res) => {
    const r = db.prepare('SELECT p.*, u.banned FROM products p JOIN users u ON u.id = p.user_id WHERE p.id = ?').get(Number(req.params.id));
    if (!r || r.status !== 'active' || r.locked || r.banned) return fail(res, 404, 'Sản phẩm không tồn tại hoặc đã ngừng bán');
    if (r.user_id === req.user.id) return fail(res, 400, 'Bạn không thể tự mua sản phẩm của chính mình');
    const shop = shopRow(r.user_id) || {};
    if (shop.closed) return fail(res, 400, 'Gian hàng đang tạm nghỉ, chưa nhận đơn');
    const b = req.body || {};
    const qty = intIn(b.qty, 1, 99);
    if (!qty) return fail(res, 400, 'Số lượng không hợp lệ');
    const variants = json(r.variants, []);
    const variant = clean(b.variant, 60);
    if (variants.length && !variants.includes(variant)) return fail(res, 400, 'Vui lòng chọn phân loại sản phẩm');
    const name = clean(b.name, 60), phone = clean(b.phone, 20).replace(/[^\d+]/g, ''), address = clean(b.address, 250), note = clean(b.note, 300);
    if (name.length < 2) return fail(res, 400, 'Vui lòng nhập họ tên người nhận');
    if (!/^\+?\d{9,12}$/.test(phone)) return fail(res, 400, 'Số điện thoại không hợp lệ');
    if (address.length < 8) return fail(res, 400, 'Vui lòng nhập địa chỉ nhận hàng đầy đủ');
    const pay = b.pay === 'bank' && shop.bank ? 'bank' : 'cod';
    if (r.stock != null && r.stock < qty) return fail(res, 400, r.stock > 0 ? 'Chỉ còn ' + r.stock + ' sản phẩm' : 'Sản phẩm đã hết hàng');
    const videoId = intIn(b.videoId, 1, 1e12);
    const o = { code: newCode(), title: r.title, image: json(r.images, [])[0] || '', variant, price: r.price, qty, total: r.price * qty, name, phone, address, note, pay };
    db.exec('BEGIN');
    try {
      if (r.stock != null) db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, r.id);
      const ins = db.prepare(`INSERT INTO orders (code, product_id, seller_id, buyer_id, video_id, title, image, variant, price, qty, total, name, phone, address, note, pay, status, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'new',?,?)`).run(o.code, r.id, r.user_id, req.user.id, videoId, o.title, o.image, variant, o.price, qty, o.total, name, phone, address, note, pay, now(), now());
      o.id = Number(ins.lastInsertRowid);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id);
    pushUser(r.user_id, 'order', { kind: 'new', code: o.code, title: o.title, total: o.total });
    mailSeller(r.user_id, o);
    res.json({ order: orderOut(row), bank: pay === 'bank' ? shop.bank : '' });
  });

  // buyer
  app.get('/api/me/orders', needUser, (req, res) => {
    const st = STATUS[req.query.status] ? req.query.status : '';
    const rows = db.prepare(`SELECT o.*, COALESCE(NULLIF(s.name, ''), u.name) AS shop_name, s.bank AS s_bank, (SELECT 1 FROM product_reviews r WHERE r.order_id = o.id) AS reviewed
      FROM orders o JOIN users u ON u.id = o.seller_id LEFT JOIN shops s ON s.user_id = o.seller_id WHERE o.buyer_id = ? AND (? = '' OR o.status = ?) ORDER BY o.id DESC LIMIT 200`).all(req.user.id, st, st);
    const counts = Object.fromEntries(db.prepare('SELECT status, COUNT(*) AS n FROM orders WHERE buyer_id = ? GROUP BY status').all(req.user.id).map((x) => [x.status, x.n]));
    res.json({ orders: rows.map((o) => orderOut(o, { shop: { id: o.seller_id, name: o.shop_name }, reviewed: !!o.reviewed, bank: o.pay === 'bank' ? o.s_bank || '' : '' })), counts });
  });
  const myOrder = (req, res, col) => {
    const o = db.prepare('SELECT * FROM orders WHERE id = ? AND ' + col + ' = ?').get(Number(req.params.id), req.user.id);
    if (!o) fail(res, 404, 'Không tìm thấy đơn hàng');
    return o;
  };
  function setStatus(o, status, note) {
    db.exec('BEGIN');
    try {
      db.prepare('UPDATE orders SET status = ?, seller_note = COALESCE(?, seller_note), updated_at = ? WHERE id = ?').run(status, note, now(), o.id);
      if (status === 'cancelled') db.prepare('UPDATE products SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL').run(o.qty, o.product_id);
      if (status === 'done') db.prepare('UPDATE products SET sold = sold + ? WHERE id = ?').run(o.qty, o.product_id);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id);
    for (const uid of [o.buyer_id, o.seller_id]) pushUser(uid, 'order', { kind: 'status', code: o.code, status, statusText: STATUS[status], title: o.title });
    return row;
  }
  app.post('/api/me/orders/:id(\\d+)/cancel', needUser, postLimiter, (req, res) => {
    const o = myOrder(req, res, 'buyer_id'); if (!o) return;
    if (o.status !== 'new') return fail(res, 400, 'Đơn đã được người bán xác nhận, hãy nhắn tin cho người bán nếu muốn huỷ');
    res.json({ order: orderOut(setStatus(o, 'cancelled', null)) });
  });
  app.post('/api/me/orders/:id(\\d+)/received', needUser, postLimiter, (req, res) => {
    const o = myOrder(req, res, 'buyer_id'); if (!o) return;
    if (o.status !== 'shipping') return fail(res, 400, 'Đơn hàng chưa ở trạng thái đang giao');
    res.json({ order: orderOut(setStatus(o, 'done', null)) });
  });
  app.post('/api/me/orders/:id(\\d+)/review', needUser, postLimiter, (req, res) => {
    const o = myOrder(req, res, 'buyer_id'); if (!o) return;
    if (o.status !== 'done') return fail(res, 400, 'Chỉ đánh giá được sau khi đã nhận hàng');
    if (db.prepare('SELECT 1 FROM product_reviews WHERE order_id = ?').get(o.id)) return fail(res, 400, 'Bạn đã đánh giá đơn hàng này');
    const rating = intIn(req.body.rating, 1, 5);
    if (!rating) return fail(res, 400, 'Hãy chọn số sao');
    db.prepare('INSERT INTO product_reviews (product_id, order_id, user_id, rating, body, variant, created_at) VALUES (?,?,?,?,?,?,?)')
      .run(o.product_id, o.id, req.user.id, rating, clean(req.body.body, 600), o.variant || '', now());
    res.json({ ok: true });
  });

  // ---------- seller centre ----------
  const ensureShop = (uid) => { if (!shopRow(uid)) db.prepare('INSERT INTO shops (user_id, created_at, updated_at) VALUES (?,?,?)').run(uid, now(), now()); };
  app.get('/api/me/shop', needUser, (req, res) => {
    const s = shopRow(req.user.id) || {};
    const info = shopInfo(req.user, null);
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const sum = (where, ...a) => db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS money FROM orders WHERE seller_id = ? AND ' + where).get(req.user.id, ...a);
    const counts = Object.fromEntries(db.prepare('SELECT status, COUNT(*) AS n FROM orders WHERE seller_id = ? GROUP BY status').all(req.user.id).map((x) => [x.status, x.n]));
    const rows = db.prepare(SELECT + " WHERE p.user_id = ? AND p.status <> 'deleted' ORDER BY p.id DESC").all(req.user.id);
    const linked = Object.fromEntries(db.prepare('SELECT product_id, COUNT(*) AS n FROM videos WHERE user_id = ? AND product_id IS NOT NULL GROUP BY product_id').all(req.user.id).map((x) => [x.product_id, x.n]));
    res.json({
      shop: { ...info, bank: s.bank || '', policies: json(s.policies, []) },
      stats: { counts, today: sum("created_at >= ? AND status <> 'cancelled'", t0.getTime()), revenue: sum("status = 'done'"), pending: sum("status IN ('new','confirmed','shipping')"), views: rows.reduce((a, r) => a + (r.views || 0), 0) },
      products: rows.map((r) => ({ ...product(r, true), videos: linked[r.id] || 0 })),
    });
  });
  app.put('/api/me/shop', needUser, postLimiter, (req, res) => {
    const b = req.body || {};
    const accent = /^#[0-9a-f]{6}$/i.test(b.accent || '') ? b.accent : '';
    const policies = (Array.isArray(b.policies) ? b.policies : []).map((x) => clean(x, 80)).filter(Boolean).slice(0, 6);
    ensureShop(req.user.id);
    db.prepare('UPDATE shops SET name=?, slogan=?, about=?, phone=?, zalo=?, address=?, bank=?, policies=?, accent=?, closed=?, updated_at=? WHERE user_id=?').run(
      clean(b.name, 60), clean(b.slogan, 120), clean(b.about, 2000), clean(b.phone, 20).replace(/[^\d+]/g, ''), clean(b.zalo, 20).replace(/[^\d+]/g, ''),
      clean(b.address, 200), clean(b.bank, 300), JSON.stringify(policies), accent, b.closed ? 1 : 0, now(), req.user.id);
    res.json({ ok: true });
  });
  app.post('/api/me/shop/image', needUser, postLimiter, imgUpload.single('file'), (req, res) => {
    const kind = req.query.kind === 'logo' ? 'logo' : 'banner';
    if (!req.file) return fail(res, 400, 'Chỉ nhận ảnh JPG/PNG/WebP (tối đa 8MB)');
    ensureShop(req.user.id);
    const old = shopRow(req.user.id)[kind];
    if (old) rmUpload(old.replace('/uploads/', ''));
    db.prepare('UPDATE shops SET ' + kind + ' = ?, updated_at = ? WHERE user_id = ?').run('/uploads/' + req.file.filename, now(), req.user.id);
    res.json({ ok: true, url: '/uploads/' + req.file.filename });
  });

  function readProduct(b) {
    const title = clean(b.title, 120);
    if (title.length < 3) return { error: 'Tên sản phẩm cần ít nhất 3 ký tự' };
    const price = intIn(b.price, 0, 2_000_000_000);
    if (price == null) return { error: 'Giá bán không hợp lệ' };
    const compare = intIn(b.comparePrice, 0, 2_000_000_000) || 0;
    const stock = String(b.stock ?? '').trim() === '' ? null : intIn(b.stock, 0, 1_000_000);
    if (String(b.stock ?? '').trim() !== '' && stock == null) return { error: 'Số lượng trong kho không hợp lệ' };
    const variants = [...new Set(String(b.variants || '').split(/[,\n]/).map((x) => clean(x, 60)).filter(Boolean))].slice(0, 20);
    return { title, price, compare, stock, variants, description: clean(b.description, 5000), category: clean(b.category, 40) };
  }
  const dropFiles = (files) => (files || []).forEach((f) => rmUpload(f.filename));
  app.post('/api/me/products', needUser, postLimiter, imgUpload.array('images', 9), (req, res) => {
    const d = readProduct(req.body);
    if (d.error) { dropFiles(req.files); return fail(res, 400, d.error); }
    if (!req.files || !req.files.length) return fail(res, 400, 'Hãy thêm ít nhất 1 ảnh sản phẩm');
    if (db.prepare("SELECT COUNT(*) AS n FROM products WHERE user_id = ? AND status <> 'deleted'").get(req.user.id).n >= 500) { dropFiles(req.files); return fail(res, 400, 'Gian hàng đã đạt tối đa 500 sản phẩm'); }
    ensureShop(req.user.id);
    const images = req.files.map((f) => '/uploads/' + f.filename);
    const r = db.prepare(`INSERT INTO products (user_id, title, price, compare_price, description, images, category, variants, stock, status, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(req.user.id, d.title, d.price, d.compare, d.description, JSON.stringify(images), d.category, JSON.stringify(d.variants), d.stock, req.body.hidden === '1' ? 'hidden' : 'active', now(), now());
    res.json({ ok: true, id: Number(r.lastInsertRowid) });
  });
  const ownProduct = (req, res) => {
    const p = db.prepare("SELECT * FROM products WHERE id = ? AND user_id = ? AND status <> 'deleted'").get(Number(req.params.id), req.user.id);
    if (!p) fail(res, 404, 'Không tìm thấy sản phẩm của bạn');
    return p;
  };
  // images: `order` lists the final order, existing urls kept as they are and "new:N" for the N-th uploaded file
  app.put('/api/me/products/:id(\\d+)', needUser, postLimiter, imgUpload.array('images', 9), (req, res) => {
    const p = ownProduct(req, res); if (!p) return dropFiles(req.files);
    const d = readProduct(req.body);
    if (d.error) { dropFiles(req.files); return fail(res, 400, d.error); }
    const old = json(p.images, []), files = req.files || [];
    const order = json(req.body.order, null) || [...old, ...files.map((_f, i) => 'new:' + i)];
    const images = [];
    for (const x of order) {
      const m = /^new:(\d+)$/.exec(String(x));
      if (m && files[+m[1]]) images.push('/uploads/' + files[+m[1]].filename);
      else if (old.includes(x)) images.push(x);
    }
    if (!images.length) { dropFiles(files); return fail(res, 400, 'Hãy giữ ít nhất 1 ảnh sản phẩm'); }
    const final = images.slice(0, 9);
    files.forEach((f) => { if (!final.includes('/uploads/' + f.filename)) rmUpload(f.filename); });
    db.prepare('UPDATE products SET title=?, price=?, compare_price=?, description=?, images=?, category=?, variants=?, stock=?, updated_at=? WHERE id=?')
      .run(d.title, d.price, d.compare, d.description, JSON.stringify(final), d.category, JSON.stringify(d.variants), d.stock, now(), p.id);
    // photos no longer used by the product (orders keep their own first-photo copy reference, so keep a photo an order points at)
    for (const u of old) if (!final.includes(u) && !db.prepare('SELECT 1 FROM orders WHERE image = ?').get(u)) rmUpload(u.replace('/uploads/', ''));
    res.json({ ok: true });
  });
  app.post('/api/me/products/:id(\\d+)/status', needUser, postLimiter, (req, res) => {
    const p = ownProduct(req, res); if (!p) return;
    const st = ['active', 'hidden', 'deleted'].includes(req.body.status) ? req.body.status : null;
    if (!st) return fail(res, 400, 'Trạng thái không hợp lệ');
    db.prepare('UPDATE products SET status = ?, updated_at = ? WHERE id = ?').run(st, now(), p.id);
    if (st === 'deleted') db.prepare('UPDATE videos SET product_id = NULL WHERE product_id = ?').run(p.id);
    res.json({ ok: true });
  });
  // short list for "pin a product to this video"
  app.get('/api/me/products-mini', needUser, (req, res) => {
    const rows = db.prepare("SELECT id, title, price, images, status, locked FROM products WHERE user_id = ? AND status <> 'deleted' ORDER BY id DESC").all(req.user.id);
    res.json({ products: rows.map((r) => ({ id: r.id, title: r.title, price: r.price, image: json(r.images, [])[0] || '', hidden: r.status !== 'active' || !!r.locked })) });
  });

  app.get('/api/me/sales', needUser, (req, res) => {
    const st = STATUS[req.query.status] ? req.query.status : '';
    const rows = db.prepare(`SELECT o.*, u.name AS buyer_name, u.avatar AS buyer_avatar FROM orders o JOIN users u ON u.id = o.buyer_id
      WHERE o.seller_id = ? AND (? = '' OR o.status = ?) ORDER BY o.id DESC LIMIT 300`).all(req.user.id, st, st);
    res.json({ orders: rows.map((o) => orderOut(o, { buyer: { id: o.buyer_id, name: o.buyer_name, avatar: o.buyer_avatar } })) });
  });
  app.post('/api/me/sales/:id(\\d+)/status', needUser, postLimiter, (req, res) => {
    const o = myOrder(req, res, 'seller_id'); if (!o) return;
    const st = String(req.body.status || '');
    if (!(NEXT[o.status] || []).includes(st)) return fail(res, 400, 'Không thể chuyển đơn từ "' + STATUS[o.status] + '" sang "' + (STATUS[st] || st) + '"');
    const note = req.body.note == null ? null : clean(req.body.note, 300);
    res.json({ order: orderOut(setStatus(o, st, note)) });
  });

  // ---------- admin ----------
  app.get('/api/admin/shop', needAdmin, (req, res) => {
    const q = clean(req.query.q, 60), page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const stats = {
      shops: db.prepare("SELECT COUNT(DISTINCT user_id) AS n FROM products WHERE status <> 'deleted'").get().n,
      products: db.prepare("SELECT COUNT(*) AS n FROM products WHERE status <> 'deleted'").get().n,
      orders: db.prepare('SELECT COUNT(*) AS n FROM orders').get().n,
      ordersToday: db.prepare('SELECT COUNT(*) AS n FROM orders WHERE created_at >= ?').get(t0.getTime()).n,
      revenue: db.prepare("SELECT COALESCE(SUM(total), 0) AS n FROM orders WHERE status = 'done'").get().n,
    };
    const where = "p.status <> 'deleted' AND (? = '' OR p.title LIKE ? OR u.email LIKE ?)";
    const total = db.prepare('SELECT COUNT(*) AS n FROM products p JOIN users u ON u.id = p.user_id WHERE ' + where).get(q, '%' + q + '%', '%' + q + '%').n;
    const rows = db.prepare(`SELECT p.*, u.email AS u_email, u.name AS u_name, (SELECT COUNT(*) FROM orders o WHERE o.product_id = p.id) AS orders
      FROM products p JOIN users u ON u.id = p.user_id WHERE ${where} ORDER BY p.id DESC LIMIT 30 OFFSET ?`).all(q, '%' + q + '%', '%' + q + '%', (page - 1) * 30);
    res.json({ stats, total, page, pages: Math.max(1, Math.ceil(total / 30)),
      products: rows.map((r) => ({ id: r.id, title: r.title, price: r.price, image: json(r.images, [])[0] || '', status: r.status, locked: !!r.locked, sold: r.sold, orders: r.orders, seller: { id: r.user_id, email: r.u_email, name: r.u_name } })) });
  });
  app.post('/api/admin/products/:id(\\d+)/lock', needAdmin, (req, res) => {
    db.prepare('UPDATE products SET locked = ?, updated_at = ? WHERE id = ?').run(req.body.locked ? 1 : 0, now(), Number(req.params.id));
    res.json({ ok: true });
  });

  return { cardsFor, ownProductId };
}

module.exports = { install };
