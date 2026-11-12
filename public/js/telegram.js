// xgaigu – auto-posting videos to Telegram groups: the member's card on the account page and the admin's bot box.
(() => {
const { h, api, toast, fail, modal: baseModal } = window.XG;
const modal = (content, opts) => { const m = baseModal(content, opts); window.addEventListener('hashchange', () => m.close(), { once: true }); return m; };
const PLANE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.9 4.3 18.6 19.8c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.2-8.3c.4-.4-.1-.6-.6-.2L6 13.4l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6l19.2-7.4c.9-.3 1.7.2 1.4 1.4z"/></svg>';
const thumbOf = (t) => (t ? h('img', { src: t, alt: '', loading: 'lazy' }) : h('span', { class: 'tg-nothumb' }, '🎬'));
const short = (s, n = 70) => { s = String(s || '').trim() || 'Video không có mô tả'; return s.length > n ? s.slice(0, n - 1) + '…' : s; };

// ---------- the member's card (account page) ----------
function accountCard() {
  const card = h('section', { class: 'card tg-card', hidden: true });
  const load = async () => {
    const d = await api('/me/telegram');
    if (!d.enabled) { card.hidden = true; return; }
    card.hidden = false;
    const head = h('div', { class: 'tg-head' }, h('span', { class: 'tg-logo', html: PLANE }), h('div', {}, h('h3', {}, 'Tự động đăng lên Telegram'),
      h('p', { class: 'muted' }, 'Mọi video của bạn, cả video đang có và video đăng mới, được tự xếp vào hàng chờ và bot gửi vào nhóm/kênh Telegram của bạn theo số bài và giờ bạn chọn.')));
    if (!d.allowed) { card.replaceChildren(head, h('div', { class: 'notice tg-off' }, '🔒 Tài khoản của bạn chưa được bật chức năng này. Hãy liên hệ quản trị viên để được cho phép.')); return; }
    card.replaceChildren(head, statsBlock(), groupsBlock(d), prefsBlock(d), queueBlock(d));
  };
  // --- statistics ---
  let range = 'today';
  function statsBlock() {
    const RANGES = [['today', 'Hôm nay'], ['yesterday', 'Hôm qua'], ['7', '7 ngày'], ['30', '30 ngày']];
    const body = h('div', { class: 'tg-stats-body' }, h('div', { class: 'spin' }));
    const tabs = h('div', { class: 'tg-ranges' });
    const fmtDay = (d) => d.slice(8, 10) + '/' + d.slice(5, 7);
    const paint = async () => {
      tabs.replaceChildren(...RANGES.map(([k, label]) => h('button', { type: 'button', class: 'chip' + (range === k ? ' on' : ''), onclick: () => { range = k; paint(); } }, label)));
      let s; try { s = await api('/me/telegram/stats?range=' + range); } catch (e) { body.replaceChildren(h('p', { class: 'muted' }, e.message)); return; }
      const tile = (cls, ico, label, n) => h('div', { class: 'tg-tile ' + cls }, h('span', { class: 'tg-tico' }, ico), h('b', {}, n.toLocaleString('vi-VN')), h('small', {}, label));
      const tiles = h('div', { class: 'tg-tiles' }, tile('ok', '✓', 'Đăng thành công', s.total.sent), tile('bad', '✕', 'Bị lỗi', s.total.failed), tile('view', '👁', 'Lượt xem từ Telegram', s.total.views));
      const num = (n, cls) => h('span', { class: 'tg-n ' + (n ? cls : 'zero') }, String(n));
      const head = (first) => h('div', { class: 'tg-trow tg-thead' }, h('span', {}, first), h('span', {}, 'Thành công'), h('span', {}, 'Lỗi'), h('span', {}, 'Lượt xem'));
      const groupsTbl = s.groups.length ? h('div', { class: 'tg-table' }, head('Nhóm / kênh'), s.groups.map((g) => h('div', { class: 'tg-trow' },
        h('span', { class: 'tg-tname' }, (g.type === 'channel' ? '📢 ' : '👥 ') + g.title), num(g.sent, 'ok'), num(g.failed, 'bad'), num(g.views, 'view')))) : '';
      const maxV = Math.max(1, ...s.days.map((d) => d.views));
      const daysTbl = s.days.length > 1 ? h('details', { class: 'tg-recent', open: range === '7' }, h('summary', {}, 'Theo từng ngày'),
        h('div', { class: 'tg-table' }, head('Ngày'), s.days.map((d) => h('div', { class: 'tg-trow' },
          h('span', { class: 'tg-tname' }, fmtDay(d.day)), num(d.sent, 'ok'), num(d.failed, 'bad'),
          h('span', { class: 'tg-vbar' }, h('i', { style: 'width:' + Math.round(d.views / maxV * 100) + '%' }), num(d.views, 'view')))))) : '';
      const errs = s.errors.length ? h('details', { class: 'tg-recent' }, h('summary', {}, 'Lỗi gần đây'), h('div', { class: 'tg-list' }, s.errors.map((e) =>
        h('div', { class: 'tg-item' }, h('span', { class: 'tg-pill bad' }, '✕'), h('div', {}, h('a', { href: '/v/' + e.videoId, target: '_blank' }, 'Video #' + e.videoId), h('small', { class: 'muted' }, '→ ' + e.target + ' · ' + new Date(e.at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })), h('small', { class: 'tg-err' }, e.error)))))) : '';
      body.replaceChildren(tiles, groupsTbl, daysTbl, errs);
    };
    paint();
    return h('div', { class: 'tg-block tg-stats' }, h('div', { class: 'tg-btitle' }, h('h4', {}, '📊 Thống kê'), tabs),
      h('p', { class: 'muted tg-note' }, 'Lượt xem = số người bấm vào link video trong nhóm/kênh đó (mỗi người tính 1 lần cho mỗi video mỗi ngày).'), body);
  }
  // --- groups ---
  function groupsBlock(d) {
    const limit = d.prefs.daily_limit;
    const rows = d.targets.map((t) => {
      const sent = d.sentToday[t.id] || 0;
      const act = async (fn, msg) => { try { await fn(); if (msg) toast(msg); load(); } catch (e) { fail(e); } };
      return h('div', { class: 'tg-group' + (t.active ? '' : ' off') },
        h('span', { class: 'tg-gico' }, t.type === 'channel' ? '📢' : '👥'),
        h('div', { class: 'tg-ginfo' }, h('b', {}, t.title, t.username ? h('small', { class: 'muted' }, ' @' + t.username) : ''),
          h('div', { class: 'tg-gmeta' },
            h('span', { class: 'tg-pill ' + (t.active ? 'ok' : 'paused') }, t.active ? 'Đang bật' : 'Tạm dừng'),
            h('span', {}, 'Hôm nay: ', h('b', {}, sent + '/' + limit), ' bài'),
            h('span', { class: 'tg-bar' }, h('i', { style: 'width:' + Math.min(100, sent / limit * 100) + '%' }))),
          t.lastError ? h('small', { class: 'tg-err' }, '⚠ ' + t.lastError) : ''),
        h('div', { class: 'tg-gact' },
          h('button', { type: 'button', class: 'btn sm tg-now', onclick: () => sendNow(t) }, '🚀 Gửi ngay'),
          h('button', { type: 'button', class: 'btn sm', onclick: () => act(() => api('/me/telegram/targets/' + t.id + '/test', { method: 'POST' }), 'Đã gửi tin thử vào ' + t.title) }, 'Gửi thử'),
          h('button', { type: 'button', class: 'btn sm', onclick: () => act(() => api('/me/telegram/targets/' + t.id + '/active', { method: 'POST', body: { active: !t.active } }), t.active ? 'Đã tạm dừng ' + t.title : 'Đã bật lại ' + t.title) }, t.active ? 'Tạm dừng' : 'Bật lại'),
          h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { if (confirm('Gỡ kết nối nhóm ' + t.title + '? Các bài đang chờ gửi vào nhóm này sẽ bị huỷ.')) act(() => api('/me/telegram/targets/' + t.id, { method: 'DELETE' }), 'Đã gỡ ' + t.title); } }, 'Gỡ')));
    });
    const add = h('button', { type: 'button', class: 'btn primary', onclick: () => connectDialog(d.bot) }, '+ Kết nối nhóm / kênh');
    return h('div', { class: 'tg-block' }, h('div', { class: 'tg-btitle' }, h('h4', {}, 'Nhóm nhận bài ', h('small', { class: 'muted' }, '(' + d.targets.length + '/' + d.maxTargets + ')')), d.targets.length < d.maxTargets ? add : ''),
      rows.length ? h('div', { class: 'tg-groups' }, rows) : h('div', { class: 'tg-empty' }, h('p', {}, 'Chưa kết nối nhóm nào.'), h('p', { class: 'muted' }, 'Bấm “Kết nối nhóm / kênh” để lấy mã và làm theo 3 bước.')));
  }
  async function connectDialog(bot) {
    let c; try { c = await api('/me/telegram/code', { method: 'POST' }); } catch (e) { return fail(e); }
    const cmd = '/connect ' + c.code;
    const copy = h('button', { type: 'button', class: 'btn sm', onclick: () => { navigator.clipboard && navigator.clipboard.writeText(cmd).then(() => toast('Đã sao chép lệnh')).catch(() => {}); } }, 'Sao chép');
    const chan = h('input', { placeholder: '@tenkenh', style: 'flex:1;min-width:0' });
    const chanBtn = h('button', { type: 'submit', class: 'btn' }, 'Kết nối kênh');
    const chanForm = h('form', { class: 'row', style: 'gap:8px;flex-wrap:nowrap' }, chan, chanBtn);
    chanForm.addEventListener('submit', async (e) => {
      e.preventDefault(); chanBtn.disabled = true;
      try { const r = await api('/me/telegram/channel', { method: 'POST', body: { username: chan.value } }); toast('Đã kết nối ' + r.title); m.close(); load(); } catch (ex) { fail(ex); } finally { chanBtn.disabled = false; }
    });
    const done = h('button', { type: 'button', class: 'btn primary', style: 'width:100%', onclick: () => { m.close(); load(); } }, 'Tôi đã gửi lệnh xong');
    const m = modal(h('div', { class: 'tg-connect' }, h('h3', {}, 'Kết nối nhóm Telegram'),
      h('ol', { class: 'tg-steps' },
        h('li', {}, 'Mở nhóm Telegram của bạn, thêm bot ', h('a', { href: 'https://t.me/' + bot, target: '_blank', rel: 'noopener' }, h('b', {}, '@' + bot)), ' làm thành viên (với kênh: thêm làm quản trị viên có quyền đăng bài).'),
        h('li', {}, 'Gửi lệnh sau vào nhóm:', h('div', { class: 'tg-code' }, h('code', {}, cmd), copy), h('small', { class: 'muted' }, 'Mã dùng một lần, hết hạn sau ' + c.minutes + ' phút.')),
        h('li', {}, 'Bot trả lời “✅ Đã kết nối” là xong. Bấm nút bên dưới để tải lại danh sách.')),
      done,
      h('div', { class: 'tg-or' }, h('span', {}, 'hoặc kênh công khai')), chanForm));
  }
  // --- settings ---
  function prefsBlock(d) {
    const p = d.prefs;
    const limit = h('input', { type: 'number', min: 1, max: 100, value: p.daily_limit, class: 'tg-num' });
    const perSlot = h('input', { type: 'number', min: 1, max: 20, value: p.per_slot, class: 'tg-num' });
    let mode = p.mode, dist = p.distribute, times = p.times.split(',').filter(Boolean);
    const timeList = h('div', { class: 'tg-times' }), newTime = h('input', { type: 'time', value: '12:00' });
    const paintTimes = () => timeList.replaceChildren(...times.map((t) => h('span', { class: 'tg-time' }, '⏰ ' + t, h('button', { type: 'button', 'aria-label': 'Bỏ giờ ' + t, onclick: () => { times = times.filter((x) => x !== t); paintTimes(); } }, '×'))),
      times.length < 8 ? h('span', { class: 'tg-addtime' }, newTime, h('button', { type: 'button', class: 'btn sm', onclick: () => { const v = newTime.value; if (v && !times.includes(v)) { times = [...times, v].sort(); paintTimes(); } } }, '+ Thêm giờ')) : '');
    paintTimes();
    const schedBox = h('div', { class: 'tg-sched' }, h('div', { class: 'tg-label' }, 'Giờ gửi mỗi ngày'), timeList,
      h('label', { class: 'tg-inline' }, 'Mỗi lần gửi ', perSlot, ' bài cho mỗi nhóm'));
    const choice = (name, val, cur, title, desc, onpick) => {
      const inp = h('input', { type: 'radio', name, value: val, checked: cur === val, onchange: () => onpick(val) });
      return h('label', { class: 'tg-opt' }, inp, h('span', {}, h('b', {}, title), h('small', {}, desc)));
    };
    const syncMode = () => { schedBox.hidden = mode !== 'schedule'; };
    const nm = 'tgm' + Math.random().toString(36).slice(2, 7), nd = 'tgd' + Math.random().toString(36).slice(2, 7);
    const save = h('button', { type: 'submit', class: 'btn primary' }, 'Lưu cài đặt');
    const f = h('form', { class: 'tg-block tg-prefs' }, h('h4', {}, 'Cách gửi'),
      h('div', { class: 'tg-field' }, h('div', { class: 'tg-label' }, 'Số bài tối đa mỗi ngày'),
        h('label', { class: 'tg-inline' }, 'Mỗi nhóm nhận tối đa ', limit, ' bài/ngày'),
        h('small', { class: 'muted' }, 'Bài vượt quá số này tự chuyển sang ngày hôm sau.')),
      h('div', { class: 'tg-field' }, h('div', { class: 'tg-label' }, 'Thời điểm gửi'),
        h('div', { class: 'tg-opts' },
          choice(nm, 'instant', mode, '⚡ Gửi ngay', 'Video vừa đăng là gửi luôn (trong giới hạn mỗi ngày).', (v) => { mode = v; syncMode(); }),
          choice(nm, 'schedule', mode, '⏰ Hẹn giờ hằng ngày', 'Cứ đến giờ đã chọn mỗi ngày thì gửi các bài đang chờ.', (v) => { mode = v; syncMode(); })),
        schedBox),
      h('div', { class: 'tg-field' }, h('div', { class: 'tg-label' }, 'Nội dung giữa các nhóm'),
        h('div', { class: 'tg-opts' },
          choice(nd, 'same', dist, '🔁 Giống nhau', 'Mọi nhóm đều nhận cùng các video.', (v) => { dist = v; }),
          choice(nd, 'split', dist, '🔀 Khác nhau', 'Mỗi video chỉ gửi vào một nhóm, lần lượt xoay vòng các nhóm.', (v) => { dist = v; }))),
      save);
    syncMode();
    f.addEventListener('submit', async (e) => {
      e.preventDefault(); save.disabled = true;
      try { await api('/me/telegram/prefs', { method: 'PUT', body: { daily_limit: limit.value, mode, times: times.join(','), per_slot: perSlot.value, distribute: dist } }); toast('Đã lưu cách gửi Telegram'); load(); }
      catch (ex) { fail(ex); } finally { save.disabled = false; }
    });
    return f;
  }
  // --- queue ---
  function queueBlock(d) {
    const cancel = async (id) => { try { await api('/me/telegram/queue/clear', { method: 'POST', body: { id } }); toast(id ? 'Đã bỏ khỏi hàng chờ' : 'Đã huỷ toàn bộ hàng chờ'); load(); } catch (e) { fail(e); } };
    const status = d.pending
      ? (d.prefs.mode === 'schedule' ? 'Lần gửi tới: ' + d.next : 'Đang gửi dần, phần vượt giới hạn hôm nay sẽ gửi vào ngày mai')
      : 'Không có bài nào đang chờ';
    const STATUS = { sent: ['✓ Đã gửi', 'ok'], failed: ['✕ Lỗi', 'bad'], skipped: ['Bỏ qua', 'paused'] };
    return h('div', { class: 'tg-block' },
      h('div', { class: 'tg-btitle' }, h('h4', {}, 'Hàng chờ ', h('span', { class: 'tg-count' }, String(d.pending))),
        h('div', { class: 'row', style: 'gap:8px' }, h('button', { type: 'button', class: 'btn sm', onclick: pickVideos, disabled: !d.targets.length }, '+ Thêm video đã đăng'),
          d.pending ? h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { if (confirm('Huỷ tất cả ' + d.pending + ' bài đang chờ?')) cancel(0); } }, 'Huỷ tất cả') : '')),
      h('p', { class: 'muted tg-next' }, status),
      d.upcoming.length ? h('div', { class: 'tg-list' }, d.upcoming.map((q) => h('div', { class: 'tg-item' }, thumbOf(q.thumb),
        h('div', {}, h('a', { href: '/v/' + q.videoId, target: '_blank' }, short(q.caption)), h('small', { class: 'muted' }, '→ ' + q.target), q.error ? h('small', { class: 'tg-err' }, '⚠ ' + q.error) : ''),
        h('button', { type: 'button', class: 'iconbtn', 'aria-label': 'Bỏ khỏi hàng chờ', title: 'Bỏ khỏi hàng chờ', onclick: () => cancel(q.id) }, '×')))) : '',
      d.recent.length ? h('details', { class: 'tg-recent' }, h('summary', {}, 'Đã gửi gần đây'),
        h('div', { class: 'tg-list' }, d.recent.map((q) => h('div', { class: 'tg-item' }, h('span', { class: 'tg-pill ' + (STATUS[q.status] || ['', ''])[1] }, (STATUS[q.status] || [q.status])[0]),
          h('div', {}, h('a', { href: '/v/' + q.videoId, target: '_blank' }, short(q.caption)), h('small', { class: 'muted' }, '→ ' + q.target + (q.sentAt ? ' · ' + new Date(q.sentAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '')),
            q.status === 'failed' && q.error ? h('small', { class: 'tg-err' }, q.error) : ''))))) : '');
  }
  // send right now to one group: the next video waiting for it, or a chosen one
  async function sendNow(t) {
    let d; try { d = await api('/me/telegram/videos?target=' + t.id); } catch (e) { return fail(e); }
    let picked = 0;
    const send = async (btn, videoId) => {
      btn.disabled = true; const old = btn.textContent; btn.textContent = 'Đang gửi…';
      try { const r = await api('/me/telegram/targets/' + t.id + '/send', { method: 'POST', body: videoId ? { videoId } : {} }); toast('Đã gửi vào ' + t.title + ': ' + short(r.caption, 40)); m.close(); load(); }
      catch (e) { fail(e); btn.disabled = false; btn.textContent = old; }
    };
    const nextBtn = h('button', { type: 'button', class: 'btn primary', style: 'width:100%', disabled: !d.waiting }, d.waiting ? '⚡ Gửi bài kế tiếp trong hàng chờ' : 'Hàng chờ của nhóm này đang trống');
    nextBtn.addEventListener('click', () => send(nextBtn, 0));
    const go = h('button', { type: 'button', class: 'btn', style: 'width:100%', disabled: true }, 'Chọn một video ở trên');
    go.addEventListener('click', () => send(go, picked));
    const TAG = { sent: 'đã gửi nhóm này', pending: 'đang chờ', failed: 'lần trước bị lỗi', skipped: '', cancelled: '' };
    const nm = 'tgsn' + t.id;
    const list = d.videos.length ? h('div', { class: 'tg-pick' }, d.videos.map((v) => h('label', { class: 'tg-item' },
      h('input', { type: 'radio', name: nm, onchange: () => { picked = v.id; go.disabled = false; go.textContent = '🚀 Gửi video này ngay'; } }), thumbOf(v.thumb),
      h('div', {}, h('span', {}, short(v.caption, 60)), h('small', { class: 'muted' }, new Date(v.createdAt).toLocaleDateString('vi-VN') + (TAG[v.here] ? ' · ' + TAG[v.here] : '')))))) : h('p', { class: 'muted' }, 'Bạn chưa có video công khai nào.');
    const m = modal(h('div', { class: 'tg-sendnow' }, h('h3', { style: 'margin-bottom:4px' }, '🚀 Gửi ngay vào ' + t.title),
      h('p', { class: 'muted', style: 'margin-bottom:12px;font-size:14px' }, 'Gửi luôn vào riêng nhóm này, không cần chờ giờ hẹn. ' + (d.waiting ? 'Nhóm đang có ' + d.waiting + ' bài chờ gửi.' : '')),
      nextBtn, h('div', { class: 'tg-or' }, h('span', {}, 'hoặc chọn video')), list, go));
  }
  async function pickVideos() {
    let d; try { d = await api('/me/telegram/videos'); } catch (e) { return fail(e); }
    if (!d.videos.length) return toast('Bạn chưa có video công khai nào');
    const picked = new Set();
    const go = h('button', { type: 'button', class: 'btn primary', style: 'width:100%', disabled: true }, 'Thêm vào hàng chờ');
    const upd = () => { go.disabled = !picked.size; go.textContent = picked.size ? 'Thêm ' + picked.size + ' video vào hàng chờ' : 'Thêm vào hàng chờ'; };
    const list = h('div', { class: 'tg-pick' }, d.videos.map((v) => h('label', { class: 'tg-item' },
      h('input', { type: 'checkbox', onchange: (e) => { if (e.target.checked) picked.add(v.id); else picked.delete(v.id); upd(); } }), thumbOf(v.thumb),
      h('div', {}, h('span', {}, short(v.caption, 60)), h('small', { class: 'muted' }, new Date(v.createdAt).toLocaleDateString('vi-VN') + (v.queued ? ' · đã từng gửi' : ''))))));
    const m = modal(h('div', {}, h('h3', { style: 'margin-bottom:6px' }, 'Chọn video để gửi lên Telegram'),
      h('p', { class: 'muted', style: 'margin-bottom:12px;font-size:14px' }, 'Video được xếp vào hàng chờ và gửi theo cách gửi bạn đã cài.'), list, go));
    go.addEventListener('click', async () => {
      go.disabled = true;
      try { const r = await api('/me/telegram/queue', { method: 'POST', body: { ids: [...picked] } }); toast(r.added ? 'Đã thêm ' + r.added + ' bài vào hàng chờ' : 'Các video này đã có trong hàng chờ'); m.close(); load(); }
      catch (e) { go.disabled = false; fail(e); }
    });
  }
  load().catch(() => {});
  return card;
}

// ---------- admin: the site bot ----------
function adminBox() {
  const body = h('div');
  const box = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:6px' }, 'Bot Telegram tự đăng video'),
    h('p', { class: 'muted', style: 'margin-bottom:14px' }, 'Thành viên được cho phép (cột “Gửi Telegram” trong danh sách thành viên) sẽ kết nối nhóm của họ với bot này; mọi video của họ (có sẵn và đăng mới) tự vào hàng chờ và được gửi vào nhóm.'), body, limitForm(), autoReplyCard());
  // automatic replies to customers who write to the bot
  function autoReplyCard() {
    const card = h('div', { class: 'card tg-ar' });
    api('/admin/telegram-autoreply').then((d) => {
      const c = d.autoreply;
      const chk = (v) => h('input', { type: 'checkbox', checked: !!v, class: 'tg-chk' });
      const area = (v, ph, rows = 3) => { const t = h('textarea', { rows, maxlength: 2000, placeholder: ph }); t.value = v || ''; return t; };
      const enabled = chk(c.enabled), groups = chk(c.groups);
      const welcome = area(c.welcome, 'VD: Chào {ten} 👋 Cảm ơn bạn đã nhắn cho xgaigu! Xem video mới nhất tại {website}');
      const fallback = area(c.fallback, 'VD: Cảm ơn {ten} đã nhắn tin. Admin sẽ trả lời bạn sớm nhất. Trong lúc chờ, mời bạn xem video tại {website}');
      const hours = h('input', { type: 'number', min: 0, max: 168, value: c.fallbackHours, class: 'tg-num' });
      const bText = h('input', { maxlength: 40, placeholder: 'Chữ trên nút, VD: Xem video ngay', value: c.buttonText || '', style: 'flex:1;min-width:160px' });
      const bUrl = h('input', { maxlength: 300, placeholder: 'https://xgaigu.com', value: c.buttonUrl || '', style: 'flex:2;min-width:200px' });
      const rulesBox = h('div', { class: 'tg-rules' });
      const ruleRow = (r = { keys: '', reply: '' }) => {
        const keys = h('input', { maxlength: 300, placeholder: 'Từ khoá, cách nhau bằng dấu phẩy. VD: giá, bao nhiêu, phí', value: r.keys });
        const rep = area(r.reply, 'Câu trả lời khi tin nhắn có một trong các từ khoá trên', 2);
        const row = h('div', { class: 'tg-rule' }, h('div', { class: 'tg-rule-f' }, keys, rep),
          h('button', { type: 'button', class: 'iconbtn', 'aria-label': 'Xoá quy tắc', title: 'Xoá quy tắc', onclick: () => row.remove() }, '×'));
        row.read = () => ({ keys: keys.value, reply: rep.value });
        return row;
      };
      (c.rules.length ? c.rules : [{ keys: '', reply: '' }]).forEach((r) => rulesBox.append(ruleRow(r)));
      const addRule = h('button', { type: 'button', class: 'btn sm', onclick: () => rulesBox.append(ruleRow()) }, '+ Thêm quy tắc từ khoá');
      const read = () => ({ enabled: enabled.checked, groups: groups.checked, welcome: welcome.value, fallback: fallback.value, fallbackHours: hours.value,
        buttonText: bText.value, buttonUrl: bUrl.value, rules: [...rulesBox.children].map((r) => r.read()) });
      const save = h('button', { type: 'button', class: 'btn primary' }, 'Lưu tự động trả lời');
      save.addEventListener('click', async () => { save.disabled = true; try { await api('/admin/telegram-autoreply', { method: 'PUT', body: read() }); toast(enabled.checked ? 'Đã bật tự động trả lời' : 'Đã lưu (đang tắt tự động trả lời)'); } catch (e) { fail(e); } finally { save.disabled = false; } });
      // try a message
      const tIn = h('input', { placeholder: 'Gõ thử một tin nhắn của khách, VD: cho mình hỏi giá', style: 'flex:1;min-width:200px' });
      const tWhere = h('select', { style: 'width:auto' }, h('option', { value: 'private' }, 'Nhắn riêng'), h('option', { value: 'group' }, 'Trong nhóm'));
      const tOut = h('div', { class: 'tg-ar-out', hidden: true });
      const tryIt = async () => {
        try {
          const r = await api('/admin/telegram-autoreply/test', { method: 'POST', body: { autoreply: { ...read(), enabled: true }, text: tIn.value, where: tWhere.value } });
          tOut.hidden = false;
          tOut.replaceChildren(r.reply ? h('div', {}, h('small', { class: 'muted' }, { welcome: 'Lời chào', fallback: 'Trả lời mặc định' }[r.kind] || 'Quy tắc từ khoá #' + (Number(String(r.kind).slice(4)) + 1)), h('p', {}, r.reply)) : h('p', { class: 'muted' }, 'Bot sẽ không trả lời tin nhắn này.'));
        } catch (e) { fail(e); }
      };
      tIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); tryIt(); } });
      card.replaceChildren(
        h('div', { class: 'tg-btitle' }, h('h3', { style: 'font-size:17px' }, '💬 Tự động trả lời khách'), h('small', { class: 'muted' }, 'Hôm nay đã trả lời ' + d.today + ' tin · tổng ' + d.total)),
        h('label', { class: 'tg-inline' }, enabled, h('b', {}, 'Bật tự động trả lời')),
        h('p', { class: 'muted tg-ar-note' }, 'Khách nhắn riêng cho bot' + (d.bot ? ' @' + d.bot : '') + ' sẽ được trả lời tự động. Dùng {ten} để chèn tên khách, {website} để chèn địa chỉ website.'),
        h('div', { class: 'tg-field' }, h('div', { class: 'tg-label' }, 'Lời chào (khi khách bấm Start / bắt đầu chat với bot)'), welcome),
        h('div', { class: 'tg-field' }, h('div', { class: 'tg-label' }, 'Trả lời theo từ khoá'), h('small', { class: 'muted', style: 'display:block;margin:-4px 0 8px' }, 'Tin nhắn có từ khoá nào thì gửi câu trả lời đó (không phân biệt hoa thường, có dấu hay không dấu). Quy tắc ở trên được ưu tiên.'), rulesBox, addRule),
        h('div', { class: 'tg-field' }, h('div', { class: 'tg-label' }, 'Trả lời mặc định (tin nhắn không khớp từ khoá nào)'), fallback,
          h('label', { class: 'tg-inline', style: 'margin-top:8px;font-size:14px' }, 'Mỗi khách nhận câu này tối đa 1 lần trong ', hours, ' giờ')),
        h('div', { class: 'tg-field' }, h('div', { class: 'tg-label' }, 'Nút bấm dưới mỗi câu trả lời (không bắt buộc)'), h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, bText, bUrl)),
        h('label', { class: 'tg-inline', style: 'font-size:14px' }, groups, 'Trả lời cả trong nhóm khi tin nhắn khớp từ khoá'),
        h('small', { class: 'muted', style: 'display:block;margin:-6px 0 4px' }, 'Trong nhóm, Telegram chỉ cho bot thấy tin nhắc tới bot hoặc trả lời bot. Muốn bot đọc mọi tin trong nhóm: vào @BotFather → /setprivacy → chọn bot → Disable.'),
        h('div', {}, save),
        h('div', { class: 'tg-field tg-ar-try' }, h('div', { class: 'tg-label' }, 'Thử trước'), h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, tIn, tWhere, h('button', { type: 'button', class: 'btn sm', onclick: tryIt }, 'Thử')), tOut));
    }).catch(() => card.remove());
    return card;
  }
  // how many groups each account may link
  function limitForm() {
    const inp = h('input', { type: 'number', min: 1, max: 500, class: 'tg-num', 'aria-label': 'Số nhóm tối đa mỗi tài khoản' });
    const btn = h('button', { type: 'submit', class: 'btn sm primary' }, 'Lưu');
    const f = h('form', { class: 'card tg-limit' }, h('label', { class: 'tg-inline' }, 'Mỗi tài khoản kết nối tối đa ', inp, ' nhóm/kênh nhận bài'), btn);
    api('/admin/telegram-limit').then((d) => { inp.value = d.maxTargets; }).catch(() => {});
    f.addEventListener('submit', async (e) => {
      e.preventDefault(); btn.disabled = true;
      try { const r = await api('/admin/telegram-limit', { method: 'PUT', body: { maxTargets: inp.value } }); inp.value = r.maxTargets; toast('Đã đặt tối đa ' + r.maxTargets + ' nhóm mỗi tài khoản'); load(); }
      catch (ex) { fail(ex); } finally { btn.disabled = false; }
    });
    return f;
  }
  const tokenForm = (label) => {
    const inp = h('input', { type: 'password', autocomplete: 'off', placeholder: '123456789:AA…', style: 'flex:1;min-width:220px' });
    const btn = h('button', { type: 'submit', class: 'btn primary' }, label);
    const f = h('form', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, inp, btn);
    f.addEventListener('submit', async (e) => {
      e.preventDefault(); btn.disabled = true;
      try { const r = await api('/admin/telegram-bot', { method: 'POST', body: { token: inp.value } }); toast('Đã kết nối bot @' + r.username); if (r.webhookError) toast('Lưu ý: ' + r.webhookError); load(); }
      catch (ex) { fail(ex); } finally { btn.disabled = false; }
    });
    return f;
  };
  const load = async () => {
    const { bot } = await api('/admin/telegram-bot');
    if (!bot) {
      body.replaceChildren(h('div', { class: 'card', style: 'padding:18px' },
        h('ol', { class: 'tg-steps', style: 'margin-bottom:14px' },
          h('li', {}, 'Mở Telegram, chat với ', h('a', { href: 'https://t.me/BotFather', target: '_blank', rel: 'noopener' }, '@BotFather'), ', gửi /newbot và đặt tên bot.'),
          h('li', {}, 'BotFather gửi lại một token dạng 123456789:AA…, dán vào ô dưới.')),
        tokenForm('Kết nối bot')));
      return;
    }
    const stat = (label, v) => h('div', { class: 'card', style: 'padding:12px 16px' }, h('div', { class: 'muted', style: 'font-size:13px' }, label), h('b', { style: 'font-size:22px' }, String(v)));
    const reconnect = h('button', { type: 'button', class: 'btn sm', onclick: async () => { try { const r = await api('/admin/telegram-bot', { method: 'POST', body: { reconnect: true } }); toast(r.webhookError ? 'Lưu ý: ' + r.webhookError : 'Đã kết nối lại bot'); load(); } catch (e) { fail(e); } } }, 'Kết nối lại');
    const remove = h('button', { type: 'button', class: 'btn sm ghost', onclick: async () => { if (!confirm('Gỡ bot @' + bot.username + '? Mọi thành viên sẽ ngừng tự đăng lên Telegram.')) return; try { await api('/admin/telegram-bot', { method: 'DELETE' }); toast('Đã gỡ bot'); load(); } catch (e) { fail(e); } } }, 'Gỡ bot');
    const change = h('details', { style: 'margin-top:12px' }, h('summary', { class: 'muted', style: 'cursor:pointer' }, 'Đổi sang bot khác'), h('div', { style: 'margin-top:10px' }, tokenForm('Lưu bot mới')));
    body.replaceChildren(h('div', { class: 'card', style: 'padding:18px' },
      h('div', { class: 'row', style: 'gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px' }, h('span', { class: 'tg-logo', html: PLANE }),
        h('a', { href: 'https://t.me/' + bot.username, target: '_blank', rel: 'noopener' }, h('b', {}, '@' + bot.username)),
        h('span', { class: 'tg-pill ' + (bot.webhookOk && !bot.webhookError ? 'ok' : 'bad') }, bot.webhookOk && !bot.webhookError ? 'Đang hoạt động' : 'Cần kiểm tra'), reconnect, remove),
      bot.webhookError ? h('p', { class: 'tg-err', style: 'margin-bottom:12px' }, '⚠ ' + bot.webhookError) : '',
      h('div', { class: 'row', style: 'gap:10px;flex-wrap:wrap' }, stat('Tài khoản được phép', bot.allowedUsers), stat('Nhóm đã kết nối', bot.targets), stat('Tối đa mỗi tài khoản', bot.maxTargets + ' nhóm'), stat('Bài đang chờ', bot.queued), stat('Đã gửi hôm nay', bot.sentToday)),
      change));
  };
  load().catch(fail);
  return box;
}

window.XGTele = { accountCard, adminBox };
})();
