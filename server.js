const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

try { if (fs.existsSync(path.join(__dirname, '.env'))) process.loadEnvFile(path.join(__dirname, '.env')); } catch {}

const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { UPLOAD_DIR } = require('./src/paths');
const db = require('./src/db');

const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === 'production';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();

const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      mediaSrc: ["'self'", 'blob:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      frameSrc: ['https://www.youtube.com', 'https://www.youtube-nocookie.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: PROD ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
}));
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));

const apiLimiter = rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });
const postLimiter = rateLimit({ windowMs: 60_000, limit: 40, standardHeaders: true, legacyHeaders: false });
app.use('/api', apiLimiter);

// ---------- helpers ----------
const now = () => Date.now();
const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const fail = (res, code, msg) => res.status(code).json({ error: msg });
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function currentYear() { return new Date().getFullYear(); }

const num = (v) => { const n = typeof v === 'number' ? v : parseFloat(v); return Number.isFinite(n) ? n : null; };
function readPlace(b) {
  const lat = num(b.lat), lng = num(b.lng);
  const ok = lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  return { address: clean(b.address, 200), lat: ok ? Math.round(lat * 1000) / 1000 : null, lng: ok ? Math.round(lng * 1000) / 1000 : null };
}
function distanceKm(aLat, aLng, bLat, bLng) {
  const r = (d) => (d * Math.PI) / 180;
  const x = Math.sin(r(bLat - aLat) / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(x));
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id, name: u.name, age: currentYear() - u.birth_year, gender: u.gender,
    city: u.city, address: u.address || '', bio: u.bio, avatar: u.avatar, canCall: !!(u.show_phone && u.phone),
    role: u.role, createdAt: u.created_at,
  };
}
function selfUser(u) {
  return { ...publicUser(u), email: u.email, phone: u.phone, showPhone: !!u.show_phone, birthYear: u.birth_year,
    showNearby: u.show_nearby !== 0, hasLocation: u.lat != null };
}

function auth(req, _res, next) {
  const token = req.cookies.sid;
  if (token) {
    const row = db.prepare(
      'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?'
    ).get(token);
    if (row && !row.banned) req.user = row;
  }
  next();
}
app.use(auth);
const needUser = (req, res, next) => (req.user ? next() : fail(res, 401, 'Vui lòng đăng nhập'));
const needAdmin = (req, res, next) => (req.user && req.user.role === 'admin' ? next() : fail(res, 403, 'Không có quyền'));

function startSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)').run(token, userId, now());
  res.cookie('sid', token, {
    httpOnly: true, sameSite: 'lax', secure: PROD, maxAge: 30 * 24 * 3600 * 1000, path: '/',
  });
}

// ---------- uploads ----------
const VIDEO_TYPES = { 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov' };
const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = VIDEO_TYPES[file.mimetype] || IMAGE_TYPES[file.mimetype] || '';
      cb(null, crypto.randomBytes(16).toString('hex') + ext);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => cb(null, !!(VIDEO_TYPES[file.mimetype] || IMAGE_TYPES[file.mimetype])),
});
const rmUpload = (name) => { if (name) fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(name))).catch(() => {}); };

app.use('/uploads', express.static(UPLOAD_DIR, {
  maxAge: '7d', index: false, dotfiles: 'deny',
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));

// ---------- realtime (SSE) ----------
const userStreams = new Map(); // userId -> Set<res>
function sse(res) {
  res.set({
    'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive', 'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
}
const send = (res, event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
function pushUser(userId, event, data) {
  const set = userStreams.get(userId);
  if (set) for (const r of set) send(r, event, data);
}
setInterval(() => {
  for (const set of userStreams.values()) for (const r of set) r.write(': ping\n\n');
  for (const room of rooms.values()) for (const c of room.clients.values()) c.res.write(': ping\n\n');
}, 20_000).unref();

app.get('/api/events', needUser, (req, res) => {
  sse(res);
  const set = userStreams.get(req.user.id) || new Set();
  set.add(res); userStreams.set(req.user.id, set);
  send(res, 'hello', { ok: true });
  req.on('close', () => { set.delete(res); if (!set.size) userStreams.delete(req.user.id); });
});

// ---------- auth ----------
app.post('/api/register', authLimiter, wrap(async (req, res) => {
  const email = clean(req.body.email, 120).toLowerCase();
  const password = String(req.body.password || '');
  const name = clean(req.body.name, 40);
  const birthYear = parseInt(req.body.birthYear, 10);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(res, 400, 'Email không hợp lệ');
  if (password.length < 8) return fail(res, 400, 'Mật khẩu tối thiểu 8 ký tự');
  if (name.length < 2) return fail(res, 400, 'Vui lòng nhập tên hiển thị');
  if (!birthYear || currentYear() - birthYear < 18 || currentYear() - birthYear > 100)
    return fail(res, 400, 'Bạn phải đủ 18 tuổi trở lên để sử dụng website');
  if (!req.body.agree) return fail(res, 400, 'Bạn cần đồng ý với Điều khoản sử dụng');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return fail(res, 409, 'Email đã được đăng ký');
  const hash = await bcrypt.hash(password, 10);
  const role = ADMIN_EMAIL && email === ADMIN_EMAIL ? 'admin' : 'user';
  const gender = ['nam', 'nu', 'khac'].includes(req.body.gender) ? req.body.gender : '';
  const place = readPlace(req.body);
  const info = db.prepare(
    'INSERT INTO users (email, pass_hash, name, birth_year, gender, city, address, lat, lng, role, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).run(email, hash, name, birthYear, gender, clean(req.body.city, 60), place.address, place.lat, place.lng, role, now());
  startSession(res, Number(info.lastInsertRowid));
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.json({ user: selfUser(u) });
}));

app.post('/api/login', authLimiter, wrap(async (req, res) => {
  const email = clean(req.body.email, 120).toLowerCase();
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.pass_hash)))
    return fail(res, 401, 'Sai email hoặc mật khẩu');
  if (u.banned) return fail(res, 403, 'Tài khoản đã bị khóa');
  startSession(res, u.id);
  res.json({ user: selfUser(u) });
}));

app.post('/api/logout', (req, res) => {
  if (req.cookies.sid) db.prepare('DELETE FROM sessions WHERE token = ?').run(req.cookies.sid);
  res.clearCookie('sid', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => res.json({ user: req.user ? selfUser(req.user) : null }));

app.patch('/api/me', needUser, (req, res) => {
  const b = req.body;
  const phone = clean(b.phone, 20).replace(/[^\d+]/g, '');
  const gender = ['nam', 'nu', 'khac', ''].includes(b.gender) ? b.gender : req.user.gender;
  const place = readPlace(b);
  const keep = !place.address && place.lat === null; // no new place picked → keep the old one
  db.prepare('UPDATE users SET name=?, gender=?, city=?, bio=?, phone=?, show_phone=?, show_nearby=?, address=?, lat=?, lng=? WHERE id=?').run(
    clean(b.name, 40) || req.user.name, gender, clean(b.city, 60), clean(b.bio, 500),
    phone, b.showPhone && phone ? 1 : 0, b.showNearby === false ? 0 : 1,
    keep ? req.user.address : place.address, keep ? req.user.lat : place.lat, keep ? req.user.lng : place.lng, req.user.id
  );
  res.json({ user: selfUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

app.post('/api/me/avatar', needUser, postLimiter, upload.single('file'), (req, res) => {
  if (!req.file || !IMAGE_TYPES[req.file.mimetype]) { if (req.file) rmUpload(req.file.filename); return fail(res, 400, 'Chỉ nhận ảnh JPG/PNG/WebP'); }
  if (req.file.size > 5 * 1024 * 1024) { rmUpload(req.file.filename); return fail(res, 400, 'Ảnh tối đa 5MB'); }
  rmUpload(req.user.avatar && req.user.avatar.replace('/uploads/', ''));
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run('/uploads/' + req.file.filename, req.user.id);
  res.json({ user: selfUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

// ---------- people ----------
app.get('/api/people', (req, res) => {
  const city = clean(req.query.city, 60);
  const gender = clean(req.query.gender, 10);
  const rows = db.prepare(
    `SELECT * FROM users WHERE banned = 0 AND (? = '' OR city LIKE ?) AND (? = '' OR gender = ?)
     ORDER BY (avatar != '') DESC, created_at DESC LIMIT 60`
  ).all(city, `%${city}%`, gender, gender);
  res.json({ people: rows.map(publicUser) });
});

// Nearby: sorted by distance. Exact coordinates and distances finer than 1 km are never returned.
app.get('/api/nearby', (req, res) => {
  const lat = num(req.query.lat), lng = num(req.query.lng);
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return fail(res, 400, 'Thiếu vị trí');
  const radius = Math.min(Math.max(num(req.query.radius) || 25, 1), 500);
  const rows = db.prepare('SELECT * FROM users WHERE banned = 0 AND show_nearby = 1 AND lat IS NOT NULL AND lng IS NOT NULL').all();
  const people = rows
    .map((u) => ({ u, d: distanceKm(lat, lng, u.lat, u.lng) }))
    .filter((x) => x.d <= radius && (!req.user || x.u.id !== req.user.id))
    .sort((a, b) => a.d - b.d).slice(0, 60)
    .map((x) => ({ ...publicUser(x.u), distanceKm: Math.max(1, Math.round(x.d)) }));
  res.json({ people });
});

// Address autocomplete (OpenStreetMap Nominatim; ≤1 req/s, cached, identifying User-Agent as per its policy).
const geoCache = new Map();
let geoChain = Promise.resolve();
const geoLimiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false });
app.get('/api/geocode', geoLimiter, (req, res) => {
  const q = clean(req.query.q, 120);
  if (q.length < 3) return res.json({ suggestions: [] });
  const key = q.toLowerCase();
  if (geoCache.has(key)) return res.json({ suggestions: geoCache.get(key) });
  geoChain = geoChain.then(async () => {
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=vn&accept-language=vi&q=' + encodeURIComponent(q);
      const r = await fetch(url, { headers: { 'User-Agent': 'xgaigu.com (contact: ' + (ADMIN_EMAIL || 'admin@xgaigu.com') + ')' }, signal: AbortSignal.timeout(8000) });
      const data = r.ok ? await r.json() : [];
      const out = data.map((x) => {
        const a = x.address || {};
        return { displayName: x.display_name, lat: parseFloat(x.lat), lng: parseFloat(x.lon),
          city: a.city || a.town || a.village || a.county || a.state || '' };
      });
      if (geoCache.size > 500) geoCache.delete(geoCache.keys().next().value);
      geoCache.set(key, out);
      res.json({ suggestions: out });
    } catch { res.json({ suggestions: [] }); }
    await new Promise((ok) => setTimeout(ok, 1100));
  });
});

app.get('/api/users/:id', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ? AND banned = 0').get(req.params.id);
  if (!u) return fail(res, 404, 'Không tìm thấy người dùng');
  res.json({ user: publicUser(u), videos: listVideos(req.user, { userId: u.id, limit: 30 }) });
});

app.get('/api/users/:id/phone', needUser, (req, res) => {
  const u = db.prepare('SELECT phone, show_phone FROM users WHERE id = ? AND banned = 0').get(req.params.id);
  if (!u || !u.show_phone || !u.phone) return fail(res, 404, 'Người này chưa mở số điện thoại');
  res.json({ phone: u.phone });
});

// ---------- videos ----------
function listVideos(viewer, { userId, before, limit = 12 } = {}) {
  const rows = db.prepare(
    `SELECT v.*, u.name AS u_name, u.avatar AS u_avatar, u.city AS u_city, u.birth_year AS u_by,
       u.show_phone AS u_sp, u.phone AS u_phone,
       (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id) AS likes,
       (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) AS comments,
       (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id AND l.user_id = ?) AS liked
     FROM videos v JOIN users u ON u.id = v.user_id
     WHERE v.hidden = 0 AND u.banned = 0 AND (? IS NULL OR v.user_id = ?) AND (? IS NULL OR v.id < ?)
     ORDER BY v.id DESC LIMIT ?`
  ).all(viewer ? viewer.id : 0, userId ?? null, userId ?? null, before ?? null, before ?? null, limit);
  return rows.map((r) => ({
    id: r.id, caption: r.caption, file: r.file, url: r.url, thumb: r.thumb || '', createdAt: r.created_at,
    likes: r.likes, comments: r.comments, liked: !!r.liked,
    user: { id: r.user_id, name: r.u_name, avatar: r.u_avatar, city: r.u_city,
      age: currentYear() - r.u_by, canCall: !!(r.u_sp && r.u_phone) },
  }));
}

app.get('/api/videos', (req, res) => {
  const before = parseInt(req.query.before, 10) || null;
  res.json({ videos: listVideos(req.user, { before, limit: 12 }) });
});

app.post('/api/videos', needUser, postLimiter, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'thumb', maxCount: 1 }]), (req, res) => {
  const caption = clean(req.body.caption, 300);
  let url = clean(req.body.url, 500);
  const file = req.files && req.files.file && req.files.file[0];
  let thumb = req.files && req.files.thumb && req.files.thumb[0];
  if (thumb && (!IMAGE_TYPES[thumb.mimetype] || thumb.size > 5 * 1024 * 1024)) { rmUpload(thumb.filename); thumb = null; }
  const dropAll = () => { if (file) rmUpload(file.filename); if (thumb) rmUpload(thumb.filename); };
  if (file && !VIDEO_TYPES[file.mimetype]) { dropAll(); return fail(res, 400, 'Chỉ nhận video MP4/WebM/MOV'); }
  if (!file && !/^https:\/\/\S+$/.test(url)) { dropAll(); return fail(res, 400, 'Hãy chọn file video hoặc dán liên kết https'); }
  if (file) url = '';
  db.prepare('INSERT INTO videos (user_id, caption, file, url, thumb, created_at) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, caption, file ? '/uploads/' + file.filename : '', url, thumb ? '/uploads/' + thumb.filename : '', now());
  res.json({ ok: true });
});

app.delete('/api/videos/:id', needUser, (req, res) => {
  const v = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  if (!v) return fail(res, 404, 'Không tìm thấy video');
  if (v.user_id !== req.user.id && req.user.role !== 'admin') return fail(res, 403, 'Không có quyền');
  db.prepare('DELETE FROM videos WHERE id = ?').run(v.id);
  rmUpload(v.file && v.file.replace('/uploads/', ''));
  rmUpload(v.thumb && v.thumb.replace('/uploads/', ''));
  res.json({ ok: true });
});

app.post('/api/videos/:id/like', needUser, (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT 1 FROM videos WHERE id = ?').get(id)) return fail(res, 404, 'Không tìm thấy video');
  const had = db.prepare('DELETE FROM likes WHERE video_id = ? AND user_id = ?').run(id, req.user.id).changes;
  if (!had) db.prepare('INSERT INTO likes (video_id, user_id) VALUES (?,?)').run(id, req.user.id);
  const n = db.prepare('SELECT COUNT(*) AS n FROM likes WHERE video_id = ?').get(id).n;
  res.json({ liked: !had, likes: n });
});

app.get('/api/videos/:id/comments', (req, res) => {
  const rows = db.prepare(
    `SELECT c.id, c.body, c.created_at, u.id AS uid, u.name, u.avatar FROM comments c
     JOIN users u ON u.id = c.user_id WHERE c.video_id = ? AND u.banned = 0 ORDER BY c.id DESC LIMIT 100`
  ).all(req.params.id);
  res.json({ comments: rows.map((r) => ({ id: r.id, body: r.body, createdAt: r.created_at,
    user: { id: r.uid, name: r.name, avatar: r.avatar } })) });
});

app.post('/api/videos/:id/comments', needUser, postLimiter, (req, res) => {
  const body = clean(req.body.body, 300);
  if (!body) return fail(res, 400, 'Bình luận trống');
  if (!db.prepare('SELECT 1 FROM videos WHERE id = ?').get(req.params.id)) return fail(res, 404, 'Không tìm thấy video');
  db.prepare('INSERT INTO comments (video_id, user_id, body, created_at) VALUES (?,?,?,?)')
    .run(req.params.id, req.user.id, body, now());
  res.json({ ok: true });
});

// ---------- chat ----------
function mapMsg(m) {
  return { id: m.id, from: m.from_id, to: m.to_id, body: m.body, kind: m.kind, createdAt: m.created_at };
}

app.get('/api/conversations', needUser, (req, res) => {
  const me = req.user.id;
  const rows = db.prepare(
    `SELECT m.*, CASE WHEN m.from_id = ? THEN m.to_id ELSE m.from_id END AS other_id
     FROM messages m WHERE m.id IN (
       SELECT MAX(id) FROM messages WHERE from_id = ? OR to_id = ?
       GROUP BY CASE WHEN from_id = ? THEN to_id ELSE from_id END)
     ORDER BY m.id DESC`
  ).all(me, me, me, me);
  const out = rows.map((m) => {
    const o = db.prepare('SELECT * FROM users WHERE id = ?').get(m.other_id);
    const unread = db.prepare('SELECT COUNT(*) AS n FROM messages WHERE from_id = ? AND to_id = ? AND read = 0').get(m.other_id, me).n;
    return { user: publicUser(o), last: mapMsg(m), unread };
  }).filter((c) => c.user);
  res.json({ conversations: out });
});

app.get('/api/messages/:userId', needUser, (req, res) => {
  const other = Number(req.params.userId); const me = req.user.id;
  const o = db.prepare('SELECT * FROM users WHERE id = ? AND banned = 0').get(other);
  if (!o) return fail(res, 404, 'Không tìm thấy người dùng');
  db.prepare('UPDATE messages SET read = 1 WHERE from_id = ? AND to_id = ?').run(other, me);
  const rows = db.prepare(
    `SELECT * FROM messages WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)
     ORDER BY id DESC LIMIT 100`
  ).all(me, other, other, me).reverse();
  res.json({ user: publicUser(o), messages: rows.map(mapMsg) });
});

function sendMessage(fromId, toId, body, kind = 'text') {
  const info = db.prepare('INSERT INTO messages (from_id, to_id, body, kind, created_at) VALUES (?,?,?,?,?)')
    .run(fromId, toId, body, kind, now());
  const m = mapMsg(db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid));
  pushUser(toId, 'message', m);
  pushUser(fromId, 'message', m);
  return m;
}

app.post('/api/messages/:userId', needUser, postLimiter, (req, res) => {
  const to = Number(req.params.userId);
  const body = clean(req.body.body, 1000);
  if (!body) return fail(res, 400, 'Tin nhắn trống');
  if (to === req.user.id) return fail(res, 400, 'Không thể nhắn cho chính mình');
  if (!db.prepare('SELECT 1 FROM users WHERE id = ? AND banned = 0').get(to)) return fail(res, 404, 'Không tìm thấy người dùng');
  res.json({ message: sendMessage(req.user.id, to, body) });
});

// ---------- bookings (hẹn gặp) ----------
const mapBooking = (b) => ({ id: b.id, videoId: b.video_id, from: b.from_id, to: b.to_id, when: b.when_at,
  place: b.place, note: b.note, status: b.status, createdAt: b.created_at });

app.post('/api/bookings', needUser, postLimiter, (req, res) => {
  const to = Number(req.body.to);
  const when = Number(req.body.when);
  const place = clean(req.body.place, 120);
  if (to === req.user.id) return fail(res, 400, 'Không thể tự hẹn chính mình');
  if (!db.prepare('SELECT 1 FROM users WHERE id = ? AND banned = 0').get(to)) return fail(res, 404, 'Không tìm thấy người dùng');
  if (!when || when < now() + 30 * 60_000) return fail(res, 400, 'Hãy chọn thời gian trong tương lai');
  if (place.length < 3) return fail(res, 400, 'Vui lòng nhập địa điểm (nên là nơi công cộng)');
  const info = db.prepare(
    'INSERT INTO bookings (video_id, from_id, to_id, when_at, place, note, created_at) VALUES (?,?,?,?,?,?,?)'
  ).run(req.body.videoId ? Number(req.body.videoId) : null, req.user.id, to, when, place, clean(req.body.note, 300), now());
  const b = mapBooking(db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid));
  sendMessage(req.user.id, to, JSON.stringify({ bookingId: b.id }), 'booking');
  pushUser(to, 'booking', b);
  res.json({ booking: b });
});

app.get('/api/bookings', needUser, (req, res) => {
  const me = req.user.id;
  const rows = db.prepare('SELECT * FROM bookings WHERE from_id = ? OR to_id = ? ORDER BY when_at DESC LIMIT 100').all(me, me);
  res.json({ bookings: rows.map((b) => {
    const o = db.prepare('SELECT * FROM users WHERE id = ?').get(b.from_id === me ? b.to_id : b.from_id);
    return { ...mapBooking(b), other: publicUser(o), mine: b.from_id === me };
  }) });
});

app.post('/api/bookings/:id/:action', needUser, (req, res) => {
  const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  const me = req.user.id;
  if (!b || (b.from_id !== me && b.to_id !== me)) return fail(res, 404, 'Không tìm thấy lịch hẹn');
  const a = req.params.action;
  let status = null;
  if (b.status === 'pending' && b.to_id === me && a === 'accept') status = 'accepted';
  else if (b.status === 'pending' && b.to_id === me && a === 'decline') status = 'declined';
  else if (['pending', 'accepted'].includes(b.status) && a === 'cancel') status = 'cancelled';
  if (!status) return fail(res, 400, 'Thao tác không hợp lệ');
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, b.id);
  const upd = mapBooking(db.prepare('SELECT * FROM bookings WHERE id = ?').get(b.id));
  const other = b.from_id === me ? b.to_id : b.from_id;
  pushUser(other, 'booking', upd);
  res.json({ booking: upd });
});

// ---------- livestream ----------
const rooms = new Map(); // streamId -> { clients: Map<clientId,{res,userId,host}>, chat: [] }
function roomOf(id) {
  if (!rooms.has(id)) rooms.set(id, { clients: new Map(), chat: [] });
  return rooms.get(id);
}
const viewerCount = (room) => [...room.clients.values()].filter((c) => !c.host).length;
function broadcast(room, event, data) { for (const c of room.clients.values()) send(c.res, event, data); }

const mapStream = (s, u) => ({
  id: s.id, title: s.title, kind: s.kind, source: s.kind === 'webrtc' ? '' : s.source,
  live: !!s.live, startedAt: s.started_at,
  viewers: rooms.has(s.id) ? viewerCount(rooms.get(s.id)) : 0,
  host: publicUser(u),
});

app.get('/api/streams', (_req, res) => {
  const rows = db.prepare(
    `SELECT s.*, u.id AS uid FROM streams s JOIN users u ON u.id = s.user_id
     WHERE s.live = 1 AND u.banned = 0 ORDER BY s.id DESC LIMIT 50`
  ).all();
  res.json({ streams: rows.map((s) => mapStream(s, db.prepare('SELECT * FROM users WHERE id = ?').get(s.user_id))) });
});

app.post('/api/streams', needUser, postLimiter, (req, res) => {
  const title = clean(req.body.title, 80);
  const kind = ['webrtc', 'hls', 'youtube'].includes(req.body.kind) ? req.body.kind : 'webrtc';
  let source = clean(req.body.source, 500);
  if (title.length < 3) return fail(res, 400, 'Vui lòng nhập tiêu đề buổi live');
  if (kind !== 'webrtc') {
    if (!/^https:\/\/\S+$/.test(source)) return fail(res, 400, 'Liên kết phải bắt đầu bằng https://');
    if (kind === 'youtube') {
      const m = source.match(/(?:youtu\.be\/|v=|\/live\/|\/embed\/)([\w-]{11})/);
      if (!m) return fail(res, 400, 'Liên kết YouTube không hợp lệ');
      source = m[1];
    }
  } else source = '';
  db.prepare('UPDATE streams SET live = 0, ended_at = ? WHERE user_id = ? AND live = 1').run(now(), req.user.id);
  const info = db.prepare('INSERT INTO streams (user_id, title, kind, source, started_at) VALUES (?,?,?,?,?)')
    .run(req.user.id, title, kind, source, now());
  res.json({ id: Number(info.lastInsertRowid) });
});

app.get('/api/streams/:id', (req, res) => {
  const s = db.prepare('SELECT * FROM streams WHERE id = ?').get(req.params.id);
  if (!s) return fail(res, 404, 'Không tìm thấy buổi live');
  res.json({ stream: mapStream(s, db.prepare('SELECT * FROM users WHERE id = ?').get(s.user_id)) });
});

app.post('/api/streams/:id/end', needUser, (req, res) => {
  const s = db.prepare('SELECT * FROM streams WHERE id = ?').get(req.params.id);
  if (!s || (s.user_id !== req.user.id && req.user.role !== 'admin')) return fail(res, 403, 'Không có quyền');
  db.prepare('UPDATE streams SET live = 0, ended_at = ? WHERE id = ?').run(now(), s.id);
  const room = rooms.get(s.id);
  if (room) { broadcast(room, 'ended', {}); }
  res.json({ ok: true });
});

app.get('/api/streams/:id/events', (req, res) => {
  const sid = Number(req.params.id);
  const s = db.prepare('SELECT * FROM streams WHERE id = ? AND live = 1').get(sid);
  if (!s) return fail(res, 404, 'Buổi live đã kết thúc');
  const host = !!req.user && req.user.id === s.user_id && req.query.host === '1';
  const room = roomOf(sid);
  const clientId = crypto.randomBytes(6).toString('hex');
  sse(res);
  room.clients.set(clientId, { res, userId: req.user ? req.user.id : 0, host });
  send(res, 'hello', { clientId, viewers: viewerCount(room), chat: room.chat, host });
  broadcast(room, 'viewers', { viewers: viewerCount(room) });
  if (!host) {
    for (const [id, c] of room.clients) if (c.host) send(c.res, 'viewer-join', { clientId });
  }
  req.on('close', () => {
    room.clients.delete(clientId);
    broadcast(room, 'viewers', { viewers: viewerCount(room) });
    if (!host) for (const c of room.clients.values()) if (c.host) send(c.res, 'viewer-leave', { clientId });
    if (!room.clients.size) rooms.delete(sid);
  });
});

app.post('/api/streams/:id/chat', needUser, postLimiter, (req, res) => {
  const room = rooms.get(Number(req.params.id));
  const body = clean(req.body.body, 200);
  if (!room || !body) return fail(res, 400, 'Không gửi được');
  const msg = { id: crypto.randomBytes(4).toString('hex'), user: { id: req.user.id, name: req.user.name, avatar: req.user.avatar }, body, at: now() };
  room.chat.push(msg); if (room.chat.length > 80) room.chat.shift();
  broadcast(room, 'chat', msg);
  res.json({ ok: true });
});

app.post('/api/streams/:id/heart', (req, res) => {
  const room = rooms.get(Number(req.params.id));
  if (room) broadcast(room, 'heart', {});
  res.json({ ok: true });
});

// WebRTC signaling relay (host <-> viewers)
app.post('/api/streams/:id/signal', (req, res) => {
  const room = rooms.get(Number(req.params.id));
  const { from, to, data } = req.body || {};
  if (!room || !room.clients.has(from) || !room.clients.has(to) || !data) return fail(res, 400, 'Tín hiệu không hợp lệ');
  const a = room.clients.get(from); const b = room.clients.get(to);
  if (!a.host && !b.host) return fail(res, 403, 'Không hợp lệ');
  send(b.res, 'signal', { from, data });
  res.json({ ok: true });
});

// ---------- reports & admin ----------
app.post('/api/reports', needUser, postLimiter, (req, res) => {
  const type = ['video', 'user', 'stream'].includes(req.body.type) ? req.body.type : null;
  const reason = clean(req.body.reason, 300);
  if (!type || !req.body.id || reason.length < 3) return fail(res, 400, 'Thiếu thông tin báo cáo');
  db.prepare('INSERT INTO reports (reporter_id, target_type, target_id, reason, created_at) VALUES (?,?,?,?,?)')
    .run(req.user.id, type, Number(req.body.id), reason, now());
  res.json({ ok: true });
});

app.get('/api/admin/reports', needAdmin, (_req, res) => {
  const rows = db.prepare(
    `SELECT r.*, u.name AS reporter FROM reports r JOIN users u ON u.id = r.reporter_id
     WHERE r.resolved = 0 ORDER BY r.id DESC LIMIT 100`
  ).all();
  res.json({ reports: rows });
});
app.post('/api/admin/reports/:id/resolve', needAdmin, (req, res) => {
  db.prepare('UPDATE reports SET resolved = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
app.post('/api/admin/videos/:id/hide', needAdmin, (req, res) => {
  db.prepare('UPDATE videos SET hidden = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
app.post('/api/admin/users/:id/ban', needAdmin, (req, res) => {
  if (Number(req.params.id) === req.user.id) return fail(res, 400, 'Không thể khóa chính mình');
  db.prepare('UPDATE users SET banned = 1 WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- static & errors ----------
app.get('/healthz', (_req, res) => res.send('ok'));
app.use('/api', (_req, res) => fail(res, 404, 'Không tìm thấy'));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: PROD ? '1h' : 0, extensions: ['html'] }));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) return fail(res, 400, err.code === 'LIMIT_FILE_SIZE' ? 'File quá lớn (tối đa 100MB)' : 'Tải file thất bại');
  console.error(err);
  fail(res, 500, 'Lỗi máy chủ');
});

app.listen(PORT, () => console.log(`xgaigu listening on :${PORT}`));
