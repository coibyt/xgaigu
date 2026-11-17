// xgaigu – admin card: the Telegram bot shares links to area pages in the admin's own groups at fixed times.
(() => {
const { h, api, toast, fail } = window.XG;

function card() {
  const el = h('div', { class: 'card tg-ar' });
  const load = async () => {
    let d; try { d = await api('/admin/tg-areas'); } catch (e) { el.replaceChildren(h('p', { class: 'muted' }, e.message)); return; }
    const c = d.conf;
    const box = (v) => h('input', { type: 'checkbox', checked: !!v, class: 'tg-chk' });
    const enabled = box(c.enabled), preview = box(c.preview);
    // groups (none ticked in the saved settings = all of them)
    const picked = new Set(c.targets.length ? c.targets : d.targets.map((t) => t.id));
    const groups = d.targets.length ? h('div', { class: 'tg-ap-list' }, d.targets.map((t) => h('label', { class: 'tg-inline' },
      h('input', { type: 'checkbox', class: 'tg-chk', checked: picked.has(t.id), onchange: (e) => { if (e.target.checked) picked.add(t.id); else picked.delete(t.id); } }),
      (t.type === 'channel' ? '📢 ' : '👥 ') + t.title + (t.active ? '' : ' (đang tạm dừng)'))))
      : h('div', { class: 'notice' }, 'Chưa có nhóm nào. Hãy vào trang Tài khoản của admin → "Tự động đăng lên Telegram" → "Kết nối nhóm / kênh", rồi quay lại đây.');
    // times
    let times = [...c.times];
    const timeList = h('div', { class: 'tg-times' }), newTime = h('input', { type: 'time', value: '12:00' });
    const paintTimes = () => timeList.replaceChildren(...times.map((t) => h('span', { class: 'tg-time' }, '⏰ ' + t, h('button', { type: 'button', 'aria-label': 'Bỏ giờ ' + t, onclick: () => { times = times.filter((x) => x !== t); paintTimes(); } }, '×'))),
      times.length < 12 ? h('span', { class: 'tg-addtime' }, newTime, h('button', { type: 'button', class: 'btn sm', onclick: () => { const v = newTime.value; if (v && !times.includes(v)) { times = [...times, v].sort(); paintTimes(); } } }, '+ Thêm giờ')) : '');
    paintTimes();
    const perRun = h('input', { type: 'number', min: 1, max: 20, value: c.perRun, class: 'tg-num' });
    // areas
    let scope = c.scope;
    const chosen = new Set(c.areas);
    const count = h('small', { class: 'muted' }, chosen.size + ' khu vực đã chọn');
    const filter = h('input', { placeholder: 'Tìm khu vực…', style: 'margin-bottom:8px' });
    const areaList = h('div', { class: 'tg-ap-areas' });
    const paintAreas = () => {
      const q = filter.value.trim().toLowerCase();
      areaList.replaceChildren(...d.areas.filter((a) => !q || (a.title + ' ' + a.name + ' ' + a.group).toLowerCase().includes(q)).slice(0, 300).map((a) => h('label', { class: 'tg-inline' },
        h('input', { type: 'checkbox', class: 'tg-chk', checked: chosen.has(a.key), onchange: (e) => { if (e.target.checked) chosen.add(a.key); else chosen.delete(a.key); count.textContent = chosen.size + ' khu vực đã chọn'; } }),
        a.title, h('small', { class: 'muted' }, ' · ' + (a.level === 'region' || a.level === 'country' ? '' : a.group + ' · ') + a.n + ' video'))));
    };
    filter.addEventListener('input', paintAreas);
    const someBox = h('div', { hidden: scope !== 'some' }, filter, areaList, count);
    paintAreas();
    const nm = 'tgap' + Math.random().toString(36).slice(2, 6);
    const opt = (val, label) => h('label', { class: 'tg-inline' }, h('input', { type: 'radio', name: nm, checked: scope === val, onchange: () => { scope = val; someBox.hidden = scope !== 'some'; } }), label);
    // message
    const tpl = h('textarea', { rows: 4, maxlength: 1500 }); tpl.value = c.template;
    const prevBox = h('pre', { class: 'tg-ap-prev', hidden: true });
    const showPrev = async () => { try { const r = await api('/admin/tg-areas/preview', { method: 'POST', body: { template: tpl.value } }); prevBox.textContent = r.text; prevBox.hidden = false; } catch (e) { fail(e); } };
    const body = () => ({ enabled: enabled.checked, preview: preview.checked, targets: [...picked], scope, areas: [...chosen], times, perRun: perRun.value, template: tpl.value });
    const save = h('button', { type: 'button', class: 'btn primary', onclick: async () => {
      try { await api('/admin/tg-areas', { method: 'PUT', body: body() }); toast(enabled.checked ? 'Đã lưu, bot sẽ tự đăng link khu vực theo giờ đã chọn' : 'Đã lưu (chức năng đang tắt)'); load(); } catch (e) { fail(e); }
    } }, 'Lưu cài đặt');
    const now = h('button', { type: 'button', class: 'btn', onclick: async (ev) => {
      ev.target.disabled = true;
      try {
        await api('/admin/tg-areas', { method: 'PUT', body: body() });
        const r = await api('/admin/tg-areas/post-now', { method: 'POST', body: { count: 1 } });
        toast(r.sent ? 'Đã đăng ' + r.areas.join(', ') + ' (' + r.sent + ' tin)' : 'Chưa đăng được: ' + (r.error || 'không rõ lỗi'), !r.sent);
        load();
      } catch (e) { fail(e); ev.target.disabled = false; }
    } }, '🚀 Đăng thử 1 khu vực ngay');
    const last = d.last ? h('p', { class: 'muted', style: 'font-size:13px' }, 'Lần đăng gần nhất: ' + new Date(d.last.at).toLocaleString('vi-VN') + ' · ' + d.last.sent + ' tin' + (d.last.areas.length ? ' · ' + d.last.areas.join(', ') : '') + (d.last.error ? ' · ⚠ ' + d.last.error : '')) : '';
    el.replaceChildren(
      h('div', { class: 'tg-btitle' }, h('h4', {}, '📍 Tự động đăng link khu vực'), h('label', { class: 'tg-inline' }, enabled, 'Bật')),
      h('p', { class: 'muted', style: 'font-size:13.5px' }, 'Bot tự đăng link các trang khu vực (VD xgaigu.com/khu-vuc/quoc-gia/thai-lan/phuket) vào các nhóm Telegram của tài khoản admin, kèm vài dòng giới thiệu. Mỗi lần đăng vài khu vực, lần lượt xoay vòng hết danh sách rồi quay lại từ đầu. Telegram tự hiện ảnh đại diện của khu vực dưới link.'),
      h('div', { class: 'tg-field' }, h('div', { class: 'tg-label' }, 'Đăng vào nhóm'), groups),
      h('div', { class: 'tg-field' }, h('div', { class: 'tg-label' }, 'Giờ đăng mỗi ngày'), timeList, h('label', { class: 'tg-inline' }, 'Mỗi lần đăng ', perRun, ' khu vực')),
      h('div', { class: 'tg-field' }, h('div', { class: 'tg-label' }, 'Khu vực'), opt('all', 'Tất cả khu vực có video (' + d.areas.length + ')'), opt('some', 'Chỉ những khu vực tôi chọn'), someBox),
      h('div', { class: 'tg-field' }, h('div', { class: 'tg-label' }, 'Nội dung tin'), tpl,
        h('small', { class: 'muted' }, 'Dùng: {khu vực} = tên khu vực (có từ khóa riêng), {mô tả} = mô tả SEO, {số video}, {link} = link khu vực.'),
        h('label', { class: 'tg-inline' }, preview, 'Hiện ảnh xem trước dưới link'),
        h('button', { type: 'button', class: 'btn sm', onclick: showPrev, style: 'justify-self:start' }, 'Xem trước nội dung'), prevBox),
      h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, save, now), last);
  };
  load();
  return el;
}

window.XGTeleAreas = { card };
})();
