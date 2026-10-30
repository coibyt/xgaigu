// Gian hàng: tables, server wiring, products pinned to videos.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/db.js', [
  ["CREATE TABLE IF NOT EXISTS saves (", `CREATE TABLE IF NOT EXISTS shops (
  user_id INTEGER PRIMARY KEY,
  name TEXT DEFAULT '', slogan TEXT DEFAULT '', about TEXT DEFAULT '', banner TEXT DEFAULT '', logo TEXT DEFAULT '',
  phone TEXT DEFAULT '', zalo TEXT DEFAULT '', address TEXT DEFAULT '', bank TEXT DEFAULT '', policies TEXT DEFAULT '[]',
  accent TEXT DEFAULT '', closed INTEGER DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL, price INTEGER NOT NULL DEFAULT 0, compare_price INTEGER DEFAULT 0,
  description TEXT DEFAULT '', images TEXT DEFAULT '[]', category TEXT DEFAULT '', variants TEXT DEFAULT '[]',
  stock INTEGER, status TEXT DEFAULT 'active', locked INTEGER DEFAULT 0, sold INTEGER DEFAULT 0, views INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL, updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id, status);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE, product_id INTEGER NOT NULL, seller_id INTEGER NOT NULL, buyer_id INTEGER NOT NULL, video_id INTEGER,
  title TEXT, image TEXT, variant TEXT DEFAULT '', price INTEGER NOT NULL, qty INTEGER NOT NULL, total INTEGER NOT NULL,
  name TEXT, phone TEXT, address TEXT, note TEXT DEFAULT '', pay TEXT DEFAULT 'cod', status TEXT DEFAULT 'new', seller_note TEXT DEFAULT '',
  created_at INTEGER NOT NULL, updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE TABLE IF NOT EXISTS product_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL, order_id INTEGER UNIQUE, user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL, body TEXT DEFAULT '', variant TEXT DEFAULT '', created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE TABLE IF NOT EXISTS saves (`],
  ["  ['hearts', 'hearts INTEGER DEFAULT 0'],", "  ['hearts', 'hearts INTEGER DEFAULT 0'],\n  ['product_id', 'product_id INTEGER'],"],
]);

edit('server.js', [
  // the product pinned to each video
  ["  return rows.map((r) => {\n    let info = {}; try { info = r.info ? JSON.parse(r.info) : {}; } catch {}\n    return {",
   "  const cards = shop.cardsFor(rows.map((r) => r.product_id));\n  return rows.map((r) => {\n    let info = {}; try { info = r.info ? JSON.parse(r.info) : {}; } catch {}\n    return {\n      product: cards.get(r.product_id) || null,"],
  ["    info, views: r.views || 0, badge: r.badge || ''", "    info, productId: r.product_id || null, views: r.views || 0, badge: r.badge || ''"],
  // new video: optional product
  ["  const hidden = ['1', 'true'].includes(String(req.body.hidden)); // posted as a draft only the owner can see\n",
   "  const hidden = ['1', 'true'].includes(String(req.body.hidden)); // posted as a draft only the owner can see\n  const productId = shop.ownProductId(req.user.id, req.body.productId);\n  if (productId === false) { dropAll(); return fail(res, 400, 'Sản phẩm gắn kèm không thuộc gian hàng của bạn'); }\n"],
  ["  const newId = Number(r.lastInsertRowid);\n", "  const newId = Number(r.lastInsertRowid);\n  if (productId) db.prepare('UPDATE videos SET product_id = ? WHERE id = ?').run(productId, newId);\n"],
  // edit: owner can change the pinned product
  ["const saveVideoEdit = (req, res, id) => {\n  const area = readArea(req.body);\n  if (!area.region || !area.province) return fail(res, 400, 'Vui lòng chọn miền và tỉnh/thành');\n",
   "const saveVideoEdit = (req, res, id) => {\n  const area = readArea(req.body);\n  if (!area.region || !area.province) return fail(res, 400, 'Vui lòng chọn miền và tỉnh/thành');\n  if ('productId' in req.body) {\n    const owner = db.prepare('SELECT user_id FROM videos WHERE id = ?').get(id).user_id;\n    const pid = shop.ownProductId(owner, req.body.productId);\n    if (pid === false) return fail(res, 400, 'Sản phẩm gắn kèm không thuộc gian hàng của chủ video');\n    db.prepare('UPDATE videos SET product_id = ? WHERE id = ?').run(pid, id);\n  }\n"],
  // install the shop module next to the SEO one
  ["const seo = require('./src/seo').install(app,", "const shop = require('./src/shop').install(app, { db, fail, clean, now, needUser, needAdmin, postLimiter, rmUpload, pushUser, listVideos, UPLOAD_DIR, IMAGE_TYPES });\nconst seo = require('./src/seo').install(app,"],
  // any stylesheet gets the version stamp
  ["html = html.replace(/(\\/(?:js\\/[\\w.-]+\\.js|css\\/app\\.css))\"/g", "html = html.replace(/(\\/(?:js\\/[\\w.-]+\\.js|css\\/[\\w.-]+\\.css))\"/g"],
]);

edit('public/index.html', [
  ['<link rel="stylesheet" href="/css/app.css">', '<link rel="stylesheet" href="/css/app.css">\n<link rel="stylesheet" href="/css/shop.css">'],
  ['<script src="/js/app.js"></script>', '<script src="/js/app.js"></script>\n<script src="/js/shop.js"></script>'],
]);
console.log('patched');
