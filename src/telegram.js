// Auto-posting new videos to members' Telegram groups through one site bot.
// The admin sets the bot and chooses which accounts may use it. Each member links up to 5 groups/channels and decides
// how many posts each group gets per day (the rest waits for the next day), whether to send at once or at fixed times
// every day, and whether all groups get the same videos or the videos are spread across the groups in turn.
// Updates arrive by webhook. Queue rows are claimed with conditional updates, so several Node processes can share it.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const API_BASE = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '');
const MAX_TARGETS = 50; // groups per account unless the admin sets another number
const CODE_MINUTES = 30;
const DEFAULT_PREFS = { daily_limit: 10, mode: 'instant', times: '08:00,20:00', per_slot: 1, distribute: 'same', last_slot: '', split_cursor: 0 };
const NOT_ALLOWED = 'Tài khoản của bạn chưa được quản trị viên cho phép tự đăng lên Telegram.';

class TgError extends Error { constructor(message, code = 0) { super(message); this.code = code; } }
const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// Vietnam date and time: { day: 'YYYY-MM-DD', hm: 'HH:MM' }
function nowParts(t = Date.now()) {
  const d = new Date(t + 7 * 3600_000).toISOString();
  return { day: d.slice(0, 10), hm: d.slice(11, 16) };
}
function parseTimes(str) {
  const out = String(str || '').split(/[,;\s]+/).map((t) => {
    const m = /^(\d{1,2})[:h.](\d{2})$/.exec(t.trim());
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
    return String(Number(m[1])).padStart(2, '0') + ':' + m[2];
  }).filter(Boolean);
  return [...new Set(out)].sort().slice(0, 8);
}

function install(app, { db, fail, clean, now, needUser, needAdmin, UPLOAD_DIR }) {
  const getConf = (k) => { const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(k); return r ? r.value : ''; };
  const setConf = (obj) => { const st = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'); for (const [k, v] of Object.entries(obj)) st.run(k, String(v)); };
  const enabled = () => !!getConf('tg_bot_token');
  const base = () => (process.env.SITE_URL || getConf('tg_base') || '').replace(/\/$/, '');
  const userRow = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const maxTargets = () => Number(getConf('tg_max_targets')) || MAX_TARGETS;
  const allowed = (u) => !!u && !u.banned && (u.role === 'admin' || !!u.telegram_allowed);

  async function call(method, params = {}, token = getConf('tg_bot_token'), file = null) {
    if (!token) throw new TgError('Chưa cài bot Telegram.');
    let body; const headers = {};
    if (file) {
      body = new FormData();
      for (const [k, v] of Object.entries(params)) body.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      body.append(file.field, new Blob([fs.readFileSync(file.path)]), path.basename(file.path));
    } else { headers['Content-Type'] = 'application/json'; body = JSON.stringify(params); }
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(`${API_BASE}/bot${token}/${method}`, { method: 'POST', headers, body, signal: ctrl.signal });
      const data = await res.json().catch(() => ({}));
      if (!data.ok) throw new TgError(data.description || 'Telegram trả lỗi ' + res.status, data.error_code || res.status);
      return data.result;
    } catch (e) {
      if (e instanceof TgError) throw e;
      throw new TgError(e.name === 'AbortError' ? 'Telegram không phản hồi.' : 'Không kết nối được tới Telegram.');
    } finally { clearTimeout(timer); }
  }

  // ---------- admin: the site bot ----------
  const hookUrl = (secret) => base() + '/telegram/webhook/' + secret;
  async function setupBot(token, origin) {
    const me = await call('getMe', {}, token);
    if (!process.env.SITE_URL && origin) setConf({ tg_base: origin });
    const secret = crypto.randomBytes(24).toString('hex');
    let webhookError = '';
    if (base().startsWith('https://')) {
      try {
        await call('setWebhook', { url: hookUrl(secret), secret_token: secret, drop_pending_updates: true, allowed_updates: ['message', 'channel_post', 'my_chat_member'] }, token);
      } catch (e) { webhookError = e.message; }
    } else webhookError = 'Website chưa chạy bằng https nên Telegram không gửi được tin nhắn về (chỉ chạy được trên tên miền thật).';
    setConf({ tg_bot_token: token, tg_bot_username: me.username || '', tg_bot_id: String(me.id), tg_hook_secret: secret });
    return { username: me.username, webhookError };
  }
  async function botStatus() {
    if (!enabled()) return null;
    const out = { username: getConf('tg_bot_username'), webhookOk: false, webhookError: '', pending: 0 };
    try {
      const info = await call('getWebhookInfo', {});
      out.webhookOk = info.url === hookUrl(getConf('tg_hook_secret'));
      out.webhookError = info.last_error_message || (out.webhookOk ? '' : 'Webhook chưa trỏ về website — bấm “Kết nối lại”.');
      out.pending = info.pending_update_count || 0;
    } catch (e) { out.webhookError = e.message; }
    out.targets = db.prepare('SELECT COUNT(*) AS n FROM tg_targets WHERE active = 1').get().n;
    out.allowedUsers = db.prepare("SELECT COUNT(*) AS n FROM users WHERE telegram_allowed = 1 AND role <> 'admin'").get().n;
    out.queued = db.prepare("SELECT COUNT(*) AS n FROM tg_queue WHERE status = 'pending'").get().n;
    out.maxTargets = maxTargets();
    out.sentToday = db.prepare('SELECT COALESCE(SUM(sent), 0) AS n FROM tg_daily WHERE day = ?').get(nowParts().day).n;
    return out;
  }

  app.get('/api/admin/telegram-bot', needAdmin, async (_req, res) => res.json({ bot: await botStatus() }));
  app.post('/api/admin/telegram-bot', needAdmin, async (req, res) => {
    const token = String(req.body.token || '').trim() || (req.body.reconnect ? getConf('tg_bot_token') : '');
    if (!/^\d{5,}:[\w-]{30,}$/.test(token)) return fail(res, 400, 'Token bot không đúng dạng. Lấy token từ @BotFather, ví dụ 123456789:AA...');
    try { res.json({ ok: true, ...(await setupBot(token, req.protocol + '://' + req.get('host'))), bot: await botStatus() }); }
    catch (e) { fail(res, 400, 'Không kiểm tra được bot: ' + e.message); }
  });
  app.delete('/api/admin/telegram-bot', needAdmin, async (_req, res) => {
    try { if (enabled()) await call('deleteWebhook', {}); } catch {}
    setConf({ tg_bot_token: '', tg_bot_username: '', tg_bot_id: '', tg_hook_secret: '' });
    res.json({ ok: true });
  });
  // how many groups/channels each account may link
  app.get('/api/admin/telegram-limit', needAdmin, (_req, res) => res.json({ maxTargets: maxTargets() }));
  app.put('/api/admin/telegram-limit', needAdmin, (req, res) => {
    const n = Math.round(Number(req.body.maxTargets));
    if (!(n >= 1 && n <= 500)) return fail(res, 400, 'Số nhóm phải từ 1 đến 500');
    setConf({ tg_max_targets: n });
    res.json({ ok: true, maxTargets: n });
  });
  // which accounts may auto-post (admins always may)
  app.post('/api/admin/users/:id(\\d+)/telegram', needAdmin, (req, res) => {
    db.prepare('UPDATE users SET telegram_allowed = ? WHERE id = ?').run(req.body.allowed ? 1 : 0, Number(req.params.id));
    if (req.body.allowed) backfill(Number(req.params.id));
    res.json({ ok: true, allowed: !!req.body.allowed });
  });

  // ---------- members: linking groups and channels ----------
  function saveTarget(userId, chat) {
    const chatId = String(chat.id);
    const existing = db.prepare('SELECT id FROM tg_targets WHERE user_id = ? AND chat_id = ?').get(userId, chatId);
    if (!existing && db.prepare('SELECT COUNT(*) AS n FROM tg_targets WHERE user_id = ?').get(userId).n >= maxTargets()) throw new TgError(`Mỗi tài khoản kết nối tối đa ${maxTargets()} nhóm/kênh.`);
    const title = String(chat.title || chat.username || chatId).slice(0, 200), type = chat.type === 'channel' ? 'channel' : 'group';
    if (existing) db.prepare("UPDATE tg_targets SET title = ?, type = ?, username = ?, active = 1, last_error = '' WHERE id = ?").run(title, type, chat.username || '', existing.id);
    else db.prepare('INSERT INTO tg_targets (user_id, chat_id, title, type, username, created_at) VALUES (?,?,?,?,?,?)').run(userId, chatId, title, type, chat.username || '', now());
    backfill(userId); // the videos already on the account go into the queue too
    return { title };
  }
  async function sendTest(target, user) {
    await call('sendMessage', { chat_id: target.chat_id, parse_mode: 'HTML', disable_web_page_preview: true,
      text: `✅ Đã kết nối với tài khoản <b>${esc(user.name)}</b> trên xgaigu.\nCác video của tài khoản sẽ được tự động đăng vào đây.\n${esc(base())}/#/u/${user.id}` });
  }
  const mine = (req, res) => {
    if (!enabled()) { fail(res, 400, 'Quản trị viên chưa bật bot Telegram.'); return null; }
    if (!allowed(userRow(req.user.id))) { fail(res, 403, NOT_ALLOWED); return null; }
    return true;
  };
  const targetOf = (req, res) => {
    const t = db.prepare('SELECT * FROM tg_targets WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.user.id);
    if (!t) fail(res, 404, 'Không tìm thấy nhóm');
    return t;
  };

  app.get('/api/me/telegram', needUser, (req, res) => {
    const u = userRow(req.user.id);
    if (!enabled()) return res.json({ enabled: false });
    if (!allowed(u)) return res.json({ enabled: true, allowed: false });
    res.json({ enabled: true, allowed: true, bot: getConf('tg_bot_username'), maxTargets: maxTargets(), ...queueInfo(u.id),
      targets: db.prepare('SELECT id, title, type, username, active, last_error AS lastError, last_post_at AS lastPostAt FROM tg_targets WHERE user_id = ? ORDER BY id').all(u.id).map((t) => ({ ...t, active: !!t.active })) });
  });
  app.post('/api/me/telegram/code', needUser, (req, res) => {
    if (!mine(req, res)) return;
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', bytes = crypto.randomBytes(6);
    let code = 'XG-'; for (let i = 0; i < 6; i++) code += abc[bytes[i] % abc.length];
    db.prepare('DELETE FROM tg_codes WHERE user_id = ?').run(req.user.id);
    db.prepare('INSERT INTO tg_codes (code, user_id, expires_at) VALUES (?,?,?)').run(code, req.user.id, now() + CODE_MINUTES * 60_000);
    res.json({ code, minutes: CODE_MINUTES, bot: getConf('tg_bot_username') });
  });
  // public channels can be linked by @username
  app.post('/api/me/telegram/channel', needUser, async (req, res) => {
    if (!mine(req, res)) return;
    const name = String(req.body.username || '').trim().replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '').replace(/^@/, '').split(/[/?#]/)[0];
    if (!/^[A-Za-z0-9_]{4,64}$/.test(name)) return fail(res, 400, 'Hãy nhập tên kênh dạng @tenkenh');
    const bot = getConf('tg_bot_username');
    try {
      const chat = await call('getChat', { chat_id: '@' + name }).catch(() => { throw new TgError('Không tìm thấy @' + name + ' hoặc bot chưa được thêm vào đó.'); });
      const m = await call('getChatMember', { chat_id: chat.id, user_id: Number(getConf('tg_bot_id')) }).catch(() => null);
      const canPost = m && (m.status === 'creator' || (m.status === 'administrator' && m.can_post_messages !== false));
      if (chat.type === 'channel' && !canPost) throw new TgError(`Bot @${bot} chưa là quản trị viên có quyền đăng bài trong kênh @${name}.`);
      if (chat.type !== 'channel' && (!m || ['left', 'kicked'].includes(m.status))) throw new TgError(`Bot @${bot} chưa có trong nhóm @${name}.`);
      const saved = saveTarget(req.user.id, chat);
      await sendTest({ chat_id: String(chat.id) }, userRow(req.user.id)).catch(() => {});
      res.json({ ok: true, title: saved.title });
    } catch (e) { fail(res, 400, e.message); }
  });
  app.post('/api/me/telegram/targets/:id(\\d+)/test', needUser, async (req, res) => {
    if (!mine(req, res)) return; const t = targetOf(req, res); if (!t) return;
    try { await sendTest(t, userRow(req.user.id)); db.prepare("UPDATE tg_targets SET last_error = '' WHERE id = ?").run(t.id); res.json({ ok: true }); }
    catch (e) { db.prepare('UPDATE tg_targets SET last_error = ? WHERE id = ?').run(e.message.slice(0, 250), t.id); fail(res, 400, 'Không gửi được: ' + e.message); }
  });
  app.post('/api/me/telegram/targets/:id(\\d+)/active', needUser, (req, res) => {
    const t = targetOf(req, res); if (!t) return;
    db.prepare("UPDATE tg_targets SET active = ?, last_error = CASE WHEN ? THEN '' ELSE last_error END WHERE id = ?").run(req.body.active ? 1 : 0, req.body.active ? 1 : 0, t.id);
    if (req.body.active) backfill(req.user.id);
    res.json({ ok: true });
  });
  app.delete('/api/me/telegram/targets/:id(\\d+)', needUser, (req, res) => {
    const t = targetOf(req, res); if (!t) return;
    db.prepare('DELETE FROM tg_queue WHERE target_id = ?').run(t.id);
    db.prepare('DELETE FROM tg_daily WHERE target_id = ?').run(t.id);
    db.prepare('DELETE FROM tg_targets WHERE id = ?').run(t.id);
    res.json({ ok: true });
  });
  app.put('/api/me/telegram/prefs', needUser, (req, res) => {
    if (!mine(req, res)) return;
    const b = req.body || {}, times = parseTimes(b.times);
    const p = {
      daily_limit: Math.min(100, Math.max(1, Math.round(Number(b.daily_limit) || DEFAULT_PREFS.daily_limit))),
      mode: b.mode === 'schedule' ? 'schedule' : 'instant',
      times: (times.length ? times : parseTimes(DEFAULT_PREFS.times)).join(','),
      per_slot: Math.min(20, Math.max(1, Math.round(Number(b.per_slot) || 1))),
      distribute: b.distribute === 'split' ? 'split' : 'same',
    };
    if (p.mode === 'schedule' && !times.length) return fail(res, 400, 'Hãy nhập ít nhất một giờ gửi, ví dụ 08:00');
    db.prepare(`INSERT INTO tg_prefs (user_id, daily_limit, mode, times, per_slot, distribute) VALUES (?,?,?,?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET daily_limit = excluded.daily_limit, mode = excluded.mode, times = excluded.times, per_slot = excluded.per_slot, distribute = excluded.distribute`)
      .run(req.user.id, p.daily_limit, p.mode, p.times, p.per_slot, p.distribute);
    // times that already passed today start counting from tomorrow (no catch-up send right after saving)
    const at = nowParts(), past = parseTimes(p.times).filter((t) => t < at.hm);
    if (p.mode === 'schedule' && past.length) db.prepare("UPDATE tg_prefs SET last_slot = ? WHERE user_id = ? AND (last_slot IS NULL OR last_slot < ?)").run(at.day + ' ' + past[past.length - 1], req.user.id, at.day + ' ' + past[past.length - 1]);
    backfill(req.user.id); // e.g. switching to "same videos for every group" fills in the other groups
    dispatchUser(req.user.id).catch((e) => console.error('[telegram]', e.message));
    res.json({ ok: true, ...queueInfo(req.user.id) });
  });
  // videos already posted, to put some of them in the queue
  app.get('/api/me/telegram/videos', needUser, (req, res) => {
    if (!mine(req, res)) return;
    const rows = db.prepare('SELECT id, caption, thumb, created_at FROM videos WHERE user_id = ? AND hidden = 0 ORDER BY id DESC LIMIT 60').all(req.user.id);
    const queued = new Set(db.prepare('SELECT DISTINCT video_id FROM tg_queue WHERE user_id = ?').all(req.user.id).map((r) => r.video_id));
    res.json({ videos: rows.map((v) => ({ id: v.id, caption: v.caption, thumb: v.thumb, createdAt: v.created_at, queued: queued.has(v.id) })) });
  });
  app.post('/api/me/telegram/queue', needUser, (req, res) => {
    if (!mine(req, res)) return;
    const ids = (Array.isArray(req.body.ids) ? req.body.ids : []).map(Number).filter(Boolean).slice(0, 60);
    let n = 0;
    for (const id of ids.reverse()) { // oldest first
      const v = db.prepare('SELECT * FROM videos WHERE id = ? AND user_id = ? AND hidden = 0').get(id, req.user.id);
      if (v) n += enqueue(v, true);
    }
    dispatchUser(req.user.id).catch((e) => console.error('[telegram]', e.message));
    res.json({ ok: true, added: n, ...queueInfo(req.user.id) });
  });
  app.post('/api/me/telegram/queue/clear', needUser, (req, res) => {
    const id = Number(req.body.id) || 0;
    db.prepare("UPDATE tg_queue SET status = 'cancelled' WHERE user_id = ? AND status = 'pending' AND (? = 0 OR id = ?)").run(req.user.id, id, id);
    res.json({ ok: true, ...queueInfo(req.user.id) });
  });

  // ---------- webhook ----------
  const reply = (chatId, text) => call('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }).catch(() => {});
  app.post('/telegram/webhook/:secret', async (req, res) => {
    const secret = getConf('tg_hook_secret');
    if (!secret || req.params.secret !== secret || req.get('X-Telegram-Bot-Api-Secret-Token') !== secret) return res.sendStatus(403);
    res.json({ ok: true });
    try { await handleUpdate(req.body || {}); } catch (e) { console.error('[telegram] update:', e.message); }
  });
  async function handleUpdate(up) {
    if (up.my_chat_member) {
      const st = up.my_chat_member.new_chat_member && up.my_chat_member.new_chat_member.status;
      if (st === 'left' || st === 'kicked') db.prepare("UPDATE tg_targets SET active = 0, last_error = 'Bot đã bị xoá khỏi nhóm/kênh.' WHERE chat_id = ?").run(String(up.my_chat_member.chat.id));
      return;
    }
    const msg = up.message || up.channel_post;
    if (!msg || typeof msg.text !== 'string') return;
    const text = msg.text.trim();
    if (/^\/start\b/.test(text) && msg.chat.type === 'private') {
      return reply(msg.chat.id, `Xin chào! Để tự động đăng video từ xgaigu vào nhóm của bạn:\n1. Vào ${esc(base())}/#/me → “Tự động đăng lên Telegram” và lấy mã.\n2. Thêm @${esc(getConf('tg_bot_username'))} vào nhóm (hoặc làm quản trị viên kênh).\n3. Gửi <code>/connect MÃ</code> trong nhóm/kênh đó.`);
    }
    const m = /^\/connect(?:@[A-Za-z0-9_]+)?\s+(XG-[A-Z0-9]{6})\b/i.exec(text);
    if (!m) return;
    if (msg.chat.type === 'private') return reply(msg.chat.id, 'Hãy gửi lệnh /connect trong nhóm hoặc kênh muốn nhận video, không phải trong tin nhắn riêng.');
    const code = db.prepare('SELECT * FROM tg_codes WHERE code = ? AND expires_at > ?').get(m[1].toUpperCase(), now());
    if (!code) return reply(msg.chat.id, '❌ Mã kết nối không đúng hoặc đã hết hạn. Hãy lấy mã mới trên trang Tài khoản.');
    const u = userRow(code.user_id);
    if (!allowed(u)) return reply(msg.chat.id, '❌ ' + NOT_ALLOWED);
    try { saveTarget(u.id, msg.chat); } catch (e) { return reply(msg.chat.id, '❌ ' + esc(e.message)); }
    db.prepare('DELETE FROM tg_codes WHERE code = ?').run(code.code);
    return reply(msg.chat.id, `✅ Đã kết nối nhóm này với tài khoản <b>${esc(u.name)}</b> trên xgaigu. Video mới sẽ được tự động đăng vào đây.`);
  }

  // ---------- queue: limits, schedules, distribution ----------
  const getPrefs = (uid) => ({ ...DEFAULT_PREFS, ...(db.prepare('SELECT * FROM tg_prefs WHERE user_id = ?').get(uid) || {}), user_id: uid });

  // put a video in the queue for the owner's groups; returns how many rows were added
  function enqueue(v, manual = false) {
    const targets = db.prepare('SELECT id FROM tg_targets WHERE user_id = ? AND active = 1 ORDER BY id').all(v.user_id);
    if (!targets.length) return 0;
    const prefs = getPrefs(v.user_id);
    let chosen = targets;
    if (prefs.distribute === 'split' && targets.length > 1) { // different posts per group: each video goes to the next group in turn
      chosen = [targets[prefs.split_cursor % targets.length]];
      db.prepare('INSERT INTO tg_prefs (user_id, split_cursor) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET split_cursor = excluded.split_cursor').run(v.user_id, prefs.split_cursor + 1);
    }
    let n = 0;
    for (const t of chosen) {
      // a video posted to a group before is only re-sent when the member picks it again by hand
      const old = db.prepare('SELECT id, status FROM tg_queue WHERE video_id = ? AND target_id = ?').get(v.id, t.id);
      if (!old) n += db.prepare("INSERT INTO tg_queue (user_id, video_id, target_id, status, created_at) VALUES (?,?,?,'pending',?)").run(v.user_id, v.id, t.id, now()).changes;
      else if (manual && old.status !== 'pending' && old.status !== 'sending') n += db.prepare("UPDATE tg_queue SET status = 'pending', error = '', created_at = ? WHERE id = ?").run(now(), old.id).changes;
    }
    return n;
  }
  // every public video of the account goes into the queue (oldest first); the daily limit spreads them over the days.
  // In "different videos per group" mode a video that already went to one group is not given to another.
  function backfill(uid) {
    try {
      if (!enabled() || !allowed(userRow(uid))) return 0;
      const split = getPrefs(uid).distribute === 'split';
      let n = 0;
      for (const v of db.prepare('SELECT * FROM videos WHERE user_id = ? AND hidden = 0 ORDER BY id').all(uid)) {
        if (split && db.prepare('SELECT 1 FROM tg_queue WHERE video_id = ?').get(v.id)) continue;
        n += enqueue(v);
      }
      if (n) dispatchUser(uid).catch((e) => console.error('[telegram]', e.message));
      return n;
    } catch (e) { console.error('[telegram] backfill:', e.message); return 0; }
  }
  // called whenever a video becomes visible to everyone
  function announce(videoId) {
    try {
      if (!enabled()) return;
      const v = db.prepare('SELECT * FROM videos WHERE id = ? AND hidden = 0').get(videoId);
      if (!v || !allowed(userRow(v.user_id))) return;
      if (enqueue(v)) dispatchUser(v.user_id).catch((e) => console.error('[telegram]', e.message));
    } catch (e) { console.error('[telegram] announce:', e.message); }
  }

  // reserves one of today's sends for a group; false once the limit is reached
  function reserveSlot(targetId, day, limit) {
    db.prepare('INSERT INTO tg_daily (target_id, day, sent) VALUES (?, ?, 0) ON CONFLICT(target_id, day) DO NOTHING').run(targetId, day);
    return db.prepare('UPDATE tg_daily SET sent = sent + 1 WHERE target_id = ? AND day = ? AND sent < ?').run(targetId, day, limit).changes > 0;
  }
  const releaseSlot = (targetId, day) => db.prepare('UPDATE tg_daily SET sent = sent - 1 WHERE target_id = ? AND day = ? AND sent > 0').run(targetId, day);

  const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
  // a short summary of the post: the description, then the key details shown on the video page
  function summary(v, owner, descLen) {
    let info = {}; try { info = JSON.parse(v.info || '{}') || {}; } catch {}
    const where = [v.district, v.province].filter(Boolean).join(', ');
    const facts = [
      [info.birthYear && '🎂 ' + (new Date().getFullYear() - info.birthYear) + ' tuổi', info.height && '📏 ' + info.height + ' cm', info.weight && '⚖️ ' + info.weight + ' kg'].filter(Boolean).join(' · '),
      [info.origin && '🏡 Quê: ' + cut(info.origin, 40), info.occupation && '💼 ' + cut(info.occupation, 40)].filter(Boolean).join(' · '),
      info.workTime && '🕒 ' + cut(info.workTime, 80),
      info.interests && '💗 Sở thích: ' + cut(info.interests, 100),
    ].filter(Boolean);
    return [
      `🎬 <b>${esc(v.nickname || owner.name)}</b>` + (where ? ` · 📍 ${esc(where)}` : ''),
      v.caption && descLen ? '\n📝 ' + esc(cut(v.caption, descLen)) : '',
      facts.length ? '\n' + facts.map(esc).join('\n') : '',
    ].join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  const localFile = (p) => { if (!p || !p.startsWith('/uploads/')) return ''; const f = path.join(UPLOAD_DIR, path.basename(p)); return fs.existsSync(f) ? f : ''; };
  async function postVideo(target, v, owner) {
    const url = base() + '/v/' + v.id;
    const tail = `\n\n👉 <b>Nhấp vào link để xem video:</b>\n${esc(url)}`;
    // Telegram allows 1024 characters under a photo: shorten the description until it fits
    let caption = '';
    for (const n of [400, 250, 150, 80, 0]) { caption = summary(v, owner, n) + tail; if (caption.length <= 1000) break; }
    if (caption.length > 1000) caption = `🎬 <b>${esc(v.nickname || owner.name)}</b>` + tail;
    const params = { chat_id: target.chat_id, parse_mode: 'HTML' };
    if (url.startsWith('https://')) params.reply_markup = { inline_keyboard: [[{ text: '▶ Xem video ngay', url }]] };
    // the video's cover picture, else the member's profile picture, else Telegram's own preview of the link
    const photo = localFile(v.thumb) || localFile(owner.avatar);
    if (photo) await call('sendPhoto', { ...params, caption }, undefined, { field: 'photo', path: photo });
    else await call('sendMessage', { ...params, text: caption, link_preview_options: { url, prefer_large_media: true, show_above_text: true } });
  }
  // the status update is a claim: when several processes run the queue, only one sends a row
  async function sendRow(row, owner, day) {
    if (!db.prepare("UPDATE tg_queue SET status = 'sending', sent_at = ? WHERE id = ? AND status = 'pending'").run(now(), row.id).changes) return false;
    const v = db.prepare('SELECT * FROM videos WHERE id = ?').get(row.video_id);
    const t = db.prepare('SELECT * FROM tg_targets WHERE id = ?').get(row.target_id);
    if (!v || v.hidden) { db.prepare("UPDATE tg_queue SET status = 'skipped', error = 'Video không còn công khai.' WHERE id = ?").run(row.id); return false; }
    if (!t || !t.active) { db.prepare("UPDATE tg_queue SET status = 'pending', sent_at = 0 WHERE id = ?").run(row.id); return false; }
    try {
      await postVideo(t, v, owner);
      db.prepare("UPDATE tg_queue SET status = 'sent', sent_day = ?, sent_at = ?, error = '' WHERE id = ?").run(day, now(), row.id);
      db.prepare("UPDATE tg_targets SET last_post_at = ?, last_error = '' WHERE id = ?").run(now(), t.id);
      return true;
    } catch (e) {
      const gone = e.code === 403 || /chat not found|kicked|not a member/i.test(e.message); // bot removed, blocked, or the group is gone
      db.prepare('UPDATE tg_targets SET last_error = ?, active = CASE WHEN ? THEN 0 ELSE active END WHERE id = ?').run(e.message.slice(0, 250), gone ? 1 : 0, t.id);
      db.prepare('UPDATE tg_queue SET status = ?, sent_at = 0, error = ? WHERE id = ?').run(gone ? 'failed' : 'pending', e.message.slice(0, 250), row.id);
      return false;
    }
  }
  async function dispatchUser(uid, at = nowParts()) {
    if (!enabled()) return;
    const owner = userRow(uid);
    if (!allowed(owner)) return;
    const prefs = getPrefs(uid);
    let budget = Infinity;
    if (prefs.mode === 'schedule') {
      // once per scheduled time; a server that was asleep catches up on the latest one
      const due = parseTimes(prefs.times).filter((t) => t <= at.hm);
      if (!due.length) return;
      const key = at.day + ' ' + due[due.length - 1];
      if (prefs.last_slot && prefs.last_slot >= key) return;
      db.prepare('INSERT INTO tg_prefs (user_id) VALUES (?) ON CONFLICT(user_id) DO NOTHING').run(uid);
      if (!db.prepare("UPDATE tg_prefs SET last_slot = ? WHERE user_id = ? AND (last_slot IS NULL OR last_slot = '' OR last_slot < ?)").run(key, uid, key).changes) return;
      budget = prefs.per_slot;
    }
    const rows = db.prepare("SELECT q.* FROM tg_queue q JOIN tg_targets t ON t.id = q.target_id WHERE q.user_id = ? AND q.status = 'pending' AND t.active = 1 ORDER BY q.video_id DESC, q.id").all(uid); // newest videos first
    const byTarget = new Map();
    for (const r of rows) { if (!byTarget.has(r.target_id)) byTarget.set(r.target_id, []); byTarget.get(r.target_id).push(r); }
    for (const [targetId, list] of byTarget) {
      let sent = 0;
      for (const r of list) {
        if (sent >= budget) break;
        if (!reserveSlot(targetId, at.day, prefs.daily_limit)) break; // over today's limit: the rest waits for tomorrow
        if (await sendRow(r, owner, at.day)) sent++; else releaseSlot(targetId, at.day);
      }
    }
  }
  let dispatching = false, lastDispatch = 0, lastPrune = 0;
  async function dispatchAll() {
    if (dispatching || !enabled()) return;
    dispatching = true; lastDispatch = Date.now();
    try {
      // rows a crashed process left half-sent go back in the queue
      db.prepare("UPDATE tg_queue SET status = 'pending', sent_at = 0 WHERE status = 'sending' AND sent_at < ?").run(now() - 10 * 60_000);
      const ids = new Set([
        ...db.prepare("SELECT DISTINCT user_id FROM tg_queue WHERE status = 'pending'").all().map((r) => r.user_id),
        ...db.prepare("SELECT user_id FROM tg_prefs WHERE mode = 'schedule'").all().map((r) => r.user_id),
      ]);
      const at = nowParts();
      for (const id of ids) await dispatchUser(id, at).catch((e) => console.error('[telegram] dispatch:', e.message));
      if (Date.now() - lastPrune > 3600_000) {
        lastPrune = Date.now();
        db.prepare("DELETE FROM tg_queue WHERE status IN ('skipped', 'failed', 'cancelled') AND created_at < ?").run(now() - 30 * 86400_000);
        db.prepare('DELETE FROM tg_daily WHERE day < ?').run(nowParts(Date.now() - 30 * 86400_000).day);
        db.prepare('DELETE FROM tg_codes WHERE expires_at < ?').run(now());
      }
    } finally { dispatching = false; }
  }
  setInterval(() => dispatchAll().catch((e) => console.error('[telegram] dispatch:', e.message)), 60_000).unref();
  // also run from incoming requests, in case the host pauses idle timers
  const tick = () => { if (Date.now() - lastDispatch > 30_000) dispatchAll().catch((e) => console.error('[telegram] dispatch:', e.message)); };

  // what the account page shows: the queue, today's sends per group, the next run
  function queueInfo(uid) {
    const prefs = getPrefs(uid), at = nowParts();
    const sentToday = Object.fromEntries(db.prepare('SELECT d.target_id, d.sent FROM tg_daily d JOIN tg_targets t ON t.id = d.target_id WHERE t.user_id = ? AND d.day = ?').all(uid, at.day).map((r) => [r.target_id, r.sent]));
    const upcoming = db.prepare(`SELECT q.id, q.video_id AS videoId, v.caption, v.thumb, t.title AS target, q.error FROM tg_queue q JOIN videos v ON v.id = q.video_id JOIN tg_targets t ON t.id = q.target_id
      WHERE q.user_id = ? AND q.status = 'pending' ORDER BY q.video_id DESC, q.id LIMIT 20`).all(uid);
    const recent = db.prepare(`SELECT q.id, q.video_id AS videoId, v.caption, t.title AS target, q.status, q.error, q.sent_at AS sentAt FROM tg_queue q JOIN videos v ON v.id = q.video_id JOIN tg_targets t ON t.id = q.target_id
      WHERE q.user_id = ? AND q.status IN ('sent', 'failed', 'skipped') ORDER BY q.sent_at DESC LIMIT 10`).all(uid);
    let next = null;
    if (prefs.mode === 'schedule') { const times = parseTimes(prefs.times), later = times.find((t) => t > at.hm); next = later ? later + ' hôm nay' : times[0] + ' ngày mai'; }
    return { prefs: { daily_limit: prefs.daily_limit, mode: prefs.mode, times: prefs.times, per_slot: prefs.per_slot, distribute: prefs.distribute },
      pending: db.prepare("SELECT COUNT(*) AS n FROM tg_queue WHERE user_id = ? AND status = 'pending'").get(uid).n, upcoming, recent, next, sentToday };
  }

  return { announce, tick };
}

module.exports = { install, parseTimes };
