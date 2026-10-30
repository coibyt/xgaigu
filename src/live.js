// Livestream rooms: camera (WebRTC), YouTube / HLS links, or "Live bằng video" — a long uploaded video that plays for
// everyone at the same moment as if it were live, optionally looping forever. Inside a room: comments, floating
// reactions, gifts (paid with free daily coins), top fans, a pinned comment and join notices.
const crypto = require('crypto');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

const GIFTS = [
  { id: 'rose', name: 'Hoa hồng', icon: '🌹', price: 1 },
  { id: 'heart', name: 'Trái tim', icon: '💖', price: 5 },
  { id: 'candy', name: 'Kẹo mút', icon: '🍭', price: 10 },
  { id: 'kiss', name: 'Nụ hôn', icon: '💋', price: 20 },
  { id: 'bear', name: 'Gấu bông', icon: '🧸', price: 39 },
  { id: 'ring', name: 'Nhẫn kim cương', icon: '💍', price: 99 },
  { id: 'champagne', name: 'Sâm panh', icon: '🍾', price: 149 },
  { id: 'car', name: 'Siêu xe', icon: '🏎️', price: 299 },
  { id: 'crown', name: 'Vương miện', icon: '👑', price: 499 },
  { id: 'castle', name: 'Lâu đài', icon: '🏰', price: 999 },
];
const REACTS = ['❤️', '😍', '🔥', '👏', '😂', '😮', '🌹', '🎉', '💋', '🥰'];
const DAILY = 300, WALLET_CAP = 3000;

function install(app, { db, fail, clean, now, needUser, postLimiter, sse, send, publicUser, rmUpload, faststart, UPLOAD_DIR, VIDEO_TYPES, IMAGE_TYPES }) {
  const liveUpload = multer({
    storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (_req, file, cb) => cb(null, 'live-' + crypto.randomBytes(14).toString('hex') + (VIDEO_TYPES[file.mimetype] || IMAGE_TYPES[file.mimetype] || '')) }),
    limits: { fileSize: 1024 * 1024 * 1024, files: 2 },
    fileFilter: (_req, file, cb) => cb(null, file.fieldname === 'file' ? !!VIDEO_TYPES[file.mimetype] : !!IMAGE_TYPES[file.mimetype]),
  });
  const reactLimiter = rateLimit({ windowMs: 60_000, limit: 150, standardHeaders: true, legacyHeaders: false });
  const giftLimiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false });

  const rooms = new Map(); // streamId -> { clients: Map<clientId,{res,userId,host}>, joins: Map<userId,time> }
  const roomOf = (id) => { if (!rooms.has(id)) rooms.set(id, { clients: new Map(), joins: new Map() }); return rooms.get(id); };
  const viewerCount = (room) => [...room.clients.values()].filter((c) => !c.host).length;
  const broadcast = (room, event, data) => { for (const c of room.clients.values()) send(c.res, event, data); };
  setInterval(() => { for (const room of rooms.values()) for (const c of room.clients.values()) c.res.write(': ping\n\n'); }, 20_000).unref();

  const today = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10); // Vietnam date
  function wallet(uid) {
    let w = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(uid);
    if (!w) { db.prepare('INSERT INTO wallets (user_id, coins, day, received) VALUES (?,?,?,0)').run(uid, DAILY, today()); return { coins: DAILY, received: 0 }; }
    if (w.day !== today()) { // free coins every day (unused coins carry over up to a cap)
      const coins = Math.min(WALLET_CAP, w.coins + DAILY);
      db.prepare('UPDATE wallets SET coins = ?, day = ? WHERE user_id = ?').run(coins, today(), uid); w = { ...w, coins };
    }
    return { coins: w.coins, received: w.received };
  }

  // a video stream that does not loop is over once the video has played to the end
  function expire() {
    const rows = db.prepare("SELECT id, file FROM streams WHERE live = 1 AND kind = 'video' AND loop = 0 AND duration > 0 AND started_at + duration * 1000 + 5000 < ?").all(now());
    for (const s of rows) endStream(s);
  }
  function endStream(s) {
    db.prepare('UPDATE streams SET live = 0, ended_at = ? WHERE id = ?').run(now(), s.id);
    const room = rooms.get(s.id);
    if (room) broadcast(room, 'ended', {});
  }
  const fans = (sid) => db.prepare(`SELECT u.id, u.name, u.avatar, SUM(e.value) AS value FROM live_events e JOIN users u ON u.id = e.user_id
    WHERE e.stream_id = ? AND e.kind = 'gift' GROUP BY e.user_id ORDER BY value DESC LIMIT 5`).all(sid);
  const mapStream = (s, u) => ({
    id: s.id, title: s.title, kind: s.kind, source: ['webrtc', 'video'].includes(s.kind) ? '' : s.source,
    file: s.kind === 'video' ? s.file : '', thumb: s.thumb || '', duration: s.duration || 0, loop: !!s.loop,
    live: !!s.live, startedAt: s.started_at, gifts: s.gifts || 0, pinned: s.pinned ? JSON.parse(s.pinned) : null,
    viewers: rooms.has(s.id) ? viewerCount(rooms.get(s.id)) : 0,
    host: publicUser(u),
  });
  const eventOut = (e) => ({ id: e.id, kind: e.kind, user: { id: e.user_id, name: e.name, avatar: e.avatar }, body: e.body, gift: e.gift, qty: e.qty, value: e.value, at: e.at });

  app.get('/api/streams', (_req, res) => {
    expire();
    const rows = db.prepare(`SELECT s.* FROM streams s JOIN users u ON u.id = s.user_id WHERE s.live = 1 AND u.banned = 0 ORDER BY s.id DESC LIMIT 60`).all();
    const list = rows.map((s) => mapStream(s, db.prepare('SELECT * FROM users WHERE id = ?').get(s.user_id)));
    list.sort((a, b) => b.viewers - a.viewers || b.id - a.id);
    res.json({ streams: list });
  });
  app.get('/api/live/gifts', (req, res) => res.json({ gifts: GIFTS, reacts: REACTS, daily: DAILY, wallet: req.user ? wallet(req.user.id) : null }));

  app.post('/api/streams', needUser, postLimiter, liveUpload.fields([{ name: 'file', maxCount: 1 }, { name: 'thumb', maxCount: 1 }]), (req, res) => {
    const b = req.body || {};
    const file = req.files && req.files.file && req.files.file[0], thumbF = req.files && req.files.thumb && req.files.thumb[0];
    const drop = () => { if (file) rmUpload(file.filename); if (thumbF) rmUpload(thumbF.filename); };
    const title = clean(b.title, 80);
    const kind = ['webrtc', 'hls', 'youtube', 'video'].includes(b.kind) ? b.kind : 'webrtc';
    let source = clean(b.source, 500), vfile = '', thumb = '', duration = 0;
    if (title.length < 3) { drop(); return fail(res, 400, 'Vui lòng nhập tiêu đề buổi live'); }
    if (kind === 'video') {
      duration = Number(b.duration);
      if (!(duration >= 5 && duration <= 12 * 3600)) { drop(); return fail(res, 400, 'Không đọc được thời lượng video, hãy chọn lại video'); }
      if (file) { vfile = '/uploads/' + file.filename; thumb = thumbF ? '/uploads/' + thumbF.filename : ''; }
      else {
        const v = db.prepare("SELECT file, thumb FROM videos WHERE id = ? AND user_id = ? AND file <> ''").get(Number(b.videoId), req.user.id);
        if (!v) { drop(); return fail(res, 400, 'Hãy tải lên một video hoặc chọn một video bạn đã đăng'); }
        vfile = v.file; thumb = thumbF ? '/uploads/' + thumbF.filename : v.thumb || '';
      }
      source = '';
    } else {
      drop();
      if (kind !== 'webrtc') {
        if (!/^https:\/\/\S+$/.test(source)) return fail(res, 400, 'Liên kết phải bắt đầu bằng https://');
        if (kind === 'youtube') {
          const m = source.match(/(?:youtu\.be\/|v=|\/live\/|\/embed\/)([\w-]{11})/);
          if (!m) return fail(res, 400, 'Liên kết YouTube không hợp lệ');
          source = m[1];
        }
      } else source = '';
    }
    for (const s of db.prepare('SELECT id FROM streams WHERE user_id = ? AND live = 1').all(req.user.id)) endStream(s);
    const info = db.prepare('INSERT INTO streams (user_id, title, kind, source, file, thumb, duration, loop, started_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(req.user.id, title, kind, source, vfile, thumb, duration, ['1', 'true', 'on'].includes(String(b.loop)) ? 1 : 0, now());
    if (file) faststart.enqueue(vfile); // so the video starts quickly at any point
    res.json({ id: Number(info.lastInsertRowid) });
  });

  app.get('/api/streams/:id(\\d+)', (req, res) => {
    expire();
    const s = db.prepare('SELECT * FROM streams WHERE id = ?').get(req.params.id);
    if (!s) return fail(res, 404, 'Không tìm thấy buổi live');
    res.json({ stream: mapStream(s, db.prepare('SELECT * FROM users WHERE id = ?').get(s.user_id)), serverNow: now() });
  });
  app.post('/api/streams/:id(\\d+)/end', needUser, (req, res) => {
    const s = db.prepare('SELECT * FROM streams WHERE id = ?').get(req.params.id);
    if (!s || (s.user_id !== req.user.id && req.user.role !== 'admin')) return fail(res, 403, 'Không có quyền');
    endStream(s);
    res.json({ ok: true });
  });

  app.get('/api/streams/:id(\\d+)/events', (req, res) => {
    const sid = Number(req.params.id);
    expire();
    const s = db.prepare('SELECT * FROM streams WHERE id = ? AND live = 1').get(sid);
    if (!s) return fail(res, 404, 'Buổi live đã kết thúc');
    const host = !!req.user && req.user.id === s.user_id && req.query.host === '1';
    const room = roomOf(sid);
    const clientId = crypto.randomBytes(6).toString('hex');
    sse(res);
    room.clients.set(clientId, { res, userId: req.user ? req.user.id : 0, host });
    const recent = db.prepare(`SELECT e.*, u.name, u.avatar FROM live_events e JOIN users u ON u.id = e.user_id WHERE e.stream_id = ? ORDER BY e.id DESC LIMIT 60`).all(sid).reverse();
    send(res, 'hello', { clientId, viewers: viewerCount(room), chat: recent.map(eventOut), fans: fans(sid), gifts: s.gifts || 0, host, serverNow: now() });
    broadcast(room, 'viewers', { viewers: viewerCount(room) });
    if (req.user && !host && req.user.id !== s.user_id) { // "X vừa vào phòng", at most once every 10 minutes per member
      const t = room.joins.get(req.user.id) || 0;
      if (now() - t > 10 * 60_000) { room.joins.set(req.user.id, now()); broadcast(room, 'join', { user: { id: req.user.id, name: req.user.name, avatar: req.user.avatar } }); }
    }
    if (!host) for (const c of room.clients.values()) if (c.host) send(c.res, 'viewer-join', { clientId });
    req.on('close', () => {
      room.clients.delete(clientId);
      broadcast(room, 'viewers', { viewers: viewerCount(room) });
      if (!host) for (const c of room.clients.values()) if (c.host) send(c.res, 'viewer-leave', { clientId });
      if (!room.clients.size) rooms.delete(sid);
    });
  });

  const liveStream = (req, res) => {
    const s = db.prepare('SELECT * FROM streams WHERE id = ? AND live = 1').get(Number(req.params.id));
    if (!s) fail(res, 404, 'Buổi live đã kết thúc');
    return s;
  };
  app.post('/api/streams/:id(\\d+)/chat', needUser, postLimiter, (req, res) => {
    const s = liveStream(req, res); if (!s) return;
    const body = clean(req.body.body, 200);
    if (!body) return fail(res, 400, 'Bình luận trống');
    const r = db.prepare("INSERT INTO live_events (stream_id, user_id, kind, body, at) VALUES (?,?,'chat',?,?)").run(s.id, req.user.id, body, now());
    const msg = { id: Number(r.lastInsertRowid), kind: 'chat', user: { id: req.user.id, name: req.user.name, avatar: req.user.avatar }, body, at: now(), isHost: req.user.id === s.user_id };
    const room = rooms.get(s.id); if (room) broadcast(room, 'chat', msg);
    res.json({ ok: true });
  });
  // floating reactions; taps are sent in small batches
  app.post('/api/streams/:id(\\d+)/react', reactLimiter, (req, res) => {
    const room = rooms.get(Number(req.params.id));
    const emoji = REACTS.includes(req.body.emoji) ? req.body.emoji : '❤️';
    const n = Math.min(Math.max(parseInt(req.body.n, 10) || 1, 1), 30);
    if (room) broadcast(room, 'react', { emoji, n, cid: String(req.body.cid || '').slice(0, 40) });
    res.json({ ok: true });
  });
  app.post('/api/streams/:id(\\d+)/heart', reactLimiter, (req, res) => { // older apps
    const room = rooms.get(Number(req.params.id));
    if (room) broadcast(room, 'react', { emoji: '❤️', n: 1, cid: '' });
    res.json({ ok: true });
  });
  app.post('/api/streams/:id(\\d+)/gift', needUser, giftLimiter, (req, res) => {
    const s = liveStream(req, res); if (!s) return;
    if (s.user_id === req.user.id) return fail(res, 400, 'Bạn không thể tự tặng quà cho mình');
    const g = GIFTS.find((x) => x.id === req.body.gift);
    const qty = Math.min(Math.max(parseInt(req.body.qty, 10) || 1, 1), 99);
    if (!g) return fail(res, 400, 'Quà không hợp lệ');
    const value = g.price * qty, w = wallet(req.user.id);
    if (w.coins < value) return fail(res, 402, 'Bạn không đủ xu. Mỗi ngày bạn được tặng ' + DAILY + ' xu miễn phí.');
    db.exec('BEGIN');
    try {
      db.prepare('UPDATE wallets SET coins = coins - ? WHERE user_id = ?').run(value, req.user.id);
      wallet(s.user_id); db.prepare('UPDATE wallets SET received = received + ? WHERE user_id = ?').run(value, s.user_id);
      db.prepare('UPDATE streams SET gifts = gifts + ? WHERE id = ?').run(value, s.id);
      db.prepare("INSERT INTO live_events (stream_id, user_id, kind, gift, qty, value, at) VALUES (?,?,'gift',?,?,?,?)").run(s.id, req.user.id, g.id, qty, value, now());
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    const total = db.prepare('SELECT gifts FROM streams WHERE id = ?').get(s.id).gifts;
    const room = rooms.get(s.id);
    if (room) {
      broadcast(room, 'gift', { user: { id: req.user.id, name: req.user.name, avatar: req.user.avatar }, gift: g.id, qty, value, total, at: now() });
      broadcast(room, 'fans', { fans: fans(s.id) });
    }
    res.json({ ok: true, wallet: wallet(req.user.id), total });
  });
  // the host pins one comment at the top of the room (empty = unpin)
  app.post('/api/streams/:id(\\d+)/pin', needUser, (req, res) => {
    const s = liveStream(req, res); if (!s) return;
    if (s.user_id !== req.user.id) return fail(res, 403, 'Chỉ người phát mới ghim được bình luận');
    const body = clean(req.body.body, 200);
    const pinned = body ? { body, user: clean(req.body.name, 60) || req.user.name } : null;
    db.prepare('UPDATE streams SET pinned = ? WHERE id = ?').run(pinned ? JSON.stringify(pinned) : '', s.id);
    const room = rooms.get(s.id); if (room) broadcast(room, 'pin', { pinned });
    res.json({ ok: true });
  });

  // WebRTC signaling relay (host <-> viewers)
  app.post('/api/streams/:id(\\d+)/signal', (req, res) => {
    const room = rooms.get(Number(req.params.id));
    const { from, to, data } = req.body || {};
    if (!room || !room.clients.has(from) || !room.clients.has(to) || !data) return fail(res, 400, 'Tín hiệu không hợp lệ');
    const a = room.clients.get(from); const b = room.clients.get(to);
    if (!a.host && !b.host) return fail(res, 403, 'Không hợp lệ');
    send(b.res, 'signal', { from, data });
    res.json({ ok: true });
  });

  return { rooms };
}

module.exports = { install, GIFTS };
