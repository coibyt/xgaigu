// One-off patch: admins can edit, hide, ban (cấm xuất bản) or delete any member's video.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---------- db ----------
rep('src/db.js', "  ['views', 'views INTEGER DEFAULT 0'],\n]) if (!videoCols", "  ['views', 'views INTEGER DEFAULT 0'],\n  ['locked', 'locked INTEGER DEFAULT 0'],\n  ['mod_note', \"mod_note TEXT DEFAULT ''\"],\n]) if (!videoCols");

// ---------- server ----------
rep('server.js', "app.post('/api/admin/videos/:id/hide', needAdmin,", `// Video moderation: status is "visible", "hidden" (admin hid it, can be shown again) or "banned" (cấm xuất bản, with a reason).
const adminVideoRow = (id) => {
  const r = db.prepare(
    \`SELECT v.*, u.email AS u_email, u.name AS u_name,
       (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id) AS likes, (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) AS comments
     FROM videos v JOIN users u ON u.id = v.user_id WHERE v.id = ?\`).get(id);
  if (!r) return null;
  let info = {}; try { info = JSON.parse(r.info || '{}'); } catch {}
  return { id: r.id, caption: r.caption, nickname: r.nickname, phone: r.v_phone, file: r.file, url: r.url, thumb: r.thumb, region: r.region, province: r.province, district: r.district,
    info, views: r.views || 0, likes: r.likes, comments: r.comments, created_at: r.created_at, status: r.locked ? 'banned' : r.hidden ? 'hidden' : 'visible', note: r.mod_note || '',
    owner: { id: r.user_id, email: r.u_email, name: r.u_name } };
};
app.get('/api/admin/videos', needAdmin, (req, res) => {
  const q = '%' + String(req.query.q || '').toLowerCase().replace(/[%_]/g, '').slice(0, 60) + '%';
  const st = { visible: 'v.hidden = 0 AND v.locked = 0', hidden: 'v.hidden = 1 AND v.locked = 0', banned: 'v.locked = 1' }[req.query.status] || '1 = 1';
  const page = Math.max(parseInt(req.query.page, 10) || 0, 0), size = 20;
  const where = \`\${st} AND (lower(v.caption) LIKE ? OR lower(v.nickname) LIKE ? OR lower(u.email) LIKE ? OR CAST(v.id AS TEXT) = ?)\`;
  const idq = String(req.query.q || '').trim();
  const total = db.prepare(\`SELECT COUNT(*) AS n FROM videos v JOIN users u ON u.id = v.user_id WHERE \${where}\`).get(q, q, q, idq).n;
  const ids = db.prepare(\`SELECT v.id FROM videos v JOIN users u ON u.id = v.user_id WHERE \${where} ORDER BY v.id DESC LIMIT ? OFFSET ?\`).all(q, q, q, idq, size, page * size);
  res.json({ videos: ids.map((x) => adminVideoRow(x.id)), total, page, size });
});
app.get('/api/admin/videos/:id(\\\\d+)', needAdmin, (req, res) => {
  const v = adminVideoRow(req.params.id);
  if (!v) return fail(res, 404, 'Không tìm thấy video');
  res.json({ video: v });
});
app.post('/api/admin/videos/:id(\\\\d+)/status', needAdmin, (req, res) => {
  const status = req.body.status;
  if (!['visible', 'hidden', 'banned'].includes(status)) return fail(res, 400, 'Trạng thái không hợp lệ');
  if (!db.prepare('SELECT 1 FROM videos WHERE id = ?').get(req.params.id)) return fail(res, 404, 'Không tìm thấy video');
  db.prepare('UPDATE videos SET hidden = ?, locked = ?, mod_note = ? WHERE id = ?')
    .run(status === 'visible' ? 0 : 1, status === 'banned' ? 1 : 0, status === 'visible' ? '' : clean(req.body.note, 300), req.params.id);
  res.json({ ok: true, video: adminVideoRow(req.params.id) });
});
app.put('/api/admin/videos/:id(\\\\d+)', needAdmin, (req, res) => {
  const v = db.prepare('SELECT id FROM videos WHERE id = ?').get(req.params.id);
  if (!v) return fail(res, 404, 'Không tìm thấy video');
  const area = readArea(req.body);
  if (!area.region || !area.province) return fail(res, 400, 'Vui lòng chọn miền và tỉnh/thành');
  db.prepare('UPDATE videos SET caption = ?, nickname = ?, v_phone = ?, region = ?, province = ?, district = ?, info = ? WHERE id = ?')
    .run(clean(req.body.caption, 300), clean(req.body.nickname, 40), clean(req.body.phone, 20).replace(/[^\\d+]/g, ''), area.region, area.province, area.district, JSON.stringify(readInfo(req.body)), v.id);
  res.json({ ok: true, video: adminVideoRow(v.id) });
});
app.post('/api/admin/videos/:id/hide', needAdmin,`);

// ---------- client: shared moderation dialog ----------
rep('public/js/app.js', "async function pageAdmin() {", `// Admin: edit / hide / ban / delete a member's video. onChange runs after any change so the caller can refresh.
async function adminVideoDialog(id, onChange) {
  let v;
  try { v = (await api('/admin/videos/' + id)).video; } catch (e) { return fail(e); }
  const STATUS = { visible: 'Đang hiển thị', hidden: 'Đã ẩn', banned: 'Bị cấm xuất bản' };
  const geo = geoPicker();
  const input = (name, label, val, attrs = {}) => h('label', { class: 'f' }, h('span', {}, label), h('input', { name, value: val == null ? '' : val, ...attrs }));
  const i = v.info || {};
  const f = h('form', {},
    h('label', { class: 'f' }, h('span', {}, 'Nội dung / tiêu đề'), h('textarea', { name: 'caption', rows: 2, maxlength: 300 }, v.caption || '')),
    h('div', { class: 'two' }, input('nickname', 'Biệt danh', v.nickname, { maxlength: 40 }), input('phone', 'Số điện thoại', v.phone, { maxlength: 20, inputmode: 'tel' })),
    h('div', { class: 'f' }, h('span', { style: 'display:block;margin-bottom:6px;font-size:14px;font-weight:600' }, 'Khu vực'), geo.el),
    h('div', { class: 'two' }, input('birthYear', 'Năm sinh', i.birthYear, { inputmode: 'numeric' }), input('occupation', 'Nghề nghiệp', i.occupation, { maxlength: 60 })),
    h('div', { class: 'two' }, input('height', 'Chiều cao (cm)', i.height, { inputmode: 'numeric' }), input('weight', 'Cân nặng (kg)', i.weight, { inputmode: 'numeric' })),
    input('origin', 'Xuất xứ', i.origin, { maxlength: 60 }), input('address', 'Địa chỉ', i.address, { maxlength: 200 }), input('workTime', 'Thời gian rảnh', i.workTime, { maxlength: 120 }),
    input('interests', 'Sở thích (cách nhau bằng dấu phẩy)', (i.interests || []).join(', ')),
    h('label', { class: 'f' }, h('span', {}, 'Điều không muốn'), h('textarea', { name: 'boundaries', rows: 2, maxlength: 300 }, i.boundaries || '')),
    h('button', { class: 'btn primary', type: 'submit', style: 'width:100%' }, 'Lưu chỉnh sửa'));
  const statusLine = h('p', { class: 'sub' });
  const paint = () => { statusLine.textContent = '#' + v.id + ' · ' + v.owner.email + ' · ' + STATUS[v.status] + (v.note ? ' — ' + v.note : '') + ' · ' + v.views + ' lượt xem'; };
  paint();
  const note = h('input', { placeholder: 'Lý do (không bắt buộc, chỉ admin thấy)', maxlength: 300 });
  const setStatus = async (status) => {
    if (status === 'banned' && !confirm('Cấm xuất bản video này? Video sẽ bị gỡ khỏi website.')) return;
    try { v = (await api('/admin/videos/' + v.id + '/status', { method: 'POST', body: { status, note: note.value } })).video; paint(); toast(STATUS[v.status]); onChange && onChange(); } catch (e) { fail(e); }
  };
  const m = modal(h('div', {}, h('h3', {}, 'Quản lý video'), statusLine,
    h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap;margin-bottom:10px' },
      h('a', { class: 'btn sm', href: '#/feed/' + v.id, onclick: () => m.close() }, 'Xem video'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => setStatus('visible') }, 'Hiện lại'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => setStatus('hidden') }, 'Ẩn video'),
      h('button', { class: 'btn sm live', type: 'button', onclick: () => setStatus('banned') }, 'Cấm xuất bản'),
      h('button', { class: 'btn sm live', type: 'button', onclick: async () => { if (!confirm('XOÁ vĩnh viễn video này? Không thể khôi phục.')) return; try { await api('/videos/' + v.id, { method: 'DELETE' }); toast('Đã xoá video'); m.close(); onChange && onChange(); } catch (e) { fail(e); } } }, 'Xoá')),
    note, h('div', { style: 'height:12px' }), f), { wide: true });
  // fill the area selects once the region list has loaded
  loadGeo().then((g) => {
    const [reg, prov, dist] = geo.el.querySelectorAll('select');
    const fire = (el) => el.dispatchEvent(new Event('change'));
    if (v.region) { reg.value = v.region; fire(reg); if (v.province) { prov.value = v.province; fire(prov); if (v.district) dist.value = v.district; } }
  }).catch(() => {});
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(f));
    const [reg, prov, dist] = geo.el.querySelectorAll('select');
    try {
      v = (await api('/admin/videos/' + v.id, { method: 'PUT', body: { ...fd, region: reg.value, province: prov.value, district: dist.value } })).video;
      toast('Đã lưu'); paint(); onChange && onChange();
    } catch (er) { fail(er); }
  });
}

async function pageAdmin() {`);

// ---------- client: admin page section ----------
rep('public/js/app.js', "  main.append(h('div', { class: 'wrap', style: 'padding:32px 0' }, trafficBox, membersBox, statBox,", `  // video moderation list
  const vBody = h('tbody', {}), vInfo = h('div', { class: 'muted', style: 'margin:10px 0;font-size:14px' }), vPager = h('div', { class: 'row', style: 'gap:8px;margin-top:12px' });
  const vq = h('input', { type: 'search', placeholder: 'Tìm theo nội dung, biệt danh, email chủ video hoặc số ID…', style: 'flex:1;min-width:200px' });
  const vst = h('select', { 'aria-label': 'Trạng thái', style: 'width:auto' }, [['', 'Tất cả video'], ['visible', 'Đang hiển thị'], ['hidden', 'Đã ẩn'], ['banned', 'Bị cấm xuất bản']].map(([a, b]) => h('option', { value: a }, b)));
  let vpage = 0, vqt;
  const BADGE = { visible: ['Hiển thị', '#34d399'], hidden: ['Đã ẩn', '#fbbf24'], banned: ['Bị cấm', '#f43f5e'] };
  const loadVideos = async () => {
    const d = await api('/admin/videos?page=' + vpage + '&status=' + vst.value + '&q=' + encodeURIComponent(vq.value.trim()));
    vInfo.textContent = 'Tổng số video: ' + d.total;
    vBody.replaceChildren(...d.videos.map((x) => h('tr', {},
      h('td', {}, '#' + x.id),
      h('td', {}, x.thumb ? h('img', { src: x.thumb, alt: '', style: 'width:44px;height:58px;object-fit:cover;border-radius:6px;display:block' }) : ''),
      h('td', { translate: 'no', style: 'max-width:220px' }, (x.caption || x.nickname || '(không có nội dung)').slice(0, 80)),
      h('td', { translate: 'no', style: 'word-break:break-all' }, x.owner.email),
      h('td', {}, String(x.views)),
      h('td', {}, h('b', { style: 'color:' + BADGE[x.status][1] }, BADGE[x.status][0])),
      h('td', {}, h('button', { class: 'btn sm', onclick: () => adminVideoDialog(x.id, () => loadVideos().catch(fail)) }, 'Quản lý')))));
    vPager.replaceChildren(vpage > 0 && h('button', { class: 'btn sm', onclick: () => { vpage--; loadVideos(); } }, '← Trước'), (vpage + 1) * d.size < d.total && h('button', { class: 'btn sm', onclick: () => { vpage++; loadVideos(); } }, 'Sau →'));
  };
  const vReload = () => { vpage = 0; loadVideos().catch(fail); };
  vq.addEventListener('input', () => { clearTimeout(vqt); vqt = setTimeout(vReload, 300); }); vst.addEventListener('change', vReload);
  await loadVideos().catch(fail);
  const videosBox = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Quản lý video'), h('div', { class: 'row', style: 'gap:10px;flex-wrap:wrap' }, vq, vst), vInfo,
    h('div', { class: 'card', style: 'overflow:auto' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['ID', '', 'Nội dung', 'Chủ video', 'Lượt xem', 'Trạng thái', ''].map((x) => h('th', {}, x)))), vBody)), vPager);
  main.append(h('div', { class: 'wrap', style: 'padding:32px 0' }, trafficBox, videosBox, membersBox, statBox,`);

// ---------- client: shortcut inside the video info sheet ----------
rep('public/js/app.js', "    h('div', { class: 'row', style: 'margin-top:14px' },\n      v.hasPhone &&", "    h('div', { class: 'row', style: 'margin-top:14px' },\n      S.user && S.user.role === 'admin' && h('button', { class: 'btn sm', type: 'button', onclick: () => adminVideoDialog(v.id), html: icon('flag') + 'Quản lý video (admin)' }),\n      v.hasPhone &&");
console.log('patched');
