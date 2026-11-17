// The bot shares links to area pages (/khu-vuc/...) in the admin's own Telegram groups, at the admin's times every day:
// a few areas per run, taking turns through the list, as a short text with the link (Telegram shows the area's
// picture from the page by itself). Several Node processes may run this: each time slot is claimed in the database first.
const DEFAULTS = {
  enabled: false, targets: [], scope: 'all', areas: [], times: ['09:00', '20:00'], perRun: 3, preview: true, distribute: 'split',
  template: '📍 {khu vực}\n{mô tả}\n\n👉 Xem video tại đây: {link}',
};
const nowParts = (t = Date.now()) => { const d = new Date(t + 7 * 3600_000).toISOString(); return { day: d.slice(0, 10), hm: d.slice(11, 16) }; };
const parseTimes = (list) => [...new Set((Array.isArray(list) ? list : String(list || '').split(/[,;\s]+/)).map((t) => {
  const m = /^(\d{1,2})[:h.](\d{2})$/.exec(String(t).trim());
  return m && Number(m[1]) < 24 && Number(m[2]) < 60 ? String(Number(m[1])).padStart(2, '0') + ':' + m[2] : null;
}).filter(Boolean))].sort().slice(0, 12);

function install(app, { db, needAdmin, fail, tg, areas }) {
  const getConf = (k) => { const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(k); return r ? r.value : ''; };
  const setConf = (k, v) => db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(k, String(v));
  const conf = () => { let c = {}; try { c = JSON.parse(getConf('tg_area_post') || '{}') || {}; } catch {} return { ...DEFAULTS, ...c }; };
  const adminTargets = () => db.prepare(`SELECT t.id, t.chat_id, t.title, t.type, t.active, t.user_id FROM tg_targets t JOIN users u ON u.id = t.user_id
    WHERE u.role = 'admin' ORDER BY t.id`).all();

  function message(area, c) {
    const link = tg.base() + area.path;
    const text = String(c.template || DEFAULTS.template)
      .replace(/\{\s*khu vực\s*\}/gi, area.title).replace(/\{\s*mô tả\s*\}/gi, area.description)
      .replace(/\{\s*số video\s*\}/gi, String(area.n)).replace(/\{\s*link\s*\}/gi, link);
    return { text: /\{\s*link\s*\}/i.test(c.template || DEFAULTS.template) ? text : text + '\n' + link, link };
  }
  // the next areas in turn
  function nextAreas(c, count) {
    let list = areas();
    if (c.scope === 'some') { const keep = new Set(c.areas); list = list.filter((a) => keep.has(a.key)); }
    if (!list.length) return [];
    const start = Number(getConf('tg_area_cursor')) || 0, out = [];
    for (let i = 0; i < Math.min(count, list.length); i++) out.push(list[(start + i) % list.length]);
    setConf('tg_area_cursor', (start + out.length) % list.length);
    return out;
  }
  async function postBatch(c, count) {
    const ids = new Set(c.targets.map(Number));
    const targets = adminTargets().filter((t) => t.active && (!ids.size || ids.has(t.id)));
    if (!targets.length) throw new Error('Chưa có nhóm nào để đăng. Hãy kết nối nhóm Telegram bằng tài khoản admin (trang Tài khoản → Tự động đăng lên Telegram).');
    // "split": every group gets its own areas (no link posted in two groups in the same run); "same": all groups get the same
    const split = c.distribute === 'split';
    const list = nextAreas(c, split ? count * targets.length : count);
    if (!list.length) throw new Error('Chưa có khu vực nào để đăng.');
    const plan = targets.map((t, i) => ({ t, areas: split ? list.filter((_, j) => j % targets.length === i) : list }));
    let sent = 0, last = '';
    const posted = [];
    for (const { t, areas: mine } of plan) {
      for (const area of mine) {
        const { text, link } = message(area, c);
        try {
          await tg.call('sendMessage', { chat_id: t.chat_id, text, link_preview_options: c.preview ? { url: link, prefer_large_media: true } : { is_disabled: true } });
          sent++;
          posted.push(split ? area.title + ' → ' + t.title : area.title);
        } catch (e) { last = t.title + ': ' + e.message; }
        await new Promise((r) => setTimeout(r, 1200)); // stay well under Telegram's limits
      }
    }
    const shown = [...new Set(posted)];
    setConf('tg_area_last', JSON.stringify({ at: Date.now(), sent, areas: shown, error: last }));
    return { sent, areas: shown, error: last };
  }

  // scheduled runs: once per time slot, claimed so only one process posts
  let running = false;
  async function tick() {
    if (running || !tg.enabled()) return;
    const c = conf();
    if (!c.enabled) return;
    const at = nowParts(), due = parseTimes(c.times).filter((t) => t <= at.hm);
    if (!due.length) return;
    const slot = at.day + ' ' + due[due.length - 1];
    db.prepare("INSERT INTO settings (key, value) VALUES ('tg_area_slot', '') ON CONFLICT(key) DO NOTHING").run();
    if (!db.prepare("UPDATE settings SET value = ? WHERE key = 'tg_area_slot' AND value < ?").run(slot, slot).changes) return;
    running = true;
    try { await postBatch(c, c.perRun); } catch (e) { setConf('tg_area_last', JSON.stringify({ at: Date.now(), sent: 0, areas: [], error: e.message })); } finally { running = false; }
  }
  setInterval(() => tick().catch(() => {}), 60_000).unref();

  // ---------- admin ----------
  app.get('/api/admin/tg-areas', needAdmin, (_req, res) => {
    let last = null; try { last = JSON.parse(getConf('tg_area_last') || 'null'); } catch {}
    res.json({ conf: conf(), targets: adminTargets().map((t) => ({ id: t.id, title: t.title, type: t.type, active: !!t.active })),
      areas: areas().map((a) => ({ key: a.key, title: a.title, name: a.name, group: a.group, level: a.level, n: a.n })), last, botOn: tg.enabled() });
  });
  app.put('/api/admin/tg-areas', needAdmin, (req, res) => {
    const b = req.body || {}, cur = conf();
    const c = {
      enabled: !!b.enabled, preview: b.preview !== false, distribute: b.distribute === 'same' ? 'same' : 'split',
      targets: (Array.isArray(b.targets) ? b.targets : []).map(Number).filter((n) => n > 0).slice(0, 100),
      scope: b.scope === 'some' ? 'some' : 'all',
      areas: [...new Set((Array.isArray(b.areas) ? b.areas : []).map((k) => String(k).slice(0, 200)))].slice(0, 1000),
      times: parseTimes(b.times), perRun: Math.max(1, Math.min(20, parseInt(b.perRun, 10) || 3)),
      template: String(b.template || '').replace(/\r/g, '').trim().slice(0, 1500) || DEFAULTS.template,
    };
    if (c.enabled && !c.times.length) return fail(res, 400, 'Hãy chọn ít nhất một giờ đăng mỗi ngày');
    setConf('tg_area_post', JSON.stringify(c));
    // turning it on (or changing the times) does not post the times that already passed today
    if (c.enabled && (!cur.enabled || JSON.stringify(cur.times) !== JSON.stringify(c.times))) {
      const at = nowParts(), due = c.times.filter((t) => t <= at.hm);
      setConf('tg_area_slot', due.length ? at.day + ' ' + due[due.length - 1] : '');
    }
    res.json({ ok: true, conf: c });
  });
  app.post('/api/admin/tg-areas/post-now', needAdmin, async (req, res) => {
    if (!tg.enabled()) return fail(res, 400, 'Bot Telegram chưa được cài');
    try { res.json(await postBatch(conf(), Math.max(1, Math.min(10, parseInt(req.body && req.body.count, 10) || 1)))); } catch (e) { fail(res, 400, e.message); }
  });
  app.post('/api/admin/tg-areas/preview', needAdmin, (req, res) => {
    const list = areas(), a = list.find((x) => x.key === (req.body && req.body.key)) || list[0];
    if (!a) return fail(res, 400, 'Chưa có khu vực nào');
    res.json({ text: message(a, { ...conf(), template: (req.body && req.body.template) || conf().template }).text });
  });
}

module.exports = { install };
