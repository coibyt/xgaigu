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
      h('p', { class: 'muted' }, 'Video mới của bạn được bot tự gửi vào nhóm/kênh Telegram của bạn, theo số bài và giờ bạn chọn.')));
    if (!d.allowed) { card.replaceChildren(head, h('div', { class: 'notice tg-off' }, '🔒 Tài khoản của bạn chưa được bật chức năng này. Hãy liên hệ quản trị viên để được cho phép.')); return; }
    card.replaceChildren(head, groupsBlock(d), prefsBlock(d), queueBlock(d));
  };
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
          h('button', { type: 'button', class: 'btn sm', onclick: () => act(() => api('/me/telegram/targets/' + t.id + '/test', { method: 'POST' }), 'Đã gửi tin thử vào ' + t.title) }, 'Gửi thử'),
          h('button', { type: 'button', class: 'btn sm', onclick: () => act(() => api('/me/telegram/targets/' + t.id + '/active', { method: 'POST', body: { active: !t.active } }), t.active ? 'Đã tạm dừng ' + t.title : 'Đã bật lại ' + t.title) }, t.active ? 'Tạm dừng' : 'Bật lại'),
          h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { if (confirm('Gỡ kết nối nhóm ' + t.title + '? Các bài đang chờ gửi vào nhóm này sẽ bị huỷ.')) act(() => api('/me/telegram/targets/' + t.id, { method: 'DELETE' }), 'Đã gỡ ' + t.title); } }, 'Gỡ')));
    });
    const add = h('button', { type: 'button', class: 'btn primary', onclick: () => connectDialog(d.bot) }, '+ Kết nối nhóm / kênh');
    return h('div', { class: 'tg-block' }, h('div', { class: 'tg-btitle' }, h('h4', {}, 'Nhóm nhận bài ', h('small', { class: 'muted' }, '(' + d.targets.length + '/5)')), d.targets.length < 5 ? add : ''),
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
    h('p', { class: 'muted', style: 'margin-bottom:14px' }, 'Thành viên được cho phép (cột “Gửi Telegram” trong danh sách thành viên) sẽ kết nối nhóm của họ với bot này để video mới tự gửi vào nhóm.'), body);
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
    const reconnect = h('button', { type: 'button', class: 'btn sm', onclick: async () => { try { const r = await api('/admin/telegram-bot', { method: 'POST', body: { reconnect: true } }); toast(r.webhookError ? 'Lưu ý: ' + r.webhookError : 'Đã kết nối lại webhook'); load(); } catch (e) { fail(e); } } }, 'Kết nối lại');
    const remove = h('button', { type: 'button', class: 'btn sm ghost', onclick: async () => { if (!confirm('Gỡ bot @' + bot.username + '? Mọi thành viên sẽ ngừng tự đăng lên Telegram.')) return; try { await api('/admin/telegram-bot', { method: 'DELETE' }); toast('Đã gỡ bot'); load(); } catch (e) { fail(e); } } }, 'Gỡ bot');
    const change = h('details', { style: 'margin-top:12px' }, h('summary', { class: 'muted', style: 'cursor:pointer' }, 'Đổi sang bot khác'), h('div', { style: 'margin-top:10px' }, tokenForm('Lưu bot mới')));
    body.replaceChildren(h('div', { class: 'card', style: 'padding:18px' },
      h('div', { class: 'row', style: 'gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px' }, h('span', { class: 'tg-logo', html: PLANE }),
        h('a', { href: 'https://t.me/' + bot.username, target: '_blank', rel: 'noopener' }, h('b', {}, '@' + bot.username)),
        h('span', { class: 'tg-pill ' + (bot.webhookOk && !bot.webhookError ? 'ok' : 'bad') }, bot.webhookOk && !bot.webhookError ? 'Đang hoạt động' : 'Cần kiểm tra'), reconnect, remove),
      bot.webhookError ? h('p', { class: 'tg-err', style: 'margin-bottom:12px' }, '⚠ ' + bot.webhookError) : '',
      h('div', { class: 'row', style: 'gap:10px;flex-wrap:wrap' }, stat('Tài khoản được phép', bot.allowedUsers), stat('Nhóm đã kết nối', bot.targets), stat('Bài đang chờ', bot.queued), stat('Đã gửi hôm nay', bot.sentToday)),
      change));
  };
  load().catch(fail);
  return box;
}

window.XGTele = { accountCard, adminBox };
})();
