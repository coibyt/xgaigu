// One-off patch: members can edit their own videos and hide them (only they can see a hidden video); only admins can delete.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---------- db ----------
rep('src/db.js', "  ['badge', \"badge TEXT DEFAULT ''\"],", "  ['badge', \"badge TEXT DEFAULT ''\"],\n  ['hidden_by', \"hidden_by TEXT DEFAULT ''\"],");

// ---------- server: listVideos lets the owner see a video they hid ----------
rep('server.js', "     WHERE v.hidden = 0 AND u.banned = 0 AND (? IS NULL OR v.user_id = ?) AND (? IS NULL OR v.id < ?)",
  "     WHERE (v.hidden = 0 OR (v.hidden_by = 'owner' AND v.locked = 0 AND v.user_id = ?)) AND u.banned = 0 AND (? IS NULL OR v.user_id = ?) AND (? IS NULL OR v.id < ?)");
rep('server.js', "  ).all(viewer ? viewer.id : 0, Date.now() - DAY_MS, userId ?? null,", "  ).all(viewer ? viewer.id : 0, Date.now() - DAY_MS, viewer && ((userId != null && userId === viewer.id) || id != null) ? viewer.id : 0, userId ?? null,");
rep('server.js', "      badge: badgeOf(r.badge, r.heat, r.created_at), likes:", "      selfHidden: r.hidden === 1, badge: badgeOf(r.badge, r.heat, r.created_at), likes:");

// ---------- server: deleting is admin-only ----------
rep('server.js', "  if (v.user_id !== req.user.id && req.user.role !== 'admin') return fail(res, 403, 'Không có quyền');\n  db.prepare('DELETE FROM videos WHERE id = ?').run(v.id);",
  "  if (req.user.role !== 'admin') return fail(res, 403, 'Chỉ quản trị viên mới được xoá video. Bạn có thể ẩn video để chỉ mình bạn thấy.');\n  db.prepare('DELETE FROM videos WHERE id = ?').run(v.id);");

// ---------- server: shared edit + owner endpoints ----------
rep('server.js', "app.put('/api/admin/videos/:id(\\\\d+)', needAdmin, (req, res) => {\n  const v = db.prepare('SELECT id FROM videos WHERE id = ?').get(req.params.id);\n  if (!v) return fail(res, 404, 'Không tìm thấy video');\n  const area = readArea(req.body);\n  if (!area.region || !area.province) return fail(res, 400, 'Vui lòng chọn miền và tỉnh/thành');\n  db.prepare('UPDATE videos SET caption = ?, nickname = ?, v_phone = ?, region = ?, province = ?, district = ?, info = ? WHERE id = ?')\n    .run(clean(req.body.caption, 300), clean(req.body.nickname, 40), clean(req.body.phone, 20).replace(/[^\\d+]/g, ''), area.region, area.province, area.district, JSON.stringify(readInfo(req.body)), v.id);\n  res.json({ ok: true, video: adminVideoRow(v.id) });\n});",
`const saveVideoEdit = (req, res, id) => {
  const area = readArea(req.body);
  if (!area.region || !area.province) return fail(res, 400, 'Vui lòng chọn miền và tỉnh/thành');
  db.prepare('UPDATE videos SET caption = ?, nickname = ?, v_phone = ?, region = ?, province = ?, district = ?, info = ? WHERE id = ?')
    .run(clean(req.body.caption, 300), clean(req.body.nickname, 40), clean(req.body.phone, 20).replace(/[^\\d+]/g, ''), area.region, area.province, area.district, JSON.stringify(readInfo(req.body)), id);
  res.json({ ok: true, video: adminVideoRow(id) });
};
app.put('/api/admin/videos/:id(\\\\d+)', needAdmin, (req, res) => {
  if (!db.prepare('SELECT 1 FROM videos WHERE id = ?').get(req.params.id)) return fail(res, 404, 'Không tìm thấy video');
  saveVideoEdit(req, res, Number(req.params.id));
});

// ---------- a member's own videos: edit, hide / show (never delete) ----------
const ownVideo = (req, res) => {
  const v = db.prepare('SELECT id, user_id, hidden, hidden_by, locked FROM videos WHERE id = ?').get(req.params.id);
  if (!v || v.user_id !== req.user.id) { fail(res, 404, 'Không tìm thấy video của bạn'); return null; }
  return v;
};
app.get('/api/videos/:id(\\\\d+)/edit', needUser, (req, res) => {
  const v = ownVideo(req, res); if (!v) return;
  const row = adminVideoRow(v.id); delete row.owner; delete row.views; delete row.heat; delete row.note;
  res.json({ video: { ...row, lockedByAdmin: !!v.locked, hiddenByAdmin: v.hidden === 1 && v.hidden_by !== 'owner' } });
});
app.put('/api/videos/:id(\\\\d+)', needUser, postLimiter, (req, res) => {
  const v = ownVideo(req, res); if (!v) return;
  if (v.locked) return fail(res, 403, 'Video này đã bị cấm xuất bản nên không thể chỉnh sửa');
  saveVideoEdit(req, res, v.id);
});
app.post('/api/videos/:id(\\\\d+)/visibility', needUser, postLimiter, (req, res) => {
  const v = ownVideo(req, res); if (!v) return;
  if (v.locked || (v.hidden && v.hidden_by !== 'owner')) return fail(res, 403, 'Video đang bị quản trị viên ẩn hoặc cấm, bạn không thể đổi.');
  const hide = !!req.body.hidden;
  db.prepare("UPDATE videos SET hidden = ?, hidden_by = ? WHERE id = ?").run(hide ? 1 : 0, hide ? 'owner' : '', v.id);
  res.json({ ok: true, hidden: hide });
});`);
// admin status keeps track of who hid it
rep('server.js', "  db.prepare('UPDATE videos SET hidden = ?, locked = ?, mod_note = ? WHERE id = ?')\n    .run(status === 'visible' ? 0 : 1, status === 'banned' ? 1 : 0,",
  "  db.prepare(\"UPDATE videos SET hidden = ?, locked = ?, hidden_by = ?, mod_note = ? WHERE id = ?\")\n    .run(status === 'visible' ? 0 : 1, status === 'banned' ? 1 : 0, status === 'visible' ? '' : 'admin',");
rep('server.js', "status: r.locked ? 'banned' : r.hidden ? 'hidden' : 'visible'", "status: r.locked ? 'banned' : r.hidden ? (r.hidden_by === 'owner' ? 'self' : 'hidden') : 'visible'");
rep('server.js', "hidden: 'v.hidden = 1 AND v.locked = 0', banned:", "hidden: \"v.hidden = 1 AND v.locked = 0 AND v.hidden_by <> 'owner'\", banned:");

// ---------- client: dialog works for owners too ----------
rep('public/js/app.js', "async function adminVideoDialog(id, onChange) {\n  let v;\n  try { v = (await api('/admin/videos/' + id)).video; } catch (e) { return fail(e); }\n  const STATUS = { visible: 'Đang hiển thị', hidden: 'Đã ẩn', banned: 'Bị cấm xuất bản' };",
`async function adminVideoDialog(id, onChange, own = false) {
  let v;
  try { v = (await api(own ? '/videos/' + id + '/edit' : '/admin/videos/' + id)).video; } catch (e) { return fail(e); }
  const STATUS = { visible: 'Đang hiển thị', hidden: 'Đã ẩn', banned: 'Bị cấm xuất bản', self: own ? 'Đang ẩn (chỉ mình bạn thấy)' : 'Chủ video tự ẩn' };`);
rep('public/js/app.js', "  const paint = () => { statusLine.textContent = '#' + v.id + ' · ' + v.owner.email + ' · ' + STATUS[v.status] + (v.note ? ' — ' + v.note : '') + ' · ' + v.views + ' lượt xem'; };",
  "  const paint = () => { statusLine.textContent = own ? STATUS[v.status] + (v.lockedByAdmin ? ' — video đã bị cấm xuất bản' : v.hiddenByAdmin ? ' — đang bị quản trị viên ẩn' : '') : '#' + v.id + ' · ' + v.owner.email + ' · ' + STATUS[v.status] + (v.note ? ' — ' + v.note : '') + ' · ' + v.views + ' lượt xem'; };");
rep('public/js/app.js', "  const m = modal(h('div', {}, h('h3', {}, 'Quản lý video'), statusLine,\n    h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap;margin-bottom:10px' },",
`  const toggleSelf = async () => {
    const hide = v.status === 'visible';
    try { await api('/videos/' + v.id + '/visibility', { method: 'POST', body: { hidden: hide } }); v.status = hide ? 'self' : 'visible'; paint(); selfBtn.textContent = hide ? 'Hiện lại cho mọi người' : 'Ẩn video (chỉ mình tôi thấy)'; toast(hide ? 'Đã ẩn video, chỉ mình bạn thấy' : 'Video đã hiện lại'); onChange && onChange(); } catch (e) { fail(e); }
  };
  const selfBtn = h('button', { class: 'btn sm', type: 'button', onclick: toggleSelf }, v.status === 'visible' ? 'Ẩn video (chỉ mình tôi thấy)' : 'Hiện lại cho mọi người');
  if (own && (v.lockedByAdmin || v.hiddenByAdmin)) selfBtn.disabled = true;
  const ownRow = h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap;margin-bottom:12px' }, h('a', { class: 'btn sm', href: '#/feed/' + v.id, onclick: () => m.close() }, 'Xem video'), selfBtn);
  const m = modal(h('div', {}, h('h3', {}, own ? 'Sửa video của tôi' : 'Quản lý video'), statusLine,
    own ? ownRow : h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap;margin-bottom:10px' },`);
rep('public/js/app.js', "    h('div', { class: 'row', style: 'margin-bottom:10px' }, badgeSel), note, h('div', { style: 'height:12px' }), f), { wide: true });",
  "    own ? null : h('div', { class: 'row', style: 'margin-bottom:10px' }, badgeSel), own ? null : note, h('div', { style: 'height:12px' }), f), { wide: true });");
rep('public/js/app.js', "      v = (await api('/admin/videos/' + v.id, { method: 'PUT', body:", "      v = (await api((own ? '/videos/' : '/admin/videos/') + v.id, { method: 'PUT', body:");
rep('public/js/app.js', "      toast('Đã lưu'); paint(); onChange && onChange();", "      if (own) { v.status = v.status || 'visible'; }\n      toast('Đã lưu'); paint(); onChange && onChange();");

// owner PUT returns adminVideoRow (with owner email etc.) – fine, but keep own flags
rep('public/js/app.js', "      v = (await api((own ? '/videos/' : '/admin/videos/') + v.id, { method: 'PUT', body: { ...fd, region: reg.value, province: prov.value, district: dist.value } })).video;",
  "      const keep = { lockedByAdmin: v.lockedByAdmin, hiddenByAdmin: v.hiddenByAdmin };\n      v = (await api((own ? '/videos/' : '/admin/videos/') + v.id, { method: 'PUT', body: { ...fd, region: reg.value, province: prov.value, district: dist.value } })).video;\n      if (own) Object.assign(v, keep);");

// ---------- client: profile grid + info sheet ----------
rep('public/js/app.js', "    if (me) c.append(h('button', { class: 'iconbtn tdel', 'aria-label': 'Xoá video', html: icon('trash'), onclick: async (e) => { e.preventDefault(); e.stopPropagation(); if (!confirm('Xoá video này?')) return; try { await api('/videos/' + v.id, { method: 'DELETE' }); route(); } catch (er) { fail(er); } } }));",
  "    if (me) c.append(h('button', { class: 'iconbtn tdel', 'aria-label': 'Sửa video', html: '✎', style: 'font-size:18px', onclick: (e) => { e.preventDefault(); e.stopPropagation(); adminVideoDialog(v.id, () => route(), true); } }));\n    if (v.selfHidden) c.append(h('span', { class: 'selfhid' }, 'Đang ẩn'));");
rep('public/js/app.js', "      S.user && S.user.role === 'admin' && h('button', { class: 'btn sm', type: 'button', onclick: () => adminVideoDialog(v.id), html: icon('flag') + 'Quản lý video (admin)' }),",
  "      S.user && S.user.role === 'admin' && h('button', { class: 'btn sm', type: 'button', onclick: () => adminVideoDialog(v.id), html: icon('flag') + 'Quản lý video (admin)' }),\n      S.user && S.user.id === v.user.id && h('button', { class: 'btn sm', type: 'button', onclick: () => adminVideoDialog(v.id, null, true), html: '✎ Sửa / ẩn video của tôi' }),");
rep('public/js/app.js', "const BADGE = { visible: ['Hiển thị', '#34d399'], hidden: ['Đã ẩn', '#fbbf24'], banned: ['Bị cấm', '#f43f5e'] };", "const BADGE = { visible: ['Hiển thị', '#34d399'], hidden: ['Đã ẩn', '#fbbf24'], self: ['Chủ tự ẩn', '#a78bfa'], banned: ['Bị cấm', '#f43f5e'] };");

fs.appendFileSync('public/css/app.css', `
.tcell .selfhid{position:absolute;left:0;right:0;bottom:0;padding:6px;text-align:center;background:rgba(0,0,0,.72);font-size:12px;font-weight:700;color:#fbbf24}
.tcell:has(.selfhid) img,.tcell:has(.selfhid) video{opacity:.45}
`);
console.log('patched');
