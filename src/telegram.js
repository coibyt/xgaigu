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

function install(app, { db, fail, clean, now, needUser, needAdmin, UPLOAD_DIR, thumbs }) {
  const getConf = (k) => { const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(k); return r ? r.value : ''; };
  const setConf = (obj) => { const st = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'); for (const [k, v] of Object.entries(obj)) st.run(k, String(v)); };
  const enabled = () => !!getConf('tg_bot_token');
  const base = () => (process.env.SITE_URL || getConf('tg_base') || '').replace(/\/$/, '');
  const userRow = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const maxTargets = () => Number(getConf('tg_max_targets')) || MAX_TARGETS;
  const allowed = (u) => !!u && !u.banned && (u.role === 'admin' || !!u.telegram_allowed);

  async function call(method, params = {}, token = getConf('tg_bot_token'), file = null, timeoutMs = 20000) {
    if (!token) throw new TgError('Chưa cài bot Telegram.');
    let body; const headers = {};
    if (file) {
      body = new FormData();
      for (const [k, v] of Object.entries(params)) body.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      body.append(file.field, new Blob([fs.readFileSync(file.path)]), path.basename(file.path));
    } else { headers['Content-Type'] = 'application/json'; body = JSON.stringify(params); }
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), timeoutMs);
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
  // Messages to the bot (/connect, /start, "bot removed from the group") are fetched by the site with getUpdates instead of
  // a webhook: the host's CDN may block or redirect Telegram's calls to the site (seen: "307 Temporary Redirect"), while
  // calls from the site to Telegram always work. Only one server process polls at a time (a lock row in settings).
  async function setupBot(token, origin) {
    const me = await call('getMe', {}, token);
    if (!process.env.SITE_URL && origin) setConf({ tg_base: origin });
    let webhookError = '';
    try { await call('deleteWebhook', { drop_pending_updates: false }, token); } catch (e) { webhookError = e.message; }
    setConf({ tg_bot_token: token, tg_bot_username: me.username || '', tg_bot_id: String(me.id), tg_hook_secret: crypto.randomBytes(24).toString('hex'), tg_poll_error: '' });
    poll.kick();
    return { username: me.username, webhookError };
  }
  async function botStatus() {
    if (!enabled()) return null;
    const out = { username: getConf('tg_bot_username'), webhookOk: false, webhookError: '', pending: 0 };
    try {
      const info = await call('getWebhookInfo', {});
      if (info.url) { await call('deleteWebhook', { drop_pending_updates: false }).catch(() => {}); poll.kick(); } // left over from the webhook version
      out.pending = info.pending_update_count || 0;
      const last = Number(getConf('tg_last_poll')) || 0, err = getConf('tg_poll_error');
      out.webhookOk = !info.url && Date.now() - last < 3 * 60_000 && !err;
      out.webhookError = err ? 'Lỗi nhận tin từ Telegram: ' + err
        : out.webhookOk ? '' : last ? 'Bot chưa nhận tin trong vài phút gần đây — bấm “Kết nối lại”.' : 'Bot đang khởi động — tải lại trang sau ít giây.';
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
    setConf({ tg_bot_token: '', tg_bot_username: '', tg_bot_id: '', tg_hook_secret: '', tg_offset: '0', tg_poll_error: '' });
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

  // a visit that came from a Telegram post: counted for that group (link-preview robots are not people)
  const BOT_UA = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|zalo|slurp|curl|wget|python|headless/i;
  app.get('/v/:id(\\d+)', (req, res, next) => {
    const tid = Number(req.query.tg);
    if (tid > 0 && !BOT_UA.test(req.get('user-agent') || '')) {
      try {
        const vid = Number(req.params.id);
        if (db.prepare('SELECT 1 FROM tg_targets t JOIN videos v ON v.user_id = t.user_id WHERE t.id = ? AND v.id = ?').get(tid, vid)) {
          const did = crypto.createHash('sha1').update((req.ip || '') + '|' + (req.get('user-agent') || '')).digest('hex').slice(0, 16);
          db.prepare('INSERT INTO tg_views (target_id, video_id, day, did, at) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING').run(tid, vid, nowParts().day, did, now());
        }
      } catch (e) { console.error('[telegram] view:', e.message); }
    }
    next();
  });

  // the member's numbers: sent, failed and views, per day and per group, for today / yesterday / the last 7 or 30 days
  app.get('/api/me/telegram/stats', needUser, (req, res) => {
    const uid = req.user.id, range = ['today', 'yesterday', '7', '30'].includes(req.query.range) ? req.query.range : 'today';
    const dayAgo = (n) => nowParts(Date.now() - n * 86400_000).day;
    const from = range === 'today' ? dayAgo(0) : range === 'yesterday' ? dayAgo(1) : dayAgo(Number(range) - 1);
    const to = range === 'yesterday' ? dayAgo(1) : dayAgo(0);
    const targets = db.prepare('SELECT id, title, type, username FROM tg_targets WHERE user_id = ? ORDER BY id').all(uid);
    const sent = db.prepare('SELECT target_id AS t, day, COUNT(*) AS n FROM tg_log WHERE user_id = ? AND ok = 1 AND day BETWEEN ? AND ? GROUP BY target_id, day').all(uid, from, to);
    const failed = db.prepare(`SELECT l.target_id AS t, l.day, COUNT(*) AS n FROM tg_log l WHERE l.user_id = ? AND l.ok = 0 AND l.day BETWEEN ? AND ?
      AND NOT EXISTS (SELECT 1 FROM tg_log s WHERE s.ok = 1 AND s.target_id = l.target_id AND s.video_id = l.video_id AND s.day >= l.day) GROUP BY l.target_id, l.day`).all(uid, from, to);
    const views = db.prepare(`SELECT w.target_id AS t, w.day, COUNT(*) AS n FROM tg_views w JOIN tg_targets g ON g.id = w.target_id
      WHERE g.user_id = ? AND w.day BETWEEN ? AND ? GROUP BY w.target_id, w.day`).all(uid, from, to);
    const days = new Map(), groups = new Map(targets.map((t) => [t.id, { ...t, sent: 0, failed: 0, views: 0 }]));
    const add = (rows, k) => rows.forEach((r) => {
      if (!days.has(r.day)) days.set(r.day, { day: r.day, sent: 0, failed: 0, views: 0 });
      days.get(r.day)[k] += r.n;
      if (groups.has(r.t)) groups.get(r.t)[k] += r.n;
    });
    add(sent, 'sent'); add(failed, 'failed'); add(views, 'views');
    const list = []; // every day of the range, newest first, also the empty ones
    const count = range === '7' ? 7 : range === '30' ? 30 : 1, skip = range === 'yesterday' ? 1 : 0;
    for (let i = 0; i < count; i++) { const d = dayAgo(skip + i); list.push(days.get(d) || { day: d, sent: 0, failed: 0, views: 0 }); }
    const total = list.reduce((a, x) => ({ sent: a.sent + x.sent, failed: a.failed + x.failed, views: a.views + x.views }), { sent: 0, failed: 0, views: 0 });
    const errors = db.prepare(`SELECT l.error, l.at, l.video_id AS videoId, g.title AS target FROM tg_log l JOIN tg_targets g ON g.id = l.target_id
      WHERE l.user_id = ? AND l.ok = 0 AND l.day BETWEEN ? AND ? ORDER BY l.at DESC LIMIT 5`).all(uid, from, to);
    res.json({ range, from, to, total, days: list, groups: [...groups.values()].sort((a, b) => b.views - a.views || b.sent - a.sent), errors });
  });

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

  // ---------- receiving messages: long polling (the webhook route below stays for setups that still point at it) ----------
  const reply = (chatId, text) => call('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }).catch(() => {});
  const poll = (() => {
    let running = false, wake = null, conflicts = 0;
    // The lock value is "expiry:instance". The instance is a random id, not the process id: on the host, separate copies
    // of the app can have the same process id, and then they all believed they held the lock and polled together
    // (Telegram answered 409 "terminated by other getUpdates request").
    const me = crypto.randomBytes(6).toString('hex');
    const take = () => {
      db.prepare("INSERT INTO settings (key, value) VALUES ('tg_poll_lock', '0:0') ON CONFLICT(key) DO NOTHING").run();
      const until = String(Date.now() + 70_000) + ':' + me;
      return db.prepare("UPDATE settings SET value = ? WHERE key = 'tg_poll_lock' AND (CAST(substr(value, 1, instr(value || ':', ':') - 1) AS INTEGER) < ? OR value LIKE ?)").run(until, Date.now(), '%:' + me).changes > 0;
    };
    const sleep = (ms) => new Promise((r) => { wake = r; setTimeout(r, ms).unref(); });
    async function loop() {
      if (running) return; running = true;
      try {
        while (true) {
          if (!enabled() || !take()) { conflicts = 0; await sleep(30_000); continue; }
          try {
            const offset = Number(getConf('tg_offset')) || 0;
            const ups = await call('getUpdates', { offset, timeout: 25, allowed_updates: ['message', 'channel_post', 'my_chat_member'] }, undefined, null, 40_000);
            conflicts = 0;
            setConf({ tg_last_poll: Date.now(), tg_poll_error: '' });
            for (const up of ups) {
              setConf({ tg_offset: up.update_id + 1 }); // move on first, so a broken update is never processed twice
              try { await handleUpdate(up); } catch (e) { console.error('[telegram] update:', e.message); }
            }
          } catch (e) {
            if (e.code === 409) {
              // A single 409 is normal right after the lock moves to this copy (the previous one's request is still open
              // for up to 25 s). Only when it keeps happening is something else reading this bot's messages.
              conflicts++;
              if (conflicts === 1) await call('deleteWebhook', { drop_pending_updates: false }).catch(() => {});
              if (conflicts >= 4) setConf({ tg_poll_error: 'Có một phần mềm hoặc website khác đang dùng cùng bot này để nhận tin (Telegram chỉ cho một nơi nhận tin). Hãy gỡ token bot này khỏi nơi đó, hoặc tạo bot riêng cho xgaigu.', tg_last_poll: Date.now() });
              await sleep(Math.min(120_000, 5_000 * conflicts));
              continue;
            }
            setConf({ tg_poll_error: e.message.slice(0, 200), tg_last_poll: Date.now() });
            await sleep(e.code === 401 ? 300_000 : 10_000);
          }
        }
      } finally { running = false; }
    }
    setTimeout(loop, 3000).unref();
    return { kick() { if (wake) wake(); loop(); } };
  })();
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
    const howTo = `Để tự động đăng video từ xgaigu vào nhóm của bạn:\n1. Vào ${esc(base())}/#/me → “Tự động đăng lên Telegram” và lấy mã.\n2. Thêm @${esc(getConf('tg_bot_username'))} vào nhóm (hoặc làm quản trị viên kênh).\n3. Gửi <code>/connect MÃ</code> trong nhóm/kênh đó.`;
    if (/^\/(ketnoi|huongdan)\b/i.test(text) || /^\/connect\s*$/i.test(text)) return reply(msg.chat.id, howTo);
    const m = /^\/connect(?:@[A-Za-z0-9_]+)?\s+(XG-[A-Z0-9]{6})\b/i.exec(text);
    if (!m) {
      if (await autoReply(msg, text)) return;
      if (/^\/start\b/.test(text) && msg.chat.type === 'private') return reply(msg.chat.id, 'Xin chào! ' + howTo);
      return;
    }
    if (msg.chat.type === 'private') return reply(msg.chat.id, 'Hãy gửi lệnh /connect trong nhóm hoặc kênh muốn nhận video, không phải trong tin nhắn riêng.');
    const code = db.prepare('SELECT * FROM tg_codes WHERE code = ? AND expires_at > ?').get(m[1].toUpperCase(), now());
    if (!code) return reply(msg.chat.id, '❌ Mã kết nối không đúng hoặc đã hết hạn. Hãy lấy mã mới trên trang Tài khoản.');
    const u = userRow(code.user_id);
    if (!allowed(u)) return reply(msg.chat.id, '❌ ' + NOT_ALLOWED);
    try { saveTarget(u.id, msg.chat); } catch (e) { return reply(msg.chat.id, '❌ ' + esc(e.message)); }
    db.prepare('DELETE FROM tg_codes WHERE code = ?').run(code.code);
    return reply(msg.chat.id, `✅ Đã kết nối nhóm này với tài khoản <b>${esc(u.name)}</b> trên xgaigu. Video mới sẽ được tự động đăng vào đây.`);
  }

  // ---------- automatic replies to customers (texts set by the admin) ----------
  // Private chats: a welcome on /start, keyword rules, and a default reply (at most once per person every few hours).
  // Groups (optional): only keyword rules, and only for messages the bot can see — by default Telegram shows a bot just
  // commands, mentions and replies to it, unless its privacy mode is turned off in @BotFather.
  const AR_DEFAULT = { enabled: false, welcome: '', fallback: '', fallbackHours: 6, groups: false, rules: [], buttonText: '', buttonUrl: '' };
  const arConf = () => { let s = {}; try { s = JSON.parse(getConf('tg_autoreply') || '{}') || {}; } catch {} return { ...AR_DEFAULT, ...s }; };
  const fold = (s) => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
  function readAutoReply(b) {
    const txt = (v, n) => String(v || '').replace(/\r/g, '').slice(0, n).trim();
    const rules = (Array.isArray(b.rules) ? b.rules : []).map((r) => ({ keys: txt(r.keys, 300), reply: txt(r.reply, 2000) })).filter((r) => r.keys && r.reply).slice(0, 30);
    const url = txt(b.buttonUrl, 300);
    return {
      enabled: !!b.enabled, welcome: txt(b.welcome, 2000), fallback: txt(b.fallback, 2000),
      fallbackHours: Math.min(168, Math.max(0, Math.round(Number(b.fallbackHours) || 0))), groups: !!b.groups, rules,
      buttonText: url ? txt(b.buttonText, 40) || 'Vào xgaigu' : '', buttonUrl: /^https:\/\/\S+$/.test(url) ? url : '',
    };
  }
  // which reply a message gets: { kind, text } or null
  function pickReply(c, text, isPrivate) {
    const t = fold(text);
    if (isPrivate && /^\/start\b/.test(t)) return c.welcome ? { kind: 'welcome', text: c.welcome } : null;
    for (const [i, r] of c.rules.entries()) {
      const keys = r.keys.split(/[,;\n]/).map(fold).filter(Boolean);
      if (keys.some((k) => t.includes(k))) return { kind: 'rule' + i, text: r.reply };
    }
    return isPrivate && c.fallback ? { kind: 'fallback', text: c.fallback } : null;
  }
  const fill = (s, from) => esc(s).replace(/\{ten\}/gi, esc((from && (from.first_name || from.username)) || 'bạn')).replace(/\{website\}/gi, esc(base() || 'xgaigu.com'));
  async function autoReply(msg, text) {
    const c = arConf();
    if (!c.enabled || !msg.chat || msg.chat.type === 'channel' || (msg.from && msg.from.is_bot)) return false;
    const isPrivate = msg.chat.type === 'private';
    if (!isPrivate && !c.groups) return false;
    const r = pickReply(c, text, isPrivate);
    if (!r) return false;
    // no flooding: the default reply once per person per N hours, the same keyword reply once per person per 2 minutes,
    // and nothing faster than one reply every 3 seconds per person
    const who = String(msg.from ? msg.from.id : msg.chat.id), chat = String(msg.chat.id);
    // times are those of the messages, so a backlog read after a restart is judged as the customer sent it
    const at = msg.date ? msg.date * 1000 : Date.now();
    const last = (kind) => (db.prepare('SELECT at FROM tg_ar_seen WHERE chat_id = ? AND user_id = ? AND kind = ?').get(chat, who, kind) || {}).at || 0;
    if (at - last('any') < 3000) return true;
    if (r.kind === 'fallback' && at - last('fallback') < c.fallbackHours * 3600_000) return true;
    if (r.kind.startsWith('rule') && at - last(r.kind) < 120_000) return true;
    if (Date.now() - at > 24 * 3600_000) return true; // too old to answer
    const mark = (kind) => db.prepare('INSERT INTO tg_ar_seen (chat_id, user_id, kind, at) VALUES (?,?,?,?) ON CONFLICT(chat_id, user_id, kind) DO UPDATE SET at = excluded.at').run(chat, who, kind, at);
    mark('any'); mark(r.kind);
    const params = { chat_id: msg.chat.id, text: fill(r.text, msg.from), parse_mode: 'HTML', disable_web_page_preview: false };
    if (!isPrivate) params.reply_parameters = { message_id: msg.message_id, allow_sending_without_reply: true };
    if (c.buttonUrl) params.reply_markup = { inline_keyboard: [[{ text: c.buttonText, url: c.buttonUrl }]] };
    try {
      await call('sendMessage', params);
      const day = nowParts().day; let st = {}; try { st = JSON.parse(getConf('tg_ar_stats') || '{}'); } catch {}
      setConf({ tg_ar_stats: JSON.stringify(st.day === day ? { day, n: st.n + 1, total: (st.total || 0) + 1 } : { day, n: 1, total: (st.total || 0) + 1 }) });
    } catch (e) { console.error('[telegram] auto reply:', e.message); }
    return true;
  }
  app.get('/api/admin/telegram-autoreply', needAdmin, (_req, res) => {
    let st = {}; try { st = JSON.parse(getConf('tg_ar_stats') || '{}'); } catch {}
    res.json({ autoreply: arConf(), today: st.day === nowParts().day ? st.n : 0, total: st.total || 0, bot: getConf('tg_bot_username') });
  });
  app.put('/api/admin/telegram-autoreply', needAdmin, (req, res) => {
    const c = readAutoReply(req.body || {});
    if (c.enabled && !c.welcome && !c.fallback && !c.rules.length) return fail(res, 400, 'Hãy nhập ít nhất lời chào, câu trả lời mặc định hoặc một quy tắc từ khoá');
    setConf({ tg_autoreply: JSON.stringify(c) });
    res.json({ ok: true, autoreply: c });
  });
  // "what would the bot answer?" for the admin page (uses the settings sent, saved or not)
  app.post('/api/admin/telegram-autoreply/test', needAdmin, (req, res) => {
    const c = readAutoReply(req.body.autoreply || {}), text = String(req.body.text || '').slice(0, 500);
    const r = pickReply(c, text, req.body.where !== 'group');
    res.json({ reply: r ? fill(r.text, { first_name: 'Lan' }).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : null, kind: r ? r.kind : null });
  });

  // ---------- queue: limits, schedules, distribution ----------
  const getPrefs =(uid) => ({ ...DEFAULT_PREFS, ...(db.prepare('SELECT * FROM tg_prefs WHERE user_id = ?').get(uid) || {}), user_id: uid });

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
    const where = [v.district, v.province, (v.country && v.country !== 'VN' ? (() => { try { return new Intl.DisplayNames(['vi'], { type: 'region' }).of(v.country); } catch { return v.country; } })() : '')].filter(Boolean).join(', ');
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
    const url = base() + '/v/' + v.id + (target.id ? '?tg=' + target.id : '');
    const tail = `\n\n👉 <b>Nhấp vào link để xem video:</b>\n${esc(url)}`;
    // Telegram allows 1024 characters under a photo: shorten the description until it fits
    let caption = '';
    for (const n of [400, 250, 150, 80, 0]) { caption = summary(v, owner, n) + tail; if (caption.length <= 1000) break; }
    if (caption.length > 1000) caption = `🎬 <b>${esc(v.nickname || owner.name)}</b>` + tail;
    const params = { chat_id: target.chat_id, parse_mode: 'HTML' };
    if (url.startsWith('https://')) params.reply_markup = { inline_keyboard: [[{ text: '▶ Xem video ngay', url }]] };
    // the video's cover, else a frame picked from the video, else a designed card; Telegram's own preview as a last resort
    const photo = localFile(v.thumb) || (thumbs ? await thumbs.pictureFile(v.id).catch(() => '') : '');
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
      db.prepare('INSERT INTO tg_log (user_id, target_id, video_id, day, ok, at) VALUES (?,?,?,?,1,?)').run(row.user_id, t.id, v.id, nowParts().day, now());
      db.prepare("UPDATE tg_queue SET status = 'sent', sent_day = ?, sent_at = ?, error = '' WHERE id = ?").run(day, now(), row.id);
      db.prepare("UPDATE tg_targets SET last_post_at = ?, last_error = '' WHERE id = ?").run(now(), t.id);
      return true;
    } catch (e) {
      const gone = e.code === 403 || /chat not found|kicked|not a member/i.test(e.message); // bot removed, blocked, or the group is gone
      const d = nowParts().day;
      if (!db.prepare('SELECT 1 FROM tg_log WHERE target_id = ? AND video_id = ? AND day = ? AND ok = 0').get(t.id, v.id, d))
        db.prepare('INSERT INTO tg_log (user_id, target_id, video_id, day, ok, error, at) VALUES (?,?,?,?,0,?,?)').run(row.user_id, t.id, v.id, d, e.message.slice(0, 250), now());
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
        db.prepare('DELETE FROM tg_log WHERE day < ?').run(nowParts(Date.now() - 95 * 86400_000).day);
        db.prepare('DELETE FROM tg_views WHERE day < ?').run(nowParts(Date.now() - 95 * 86400_000).day);
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
