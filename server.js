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
const { spawn } = require('child_process');
let FFMPEG = null; try { FFMPEG = require('ffmpeg-static'); } catch {} // optional: used to burn the logo into downloads
const { UPLOAD_DIR } = require('./src/paths');
const db = require('./src/db');

const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === 'production';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
// the account that uses ADMIN_EMAIL is always an admin, even if it was registered before the variable was set
if (ADMIN_EMAIL) db.prepare("UPDATE users SET role = 'admin' WHERE lower(email) = ? AND role <> 'admin'").run(ADMIN_EMAIL);

const app = express();
app.set('trust proxy', 1);

// ---- domain change: old domains (LEGACY_HOSTS) forward everything to SITE_URL, installed apps follow ----
const hostOf = (v) => { try { return new URL(/^https?:/.test(v) ? v : 'https://' + v).host.toLowerCase(); } catch { return ''; } };
const LEGACY = (process.env.LEGACY_HOSTS || '').split(',').map((x) => hostOf(x.trim())).filter(Boolean);
const isLegacy = (req) => LEGACY.includes((req.get('host') || '').toLowerCase());
app.use((req, res, next) => {
  if (!process.env.SITE_URL || !isLegacy(req) || !['GET', 'HEAD'].includes(req.method)) return next();
  if (/^\/(api|uploads|icons)\/|^\/(sw\.js|manifest\.webmanifest)$/.test(req.path)) return next(); // keep serving what old apps/links need
  res.redirect(302, process.env.SITE_URL.replace(/\/$/, '') + req.originalUrl);
});
app.get('/api/site', (req, res) => res.set('Cache-Control', 'no-store').json({ url: (process.env.SITE_URL || '').replace(/\/$/, ''), moved: !!process.env.SITE_URL && isLegacy(req) }));
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
app.use(express.json({ limit: '400kb' }));

const apiLimiter = rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });
const postLimiter = rateLimit({ windowMs: 60_000, limit: 40, standardHeaders: true, legacyHeaders: false });
app.use('/api', apiLimiter);

// ---------- helpers ----------
const now = () => Date.now();
// Recent activity (view = 1 point, like or comment = 3 points) decides which videos are "hot". Only the last 3 days are kept.
const DAY_MS = 86400_000, HOT_MIN = Number(process.env.HOT_MIN) || 12;
const act = (videoId, kind) => { try { db.prepare('INSERT INTO video_activity (video_id, kind, at) VALUES (?,?,?)').run(videoId, kind, Date.now()); } catch {} };
setInterval(() => { try { db.prepare('DELETE FROM video_activity WHERE at < ?').run(Date.now() - 3 * DAY_MS); } catch {} }, 3600_000).unref();
// badge: admin choice first ("hot" / "new" / "off" = none), otherwise automatic
const badgeOf = (setting, heat, createdAt) => (setting === 'off' ? '' : setting === 'hot' || setting === 'new' ? setting : heat >= HOT_MIN ? 'hot' : Date.now() - createdAt < DAY_MS ? 'new' : '');
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
    city: u.city, address: u.address || '', bio: u.bio, nickname: u.nickname || '', height: u.height || null,
    weight: u.weight || null, origin: u.origin || '', availability: u.availability || '', boundaries: u.boundaries || '',
    occupation: u.occupation || '', interests: u.interests ? u.interests.split('|') : [], lookingFor: u.looking_for || '', allowCalls: u.allow_calls !== 0, avatar: u.avatar, canCall: !!(u.show_phone && u.phone),
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

const COOKIE = { httpOnly: true, sameSite: 'lax', secure: PROD, maxAge: 30 * 24 * 3600 * 1000, path: '/' };
// Session tokens of every account signed in on this browser (httpOnly cookie, max 5) so the user can switch without retyping passwords.
const readAccts = (req) => String(req.cookies.accts || '').split(',').filter((t) => /^[a-f0-9]{64}$/.test(t)).slice(0, 5);
function startSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)').run(token, userId, now());
  const keep = [];
  for (const t of [...new Set([req.cookies.sid, ...readAccts(req)])].filter((x) => /^[a-f0-9]{64}$/.test(x || ''))) {
    const row = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(t);
    if (!row) continue;
    if (row.user_id === userId) db.prepare('DELETE FROM sessions WHERE token = ?').run(t); // replaced by the new session
    else keep.push(t);
  }
  res.cookie('accts', [token, ...keep].slice(0, 5).join(','), COOKIE);
  res.cookie('sid', token, COOKIE);
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
const authMail = require('./src/auth-mail').install(app, { db, fail, clean, now, needAdmin, startSession });

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
  const needVerify = role !== 'admin' && authMail.configured() && authMail.requireVerification(); // admin can switch this on/off
  const info = db.prepare(
    'INSERT INTO users (email, pass_hash, name, birth_year, gender, city, address, lat, lng, role, email_verified, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(email, hash, name, birthYear, gender, clean(req.body.city, 60), place.address, place.lat, place.lng, role, needVerify ? 0 : 1, now());
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  if (needVerify) { // no session until the email is confirmed
    try { await authMail.sendVerification(u, req); } catch (e) { console.error('verification mail failed:', e.message); }
    return res.json({ needVerify: true, email });
  }
  startSession(req, res, Number(info.lastInsertRowid));
  authMail.sendWelcome(u, req);
  res.json({ user: selfUser(u) });
}));

app.post('/api/login', authLimiter, wrap(async (req, res) => {
  const email = clean(req.body.email, 120).toLowerCase();
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.pass_hash)))
    return fail(res, 401, 'Sai email hoặc mật khẩu');
  if (u.banned) return fail(res, 403, 'Tài khoản đã bị khóa');
  if (u.email_verified === 0) return res.status(403).json({ error: 'Bạn cần xác nhận email trước khi đăng nhập. Hãy kiểm tra hộp thư (cả mục Spam).', code: 'unverified' });
  startSession(req, res, u.id);
  res.json({ user: selfUser(u) });
}));

app.post('/api/logout', (req, res) => {
  const cur = req.cookies.sid;
  if (cur) db.prepare('DELETE FROM sessions WHERE token = ?').run(cur);
  let rest = readAccts(req).filter((t) => t !== cur);
  if (req.body && req.body.all) { for (const t of rest) db.prepare('DELETE FROM sessions WHERE token = ?').run(t); rest = []; }
  if (rest.length) res.cookie('accts', rest.join(','), COOKIE); else res.clearCookie('accts', { path: '/' });
  res.clearCookie('sid', { path: '/' });
  res.json({ ok: true });
});

// Accounts signed in on this browser.
app.get('/api/accounts', (req, res) => {
  const out = [];
  for (const t of readAccts(req)) {
    const u = db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND u.banned = 0').get(t);
    if (u) out.push({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, current: t === req.cookies.sid });
  }
  if (req.user && !out.some((x) => x.current)) out.unshift({ id: req.user.id, name: req.user.name, email: req.user.email, avatar: req.user.avatar, current: true });
  res.json({ accounts: out });
});

app.post('/api/switch', (req, res) => {
  const id = Number(req.body.userId);
  for (const t of readAccts(req)) {
    const u = db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND u.banned = 0').get(t);
    if (u && u.id === id) { res.cookie('sid', t, COOKIE); return res.json({ user: selfUser(u) }); }
  }
  fail(res, 404, 'Tài khoản này chưa đăng nhập trên thiết bị. Hãy đăng nhập lại.');
});

app.post('/api/me/password', authLimiter, needUser, wrap(async (req, res) => {
  const cur = String(req.body.current || ''), next = String(req.body.next || '');
  if (next.length < 8) return fail(res, 400, 'Mật khẩu mới tối thiểu 8 ký tự');
  if (!(await bcrypt.compare(cur, req.user.pass_hash))) return fail(res, 403, 'Mật khẩu hiện tại không đúng');
  if (cur === next) return fail(res, 400, 'Mật khẩu mới phải khác mật khẩu cũ');
  db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').run(await bcrypt.hash(next, 10), req.user.id);
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(req.user.id, req.cookies.sid); // sign out other devices
  res.json({ ok: true });
}));

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
  if (typeof b.allowCalls === 'boolean') db.prepare('UPDATE users SET allow_calls = ? WHERE id = ?').run(b.allowCalls ? 1 : 0, req.user.id);
  const intIn = (v, lo, hi) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
  // interests arrive as a comma/newline separated string or an array; stored '|' separated, max 10 tags
  const rawInterests = Array.isArray(b.interests) ? b.interests : String(b.interests || '').split(/[,\n]/);
  const interests = [...new Set(rawInterests.map((t) => clean(t, 24).replace(/\|/g, '')).filter(Boolean))].slice(0, 10).join('|');
  db.prepare('UPDATE users SET nickname=?, height=?, weight=?, origin=?, availability=?, boundaries=?, occupation=?, interests=?, looking_for=? WHERE id=?').run(
    clean(b.nickname, 40), intIn(b.height, 120, 230), intIn(b.weight, 30, 200), clean(b.origin, 60),
    clean(b.availability, 120), clean(b.boundaries, 300), clean(b.occupation, 60), interests, clean(b.lookingFor, 300), req.user.id
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

// Videos near a point, nearest first. A video uses the address picked when it was posted, falling back to the
// uploader's profile location. Only a distance rounded to whole km is returned, never coordinates.
app.get('/api/nearby-videos', (req, res) => {
  const lat = num(req.query.lat), lng = num(req.query.lng);
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return fail(res, 400, 'Thiếu vị trí');
  const radius = Math.min(Math.max(num(req.query.radius) || 25, 1), 500);
  const rows = db.prepare(
    `SELECT v.id, COALESCE(v.lat, u.lat) AS lat, COALESCE(v.lng, u.lng) AS lng FROM videos v JOIN users u ON u.id = v.user_id
     WHERE v.hidden = 0 AND u.banned = 0 AND u.show_nearby = 1 AND COALESCE(v.lat, u.lat) IS NOT NULL AND COALESCE(v.lng, u.lng) IS NOT NULL`
  ).all();
  const near = rows.map((r) => ({ id: r.id, d: distanceKm(lat, lng, r.lat, r.lng) })).filter((x) => x.d <= radius).sort((a, b) => a.d - b.d).slice(0, 48);
  if (!near.length) return res.json({ videos: [] });
  const byId = new Map(listVideos(req.user, { ids: near.map((x) => x.id), limit: 48 }).map((v) => [v.id, v]));
  res.json({ videos: near.map((x) => byId.has(x.id) ? { ...byId.get(x.id), distanceKm: Math.max(1, Math.round(x.d)) } : null).filter(Boolean) });
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
  const stats = db.prepare(
    `SELECT COUNT(*) AS videos, COALESCE(SUM(v.views), 0) AS views, COALESCE(SUM((SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id)), 0) AS likes
     FROM videos v WHERE v.user_id = ? AND v.hidden = 0`).get(u.id);
  if (!(req.user && req.user.role === 'admin')) delete stats.views;
  stats.followers = db.prepare('SELECT COUNT(*) AS n FROM follows WHERE followee_id = ?').get(u.id).n;
  const following = !!(req.user && db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?').get(req.user.id, u.id));
  res.json({ user: publicUser(u), videos: listVideos(req.user, { userId: u.id, limit: 60 }), stats, following });
});

app.get('/api/users/:id(\\d+)/videos', (req, res) => {
  const u = db.prepare('SELECT id FROM users WHERE id = ? AND banned = 0').get(req.params.id);
  if (!u) return fail(res, 404, 'Không tìm thấy người dùng');
  const before = parseInt(req.query.before, 10) || null;
  res.json({ videos: listVideos(req.user, { userId: u.id, before, limit: 60 }) });
});

app.get('/api/users/:id/phone', needUser, (req, res) => {
  const u = db.prepare('SELECT phone, show_phone FROM users WHERE id = ? AND banned = 0').get(req.params.id);
  if (!u || !u.show_phone || !u.phone) return fail(res, 404, 'Người này chưa mở số điện thoại');
  res.json({ phone: u.phone });
});

// ---------- videos ----------
// Region → province → district list (served to the client as /data/vn-geo.json); used to validate what uploaders pick.
const GEO = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'data', 'vn-geo.json'), 'utf8'));
function readArea(b) {
  const region = Object.keys(GEO).includes(b.region) ? b.region : '';
  const prov = region ? GEO[region].find((p) => p[0] === b.province) : null;
  const province = prov ? prov[0] : '';
  const district = prov && prov[1].includes(b.district) ? b.district : '';
  return { region, province, district };
}

// Details an uploader can attach to a video (all optional; phone is stored separately and only released to signed-in viewers).
function readInfo(b) {
  const int = (v, lo, hi) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
  const by = int(b.birthYear, currentYear() - 100, currentYear() - 18);
  const rawInterests = Array.isArray(b.interests) ? b.interests : String(b.interests || '').split(/[,\n]/);
  return {
    birthYear: by, height: int(b.height, 120, 230), weight: int(b.weight, 30, 200),
    origin: clean(b.origin, 60), occupation: clean(b.occupation, 60), address: clean(b.address, 200),
    workTime: clean(b.workTime, 120), boundaries: clean(b.boundaries, 300),
    interests: [...new Set(rawInterests.map((t) => clean(t, 24).replace(/\|/g, '')).filter(Boolean))].slice(0, 10),
  };
}

function listVideos(viewer, { userId, before, limit = 12, id, ids, region, province, district } = {}) {
  const rows = db.prepare(
    `SELECT v.*, u.name AS u_name, u.avatar AS u_avatar, u.city AS u_city, u.birth_year AS u_by,
       u.show_phone AS u_sp, u.phone AS u_phone,
       (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id) AS likes,
       (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) AS comments,
       (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id AND l.user_id = ?) AS liked,
       (SELECT COALESCE(SUM(CASE a.kind WHEN 'view' THEN 1 ELSE 3 END), 0) FROM video_activity a WHERE a.video_id = v.id AND a.at > ?) AS heat
     FROM videos v JOIN users u ON u.id = v.user_id
     WHERE (v.hidden = 0 OR (v.hidden_by = 'owner' AND v.locked = 0 AND v.user_id = ?)) AND u.banned = 0 AND (? IS NULL OR v.user_id = ?) AND (? IS NULL OR v.id < ?)
       AND (? IS NULL OR instr(?, ',' || v.id || ',') > 0) AND (? IS NULL OR v.id = ?) AND (? IS NULL OR v.region = ?) AND (? IS NULL OR v.province = ?) AND (? IS NULL OR v.district = ?)
     ORDER BY v.id DESC LIMIT ?`
  ).all(viewer ? viewer.id : 0, Date.now() - DAY_MS, viewer && ((userId != null && userId === viewer.id) || id != null) ? viewer.id : 0, userId ?? null, userId ?? null, before ?? null, before ?? null,
    ids ? ',' + ids.join(',') + ',' : null, ids ? ',' + ids.join(',') + ',' : null, id ?? null, id ?? null,
    region || null, region || null, province || null, province || null, district || null, district || null, limit);
  return rows.map((r) => {
    let info = {}; try { info = r.info ? JSON.parse(r.info) : {}; } catch {}
    return {
      id: r.id, caption: r.caption, file: r.file, url: r.url, thumb: r.thumb || '', createdAt: r.created_at,
      region: r.region || '', province: r.province || '', district: r.district || '', info,
      hasPhone: !!(r.v_phone || (r.u_sp && r.u_phone)),
      // the real view count is for admins only; everybody else sees no view numbers at all
      ...(viewer && viewer.role === 'admin' ? { views: r.views || 0, heat: r.heat } : {}),
      verified: !!r.verified, selfHidden: r.hidden === 1, badge: badgeOf(r.badge, r.heat, r.created_at), likes: r.likes, comments: r.comments, liked: !!r.liked,
      // On a video only the uploader's chosen nickname is shown, not the account name.
      user: { id: r.user_id, name: r.nickname || r.u_name, avatar: r.u_avatar, city: r.u_city,
        age: currentYear() - (Number(info.birthYear) || r.u_by), canCall: !!(r.u_sp && r.u_phone) },
    };
  });
}

app.get('/api/videos', (req, res) => {
  const before = parseInt(req.query.before, 10) || null;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 48);
  const area = readArea(req.query);
  res.json({ videos: listVideos(req.user, { before, limit, ...area }) });
});

// Home feed: random order, but provinces the visitor shows interest in (searches, likes, comments) are much more likely to come up.
// Weighted random sampling (Efraimidis-Spirakis): key = -ln(U) / weight, smallest keys win. Nothing is ever excluded, only made rarer.
app.get('/api/feed', (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 24);
  const seen = new Set(String(req.query.seen || '').split(',').map(Number).filter(Boolean).slice(0, 600));
  const pk = (p) => norm(p).replace(/^(tp\.? ?|thanh pho |tinh )/, '').trim(); // "TP. Hồ Chí Minh" and "Hồ Chí Minh" are the same place
  const score = new Map(); // province key -> interest
  for (const part of String(req.query.pref || '').split('|').slice(0, 20)) { // sent by the browser: "Hà Nội~3.5|Đà Nẵng~1"
    const [p, n] = part.split('~'); const v = Number(n);
    if (p && v > 0 && v < 1000) score.set(pk(p.slice(0, 60)), (score.get(pk(p.slice(0, 60))) || 0) + v);
  }
  if (req.user) { // members: what they liked / commented on, on any device
    const rows = db.prepare(
      `SELECT v.province AS p, COUNT(*) AS n FROM (SELECT video_id FROM likes WHERE user_id = ? ORDER BY rowid DESC LIMIT 60) x JOIN videos v ON v.id = x.video_id
       WHERE v.province IS NOT NULL AND v.province <> '' GROUP BY v.province`).all(req.user.id);
    for (const r of rows) score.set(pk(r.p), (score.get(pk(r.p)) || 0) + r.n * 2);
    const rc = db.prepare(
      `SELECT v.province AS p, COUNT(*) AS n FROM (SELECT video_id FROM comments WHERE user_id = ? ORDER BY rowid DESC LIMIT 60) x JOIN videos v ON v.id = x.video_id
       WHERE v.province IS NOT NULL AND v.province <> '' GROUP BY v.province`).all(req.user.id);
    for (const r of rc) score.set(pk(r.p), (score.get(pk(r.p)) || 0) + r.n * 2);
  }
  const top = Math.max(0, ...score.values());
  const pool = db.prepare(
    `SELECT v.id, v.province, v.badge, v.created_at FROM videos v JOIN users u ON u.id = v.user_id WHERE v.hidden = 0 AND u.banned = 0 ORDER BY v.id DESC LIMIT 1500`).all();
  const heatOf = new Map(db.prepare("SELECT video_id, SUM(CASE kind WHEN 'view' THEN 1 ELSE 3 END) AS h FROM video_activity WHERE at > ? GROUP BY video_id").all(Date.now() - DAY_MS).map((x) => [x.video_id, x.h]));
  const picked = pool.filter((r) => !seen.has(r.id)).map((r) => {
    const interest = top ? (score.get(pk(r.province)) || 0) / top : 0; // 0..1
    const b = badgeOf(r.badge, heatOf.get(r.id) || 0, r.created_at);
    const w = (1 + 7 * interest) * (b === 'new' ? 8 : b === 'hot' ? 5 : 1); // favourite regions up to 8x; new videos 8x and hot videos 5x so they surface first
    return { id: r.id, key: -Math.log(1 - Math.random()) / w };
  }).sort((a, b) => a.key - b.key).slice(0, limit).map((r) => r.id);
  if (!picked.length) return res.json({ videos: [] });
  const byId = new Map(listVideos(req.user, { ids: picked, limit: picked.length }).map((v) => [v.id, v]));
  res.json({ videos: picked.map((id) => byId.get(id)).filter(Boolean) });
});

app.get('/api/videos/:id(\\d+)', (req, res) => {
  const v = listVideos(req.user, { id: Number(req.params.id), limit: 1 })[0];
  if (!v) return fail(res, 404, 'Không tìm thấy video');
  res.json({ video: v });
});

// ---------- search by nickname or address (accent-insensitive: "ha noi" finds "Hà Nội") ----------
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
function searchIndex() {
  const rows = db.prepare(
    `SELECT v.id, v.nickname, u.name AS uname, v.province, v.district, v.info FROM videos v JOIN users u ON u.id = v.user_id
     WHERE v.hidden = 0 AND u.banned = 0 ORDER BY v.id DESC LIMIT 5000`
  ).all();
  return rows.map((r) => {
    let addr = ''; try { addr = (JSON.parse(r.info || '{}').address) || ''; } catch {}
    const nick = r.nickname || r.uname; // only the nickname shown on the video is searchable, never the account name behind it
    const place = [r.district, r.province].filter(Boolean).join(', ');
    return { id: r.id, nick, nickN: norm(nick), place, addr, placeN: norm([r.district, r.province, addr].join(' ')) };
  });
}

app.get('/api/search', (req, res) => {
  const q = norm(String(req.query.q || '').slice(0, 80));
  if (q.length < 2) return res.json({ videos: [] });
  const tokens = q.split(' ').slice(0, 5);
  const hits = searchIndex().filter((x) => tokens.every((t) => x.nickN.includes(t) || x.placeN.includes(t)))
    .sort((a, b) => (b.nickN.includes(q) ? 1 : 0) - (a.nickN.includes(q) ? 1 : 0) || b.id - a.id).slice(0, 48);
  if (!hits.length) return res.json({ videos: [] });
  const byId = new Map(listVideos(req.user, { ids: hits.map((x) => x.id), limit: 48 }).map((v) => [v.id, v]));
  res.json({ videos: hits.map((x) => byId.get(x.id)).filter(Boolean) });
});

app.get('/api/suggest', (req, res) => {
  const q = norm(String(req.query.q || '').slice(0, 80));
  if (!q) return res.json({ suggestions: [] });
  const idx = searchIndex(), nicks = new Map(), places = new Map();
  for (const x of idx) {
    if (nicks.size < 6 && x.nickN.includes(q) && !nicks.has(x.nickN)) nicks.set(x.nickN, x.nick);
    for (const label of [x.place, x.addr]) if (label && places.size < 6 && norm(label).includes(q) && !places.has(norm(label))) places.set(norm(label), label);
  }
  res.json({ suggestions: [...[...nicks.values()].slice(0, 5).map((text) => ({ type: 'nick', text })), ...[...places.values()].slice(0, 5).map((text) => ({ type: 'place', text }))] });
});

// How many videos each region / province / district has (powers the "Khu vực" browser).
app.get('/api/areas', (_req, res) => {
  const rows = db.prepare(
    `SELECT v.region, v.province, v.district, COUNT(*) AS n FROM videos v JOIN users u ON u.id = v.user_id
     WHERE v.hidden = 0 AND u.banned = 0 AND v.region != '' GROUP BY v.region, v.province, v.district`
  ).all();
  res.json({ areas: rows });
});

app.get('/api/videos/:id(\\d+)/phone', needUser, (req, res) => {
  const r = db.prepare(
    `SELECT v.v_phone, u.phone, u.show_phone FROM videos v JOIN users u ON u.id = v.user_id
     WHERE v.id = ? AND v.hidden = 0 AND u.banned = 0`
  ).get(req.params.id);
  const phone = r && (r.v_phone || (r.show_phone ? r.phone : ''));
  if (!phone) return fail(res, 404, 'Người này chưa mở số điện thoại');
  res.json({ phone });
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
  const area = readArea(req.body);
  if (!area.region || !area.province) { dropAll(); return fail(res, 400, 'Vui lòng chọn khu vực (miền và tỉnh/thành) của video'); }
  if (file) url = '';
  const info = readInfo(req.body);
  const phone = clean(req.body.phone, 20).replace(/[^\d+]/g, '');
  const nickname = clean(req.body.nickname, 40);
  const place = readPlace(req.body);
  db.prepare('INSERT INTO videos (user_id, caption, file, url, thumb, region, province, district, info, v_phone, nickname, lat, lng, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(req.user.id, caption, file ? '/uploads/' + file.filename : '', url, thumb ? '/uploads/' + thumb.filename : '',
      area.region, area.province, area.district, JSON.stringify(info), phone, nickname, place.lat, place.lng, now());
  res.json({ ok: true });
});

app.delete('/api/videos/:id', needUser, (req, res) => {
  const v = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id);
  if (!v) return fail(res, 404, 'Không tìm thấy video');
  if (req.user.role !== 'admin') return fail(res, 403, 'Chỉ quản trị viên mới được xoá video. Bạn có thể ẩn video để chỉ mình bạn thấy.');
  db.prepare('DELETE FROM videos WHERE id = ?').run(v.id);
  rmUpload(v.file && v.file.replace('/uploads/', ''));
  rmUpload(v.thumb && v.thumb.replace('/uploads/', ''));
  try { for (const f of fs.readdirSync(path.join(UPLOAD_DIR, 'wm'))) if (f.startsWith(v.id + '-')) fs.rmSync(path.join(UPLOAD_DIR, 'wm', f), { force: true }); } catch {}
  res.json({ ok: true });
});

// A view = watched for a few seconds. One per viewer (member id, or hashed IP+browser for guests) per video per 30 minutes;
// the uploader's own views are not counted.
const viewSeen = new Map();
app.post('/api/videos/:id(\\d+)/view', (req, res) => {
  const v = db.prepare('SELECT id, user_id FROM videos WHERE id = ? AND hidden = 0').get(req.params.id);
  if (!v) return fail(res, 404, 'Không tìm thấy video');
  if (!req.user || req.user.id !== v.user_id) {
    const who = req.user ? 'u' + req.user.id : 'i' + crypto.createHash('sha1').update(req.ip + '|' + (req.get('user-agent') || '')).digest('hex').slice(0, 12);
    const k = v.id + '|' + who, t = Date.now();
    if (!(viewSeen.get(k) > t - 30 * 60_000)) {
      viewSeen.set(k, t);
      db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?').run(v.id); act(v.id, 'view');
      if (viewSeen.size > 50_000) for (const [kk, tt] of viewSeen) if (tt < t - 30 * 60_000) viewSeen.delete(kk);
    }
  }
  res.json({ ok: true });
});

app.post('/api/videos/:id/like', needUser, (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT 1 FROM videos WHERE id = ?').get(id)) return fail(res, 404, 'Không tìm thấy video');
  const had = db.prepare('DELETE FROM likes WHERE video_id = ? AND user_id = ?').run(id, req.user.id).changes;
  if (!had) { db.prepare('INSERT INTO likes (video_id, user_id) VALUES (?,?)').run(id, req.user.id); act(id, 'like'); }
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
  act(Number(req.params.id), 'comment');
  db.prepare('INSERT INTO comments (video_id, user_id, body, created_at) VALUES (?,?,?,?)')
    .run(req.params.id, req.user.id, body, now());
  res.json({ ok: true });
});

// ---------- download with logo + nickname burned in (like TikTok) ----------
// The browser draws the watermark (any language/emoji) as a small PNG and posts it; ffmpeg overlays it bottom-left and
// returns an MP4. Results are cached per video+watermark. Needs the ffmpeg-static package; otherwise 501 and the browser
// falls back to recording the watermarked video itself.
const dlLimiter = rateLimit({ windowMs: 60_000, limit: 8, standardHeaders: true, legacyHeaders: false });
let dlRunning = 0;
const PNG_OK_CHUNKS = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'sRGB', 'pHYs', 'cHRM', 'sBIT']);
function validPng(b) { // returns { w, h } when it is a plain PNG within the size limits, else null (only image chunks allowed: no text/ICC payloads)
  if (b.length < 60 || b.length > 300_000 || !b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return null;
  let o = 8, first = true, dim = null;
  while (o + 12 <= b.length) {
    const len = b.readUInt32BE(o), type = b.toString('latin1', o + 4, o + 8);
    if (!PNG_OK_CHUNKS.has(type) || o + 12 + len > b.length) return null;
    if (first) { if (type !== 'IHDR' || len !== 13 || b.readUInt32BE(o + 8) > 1400 || b.readUInt32BE(o + 12) > 700) return null; dim = { w: b.readUInt32BE(o + 8), h: b.readUInt32BE(o + 12) }; first = false; }
    o += 12 + len;
    if (type === 'IEND') return o === b.length && dim && dim.w > 0 && dim.h > 0 ? dim : null;
  }
  return null;
}
const slug = (t) => String(t || 'video').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'video';

app.post('/api/videos/:id(\\d+)/download', dlLimiter, wrap(async (req, res) => {
  const v = db.prepare('SELECT v.id, v.file, v.nickname, u.name FROM videos v JOIN users u ON u.id = v.user_id WHERE v.id = ? AND v.hidden = 0 AND u.banned = 0').get(req.params.id);
  if (!v || !v.file) return fail(res, 404, 'Video này không thể tải xuống');
  if (!FFMPEG || !fs.existsSync(FFMPEG)) return fail(res, 501, 'Máy chủ chưa hỗ trợ ghép logo');
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body.wm || ''));
  const png = m && Buffer.from(m[1], 'base64');
  const dim = png && validPng(png);
  if (!dim) return fail(res, 400, 'Ảnh logo không hợp lệ');
  const key = crypto.createHash('sha1').update(png).digest('hex').slice(0, 16);
  const dir = path.join(UPLOAD_DIR, 'wm'); fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, v.id + '-' + key + '.mp4');
  if (!fs.existsSync(out)) {
    if (dlRunning >= 2) return fail(res, 503, 'Máy chủ đang bận, vui lòng thử lại sau ít phút');
    dlRunning++;
    const tmpPng = path.join(dir, 'tmp-' + crypto.randomBytes(6).toString('hex') + '.png'), tmpOut = out + '.part.mp4';
    try {
      fs.writeFileSync(tmpPng, png);
      const args = ['-y', '-nostdin', '-hide_banner', '-loglevel', 'error', '-i', path.join(UPLOAD_DIR, path.basename(v.file)), '-i', tmpPng,
        '-filter_complex', `[1:v][0:v]scale2ref=w='main_w*0.42':h='main_w*0.42*${dim.h}/${dim.w}'[wm][bg];[bg][wm]overlay=x='main_w*0.04':y='main_h*0.86-overlay_h',scale='trunc(iw/2)*2':'trunc(ih/2)*2'[v]`,
        '-map', '[v]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', tmpOut];
      await new Promise((resolve, reject) => {
        const p = spawn(FFMPEG, args, { stdio: ['ignore', 'ignore', 'pipe'] });
        let err = ''; p.stderr.on('data', (d) => { err = (err + d).slice(-500); });
        const timer = setTimeout(() => { p.kill('SIGKILL'); reject(new Error('ffmpeg timeout')); }, 180_000);
        p.on('error', (e) => { clearTimeout(timer); reject(e); });
        p.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error('ffmpeg ' + code + ' ' + err)); });
      });
      fs.renameSync(tmpOut, out);
    } catch (e) {
      console.error('download watermark failed:', e.message);
      fs.rm(tmpOut, { force: true }, () => {});
      return fail(res, 500, 'Không ghép được logo vào video');
    } finally { dlRunning--; fs.rm(tmpPng, { force: true }, () => {}); }
  }
  res.download(out, 'xgaigu-' + slug(v.nickname || v.name) + '-' + v.id + '.mp4');
}));

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

// ---------- 1-to-1 video calls (WebRTC; this server only relays signaling over the SSE channel) ----------
const callLimiter = rateLimit({ windowMs: 60_000, limit: 240, standardHeaders: true, legacyHeaders: false });
const inviteLog = new Map(); // "from>to" -> timestamps, to stop ring spam
const CALL_TYPES = new Set(['invite', 'accept', 'decline', 'busy', 'cancel', 'end', 'sdp', 'ice']);

app.get('/api/rtc-config', needUser, (_req, res) => {
  const iceServers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  // Optional TURN relay (needed when both people are behind strict NATs / mobile carriers).
  if (process.env.TURN_URL) iceServers.push({ urls: process.env.TURN_URL.split(','), username: process.env.TURN_USER || '', credential: process.env.TURN_PASS || '' });
  res.json({ iceServers });
});

app.post('/api/calls/signal', callLimiter, needUser, (req, res) => {
  const { type, callId, data } = req.body || {};
  const to = Number(req.body && req.body.to);
  if (!CALL_TYPES.has(type) || !/^[a-f0-9]{8,32}$/.test(String(callId || '')) || !Number.isInteger(to) || to === req.user.id) return fail(res, 400, 'Yêu cầu không hợp lệ');
  if (data !== undefined && JSON.stringify(data).length > 20000) return fail(res, 400, 'Dữ liệu quá lớn');
  const target = db.prepare('SELECT * FROM users WHERE id = ? AND banned = 0').get(to);
  if (!target) return fail(res, 404, 'Không tìm thấy người dùng');
  if (type === 'invite') {
    if (target.allow_calls === 0) return fail(res, 403, 'Người này đang tắt nhận cuộc gọi video');
    if (!userStreams.has(to)) return fail(res, 409, 'Người này hiện không trực tuyến');
    const k = req.user.id + '>' + to, nowT = now(), recent = (inviteLog.get(k) || []).filter((t) => nowT - t < 60_000);
    if (recent.length >= 3) return fail(res, 429, 'Bạn gọi quá nhiều lần, vui lòng thử lại sau ít phút');
    recent.push(nowT); inviteLog.set(k, recent);
  }
  if (type === 'cancel' && data && data.missed) sendMessage(req.user.id, to, '📞 Cuộc gọi video nhỡ');
  pushUser(to, 'call', { type, callId, from: { id: req.user.id, name: req.user.name, avatar: req.user.avatar }, data: data ?? null });
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

// ---------- app (PWA) statistics ----------
// click = pressed "Tải ứng dụng", install = browser confirmed installation, open = app launched from the home screen
app.post('/api/app-event', postLimiter, (req, res) => {
  const kind = ['click', 'install', 'open'].includes(req.body.kind) ? req.body.kind : null;
  const did = String(req.body.did || '').replace(/[^\w-]/g, '').slice(0, 40);
  if (!kind || did.length < 8) return fail(res, 400, 'Sai dữ liệu');
  const ua = String(req.get('user-agent') || '');
  const device = /iphone|ipad|ipod/i.test(ua) ? 'ios' : /android/i.test(ua) ? 'android' : /windows|macintosh|linux|cros/i.test(ua) ? 'desktop' : 'other';
  const recent = now() - (kind === 'open' ? 6 : kind === 'click' ? 1 : 24 * 365) * 3600_000; // install once per device; open once per 6h; click once per hour
  if (db.prepare('SELECT 1 FROM app_events WHERE did = ? AND kind = ? AND created_at > ?').get(did, kind, recent)) return res.json({ ok: true });
  db.prepare('INSERT INTO app_events (did, kind, device, created_at) VALUES (?,?,?,?)').run(did, kind, device, now());
  res.json({ ok: true });
});
app.get('/api/admin/app-stats', needAdmin, (_req, res) => {
  const DAY = 86400_000, t = now();
  const count = (kind, since, distinct) => db.prepare(`SELECT COUNT(${distinct ? 'DISTINCT did' : '*'}) AS n FROM app_events WHERE kind = ? AND created_at > ?`).get(kind, since).n;
  const block = (kind) => ({ total: count(kind, 0), today: count(kind, t - DAY), week: count(kind, t - 7 * DAY), month: count(kind, t - 30 * DAY), devices: count(kind, 0, true) });
  const byDevice = db.prepare("SELECT device, kind, COUNT(DISTINCT did) AS n FROM app_events GROUP BY device, kind").all();
  const daily = db.prepare(
    `SELECT date(created_at / 1000, 'unixepoch', '+7 hours') AS day, kind, COUNT(*) AS n FROM app_events
     WHERE created_at > ? GROUP BY day, kind ORDER BY day DESC`).all(t - 14 * DAY);
  res.json({ click: block('click'), install: block('install'), open: block('open'), byDevice, daily });
});
// ---------- visitor analytics ----------
// Every open page pings now and then with an anonymous device id; "online now" = pinged in the last ~70 s.
const vnDay = (t = now()) => new Date(t + 7 * 3600_000).toISOString().slice(0, 10); // Vietnam time (UTC+7)
const pingLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false });
app.post('/api/ping', pingLimiter, (req, res) => {
  const did = String(req.body.did || '').replace(/[^\w-]/g, '').slice(0, 40);
  if (did.length < 8) return res.json({ ok: true });
  const t = now();
  db.prepare(
    `INSERT INTO presence (did, day, first_seen, last_seen, hits) VALUES (?,?,?,?,?)
     ON CONFLICT(did, day) DO UPDATE SET last_seen = excluded.last_seen, hits = hits + excluded.hits`
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
  const order = { videos: 'videos DESC, u.id DESC', followers: 'followers DESC, u.id DESC', likes: 'likes DESC, u.id DESC', oldest: 'u.id ASC' }[req.query.sort] || 'u.id DESC';
  const where = "(lower(u.email) LIKE ? OR lower(u.name) LIKE ?)";
  const total = db.prepare('SELECT COUNT(*) AS n FROM users u WHERE ' + where).get(q, q).n;
  const users = db.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.banned, u.created_at,
       (SELECT COUNT(*) FROM videos v WHERE v.user_id = u.id AND v.hidden = 0) AS videos,
       (SELECT COUNT(*) FROM likes l JOIN videos v ON v.id = l.video_id WHERE v.user_id = u.id) AS likes,
       (SELECT COUNT(*) FROM follows f WHERE f.followee_id = u.id) AS followers
     FROM users u WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`).all(q, q, size, page * size);
  res.json({ users, total, page, size });
});

// ---------- follow ----------
app.post('/api/users/:id(\\d+)/follow', needUser, postLimiter, (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return fail(res, 400, 'Không thể tự theo dõi mình');
  if (!db.prepare('SELECT 1 FROM users WHERE id = ? AND banned = 0').get(id)) return fail(res, 404, 'Không tìm thấy người dùng');
  const had = db.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').run(req.user.id, id).changes;
  if (!had) db.prepare('INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?,?,?)').run(req.user.id, id, now());
  res.json({ following: !had, followers: db.prepare('SELECT COUNT(*) AS n FROM follows WHERE followee_id = ?').get(id).n });
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
// Video moderation: status is "visible", "hidden" (admin hid it, can be shown again) or "banned" (cấm xuất bản, with a reason).
const adminVideoRow = (id) => {
  const r = db.prepare(
    `SELECT v.*, u.email AS u_email, u.name AS u_name,
       (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id) AS likes, (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) AS comments
     FROM videos v JOIN users u ON u.id = v.user_id WHERE v.id = ?`).get(id);
  if (!r) return null;
  let info = {}; try { info = JSON.parse(r.info || '{}'); } catch {}
  return { id: r.id, caption: r.caption, nickname: r.nickname, phone: r.v_phone, file: r.file, url: r.url, thumb: r.thumb, region: r.region, province: r.province, district: r.district,
    info, views: r.views || 0, badge: r.badge || '', verified: !!r.verified, likes: r.likes, comments: r.comments, created_at: r.created_at, status: r.locked ? 'banned' : r.hidden ? (r.hidden_by === 'owner' ? 'self' : 'hidden') : 'visible', note: r.mod_note || '',
    owner: { id: r.user_id, email: r.u_email, name: r.u_name } };
};
// "Đã xác minh": only admins can grant or remove it (members have no endpoint that touches this column).
app.post('/api/admin/videos/:id(\\d+)/verified', needAdmin, (req, res) => {
  if (!db.prepare('SELECT 1 FROM videos WHERE id = ?').get(req.params.id)) return fail(res, 404, 'Không tìm thấy video');
  db.prepare('UPDATE videos SET verified = ? WHERE id = ?').run(req.body.verified ? 1 : 0, req.params.id);
  res.json({ ok: true, video: adminVideoRow(req.params.id) });
});
app.get('/api/admin/videos', needAdmin, (req, res) => {
  const q = '%' + String(req.query.q || '').toLowerCase().replace(/[%_]/g, '').slice(0, 60) + '%';
  const st = { visible: 'v.hidden = 0 AND v.locked = 0', hidden: "v.hidden = 1 AND v.locked = 0 AND v.hidden_by <> 'owner'", banned: 'v.locked = 1' }[req.query.status] || '1 = 1';
  const page = Math.max(parseInt(req.query.page, 10) || 0, 0), size = 20;
  const where = `${st} AND (lower(v.caption) LIKE ? OR lower(v.nickname) LIKE ? OR lower(u.email) LIKE ? OR CAST(v.id AS TEXT) = ?)`;
  const idq = String(req.query.q || '').trim();
  const total = db.prepare(`SELECT COUNT(*) AS n FROM videos v JOIN users u ON u.id = v.user_id WHERE ${where}`).get(q, q, q, idq).n;
  const ids = db.prepare(`SELECT v.id FROM videos v JOIN users u ON u.id = v.user_id WHERE ${where} ORDER BY v.id DESC LIMIT ? OFFSET ?`).all(q, q, q, idq, size, page * size);
  res.json({ videos: ids.map((x) => adminVideoRow(x.id)), total, page, size });
});
app.get('/api/admin/videos/:id(\\d+)', needAdmin, (req, res) => {
  const v = adminVideoRow(req.params.id);
  if (!v) return fail(res, 404, 'Không tìm thấy video');
  res.json({ video: v });
});
app.post('/api/admin/videos/:id(\\d+)/status', needAdmin, (req, res) => {
  const status = req.body.status;
  if (!['visible', 'hidden', 'banned'].includes(status)) return fail(res, 400, 'Trạng thái không hợp lệ');
  if (!db.prepare('SELECT 1 FROM videos WHERE id = ?').get(req.params.id)) return fail(res, 404, 'Không tìm thấy video');
  db.prepare("UPDATE videos SET hidden = ?, locked = ?, hidden_by = ?, mod_note = ? WHERE id = ?")
    .run(status === 'visible' ? 0 : 1, status === 'banned' ? 1 : 0, status === 'visible' ? '' : 'admin', status === 'visible' ? '' : clean(req.body.note, 300), req.params.id);
  res.json({ ok: true, video: adminVideoRow(req.params.id) });
});
app.post('/api/admin/videos/:id(\\d+)/badge', needAdmin, (req, res) => {
  const badge = ['', 'hot', 'new', 'off'].includes(req.body.badge) ? req.body.badge : null;
  if (badge === null) return fail(res, 400, 'Huy hiệu không hợp lệ');
  if (!db.prepare('SELECT 1 FROM videos WHERE id = ?').get(req.params.id)) return fail(res, 404, 'Không tìm thấy video');
  db.prepare('UPDATE videos SET badge = ? WHERE id = ?').run(badge, req.params.id);
  res.json({ ok: true, video: adminVideoRow(req.params.id) });
});
const saveVideoEdit = (req, res, id) => {
  const area = readArea(req.body);
  if (!area.region || !area.province) return fail(res, 400, 'Vui lòng chọn miền và tỉnh/thành');
  db.prepare('UPDATE videos SET caption = ?, nickname = ?, v_phone = ?, region = ?, province = ?, district = ?, info = ? WHERE id = ?')
    .run(clean(req.body.caption, 300), clean(req.body.nickname, 40), clean(req.body.phone, 20).replace(/[^\d+]/g, ''), area.region, area.province, area.district, JSON.stringify(readInfo(req.body)), id);
  res.json({ ok: true, video: adminVideoRow(id) });
};
app.put('/api/admin/videos/:id(\\d+)', needAdmin, (req, res) => {
  if (!db.prepare('SELECT 1 FROM videos WHERE id = ?').get(req.params.id)) return fail(res, 404, 'Không tìm thấy video');
  saveVideoEdit(req, res, Number(req.params.id));
});

// ---------- a member's own videos: edit, hide / show (never delete) ----------
const ownVideo = (req, res) => {
  const v = db.prepare('SELECT id, user_id, hidden, hidden_by, locked FROM videos WHERE id = ?').get(req.params.id);
  if (!v || v.user_id !== req.user.id) { fail(res, 404, 'Không tìm thấy video của bạn'); return null; }
  return v;
};
app.get('/api/videos/:id(\\d+)/edit', needUser, (req, res) => {
  const v = ownVideo(req, res); if (!v) return;
  const row = adminVideoRow(v.id); delete row.owner; delete row.views; delete row.heat; delete row.note;
  res.json({ video: { ...row, lockedByAdmin: !!v.locked, hiddenByAdmin: v.hidden === 1 && v.hidden_by !== 'owner' } });
});
app.put('/api/videos/:id(\\d+)', needUser, postLimiter, (req, res) => {
  const v = ownVideo(req, res); if (!v) return;
  if (v.locked) return fail(res, 403, 'Video này đã bị cấm xuất bản nên không thể chỉnh sửa');
  saveVideoEdit(req, res, v.id);
});
app.post('/api/videos/:id(\\d+)/visibility', needUser, postLimiter, (req, res) => {
  const v = ownVideo(req, res); if (!v) return;
  if (v.locked || (v.hidden && v.hidden_by !== 'owner')) return fail(res, 403, 'Video đang bị quản trị viên ẩn hoặc cấm, bạn không thể đổi.');
  const hide = !!req.body.hidden;
  db.prepare("UPDATE videos SET hidden = ?, hidden_by = ? WHERE id = ?").run(hide ? 1 : 0, hide ? 'owner' : '', v.id);
  res.json({ ok: true, hidden: hide });
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

// ---------- machine translation of the interface (cached in SQLite so each text is translated once per language) ----------
const translateLimiter = rateLimit({ windowMs: 60_000, limit: 90, standardHeaders: true, legacyHeaders: false });
let translateBlockedUntil = 0;
const blocked = {}; // provider -> timestamp until which it is skipped after a rate-limit response
async function machineTranslate(lang, texts) {
  const key = process.env.GOOGLE_TRANSLATE_KEY;
  if (key) { // official Cloud Translation API (recommended for production: reliable, 500k chars/month free)
    const r = await fetch('https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(key), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ q: texts, source: 'vi', target: lang, format: 'text' }),
    });
    if (!r.ok) throw new Error('translate api ' + r.status);
    const d = await r.json();
    return d.data.translations.map((t) => t.translatedText);
  }
  // Keyless fallbacks, tried in order for every text: Google's public endpoint, then MyMemory (free tier; ADMIN_EMAIL raises its daily quota).
  const gtx = async (t) => {
    const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&dt=t&tl=' + encodeURIComponent(lang) + '&q=' + encodeURIComponent(t), { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('gtx ' + r.status);
    const d = await r.json();
    return d[0].map((x) => x[0]).join('');
  };
  const mymemory = async (t) => {
    const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(t) + '&langpair=' + encodeURIComponent('vi|' + lang) + (ADMIN_EMAIL ? '&de=' + encodeURIComponent(ADMIN_EMAIL) : ''), { signal: AbortSignal.timeout(8000) });
    const d = await r.json().catch(() => ({}));
    const tr = d && d.responseData && d.responseData.translatedText;
    if (!r.ok || Number(d.responseStatus) !== 200 || !tr || /MYMEMORY WARNING|INVALID/i.test(tr)) throw new Error('mymemory ' + (d.responseStatus || r.status));
    if (Number(d.responseData.match) < 0.7) throw new Error('mymemory low-confidence'); // better to leave Vietnamese than show a wrong translation
    return tr;
  };
  const out = new Array(texts.length).fill(null);
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < texts.length) {
      const i = next++;
      for (const [name, fn] of [['gtx', gtx], ['mm', mymemory]]) {
        if (Date.now() < (blocked[name] || 0)) continue;
        try { out[i] = await fn(texts[i]); break; } catch (e) { if (/ 4(29|03)|quota|WARNING/i.test(e.message)) blocked[name] = Date.now() + 120_000; }
      }
    }
  }));
  return out;
}

app.post('/api/translate', translateLimiter, wrap(async (req, res) => {
  const lang = String(req.body.lang || '');
  if (!/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(lang) || lang === 'vi') return fail(res, 400, 'Ngôn ngữ không hợp lệ');
  const texts = (Array.isArray(req.body.texts) ? req.body.texts : []).slice(0, 60).map((t) => String(t).slice(0, 400));
  const out = new Array(texts.length).fill(null), miss = [];
  const get = db.prepare('SELECT out FROM translations WHERE lang = ? AND src = ?');
  texts.forEach((t, i) => { const row = get.get(lang, t); if (row) out[i] = row.out; else if (t.trim()) miss.push(i); });
  if (miss.length && Date.now() > translateBlockedUntil) {
    try {
      const got = await machineTranslate(lang, miss.map((i) => texts[i]));
      const put = db.prepare('INSERT OR REPLACE INTO translations (lang, src, out) VALUES (?,?,?)');
      got.forEach((tr, k) => { if (tr) { out[miss[k]] = tr; put.run(lang, texts[miss[k]], tr); } });
    } catch (e) { console.error('translate failed:', e.message); translateBlockedUntil = Date.now() + 30_000; }
  }
  res.json({ out });
}));
// Visitor's country when the hosting/CDN layer provides it (Cloudflare, CloudFront, Vercel…); otherwise the browser falls back to its time zone.
app.get('/api/geo', (req, res) => {
  const c = String(req.get('cf-ipcountry') || req.get('cloudfront-viewer-country') || req.get('x-vercel-ip-country') || req.get('x-country-code') || req.get('x-appengine-country') || '').toUpperCase();
  res.set('Cache-Control', 'no-store').json({ country: /^[A-Z]{2}$/.test(c) && !['XX', 'T1'].includes(c) ? c : '' });
});
// ---------- link previews (Telegram, Facebook, Zalo, X…): crawlers don't run JavaScript, so the share page /v/:id is
// rendered on the server with Open Graph tags for that video; real visitors are sent to the SPA player by app.js. ----------
const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

// Version stamp for scripts and styles (latest change time), so phones and CDNs always fetch the new files after a redeploy.
const ASSET_V = (() => {
  let t = 0;
  for (const d of ['js', 'css']) { try { for (const f of fs.readdirSync(path.join(__dirname, 'public', d))) t = Math.max(t, fs.statSync(path.join(__dirname, 'public', d, f)).mtimeMs); } catch {} }
  return Math.round(t / 1000).toString(36);
})();
function renderPage(req, res, v) {
  const base = (process.env.SITE_URL || req.protocol + '://' + req.get('host')).replace(/\/$/, '');
  const abs = (u) => (!u ? '' : /^https?:\/\//.test(u) ? u : base + u);
  const yt = v && !v.file && v.url && v.url.match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/);
  const place = v && [v.district, v.province].filter(Boolean).join(', ');
  const title = v ? cut(v.caption || 'Video của ' + v.user.name, 70) + ' – xgaigu' : 'xgaigu – Kết nối, video & livestream hẹn hò';
  const desc = v ? cut([v.caption, place && '📍 ' + place, v.user.name + (v.user.age ? ', ' + v.user.age : '')].filter(Boolean).join(' · '), 200)
    : 'Đăng video, làm quen, trò chuyện, xem livestream và đặt lịch hẹn gặp mặt an toàn. Dành cho người từ 18 tuổi.';
  const image = v ? (abs(v.thumb) || (yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : '')) : '';
  const url = v ? `${base}/v/${v.id}` : base + (req.path === '/' ? '/' : req.path);
  const tags = [
    `<title>${escHtml(title)}</title>`,
    `<meta name="description" content="${escHtml(desc)}">`,
    `<link rel="canonical" href="${escHtml(url)}">`,
    '<meta property="og:site_name" content="xgaigu">', '<meta property="og:locale" content="vi_VN">',
    `<meta property="og:type" content="${v ? 'video.other' : 'website'}">`,
    `<meta property="og:url" content="${escHtml(url)}">`,
    `<meta property="og:title" content="${escHtml(title)}">`,
    `<meta property="og:description" content="${escHtml(desc)}">`,
    `<meta property="og:image" content="${escHtml(image || base + '/img/og-default.png')}">`,
    ...(image ? [] : ['<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">']),
    ...(v && v.file ? [`<meta property="og:video" content="${escHtml(abs(v.file))}">`, `<meta property="og:video:secure_url" content="${escHtml(abs(v.file).replace(/^http:/, 'https:'))}">`,
      `<meta property="og:video:type" content="${v.file.endsWith('.webm') ? 'video/webm' : 'video/mp4'}">`] : []),
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escHtml(title)}">`,
    `<meta name="twitter:description" content="${escHtml(desc)}">`,
    `<meta name="twitter:image" content="${escHtml(image || base + '/img/og-default.png')}">`,
  ].join('\n');
  let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  html = html.replace(/<title>[\s\S]*?<\/title>\s*/, '').replace(/<meta name="description"[^>]*>\s*/, '').replace(/<meta property="og:[^>]*>\s*/g, '');
  html = html.replace(/(\/(?:js\/[\w.-]+\.js|css\/app\.css))"/g, '$1?v=' + ASSET_V + '"');
  html = html.replace('</head>', tags + '\n</head>');
  res.set('Cache-Control', 'no-cache').type('html').send(html);
}

require('./src/seo').install(app, { db, GEO, listVideos, escHtml, cut, needAdmin, fail, clean, now, assetV: () => ASSET_V });
app.get('/v/:id(\\d+)', (req, res) => renderPage(req, res, listVideos(null, { id: Number(req.params.id), limit: 1 })[0] || null));
app.get('/', (req, res) => renderPage(req, res, null));
// installable app (PWA): the worker must never be cached by the browser so updates reach installed apps at once
app.get('/sw.js', (_req, res) => res.set({ 'Cache-Control': 'no-cache', 'Service-Worker-Allowed': '/' }).type('application/javascript').sendFile(path.join(__dirname, 'public', 'sw.js')));
app.get('/manifest.webmanifest', (req, res) => {
  const m = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'manifest.webmanifest'), 'utf8'));
  m.related_applications = [{ platform: 'webapp', url: req.protocol + '://' + req.get('host') + '/manifest.webmanifest' }]; // always this domain
  res.set('Cache-Control', 'public, max-age=3600').type('application/manifest+json').send(JSON.stringify(m));
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: PROD ? '1h' : 0, extensions: ['html'], index: false }));
app.use('/api', (_req, res) => fail(res, 404, 'Không tìm thấy'));
app.get('*', (req, res) => renderPage(req, res, null));

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) return fail(res, 400, err.code === 'LIMIT_FILE_SIZE' ? 'File quá lớn (tối đa 100MB)' : 'Tải file thất bại');
  console.error(err);
  fail(res, 500, 'Lỗi máy chủ');
});

app.listen(PORT, () => console.log(`xgaigu listening on :${PORT}`));
