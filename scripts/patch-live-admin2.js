// Client side of the admin live switch: admin box, the "switched off" notice, ban notice on the go-live page.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('public/js/live.js', [
  ["rtcConfig, footer, main, S, onLeave } = window.XG;", "rtcConfig, footer, main, S, onLeave, timeAgo } = window.XG;"],
  ["  main.append(h('div', { class: 'lvx' }, h('div', { class: 'wrap', style: 'max-width:720px;padding:28px 0 60px' }, f)));",
   "  main.append(h('div', { class: 'lvx' }, h('div', { class: 'wrap', style: 'max-width:720px;padding:28px 0 60px' }, f)));\n  api('/live/me').then((d) => { if (d.ban) { err.textContent = d.ban.text; err.hidden = false; btn.disabled = true; } }).catch(() => {});"],
  ["h('h3', {}, 'Buổi live đã kết thúc'), h('p', { class: 'muted' }, 'Theo dõi ' + stream.host.name + ' để không bỏ lỡ buổi live sau.'),",
   "h('h3', {}, stream.endedByAdmin ? 'Buổi live đã bị quản trị viên tắt' : 'Buổi live đã kết thúc'),\n      h('p', { class: 'muted' }, stream.endedByAdmin ? (stream.endReason ? 'Lý do: ' + stream.endReason : 'Buổi live vi phạm quy tắc cộng đồng.') : 'Theo dõi ' + stream.host.name + ' để không bỏ lỡ buổi live sau.'),"],
  ["  es.addEventListener('ended', () => { toast('Buổi live đã kết thúc'); setTimeout(() => { if (location.hash.startsWith('#/live/' + id)) location.hash = '#/live'; }, 1500); });",
   `  es.addEventListener('ended', (e) => {
    const d = JSON.parse(e.data || '{}');
    // stop everything right away: the server no longer relays signals, the camera is switched off
    es.close(); peers.forEach((p) => p.close()); peers.clear();
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    stage.querySelectorAll('video, iframe').forEach((m) => { if (m.pause) m.pause(); m.srcObject = null; m.removeAttribute('src'); m.remove(); });
    if (!d.byAdmin) { toast('Buổi live đã kết thúc'); setTimeout(() => { if (location.hash.startsWith('#/live/' + id)) location.hash = '#/live'; }, 1500); return; }
    stage.append(h('div', { class: 'lv-wait' }, h('p', {}, '⛔ Buổi live đã bị quản trị viên tắt')));
    modal(h('div', { class: 'lv-stopped' }, h('div', { class: 'lv-stopped-ico' }, '⛔'),
      h('h3', {}, isHost ? 'Buổi live của bạn đã bị quản trị viên tắt' : 'Buổi live đã bị quản trị viên tắt'),
      d.reason ? h('p', {}, 'Lý do: ' + d.reason) : '',
      h('p', { class: 'muted' }, isHost ? 'Hãy tuân thủ quy tắc cộng đồng khi phát live.' : 'Buổi live này vi phạm quy tắc cộng đồng.'),
      h('a', { class: 'btn primary', href: '#/live' }, 'Xem buổi live khác')));
  });`],
  ["window.XGLive = { pageLive, pageGoLive, pageStream, liveCard };", `// ---------- admin: running lives, switch one off, live bans ----------
const KIND = { webrtc: 'Camera', youtube: 'YouTube', hls: 'HLS / OBS' };
const fmtUntil = (u) => (u.forever ? 'vĩnh viễn' : 'đến ' + new Date(u.until).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
async function adminBox() {
  const count = h('span', { class: 'muted', style: 'font-size:15px;font-weight:500' });
  const box = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:16px' }, '🔴 Livestream đang phát ', count));
  const list = h('div', { class: 'sc-plist' }), bans = h('div');
  const load = async () => {
    const d = await api('/admin/live');
    count.textContent = '(' + d.live.length + ')';
    list.replaceChildren(...(d.live.length ? d.live.map(row) : [h('p', { class: 'muted' }, 'Hiện không có ai đang phát live.')]));
    bans.replaceChildren(...(d.banned.length ? [h('h3', { style: 'margin:20px 0 10px;font-size:16px' }, 'Thành viên đang bị khoá phát live'), h('div', { class: 'sc-plist' }, d.banned.map(banRow))] : []));
  };
  function row(s) {
    const stop = h('button', { type: 'button', class: 'btn sm live', onclick: () => openStop(s) }, 'Tắt live');
    return h('article', { class: 'sc-prow' }, s.thumb ? h('img', { src: s.thumb, alt: '' }) : avatar(s.host, 'lg'),
      h('div', { class: 'sc-pinfo' }, h('a', { href: '#/live/' + s.id }, s.title),
        h('div', { class: 'sc-pmeta' }, h('b', {}, s.host.name), h('span', {}, s.email), h('span', {}, s.kind === 'video' ? (s.loop ? 'Video lặp lại' : 'Phát video') : KIND[s.kind] || s.kind),
          h('span', {}, 'Bắt đầu ' + timeAgo(s.startedAt)), h('span', {}, '👁 ' + fmtCount(s.viewers)), h('span', {}, '🎁 ' + fmtCount(s.gifts)))),
      h('div', { class: 'sc-pact' }, h('a', { class: 'btn sm', href: '#/live/' + s.id }, 'Xem'), stop));
  }
  function banRow(u) {
    const un = h('button', { type: 'button', class: 'btn sm' }, 'Mở khoá');
    un.addEventListener('click', async () => { try { await api('/admin/users/' + u.id + '/live-ban', { method: 'POST', body: { days: 0 } }); toast('Đã mở khoá phát live cho ' + u.name); load(); } catch (e) { fail(e); } });
    return h('article', { class: 'sc-prow' }, avatar(u, 'lg'),
      h('div', { class: 'sc-pinfo' }, h('a', { href: '#/u/' + u.id }, u.name), h('div', { class: 'sc-pmeta' }, h('span', {}, u.email), h('b', {}, 'Khoá ' + fmtUntil(u)), u.reason ? h('span', {}, 'Lý do: ' + u.reason) : '')),
      h('div', { class: 'sc-pact' }, un));
  }
  function openStop(s) {
    const reason = h('input', { maxlength: 200, placeholder: 'VD: Nội dung khiêu dâm, kêu gọi chuyển tiền…', list: 'lva-reasons' });
    const reasons = h('datalist', { id: 'lva-reasons' }, ['Nội dung khiêu dâm, phản cảm', 'Kêu gọi chuyển tiền, lừa đảo', 'Bạo lực, xúc phạm người khác', 'Phát nội dung vi phạm bản quyền', 'Vi phạm quy tắc cộng đồng'].map((r) => h('option', { value: r })));
    const days = h('select', {}, [[0, 'Chỉ tắt buổi live này'], [1, 'Tắt và khoá phát live 1 ngày'], [7, 'Tắt và khoá phát live 7 ngày'], [30, 'Tắt và khoá phát live 30 ngày'], [-1, 'Tắt và khoá phát live vĩnh viễn']].map(([v, l]) => h('option', { value: v }, l)));
    const go = h('button', { type: 'submit', class: 'btn live', style: 'width:100%' }, 'Tắt live ngay');
    const f = h('form', { class: 'lva-stop' }, h('h3', { style: 'margin-bottom:6px' }, 'Tắt buổi live'), h('p', { class: 'muted', style: 'margin-bottom:14px' }, s.host.name + ' · ' + s.title),
      h('label', { class: 'f' }, h('span', {}, 'Lý do (người live và người xem sẽ thấy)'), reason, reasons), h('label', { class: 'f' }, h('span', {}, 'Xử lý'), days),
      h('p', { class: 'muted', style: 'font-size:13px;margin:4px 0 14px' }, 'Buổi live dừng ngay với mọi người xem, camera của người phát bị ngắt. Nếu khoá, họ không thể bắt đầu buổi live mới cho đến khi hết hạn.'), go);
    const m = modal(f);
    f.addEventListener('submit', async (e) => {
      e.preventDefault(); go.disabled = true;
      try { await api('/admin/live/' + s.id + '/stop', { method: 'POST', body: { reason: reason.value.trim(), days: Number(days.value) } }); toast('Đã tắt buổi live của ' + s.host.name); m.close(); load(); }
      catch (ex) { go.disabled = false; fail(ex); }
    });
  }
  const t = setInterval(() => { if (box.isConnected) load().catch(() => {}); else clearInterval(t); }, 15000);
  box.append(list, bans);
  load().catch(fail);
  return box;
}

window.XGLive = { pageLive, pageGoLive, pageStream, liveCard, adminBox };`],
]);

edit('public/js/app.js', [
  ["statBox, await window.XGShop.adminBox(),", "statBox, await window.XGLive.adminBox(), await window.XGShop.adminBox(),"],
]);

fs.appendFileSync('public/css/live.css', `
/* admin: the "live switched off" notice */
.lv-stopped{text-align:center;padding:8px 4px}
.lv-stopped-ico{font-size:44px;margin-bottom:8px}
.lv-stopped h3{margin-bottom:8px}
.lv-stopped p{margin-bottom:10px}
.lva-stop select,.lva-stop input{width:100%}
`);
console.log('client patched');
