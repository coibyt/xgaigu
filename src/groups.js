// Nhóm Chat: one shared group for everybody ("Chợ xgaigu") and groups members create themselves (public or private,
// private ones joined by invite link). Posts carry text, pictures, a video, reactions and comments. Links are allowed
// only when they point at xgaigu. Visitors without an account can read the shared group and public groups but not
// post, react or comment. Clients poll for new posts (several Node processes share the database, so no in-memory push).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const REACTS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];
const MAX_OWNED = 20;
const MAX_IMAGES = 6;
const IMAGE_MAX = 12 * 1024 * 1024;

function install(app, { db, fail, clean, now, needUser, rmUpload, faststart, UPLOAD_DIR, VIDEO_TYPES, IMAGE_TYPES, rateLimit }) {
  db.exec(`
CREATE TABLE IF NOT EXISTS chat_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT DEFAULT 'user', name TEXT NOT NULL, about TEXT DEFAULT '',
  owner_id INTEGER DEFAULT 0, privacy TEXT DEFAULT 'public', invite TEXT DEFAULT '', created_at INTEGER NOT NULL,
  last_at INTEGER DEFAULT 0, deleted INTEGER DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_chat_groups_main ON chat_groups(kind) WHERE kind = 'main';
CREATE TABLE IF NOT EXISTS chat_members (
  group_id INTEGER NOT NULL, user_id INTEGER NOT NULL, role TEXT DEFAULT 'member', joined_at INTEGER NOT NULL,
  last_read INTEGER DEFAULT 0, PRIMARY KEY (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON chat_members(user_id);
CREATE TABLE IF NOT EXISTS chat_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, group_id INTEGER NOT NULL, user_id INTEGER NOT NULL, body TEXT DEFAULT '',
  media TEXT DEFAULT '[]', comments INTEGER DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, deleted INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_chat_posts_group ON chat_posts(group_id, id);
CREATE INDEX IF NOT EXISTS idx_chat_posts_upd ON chat_posts(group_id, updated_at);
CREATE TABLE IF NOT EXISTS chat_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, body TEXT NOT NULL,
  created_at INTEGER NOT NULL, deleted INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_chat_comments_post ON chat_comments(post_id, id);
CREATE TABLE IF NOT EXISTS chat_reacts (post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, emoji TEXT NOT NULL, PRIMARY KEY (post_id, user_id));
`);
  db.prepare(`INSERT OR IGNORE INTO chat_groups (kind, name, about, privacy, created_at, last_at) VALUES ('main', 'Chợ xgaigu',
    'Nhóm chung của mọi người trên xgaigu: đăng tin, hình ảnh, video, chia sẻ link xgaigu và giao lưu với nhau.', 'public', ?, ?)`).run(now(), now());

  const chatLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Bạn gửi hơi nhanh, hãy chờ một chút.' } });
  const upload = multer({
    storage: multer.diskStorage({
      destination: UPLOAD_DIR,
      filename: (_req, file, cb) => cb(null, 'chat-' + crypto.randomBytes(14).toString('hex') + (VIDEO_TYPES[file.mimetype] || IMAGE_TYPES[file.mimetype] || '')),
    }),
    limits: { fileSize: 100 * 1024 * 1024, files: MAX_IMAGES + 1 },
    fileFilter: (_req, file, cb) => cb(null, !!(VIDEO_TYPES[file.mimetype] || IMAGE_TYPES[file.mimetype])),
  });
  const takeFiles = (req, res, next) => upload.array('media', MAX_IMAGES + 1)(req, res, (err) => {
    if (err) return fail(res, err.code === 'LIMIT_FILE_SIZE' ? 413 : 400, err.code === 'LIMIT_FILE_SIZE' ? 'Video tối đa 100 MB' : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Tối đa ' + MAX_IMAGES + ' ảnh và 1 video mỗi bài' : 'Không tải lên được tệp');
    next();
  });

  // ---------- helpers ----------
  const groupRow = (id) => db.prepare('SELECT * FROM chat_groups WHERE id = ? AND deleted = 0').get(Number(id));
  const memberRow = (gid, uid) => (uid ? db.prepare('SELECT * FROM chat_members WHERE group_id = ? AND user_id = ?').get(gid, uid) : null);
  const isSiteAdmin = (u) => !!u && u.role === 'admin';
  const canRead = (g, u) => g.kind === 'main' || g.privacy === 'public' || !!memberRow(g.id, u && u.id) || isSiteAdmin(u);
  const join = (gid, uid, role = 'member') => db.prepare('INSERT INTO chat_members (group_id, user_id, role, joined_at, last_read) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING').run(gid, uid, role, now(), 0);
  // the shared group: everyone with an account is in it
  const ensureMain = (g, u) => { if (g.kind === 'main' && u) join(g.id, u.id); };
  const canPost = (g, u) => !!u && !u.banned && (g.kind === 'main' || !!memberRow(g.id, u.id));
  const isMod = (g, u) => !!u && (isSiteAdmin(u) || (g.kind !== 'main' && ['owner', 'admin'].includes((memberRow(g.id, u.id) || {}).role)));
  const newCode = () => crypto.randomBytes(6).toString('base64url');

  // links: only xgaigu (any form of the site's own address)
  const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"']+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|net|org|vn|io|me|co|info|biz|xyz|top|site|online|app|link|ly|gg|tv|cc|us|uk|ru|cn|asia|club|live|shop|store)\b(?:\/[^\s<>"']*)?/gi;
  const ownHost = (h) => /(^|\.)xgaigu\.com$/i.test(h) || /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(h);
  function badLink(text, req) {
    for (const m of String(text || '').match(URL_RE) || []) {
      let host = '';
      try { host = new URL(/^https?:/i.test(m) ? m : 'https://' + m).host; } catch { return m; }
      if (!ownHost(host) && host !== req.get('host')) return m;
    }
    return '';
  }
  // previews for links to xgaigu videos and profiles
  function previews(body) {
    const out = [], seen = new Set();
    const re = /(?:\/v\/|#\/feed\/)(\d+)|#\/u\/(\d+)/g;
    let m;
    while ((m = re.exec(body || '')) && out.length < 2) {
      const key = m[1] ? 'v' + m[1] : 'u' + m[2];
      if (seen.has(key)) continue; seen.add(key);
      if (m[1]) {
        const v = db.prepare(`SELECT v.id, v.caption, v.thumb, v.nickname, v.province, u.name FROM videos v JOIN users u ON u.id = v.user_id WHERE v.id = ? AND v.hidden = 0 AND u.banned = 0`).get(Number(m[1]));
        if (v) out.push({ type: 'video', id: v.id, title: v.nickname || v.name, text: (v.caption || '').slice(0, 120), place: v.province || '', thumb: v.thumb || '/og/v/' + v.id + '.jpg' });
      } else {
        const u = db.prepare('SELECT id, name, avatar, city FROM users WHERE id = ? AND banned = 0').get(Number(m[2]));
        if (u) out.push({ type: 'user', id: u.id, title: u.name, text: u.city || '', thumb: u.avatar || '' });
      }
    }
    return out;
  }
  const userCard = (r) => ({ id: r.user_id, name: r.u_name, avatar: r.u_avatar || '' });
  function postsOut(rows, viewer, g) {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id), marks = ids.map(() => '?').join(',');
    const reacts = new Map();
    for (const x of db.prepare(`SELECT post_id, emoji, COUNT(*) AS n FROM chat_reacts WHERE post_id IN (${marks}) GROUP BY post_id, emoji`).all(...ids)) {
      if (!reacts.has(x.post_id)) reacts.set(x.post_id, {});
      reacts.get(x.post_id)[x.emoji] = x.n;
    }
    const mine = new Map(viewer ? db.prepare(`SELECT post_id, emoji FROM chat_reacts WHERE user_id = ? AND post_id IN (${marks})`).all(viewer.id, ...ids).map((x) => [x.post_id, x.emoji]) : []);
    const mod = isMod(g, viewer);
    return rows.map((r) => {
      if (r.deleted) return { id: r.id, deleted: true, at: r.created_at };
      let media = []; try { media = JSON.parse(r.media || '[]'); } catch {}
      return { id: r.id, user: userCard(r), body: r.body, media, at: r.created_at, reacts: reacts.get(r.id) || {}, mine: mine.get(r.id) || '',
        comments: r.comments, previews: previews(r.body), canDelete: !!viewer && (viewer.id === r.user_id || mod) };
    });
  }
  const POST_SQL = 'SELECT p.*, u.name AS u_name, u.avatar AS u_avatar FROM chat_posts p JOIN users u ON u.id = p.user_id WHERE p.group_id = ? ';
  function groupOut(g, u) {
    const m = memberRow(g.id, u && u.id);
    const members = g.kind === 'main' ? db.prepare('SELECT COUNT(*) AS n FROM users WHERE banned = 0').get().n : db.prepare('SELECT COUNT(*) AS n FROM chat_members WHERE group_id = ?').get(g.id).n;
    const owner = g.owner_id ? db.prepare('SELECT id, name, avatar FROM users WHERE id = ?').get(g.owner_id) : null;
    return { id: g.id, kind: g.kind, name: g.name, about: g.about, privacy: g.privacy, members, lastAt: g.last_at, owner,
      me: { member: g.kind === 'main' ? !!u : !!m, role: m ? m.role : '', canPost: canPost(g, u), mod: isMod(g, u) },
      invite: m || isSiteAdmin(u) ? g.invite : '' };
  }
  const lastOf = (gid) => db.prepare(`SELECT p.body, p.media, p.deleted, u.name FROM chat_posts p JOIN users u ON u.id = p.user_id WHERE p.group_id = ? ORDER BY p.id DESC LIMIT 1`).get(gid);
  const lastText = (l) => { if (!l) return ''; if (l.deleted) return l.name + ': (bài đã xoá)'; const media = l.media && l.media !== '[]' ? (l.media.includes('"vid"') ? '🎬 ' : '🖼️ ') : ''; return l.name + ': ' + media + (l.body || (media ? (media === '🎬 ' ? 'Video' : 'Hình ảnh') : '')); };
  const unreadOf = (gid, lastRead) => db.prepare('SELECT COUNT(*) AS n FROM chat_posts WHERE group_id = ? AND id > ? AND deleted = 0').get(gid, lastRead).n;

  // ---------- groups ----------
  app.get('/api/groups', (req, res) => {
    const u = req.user;
    const main = db.prepare("SELECT * FROM chat_groups WHERE kind = 'main'").get();
    ensureMain(main, u);
    const mainMem = memberRow(main.id, u && u.id);
    const mine = u ? db.prepare(`SELECT g.*, m.last_read, m.role FROM chat_groups g JOIN chat_members m ON m.group_id = g.id
      WHERE m.user_id = ? AND g.deleted = 0 AND g.kind <> 'main' ORDER BY g.last_at DESC LIMIT 100`).all(u.id) : [];
    const mineIds = new Set(mine.map((g) => g.id));
    const discover = db.prepare(`SELECT g.*, (SELECT COUNT(*) FROM chat_members m WHERE m.group_id = g.id) AS n FROM chat_groups g
      WHERE g.deleted = 0 AND g.kind <> 'main' AND g.privacy = 'public' ORDER BY g.last_at DESC LIMIT 40`).all().filter((g) => !mineIds.has(g.id)).slice(0, 20);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    res.json({
      main: { ...groupOut(main, u), last: lastText(lastOf(main.id)), unread: mainMem ? unreadOf(main.id, mainMem.last_read) : 0,
        today: db.prepare('SELECT COUNT(*) AS n FROM chat_posts WHERE group_id = ? AND created_at > ? AND deleted = 0').get(main.id, Date.now() - 86400_000).n },
      mine: mine.map((g) => ({ id: g.id, name: g.name, privacy: g.privacy, role: g.role, last: lastText(lastOf(g.id)), lastAt: g.last_at, unread: unreadOf(g.id, g.last_read),
        members: db.prepare('SELECT COUNT(*) AS n FROM chat_members WHERE group_id = ?').get(g.id).n })),
      discover: discover.map((g) => ({ id: g.id, name: g.name, about: g.about, members: g.n, lastAt: g.last_at })),
    });
  });
  app.get('/api/groups/unread', (req, res) => {
    if (!req.user) return res.json({ unread: 0 });
    const r = db.prepare(`SELECT COALESCE(SUM((SELECT COUNT(*) FROM chat_posts p WHERE p.group_id = m.group_id AND p.id > m.last_read AND p.deleted = 0 AND p.user_id <> m.user_id)), 0) AS n
      FROM chat_members m JOIN chat_groups g ON g.id = m.group_id WHERE m.user_id = ? AND g.deleted = 0 AND g.kind <> 'main'`).get(req.user.id);
    res.json({ unread: r.n });
  });
  app.post('/api/groups', needUser, chatLimiter, (req, res) => {
    const name = clean(req.body.name, 60), about = clean(req.body.about, 300), privacy = req.body.privacy === 'private' ? 'private' : 'public';
    if (name.length < 2) return fail(res, 400, 'Tên nhóm cần ít nhất 2 ký tự');
    if (badLink(name + ' ' + about, req)) return fail(res, 400, 'Chỉ được dùng link của xgaigu.com');
    if (db.prepare("SELECT COUNT(*) AS n FROM chat_groups WHERE owner_id = ? AND deleted = 0").get(req.user.id).n >= MAX_OWNED) return fail(res, 400, 'Mỗi tài khoản tạo tối đa ' + MAX_OWNED + ' nhóm');
    const r = db.prepare('INSERT INTO chat_groups (kind, name, about, owner_id, privacy, invite, created_at, last_at) VALUES (?,?,?,?,?,?,?,?)').run('user', name, about, req.user.id, privacy, newCode(), now(), now());
    const id = Number(r.lastInsertRowid);
    join(id, req.user.id, 'owner');
    res.json({ ok: true, id });
  });
  app.get('/api/groups/:id(\\d+)', (req, res) => {
    const g = groupRow(req.params.id);
    if (!g) return fail(res, 404, 'Nhóm không tồn tại hoặc đã bị xoá');
    if (!canRead(g, req.user)) return fail(res, 403, 'Đây là nhóm riêng tư. Bạn cần link mời để tham gia.');
    ensureMain(g, req.user);
    res.json({ group: groupOut(g, req.user), reacts: REACTS });
  });
  app.put('/api/groups/:id(\\d+)', needUser, (req, res) => {
    const g = groupRow(req.params.id);
    if (!g || g.kind === 'main' || !isMod(g, req.user)) return fail(res, 403, 'Bạn không có quyền sửa nhóm này');
    const name = clean(req.body.name, 60), about = clean(req.body.about, 300), privacy = req.body.privacy === 'private' ? 'private' : 'public';
    if (name.length < 2) return fail(res, 400, 'Tên nhóm cần ít nhất 2 ký tự');
    if (badLink(name + ' ' + about, req)) return fail(res, 400, 'Chỉ được dùng link của xgaigu.com');
    db.prepare('UPDATE chat_groups SET name = ?, about = ?, privacy = ? WHERE id = ?').run(name, about, privacy, g.id);
    res.json({ ok: true, group: groupOut(groupRow(g.id), req.user) });
  });
  app.delete('/api/groups/:id(\\d+)', needUser, (req, res) => {
    const g = groupRow(req.params.id);
    if (!g || g.kind === 'main' || !(g.owner_id === req.user.id || isSiteAdmin(req.user))) return fail(res, 403, 'Chỉ chủ nhóm mới xoá được nhóm');
    db.prepare('UPDATE chat_groups SET deleted = 1 WHERE id = ?').run(g.id);
    res.json({ ok: true });
  });
  app.post('/api/groups/:id(\\d+)/invite', needUser, (req, res) => {
    const g = groupRow(req.params.id);
    if (!g || g.kind === 'main' || !isMod(g, req.user)) return fail(res, 403, 'Bạn không có quyền');
    const code = newCode();
    db.prepare('UPDATE chat_groups SET invite = ? WHERE id = ?').run(code, g.id);
    res.json({ invite: code });
  });
  app.post('/api/groups/:id(\\d+)/join', needUser, (req, res) => {
    const g = groupRow(req.params.id);
    if (!g) return fail(res, 404, 'Nhóm không tồn tại');
    if (g.kind !== 'main' && g.privacy !== 'public') return fail(res, 403, 'Nhóm riêng tư chỉ tham gia được bằng link mời');
    join(g.id, req.user.id);
    res.json({ ok: true, id: g.id });
  });
  app.get('/api/groups/invite/:code', (req, res) => {
    const g = db.prepare("SELECT * FROM chat_groups WHERE invite = ? AND invite <> '' AND deleted = 0").get(String(req.params.code));
    if (!g) return fail(res, 404, 'Link mời không đúng hoặc đã hết hiệu lực');
    res.json({ group: { id: g.id, name: g.name, about: g.about, privacy: g.privacy, members: db.prepare('SELECT COUNT(*) AS n FROM chat_members WHERE group_id = ?').get(g.id).n, member: !!memberRow(g.id, req.user && req.user.id) } });
  });
  app.post('/api/groups/invite/:code', needUser, (req, res) => {
    const g = db.prepare("SELECT * FROM chat_groups WHERE invite = ? AND invite <> '' AND deleted = 0").get(String(req.params.code));
    if (!g) return fail(res, 404, 'Link mời không đúng hoặc đã hết hiệu lực');
    join(g.id, req.user.id);
    res.json({ ok: true, id: g.id });
  });
  app.post('/api/groups/:id(\\d+)/leave', needUser, (req, res) => {
    const g = groupRow(req.params.id);
    if (!g || g.kind === 'main') return fail(res, 400, 'Không thể rời nhóm chung');
    if (g.owner_id === req.user.id) return fail(res, 400, 'Bạn là chủ nhóm: hãy xoá nhóm nếu không dùng nữa');
    db.prepare('DELETE FROM chat_members WHERE group_id = ? AND user_id = ?').run(g.id, req.user.id);
    res.json({ ok: true });
  });
  app.get('/api/groups/:id(\\d+)/members', (req, res) => {
    const g = groupRow(req.params.id);
    if (!g || !canRead(g, req.user)) return fail(res, 404, 'Không tìm thấy nhóm');
    if (g.kind === 'main') return res.json({ members: [] });
    const rows = db.prepare(`SELECT u.id, u.name, u.avatar, m.role FROM chat_members m JOIN users u ON u.id = m.user_id WHERE m.group_id = ? AND u.banned = 0
      ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, m.joined_at LIMIT 500`).all(g.id);
    res.json({ members: rows });
  });
  app.post('/api/groups/:id(\\d+)/members/:uid(\\d+)', needUser, (req, res) => {
    const g = groupRow(req.params.id), uid = Number(req.params.uid);
    if (!g || g.kind === 'main' || !isMod(g, req.user)) return fail(res, 403, 'Bạn không có quyền');
    const m = memberRow(g.id, uid);
    if (!m || m.role === 'owner') return fail(res, 400, 'Không thể thay đổi thành viên này');
    if (req.body.action === 'remove') db.prepare('DELETE FROM chat_members WHERE group_id = ? AND user_id = ?').run(g.id, uid);
    else if (req.body.action === 'admin' || req.body.action === 'member') {
      if (g.owner_id !== req.user.id && !isSiteAdmin(req.user)) return fail(res, 403, 'Chỉ chủ nhóm mới đổi quyền quản trị');
      db.prepare('UPDATE chat_members SET role = ? WHERE group_id = ? AND user_id = ?').run(req.body.action, g.id, uid);
    }
    res.json({ ok: true });
  });

  // ---------- posts ----------
  app.get('/api/groups/:id(\\d+)/posts', (req, res) => {
    const g = groupRow(req.params.id);
    if (!g) return fail(res, 404, 'Nhóm không tồn tại hoặc đã bị xoá');
    if (!canRead(g, req.user)) return fail(res, 403, 'Đây là nhóm riêng tư');
    const stamp = now();
    let rows;
    const since = Number(req.query.since) || 0, before = Number(req.query.before) || 0;
    if (since) rows = db.prepare(POST_SQL + 'AND p.updated_at > ? ORDER BY p.id LIMIT 200').all(g.id, since - 1500);
    else rows = db.prepare(POST_SQL + 'AND (? = 0 OR p.id < ?) ORDER BY p.id DESC LIMIT 30').all(g.id, before, before).reverse();
    const m = memberRow(g.id, req.user && req.user.id);
    if (m) { const top = db.prepare('SELECT MAX(id) AS id FROM chat_posts WHERE group_id = ?').get(g.id).id || 0; if (top > m.last_read) db.prepare('UPDATE chat_members SET last_read = ? WHERE group_id = ? AND user_id = ?').run(top, g.id, m.user_id); }
    res.json({ posts: postsOut(rows, req.user, g), now: stamp, more: !since && rows.length === 30 });
  });
  app.post('/api/groups/:id(\\d+)/posts', needUser, chatLimiter, takeFiles, (req, res) => {
    const files = req.files || [];
    const drop = () => files.forEach((f) => rmUpload(f.filename));
    const g = groupRow(req.params.id);
    if (!g) { drop(); return fail(res, 404, 'Nhóm không tồn tại'); }
    if (!canPost(g, req.user)) { drop(); return fail(res, 403, 'Hãy tham gia nhóm để đăng bài'); }
    const body = String(req.body.body || '').replace(/\r/g, '').trim().slice(0, 3000);
    const bad = badLink(body, req);
    if (bad) { drop(); return fail(res, 400, 'Chỉ được gửi link của xgaigu.com (không gửi được: ' + bad.slice(0, 60) + ')'); }
    const vids = files.filter((f) => VIDEO_TYPES[f.mimetype]), imgs = files.filter((f) => IMAGE_TYPES[f.mimetype]);
    if (vids.length > 1 || imgs.length > MAX_IMAGES) { drop(); return fail(res, 400, 'Tối đa ' + MAX_IMAGES + ' ảnh và 1 video mỗi bài'); }
    if (imgs.some((f) => f.size > IMAGE_MAX)) { drop(); return fail(res, 400, 'Mỗi ảnh tối đa 12 MB'); }
    if (!body && !files.length) return fail(res, 400, 'Hãy viết nội dung hoặc chọn ảnh / video');
    const media = [...imgs.map((f) => ({ t: 'img', u: '/uploads/' + f.filename })), ...vids.map((f) => ({ t: 'vid', u: '/uploads/' + f.filename }))];
    for (const v of vids) if (/\.(mp4|mov)$/i.test(v.filename)) faststart.enqueue('/uploads/' + v.filename);
    const t = now();
    const r = db.prepare('INSERT INTO chat_posts (group_id, user_id, body, media, created_at, updated_at) VALUES (?,?,?,?,?,?)').run(g.id, req.user.id, body, JSON.stringify(media), t, t);
    db.prepare('UPDATE chat_groups SET last_at = ? WHERE id = ?').run(t, g.id);
    ensureMain(g, req.user);
    const row = db.prepare(POST_SQL + 'AND p.id = ?').get(g.id, Number(r.lastInsertRowid));
    res.json({ post: postsOut([row], req.user, g)[0] });
  });
  const postOf = (id) => db.prepare('SELECT * FROM chat_posts WHERE id = ? AND deleted = 0').get(Number(id));
  app.delete('/api/chat-posts/:id(\\d+)', needUser, (req, res) => {
    const p = postOf(req.params.id), g = p && groupRow(p.group_id);
    if (!p || !g) return fail(res, 404, 'Bài không còn');
    if (p.user_id !== req.user.id && !isMod(g, req.user)) return fail(res, 403, 'Bạn không thể xoá bài này');
    db.prepare("UPDATE chat_posts SET deleted = 1, body = '', media = '[]', updated_at = ? WHERE id = ?").run(now(), p.id);
    try { for (const m of JSON.parse(p.media || '[]')) rmUpload(path.basename(m.u)); } catch {}
    res.json({ ok: true });
  });
  app.post('/api/chat-posts/:id(\\d+)/react', needUser, (req, res) => {
    const p = postOf(req.params.id), g = p && groupRow(p.group_id);
    if (!p || !g || !canRead(g, req.user)) return fail(res, 404, 'Bài không còn');
    const e = REACTS.includes(req.body.emoji) ? req.body.emoji : '';
    if (e) db.prepare('INSERT INTO chat_reacts (post_id, user_id, emoji) VALUES (?,?,?) ON CONFLICT(post_id, user_id) DO UPDATE SET emoji = excluded.emoji').run(p.id, req.user.id, e);
    else db.prepare('DELETE FROM chat_reacts WHERE post_id = ? AND user_id = ?').run(p.id, req.user.id);
    db.prepare('UPDATE chat_posts SET updated_at = ? WHERE id = ?').run(now(), p.id);
    const row = db.prepare(POST_SQL + 'AND p.id = ?').get(g.id, p.id);
    res.json({ post: postsOut([row], req.user, g)[0] });
  });

  // ---------- comments ----------
  app.get('/api/chat-posts/:id(\\d+)/comments', (req, res) => {
    const p = postOf(req.params.id), g = p && groupRow(p.group_id);
    if (!p || !g || !canRead(g, req.user)) return fail(res, 404, 'Bài không còn');
    const mod = isMod(g, req.user);
    const rows = db.prepare(`SELECT c.*, u.name AS u_name, u.avatar AS u_avatar FROM chat_comments c JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ? AND c.deleted = 0 ORDER BY c.id LIMIT 300`).all(p.id);
    res.json({ comments: rows.map((c) => ({ id: c.id, user: userCard(c), body: c.body, at: c.created_at, canDelete: !!req.user && (req.user.id === c.user_id || mod) })) });
  });
  app.post('/api/chat-posts/:id(\\d+)/comments', needUser, chatLimiter, (req, res) => {
    const p = postOf(req.params.id), g = p && groupRow(p.group_id);
    if (!p || !g) return fail(res, 404, 'Bài không còn');
    if (!canPost(g, req.user)) return fail(res, 403, 'Hãy tham gia nhóm để bình luận');
    const body = String(req.body.body || '').replace(/\r/g, '').trim().slice(0, 1000);
    if (!body) return fail(res, 400, 'Hãy viết bình luận');
    const bad = badLink(body, req);
    if (bad) return fail(res, 400, 'Chỉ được gửi link của xgaigu.com');
    const r = db.prepare('INSERT INTO chat_comments (post_id, user_id, body, created_at) VALUES (?,?,?,?)').run(p.id, req.user.id, body, now());
    db.prepare('UPDATE chat_posts SET comments = comments + 1, updated_at = ? WHERE id = ?').run(now(), p.id);
    ensureMain(g, req.user);
    res.json({ comment: { id: Number(r.lastInsertRowid), user: { id: req.user.id, name: req.user.name, avatar: req.user.avatar || '' }, body, at: now(), canDelete: true } });
  });
  app.delete('/api/chat-comments/:id(\\d+)', needUser, (req, res) => {
    const c = db.prepare('SELECT * FROM chat_comments WHERE id = ? AND deleted = 0').get(Number(req.params.id));
    const p = c && db.prepare('SELECT * FROM chat_posts WHERE id = ?').get(c.post_id), g = p && groupRow(p.group_id);
    if (!c || !g) return fail(res, 404, 'Bình luận không còn');
    if (c.user_id !== req.user.id && !isMod(g, req.user)) return fail(res, 403, 'Bạn không thể xoá bình luận này');
    db.prepare('UPDATE chat_comments SET deleted = 1 WHERE id = ?').run(c.id);
    db.prepare('UPDATE chat_posts SET comments = MAX(0, comments - 1), updated_at = ? WHERE id = ?').run(now(), p.id);
    res.json({ ok: true });
  });
}

module.exports = { install, REACTS };
