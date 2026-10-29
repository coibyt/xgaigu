/* xgaigu – single-page app (vanilla JS, no build step) */
(() => {
'use strict';

// ---------- utils ----------
const $ = (s, r = document) => r.querySelector(s);
const main = $('#main');
const P = {
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  mic: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
  micoff: 'M1 1l22 22M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V4a3 3 0 0 0-5.9-.8M17 16.9A7 7 0 0 1 5 12v-2M19 10v2c0 .8-.1 1.5-.4 2.2M12 19v4M8 23h8',
  videooff: 'M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.7 0H14a2 2 0 0 1 2 2v3.3l1 1L23 7v10M1 1l22 22',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  search: 'M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  eye2: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z',
  bookmark: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4.2L5 21V4a1 1 0 0 1 1-1z',
  msg: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  cal: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  share: 'M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  play: 'M5 3l14 9-14 9z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  live: 'M23 7l-7 5 7 5V7zM1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  vol: 'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  mute: 'M11 5 6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  pin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  check: 'M20 6 9 17l-5-5',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  back: 'M15 18l-6-6 6-6',
  video: 'M23 7l-7 5 7 5V7zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  spark: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
};
const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(path, opts = {}) {
  const o = { method: opts.method || 'GET', headers: {}, credentials: 'same-origin' };
  if (opts.body instanceof FormData) o.body = opts.body;
  else if (opts.body) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(opts.body); }
  const r = await fetch('/api' + path, o);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || 'Có lỗi xảy ra'); e.status = r.status; e.code = data.code; throw e; }
  return data;
}

// POST with upload progress (fetch can't report it). Returns { promise, abort }.
function apiUpload(path, body, onProgress) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    xhr.open('POST', '/api' + path);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded, e.total); };
    xhr.onload = () => {
      let d = {}; try { d = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status >= 200 && xhr.status < 300) return resolve(d);
      const er = new Error(d.error || (xhr.status === 413 ? 'File quá lớn' : 'Có lỗi xảy ra')); er.status = xhr.status; reject(er);
    };
    xhr.onerror = () => reject(new Error('Mất kết nối mạng, vui lòng thử lại'));
    xhr.ontimeout = () => reject(new Error('Tải lên quá lâu, vui lòng thử lại'));
    xhr.onabort = () => reject(Object.assign(new Error('Đã huỷ tải lên'), { aborted: true }));
    xhr.send(body);
  });
  return { promise, abort: () => xhr.abort() };
}
const fmtMB = (b) => (b / 1048576).toFixed(b < 10485760 ? 1 : 0);

// "Khóa API" card on the account page: keys for the member's own posting tool (shown in full only once).
function apiKeysCard() {
  const list = h('div', {});
  const out = h('div', { hidden: true, class: 'card', style: 'padding:12px;margin:12px 0;background:#fff7ed' });
  const load = async () => {
    const { tokens } = await api('/me/tokens');
    list.replaceChildren(...(tokens.length ? tokens.map((t) => h('div', { class: 'row', style: 'justify-content:space-between;margin:6px 0' },
      h('span', {}, `${t.name} · …${t.hint} · tạo ${new Date(t.createdAt).toLocaleDateString('vi-VN')}` + (t.lastUsedAt ? ` · dùng lần cuối ${timeAgo(t.lastUsedAt)}` : ' · chưa dùng')),
      h('button', { type: 'button', class: 'btn ghost sm', onclick: async () => {
        if (!confirm('Xóa khóa này? Phần mềm đang dùng nó sẽ không đăng bài được nữa.')) return;
        await api('/me/tokens/' + t.id, { method: 'DELETE' }); load();
      } }, 'Xóa'))) : [h('p', { class: 'muted' }, 'Chưa có khóa nào.')]));
  };
  const create = async () => {
    try {
      const { token } = await api('/me/tokens', { method: 'POST', body: { name: 'Phần mềm đăng bài' } });
      const input = h('input', { value: token, readonly: true, style: 'width:100%;font-family:monospace', onclick: (e) => e.target.select() });
      out.replaceChildren(h('b', {}, 'Khóa mới (chỉ hiện MỘT lần — hãy sao chép ngay):'), input,
        h('button', { type: 'button', class: 'btn sm', style: 'margin-top:8px', onclick: () => { navigator.clipboard.writeText(token); toast('Đã sao chép'); } }, 'Sao chép'));
      out.hidden = false; load();
    } catch (e) { fail(e); }
  };
  load().catch(fail);
  return h('div', { class: 'card', style: 'padding:24px;margin-top:20px' },
    h('h3', { style: 'margin-bottom:4px' }, 'Khóa API (phần mềm đăng bài)'),
    h('p', { class: 'muted', style: 'font-size:14px;margin-bottom:12px' },
      'Dùng cho phần mềm đăng video của bạn, thay cho mật khẩu. Khóa chỉ đăng/xem/ẩn video, không đọc được tin nhắn hay đổi cài đặt. Đừng gửi khóa cho người khác.'),
    list, out, h('button', { type: 'button', class: 'btn', onclick: create }, 'Tạo khóa mới'));
}

function toast(msg, bad) {
  const t = h('div', { class: 'toast' + (bad ? ' bad' : '') }, msg);
  $('#toast-root').append(t);
  setTimeout(() => t.remove(), 3600);
}
const fail = (e) => { if (e.status === 401) { openAuth('login'); } else toast(e.message, true); };

const timeAgo = (t) => {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'vừa xong'; if (s < 3600) return Math.floor(s / 60) + ' phút trước';
  if (s < 86400) return Math.floor(s / 3600) + ' giờ trước'; return Math.floor(s / 86400) + ' ngày trước';
};
const loc = () => (window.XGI18n ? XGI18n.locale() : 'vi-VN');
const fmtDate = (t) => new Date(t).toLocaleString(loc(), { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const fmtTime = (t) => new Date(t).toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' });

function avatar(u, cls = '') {
  const a = h('span', { class: 'avatar ' + cls });
  if (u && u.avatar) a.append(h('img', { src: u.avatar, alt: '', loading: 'lazy' }));
  else a.textContent = ((u && u.name) || '?').trim().charAt(0).toUpperCase();
  return a;
}

// ---------- state ----------
const S = { user: null, unread: 0, es: null, cleanups: [], sound: false };
const onLeave = (fn) => S.cleanups.push(fn);

// ---------- modal ----------
function modal(content, { sheet = false, wide = false } = {}) {
  const root = $('#modal-root');
  const prev = document.activeElement;
  const close = () => { ov.remove(); document.removeEventListener('keydown', esc_); prev && prev.focus && prev.focus(); };
  const esc_ = (e) => { if (e.key === 'Escape') close(); };
  const box = h('div', { class: 'modal' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true' },
    h('button', { class: 'iconbtn x', 'aria-label': 'Đóng', onclick: close, html: icon('x') }), content);
  const ov = h('div', { class: 'overlay' + (sheet ? ' sheet' : ''), onmousedown: (e) => { if (e.target === ov) close(); } }, box);
  root.append(ov);
  document.addEventListener('keydown', esc_);
  const first = box.querySelector('input,textarea,select,button.btn');
  first && first.focus();
  return { close, box };
}

// ---------- address picker (autocomplete, like varaai) ----------
function placePicker(init = {}) {
  const val = { address: init.address || '', city: init.city || '', lat: init.lat ?? null, lng: init.lng ?? null };
  const hint = 'Chọn một gợi ý để bật tính năng "Tìm quanh đây".';
  const input = h('input', { placeholder: 'Nhập địa chỉ hoặc khu vực, VD: Quận 1, TP.HCM', autocomplete: 'off', maxlength: 200, value: val.address || val.city, role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false' });
  const list = h('ul', { class: 'suggest', role: 'listbox', hidden: true });
  const note = h('small', { class: 'muted' }, val.lat != null ? '✓ Đã chọn vị trí' : hint);
  let t, seq = 0;
  const hide = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); };
  const pick = (sg) => {
    val.address = sg.displayName; val.city = sg.city || sg.displayName.split(',')[0]; val.lat = sg.lat; val.lng = sg.lng;
    input.value = sg.displayName; note.textContent = '✓ Đã chọn vị trí'; hide();
  };
  input.addEventListener('input', () => {
    val.lat = val.lng = null; val.address = ''; val.city = input.value.trim(); note.textContent = hint;
    clearTimeout(t);
    if (input.value.trim().length < 3) return hide();
    const my = ++seq;
    t = setTimeout(async () => {
      try {
        const { suggestions } = await api('/geocode?q=' + encodeURIComponent(input.value.trim()));
        if (my !== seq) return;
        list.innerHTML = '';
        if (!suggestions.length) list.append(h('li', { class: 'none' }, 'Không tìm thấy địa điểm phù hợp'));
        suggestions.forEach((sg) => list.append(h('li', { role: 'option', tabindex: '0', onclick: () => pick(sg), onkeydown: (e) => { if (e.key === 'Enter') pick(sg); } }, h('span', { html: icon('pin') }), h('span', {}, sg.displayName))));
        list.hidden = false; input.setAttribute('aria-expanded', 'true');
      } catch { hide(); }
    }, 450);
  });
  input.addEventListener('blur', () => setTimeout(hide, 250));
  return { el: h('div', { class: 'picker' }, input, list, note), get: () => ({ ...val }) };
}

// ---------- video calls (1-to-1, WebRTC; signaling goes through the server's SSE channel) ----------
let CALL = null;
const rid = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');
async function rtcConfig() {
  if (!S.rtc) { try { S.rtc = await api('/rtc-config'); } catch { S.rtc = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }; } }
  return S.rtc;
}
const callSend = (to, callId, type, data) => api('/calls/signal', { method: 'POST', body: { to, callId, type, data } });

let ringTimer = null, ringCtx = null;
function startRing(kind) {
  stopRing();
  try {
    ringCtx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = () => {
      const c = ringCtx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = kind === 'in' ? 880 : 440;
      g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.5);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.55);
    };
    beep(); ringTimer = setInterval(beep, kind === 'in' ? 1200 : 2200);
  } catch {}
}
function stopRing() { clearInterval(ringTimer); ringTimer = null; if (ringCtx) { try { ringCtx.close(); } catch {} ringCtx = null; } }

function callUI(peer) {
  const remote = h('video', { class: 'call-remote', autoplay: true, playsinline: true });
  const local = h('video', { class: 'call-local', autoplay: true, playsinline: true, muted: true }); local.muted = true;
  const status = h('span', { class: 'call-status' });
  const controls = h('div', { class: 'call-ctl' });
  const el = h('div', { class: 'callov', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Cuộc gọi video' },
    remote,
    h('div', { class: 'call-top' }, avatar(peer, 'lg'), h('b', {}, peer.name), status),
    local, controls,
    h('p', { class: 'call-safe' }, 'Không chuyển tiền cho người chưa quen. Bấm lá cờ để báo cáo nếu bị quấy rối.'));
  document.body.append(el);
  return { el, remote, local, status, controls };
}

function setCallControls(C, mode) {
  const btn = (cls, label, ic, fn, rot) => h('button', { type: 'button', class: 'call-btn ' + cls, 'aria-label': label, onclick: fn }, h('span', { class: rot ? 'rot' : '', html: icon(ic) }), h('i', {}, label));
  const c = C.ui.controls; c.replaceChildren();
  if (mode === 'incoming') c.append(btn('red', 'Từ chối', 'phone', () => hangup(C), true), btn('green', 'Nghe', 'video', () => acceptCall(C)));
  else if (mode === 'connected') {
    const mic = btn('', 'Mic', 'mic', () => { const t = C.local.getAudioTracks(); const on = !t[0]?.enabled; t.forEach((x) => (x.enabled = on)); mic.firstChild.innerHTML = icon(on ? 'mic' : 'micoff'); mic.classList.toggle('off', !on); });
    const cam = btn('', 'Camera', 'video', () => { const t = C.local.getVideoTracks(); const on = !t[0]?.enabled; t.forEach((x) => (x.enabled = on)); cam.firstChild.innerHTML = icon(on ? 'video' : 'videooff'); cam.classList.toggle('off', !on); });
    c.append(mic, cam, btn('', 'Báo cáo', 'flag', () => openReport('user', C.peer.id)), btn('red', 'Kết thúc', 'phone', () => hangup(C), true));
  } else c.append(btn('red', 'Huỷ', 'phone', () => hangup(C), true));
}
const setCallStatus = (C, t) => { if (C.ui) C.ui.status.textContent = t; };

async function getCallMedia() {
  try { return await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: { echoCancellation: true, noiseSuppression: true } }); }
  catch (e) { toast(e.name === 'NotAllowedError' ? 'Bạn cần cho phép camera và micro để gọi video' : 'Không mở được camera/micro', true); return null; }
}

function finishCall(C) {
  if (!C) return;
  clearTimeout(C.timer); clearTimeout(C.discTimer); clearInterval(C.tick); stopRing();
  if (C.local) C.local.getTracks().forEach((t) => t.stop());
  if (C.pc) { try { C.pc.close(); } catch {} }
  if (C.ui) C.ui.el.remove();
  if (CALL === C) CALL = null;
}
function hangup(C) {
  if (!C || CALL !== C) return;
  const type = C.connected || C.pc ? 'end' : C.role === 'caller' ? 'cancel' : 'decline';
  callSend(C.peer.id, C.id, type).catch(() => {});
  finishCall(C);
}

function makePC(C) {
  const pc = new RTCPeerConnection(C.cfg); C.pc = pc;
  C.local.getTracks().forEach((t) => pc.addTrack(t, C.local));
  pc.ontrack = (e) => { C.ui.remote.srcObject = e.streams[0]; C.ui.remote.play().catch(() => {}); };
  pc.onicecandidate = (e) => { if (e.candidate) callSend(C.peer.id, C.id, 'ice', e.candidate.toJSON()).catch(() => {}); };
  pc.onconnectionstatechange = () => {
    if (CALL !== C) return;
    if (pc.connectionState === 'connected') {
      clearTimeout(C.timer); clearTimeout(C.discTimer); stopRing(); C.connected = true; setCallControls(C, 'connected'); C.ui.el.classList.add('live');
      const t0 = Date.now(); C.tick = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); setCallStatus(C, String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')); }, 1000); setCallStatus(C, '00:00');
    } else if (pc.connectionState === 'failed') { toast('Mất kết nối cuộc gọi', true); hangup(C); }
    else if (pc.connectionState === 'disconnected') { clearTimeout(C.discTimer); C.discTimer = setTimeout(() => { if (CALL === C && pc.connectionState !== 'connected') { toast('Cuộc gọi bị gián đoạn', true); hangup(C); } }, 8000); }
  };
  return pc;
}
async function applyRemote(C, d) {
  await C.pc.setRemoteDescription({ type: d.type, sdp: d.sdp });
  for (const c of C.pending.splice(0)) await C.pc.addIceCandidate(c).catch(() => {});
  if (d.type === 'offer') {
    const ans = await C.pc.createAnswer(); await C.pc.setLocalDescription(ans);
    callSend(C.peer.id, C.id, 'sdp', { type: ans.type, sdp: ans.sdp }).catch(() => {});
  }
}

async function startVideoCall(user) {
  if (!(await needLogin())) return;
  if (user.id === S.user.id) return toast('Đây là bạn mà 😊');
  if (user.allowCalls === false) return toast(user.name + ' đang tắt nhận cuộc gọi video', true);
  if (CALL) return toast('Bạn đang trong một cuộc gọi', true);
  if (!navigator.mediaDevices || !window.RTCPeerConnection) return toast('Trình duyệt này chưa hỗ trợ gọi video', true);
  const local = await getCallMedia(); if (!local) return;
  const C = CALL = { id: rid(), peer: user, role: 'caller', local, pending: [], connected: false };
  C.cfg = await rtcConfig(); C.ui = callUI(user); C.ui.local.srcObject = local;
  setCallStatus(C, 'Đang gọi…'); setCallControls(C, 'calling'); startRing('out');
  try { await callSend(user.id, C.id, 'invite'); } catch (e) { toast(e.message, true); finishCall(C); return; }
  C.timer = setTimeout(() => { if (CALL === C && !C.connected) { callSend(user.id, C.id, 'cancel', { missed: true }).catch(() => {}); toast('Không có người trả lời', true); finishCall(C); } }, 45000);
}

async function acceptCall(C) {
  if (CALL !== C) return;
  stopRing(); clearTimeout(C.timer);
  C.local = await getCallMedia();
  if (!C.local) { callSend(C.peer.id, C.id, 'decline').catch(() => {}); finishCall(C); return; }
  C.cfg = await rtcConfig(); C.ui.local.srcObject = C.local; makePC(C);
  setCallStatus(C, 'Đang kết nối…'); setCallControls(C, 'connecting');
  C.timer = setTimeout(() => { if (CALL === C && !C.connected) { toast('Không kết nối được cuộc gọi', true); hangup(C); } }, 25000);
  callSend(C.peer.id, C.id, 'accept').catch(() => hangup(C));
}

async function onCallEvent(m) {
  const { type, callId, from, data } = m;
  if (type === 'invite') {
    if (CALL || (S.user && S.user.allowCalls === false)) { callSend(from.id, callId, CALL ? 'busy' : 'decline').catch(() => {}); return; }
    const C = CALL = { id: callId, peer: from, role: 'callee', pending: [], connected: false };
    C.ui = callUI(from); setCallStatus(C, 'đang gọi video cho bạn…'); setCallControls(C, 'incoming'); startRing('in');
    C.timer = setTimeout(() => { if (CALL === C && !C.pc) finishCall(C); }, 50000);
    return;
  }
  const C = CALL; if (!C || C.id !== callId || C.peer.id !== from.id) return;
  if (type === 'accept' && C.role === 'caller') {
    stopRing(); clearTimeout(C.timer); setCallStatus(C, 'Đang kết nối…'); setCallControls(C, 'connecting');
    const pc = makePC(C); const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
    callSend(C.peer.id, C.id, 'sdp', { type: offer.type, sdp: offer.sdp }).catch(() => {});
    C.timer = setTimeout(() => { if (CALL === C && !C.connected) { toast('Không kết nối được cuộc gọi', true); hangup(C); } }, 25000);
  } else if (type === 'sdp' && C.pc) await applyRemote(C, data);
  else if (type === 'ice' && data) { if (C.pc && C.pc.remoteDescription) await C.pc.addIceCandidate(data).catch(() => {}); else C.pending.push(data); }
  else if (['decline', 'busy', 'cancel', 'end'].includes(type)) {
    toast({ decline: C.peer.name + ' đã từ chối cuộc gọi', busy: C.peer.name + ' đang bận cuộc gọi khác', cancel: 'Cuộc gọi nhỡ từ ' + C.peer.name, end: 'Cuộc gọi đã kết thúc' }[type]);
    finishCall(C);
  }
}
window.addEventListener('pagehide', () => {
  const C = CALL; if (!C) return;
  try { navigator.sendBeacon('/api/calls/signal', new Blob([JSON.stringify({ to: C.peer.id, callId: C.id, type: C.connected || C.pc ? 'end' : C.role === 'caller' ? 'cancel' : 'decline' })], { type: 'application/json' })); } catch {}
});

// ---------- accounts on this device ----------
async function switchAccount(id) {
  try {
    const r = await api('/switch', { method: 'POST', body: { userId: id } });
    S.user = r.user; S.unread = 0; connectEvents(); renderNav(); location.hash = '#/'; route(); toast('Đã chuyển sang ' + r.user.name);
  } catch (e) { fail(e); }
}
function accountRows(accounts, onPick) {
  return accounts.map((a) => h('div', { class: 'acct' + (a.current ? ' cur' : '') }, avatar(a, 'md'),
    h('div', { class: 'at' }, h('b', {}, a.name), h('span', { class: 'muted' }, a.email)),
    a.current ? h('span', { class: 'status st-accepted' }, 'Đang dùng') : h('button', { type: 'button', class: 'btn sm primary', onclick: () => onPick(a) }, 'Chuyển')));
}
async function openAccounts() {
  const list = h('div', { class: 'acct-list' }, h('div', { class: 'spin' }));
  let m;
  const box = h('div', {}, h('h3', {}, 'Chuyển tài khoản'), h('p', { class: 'sub' }, 'Các tài khoản đã đăng nhập trên trình duyệt này.'), list,
    h('button', { type: 'button', class: 'btn', style: 'width:100%;margin-top:14px', html: icon('plus') + 'Thêm tài khoản khác', onclick: () => { m.close(); openAuth('login'); } }));
  m = modal(box);
  try { const { accounts } = await api('/accounts'); list.replaceChildren(...accountRows(accounts, (a) => { m.close(); switchAccount(a.id); })); } catch (e) { list.textContent = e.message; }
}

// ---------- auth ----------
// shown after sign-up when the site requires email confirmation
function verifyNotice(email, m, resendNow = false) {
  const note = h('p', { class: 'muted', style: 'margin-top:10px;font-size:14px' });
  const send = async () => { try { await api('/resend-verification', { method: 'POST', body: { email } }); note.textContent = 'Đã gửi lại email xác nhận. Hãy kiểm tra hộp thư.'; } catch (e) { note.textContent = e.message; } };
  if (resendNow) send();
  return h('form', { onsubmit: (e) => e.preventDefault() }, h('h3', {}, 'Kiểm tra email của bạn 📬'),
    h('p', { class: 'sub' }, 'Chúng tôi đã gửi liên kết xác nhận tới ' + email + '. Bấm vào liên kết trong email để kích hoạt tài khoản (nhớ xem cả mục Spam).'),
    h('button', { type: 'button', class: 'btn', onclick: send }, 'Gửi lại email'), h('button', { type: 'button', class: 'btn ghost', style: 'margin-left:8px', onclick: () => m.close() }, 'Đóng'), note);
}
function forgotForm(m) {
  const msg = h('div', { class: 'err', hidden: true });
  const f = h('form', { novalidate: true }, h('h3', {}, 'Quên mật khẩu'), h('p', { class: 'sub' }, 'Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.'), msg,
    h('label', { class: 'f' }, h('span', {}, 'Email'), h('input', { name: 'email', type: 'email', autocomplete: 'email', required: true })),
    h('button', { class: 'btn primary lg', style: 'width:100%', type: 'submit' }, 'Gửi liên kết đặt lại'),
    h('p', { style: 'text-align:center;margin-top:12px' }, h('button', { type: 'button', class: 'linkbtn', onclick: () => { m.close(); openAuth('login'); } }, 'Quay lại đăng nhập')));
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    try { await api('/forgot', { method: 'POST', body: { email: f.email.value } }); msg.hidden = false; msg.style.color = '#34d399'; msg.textContent = 'Nếu email này đã đăng ký, bạn sẽ nhận được thư trong ít phút. Hãy kiểm tra cả mục Spam.'; }
    catch (ex) { msg.hidden = false; msg.textContent = ex.message; btn.disabled = false; }
  });
  return f;
}
function pageReset(query) {
  const token = new URLSearchParams(query || '').get('token') || '';
  const err = h('div', { class: 'err', hidden: true });
  const f = h('form', { novalidate: true, class: 'card', style: 'padding:24px;max-width:440px;margin:40px auto' }, h('h2', { class: 'title' }, 'Đặt lại mật khẩu'), err,
    h('label', { class: 'f' }, h('span', {}, 'Mật khẩu mới'), h('input', { name: 'p1', type: 'password', minlength: 8, autocomplete: 'new-password', required: true }), h('small', {}, 'Tối thiểu 8 ký tự')),
    h('label', { class: 'f' }, h('span', {}, 'Nhập lại mật khẩu'), h('input', { name: 'p2', type: 'password', minlength: 8, autocomplete: 'new-password', required: true })),
    h('button', { class: 'btn primary lg', style: 'width:100%', type: 'submit' }, 'Đổi mật khẩu'));
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); err.hidden = true;
    if (f.p1.value !== f.p2.value) { err.textContent = 'Hai mật khẩu chưa giống nhau'; err.hidden = false; return; }
    try { await api('/reset', { method: 'POST', body: { token, password: f.p1.value } }); toast('Đã đổi mật khẩu, hãy đăng nhập'); location.hash = '#/'; openAuth('login'); }
    catch (ex) { err.textContent = ex.message; err.hidden = false; }
  });
  main.append(h('div', { class: 'wrap' }, f));
}
function pageEmailVerified(query) {
  const ok = new URLSearchParams(query || '').get('ok') === '1';
  main.append(h('div', { class: 'wrap' }, h('div', { class: 'card empty', style: 'margin:60px auto;max-width:480px' }, h('h2', {}, ok ? 'Đã xác nhận email ✅' : 'Liên kết không hợp lệ'),
    h('p', { class: 'muted' }, ok ? 'Tài khoản của bạn đã được kích hoạt và đã đăng nhập.' : 'Liên kết đã hết hạn hoặc đã dùng rồi. Hãy đăng nhập để nhận lại email xác nhận.'),
    h('a', { class: 'btn primary', style: 'margin-top:14px', href: '#/' }, 'Vào xgaigu'))));
  if (ok) api('/me').then((r) => { S.user = r.user; renderNav(); connectEvents(); }).catch(() => {});
}

function openAuth(mode = 'login') {
  let m;
  const thisYear = new Date().getFullYear();
  const render = (mode) => {
    const reg = mode === 'register';
    const err = h('div', { class: 'err', hidden: true });
    const picker = placePicker();
    const saved = h('div', { class: 'saved-accts', hidden: true });
    if (!reg) api('/accounts').then(({ accounts }) => {
      const others = accounts.filter((a) => !a.current);
      if (!others.length) return;
      saved.replaceChildren(h('p', { class: 'muted', style: 'font-size:13px;margin-bottom:8px' }, 'Tài khoản đã đăng nhập trên thiết bị này'), ...accountRows(others, (a) => { m.close(); switchAccount(a.id); }));
      saved.hidden = false;
    }).catch(() => {});
    const f = h('form', { novalidate: true },
      h('h3', {}, reg ? 'Tạo tài khoản miễn phí' : 'Chào mừng trở lại'),
      h('p', { class: 'sub' }, reg ? 'Chỉ mất 30 giây. Dành cho người từ 18 tuổi.' : 'Đăng nhập để chat, đặt hẹn và xem livestream.'),
      h('div', { class: 'tabs' },
        h('button', { type: 'button', class: reg ? '' : 'on', onclick: () => swap('login') }, 'Đăng nhập'),
        h('button', { type: 'button', class: reg ? 'on' : '', onclick: () => swap('register') }, 'Đăng ký')),
      !reg && saved,
      err,
      reg && h('label', { class: 'f' }, h('span', {}, 'Tên hiển thị'), h('input', { name: 'name', maxlength: 40, autocomplete: 'nickname', required: true })),
      h('label', { class: 'f' }, h('span', {}, 'Email'), h('input', { name: 'email', type: 'email', autocomplete: 'email', required: true })),
      h('label', { class: 'f' }, h('span', {}, 'Mật khẩu'), h('input', { name: 'password', type: 'password', autocomplete: reg ? 'new-password' : 'current-password', minlength: 8, required: true }),
        reg && h('small', {}, 'Tối thiểu 8 ký tự')),
      reg && h('div', { class: 'two' },
        h('label', { class: 'f' }, h('span', {}, 'Năm sinh'), h('input', { name: 'birthYear', type: 'number', min: thisYear - 100, max: thisYear - 18, placeholder: String(thisYear - 25), required: true })),
        h('label', { class: 'f' }, h('span', {}, 'Giới tính'), h('select', { name: 'gender' },
          h('option', { value: '' }, 'Không nêu'), h('option', { value: 'nu' }, 'Nữ'), h('option', { value: 'nam' }, 'Nam'), h('option', { value: 'khac' }, 'Khác')))),
      reg && h('div', { class: 'f' }, h('span', { style: 'display:block;margin-bottom:6px;color:#d9cce6;font-size:14px;font-weight:600' }, 'Địa chỉ / khu vực của bạn'), picker.el),
      reg && h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'agree' }),
        h('span', { html: 'Tôi đủ 18 tuổi và đồng ý với <a href="#/terms" style="text-decoration:underline">Điều khoản & Quy tắc cộng đồng</a>.' })),
      h('button', { class: 'btn primary lg', style: 'width:100%', type: 'submit' }, reg ? 'Tạo tài khoản' : 'Đăng nhập'),
      !reg && h('p', { style: 'text-align:center;margin-top:12px' }, h('button', { type: 'button', class: 'linkbtn', onclick: () => m.box.querySelector('form').replaceWith(forgotForm(m)) }, 'Quên mật khẩu?')));
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      d.agree = !!f.agree?.checked;
      if (reg) Object.assign(d, picker.get());
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      try {
        const r = await api(reg ? '/register' : '/login', { method: 'POST', body: d });
        if (r.needVerify) { m.box.querySelector('form').replaceWith(verifyNotice(r.email, m)); return; }
        S.user = r.user; m.close(); afterAuth(); toast(reg ? 'Chào mừng đến với xgaigu 💖' : 'Đã đăng nhập');
      } catch (ex) {
        err.textContent = ex.message; err.hidden = false; btn.disabled = false;
        if (ex.code === 'unverified') { err.append(' ', h('button', { type: 'button', class: 'linkbtn', onclick: () => m.box.querySelector('form').replaceWith(verifyNotice(d.email, m, true)) }, 'Gửi lại email xác nhận')); }
      }
    });
    return f;
  };
  const swap = (mode) => { const nf = render(mode); m.box.querySelector('form').replaceWith(nf); nf.querySelector('input').focus(); };
  m = modal(render(mode));
}

function afterAuth() { connectEvents(); renderNav(); route(); }

function connectEvents() {
  if (S.es) S.es.close();
  S.es = null;
  if (!S.user) return;
  const es = new EventSource('/api/events');
  es.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.to === S.user.id) { S.unread++; renderNav(); if (!location.hash.startsWith('#/messages')) toast('💬 Bạn có tin nhắn mới'); }
    window.dispatchEvent(new CustomEvent('dm', { detail: m }));
  });
  es.addEventListener('call', (ev) => { onCallEvent(JSON.parse(ev.data)).catch(() => {}); });
  es.addEventListener('booking', () => { toast('📅 Có cập nhật lịch hẹn'); window.dispatchEvent(new Event('bookingupdate')); });
  S.es = es;
}

// ---------- language picker ----------
function openLanguage() {
  const I = window.XGI18n; if (!I) return;
  const search = h('input', { type: 'search', placeholder: 'Tìm ngôn ngữ… / Search…', 'aria-label': 'Tìm ngôn ngữ' });
  const list = h('div', { class: 'lang-list notranslate', translate: 'no' });
  const draw = () => {
    const q = search.value.trim().toLowerCase();
    list.replaceChildren(...I.LANGS.filter((l) => !q || l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q))
      .map((l) => h('button', { type: 'button', class: 'lang' + (!I.isAuto() && I.current() === l.code ? ' on' : ''), onclick: () => I.choose(l.code) }, h('b', {}, l.name), h('span', { class: 'muted' }, l.code))));
  };
  search.addEventListener('input', draw); draw();
  const auto = h('button', { type: 'button', class: 'btn' + (I.isAuto() ? ' primary' : ''), style: 'width:100%;margin-bottom:12px', onclick: () => I.useAuto(), html: icon('pin') + '<span>Tự động theo quốc gia của bạn' + (I.country() ? ' (' + esc(I.country()) + ')' : '') + '</span>' });
  modal(h('div', {}, h('h3', {}, 'Ngôn ngữ / Language'), h('p', { class: 'sub' }, 'Website tự dịch sang ngôn ngữ bạn chọn. Bản dịch tự động có thể chưa hoàn hảo.'), auto, search, list), { wide: true });
}

// ---------- visitor ping (anonymous device id; lets the admin see online visitors and daily traffic) ----------
function ping(pv) {
  try {
    let d = localStorage.getItem('xg_did');
    if (!d) { d = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^\w-]/g, ''); localStorage.setItem('xg_did', d); }
    fetch('/api/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ did: d, pv: !!pv }), keepalive: true }).catch(() => {});
  } catch {}
}

// ---------- install app (PWA) ----------
const Install = (() => {
  let evt = null;
  const FLAG = 'xg_installed';
  const lsGet = () => { try { return localStorage.getItem(FLAG) === '1'; } catch { return false; } };
  const lsSet = () => { try { localStorage.setItem(FLAG, '1'); } catch {} };
  const lsClear = () => { try { localStorage.removeItem(FLAG); } catch {} };
  // Facebook / Zalo / Instagram in-app browsers cannot install apps
  const inAppBrowser = () => /FBAN|FBAV|FB_IAB|Zalo|Instagram|Line\/|Messenger|TikTok|; wv\)/i.test(navigator.userAgent);
  const running = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let known = lsGet(); // installed before (remembered), or detected below
  const standalone = () => { if (running()) { known = true; lsSet(); } return known; };
  let fabDismissed = false; try { fabDismissed = sessionStorage.getItem('xg_fab_x') === '1'; } catch {}
  const ios = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const refresh = () => { const inst = standalone(); document.querySelectorAll('.xg-install').forEach((el) => { el.hidden = inst; }); if (fab) fab.hidden = inst || fabDismissed; };
  let fab = null;
  // Chrome can tell us whether this site's app is already installed on the device
  // and it is the authority: an uninstalled app must bring the button back
  if (navigator.getInstalledRelatedApps) navigator.getInstalledRelatedApps().then((a) => { known = !!(a && a.length) || running(); if (known) lsSet(); else lsClear(); refresh(); }).catch(() => {});
  // the browser only offers installation when the app is NOT installed
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); evt = e; known = false; lsClear(); refresh(); });
  window.addEventListener('appinstalled', () => { evt = null; known = true; lsSet(); refresh(); report('install'); toast('Đã cài ứng dụng xgaigu!'); });
  // if the website moved to a new domain, an app installed from the old one jumps to the new domain
  fetch('/api/site', { cache: 'no-store' }).then((r) => r.json()).then((j) => { if (j && j.moved && j.url) location.replace(j.url + location.pathname + location.search + location.hash); }).catch(() => {});
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  // anonymous per-device id, only used to count installs and launches without double counting
  const did = (() => { try { let d = localStorage.getItem('xg_did'); if (!d) { d = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^\w-]/g, ''); localStorage.setItem('xg_did', d); } return d; } catch { return 'nostorage-' + Math.random().toString(36).slice(2); } })();
  const report = (kind) => { try { fetch('/api/app-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, did }), keepalive: true }).catch(() => {}); } catch {} };
  if (running()) { try { if (!sessionStorage.getItem('xg_open_sent')) { sessionStorage.setItem('xg_open_sent', '1'); report('open'); } } catch { report('open'); } }
  const steps = (items) => h('ol', { style: 'margin:12px 0 0 20px;display:grid;gap:8px;line-height:1.5' }, items.map((t) => h('li', {}, t)));
  async function run() {
    report('click');
    if (evt) { const e = evt; evt = null; e.prompt(); const c = await e.userChoice.catch(() => null); if (c && c.outcome === 'accepted') report('install'); refresh(); return; }
    if (inAppBrowser()) modal(h('div', {}, h('h3', {}, 'Cài ứng dụng xgaigu'), h('p', { class: 'sub' }, 'Bạn đang mở bằng trình duyệt trong Facebook/Zalo nên không cài được. Hãy mở trang này bằng Chrome (Android) hoặc Safari (iPhone):'),
      steps(['Bấm menu ⋮ hoặc biểu tượng “…” ở góc trên.', 'Chọn “Mở bằng trình duyệt” (Open in browser).', 'Bấm lại nút “Tải ứng dụng” trong trình duyệt đó.'])));
    else if (ios()) modal(h('div', {}, h('h3', {}, 'Cài ứng dụng xgaigu'), h('p', { class: 'sub' }, 'Trên iPhone/iPad, hãy mở trang này bằng Safari rồi làm theo 3 bước:'),
      steps(['Bấm nút Chia sẻ ⬆️ ở thanh dưới của Safari.', 'Chọn “Thêm vào Màn hình chính”.', 'Bấm “Thêm” – biểu tượng xgaigu sẽ xuất hiện ngay trên màn hình.'])));
    else modal(h('div', {}, h('h3', {}, 'Cài ứng dụng xgaigu'), h('p', { class: 'sub' }, 'Trình duyệt của bạn chưa hiện cửa sổ cài đặt tự động. Bạn làm theo cách sau:'),
      steps(['Mở menu ⋮ của trình duyệt (góc trên bên phải).', 'Chọn “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”.', 'Xác nhận – ứng dụng sẽ được cài vào máy ngay, không cần qua cửa hàng ứng dụng.'])));
  }
  const button = (cls, withText = true) => h('button', { type: 'button', class: 'xg-install ' + cls, hidden: standalone(), onclick: run, 'aria-label': 'Cài đặt ứng dụng', html: '<span aria-hidden="true">📲</span>' + (withText ? '<span class="t">Cài đặt ứng dụng</span>' : '') });
  // floating download button, shown on every page until the app is installed
  const mountFab = () => {
    fab = h('div', { class: 'install-fab', hidden: standalone() || fabDismissed },
      h('button', { type: 'button', class: 'go', onclick: run, 'aria-label': 'Tải ứng dụng', html: '<span aria-hidden="true">📲</span><span>Tải ứng dụng</span>' }),
      h('button', { type: 'button', class: 'x', 'aria-label': 'Đóng', onclick: () => { fabDismissed = true; try { sessionStorage.setItem('xg_fab_x', '1'); } catch {} refresh(); } }, '×'));
    document.body.append(fab);
  };
  if (document.body) mountFab(); else document.addEventListener('DOMContentLoaded', mountFab);
  return { run, button, standalone, ios, inAppBrowser, report };
})();

// ---------- nav ----------
const NAV = [
  ['#/', 'Trang chủ', 'home'], ['#/feed', 'Video', 'play'], ['#/regions', 'Khu vực', 'pin'], ['#/nearby', 'Quanh đây', 'pin'], ['#/people', 'Làm quen', 'users'], ['#/live', 'Livestream', 'live'],
];
function renderNav() {
  const cur = location.hash || '#/';
  const on = (href) => (href === '#/' ? cur === '#/' : cur.startsWith(href));
  const nav = $('#nav');
  nav.innerHTML = ''; nav.classList.toggle('out', !S.user);
  nav.append(
    h('a', { class: 'logo notranslate', translate: 'no', href: '#/', 'aria-label': 'xgaigu – trang chủ' }, h('span', { class: 'logo-mark' }), h('span', {}, 'xgai', h('b', {}, 'gu'))),
    h('div', { class: 'links' }, NAV.map(([href, label]) => h('a', { href, class: on(href) ? 'on' : '' }, label)),
      S.user && h('a', { href: '#/messages', class: on('#/messages') ? 'on' : '' }, 'Tin nhắn', S.unread > 0 && h('span', { class: 'badge' }, S.unread)),
      S.user && h('a', { href: '#/dates', class: on('#/dates') ? 'on' : '' }, 'Lịch hẹn')),
    h('div', { class: 'grow' }),
    h('div', { class: 'nav-actions' },
      Install.button('btn install-btn sm'),
      h('a', { class: 'iconbtn', href: '#/search', 'aria-label': 'Tìm kiếm', html: icon('search') }),
      h('button', { type: 'button', class: 'iconbtn lang-btn', 'aria-label': 'Ngôn ngữ / Language', onclick: openLanguage, html: icon('globe') }),
      S.user ? [
        h('a', { class: 'btn primary sm', href: '#/upload', html: icon('plus') + '<span>Đăng video</span>' }),
        h('a', { class: 'btn sm hide-m', href: '#/golive', html: icon('live') + '<span>Phát trực tiếp</span>' }),
        h('a', { href: '#/me', 'aria-label': 'Hồ sơ của tôi' }, avatar(S.user, 'md')),
      ] : [
        h('button', { class: 'btn ghost sm', onclick: () => openAuth('login') }, 'Đăng nhập'),
        h('button', { class: 'btn primary sm', onclick: () => openAuth('register') }, 'Đăng ký'),
      ]));
  const tb = $('#tabbar');
  tb.innerHTML = '';
  const tab = (href, label, ic, extra) => h('a', { href, class: on(href) ? 'on' : '', 'aria-label': label }, extra || h('span', { html: icon(ic) }), h('span', {}, label));
  tb.append(
    tab('#/', 'Trang chủ', 'home'), tab('#/feed', 'Video', 'play'),
    h('a', { href: S.user ? '#/upload' : '#/', 'aria-label': 'Đăng video', onclick: (e) => { if (!S.user) { e.preventDefault(); openAuth('register'); } } }, h('span', { class: 'plus', html: icon('plus') })),
    tab('#/live', 'Live', 'live'),
    S.user ? tab('#/messages', 'Chat', 'msg', h('span', { html: icon('msg') })) : tab('#/nearby', 'Quanh đây', 'pin'));
  if (S.user && S.unread > 0) tb.children[4].append(h('span', { class: 'badge' }, S.unread));
}

// ---------- media ----------
const ytId = (u) => { const m = u.match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/); return m && m[1]; };
function mediaEl(v, { controls = false, lazy = false } = {}) {
  const src = v.file || v.url;
  const y = !v.file && ytId(v.url);
  if (y && lazy) return h('iframe', { 'data-yt': y, allow: 'autoplay; encrypted-media; picture-in-picture', allowfullscreen: true, title: v.caption || 'Video' });
  if (y) return h('iframe', { src: `https://www.youtube-nocookie.com/embed/${y}?playsinline=1&rel=0&modestbranding=1`, allow: 'autoplay; encrypted-media; picture-in-picture', allowfullscreen: true, title: v.caption || 'Video', loading: 'lazy' });
  const el = h('video', { playsinline: true, muted: true, preload: lazy ? 'none' : 'metadata', poster: v.thumb || null, controls: controls || null, 'aria-label': v.caption || 'Video' });
  el.muted = true;
  if (/\.m3u8(\?|$)/.test(src) && window.Hls && Hls.isSupported()) { const hls = new Hls(); hls.loadSource(src); hls.attachMedia(el); }
  else el.src = src;
  return el;
}

function setSound(on) {
  S.sound = on;
  document.querySelectorAll('.slide video').forEach((v) => { v.muted = !on; v._sync && v._sync(); });
}
// Browsers only allow autoplay while muted; the first tap/swipe anywhere on the page switches sound on.
['pointerup', 'keydown'].forEach((ev) => window.addEventListener(ev, function once() {
  window.removeEventListener(ev, once, true);
  if (!S.sound) { setSound(true); S.unmutedAt = performance.now(); }
}, true));

let playObserver;
function observePlay(el) {
  if (!playObserver) {
    playObserver = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      { // count a view once the video has been on screen for 3 seconds
        const vis = e.isIntersecting && e.intersectionRatio > 0.6;
        clearTimeout(v._vt);
        if (vis && v.dataset.vid && !v._viewed) v._vt = setTimeout(() => { v._viewed = true; fetch('/api/videos/' + v.dataset.vid + '/view', { method: 'POST', credentials: 'same-origin' }).catch(() => {}); }, 3000);
      }
      if (v instanceof HTMLIFrameElement) {
        const id = v.dataset.yt, on = e.isIntersecting && e.intersectionRatio > 0.6;
        if (on) Hearts.watch(v.dataset.vid, v.closest('.slide'));
        if (on && !v.src) v.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${S.sound ? 0 : 1}&enablejsapi=1&playsinline=1&rel=0&modestbranding=1`;
        else if (!on && v.src) v.removeAttribute('src');
        return;
      }
      if (!(v instanceof HTMLVideoElement)) return;
      if (e.isIntersecting && e.intersectionRatio > 0.6) {
        v._active = true; v.preload = 'auto'; Hearts.watch(v.dataset.vid, v.closest('.slide'));
        { const nx = v.closest('.slide') && v.closest('.slide').nextElementSibling; const nv = nx && nx.querySelector('video'); if (nv && nv.preload !== 'auto') nv.preload = 'auto'; } // start fetching the next video early
        v.muted = !S.sound; v._sync && v._sync(); v._upd && v._upd();
        v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
      } else { v._active = false; v._upd && v._upd(); v.pause(); }
    }), { threshold: [0, 0.6, 1] });
  }
  playObserver.observe(el);
}

// ---------- actions on videos ----------
async function needLogin() { if (!S.user) { openAuth('login'); return false; } return true; }

async function startChat(user) {
  if (!(await needLogin())) return;
  if (user.id === S.user.id) return toast('Đây là bạn mà 😊');
  location.hash = '#/messages/' + user.id;
}

async function openCall(user, videoId) {
  if (!(await needLogin())) return;
  if (user.id === S.user.id) return;
  const m = modal(h('div', {}, h('h3', {}, 'Gọi cho ' + user.name), h('div', { class: 'spin' })));
  try {
    if (!user.canCall) throw new Error('nocall');
    const { phone } = await api(videoId ? '/videos/' + videoId + '/phone' : '/users/' + user.id + '/phone');
    m.box.innerHTML = '';
    m.box.append(h('button', { class: 'iconbtn x', onclick: m.close, 'aria-label': 'Đóng', html: icon('x') }),
      h('h3', {}, 'Gọi cho ' + user.name), h('p', { class: 'sub' }, 'Người này đã đồng ý chia sẻ số điện thoại. Hãy lịch sự và tôn trọng.'),
      h('a', { class: 'btn primary lg', style: 'width:100%', href: 'tel:' + phone, html: icon('phone') + '<span>Gọi ' + esc(phone) + '</span>' }),
      h('p', { class: 'muted', style: 'font-size:13px;margin-top:14px' }, 'Mẹo an toàn: không chuyển tiền cho người chưa gặp, nên gặp nơi công cộng.'));
  } catch (e) {
    m.box.innerHTML = '';
    m.box.append(h('button', { class: 'iconbtn x', onclick: m.close, 'aria-label': 'Đóng', html: icon('x') }),
      h('h3', {}, user.name + ' chưa mở số điện thoại'), h('p', { class: 'sub' }, 'Bạn có thể gửi lời nhờ gọi qua tin nhắn – họ sẽ quyết định có trả lời hay không.'),
      h('button', { class: 'btn primary', style: 'width:100%', onclick: async () => {
        try { await api('/messages/' + user.id, { method: 'POST', body: { body: '📞 Mình muốn trò chuyện qua điện thoại, bạn có tiện chia sẻ số không?' } }); toast('Đã gửi lời nhờ gọi'); m.close(); } catch (er) { fail(er); }
      } }, 'Gửi lời nhờ gọi'));
  }
}

async function openBook(user, videoId) {
  if (!(await needLogin())) return;
  if (user.id === S.user.id) return toast('Đây là video của bạn');
  const err = h('div', { class: 'err', hidden: true });
  const min = new Date(Date.now() + 3600e3 - new Date().getTimezoneOffset() * 60e3).toISOString().slice(0, 16);
  const f = h('form', {},
    h('h3', {}, 'Hẹn gặp ' + user.name), h('p', { class: 'sub' }, 'Gửi lời mời – chỉ khi họ đồng ý, lịch hẹn mới được xác nhận.'),
    err,
    h('label', { class: 'f' }, h('span', {}, 'Thời gian'), h('input', { type: 'datetime-local', name: 'when', min, required: true })),
    h('label', { class: 'f' }, h('span', {}, 'Địa điểm'), h('input', { name: 'place', maxlength: 120, placeholder: 'VD: Highlands Coffee, Nguyễn Huệ', required: true }),
      h('small', {}, 'Chọn nơi công cộng, đông người, lần đầu nên đi một mình & báo bạn bè.')),
    h('label', { class: 'f' }, h('span', {}, 'Lời nhắn (tuỳ chọn)'), h('textarea', { name: 'note', maxlength: 300, placeholder: 'Giới thiệu đôi chút về bạn…' })),
    h('div', { class: 'notice', html: icon('shield') + '<span>Không trao đổi tiền bạc hay dịch vụ tình dục. Tài khoản vi phạm sẽ bị khoá vĩnh viễn.</span>' }),
    h('button', { class: 'btn primary lg', style: 'width:100%;margin-top:16px', type: 'submit' }, 'Gửi lời mời hẹn'));
  const m = modal(f, { wide: true });
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    try {
      await api('/bookings', { method: 'POST', body: { to: user.id, videoId, when: new Date(d.when).getTime(), place: d.place, note: d.note } });
      m.close(); toast('Đã gửi lời mời hẹn 💌'); location.hash = '#/messages/' + user.id;
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
  });
}

function openReport(type, id) {
  if (!S.user) return openAuth('login');
  const f = h('form', {}, h('h3', {}, 'Báo cáo vi phạm'), h('p', { class: 'sub' }, 'Cho chúng tôi biết vấn đề. Đội ngũ kiểm duyệt sẽ xem xét sớm nhất.'),
    h('label', { class: 'f' }, h('span', {}, 'Lý do'), h('select', { name: 'reason' }, ['Nội dung nhạy cảm / khiêu dâm', 'Lừa đảo, xin tiền', 'Quấy rối, xúc phạm', 'Giả mạo, ảnh người khác', 'Người dưới 18 tuổi', 'Khác'].map((r) => h('option', {}, r)))),
    h('button', { class: 'btn primary', style: 'width:100%', type: 'submit' }, 'Gửi báo cáo'));
  const m = modal(f);
  f.addEventListener('submit', async (e) => { e.preventDefault(); try { await api('/reports', { method: 'POST', body: { type, id, reason: f.reason.value } }); m.close(); toast('Cảm ơn bạn, chúng tôi sẽ xem xét'); } catch (ex) { fail(ex); } });
}

async function openComments(v, countEl) {
  const list = h('div', { style: 'display:grid;gap:14px;margin:16px 0;max-height:46vh;overflow:auto' }, h('div', { class: 'spin' }));
  const input = h('input', { placeholder: 'Viết bình luận…', maxlength: 300, 'aria-label': 'Bình luận' });
  const form = h('form', { class: 'composer', style: 'padding:0;border:0' }, input, h('button', { class: 'btn primary', type: 'submit', 'aria-label': 'Gửi', html: icon('send') }));
  const m = modal(h('div', {}, h('h3', {}, 'Bình luận'), list, form), { sheet: true });
  const load = async () => {
    const { comments } = await api('/videos/' + v.id + '/comments');
    list.innerHTML = '';
    if (!comments.length) list.append(h('p', { class: 'muted' }, 'Chưa có bình luận. Hãy là người đầu tiên!'));
    comments.forEach((c) => list.append(h('div', { class: 'lmsg' }, avatar(c.user), h('div', {}, h('b', {}, c.user.name), h('span', { translate: 'no' }, c.body), h('div', { class: 'muted', style: 'font-size:12px' }, timeAgo(c.createdAt))))));
    if (countEl) countEl.textContent = comments.length;
  };
  load().catch(fail);
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!input.value.trim()) return;
    if (!S.user) return openAuth('login');
    try { await api('/videos/' + v.id + '/comments', { method: 'POST', body: { body: input.value } }); input.value = ''; Pref.bump(v.province, 3); load(); } catch (ex) { fail(ex); }
  });
}

async function toggleLike(v, btn) {
  if (!(await needLogin())) return;
  try {
    const r = await api('/videos/' + v.id + '/like', { method: 'POST' });
    v.liked = r.liked; v.likes = r.likes; if (r.liked) Pref.bump(v.province, 3);
    btn.classList.toggle('liked', r.liked); btn.querySelector('span.n').textContent = r.likes;
  } catch (e) { fail(e); }
}

async function share(v) {
  const url = location.origin + '/v/' + v.id; // server-rendered page with a rich link preview, then opens the player
  if (navigator.share) { try { await navigator.share({ title: 'xgaigu', text: v.caption || 'Xem video này', url }); return; } catch {} }
  try { await navigator.clipboard.writeText(url); toast('Đã sao chép liên kết'); } catch { toast(url); }
}

// ---------- download with the xgaigu logo + nickname burned in (the website itself shows no logo) ----------
function slugName(t) { return String(t || 'video').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'video'; }
function saveBlob(blob, filename) {
  const a = h('a', { href: URL.createObjectURL(blob), download: filename, style: 'display:none' });
  document.body.append(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

// Small PNG with the logo and the nickname (drawn here so any language/emoji renders correctly).
async function makeWatermark(name) {
  try { await document.fonts.load("800 44px 'Be Vietnam Pro'"); await document.fonts.load("600 34px 'Be Vietnam Pro'"); } catch {}
  const W = 640, H = 150, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,.38)'; g.beginPath(); g.roundRect(0, 0, W, H, 40); g.fill();
  const grad = g.createLinearGradient(24, 30, 114, 120); grad.addColorStop(0, '#ff2e7e'); grad.addColorStop(1, '#ff6b4a');
  g.fillStyle = grad; g.beginPath(); g.roundRect(24, 30, 90, 90, 26); g.fill();
  g.save(); g.translate(24 + 45 - 30, 30 + 45 - 30); g.scale(2.5, 2.5); g.fillStyle = '#fff'; g.fill(new Path2D(P.heart)); g.restore();
  g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 6;
  g.font = "800 46px 'Be Vietnam Pro', system-ui, sans-serif"; g.fillStyle = '#fff'; g.fillText('xgai', 134, 76);
  const w1 = g.measureText('xgai').width; g.fillStyle = '#ff6b9a'; g.fillText('gu', 134 + w1, 76);
  g.font = "600 34px 'Be Vietnam Pro', system-ui, sans-serif"; g.fillStyle = '#fff';
  let label = '@' + name; const maxW = W - 134 - 28;
  while (g.measureText(label).width > maxW && label.length > 4) label = label.slice(0, -2) + '…';
  g.fillText(label, 134, 118);
  return c;
}

// Fallback when the server cannot burn the logo in: play the video onto a canvas with the logo and record it (real time).
function recordWatermarked(url, wm, onPct) {
  return new Promise((resolve, reject) => {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return reject(new Error('unsupported'));
    const v = document.createElement('video'); v.playsInline = true; v.preload = 'auto'; v.src = url;
    v.onerror = () => reject(new Error('load'));
    v.onloadedmetadata = async () => {
      try {
        const k = Math.min(1, 1080 / Math.max(v.videoWidth, v.videoHeight)), W = Math.round(v.videoWidth * k / 2) * 2, H = Math.round(v.videoHeight * k / 2) * 2;
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
        const ac = new (window.AudioContext || window.webkitAudioContext)(), src = ac.createMediaElementSource(v), dest = ac.createMediaStreamDestination(); src.connect(dest);
        const stream = cv.captureStream(30); dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        const mime = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m)) || '';
        const rec = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: 4_000_000, audioBitsPerSecond: 128_000 });
        const chunks = []; rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        rec.onstop = () => { ac.close().catch(() => {}); resolve({ blob: new Blob(chunks, { type: mime.startsWith('video/mp4') ? 'video/mp4' : 'video/webm' }), ext: mime.startsWith('video/mp4') ? 'mp4' : 'webm' }); };
        const frame = () => {
          g.drawImage(v, 0, 0, W, H);
          const ww = W * 0.42, wh = (ww * wm.height) / wm.width; g.drawImage(wm, W * 0.04, H * 0.86 - wh, ww, wh);
          onPct(v.duration ? v.currentTime / v.duration : 0);
          if (!v.ended) requestAnimationFrame(frame);
        };
        v.onended = () => setTimeout(() => rec.stop(), 150);
        rec.start(500); await ac.resume(); await v.play(); frame();
      } catch (e) { reject(e); }
    };
  });
}

let downloading = false;
async function downloadVideo(v) {
  if (!v.file) return toast('Video này dùng liên kết ngoài nên không thể tải xuống', true);
  if (downloading) return;
  downloading = true;
  const note = h('div', { class: 'toast' }, 'Đang chuẩn bị video để tải xuống…');
  $('#toast-root').append(note);
  const name = v.user.name || 'xgaigu', base = 'xgaigu-' + slugName(name) + '-' + v.id;
  try {
    const wm = await makeWatermark(name);
    let saved = false;
    try {
      const r = await fetch('/api/videos/' + v.id + '/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wm: wm.toDataURL('image/png') }) });
      if (r.ok) { saveBlob(await r.blob(), base + '.mp4'); saved = true; }
      else if (r.status === 503 || r.status === 404 || r.status === 429) { const d = await r.json().catch(() => ({})); throw Object.assign(new Error(d.error || 'Không tải được video'), { final: true }); }
    } catch (e) { if (e.final) throw e; }
    if (!saved) { // server can't burn the logo in → record it in the browser instead
      const { blob, ext } = await recordWatermarked(v.file, wm, (p) => { note.textContent = 'Đang tạo video có logo… ' + Math.round(p * 100) + '%'; });
      saveBlob(blob, base + '.' + ext);
    }
    toast('Đã tải video xuống');
  } catch (e) { toast(e.final ? e.message : 'Không tải được video', true); }
  note.remove(); downloading = false;
}

// ---------- region interest (kept on this device; the home feed favours these provinces) ----------
const Pref = {
  get() { try { return JSON.parse(localStorage.getItem('xg_pref') || '{}') || {}; } catch { return {}; } },
  bump(province, w) {
    if (!province) return;
    try {
      const p = this.get();
      for (const k of Object.keys(p)) { p[k] *= 0.97; if (p[k] < 0.2) delete p[k]; } // old interests fade slowly
      p[province] = (p[province] || 0) + w;
      const keep = Object.entries(p).sort((a, b) => b[1] - a[1]).slice(0, 12);
      localStorage.setItem('xg_pref', JSON.stringify(Object.fromEntries(keep)));
    } catch {}
  },
  param() { return Object.entries(this.get()).map(([k, v]) => k.replace(/[|~]/g, ' ') + '~' + v.toFixed(2)).join('|'); },
};

// "Đang hot" / "Mới" badge on a video (automatic, or chosen by an admin)
const isAdmin = () => !!(S.user && S.user.role === 'admin');
// "Đã xác minh" seal: bright blue pill with a white check, shown on every verified video
const SEAL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.6l2.5 1.8 3.1-.2 1.2 2.9 2.8 1.5-.4 3.1 1.6 2.6-1.6 2.7.4 3.1-2.8 1.5-1.2 2.9-3.1-.2L12 22.4l-2.5-1.8-3.1.2-1.2-2.9-2.8-1.5.4-3.1L1.2 12.7l1.6-2.7-.4-3.1 2.8-1.5 1.2-2.9 3.1.2z" fill="#fff"/><path d="M7.9 12.4l2.7 2.7 5.5-5.7" fill="none" stroke="#1d6bff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const vbadge = (small) => h('span', { class: 'vbadge' + (small ? ' sm' : ''), title: 'Video đã được quản trị viên xác minh', html: SEAL + '<b>Đã xác minh</b>' });
const vflags = (v, small) => (v.verified || v.badge ? h('span', { class: 'vflags' }, v.verified && vbadge(small), v.badge && vtag(v)) : null);
const vtag = (v) => (v.badge ? h('span', { class: 'vtag ' + v.badge }, v.badge === 'hot' ? '🔥 Đang hot' : '🆕 Mới') : null);

// ---------- hearts (every tap counts, everyone watching sees them float up) ----------
const Hearts = (() => {
  const cid = Math.random().toString(36).slice(2, 12); // this tab; our own hearts are already drawn locally
  let es = null, watchingId = null, watchingSlide = null;
  const pending = new Map(); // video id -> { n, timer, v, btn }
  const COLORS = ['#ff2e7e', '#ff6b4a', '#ff8ab4', '#ffb33a', '#e11d48', '#ff4fa3'];
  function fly(slideEl, count = 1) {
    const layer = slideEl && slideEl.querySelector('.heart-layer'); if (!layer) return;
    for (let i = 0; i < Math.min(count, 15); i++) {
      const el = document.createElement('span');
      el.className = 'fly-heart';
      el.style.setProperty('--dx', (Math.random() * 90 - 45).toFixed(0) + 'px');
      el.style.setProperty('--rot', (Math.random() * 50 - 25).toFixed(0) + 'deg');
      el.style.setProperty('--dur', (1.6 + Math.random() * 1.1).toFixed(2) + 's');
      el.style.animationDelay = (i * 0.09).toFixed(2) + 's';
      el.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      el.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><path fill="currentColor" d="M12 21s-7.5-4.6-10-9.3C.4 8.5 2.3 4.5 6 4.5c2.2 0 3.6 1.2 4.4 2.4h3.2c.8-1.2 2.2-2.4 4.4-2.4 3.7 0 5.6 4 4 7.2C19.5 16.4 12 21 12 21z"/></svg>';
      el.addEventListener('animationend', () => el.remove());
      layer.append(el);
    }
  }
  function setCount(btn, total) { const n = btn && btn.querySelector('span.n'); if (n) n.textContent = fmtCount(total); }
  function tap(v, btn) {
    v.likes = (v.likes || 0) + 1;
    btn.classList.add('liked'); setCount(btn, v.likes);
    btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
    fly(btn.closest('.slide'), 1);
    watch(v.id, btn.closest('.slide')); // make sure we hear the others' hearts on this video
    if (!v._prefBumped) { v._prefBumped = true; Pref.bump(v.province, 3); }
    const p = pending.get(v.id) || { n: 0, timer: null, v, btn };
    p.n++; clearTimeout(p.timer);
    p.timer = setTimeout(async () => { // send the taps in one small batch
      pending.delete(v.id);
      try { const r = await api('/videos/' + v.id + '/heart', { method: 'POST', body: { n: p.n, cid } }); v.likes = Math.max(v.likes, r.likes); setCount(btn, v.likes); } catch {}
    }, 450);
    pending.set(v.id, p);
  }
  function watch(id, slideEl) {
    if (!id || String(id) === String(watchingId)) return;
    if (es) { es.close(); es = null; }
    watchingId = id; watchingSlide = slideEl;
    try {
      es = new EventSource('/api/videos/' + id + '/live');
      es.addEventListener('heart', (ev) => {
        const d = JSON.parse(ev.data); if (d.cid === cid) return;
        fly(watchingSlide, d.n);
        const btn = watchingSlide && watchingSlide.querySelector('.act.like'); if (btn && d.total) setCount(btn, d.total);
      });
      es.onerror = () => {}; // the browser reconnects by itself
    } catch {}
  }
  window.addEventListener('hashchange', () => { if (es) { es.close(); es = null; watchingId = null; } });
  return { tap, watch };
})();

// ---------- feed ----------
function actBtn(cls, label, ic, count, onclick) {
  const b = h('button', { class: 'act ' + cls + (count == null ? '' : ' cnt'), onclick, 'aria-label': label }, h('span', { class: 'iconbtn', html: icon(ic) }), h('span', { class: 'n' }, count == null ? label : count));
  return b;
}

// YouTube tells the page (via postMessage) when a video ends, so linked videos also move on automatically.
window.addEventListener('message', (e) => {
  if (!/(^|\.)youtube(-nocookie)?\.com$/.test((() => { try { return new URL(e.origin).hostname; } catch { return ''; } })())) return;
  let d = e.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch { return; } }
  if (d && d.event === 'onStateChange' && d.info === 0) { const f = [...document.querySelectorAll('iframe[data-yt]')].find((x) => x.contentWindow === e.source); if (f) f.dispatchEvent(new Event('ytended')); }
});

// Loading ring with a percentage, shown on a video that is still loading (so nobody thinks the site is broken).
function attachLoader(media) {
  const isVideo = media instanceof HTMLVideoElement;
  const pct = h('b', {}, ''), msg = h('span', {}, 'Đang tải video…');
  const ring = h('div', { class: 'vload', role: 'status', 'aria-live': 'polite' }, h('div', { class: 'vring' }), h('div', { class: 'vtext' }, pct, msg));
  const retry = h('button', { type: 'button', class: 'btn sm vretry', hidden: true, onclick: (e) => { e.stopPropagation(); if (isVideo) { media.load(); media.play().catch(() => {}); } retry.hidden = true; started = performance.now(); upd(); } }, 'Thử lại');
  ring.append(retry);
  let started = performance.now(), failed = false;
  const buffered = () => { try { const b = media.buffered, t = media.currentTime; for (let i = 0; i < b.length; i++) if (t >= b.start(i) - 0.1 && t <= b.end(i) + 0.1) return b.end(i); } catch {} return 0; };
  const upd = () => {
    if (!isVideo) return;
    const waiting = media._active && media.readyState < 3 && !media.ended;
    ring.classList.toggle('on', !!(waiting || failed));
    if (failed) { msg.textContent = 'Không tải được video'; pct.textContent = ''; retry.hidden = false; return; }
    retry.hidden = true;
    const dur = media.duration, need = Math.min(isFinite(dur) && dur > 0 ? dur : 3, 3);
    const p = media.readyState >= 1 ? Math.min(99, Math.floor((buffered() - media.currentTime) / need * 100)) : 0;
    pct.textContent = p > 0 ? p + '%' : '';
    msg.textContent = performance.now() - started > 10000 ? 'Mạng hơi chậm, vẫn đang tải…' : 'Đang tải video…';
  };
  if (isVideo) {
    media._upd = upd;
    ['loadstart', 'progress', 'loadedmetadata', 'loadeddata', 'canplay', 'playing', 'waiting', 'stalled', 'timeupdate', 'seeking', 'seeked'].forEach((ev) => media.addEventListener(ev, () => { if (ev === 'waiting' || ev === 'loadstart') started = performance.now(); failed = false; upd(); }));
    media.addEventListener('error', () => { failed = true; upd(); });
    setInterval(() => { if (!media.isConnected) return; if (ring.classList.contains('on')) upd(); }, 1000);
  } else if (media.dataset.yt) { // YouTube frame: ring until the frame has loaded
    ring.classList.add('on'); pct.textContent = '';
    media.addEventListener('load', () => { if (media.src) ring.classList.remove('on'); });
    new MutationObserver(() => { if (media.src) ring.classList.add('on'); else ring.classList.remove('on'); }).observe(media, { attributes: true, attributeFilter: ['src'] });
  }
  return ring;
}

function slide(v) {
  const media = mediaEl(v, { lazy: true });
  media.dataset.vid = v.id;
  const goNext = () => {
    const nx = el.nextElementSibling;
    if (nx && nx.dataset.id) nx.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else el.dispatchEvent(new CustomEvent('xg-end', { bubbles: true })); // last loaded slide: the feed loads more or starts over
  };
  if (media instanceof HTMLVideoElement) media.addEventListener('ended', goNext);
  else if (media.dataset.yt) { media.addEventListener('ytended', goNext); media.addEventListener('load', () => { try { media.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*'); } catch {} }); }
  const mute = h('button', { class: 'mute soundbtn', 'aria-label': 'Bật/tắt tiếng', html: icon('mute') + '<span>Chạm để bật tiếng</span>', onclick: (e) => { e.stopPropagation(); setSound(!S.sound); } });
  if (media instanceof HTMLVideoElement) {
    media._sync = () => { mute.innerHTML = media.muted ? icon('mute') + '<span>Chạm để bật tiếng</span>' : icon('vol'); mute.classList.toggle('on', !media.muted); };
    observePlay(media);
    media.addEventListener('dblclick', (e) => { e.preventDefault(); Hearts.tap(v, like); }); // double-tap the video = heart
    media.addEventListener('click', () => { if (performance.now() - (S.unmutedAt || 0) < 500) return; media.paused ? media.play() : media.pause(); });
  } else { mute.hidden = true; if (media.dataset.yt) observePlay(media); }
  const like = actBtn('like' + (v.liked ? ' liked' : ''), 'Thả tim', 'heart', v.likes, () => Hearts.tap(v, like));
  const cm = actBtn('', 'Bình luận', 'msg', v.comments, () => openComments(v, cm.querySelector('.n')));
  const saveBtn = actBtn('save' + (v.saved ? ' saved' : ''), 'Lưu', 'bookmark', v.saves || 0, async () => {
    if (!(await needLogin())) return;
    try {
      const r = await api('/videos/' + v.id + '/save', { method: 'POST' });
      v.saved = r.saved; v.saves = r.saves; saveBtn.classList.toggle('saved', r.saved); saveBtn.querySelector('span.n').textContent = r.saves;
      toast(r.saved ? 'Đã lưu video. Xem lại trong Hồ sơ → Đã lưu' : 'Đã bỏ lưu');
    } catch (e) { fail(e); }
  });
  const rail = h('div', { class: 'rail' },
    like, cm, saveBtn,
    actBtn('chat', 'Nhắn tin', 'send', null, () => startChat(v.user)),
    actBtn('call', 'Gọi', 'phone', null, () => openCall({ ...v.user, canCall: v.hasPhone }, v.id)),
    actBtn('book', 'Hẹn gặp', 'cal', null, () => openBook(v.user, v.id)),
    actBtn('', 'Chia sẻ', 'share', null, () => share(v)),
    v.file && actBtn('', 'Tải xuống', 'download', null, () => downloadVideo(v)),
    actBtn('', 'Báo cáo', 'flag', null, () => openReport('video', v.id)));
  const el = h('article', { class: 'slide', 'data-id': v.id },
    h('div', { class: 'player' }, media, attachLoader(media), h('div', { class: 'heart-layer', 'aria-hidden': 'true' }), mute,
      h('div', { class: 'meta' }, vflags(v),
        h('a', { class: 'who', href: '#/u/' + v.user.id }, avatar(v.user, 'md'), h('span', {}, v.user.name + (v.user.age ? ', ' + v.user.age : ''))),
        (v.province || v.user.city) && h('div', { class: 'loc', html: icon('pin') + esc(v.province ? (v.district ? v.district + ', ' : '') + v.province : v.user.city) }),
        h('button', { class: 'infobtn', type: 'button', onclick: () => openInfo(v), html: icon('info') + 'Xem thông tin' }),
        v.caption && h('p', { class: 'cap', translate: 'no' }, v.caption))),
    rail);
  return el;
}

function feedTabs(cur) {
  const t = (href, label, key, extra) => h('a', { href, class: cur === key ? 'on' : '' }, extra, label);
  return h('nav', { class: 'feedtabs', 'aria-label': 'Loại nội dung' },
    t('#/', 'Dành cho bạn', 'foryou'), t('#/regions', 'Khu vực', 'area'), t('#/nearby', 'Quanh đây', 'near'), t('#/live', 'Trực tiếp', 'live', h('i', { class: 'dot' })));
}

async function pageFeed(startId, home) {
  const box = h('div', { class: 'feedpage', id: 'feedbox' });
  main.append(h('div', { class: 'feedwrap' }, box, feedTabs('foryou')));
  let before = null, done = false, loading = false, first = true;
  const seen = []; // home feed: ids already shown, so the random order never repeats a video
  // opened from an area page: play the rest of that area first (same order as its grid), then random videos from everywhere
  const ctx = startId && S.feedCtx && String(S.feedCtx.startId) === String(startId) ? S.feedCtx : null;
  let queue = null;
  if (ctx) {
    try {
      const q = new URLSearchParams({ region: ctx.region, province: ctx.province, district: ctx.district, seed: ctx.seed });
      const { ids } = await api('/area-order?' + q);
      const pos = ids.indexOf(Number(startId));
      queue = pos >= 0 ? [...ids.slice(pos + 1), ...ids.slice(0, pos)] : ids.filter((x) => x !== Number(startId));
      seen.push(Number(startId));
    } catch { queue = null; }
  }
  const more = async () => {
    if (loading || done) return; loading = true;
    try {
      if (queue && queue.length) { // next videos of the same area
        const batch = queue.splice(0, 8);
        const { videos } = await api('/videos-by-ids?ids=' + batch.join(','));
        videos.forEach((v) => { seen.push(v.id); box.append(slide(v)); });
        if (first) box.querySelectorAll('video').forEach((el, i) => { if (i < 2) el.preload = 'auto'; });
        first = false; loading = false; return;
      }
      if (queue) home = true; // the area is finished: continue with random videos from everywhere (never repeating)
      const { videos } = home ? await api('/feed?limit=12&seen=' + seen.slice(-500).join(',') + '&pref=' + encodeURIComponent(Pref.param())) : await api('/videos' + (before ? '?before=' + before : ''));
      if (home) videos.forEach((v) => seen.push(v.id));
      if (!videos.length && first && home) { loading = false; main.innerHTML = ''; return pageHome(); }
      if (!videos.length) { done = true; box.append(h('div', { class: 'slide' }, h('div', { class: 'endcap' }, videos.length || !first ? 'Bạn đã xem hết video 🎉' : ''))); if (first) { box.innerHTML = ''; box.append(emptyFeed()); } }
      else { videos.forEach((v) => box.append(slide(v))); if (first) box.querySelectorAll('video').forEach((el, i) => { if (i < 2) el.preload = 'auto'; }); before = videos[videos.length - 1].id; if (videos.length < (home ? 1 : 12)) done = true; }
      first = false;
    } catch (e) { toast(e.message, true); }
    loading = false;
  };
  await more();
  box.addEventListener('xg-end', async (e) => {
    const cur = e.target.closest('.slide'); await more();
    const nx = cur && cur.nextElementSibling;
    if (nx && nx.dataset.id) return nx.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const first = box.querySelector('.slide[data-id]'); // reached the end: start again from the first video
    if (first === cur) { const m = cur.querySelector('video'); if (m) { m.currentTime = 0; m.play().catch(() => {}); } } else if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  if (startId && !box.querySelector(`[data-id="${startId}"]`)) {
    try { const { video } = await api('/videos/' + startId); if (box.querySelector('.empty')) box.innerHTML = ''; box.prepend(slide(video)); } catch {}
  }
  if (startId) { const t = box.querySelector(`[data-id="${startId}"]`); if (t) { t.scrollIntoView(); setTimeout(() => t.scrollIntoView(), 250); } }
  { const t = startId ? box.querySelector(`[data-id="${startId}"]`) : box.querySelector('.slide[data-id]'); if (t) Hearts.watch(t.dataset.id, t); } // live hearts of the first video right away
  box.addEventListener('scroll', () => { if (box.scrollTop + box.clientHeight * 2 > box.scrollHeight) more(); }, { passive: true });
  box.addEventListener('keydown', () => {});
}
function emptyFeed() {
  return h('div', { class: 'slide' }, h('div', { class: 'empty' }, h('div', { class: 'ico', html: icon('video') }), h('h3', {}, 'Chưa có video nào'),
    h('p', {}, 'Hãy là người đầu tiên đăng video giới thiệu bản thân!'), h('a', { class: 'btn primary', style: 'margin-top:16px', href: '#/upload' }, 'Đăng video đầu tiên')));
}

// ---------- home ----------
const fmtCount = (n) => new Intl.NumberFormat(loc(), { notation: 'compact', maximumFractionDigits: 1 }).format(n);
function vthumb(v) {
  const yt = !v.file && ytId(v.url);
  const poster = v.thumb || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : '');
  const media = poster ? h('img', { class: 'cover', src: poster, alt: v.caption || 'Ảnh bìa video', loading: 'lazy' }) : mediaEl(v);
  if (media instanceof HTMLVideoElement) { media.setAttribute('preload', 'metadata'); media.addEventListener('mouseenter', () => media.play().catch(() => {})); media.addEventListener('mouseleave', () => media.pause()); }
  else { media.style.pointerEvents = 'none'; }
  return h('a', { class: 'vcard', href: '#/feed/' + v.id, 'aria-label': 'Xem video của ' + v.user.name },
    media, h('div', { class: 'shade' }, h('div', { class: 'who' }, avatar(v.user), v.user.name + (v.user.age ? ', ' + v.user.age : '')), v.caption && h('div', { class: 'cap', translate: 'no' }, v.caption)),
    vflags(v),
    h('span', { class: 'views', title: isAdmin() ? fmtCount(v.views || 0) + ' lượt xem' : '', html: icon('heart') + v.likes + (isAdmin() ? '<span class="vsep">·</span>' + icon('eye2') + fmtCount(v.views || 0) : '') }),
    v.distanceKm != null && h('span', { class: 'distance', html: icon('pin') + '≈ ' + v.distanceKm + ' km' }));
}
function lcard(s) {
  return h('a', { class: 'vcard', href: '#/live/' + s.id },
    h('div', { class: 'ph', html: s.host.avatar ? '' : icon('live') }), s.host.avatar && h('img', { class: 'cover', src: s.host.avatar, alt: '' }),
    h('span', { class: 'livepill live-tag' }, 'LIVE'), h('span', { class: 'views', html: icon('eye') + s.viewers }),
    h('div', { class: 'shade' }, h('div', { class: 'who' }, avatar(s.host), s.host.name), h('div', { class: 'cap' }, s.title)));
}
function pcard(u) {
  return h('a', { class: 'card pcard', href: '#/u/' + u.id },
    h('div', { class: 'pic' }, u.avatar ? h('img', { src: u.avatar, alt: u.name, loading: 'lazy' }) : h('span', { class: 'init' }, u.name.charAt(0).toUpperCase())),
    h('div', { class: 'info' }, h('b', {}, u.name + ', ' + u.age), h('div', { class: 'muted', style: 'font-size:14px' }, u.distanceKm != null ? (u.distanceKm <= 1 ? '≈ 1 km' : '≈ ' + u.distanceKm + ' km') + (u.city ? ' · ' + u.city : '') : (u.city || 'Việt Nam'))));
}

async function pageHome() {
  const [vids, lives, ppl] = await Promise.all([api('/videos'), api('/streams'), api('/people')]);
  const w = h('div', {});
  w.append(h('div', { class: 'wrap' },
    h('section', { class: 'hero' },
      h('div', {},
        h('span', { class: 'eyebrow', html: icon('spark') + 'Nền tảng kết nối dành cho người từ 18+' }),
        h('h1', {}, 'Gặp gỡ qua video,', h('br'), h('em', {}, 'làm quen qua livestream')),
        h('p', { class: 'lead' }, 'Đăng video giới thiệu bản thân, trò chuyện trực tiếp, xem livestream và đặt lịch hẹn gặp mặt an toàn – tất cả trong một nơi.'),
        h('div', { class: 'row' },
          S.user ? h('a', { class: 'btn primary lg', href: '#/feed', html: icon('play') + 'Xem video' }) : h('button', { class: 'btn primary lg', onclick: () => openAuth('register') }, 'Tham gia miễn phí'),
          h('a', { class: 'btn lg', href: '#/live', html: '<span class="livepill">LIVE</span> Xem livestream' }),
          h('a', { class: 'btn lg', href: '#/nearby', html: icon('pin') + 'Tìm quanh đây' })),
        h('div', { class: 'stats' }, h('div', {}, h('b', {}, '18+'), h('span', {}, 'Chỉ người trưởng thành')), h('div', {}, h('b', {}, '24/7'), h('span', {}, 'Kiểm duyệt nội dung')), h('div', {}, h('b', {}, '0đ'), h('span', {}, 'Đăng ký & chat')))),
      h('div', { class: 'mock', 'aria-hidden': 'true' },
        h('div', { class: 'phone a' }, h('div', { class: 'tag' }, h('i'), 'Mai, 24')),
        h('div', { class: 'phone b' }, h('span', { class: 'livepill pill' }, 'LIVE'), h('div', { class: 'tag' }, h('i'), 'Phòng trà chiều')),
        h('div', { class: 'float f1', html: icon('heart') + 'Linh vừa thích video của bạn' }),
        h('div', { class: 'float f2', html: icon('cal') + 'Lịch hẹn cà phê · 19:30' })))));

  if (lives.streams.length) w.append(h('section', { class: 'block wrap' }, h('div', { class: 'head' }, h('h2', { class: 'title' }, 'Đang phát trực tiếp'), h('a', { class: 'btn sm', href: '#/live' }, 'Xem tất cả')), h('div', { class: 'grid g4' }, lives.streams.slice(0, 4).map(lcard))));
  w.append(h('section', { class: 'block wrap' }, h('div', { class: 'head' }, h('h2', { class: 'title' }, 'Video mới nhất'), h('a', { class: 'btn sm', href: '#/feed' }, 'Lướt xem')),
    vids.videos.length ? h('div', { class: 'grid g4' }, vids.videos.slice(0, 8).map(vthumb)) : h('div', { class: 'card empty' }, h('div', { class: 'ico', html: icon('video') }), h('h3', {}, 'Chưa có video'), h('p', {}, 'Hãy là người đầu tiên chia sẻ!'), h('a', { class: 'btn primary', style: 'margin-top:12px', href: '#/upload' }, 'Đăng video'))));
  if (ppl.people.length) w.append(h('section', { class: 'block wrap' }, h('div', { class: 'head' }, h('h2', { class: 'title' }, 'Thành viên mới'), h('a', { class: 'btn sm', href: '#/people' }, 'Khám phá')), h('div', { class: 'grid g4' }, ppl.people.slice(0, 4).map(pcard))));

  const step = (ic, t, d) => h('div', { class: 'card step' }, h('div', { class: 'ico', html: icon(ic) }), h('h3', {}, t), h('p', {}, d));
  w.append(h('section', { class: 'block wrap' }, h('div', { class: 'head' }, h('h2', { class: 'title' }, 'Hẹn hò hiện đại, đơn giản')),
    h('div', { class: 'grid g3 steps' },
      step('video', 'Đăng video', 'Giới thiệu bản thân bằng video ngắn – chân thật hơn mọi dòng mô tả.'),
      step('msg', 'Chat & gọi', 'Nhắn tin thời gian thực, hoặc gọi điện khi cả hai thấy hợp.'),
      step('live', 'Livestream', 'Phát trực tiếp hoặc tham gia phòng live để trò chuyện cùng mọi người.'),
      step('cal', 'Đặt lịch hẹn', 'Gửi lời mời hẹn ngay dưới mỗi video, chỉ xác nhận khi cả hai đồng ý.'))));
  w.append(h('section', { class: 'block wrap' }, h('div', { class: 'card step', style: 'display:flex;gap:20px;align-items:center;flex-wrap:wrap' },
    h('div', { class: 'ico', style: 'margin:0', html: icon('shield') }), h('div', { style: 'flex:1;min-width:240px' }, h('h3', {}, 'An toàn là ưu tiên'),
      h('p', {}, 'Chỉ dành cho 18+, có nút báo cáo ở mọi nơi, số điện thoại chỉ hiện khi chủ tài khoản cho phép. Không cho phép nội dung khiêu dâm, mua bán dịch vụ tình dục hay lừa đảo.')),
    h('a', { class: 'btn', href: '#/terms' }, 'Quy tắc cộng đồng'))));
  w.append(h('section', { class: 'block wrap xg-install', hidden: Install.standalone() }, h('div', { class: 'cta' }, h('h2', {}, 'Cài ứng dụng xgaigu về máy'), h('p', { class: 'muted', style: 'margin-bottom:22px' }, 'Một chạm là có ngay biểu tượng trên màn hình, không cần CH Play hay App Store. Ứng dụng luôn đồng bộ với website.'), Install.button('btn primary lg'))));
  if (!S.user) w.append(h('section', { class: 'block wrap' }, h('div', { class: 'cta' }, h('h2', {}, 'Sẵn sàng gặp người ấy?'), h('p', { class: 'muted', style: 'margin-bottom:22px' }, 'Tạo tài khoản miễn phí trong 30 giây.'), h('button', { class: 'btn primary lg', onclick: () => openAuth('register') }, 'Bắt đầu ngay'))));
  w.append(footer());
  main.append(w);
}

function footer() {
  return h('footer', { class: 'footer' }, h('div', { class: 'wrap cols' },
    h('div', {}, h('div', { class: 'logo' }, h('span', { class: 'logo-mark' }), h('span', {}, 'xgai', h('b', {}, 'gu'))), h('p', { style: 'margin-top:10px' }, '© ' + new Date().getFullYear() + ' xgaigu.com · Dành cho người từ 18 tuổi.')),
    h('div', { class: 'row' }, h('a', { class: 'xg-install', hidden: Install.standalone(), href: '#', onclick: (e) => { e.preventDefault(); Install.run(); } }, '📲 Cài đặt ứng dụng'), h('a', { href: '#', onclick: (e) => { e.preventDefault(); openLanguage(); } }, '🌐 Ngôn ngữ / Language'), h('a', { href: '/khu-vuc' }, 'Khu vực'), h('a', { href: '#/welcome' }, 'Giới thiệu'), h('a', { href: '#/terms' }, 'Điều khoản & Quy tắc cộng đồng'))));
}

// ---------- people & profiles ----------
async function pagePeople() {
  const wrap = h('div', { class: 'wrap', style: 'padding:32px 0' });
  const city = h('input', { placeholder: 'Thành phố…', 'aria-label': 'Thành phố' });
  const gender = h('select', { 'aria-label': 'Giới tính' }, h('option', { value: '' }, 'Tất cả'), h('option', { value: 'nu' }, 'Nữ'), h('option', { value: 'nam' }, 'Nam'), h('option', { value: 'khac' }, 'Khác'));
  const grid = h('div', { class: 'grid g4' }, h('div', { class: 'spin' }));
  let t;
  const load = async () => {
    const { people } = await api(`/people?city=${encodeURIComponent(city.value)}&gender=${gender.value}`);
    grid.innerHTML = '';
    if (!people.length) grid.append(h('div', { class: 'empty', style: 'grid-column:1/-1' }, h('h3', {}, 'Không tìm thấy ai'), h('p', {}, 'Thử đổi bộ lọc nhé.')));
    people.forEach((u) => grid.append(pcard(u)));
  };
  city.addEventListener('input', () => { clearTimeout(t); t = setTimeout(load, 300); }); gender.addEventListener('change', load);
  wrap.append(h('div', { class: 'head' }, h('h2', { class: 'title' }, 'Làm quen')), h('div', { class: 'filters' }, city, gender), grid);
  main.append(wrap); load();
}

const NEAR_KEY = 'xg_loc';
async function pageNearby() {
  const grid = h('div', { class: 'near-results' });
  const status = h('p', { class: 'muted', style: 'margin:12px 0 22px' });
  const radius = h('select', { 'aria-label': 'Bán kính', style: 'width:auto' }, [5, 10, 25, 50, 100].map((r) => h('option', { value: r, selected: r === 25 }, 'Trong ' + r + ' km')));
  let pos = null; try { pos = JSON.parse(sessionStorage.getItem(NEAR_KEY)); } catch {}
  const show = async () => {
    grid.innerHTML = ''; grid.append(h('div', { class: 'spin' }));
    try {
      const q = `lat=${pos.lat}&lng=${pos.lng}&radius=${radius.value}`;
      const [{ people }, { videos }] = await Promise.all([api('/nearby?' + q), api('/nearby-videos?' + q)]);
      grid.innerHTML = '';
      status.textContent = videos.length || people.length ? `Có ${videos.length} video và ${people.length} thành viên quanh bạn` : '';
      if (!videos.length && !people.length) grid.append(h('div', { class: 'empty' }, h('div', { class: 'ico', html: icon('pin') }), h('h3', {}, 'Chưa có ai trong bán kính này'), h('p', {}, 'Thử mở rộng bán kính tìm kiếm nhé.')));
      if (videos.length) grid.append(h('h3', { class: 'sect' }, 'Video quanh bạn (gần nhất trước)'), h('div', { class: 'grid g4' }, videos.map(vthumb)));
      if (people.length) grid.append(h('h3', { class: 'sect' }, 'Thành viên quanh bạn'), h('div', { class: 'grid g4' }, people.map(pcard)));
    } catch (e) { grid.innerHTML = ''; fail(e); }
  };
  const locate = () => {
    if (!navigator.geolocation) { status.textContent = 'Trình duyệt không hỗ trợ định vị.'; return; }
    status.textContent = 'Đang xác định vị trí của bạn…';
    navigator.geolocation.getCurrentPosition((p) => {
      pos = { lat: p.coords.latitude, lng: p.coords.longitude };
      try { sessionStorage.setItem(NEAR_KEY, JSON.stringify(pos)); } catch {}
      show();
    }, (err) => {
      status.textContent = err.code === 1 ? 'Bạn đã từ chối quyền vị trí. Hãy bật quyền vị trí cho trang này trong cài đặt trình duyệt, hoặc nhập khu vực của bạn bên dưới.' : 'Không xác định được vị trí. Hãy nhập khu vực của bạn bên dưới.';
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  };
  const picker = placePicker();
  const go = h('button', { class: 'btn', type: 'button', onclick: () => { const v = picker.get(); if (v.lat == null) return toast('Hãy chọn một gợi ý địa chỉ', true); pos = { lat: v.lat, lng: v.lng }; show(); } }, 'Tìm quanh khu vực này');
  radius.addEventListener('change', () => pos && show());
  main.append(h('div', { class: 'wrap', style: 'padding:32px 0' },
    h('div', { class: 'head' }, h('h2', { class: 'title' }, 'Tìm quanh đây'), radius),
    h('div', { class: 'card', style: 'padding:20px;display:grid;gap:14px' },
      h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: locate, html: icon('pin') + 'Dùng vị trí hiện tại của tôi' }), h('span', { class: 'muted' }, 'hoặc nhập khu vực:')),
      h('div', { class: 'near-row' }, h('div', { class: 'near-pick' }, picker.el), go),
      h('p', { class: 'muted', style: 'font-size:13px' }, 'Vị trí của bạn chỉ dùng để tìm kiếm, không được lưu lên máy chủ. Người khác chỉ thấy khoảng cách làm tròn.')),
    status, grid), footer());
  if (pos) show();
}

async function pageUser(id) {
  const { user, videos, stats, following } = await api('/users/' + id);
  const me = S.user && S.user.id === user.id;
  const stat = (n, label) => h('div', { class: 'pstat' }, h('b', {}, fmtCount(n)), h('span', {}, label));
  const profileLink = location.origin + '/#/u/' + user.id;
  const shareProfile = async () => {
    try { if (navigator.share) { await navigator.share({ title: user.name + ' – xgaigu', url: profileLink }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(profileLink); toast('Đã sao chép liên kết hồ sơ'); } catch { toast(profileLink); }
  };
  const more = () => {
    let m;
    const item = (ic, label, fn) => h('button', { type: 'button', class: 'menu-item', onclick: () => { m.close(); fn(); }, html: icon(ic) + '<span>' + label + '</span>' });
    m = modal(h('div', { class: 'menu-list' }, h('h3', {}, user.name),
      item('phone', 'Gọi thoại', () => openCall(user)), item('video', 'Gọi video', () => startVideoCall(user)),
      item('share', 'Chia sẻ hồ sơ', shareProfile), item('flag', 'Báo cáo', () => openReport('user', user.id))), { sheet: true });
  };
  const facts = [['Nghề nghiệp', user.occupation], ['Xuất xứ', user.origin], ['Chiều cao', user.height && user.height + ' cm'], ['Cân nặng', user.weight && user.weight + ' kg'], ['Thời gian rảnh', user.availability]].filter((x) => x[1]);
  const followBtn = h('button', { class: 'btn primary follow' + (following ? ' on' : '') }, following ? 'Đã theo dõi' : 'Theo dõi');
  followBtn.addEventListener('click', async () => {
    if (!(await needLogin())) return;
    try {
      const r = await api('/users/' + user.id + '/follow', { method: 'POST' });
      followBtn.classList.toggle('on', r.following); followBtn.textContent = r.following ? 'Đã theo dõi' : 'Theo dõi';
      const n = document.querySelector('.tk-stats .pstat b'); if (n) n.textContent = fmtCount(r.followers);
    } catch (e) { fail(e); }
  });
  const head = h('div', { class: 'tk-head' },
    avatar(user, 'xl'),
    h('h2', { class: 'tk-name' }, user.name + (user.age ? ', ' + user.age : '')),
    user.verified && vbadge(),
    h('div', { class: 'tk-handle', translate: 'no' }, user.nickname ? '@' + user.nickname : ''),
    h('div', { class: 'tk-stats' }, stat(stats.followers, 'Theo dõi'), stat(stats.videos, 'Video'), stat(stats.likes, 'Lượt thích'), isAdmin() && stats.views != null && stat(stats.views, 'Lượt xem')),
    h('div', { class: 'tk-actions' }, !me
      ? [followBtn,
        h('button', { class: 'btn', onclick: () => startChat(user), html: icon('send') + '<span>Nhắn tin</span>' }),
        h('button', { class: 'btn', onclick: () => openBook(user), html: icon('cal') + '<span>Hẹn gặp</span>' }),
        h('button', { class: 'btn more', 'aria-label': 'Thêm', onclick: more, html: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 10l5 6 5-6z"/></svg>' })]
      : [h('a', { class: 'btn primary', href: '#/me' }, 'Sửa hồ sơ'), h('button', { class: 'btn', onclick: shareProfile, html: icon('share') + '<span>Chia sẻ hồ sơ</span>' })]),
    user.bio && h('p', { class: 'tk-bio', translate: 'no' }, user.bio),
    (user.city || user.address) && h('div', { class: 'tk-loc', html: icon('pin') + ' ' + esc(user.city || 'Việt Nam') }),
    facts.length > 0 && h('div', { class: 'facts tk-facts' }, facts.map(([k, v]) => h('span', { class: 'fact' }, h('b', {}, k), v))),
    user.interests && user.interests.length > 0 && h('div', { class: 'facts tk-facts' }, user.interests.map((t) => h('span', { class: 'fact tag' }, t))),
    user.lookingFor && h('p', { class: 'tk-more' }, h('b', {}, 'Kiểu người mong muốn: '), user.lookingFor),
    user.boundaries && h('p', { class: 'tk-more muted' }, h('b', {}, 'Điều không muốn: '), user.boundaries));
  const cell = (v) => {
    const yt = !v.file && ytId(v.url);
    const poster = v.thumb || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : '');
    const media = poster ? h('img', { src: poster, alt: v.caption || 'Video', loading: 'lazy' })
      : (() => { const m = mediaEl(v); if (m instanceof HTMLVideoElement) m.setAttribute('preload', 'metadata'); else m.style.pointerEvents = 'none'; return m; })();
    const c = h('a', { class: 'tcell', href: '#/feed/' + v.id, 'aria-label': 'Xem video' }, media,
      vflags(v, true), h('span', { class: 'tviews', html: isAdmin() ? icon('play') + fmtCount(v.views || 0) : icon('heart') + fmtCount(v.likes || 0) }));
    if (me) c.append(h('button', { class: 'iconbtn tdel', 'aria-label': 'Sửa video', html: '✎', style: 'font-size:18px', onclick: (e) => { e.preventDefault(); e.stopPropagation(); adminVideoDialog(v.id, () => route(), true); } }));
    if (v.selfHidden) c.append(h('span', { class: 'selfhid' }, 'Đang ẩn'));
    return c;
  };
  // the member's videos, one numbered page at a time
  const userGrid = h('div', { class: 'tgrid' }), userPager = h('div', { class: 'pager' });
  const goUser = async (p) => {
    userGrid.replaceChildren(h('div', { class: 'spin', style: 'grid-column:1/-1' }));
    try {
      const d = await api('/users/' + user.id + '/videos-page?page=' + p);
      if (!d.total) userGrid.replaceChildren(h('div', { class: 'card empty', style: 'grid-column:1/-1' }, h('p', {}, 'Chưa có video.')));
      else userGrid.replaceChildren(...d.videos.map(cell));
      renderPager(userPager, d.page, d.pages, (x) => { goUser(x); userGrid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    } catch (e) { userGrid.replaceChildren(); fail(e); }
  };
  const videosNodes = [userGrid, userPager];
  goUser(1);
  const panel = h('div', {}, ...videosNodes);
  let tabsEl = h('div', { class: 'tk-tabs' }, h('span', { class: 'on', html: icon('video') + '<span>Video (' + stats.videos + ')</span>' }));
  if (me) { // only the owner sees the "Đã lưu" tab: saved videos are private
    const bV = h('button', { type: 'button', class: 'on', html: icon('video') + '<span>Video (' + stats.videos + ')</span>' });
    const bS = h('button', { type: 'button', 'aria-label': 'Đã lưu', html: icon('bookmark') + '<span>Đã lưu</span>' });
    tabsEl = h('div', { class: 'tk-tabs' }, bV, bS);
    bV.addEventListener('click', () => { bV.classList.add('on'); bS.classList.remove('on'); panel.replaceChildren(...videosNodes); });
    bS.addEventListener('click', async () => {
      bS.classList.add('on'); bV.classList.remove('on'); panel.replaceChildren(h('div', { class: 'spin' }));
      const note = h('p', { class: 'muted', style: 'font-size:13px;text-align:center;margin:12px 0' }, 'Chỉ mình bạn thấy danh sách này.');
      const grid = h('div', { class: 'tgrid' }), more = h('button', { class: 'btn', type: 'button', hidden: true, style: 'margin:16px auto;display:flex' }, 'Xem thêm');
      let offset = 0;
      const load = async () => {
        try {
          const d = await api('/me/saved?offset=' + offset);
          d.videos.forEach((v) => grid.append(areaTile(v)));
          offset = d.next; more.hidden = !d.more;
          if (!grid.children.length) panel.replaceChildren(note, h('div', { class: 'card empty' }, h('div', { class: 'ico', html: icon('bookmark') }), h('h3', {}, 'Chưa lưu video nào'), h('p', {}, 'Khi xem video, bấm biểu tượng dấu trang để lưu lại và xem sau tại đây.')));
        } catch (e) { fail(e); }
      };
      more.addEventListener('click', load);
      panel.replaceChildren(note, grid, more);
      await load();
    });
  }
  const w = h('div', { class: 'wrap tk' }, head, tabsEl, panel);
  main.append(w, footer());

}

async function pageMe() {
  if (!S.user) { openAuth('login'); location.hash = '#/'; return; }
  const u = S.user;
  const err = h('div', { class: 'err', hidden: true });
  const file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', class: 'sr', id: 'avf' });
  file.addEventListener('change', async () => {
    if (!file.files[0]) return; const fd = new FormData(); fd.append('file', file.files[0]);
    try { const r = await api('/me/avatar', { method: 'POST', body: fd }); S.user = r.user; toast('Đã cập nhật ảnh'); renderNav(); route(); } catch (e) { fail(e); }
  });
  const picker = placePicker({ address: u.address, city: u.city, lat: u.hasLocation ? 0 : null });
  const f = h('form', {},
    err,
    h('label', { class: 'f' }, h('span', {}, 'Tên hiển thị'), h('input', { name: 'name', value: u.name, maxlength: 40 })),
    h('div', { class: 'two' },
      h('label', { class: 'f' }, h('span', {}, 'Giới tính'), h('select', { name: 'gender' }, [['', 'Không nêu'], ['nu', 'Nữ'], ['nam', 'Nam'], ['khac', 'Khác']].map(([v, l]) => h('option', { value: v, selected: u.gender === v }, l)))),
      h('div', { class: 'f' }, h('span', { style: 'display:block;margin-bottom:6px;color:#d9cce6;font-size:14px;font-weight:600' }, 'Địa chỉ / khu vực'), picker.el)),
    h('label', { class: 'f' }, h('span', {}, 'Giới thiệu'), h('textarea', { name: 'bio', maxlength: 500 }, u.bio)),
    h('label', { class: 'f' }, h('span', {}, 'Biệt danh'), h('input', { name: 'nickname', value: u.nickname, maxlength: 40, placeholder: 'Tên thân mật mọi người hay gọi bạn' })),
    h('div', { class: 'two' },
      h('label', { class: 'f' }, h('span', {}, 'Năm sinh'), h('input', { value: u.birthYear, disabled: true, 'aria-describedby': 'by-note' }), h('small', { id: 'by-note' }, 'Không thể thay đổi sau khi đăng ký.')),
      h('label', { class: 'f' }, h('span', {}, 'Xuất xứ / quê quán'), h('input', { name: 'origin', value: u.origin, maxlength: 60, placeholder: 'VD: Đà Nẵng' }))),
    h('div', { class: 'two' },
      h('label', { class: 'f' }, h('span', {}, 'Chiều cao (cm)'), h('input', { name: 'height', type: 'number', inputmode: 'numeric', min: 120, max: 230, value: u.height || '', placeholder: '165' })),
      h('label', { class: 'f' }, h('span', {}, 'Cân nặng (kg)'), h('input', { name: 'weight', type: 'number', inputmode: 'numeric', min: 30, max: 200, value: u.weight || '', placeholder: '50' }))),
    h('label', { class: 'f' }, h('span', {}, 'Nghề nghiệp'), h('input', { name: 'occupation', value: u.occupation, maxlength: 60, placeholder: 'VD: Nhân viên văn phòng, sinh viên, thiết kế…' })),
    h('label', { class: 'f' }, h('span', {}, 'Sở thích'), h('input', { name: 'interests', value: (u.interests || []).join(', '), maxlength: 240, placeholder: 'VD: du lịch, cà phê, nấu ăn, yoga' }), h('small', {}, 'Ngăn cách bằng dấu phẩy, tối đa 10 sở thích.')),
    h('label', { class: 'f' }, h('span', {}, 'Kiểu người mong muốn gặp'), h('textarea', { name: 'lookingFor', maxlength: 300, style: 'min-height:80px', placeholder: 'VD: Chân thành, hài hước, thích đi du lịch, hơn tuổi 25…' }, u.lookingFor)),
    h('label', { class: 'f' }, h('span', {}, 'Thời gian rảnh'), h('input', { name: 'availability', value: u.availability, maxlength: 120, placeholder: 'VD: Tối các ngày trong tuần, cuối tuần' })),
    h('label', { class: 'f' }, h('span', {}, 'Điều tôi không muốn / từ chối gặp'), h('textarea', { name: 'boundaries', maxlength: 300, style: 'min-height:70px', placeholder: 'VD: Không gặp người hay say xỉn, không nhắn tin quá khuya…' }, u.boundaries)),
    h('label', { class: 'f' }, h('span', {}, 'Số điện thoại'), h('input', { name: 'phone', value: u.phone, type: 'tel', maxlength: 20, placeholder: '09xx xxx xxx' })),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'showPhone', checked: u.showPhone }), h('span', {}, 'Hiện nút "Gọi" trên video của tôi (người đã đăng nhập mới xem được số).')),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'allowCalls', checked: u.allowCalls !== false }), h('span', {}, 'Cho phép thành viên khác gọi video cho tôi (bỏ chọn nếu bạn không muốn bị gọi).')),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'showNearby', checked: u.showNearby }), h('span', {}, 'Cho phép hiện tôi trong "Tìm quanh đây" (chỉ hiện khoảng cách làm tròn, không lộ địa chỉ chính xác).')),
    h('button', { class: 'btn primary', type: 'submit' }, 'Lưu thay đổi'));
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(f)); d.showPhone = f.showPhone.checked; d.showNearby = f.showNearby.checked; d.allowCalls = f.allowCalls.checked;
    const pv = picker.get(); d.city = pv.city; if (pv.lat != null && pv.lat !== 0) { d.address = pv.address; d.lat = pv.lat; d.lng = pv.lng; }
    try { const r = await api('/me', { method: 'PATCH', body: d }); S.user = r.user; toast('Đã lưu'); renderNav(); } catch (ex) { err.textContent = ex.message; err.hidden = false; }
  });
  // ----- password -----
  const pwErr = h('div', { class: 'err', hidden: true });
  const pw = h('form', { class: 'card', style: 'padding:24px;margin-top:20px', autocomplete: 'on' },
    h('h3', { style: 'margin-bottom:4px' }, 'Đổi mật khẩu'), h('p', { class: 'muted', style: 'font-size:14px;margin-bottom:16px' }, 'Sau khi đổi, các thiết bị khác sẽ bị đăng xuất.'), pwErr,
    h('label', { class: 'f' }, h('span', {}, 'Mật khẩu hiện tại'), h('input', { name: 'current', type: 'password', autocomplete: 'current-password', required: true })),
    h('label', { class: 'f' }, h('span', {}, 'Mật khẩu mới'), h('input', { name: 'next', type: 'password', autocomplete: 'new-password', minlength: 8, required: true }), h('small', {}, 'Tối thiểu 8 ký tự')),
    h('label', { class: 'f' }, h('span', {}, 'Nhập lại mật khẩu mới'), h('input', { name: 'again', type: 'password', autocomplete: 'new-password', minlength: 8, required: true })),
    h('button', { class: 'btn primary', type: 'submit' }, 'Đổi mật khẩu'));
  pw.addEventListener('submit', async (e) => {
    e.preventDefault(); pwErr.hidden = true;
    if (pw.next.value !== pw.again.value) { pwErr.textContent = 'Hai mật khẩu mới không khớp'; pwErr.hidden = false; return; }
    const b = pw.querySelector('button[type=submit]'); b.disabled = true;
    try { await api('/me/password', { method: 'POST', body: { current: pw.current.value, next: pw.next.value } }); pw.reset(); toast('Đã đổi mật khẩu'); }
    catch (ex) { pwErr.textContent = ex.message; pwErr.hidden = false; }
    b.disabled = false;
  });
  const logout = async (all) => {
    await api('/logout', { method: 'POST', body: all ? { all: true } : {} });
    S.user = null; S.unread = 0; connectEvents(); renderNav(); location.hash = '#/'; toast(all ? 'Đã đăng xuất mọi tài khoản' : 'Đã đăng xuất');
  };
  main.append(h('div', { class: 'wrap', style: 'max-width:680px;padding:32px 0' },
    h('div', { class: 'profile-head' }, avatar(u, 'lg'), h('div', {}, h('h2', { class: 'title' }, u.name), h('p', { class: 'muted' }, u.email), h('div', { class: 'row', style: 'margin-top:12px' },
      h('label', { class: 'btn sm', for: 'avf' }, 'Đổi ảnh đại diện'), file, h('a', { class: 'btn sm', href: '#/u/' + u.id }, 'Xem hồ sơ công khai')))),
    h('div', { class: 'card', style: 'padding:24px;margin-bottom:20px' },
      h('h3', { style: 'margin-bottom:12px' }, 'Tài khoản'),
      h('label', { class: 'f', style: 'margin-bottom:0' }, h('span', {}, 'Email đăng nhập'), h('input', { value: u.email, readonly: true, type: 'email', 'aria-describedby': 'em-note' }), h('small', { id: 'em-note' }, 'Email không hiển thị công khai trên hồ sơ hay video.')),
      h('div', { class: 'row', style: 'margin-top:16px' },
        h('button', { type: 'button', class: 'btn', onclick: openAccounts, html: icon('users') + 'Chuyển tài khoản' }),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => logout(false) }, 'Đăng xuất'),
        h('button', { type: 'button', class: 'btn ghost sm', onclick: () => logout(true) }, 'Đăng xuất mọi tài khoản'))),
    h('div', { class: 'card', style: 'padding:24px' }, f),
    pw,
    apiKeysCard(),
    h('div', { class: 'row', style: 'margin-top:20px' }, u.role === 'admin' && h('a', { class: 'btn', href: '#/admin' }, 'Quản trị'),
      h('button', { type: 'button', class: 'btn', onclick: openAccounts, html: icon('users') + 'Chuyển tài khoản' }),
      h('button', { type: 'button', class: 'btn live', onclick: () => logout(false) }, 'Đăng xuất'))));
}

// ---------- regions (miền → tỉnh → huyện) ----------
const REGION_NAMES = { bac: 'Miền Bắc', trung: 'Miền Trung', nam: 'Miền Nam' };
let geoData = null;
async function loadGeo() { if (!geoData) geoData = await (await fetch('/data/vn-geo.json')).json(); return geoData; }

function geoPicker(init = {}) {
  const reg = h('select', { name: 'region', 'aria-label': 'Miền', disabled: true }, h('option', { value: '' }, 'Chọn miền'));
  const prov = h('select', { name: 'province', 'aria-label': 'Tỉnh / thành phố', disabled: true }, h('option', { value: '' }, 'Chọn tỉnh / thành phố'));
  const dist = h('select', { name: 'district', 'aria-label': 'Quận / huyện', disabled: true }, h('option', { value: '' }, 'Chọn quận / huyện (không bắt buộc)'));
  const fill = (sel, first, items) => { sel.replaceChildren(h('option', { value: '' }, first), ...items.map((x) => h('option', { value: x }, x))); sel.disabled = !items.length; };
  loadGeo().then((geo) => {
    Object.keys(REGION_NAMES).forEach((k) => reg.append(h('option', { value: k }, REGION_NAMES[k]))); reg.disabled = false;
    reg.addEventListener('change', () => { fill(prov, 'Chọn tỉnh / thành phố', reg.value ? geo[reg.value].map((p) => p[0]) : []); fill(dist, 'Chọn quận / huyện (không bắt buộc)', []); });
    prov.addEventListener('change', () => { const p = reg.value && geo[reg.value].find((x) => x[0] === prov.value); fill(dist, 'Chọn quận / huyện (không bắt buộc)', p ? p[1] : []); });
  }).catch(() => toast('Không tải được danh sách khu vực', true));
  return { el: h('div', { class: 'geo-row' }, reg, prov, dist) };
}

// "Sở thích": one line with "Xem thêm"; tap to read all of it (it can be very long)
function interestBlock(raw) {
  const text = (Array.isArray(raw) ? raw.join(', ') : String(raw || '')).replace(/\r/g, '').trim();
  if (!text) return null;
  const lines = text.split('\n'), moreLines = lines.slice(1).some((l) => l.trim());
  const short = h('span', { class: 'int-short', translate: 'no' }, lines[0] + (moreLines ? ' …' : ''));
  const full = h('span', { class: 'int-full', translate: 'no', hidden: true }, text); // pre-line: every line break stays
  const btn = h('button', { type: 'button', class: 'linkbtn int-more', hidden: !moreLines }, 'Xem thêm');
  btn.addEventListener('click', () => { const open = full.hidden; full.hidden = !open; short.hidden = open; btn.textContent = open ? 'Thu gọn' : 'Xem thêm'; });
  const box = h('div', { class: 'int-box' }, h('b', {}, 'Sở thích'), h('div', {}, short, full), btn);
  requestAnimationFrame(() => setTimeout(() => { if (btn.hidden && short.scrollWidth > short.clientWidth + 1) btn.hidden = false; }, 60));
  return box;
}

const TG_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M21.4 3.6 2.9 10.8c-1.3.5-1.3 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.2-15c.3-1.3-.5-1.9-1.6-1.4zM8.7 13.4l9.6-6c.5-.3.9-.1.5.2l-8.2 7.4-.3 3.4-1.6-5z"/></svg>';

// count a tap on a Telegram group link (anonymous device id, same as the visitor statistics)
function trackTg(url) {
  let did = ''; try { did = localStorage.getItem('xg_did') || ''; } catch {}
  try { fetch('/api/tg-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, did }), keepalive: true }).catch(() => {}); } catch {}
}

function openInfo(v) {
  const i = v.info || {};
  let m;
  // each part of the area is a link to the page listing the videos of that area (district, province or region)
  const enc = encodeURIComponent, go = () => { m && m.close(); };
  const areaLink = (label, href) => h('a', { class: 'area-link', href, onclick: go }, label);
  const areaParts = [];
  if (v.region && v.province && v.district) areaParts.push(areaLink(v.district, `#/regions/${v.region}/${enc(v.province)}/${enc(v.district)}`));
  if (v.region && v.province) areaParts.push(areaLink(v.province, `#/regions/${v.region}/${enc(v.province)}`));
  if (v.region && REGION_NAMES[v.region]) areaParts.push(areaLink(REGION_NAMES[v.region], '#/regions/' + v.region));
  const areaNode = areaParts.length ? h('span', {}, areaParts.flatMap((a, k) => (k ? [', ', a] : [a]))) : '';
  const rows = [
    ['Khu vực', areaNode],
    isAdmin() && ['Lượt xem (thật, chỉ admin thấy)', fmtCount(v.views || 0)],
    ['Năm sinh', i.birthYear], ['Chiều cao', i.height && i.height + ' cm'], ['Cân nặng', i.weight && i.weight + ' kg'],
    ['Xuất xứ', i.origin], ['Nghề nghiệp', i.occupation], ['Địa chỉ', i.address], ['Thời gian rảnh', i.workTime],
  ].filter((r) => r[1]);
  const body = h('div', {}, h('h3', {}, v.user.name), v.verified && h('div', { style: 'margin:2px 0 12px' }, vbadge()), (v.caption ? h('p', { class: 'sub', translate: 'no' }, v.caption) : h('p', { class: 'sub' }, 'Thông tin giới thiệu')),
    h('dl', { class: 'info-list' }, rows.map(([k, val]) => h('div', {}, h('dt', {}, k), h('dd', {}, typeof val === 'object' ? val : String(val))))),
    interestBlock(i.interests),
    i.boundaries && h('p', { class: 'muted', style: 'font-size:14px;margin-bottom:12px' }, h('b', {}, 'Điều không muốn: '), i.boundaries),
    !rows.length && !i.boundaries && h('p', { class: 'muted' }, 'Người đăng chưa điền thêm thông tin.'),
    (() => { const list = (S.conf && S.conf.telegrams) || []; if (!list.length) return null; const link = list[Math.floor(Math.random() * list.length)]; // a different group at random each time
      return h('a', { class: 'btn tgbtn', href: link, target: '_blank', rel: 'noopener', onclick: () => trackTg(link), html: TG_ICON + '<span>Vào nhóm Telegram</span>' }); })(),
    S.conf && S.conf.partner && h('a', { class: 'btn partnerbtn', href: S.conf.partner, target: '_blank', rel: 'noopener', html: '<span aria-hidden="true">🎬</span><span>Xem Video Hẹn Hò</span>' }),
    h('div', { class: 'row', style: 'margin-top:14px' },
      S.user && S.user.role === 'admin' && h('button', { class: 'btn sm', type: 'button', onclick: () => adminVideoDialog(v.id), html: icon('flag') + 'Quản lý video (admin)' }),
      S.user && S.user.id === v.user.id && h('button', { class: 'btn sm', type: 'button', onclick: () => adminVideoDialog(v.id, null, true), html: '✎ Sửa / ẩn video của tôi' }),
      v.hasPhone && h('button', { class: 'btn callbtn', onclick: () => openCall({ ...v.user, canCall: true }, v.id), html: icon('phone') + 'Gọi' }),
      h('button', { class: 'btn', onclick: () => openBook(v.user, v.id), html: icon('cal') + 'Hẹn gặp' })));
  m = modal(body, { sheet: true });
}

// Numbered page buttons: ‹ 1 … 4 5 [6] 7 8 … 20 ›
function renderPager(el, page, pages, onGo) {
  el.replaceChildren();
  if (pages <= 1) return;
  const btn = (label, p, cls = '') => h('button', { type: 'button', class: 'pg ' + cls, disabled: p < 1 || p > pages || p === page, 'aria-label': 'Trang ' + p, onclick: () => onGo(p) }, label);
  let a = Math.max(1, page - 2), b = Math.min(pages, a + 4); a = Math.max(1, b - 4);
  const items = [btn('‹', page - 1, 'nav')];
  if (a > 1) items.push(btn('1', 1), a > 2 && h('span', { class: 'pg-dots' }, '…'));
  for (let i = a; i <= b; i++) items.push(btn(String(i), i, i === page ? 'on' : ''));
  if (b < pages) items.push(b < pages - 1 && h('span', { class: 'pg-dots' }, '…'), btn(String(pages), pages));
  items.push(btn('›', page + 1, 'nav'));
  el.append(h('div', { class: 'pg-row' }, items.filter(Boolean)), h('div', { class: 'pg-info muted' }, 'Trang ' + page + ' / ' + pages));
}

// One tile of the area / profile grids (cover image, badges, likes)
function areaTile(v) {
  const yt = !v.file && ytId(v.url);
  const poster = v.thumb || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : '');
  const media = poster ? h('img', { src: poster, alt: v.caption || 'Video', loading: 'lazy', decoding: 'async' })
    : (() => { const m = mediaEl(v); if (m instanceof HTMLVideoElement) m.setAttribute('preload', 'metadata'); else m.style.pointerEvents = 'none'; return m; })();
  return h('a', { class: 'tcell', href: '#/feed/' + v.id, 'aria-label': 'Xem video' }, media, vflags(v, true),
    h('span', { class: 'tviews', html: isAdmin() ? icon('play') + fmtCount(v.views || 0) : icon('heart') + fmtCount(v.likes || 0) }));
}

async function pageRegions(reg, prov, dist) {
  if (prov) Pref.bump(prov, 1.5);
  const infoQ = new URLSearchParams({ region: reg || '', province: prov || '', district: dist || '' });
  const [geo, { areas }, info] = await Promise.all([loadGeo(), api('/areas'), reg ? api('/area-info?' + infoQ).catch(() => null) : null]);
  document.title = info ? info.title : 'Làm quen & hẹn hò theo khu vực – Bắc, Trung, Nam | xgaigu';
  const seoBox = (i) => (i ? h('section', { class: 'seo-box' }, h('div', { class: 'seo-intro' }, i.intro), h('div', { class: 'facts', style: 'margin-top:14px' }, i.keywords.map((k) => h('span', { class: 'fact tag' }, k)))) : null);
  const sum = (f) => areas.filter(f).reduce((n, x) => n + x.n, 0);
  const enc = encodeURIComponent;
  const crumb = [h('a', { href: '#/regions' }, 'Khu vực')];
  if (reg && geo[reg]) crumb.push(h('span', {}, ' › '), h('a', { href: '#/regions/' + reg }, REGION_NAMES[reg]));
  if (prov) crumb.push(h('span', {}, ' › '), h('a', { href: `#/regions/${reg}/${enc(prov)}` }, prov));
  if (dist) crumb.push(h('span', {}, ' › '), h('span', {}, dist));
  const wrap = h('div', { class: 'wrap', style: 'padding:28px 0' }, h('p', { class: 'crumbs' }, crumb));
  if (!reg || !geo[reg]) {
    wrap.append(h('h2', { class: 'title', style: 'margin-bottom:20px' }, 'Chọn khu vực'),
      h('div', { class: 'grid g3' }, Object.keys(REGION_NAMES).sort((a, b) => sum((x) => x.region === b) - sum((x) => x.region === a)).map((k) => h('a', { class: 'card region-card ' + k, href: '#/regions/' + k },
        h('h3', {}, REGION_NAMES[k]), h('p', { class: 'muted' }, geo[k].length + ' tỉnh / thành phố'), h('span', { class: 'status st-accepted' }, sum((x) => x.region === k) + ' video')))));
  } else if (!prov) {
    const filter = h('input', { placeholder: 'Tìm tỉnh / thành phố…', 'aria-label': 'Tìm tỉnh' });
    const grid = h('div', { class: 'grid g4 prov-grid' });
    const draw = () => {
      const q = filter.value.trim().toLowerCase(); grid.replaceChildren();
      [...geo[reg]].filter((p) => p[0].toLowerCase().includes(q)).sort((a, b) => sum((x) => x.region === reg && x.province === b[0]) - sum((x) => x.region === reg && x.province === a[0])).forEach(([name, ds]) => {
        const n = sum((x) => x.region === reg && x.province === name);
        grid.append(h('a', { class: 'card prov-card' + (n ? ' has' : ''), href: `#/regions/${reg}/${enc(name)}` }, h('b', {}, name), h('span', { class: 'muted' }, ds.length + ' quận/huyện'), n > 0 && h('span', { class: 'badge', style: 'margin:0' }, n)));
      });
    };
    filter.addEventListener('input', draw); draw();
    wrap.append(h('h2', { class: 'title', style: 'margin-bottom:16px' }, REGION_NAMES[reg]), h('div', { class: 'filters' }, filter), grid, seoBox(info));
  } else {
    const p = geo[reg].find((x) => x[0] === prov);
    if (!p) { wrap.append(h('div', { class: 'empty' }, h('h3', {}, 'Không tìm thấy khu vực'))); main.append(wrap); return; }
    const chips = h('div', { class: 'ed-chips chips-wrap', style: 'margin:14px 0 18px' }, h('a', { class: 'chip' + (!dist ? ' on' : ''), href: `#/regions/${reg}/${enc(prov)}` }, 'Tất cả'),
      [...p[1]].sort((a, b) => sum((x) => x.province === prov && x.district === b) - sum((x) => x.province === prov && x.district === a)).map((d) => { const n = sum((x) => x.province === prov && x.district === d); return h('a', { class: 'chip' + (dist === d ? ' on' : ''), href: `#/regions/${reg}/${enc(prov)}/${enc(d)}` }, d, n > 0 && h('span', { class: 'badge', style: 'margin:0 0 0 4px' }, n)); }));
    const grid = h('div', { class: 'tgrid area-grid' });
    const count = h('span', { class: 'muted', style: 'font-size:14px;margin-left:8px;font-weight:500' });
    const pagerEl = h('div', { class: 'pager' });
    const first = h('div', { class: 'spin' });
    wrap.append(h('h2', { class: 'title' }, dist || prov, count), chips, first, grid, pagerEl, seoBox(info));
    const seed = Math.floor(Math.random() * 1e9); // new random order on each visit, kept while moving between pages
    const go = async (page) => {
      grid.replaceChildren(h('div', { class: 'spin', style: 'grid-column:1/-1' }));
      try {
        const d = await api('/area-videos?page=' + page + '&seed=' + seed + '&region=' + reg + '&province=' + enc(prov) + (dist ? '&district=' + enc(dist) : ''));
        first.remove();
        count.textContent = d.total ? '· ' + d.total + ' video' : '';
        if (!d.total) grid.replaceChildren(h('div', { class: 'card empty', style: 'grid-column:1/-1' }, h('div', { class: 'ico', html: icon('video') }), h('h3', {}, 'Chưa có video ở khu vực này'), h('p', {}, 'Hãy là người đầu tiên đăng video tại đây.'), h('a', { class: 'btn primary', style: 'margin-top:12px', href: '#/upload' }, 'Đăng video')));
        else grid.replaceChildren(...d.videos.map((v) => { const t = areaTile(v); t.addEventListener('click', () => { S.feedCtx = { region: reg, province: prov, district: dist || '', seed, startId: v.id }; }); return t; }));
        renderPager(pagerEl, d.page, d.pages, (p) => { go(p); wrap.querySelector('h2.title').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      } catch (e) { first.remove(); grid.replaceChildren(); fail(e); }
    };
    go(1);
  }
  main.append(wrap, footer());
}

// ---------- search (nickname or address) ----------
function pageSearch(initial) {
  const input = h('input', { type: 'search', placeholder: 'Tìm theo biệt danh hoặc địa chỉ…', 'aria-label': 'Tìm kiếm', autocomplete: 'off', maxlength: 80, value: initial, role: 'combobox', 'aria-autocomplete': 'list' });
  const list = h('ul', { class: 'suggest', role: 'listbox', hidden: true });
  const head = h('h3', { class: 'sect', hidden: true });
  const grid = h('div', { class: 'grid g4' });
  const hint = h('div', { class: 'card empty' }, h('div', { class: 'ico', html: icon('search') }), h('p', {}, 'Nhập biệt danh hoặc địa chỉ để tìm video.'));
  let t, seq = 0;
  const hide = () => { list.hidden = true; };
  const run = async (q) => {
    q = q.trim(); hide();
    try { history.replaceState(null, '', '#/search' + (q ? '?q=' + encodeURIComponent(q) : '')); } catch {}
    grid.replaceChildren(); head.hidden = true; hint.hidden = true;
    if (q.length < 2) { hint.hidden = false; return; }
    grid.append(h('div', { class: 'spin' }));
    try {
      const { videos } = await api('/search?q=' + encodeURIComponent(q));
      { // searching for a place: remember the province most of the results are in
        const cnt = {}; videos.forEach((v) => { if (v.province) cnt[v.province] = (cnt[v.province] || 0) + 1; });
        const [p, n] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0] || [];
        if (p && n >= Math.ceil(videos.length / 2) && Pref.lastQ !== q) { Pref.lastQ = q; Pref.bump(p, 2); }
      }
      grid.replaceChildren(); head.hidden = false; head.textContent = 'Kết quả cho “' + q + '”';
      if (!videos.length) grid.append(h('div', { class: 'card empty', style: 'grid-column:1/-1' }, h('div', { class: 'ico', html: icon('search') }), h('h3', {}, 'Không tìm thấy video phù hợp'), h('p', {}, 'Thử đổi từ khoá, ví dụ tên khu vực hoặc biệt danh khác.')));
      videos.forEach((v) => grid.append(vthumb(v)));
    } catch (e) { grid.replaceChildren(); fail(e); }
  };
  input.addEventListener('input', () => {
    clearTimeout(t);
    const q = input.value.trim(); if (!q) return hide();
    const my = ++seq;
    t = setTimeout(async () => {
      try {
        const { suggestions } = await api('/suggest?q=' + encodeURIComponent(q));
        if (my !== seq) return;
        list.replaceChildren(...suggestions.map((s) => h('li', { role: 'option', tabindex: '0', onclick: () => { input.value = s.text; run(s.text); }, onkeydown: (e) => { if (e.key === 'Enter') { input.value = s.text; run(s.text); } } },
          h('span', { html: icon(s.type === 'nick' ? 'user' : 'pin') }), h('span', { translate: 'no' }, s.text), h('small', { class: 'muted', style: 'margin-left:auto' }, s.type === 'nick' ? 'Biệt danh' : 'Địa chỉ'))));
        list.hidden = !suggestions.length;
      } catch { hide(); }
    }, 220);
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); run(input.value); } });
  input.addEventListener('blur', () => setTimeout(hide, 250));
  main.append(h('div', { class: 'wrap', style: 'padding:24px 0;max-width:1000px' },
    h('form', { class: 'searchbar', onsubmit: (e) => { e.preventDefault(); run(input.value); } }, h('div', { class: 'picker' }, input, list), h('button', { class: 'btn primary', type: 'submit', 'aria-label': 'Tìm kiếm', html: icon('search') })),
    head, hint, grid), footer());
  if (initial) run(initial); else input.focus();
}

// ---------- upload ----------
async function pageUpload() {
  if (!S.user) { openAuth('login'); location.hash = '#/'; return; }
  const err = h('div', { class: 'err', hidden: true });
  let edited = null, editor = null;
  const canEdit = !!(window.XGEditor && XGEditor.supported());
  const fileIn = h('input', { type: 'file', name: 'file', accept: 'video/mp4,video/webm,video/quicktime', id: 'upfile' });
  const editHost = h('div', { class: 'ed-host' });
  const editNote = h('div', { class: 'notice', style: 'margin-bottom:14px', hidden: true });
  const closeEditor = () => { if (editor) { editor.destroy(); editor = null; } };
  const photoIn = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true, class: 'sr', id: 'photofiles' });
  photoIn.addEventListener('change', () => {
    const imgs = [...photoIn.files].filter((x) => /^image\//.test(x.type)).slice(0, 40);
    photoIn.value = '';
    if (!imgs.length) return;
    fileIn.value = ''; edited = null; editNote.hidden = true; preview.replaceChildren(); preview.hidden = true; coverBox.hidden = true;
    openEditor(imgs);
  });
  let lastSrc = null;
  const openEditor = (files) => {
    lastSrc = files;
    if (!canEdit) return toast('Trình duyệt này chưa hỗ trợ chỉnh sửa video. Hãy dùng Chrome/Edge/Firefox bản mới.', true);
    closeEditor();
    editor = XGEditor.createEditor(files, {
      onDone: (file) => {
        edited = file; closeEditor(); editNote.hidden = false; customCover = false; setCover(null); loadCoverSource(file);
        editNote.replaceChildren(h('span', { html: icon('check') }), h('span', {}, 'Đã chuẩn bị video đã chỉnh sửa (' + (file.size / 1048576).toFixed(1) + ' MB). Thêm mô tả rồi bấm "Đăng video".'),
          h('button', { type: 'button', class: 'btn sm', onclick: () => { edited = null; editNote.hidden = true; if (lastSrc) openEditor(lastSrc); } }, 'Chỉnh lại'));
        if (file.size > 100 * 1024 * 1024) toast('Video xuất ra lớn hơn 100MB, hãy cắt ngắn bớt.', true);
        f.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      onCancel: () => { editor = null; },
    });
    editHost.append(editor.el);
    editHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const preview = h('div', { class: 'up-preview', hidden: true });
  let previewUrl = null;
  const me = S.user;
  const addrPicker = placePicker({ address: me.address, city: me.city, lat: me.hasLocation ? 0 : null });
  const geoSel = geoPicker({ region: '', province: '', district: '' });
  const geoBox = h('div', { class: 'f', id: 'geo-box' },
    h('span', { style: 'display:block;margin-bottom:6px;color:#d9cce6;font-size:14px;font-weight:600' }, 'Video thuộc khu vực nào? *'), geoSel.el);
  const nickBox = h('label', { class: 'f' }, h('span', {}, 'Biệt danh hiển thị trên video'),
    h('input', { name: 'nickname', maxlength: 40, value: me.nickname || me.name || '', required: true }), h('small', {}, 'Người xem chỉ thấy biệt danh này trên video, không thấy tên tài khoản.'));
  const field = (label, name, attrs = {}, tag = 'input') => h('label', { class: 'f' }, h('span', {}, label), h(tag, { name, ...attrs }, tag === 'textarea' ? attrs.value : null));
  const detailsBox = h('details', { class: 'up-details', open: true },
    h('summary', {}, 'Thông tin giới thiệu (không bắt buộc – đã điền sẵn từ hồ sơ, bạn có thể sửa)'),
    h('div', { class: 'two' }, field('Năm sinh', 'birthYear', { type: 'number', inputmode: 'numeric', value: me.birthYear || '' }), field('Xuất xứ / quê quán', 'origin', { value: me.origin || '', maxlength: 60 })),
    h('div', { class: 'two' }, field('Chiều cao (cm)', 'height', { type: 'number', inputmode: 'numeric', value: me.height || '' }), field('Cân nặng (kg)', 'weight', { type: 'number', inputmode: 'numeric', value: me.weight || '' })),
    field('Nghề nghiệp', 'occupation', { value: me.occupation || '', maxlength: 60 }),
    field('Sở thích', 'interests', { value: (me.interests || []).join(', '), rows: 3, maxlength: 8000, placeholder: 'VD: du lịch, cà phê, yoga… Bạn có thể viết dài thoải mái (tới khoảng 1000 từ).' }, 'textarea'),
    h('div', { class: 'f' }, h('span', { style: 'display:block;margin-bottom:6px;color:#d9cce6;font-size:14px;font-weight:600' }, 'Địa chỉ'), addrPicker.el,
      h('small', { class: 'muted', style: 'display:block;margin-top:2px' }, 'Chọn một gợi ý để video hiện ở mục "Quanh đây" của khách ở gần bạn.')),
    field('Thời gian rảnh', 'workTime', { value: me.availability || '', maxlength: 120, placeholder: 'VD: Tối các ngày trong tuần' }),
    h('label', { class: 'f' }, h('span', {}, 'Số điện thoại'), h('input', { name: 'phone', type: 'tel', value: me.phone || '', maxlength: 20, placeholder: '09xx xxx xxx' }), h('small', {}, 'Chỉ thành viên đã đăng nhập mới thấy khi bấm nút "Gọi" trên video.')),
    h('label', { class: 'f' }, h('span', {}, 'Điều tôi không muốn / từ chối gặp'), h('textarea', { name: 'boundaries', maxlength: 300, style: 'min-height:70px' }, me.boundaries || '')));
  const upFill = h('i'), upPct = h('b', {}, '0%'), upInfo = h('span', { class: 'muted' }, '');
  const upCancel = h('button', { type: 'button', class: 'btn sm ghost' }, 'Huỷ tải lên');
  const upBox = h('div', { class: 'up-progress', hidden: true, role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-live': 'polite' },
    h('div', { class: 'up-head' }, h('span', {}, 'Đang tải video lên…'), upPct),
    h('div', { class: 'up-track' }, upFill),
    h('div', { class: 'up-foot' }, upInfo, upCancel),
    h('p', { class: 'muted', style: 'font-size:13px;margin-top:8px' }, 'Vui lòng giữ trang này mở cho đến khi tải xong.'));
  let uploading = null;
  const warnLeave = (e) => { if (uploading) { e.preventDefault(); e.returnValue = ''; } };
  window.addEventListener('beforeunload', warnLeave);
  onLeave(() => { window.removeEventListener('beforeunload', warnLeave); if (uploading) uploading.abort(); });

  // ----- cover image (ảnh bìa): pick a frame from the video, or upload your own picture -----
  let cover = null, coverUrl = null, coverVideo = null, frameTimer = null, customCover = false;
  const coverImg = h('img', { class: 'cover-img', alt: 'Ảnh bìa video', hidden: true });
  const coverRange = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: 0, 'aria-label': 'Chọn khung hình làm ảnh bìa', disabled: true });
  const coverFile = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', class: 'sr', id: 'coverfile' });
  const coverBox = h('div', { class: 'f cover-box', hidden: true },
    h('span', { style: 'display:block;margin-bottom:8px;color:#d9cce6;font-size:14px;font-weight:600' }, 'Ảnh bìa (hình đại diện của video)'),
    h('div', { class: 'cover-row' }, coverImg,
      h('div', { class: 'cover-ctl' },
        h('label', { style: 'font-size:13px;color:var(--muted)' }, 'Kéo để chọn khung hình trong video', coverRange),
        h('div', { class: 'row' }, h('label', { class: 'btn sm', for: 'coverfile' }, 'Tải ảnh từ máy'), coverFile,
          h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { customCover = false; captureFrame(); } }, 'Dùng khung hình hiện tại')))));
  const setCover = (blob) => {
    cover = blob;
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    coverUrl = blob ? URL.createObjectURL(blob) : null;
    coverImg.hidden = !blob; if (blob) coverImg.src = coverUrl;
  };
  function captureFrame() {
    const v = coverVideo; if (!v || !v.videoWidth) return;
    const k = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas'); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((b) => b && setCover(b), 'image/jpeg', 0.85);
  }
  function loadCoverSource(file) {
    if (coverVideo) { coverVideo.src = ''; coverVideo = null; }
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto';
    const url = URL.createObjectURL(file); v.src = url; coverVideo = v;
    v.addEventListener('loadedmetadata', () => {
      const go = () => {
        const d = isFinite(v.duration) ? v.duration : 10;
        coverRange.max = String(d); coverRange.disabled = false; coverRange.value = String(Math.min(0.5, d / 4));
        v.currentTime = +coverRange.value;
      };
      if (isFinite(v.duration)) go(); else { v.currentTime = 1e9; v.addEventListener('timeupdate', () => { v.currentTime = 0; go(); }, { once: true }); }
    }, { once: true });
    v.addEventListener('seeked', () => { if (!customCover) captureFrame(); });
    coverBox.hidden = false;
  }
  coverRange.addEventListener('input', () => { customCover = false; clearTimeout(frameTimer); frameTimer = setTimeout(() => { if (coverVideo) coverVideo.currentTime = +coverRange.value; }, 80); });
  coverFile.addEventListener('change', () => {
    const f2 = coverFile.files[0]; if (!f2) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f2.type)) return toast('Chỉ nhận ảnh JPG/PNG/WebP', true);
    if (f2.size > 5 * 1024 * 1024) return toast('Ảnh bìa tối đa 5MB', true);
    customCover = true; setCover(f2);
  });

  fileIn.addEventListener('change', () => {
    edited = null; editNote.hidden = true; closeEditor();
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    preview.replaceChildren(); preview.hidden = true;
    customCover = false; setCover(null); coverBox.hidden = true; coverRange.disabled = true;
    const file = fileIn.files[0];
    if (!file) return;
    previewUrl = URL.createObjectURL(file);
    preview.append(h('video', { src: previewUrl, controls: true, playsinline: true, preload: 'metadata' }),
      h('p', { class: 'muted', style: 'font-size:13px' }, 'Đã chọn: ' + file.name + ' (' + (file.size / 1048576).toFixed(1) + ' MB). Bạn có thể đăng ngay hoặc bấm "Chỉnh sửa video".'));
    preview.hidden = false;
    loadCoverSource(file);
  });
  const f = h('form', {},
    h('h2', { class: 'title', style: 'margin-bottom:6px' }, 'Đăng video'), h('p', { class: 'muted', style: 'margin-bottom:22px' }, 'Video dọc (9:16) ngắn gọn, chân thật sẽ được xem nhiều nhất. Bạn có thể cắt, chỉnh tốc độ, thêm nhạc, chữ, icon, hiệu ứng, hoặc tạo video từ nhiều ảnh.'), err,
    h('label', { class: 'f' }, h('span', {}, 'Chọn video (MP4/WebM, tối đa 100MB)'), fileIn),
    preview, coverBox, editNote,
    h('div', { class: 'row', style: 'margin:-6px 0 14px' },
      h('button', { type: 'button', class: 'btn sm', html: icon('spark') + 'Chỉnh sửa video (không bắt buộc)', onclick: () => { if (!fileIn.files[0]) return toast('Hãy chọn video trước', true); openEditor([fileIn.files[0]]); } }),
      h('label', { class: 'btn sm primary', for: 'photofiles', html: icon('video') + 'Tạo video từ nhiều ảnh' }), photoIn),
    h('p', { class: 'muted', style: 'text-align:center;margin:-4px 0 12px' }, '— hoặc —'),
    h('label', { class: 'f' }, h('span', {}, 'Dán liên kết (YouTube, .mp4, .m3u8)'), h('input', { name: 'url', type: 'url', placeholder: 'https://' })),
    h('label', { class: 'f' }, h('span', {}, 'Mô tả'), h('textarea', { name: 'caption', maxlength: 300, placeholder: 'Giới thiệu ngắn về bạn, sở thích, mẫu người lý tưởng…' })),
    geoBox, nickBox, detailsBox,
    h('div', { class: 'notice', style: 'margin-bottom:16px', html: icon('shield') + '<span>Không đăng nội dung khiêu dâm, ảnh/video của người khác hay quảng cáo dịch vụ tình dục. Vi phạm sẽ bị khoá tài khoản.</span>' }),
    h('button', { class: 'btn primary lg', type: 'submit', style: 'width:100%' }, 'Đăng video'),
    upBox);
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    closeEditor(); // posting never requires exporting: unfinished edits are dropped and the chosen video is posted
    err.hidden = true;
    if (!f.elements.region.value || !f.elements.province.value) {
      err.textContent = 'Vui lòng chọn khu vực của video (miền và tỉnh/thành phố).'; err.hidden = false; geoBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
    }
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Đang tải lên… 0%';
    const fd = new FormData(f); fd.delete('file');
    const file = edited || (fileIn.files[0] && fileIn.files[0].size ? fileIn.files[0] : null);
    if (file) fd.set('file', file, file.name);
    fd.delete('thumb'); if (file && cover) fd.set('thumb', cover, cover.name || 'cover.jpg');
    { const a = addrPicker.get(); fd.set('address', a.address || a.city || ''); fd.delete('lat'); fd.delete('lng'); if (a.lat) { fd.set('lat', a.lat); fd.set('lng', a.lng); } }
    const reset = () => { uploading = null; upBox.hidden = true; btn.disabled = false; btn.textContent = 'Đăng video'; };
    const setPct = (loaded, total) => {
      const pct = Math.min(100, Math.floor((loaded / total) * 100));
      upFill.style.width = pct + '%'; upPct.textContent = pct + '%'; upBox.setAttribute('aria-valuenow', String(pct));
      upInfo.textContent = pct >= 100 ? 'Đang xử lý video trên máy chủ…' : fmtMB(loaded) + ' / ' + fmtMB(total) + ' MB';
      btn.textContent = pct >= 100 ? 'Đang xử lý…' : 'Đang tải lên… ' + pct + '%';
    };
    upFill.style.width = '0%'; upPct.textContent = '0%'; upInfo.textContent = ''; upBox.hidden = false;
    upBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    uploading = apiUpload('/videos', fd, setPct);
    upCancel.onclick = () => uploading && uploading.abort();
    try { await uploading.promise; uploading = null; toast('Đã đăng video 🎬'); location.hash = '#/feed'; }
    catch (ex) {
      reset();
      if (ex.status === 401) return openAuth('login');
      if (!ex.aborted) { err.textContent = ex.message; err.hidden = false; err.scrollIntoView({ behavior: 'smooth', block: 'center' }); } else toast('Đã huỷ tải lên');
    }
  });
  onLeave(closeEditor);
  main.append(h('div', { class: 'wrap', style: 'max-width:1100px;padding:32px 0' }, h('div', { class: 'card', style: 'padding:28px;max-width:620px;margin-inline:auto' }, f), editHost));
}

// ---------- messages ----------
async function pageMessages(otherId) {
  if (!S.user) { openAuth('login'); location.hash = '#/'; return; }
  const list = h('div', { class: 'card list' + (otherId ? ' hide-m' : '') });
  const thread = h('div', { class: 'card thread' + (otherId ? '' : ' hide-m') });
  main.append(h('div', { class: 'wrap inbox' }, list, thread));
  const loadList = async () => {
    const { conversations } = await api('/conversations');
    list.innerHTML = '';
    if (!conversations.length) list.append(h('div', { class: 'empty' }, h('div', { class: 'ico', html: icon('msg') }), h('h3', {}, 'Chưa có cuộc trò chuyện'), h('p', {}, 'Nhắn tin cho ai đó từ video hoặc trang Làm quen.')));
    conversations.forEach((c) => list.append(h('a', { class: 'conv' + (String(c.user.id) === String(otherId) ? ' on' : ''), href: '#/messages/' + c.user.id },
      avatar(c.user, 'md'), h('div', { class: 't' }, h('b', {}, c.user.name), h('p', {}, c.last.kind === 'booking' ? '📅 Lời mời hẹn gặp' : [c.last.from === S.user.id && h('span', {}, 'Bạn: '), h('span', { translate: 'no' }, c.last.body)])), c.unread > 0 && h('span', { class: 'badge' }, c.unread))));
  };
  await loadList();
  if (!otherId) { thread.append(h('div', { class: 'empty', style: 'margin:auto' }, h('div', { class: 'ico', html: icon('msg') }), h('h3', {}, 'Chọn một cuộc trò chuyện'))); return; }

  const { user, messages } = await api('/messages/' + otherId);
  S.unread = 0; renderNav();
  const bubbles = h('div', { class: 'bubbles' });
  const bookingCache = {};
  const bubble = async (m) => {
    const me = m.from === S.user.id;
    let inner;
    if (m.kind === 'booking') {
      const { bookingId } = JSON.parse(m.body);
      inner = h('div', { class: 'bk' }, h('b', { html: icon('cal') + ' Lời mời hẹn gặp' }), h('div', { class: 'muted', style: 'font-size:13px;margin:6px 0' }, 'Đang tải…'));
      api('/bookings').then(({ bookings }) => {
        const b = bookings.find((x) => x.id === bookingId); if (!b) return;
        bookingCache[bookingId] = b;
        inner.replaceChildren(h('b', { html: icon('cal') + ' Lời mời hẹn gặp' }),
          h('div', { style: 'margin:8px 0;font-size:14px' }, fmtDate(b.when), h('br'), '📍 ' + b.place, b.note && h('div', { class: 'muted' }, '“' + b.note + '”')),
          h('span', { class: 'status st-' + b.status }, { pending: 'Chờ phản hồi', accepted: 'Đã đồng ý', declined: 'Đã từ chối', cancelled: 'Đã huỷ' }[b.status]),
          b.status === 'pending' && !b.mine && h('div', { class: 'row', style: 'margin-top:10px' },
            h('button', { class: 'btn sm primary', onclick: () => act(b.id, 'accept') }, 'Đồng ý'), h('button', { class: 'btn sm', onclick: () => act(b.id, 'decline') }, 'Từ chối')));
      }).catch(() => {});
    } else inner = m.body;
    return h('div', { class: 'b' + (me ? ' me' : ''), 'data-id': m.id, translate: m.kind === 'booking' ? null : 'no' }, inner, h('time', {}, fmtTime(m.createdAt)));
  };
  const act = async (id, a) => { try { await api(`/bookings/${id}/${a}`, { method: 'POST' }); route(); } catch (e) { fail(e); } };
  const add = async (m) => { bubbles.append(await bubble(m)); bubbles.scrollTop = bubbles.scrollHeight; };
  for (const m of messages) await add(m);

  const input = h('input', { placeholder: 'Nhập tin nhắn…', maxlength: 1000, 'aria-label': 'Tin nhắn', autocomplete: 'off' });
  const form = h('form', { class: 'composer' }, input,
    h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Hẹn gặp', onclick: () => openBook(user), html: icon('cal') }),
    h('button', { class: 'btn primary', type: 'submit', 'aria-label': 'Gửi', html: icon('send') }));
  form.addEventListener('submit', async (e) => { e.preventDefault(); const body = input.value.trim(); if (!body) return; input.value = ''; try { await api('/messages/' + otherId, { method: 'POST', body: { body } }); } catch (ex) { fail(ex); input.value = body; } });
  thread.append(h('header', { style: 'padding:12px 16px;border-bottom:1px solid var(--line);display:flex;gap:12px;align-items:center' },
    h('a', { class: 'iconbtn', href: '#/messages', 'aria-label': 'Quay lại', style: 'width:38px;height:38px', html: icon('back') }),
    h('a', { href: '#/u/' + user.id, style: 'display:flex;gap:10px;align-items:center;flex:1' }, avatar(user, 'md'), h('b', {}, user.name)),
    h('button', { class: 'iconbtn', 'aria-label': 'Gọi video', onclick: () => startVideoCall(user), html: icon('video') }),
    h('button', { class: 'iconbtn', 'aria-label': 'Gọi', onclick: () => openCall(user), html: icon('phone') }),
    h('button', { class: 'iconbtn', 'aria-label': 'Báo cáo', onclick: () => openReport('user', user.id), html: icon('flag') })), bubbles, form);
  bubbles.scrollTop = bubbles.scrollHeight;
  const onDm = (e) => { const m = e.detail; if (m.from === user.id || m.to === user.id) { if (!bubbles.querySelector(`[data-id="${m.id}"]`)) add(m); if (m.from === user.id) api('/messages/' + otherId).then(() => { S.unread = 0; renderNav(); }); loadList(); } };
  window.addEventListener('dm', onDm); onLeave(() => window.removeEventListener('dm', onDm));
}

// ---------- dates ----------
async function pageDates() {
  if (!S.user) { openAuth('login'); location.hash = '#/'; return; }
  const box = h('div', { class: 'wrap', style: 'max-width:760px;padding:32px 0' }, h('h2', { class: 'title', style: 'margin-bottom:20px' }, 'Lịch hẹn của tôi'));
  const body = h('div', { style: 'display:grid;gap:14px' });
  box.append(body); main.append(box);
  const load = async () => {
    const { bookings } = await api('/bookings'); body.innerHTML = '';
    if (!bookings.length) body.append(h('div', { class: 'card empty' }, h('div', { class: 'ico', html: icon('cal') }), h('h3', {}, 'Chưa có lịch hẹn'), h('p', {}, 'Bấm “Hẹn gặp” dưới video của ai đó để gửi lời mời.')));
    bookings.forEach((b) => body.append(h('div', { class: 'card', style: 'padding:18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap' },
      avatar(b.other, 'md'), h('div', { style: 'flex:1;min-width:200px' }, h('b', {}, (b.mine ? 'Bạn mời ' : 'Lời mời từ ') + b.other.name), h('div', { class: 'muted', style: 'font-size:14px' }, fmtDate(b.when) + ' · ' + b.place)),
      h('span', { class: 'status st-' + b.status }, { pending: 'Chờ phản hồi', accepted: 'Đã đồng ý', declined: 'Đã từ chối', cancelled: 'Đã huỷ' }[b.status]),
      b.status === 'pending' && !b.mine && h('button', { class: 'btn sm primary', onclick: () => act(b.id, 'accept') }, 'Đồng ý'),
      b.status === 'pending' && !b.mine && h('button', { class: 'btn sm', onclick: () => act(b.id, 'decline') }, 'Từ chối'),
      ['pending', 'accepted'].includes(b.status) && h('button', { class: 'btn sm ghost', onclick: () => act(b.id, 'cancel') }, 'Huỷ'),
      h('a', { class: 'btn sm', href: '#/messages/' + b.other.id }, 'Nhắn tin'))));
  };
  const act = async (id, a) => { try { await api(`/bookings/${id}/${a}`, { method: 'POST' }); load(); } catch (e) { fail(e); } };
  await load();
  window.addEventListener('bookingupdate', load); onLeave(() => window.removeEventListener('bookingupdate', load));
}

// ---------- live ----------
async function pageLive() {
  const { streams } = await api('/streams');
  main.append(h('div', { class: 'wrap', style: 'padding:32px 0' },
    h('div', { class: 'head' }, h('h2', { class: 'title' }, 'Livestream'), h('a', { class: 'btn live', href: '#/golive', html: icon('live') + 'Phát trực tiếp' })),
    streams.length ? h('div', { class: 'grid g4' }, streams.map(lcard)) : h('div', { class: 'card empty' }, h('div', { class: 'ico', html: icon('live') }), h('h3', {}, 'Hiện chưa có buổi live nào'), h('p', {}, 'Hãy mở buổi live đầu tiên và mời mọi người vào trò chuyện!'), h('a', { class: 'btn primary', style: 'margin-top:14px', href: '#/golive' }, 'Bắt đầu phát'))), footer());
}

async function pageGoLive() {
  if (!S.user) { openAuth('login'); location.hash = '#/'; return; }
  const err = h('div', { class: 'err', hidden: true });
  const url = h('label', { class: 'f', hidden: true }, h('span', {}, 'Liên kết phát'), h('input', { name: 'source', type: 'url', placeholder: 'https://…' }), h('small', {}, 'Dán liên kết YouTube Live hoặc luồng HLS (.m3u8) của bạn.'));
  const kind = h('select', { name: 'kind' }, h('option', { value: 'webrtc' }, 'Phát bằng camera & micro trên trình duyệt'), h('option', { value: 'youtube' }, 'Nhúng YouTube Live'), h('option', { value: 'hls' }, 'Luồng HLS (.m3u8) từ OBS / dịch vụ stream'));
  kind.addEventListener('change', () => { url.hidden = kind.value === 'webrtc'; });
  const f = h('form', {}, h('h2', { class: 'title', style: 'margin-bottom:6px' }, 'Bắt đầu livestream'), h('p', { class: 'muted', style: 'margin-bottom:22px' }, 'Mọi người có thể xem và chat trực tiếp cùng bạn.'), err,
    h('label', { class: 'f' }, h('span', {}, 'Tiêu đề'), h('input', { name: 'title', maxlength: 80, required: true, placeholder: 'VD: Trò chuyện tối thứ 6 ✨' })),
    h('label', { class: 'f' }, h('span', {}, 'Cách phát'), kind), url,
    h('div', { class: 'notice', style: 'margin-bottom:16px', html: icon('shield') + '<span>Livestream phải tuân thủ quy tắc cộng đồng: không nội dung khiêu dâm, không kêu gọi chuyển tiền.</span>' }),
    h('button', { class: 'btn live lg', style: 'width:100%', type: 'submit' }, 'Phát trực tiếp ngay'));
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(f));
    try { const r = await api('/streams', { method: 'POST', body: d }); location.hash = '#/live/' + r.id + (d.kind === 'webrtc' ? '?host=1' : ''); }
    catch (ex) { err.textContent = ex.message; err.hidden = false; }
  });
  main.append(h('div', { class: 'wrap', style: 'max-width:620px;padding:32px 0' }, h('div', { class: 'card', style: 'padding:28px' }, f)));
}

const RTC = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

async function pageStream(id, wantHost) {
  const { stream } = await api('/streams/' + id);
  if (!stream.live) { main.append(h('div', { class: 'empty', style: 'padding:100px 20px' }, h('h3', {}, 'Buổi live đã kết thúc'), h('a', { class: 'btn primary', style: 'margin-top:14px', href: '#/live' }, 'Xem buổi live khác'))); return; }
  const isHost = !!S.user && S.user.id === stream.host.id;
  const stage = h('div', { class: 'stage' });
  const vc = h('span', { class: 'vc', html: icon('eye') + '<span>0</span>' });
  const msgs = h('div', { class: 'msgs', 'aria-live': 'polite' });
  const hearts = h('div', { class: 'hearts', 'aria-hidden': 'true' });
  let clientId = null; const peers = new Map(); let localStream = null;
  const addMsg = (m) => { msgs.append(h('div', { class: 'lmsg', translate: 'no' }, avatar(m.user), h('div', {}, h('b', {}, m.user.name), m.body))); msgs.scrollTop = msgs.scrollHeight; };
  const heart = () => { const s = h('span', { style: `--dx:${Math.round(Math.random() * 50 - 25)}px;left:${Math.round(Math.random() * 30)}px` }, '💗'); hearts.append(s); setTimeout(() => s.remove(), 2400); };

  const video = h('video', { playsinline: true, autoplay: true });
  const wait = h('div', { class: 'wait' }, h('div', {}, h('div', { class: 'spin' }), h('p', {}, isHost ? 'Đang bật camera…' : 'Đang kết nối với người phát…')));
  if (stream.kind === 'youtube') stage.append(h('iframe', { src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(stream.source)}?autoplay=1&rel=0`, allow: 'autoplay; encrypted-media; picture-in-picture', allowfullscreen: true, title: stream.title }));
  else if (stream.kind === 'hls') {
    video.muted = true; stage.append(video);
    if (window.Hls && Hls.isSupported()) { const hls = new Hls({ lowLatencyMode: true }); hls.loadSource(stream.source); hls.attachMedia(video); onLeave(() => hls.destroy()); } else video.src = stream.source;
    video.play().catch(() => {});
  } else stage.append(video, wait);
  stage.append(h('div', { class: 'top' }, h('span', { class: 'livepill' }, 'LIVE'), vc),
    h('div', { class: 'info' }, h('div', {}, h('b', { style: 'font-size:18px' }, stream.title), h('a', { href: '#/u/' + stream.host.id, class: 'who', style: 'display:flex;gap:8px;align-items:center;margin-top:6px' }, avatar(stream.host), stream.host.name)),
      h('div', { class: 'row' },
        !isHost && h('button', { class: 'iconbtn', 'aria-label': 'Thả tim', onclick: () => { api('/streams/' + id + '/heart', { method: 'POST' }); }, html: icon('heart') }),
        !isHost && h('button', { class: 'btn sm', onclick: () => openBook(stream.host), html: icon('cal') + 'Hẹn gặp' }),
        !isHost && h('button', { class: 'btn sm', onclick: () => startChat(stream.host), html: icon('send') + 'Nhắn riêng' }),
        isHost ? h('button', { class: 'btn live sm', onclick: async () => { await api('/streams/' + id + '/end', { method: 'POST' }); toast('Đã kết thúc buổi live'); location.hash = '#/live'; } }, 'Kết thúc') : h('button', { class: 'iconbtn', 'aria-label': 'Báo cáo', onclick: () => openReport('stream', id), html: icon('flag') }))), hearts);

  const input = h('input', { placeholder: S.user ? 'Nói gì đó…' : 'Đăng nhập để chat', maxlength: 200, 'aria-label': 'Chat', autocomplete: 'off' });
  const form = h('form', { class: 'composer' }, input, h('button', { class: 'btn primary', type: 'submit', 'aria-label': 'Gửi', html: icon('send') }));
  form.addEventListener('submit', async (e) => { e.preventDefault(); if (!S.user) return openAuth('login'); const body = input.value.trim(); if (!body) return; input.value = ''; try { await api('/streams/' + id + '/chat', { method: 'POST', body: { body } }); } catch (ex) { fail(ex); } });
  main.append(h('div', { class: 'wrap livepage' }, stage, h('aside', { class: 'chatbox' }, h('header', {}, 'Chat trực tiếp'), msgs, form)));

  const signal = (to, data) => api('/streams/' + id + '/signal', { method: 'POST', body: { from: clientId, to, data } }).catch(() => {});
  async function hostPeer(viewerId) {
    const pc = new RTCPeerConnection(RTC); peers.set(viewerId, pc);
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    pc.onicecandidate = (e) => e.candidate && signal(viewerId, { ice: e.candidate });
    pc.onconnectionstatechange = () => { if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) { pc.close(); peers.delete(viewerId); } };
    await pc.setLocalDescription(await pc.createOffer()); signal(viewerId, { sdp: pc.localDescription });
  }
  async function viewerSignal(from, data) {
    let pc = peers.get(from);
    if (!pc) {
      pc = new RTCPeerConnection(RTC); peers.set(from, pc);
      pc.ontrack = (e) => { video.srcObject = e.streams[0]; video.muted = true; video.play().catch(() => {}); wait.remove(); stage.append(h('button', { class: 'btn sm', style: 'position:absolute;right:16px;top:16px;z-index:3', onclick: (ev) => { video.muted = !video.muted; ev.currentTarget.textContent = video.muted ? '🔇 Bật tiếng' : '🔊 Tắt tiếng'; } }, '🔇 Bật tiếng')); };
      pc.onicecandidate = (e) => e.candidate && signal(from, { ice: e.candidate });
    }
    if (data.sdp) { await pc.setRemoteDescription(data.sdp); if (data.sdp.type === 'offer') { await pc.setLocalDescription(await pc.createAnswer()); signal(from, { sdp: pc.localDescription }); } }
    else if (data.ice) pc.addIceCandidate(data.ice).catch(() => {});
  }

  if (stream.kind === 'webrtc' && isHost) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      video.srcObject = localStream; video.muted = true; wait.remove();
      onLeave(() => localStream.getTracks().forEach((t) => t.stop()));
    } catch { wait.innerHTML = '<p>Không truy cập được camera/micro. Hãy cấp quyền cho trình duyệt rồi tải lại trang.</p>'; }
  }

  const es = new EventSource(`/api/streams/${id}/events${isHost && stream.kind === 'webrtc' ? '?host=1' : ''}`);
  onLeave(() => { es.close(); peers.forEach((p) => p.close()); });
  es.addEventListener('hello', (e) => { const d = JSON.parse(e.data); clientId = d.clientId; vc.lastChild.textContent = d.viewers; d.chat.forEach(addMsg); });
  es.addEventListener('viewers', (e) => { vc.lastChild.textContent = JSON.parse(e.data).viewers; });
  es.addEventListener('chat', (e) => addMsg(JSON.parse(e.data)));
  es.addEventListener('heart', heart);
  es.addEventListener('ended', () => { toast('Buổi live đã kết thúc'); setTimeout(() => (location.hash = '#/live'), 1500); });
  es.addEventListener('viewer-join', (e) => { if (localStream) hostPeer(JSON.parse(e.data).clientId); });
  es.addEventListener('viewer-leave', (e) => { const p = peers.get(JSON.parse(e.data).clientId); if (p) { p.close(); peers.delete(JSON.parse(e.data).clientId); } });
  es.addEventListener('signal', (e) => { const { from, data } = JSON.parse(e.data); if (!isHost) viewerSignal(from, data); else { const pc = peers.get(from); if (pc) { if (data.sdp) pc.setRemoteDescription(data.sdp).catch(() => {}); else if (data.ice) pc.addIceCandidate(data.ice).catch(() => {}); } } });
}

// ---------- terms ----------
function pageTerms() {
  main.append(h('div', { class: 'wrap' }, h('div', { class: 'prose' }, h('h2', { class: 'title' }, 'Điều khoản & Quy tắc cộng đồng'),
    h('p', { class: 'muted' }, 'Bằng việc sử dụng xgaigu.com, bạn đồng ý với các điều sau.'),
    h('h2', {}, '1. Độ tuổi'), h('p', {}, 'Chỉ người từ đủ 18 tuổi mới được đăng ký và sử dụng. Chúng tôi khoá ngay tài khoản nghi ngờ chưa đủ tuổi.'),
    h('h2', {}, '2. Nội dung bị cấm'), h('ul', {}, ['Nội dung khiêu dâm, ảnh/video nhạy cảm.', 'Môi giới, rao bán hay mua dịch vụ tình dục; mại dâm.', 'Lừa đảo, kêu gọi chuyển tiền, đầu tư, cờ bạc.', 'Quấy rối, đe doạ, phân biệt đối xử, tiết lộ thông tin riêng tư của người khác.', 'Mạo danh hoặc dùng ảnh/video không thuộc về bạn.'].map((t) => h('li', {}, t))),
    h('h2', {}, '3. Hẹn gặp an toàn'), h('ul', {}, ['Lần đầu nên gặp ở nơi công cộng, đông người.', 'Báo cho người thân/bạn bè về thời gian và địa điểm.', 'Không chuyển tiền cho người chưa gặp trực tiếp.', 'Tin vào trực giác – rời đi nếu bạn thấy không thoải mái.'].map((t) => h('li', {}, t))),
    h('h2', {}, '4. Quyền riêng tư'), h('p', {}, 'Số điện thoại chỉ hiển thị cho thành viên đã đăng nhập khi bạn chủ động bật. Bạn có thể xoá video hoặc yêu cầu xoá tài khoản bất cứ lúc nào.'),
    h('h2', {}, '5. Kiểm duyệt'), h('p', {}, 'Chúng tôi có quyền ẩn nội dung và khoá tài khoản vi phạm mà không cần báo trước. Nội dung nghi vấn có thể được chuyển cho cơ quan chức năng.'))), footer());
}

// ---------- admin ----------
// Admin: edit / hide / ban / delete a member's video. onChange runs after any change so the caller can refresh.
async function adminVideoDialog(id, onChange, own = false) {
  let v;
  try { v = (await api(own ? '/videos/' + id + '/edit' : '/admin/videos/' + id)).video; } catch (e) { return fail(e); }
  const STATUS = { visible: 'Đang hiển thị', hidden: 'Đã ẩn', banned: 'Bị cấm xuất bản', self: own ? 'Đang ẩn (chỉ mình bạn thấy)' : 'Chủ video tự ẩn' };
  const badgeSel = h('select', { 'aria-label': 'Huy hiệu', style: 'width:auto' }, [['', 'Huy hiệu: tự động'], ['hot', '🔥 Luôn hiện “Đang hot”'], ['new', '🆕 Luôn hiện “Mới”'], ['off', 'Không hiện huy hiệu']].map(([a, b]) => h('option', { value: a, selected: (v.badge || '') === a }, b)));
  badgeSel.addEventListener('change', async () => { try { v = (await api('/admin/videos/' + v.id + '/badge', { method: 'POST', body: { badge: badgeSel.value } })).video; toast('Đã cập nhật huy hiệu'); onChange && onChange(); } catch (e) { fail(e); } });
  const verChk = h('input', { type: 'checkbox', checked: !!v.verified });
  verChk.addEventListener('change', async () => { try { v = (await api('/admin/videos/' + v.id + '/verified', { method: 'POST', body: { verified: verChk.checked } })).video; toast(v.verified ? 'Đã gắn huy hiệu ĐÃ XÁC MINH' : 'Đã gỡ huy hiệu xác minh'); onChange && onChange(); } catch (e) { verChk.checked = !verChk.checked; fail(e); } });
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
    h('label', { class: 'f' }, h('span', {}, 'Sở thích'), h('textarea', { name: 'interests', rows: 3, maxlength: 8000 }, Array.isArray(i.interests) ? i.interests.join(', ') : (i.interests || ''))),
    h('label', { class: 'f' }, h('span', {}, 'Điều không muốn'), h('textarea', { name: 'boundaries', rows: 2, maxlength: 300 }, i.boundaries || '')),
    h('button', { class: 'btn primary', type: 'submit', style: 'width:100%' }, 'Lưu chỉnh sửa'));
  const statusLine = h('p', { class: 'sub' });
  const paint = () => { statusLine.textContent = own ? STATUS[v.status] + (v.lockedByAdmin ? ' — video đã bị cấm xuất bản' : v.hiddenByAdmin ? ' — đang bị quản trị viên ẩn' : '') : '#' + v.id + ' · ' + v.owner.email + ' · ' + STATUS[v.status] + (v.note ? ' — ' + v.note : '') + ' · ' + v.views + ' lượt xem'; };
  paint();
  const note = h('input', { placeholder: 'Lý do (không bắt buộc, chỉ admin thấy)', maxlength: 300 });
  const setStatus = async (status) => {
    if (status === 'banned' && !confirm('Cấm xuất bản video này? Video sẽ bị gỡ khỏi website.')) return;
    try { v = (await api('/admin/videos/' + v.id + '/status', { method: 'POST', body: { status, note: note.value } })).video; paint(); toast(STATUS[v.status]); onChange && onChange(); } catch (e) { fail(e); }
  };
  const toggleSelf = async () => {
    const hide = v.status === 'visible';
    try { await api('/videos/' + v.id + '/visibility', { method: 'POST', body: { hidden: hide } }); v.status = hide ? 'self' : 'visible'; paint(); selfBtn.textContent = hide ? 'Hiện lại cho mọi người' : 'Ẩn video (chỉ mình tôi thấy)'; toast(hide ? 'Đã ẩn video, chỉ mình bạn thấy' : 'Video đã hiện lại'); onChange && onChange(); } catch (e) { fail(e); }
  };
  const selfBtn = h('button', { class: 'btn sm', type: 'button', onclick: toggleSelf }, v.status === 'visible' ? 'Ẩn video (chỉ mình tôi thấy)' : 'Hiện lại cho mọi người');
  if (own && (v.lockedByAdmin || v.hiddenByAdmin)) selfBtn.disabled = true;
  const ownRow = h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap;margin-bottom:12px' }, h('a', { class: 'btn sm', href: '#/feed/' + v.id, onclick: () => m.close() }, 'Xem video'), selfBtn);
  const m = modal(h('div', {}, h('h3', {}, own ? 'Sửa video của tôi' : 'Quản lý video'), statusLine,
    own ? ownRow : h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap;margin-bottom:10px' },
      h('a', { class: 'btn sm', href: '#/feed/' + v.id, onclick: () => m.close() }, 'Xem video'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => setStatus('visible') }, 'Hiện lại'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => setStatus('hidden') }, 'Ẩn video'),
      h('button', { class: 'btn sm live', type: 'button', onclick: () => setStatus('banned') }, 'Cấm xuất bản'),
      h('button', { class: 'btn sm live', type: 'button', onclick: async () => { if (!confirm('XOÁ vĩnh viễn video này? Không thể khôi phục.')) return; try { await api('/videos/' + v.id, { method: 'DELETE' }); toast('Đã xoá video'); m.close(); onChange && onChange(); } catch (e) { fail(e); } } }, 'Xoá')),
    own ? null : h('label', { class: 'check verify-tick' }, verChk, h('span', {}, h('b', {}, 'Đã xác minh'), ' – hiện huy hiệu xác minh nổi bật trên video này (chỉ admin được chọn)' + (v.accountVerified ? '. Lưu ý: tài khoản chủ video đã được xác minh nên mọi video của họ đều có huy hiệu.' : ''))), own ? null : h('div', { class: 'row', style: 'margin-bottom:10px' }, badgeSel), own ? null : note, h('div', { style: 'height:12px' }), f), { wide: true });
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
      const keep = { lockedByAdmin: v.lockedByAdmin, hiddenByAdmin: v.hiddenByAdmin };
      v = (await api((own ? '/videos/' : '/admin/videos/') + v.id, { method: 'PUT', body: { ...fd, region: reg.value, province: prov.value, district: dist.value } })).video;
      if (own) Object.assign(v, keep);
      if (own) { v.status = v.status || 'visible'; }
      toast('Đã lưu'); paint(); onChange && onChange();
    } catch (er) { fail(er); }
  });
}

// Landing page behind the shared link (xgaigu.com/app): one clear button that installs the app
function pageInstall() {
  Install.report('visit');
  document.title = 'Tải ứng dụng xgaigu – cài về máy chỉ một chạm';
  const installed = Install.standalone();
  const android = /android/i.test(navigator.userAgent), here = location.origin + '/app';
  const step = (n, t) => h('li', { style: 'display:flex;gap:12px;align-items:flex-start;padding:8px 0' }, h('span', { class: 'stepn' }, String(n)), h('span', {}, t));
  const hint = Install.inAppBrowser()
    ? h('div', { class: 'card inst-note' }, h('b', {}, '⚠️ Bạn đang mở trong Facebook / Zalo / Messenger'), h('p', { class: 'muted' }, 'Trình duyệt này không cài được ứng dụng. Hãy mở bằng Chrome (Android) hoặc Safari (iPhone) rồi bấm lại nút cài đặt.'),
      android && h('a', { class: 'btn primary', style: 'margin-top:8px', href: 'intent://' + location.host + '/app#Intent;scheme=https;package=com.android.chrome;end' }, 'Mở bằng Chrome'),
      h('button', { class: 'btn', type: 'button', style: 'margin-top:8px', onclick: async () => { try { await navigator.clipboard.writeText(here); toast('Đã sao chép liên kết, hãy dán vào trình duyệt'); } catch { toast(here); } } }, 'Sao chép liên kết'))
    : Install.ios()
      ? h('div', { class: 'card inst-note' }, h('b', {}, 'Cài trên iPhone / iPad (mở bằng Safari)'), h('ol', { style: 'list-style:none;padding:0;margin:8px 0 0' }, step(1, 'Bấm nút Chia sẻ ⬆️ ở thanh dưới của Safari.'), step(2, 'Chọn “Thêm vào Màn hình chính”.'), step(3, 'Bấm “Thêm”, biểu tượng XG sẽ hiện trên màn hình.')))
      : h('p', { class: 'muted', style: 'font-size:14px' }, 'Bấm nút trên, chọn “Cài đặt” khi trình duyệt hỏi. Biểu tượng XG sẽ xuất hiện ngay trên màn hình.');
  main.append(h('div', { class: 'wrap', style: 'padding:36px 0' }, h('div', { class: 'inst-hero' },
    h('img', { src: '/icons/icon-192.png', alt: 'xgaigu', width: 96, height: 96, style: 'border-radius:24px;box-shadow:0 14px 40px rgba(255,46,126,.45)' }),
    h('h1', { class: 'title', style: 'margin:18px 0 8px;font-size:30px' }, installed ? 'Bạn đã cài ứng dụng xgaigu ✅' : 'Cài ứng dụng xgaigu'),
    h('p', { class: 'muted', style: 'max-width:420px;margin:0 auto 22px;line-height:1.6' }, installed ? 'Bạn đang dùng ứng dụng. Mọi cập nhật của website tự có trong ứng dụng.' : 'Một chạm là có ngay trên màn hình điện thoại, không cần CH Play hay App Store. Ứng dụng luôn đồng bộ với website.'),
    installed ? h('a', { class: 'btn primary lg', href: '#/' }, 'Vào xgaigu')
      : h('button', { type: 'button', class: 'btn primary lg inst-btn', onclick: () => Install.run(), html: '<span aria-hidden="true">📲</span><span>Cài đặt ứng dụng</span>' }),
    !installed && h('div', { style: 'margin-top:22px;text-align:left;max-width:440px;margin-inline:auto' }, hint),
    h('p', { style: 'margin-top:26px' }, h('a', { href: '#/welcome', class: 'muted' }, 'Xem giới thiệu xgaigu')))), footer());
}

async function pageAdmin() {
  if (!S.user || S.user.role !== 'admin') { location.hash = '#/'; return; }
  const [{ reports }, st, tr] = await Promise.all([api('/admin/reports'), api('/admin/app-stats'), api('/admin/traffic')]);
  const kv = (label, b, note) => h('div', { class: 'card', style: 'padding:16px;flex:1;min-width:210px' }, h('div', { class: 'muted', style: 'font-size:13px' }, label),
    h('div', { style: 'font-size:32px;font-weight:800;margin:4px 0' }, String(b.total)),
    h('div', { class: 'muted', style: 'font-size:13px;line-height:1.6' }, 'Hôm nay: ' + b.today + ' · 7 ngày: ' + b.week + ' · 30 ngày: ' + b.month, h('br'), 'Số thiết bị khác nhau: ' + b.devices), note && h('div', { class: 'muted', style: 'font-size:12px;margin-top:6px' }, note));
  const dev = (k, d) => (st.byDevice.find((x) => x.kind === k && x.device === d) || {}).n || 0;
  const devRows = [['android', 'Android'], ['ios', 'iPhone/iPad'], ['desktop', 'Máy tính'], ['other', 'Khác']].map(([d, n]) => h('tr', {}, h('td', {}, n), h('td', {}, String(dev('click', d))), h('td', {}, String(dev('install', d))), h('td', {}, String(dev('open', d)))));
  const days = [...new Set(st.daily.map((x) => x.day))];
  const dayVal = (day, k) => (st.daily.find((x) => x.day === day && x.kind === k) || {}).n || 0;
  const statBox = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:16px' }, 'Thống kê ứng dụng'),
    h('div', { class: 'row', style: 'gap:14px;flex-wrap:wrap;margin-bottom:16px' },
      kv('Lượt vào link tải ứng dụng', st.visit, 'Số lần khách mở trang xgaigu.com/app.'), kv('Lượt bấm “Tải ứng dụng”', st.click), kv('Đã cài về máy', st.install, 'Android/Chrome/Edge: trình duyệt xác nhận cài xong.'), kv('Lượt mở ứng dụng', st.open, 'Mở từ biểu tượng trên màn hình. iPhone không báo “đã cài”, nên xem số này.')),
    h('div', { class: 'card', style: 'overflow:auto;margin-bottom:16px' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['Thiết bị', 'Bấm tải', 'Đã cài', 'Đang dùng app'].map((x) => h('th', {}, x)))), h('tbody', {}, devRows))),
    days.length ? h('div', { class: 'card', style: 'overflow:auto' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['Ngày (14 ngày gần nhất)', 'Bấm tải', 'Đã cài', 'Mở app'].map((x) => h('th', {}, x)))),
      h('tbody', {}, days.map((d) => h('tr', {}, h('td', {}, d), h('td', {}, String(dayVal(d, 'click'))), h('td', {}, String(dayVal(d, 'install'))), h('td', {}, String(dayVal(d, 'open')))))))) : null);
  const rows = reports.map((r) => h('tr', {}, h('td', {}, '#' + r.id), h('td', {}, r.target_type + ' #' + r.target_id), h('td', {}, r.reason), h('td', {}, r.reporter),
    h('td', {}, h('div', { class: 'row' },
      r.target_type === 'video' && h('button', { class: 'btn sm', onclick: async () => { await api('/admin/videos/' + r.target_id + '/hide', { method: 'POST' }); toast('Đã ẩn'); } }, 'Ẩn video'),
      r.target_type === 'user' && h('button', { class: 'btn sm', onclick: async () => { if (confirm('Khoá người dùng này?')) { await api('/admin/users/' + r.target_id + '/ban', { method: 'POST' }); toast('Đã khoá'); } } }, 'Khoá user'),
      h('button', { class: 'btn sm primary', onclick: async () => { await api('/admin/reports/' + r.id + '/resolve', { method: 'POST' }); route(); } }, 'Xong')))));
  const big = (label, val, note) => h('div', { class: 'card', style: 'padding:16px;flex:1;min-width:150px' }, h('div', { class: 'muted', style: 'font-size:13px' }, label), h('div', { style: 'font-size:32px;font-weight:800;margin:4px 0' }, val), note && h('div', { class: 'muted', style: 'font-size:12px' }, note));
  const onlineEl = h('span', {}, String(tr.online));
  const trafficBox = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:16px' }, 'Lượng truy cập website'),
    h('div', { class: 'row', style: 'gap:14px;flex-wrap:wrap;margin-bottom:16px' },
      big('Đang xem website lúc này', h('span', {}, h('span', { style: 'color:#34d399' }, '● '), onlineEl), 'Tự cập nhật mỗi 20 giây'),
      big('Khách truy cập hôm nay', String(tr.today.visitors), 'Mỗi thiết bị tính 1 lần/ngày · hôm qua: ' + tr.yesterday.visitors),
      big('Lượt xem trang hôm nay', String(tr.today.views), 'Hôm qua: ' + tr.yesterday.views),
      big('Tổng số thiết bị đã vào', String(tr.allTime), 'Từ khi bật thống kê')),
    tr.daily.length ? h('div', { class: 'card', style: 'overflow:auto' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['Ngày (giờ Việt Nam)', 'Khách truy cập', 'Lượt xem trang'].map((x) => h('th', {}, x)))),
      h('tbody', {}, tr.daily.map((d) => h('tr', {}, h('td', {}, d.day), h('td', {}, String(d.visitors)), h('td', {}, String(d.views))))))) : h('p', { class: 'muted' }, 'Chưa có dữ liệu. Số liệu bắt đầu đếm từ khi website cập nhật bản này.'));
  const tick = setInterval(async () => { try { onlineEl.textContent = String((await api('/admin/traffic')).online); } catch {} }, 20000);
  S.cleanups.push(() => clearInterval(tick));
  // member list
  const memBody = h('tbody', {}), memInfo = h('div', { class: 'muted', style: 'margin:10px 0;font-size:14px' }), pager = h('div', { class: 'row', style: 'gap:8px;margin-top:12px' });
  const qIn = h('input', { type: 'search', placeholder: 'Tìm theo email hoặc tên…', style: 'flex:1;min-width:200px' });
  const sortSel = h('select', { 'aria-label': 'Sắp xếp', style: 'width:auto' }, [['newest', 'Mới đăng ký nhất'], ['videos', 'Nhiều video nhất'], ['followers', 'Nhiều người theo dõi nhất'], ['likes', 'Nhiều lượt thích nhất'], ['oldest', 'Đăng ký lâu nhất']].map(([v, l]) => h('option', { value: v }, l)));
  sortSel.addEventListener('change', () => { page = 0; loadMembers().catch(fail); });
  let page = 0, qt;
  const loadMembers = async () => {
    const d = await api('/admin/users?page=' + page + '&q=' + encodeURIComponent(qIn.value.trim()) + '&sort=' + sortSel.value);
    memInfo.textContent = 'Tổng số thành viên: ' + d.total;
    memBody.replaceChildren(...d.users.map((u) => h('tr', {}, h('td', {}, String(u.id)), h('td', { translate: 'no', style: 'word-break:break-all' }, u.email), h('td', { translate: 'no' }, u.name + (u.role === 'admin' ? ' (admin)' : '')),
      h('td', {}, String(u.videos)), h('td', {}, String(u.followers)), h('td', {}, String(u.likes)), h('td', {}, new Date(u.created_at).toLocaleDateString('vi-VN')),
      h('td', { style: 'text-align:center' }, h('input', { type: 'checkbox', checked: !!u.verified, title: 'Xác minh tài khoản: mọi video của thành viên này sẽ có huy hiệu Đã xác minh',
        onchange: async (e) => { const on = e.target.checked; try { const r = await api('/admin/users/' + u.id + '/verified', { method: 'POST', body: { verified: on } }); toast(on ? 'Đã xác minh tài khoản, ' + r.videos + ' video có huy hiệu' : 'Đã gỡ xác minh tài khoản'); } catch (er) { e.target.checked = !on; fail(er); } } })),
      h('td', {}, u.banned ? h('span', { class: 'muted' }, 'Đã khoá') : u.role === 'admin' ? '' : h('button', { class: 'btn sm', onclick: async () => { if (confirm('Khoá tài khoản ' + u.email + '?')) { await api('/admin/users/' + u.id + '/ban', { method: 'POST' }); loadMembers(); } } }, 'Khoá')))));
    pager.replaceChildren(page > 0 && h('button', { class: 'btn sm', onclick: () => { page--; loadMembers(); } }, '← Trước'), (page + 1) * d.size < d.total && h('button', { class: 'btn sm', onclick: () => { page++; loadMembers(); } }, 'Sau →'));
  };
  qIn.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(() => { page = 0; loadMembers().catch(fail); }, 300); });
  await loadMembers().catch(fail);
  const membersBox = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Thành viên đã đăng ký'), h('div', { class: 'row', style: 'gap:10px;flex-wrap:wrap' }, qIn, sortSel), memInfo,
    h('div', { class: 'card', style: 'overflow:auto' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['ID', 'Email', 'Tên', 'Video', 'Theo dõi', 'Lượt thích', 'Ngày đăng ký', 'Đã xác minh', ''].map((x) => h('th', {}, x)))), memBody)), pager);
  // video moderation list
  const vBody = h('tbody', {}), vInfo = h('div', { class: 'muted', style: 'margin:10px 0;font-size:14px' }), vPager = h('div', { class: 'row', style: 'gap:8px;margin-top:12px' });
  const vq = h('input', { type: 'search', placeholder: 'Tìm theo nội dung, biệt danh, email chủ video hoặc số ID…', style: 'flex:1;min-width:200px' });
  const vst = h('select', { 'aria-label': 'Trạng thái', style: 'width:auto' }, [['', 'Tất cả video'], ['visible', 'Đang hiển thị'], ['hidden', 'Đã ẩn'], ['banned', 'Bị cấm xuất bản']].map(([a, b]) => h('option', { value: a }, b)));
  let vpage = 0, vqt;
  const BADGE = { visible: ['Hiển thị', '#34d399'], hidden: ['Đã ẩn', '#fbbf24'], self: ['Chủ tự ẩn', '#a78bfa'], banned: ['Bị cấm', '#f43f5e'] };
  const loadVideos = async () => {
    const d = await api('/admin/videos?page=' + vpage + '&status=' + vst.value + '&q=' + encodeURIComponent(vq.value.trim()));
    vInfo.textContent = 'Tổng số video: ' + d.total;
    vBody.replaceChildren(...d.videos.map((x) => h('tr', {},
      h('td', {}, '#' + x.id, x.verified && h('span', { title: 'Đã xác minh', style: 'color:#38bdf8;margin-left:4px' }, '✔')),
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
  // shareable install link + QR code
  const shareBox = (() => {
    const link = location.origin + '/app', text = 'Tải ứng dụng xgaigu về máy chỉ một chạm: ';
    const qrBox = h('div', { style: 'background:#fff;padding:12px;border-radius:14px;width:fit-content;min-height:60px' }, h('span', { style: 'color:#555;font-size:13px' }, 'Đang tạo mã QR…'));
    let qr = null;
    const draw = () => { try { qrBox.replaceChildren(); qrBox.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 0, scalable: true }); const s = qrBox.querySelector('svg'); if (s) { s.setAttribute('width', 190); s.setAttribute('height', 190); } } catch { qrBox.textContent = 'Không tạo được mã QR'; } };
    const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
    sc.onload = () => { try { qr = window.qrcode(0, 'M'); qr.addData(link); qr.make(); draw(); } catch { qrBox.textContent = 'Không tạo được mã QR'; } };
    sc.onerror = () => { qrBox.textContent = 'Không tải được thư viện mã QR'; };
    document.head.append(sc);
    const copy = async () => { try { await navigator.clipboard.writeText(link); toast('Đã sao chép liên kết'); } catch { prompt('Sao chép liên kết này:', link); } };
    const open = (u) => window.open(u, '_blank', 'noopener');
    const png = () => {
      if (!qr) return toast('Mã QR chưa sẵn sàng', true);
      const n = qr.getModuleCount(), cell = 12, pad = 24, c = document.createElement('canvas'); c.width = c.height = n * cell + pad * 2;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000';
      for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) if (qr.isDark(r, q)) g.fillRect(pad + q * cell, pad + r * cell, cell, cell);
      c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'xgaigu-tai-ung-dung-qr.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
    };
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Link tải ứng dụng'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:14px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Gửi liên kết này cho khách. Khách chỉ cần bấm vào, trang sẽ mở ra với nút “Cài đặt ứng dụng”, bấm thêm một lần là ứng dụng được cài vào máy (iPhone sẽ có hướng dẫn 3 bước).'),
        h('div', { class: 'row', style: 'gap:8px;flex-wrap:nowrap' }, h('input', { readonly: true, value: link, style: 'flex:1;min-width:0', onclick: (e) => e.target.select() }), h('button', { class: 'btn primary', type: 'button', onclick: copy }, 'Sao chép')),
        h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' },
          navigator.share && h('button', { class: 'btn', type: 'button', onclick: () => navigator.share({ title: 'Ứng dụng xgaigu', text, url: link }).catch(() => {}) }, 'Chia sẻ…'),
          h('button', { class: 'btn', type: 'button', onclick: () => open('https://zalo.me/share?url=' + encodeURIComponent(link)) }, 'Zalo'),
          h('button', { class: 'btn', type: 'button', onclick: () => open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link)) }, 'Facebook'),
          h('button', { class: 'btn', type: 'button', onclick: () => open('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text)) }, 'Telegram'),
          h('a', { class: 'btn', href: '/app', target: '_blank', rel: 'noopener' }, 'Xem trang tải')),
        h('div', { class: 'row', style: 'gap:18px;align-items:flex-end;flex-wrap:wrap' }, qrBox, h('div', { style: 'display:grid;gap:8px' }, h('span', { class: 'muted', style: 'font-size:13px' }, 'Mã QR: in ra hoặc đăng lên để khách quét bằng camera.'), h('button', { class: 'btn', type: 'button', onclick: png }, 'Tải mã QR (PNG)'))),
        h('p', { class: 'muted', style: 'font-size:13px' }, 'Lượt vào link này được đếm trong mục “Thống kê ứng dụng”.')));
  })();
  // music library: songs uploaded by admins for the video editor
  const musicBox = (() => {
    const list = h('div', { style: 'display:grid;gap:8px' }), info = h('p', { class: 'muted', style: 'font-size:13px' });
    const fileIn = h('input', { type: 'file', accept: 'audio/*,.mp3,.m4a,.aac,.wav,.ogg' });
    const title = h('input', { placeholder: 'Tên bài hát (để trống = lấy theo tên file)', maxlength: 120 }), artist = h('input', { placeholder: 'Ca sĩ / nghệ sĩ (không bắt buộc)', maxlength: 80 });
    const style = h('input', { placeholder: 'Thể loại, VD: Nhạc có lời, Remix, Bolero, Nhạc Hoa…', maxlength: 40, value: 'Nhạc có lời' });
    const prog = h('div', { class: 'muted', style: 'font-size:13px' }), upBtn = h('button', { class: 'btn primary', type: 'button' }, 'Tải bài hát lên');
    const load = async () => {
      try {
        const { tracks } = await api('/music');
        info.textContent = tracks.length + ' bài hát trong thư viện';
        list.replaceChildren(...tracks.map((t) => h('div', { class: 'card', style: 'padding:10px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap' },
          h('div', { style: 'flex:1;min-width:160px' }, h('b', { translate: 'no' }, t.title), h('div', { class: 'muted', style: 'font-size:13px' }, [t.artist, t.style].filter(Boolean).join(' · '))),
          h('audio', { controls: true, preload: 'none', src: t.url, style: 'height:36px;max-width:100%' }),
          h('button', { class: 'btn sm', type: 'button', onclick: async () => { const nt = prompt('Tên bài hát', t.title); if (nt == null) return; const na = prompt('Ca sĩ / nghệ sĩ', t.artist) ?? t.artist; const ns = prompt('Thể loại', t.style) ?? t.style; try { await api('/admin/music/' + t.id, { method: 'PUT', body: { title: nt, artist: na, style: ns } }); load(); } catch (e) { fail(e); } } }, 'Sửa'),
          h('button', { class: 'btn sm live', type: 'button', onclick: async () => { if (!confirm('Xoá bài "' + t.title + '" khỏi thư viện?')) return; try { await api('/admin/music/' + t.id, { method: 'DELETE' }); toast('Đã xoá'); load(); } catch (e) { fail(e); } } }, 'Xoá'))));
      } catch (e) { fail(e); }
    };
    upBtn.addEventListener('click', async () => {
      const f = fileIn.files[0]; if (!f) return toast('Hãy chọn file nhạc', true);
      if (f.size > 30 * 1024 * 1024) return toast('File quá lớn (tối đa 30 MB)', true);
      const fd = new FormData(); fd.append('file', f); fd.append('title', title.value); fd.append('artist', artist.value); fd.append('style', style.value);
      upBtn.disabled = true;
      try {
        await apiUpload('/admin/music', fd, (a, b) => { prog.textContent = 'Đang tải lên… ' + Math.round(a / b * 100) + '%'; }).promise;
        prog.textContent = ''; toast('Đã thêm bài hát vào thư viện'); fileIn.value = ''; title.value = ''; artist.value = ''; load();
      } catch (e) { prog.textContent = ''; fail(e); }
      upBtn.disabled = false;
    });
    load();
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Thư viện nhạc có lời'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Bài hát tải lên đây hiện ngay đầu thư viện nhạc trong trình chỉnh sửa video, để thành viên chọn chèn vào video. Chỉ tải lên bài bạn có quyền sử dụng; nhạc có bản quyền có thể khiến video bị khiếu nại.'),
        fileIn, h('div', { class: 'two' }, title, artist), style, h('div', { class: 'row', style: 'gap:10px;align-items:center' }, upBtn, prog), info, list));
  })();
  // recommendation mix: how much verified / new / hot / favourite-region videos are suggested
  const feedBox = (() => {
    const share = h('input', { type: 'range', min: 0, max: 100, step: 5, value: 60, style: 'flex:1' }), shareOut = h('b', { style: 'min-width:150px' });
    const num = (v) => h('input', { type: 'number', min: 0, max: 20, value: v, style: 'width:90px' });
    const newB = num(8), hotB = num(5), regB = num(7);
    const stat = h('p', { class: 'muted', style: 'font-size:13px' });
    const paint = () => { shareOut.textContent = share.value + '% đã xác minh · ' + (100 - share.value) + '% chưa xác minh'; };
    share.addEventListener('input', paint);
    const fill = (c) => { share.value = c.verifiedShare; newB.value = c.newBoost; hotB.value = c.hotBoost; regB.value = c.regionBoost; paint(); };
    api('/admin/feed-conf').then((d) => { fill(d.conf); stat.textContent = 'Hiện có ' + d.verifiedVideos + ' / ' + d.totalVideos + ' video đã xác minh. Nếu một nhóm hết video, website tự lấy thêm từ nhóm còn lại.'; }).catch(() => {});
    const save = async (body) => { try { const r = await api('/admin/feed-conf', { method: 'PUT', body }); fill(r.conf); toast('Đã lưu cách đề xuất video'); } catch (e) { fail(e); } };
    const row = (label, el, hint) => h('label', { class: 'row', style: 'gap:10px;align-items:center;flex-wrap:wrap' }, h('span', { style: 'min-width:230px' }, label), el, hint && h('span', { class: 'muted', style: 'font-size:12px' }, hint));
    paint();
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Đề xuất video'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:14px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Quyết định loại video nào khách được xem nhiều hơn ở trang chủ ("Dành cho bạn") và các trang khu vực. Thứ tự vẫn ngẫu nhiên, chỉ thay đổi tỉ lệ.'),
        row('Tỉ lệ video đã xác minh', h('div', { class: 'row', style: 'gap:10px;flex:1;min-width:220px;align-items:center' }, share, shareOut)),
        row('Ưu tiên video mới đăng (24 giờ)', newB, '1 = không ưu tiên, càng lớn càng hay xuất hiện'),
        row('Ưu tiên video đang hot', hotB, '1 = không ưu tiên'),
        row('Ưu tiên khu vực khách quan tâm', regB, '0 = không ưu tiên'),
        stat,
        h('div', { class: 'row', style: 'gap:8px' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => save({ verifiedShare: share.value, newBoost: newB.value, hotBoost: hotB.value, regionBoost: regB.value }) }, 'Lưu'),
          h('button', { class: 'btn', type: 'button', onclick: () => save({ verifiedShare: 60, newBoost: 8, hotBoost: 5, regionBoost: 7 }) }, 'Về mặc định'))));
  })();
  // how many videos per page on area pages and profiles
  const pageBox = (() => {
    const inp = h('input', { type: 'number', min: 3, max: 60, value: 15, style: 'width:110px' });
    api('/site-config').then((c) => { inp.value = c.pageSize || 15; }).catch(() => {});
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Số video mỗi trang'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Số video hiện trên mỗi trang ở các trang khu vực và trang hồ sơ thành viên. Nhiều hơn số này thì có nút chuyển sang trang tiếp theo. Ít video mỗi trang giúp trang tải nhanh hơn.'),
        h('div', { class: 'row', style: 'gap:10px;align-items:center;flex-wrap:wrap' }, inp, h('span', { class: 'muted' }, 'video / trang (từ 3 đến 60)'),
          h('button', { class: 'btn primary', type: 'button', onclick: async () => { try { const r = await api('/admin/page-size', { method: 'PUT', body: { pageSize: inp.value } }); inp.value = r.pageSize; toast('Đã lưu: ' + r.pageSize + ' video mỗi trang'); } catch (e) { fail(e); } } }, 'Lưu'))));
  })();
  // link to another website ("Xem Video Hẹn Hò" button in every info sheet)
  const partnerBox = (() => {
    const inp = h('input', { type: 'url', placeholder: 'https://ten-website-khac.com', style: 'flex:1;min-width:220px' });
    api('/site-config').then((c) => { inp.value = c.partner || ''; }).catch(() => {});
    const save = async (val) => { try { const r = await api('/admin/partner', { method: 'PUT', body: { url: val } }); S.conf = { ...(S.conf || {}), partner: r.url }; inp.value = r.url; toast(r.url ? 'Đã lưu, nút "Xem Video Hẹn Hò" đã hiện' : 'Đã ẩn nút "Xem Video Hẹn Hò"'); } catch (e) { fail(e); } };
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Nút "Xem Video Hẹn Hò"'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Dán đường link của một website khác. Khi có link, nút nổi bật "Xem Video Hẹn Hò" sẽ hiện trong mục "Xem thông tin" của mọi video; khách bấm vào sẽ mở website đó ở tab mới. Để trống rồi Lưu (hoặc bấm Ẩn nút) để ẩn.'),
        h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: () => save(inp.value.trim()) }, 'Lưu'), h('button', { class: 'btn', type: 'button', onclick: () => { inp.value = ''; save(''); } }, 'Ẩn nút'))));
  })();
  // up to 5 Telegram group links; the info sheet shows one of them at random
  const statsBody = h('tbody', {}), statsNote = h('p', { class: 'muted', style: 'font-size:13px' });
  const loadTgStats = async () => {
    try {
      const d = await api('/admin/tg-stats');
      const cell = (x) => h('td', { style: 'white-space:nowrap' }, h('b', {}, String(x.clicks)), h('span', { class: 'muted', style: 'font-size:12px' }, ' lượt · ' + x.people + ' người'));
      statsBody.replaceChildren(...(d.links.length ? d.links.map((l, i) => h('tr', {},
        h('td', { style: 'max-width:230px;word-break:break-all' }, (l.active ? 'Nhóm ' + (i + 1) + ': ' : '(link cũ) ') , h('a', { href: l.url, target: '_blank', rel: 'noopener', style: 'color:#7cc7ff' }, l.url.replace(/^https:\/\//, ''))),
        cell(l.today), cell(l.week), cell(l.total))) : [h('tr', {}, h('td', { colspan: 4, class: 'muted' }, 'Chưa có lượt bấm nào.'))]));
      statsNote.textContent = 'Hôm nay là ' + d.today.split('-').reverse().join('/') + ' (giờ Việt Nam). "Người" = số thiết bị khác nhau đã bấm.';
    } catch (e) { fail(e); }
  };
  const statsWrap = h('div', { style: 'margin-top:8px;display:grid;gap:8px' },
    h('div', { class: 'row', style: 'justify-content:space-between;align-items:center' }, h('b', {}, 'Lượt bấm vào từng nhóm'), h('button', { class: 'btn sm', type: 'button', onclick: loadTgStats }, 'Làm mới')),
    h('div', { style: 'overflow:auto' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['Link nhóm', 'Hôm nay', '7 ngày', 'Tổng'].map((x) => h('th', {}, x)))), statsBody)), statsNote);
  loadTgStats();
  const tgBox = (() => {
    const inputs = [1, 2, 3, 4, 5].map((n) => h('input', { type: 'url', placeholder: 'Nhóm ' + n + ': https://t.me/ten_nhom', style: 'width:100%' }));
    const fill = (list) => inputs.forEach((inp, i) => { inp.value = list[i] || ''; });
    api('/site-config').then((c) => fill(c.telegrams || [])).catch(() => {});
    const save = async () => {
      try {
        const r = await api('/admin/site-config', { method: 'PUT', body: { telegrams: inputs.map((x) => x.value.trim()) } });
        S.conf = { ...(S.conf || {}), telegrams: r.telegrams, telegram: r.telegrams[0] || '' }; fill(r.telegrams);
        toast(r.telegrams.length ? 'Đã lưu ' + r.telegrams.length + ' nhóm Telegram' : 'Đã ẩn nút Telegram');
      } catch (e) { fail(e); }
    };
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Nhóm Telegram'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:10px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Điền tối đa 5 link nhóm Telegram. Mỗi lần khách mở "Xem thông tin", nút "Vào nhóm Telegram" sẽ dẫn tới một trong các nhóm này, chọn ngẫu nhiên, để chia đều khách giữa các nhóm. Để trống ô nào thì bỏ qua ô đó; để trống hết rồi Lưu thì nút bị ẩn.'),
        ...inputs,
        h('div', { class: 'row', style: 'gap:8px' }, h('button', { class: 'btn primary', type: 'button', onclick: save }, 'Lưu'), h('button', { class: 'btn', type: 'button', onclick: () => { fill([]); save(); } }, 'Xoá hết')),
        statsWrap));
  })();
  // video optimisation: shrink big videos so they load fast
  const optBox = await (async () => {
    const o = await api('/admin/optimize').catch(() => null); if (!o) return null;
    const info = h('p', { class: 'muted', style: 'font-size:14px;line-height:1.7' }), limit = h('input', { type: 'number', min: 1, max: 1000, value: 50, style: 'width:100px' });
    const startB = h('button', { class: 'btn primary', type: 'button' }, 'Nén video cũ'), stopB = h('button', { class: 'btn', type: 'button', hidden: true }, 'Dừng');
    let timer;
    const paint = (s) => {
      info.textContent = s.available
        ? 'Còn ' + s.pending + ' video lớn hơn 2 MB chưa nén (khoảng ' + s.pendingMB + ' MB). Đã nén: ' + s.optimized + ' video. Phiên này: nén xong ' + s.done + ', tiết kiệm ' + s.savedMB + ' MB' + (s.skipped ? ', bỏ qua ' + s.skipped + ' video đã đủ nhẹ' : '') + (s.failed ? ', lỗi ' + s.failed : '') + (s.running ? ' · đang chạy, còn ' + s.queued + ' video trong hàng đợi…' : '.')
        : 'Máy chủ này không có ffmpeg nên không nén được video.';
      startB.disabled = !s.available || s.running; stopB.hidden = !s.running;
      if (s.running && !timer) timer = setInterval(async () => { try { paint(await api('/admin/optimize')); } catch {} }, 5000);
      if (!s.running && timer) { clearInterval(timer); timer = null; }
    };
    paint(o); S.cleanups.push(() => timer && clearInterval(timer));
    startB.addEventListener('click', async () => { try { const r = await api('/admin/optimize/start', { method: 'POST', body: { limit: limit.value } }); toast('Đã xếp hàng ' + r.queued + ' video'); paint(await api('/admin/optimize')); } catch (e) { fail(e); } });
    stopB.addEventListener('click', async () => { try { await api('/admin/optimize/stop', { method: 'POST' }); toast('Sẽ dừng sau video hiện tại'); } catch (e) { fail(e); } });
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Tối ưu video'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Chỉ video lớn hơn 2 MB mới được xem xét; video dưới 2 MB giữ nguyên. Video đã nhẹ (từ 720p trở xuống và dưới khoảng 1,6 Mbit/s, mức tương đương các trang video ngắn khác) cũng giữ nguyên để không mất chất lượng. Video nặng hơn được nén về tối đa 720p, khoảng 1–1,8 Mbit/s, từng video một ở nền. File gốc chỉ bị thay khi bản nén nhỏ hơn rõ rệt.'),
        info, h('div', { class: 'row', style: 'gap:10px;flex-wrap:wrap;align-items:center' }, h('span', { class: 'muted', style: 'font-size:14px' }, 'Nén tối đa'), limit, h('span', { class: 'muted', style: 'font-size:14px' }, 'video mỗi lần'), startB, stopB)));
  })();
  // email: confirmation switch, test mail, campaigns
  const ml = await api('/admin/mail').catch(() => null);
  const mailBox = ml && (() => {
    const chk = h('input', { type: 'checkbox', checked: ml.requireVerification });
    chk.addEventListener('change', async () => { try { await api('/admin/mail', { method: 'PUT', body: { requireVerification: chk.checked } }); toast(chk.checked ? 'Đã BẬT: khách phải xác nhận email mới đăng nhập được' : 'Đã TẮT xác nhận email'); } catch (e) { chk.checked = !chk.checked; fail(e); } });
    const testTo = h('input', { type: 'email', placeholder: 'Email nhận thư thử (để trống = email của bạn)', style: 'flex:1;min-width:220px' });
    const testRes = h('p', { class: 'muted', style: 'font-size:14px;margin-top:8px' });
    const subj = h('input', { placeholder: 'Tiêu đề email', maxlength: 150 }), body = h('textarea', { rows: 8, maxlength: 8000, placeholder: 'Nội dung email. Dùng {name} để chèn tên người nhận. Để trống một dòng giữa các đoạn.' });
    const lim = h('input', { type: 'number', min: 1, max: 1000, value: 100, style: 'width:110px' }), ver = h('input', { type: 'checkbox' });
    const ctaL = h('input', { placeholder: 'Chữ trên nút (không bắt buộc), VD: Xem ngay', maxlength: 40, style: 'flex:1;min-width:180px' }), ctaU = h('input', { placeholder: 'Địa chỉ của nút, VD: https://xgaigu.com/khu-vuc', maxlength: 400, style: 'flex:2;min-width:220px' });
    const camp = h('div', { style: 'margin-top:12px;display:grid;gap:8px' });
    const drawC = (list) => camp.replaceChildren(...list.map((c) => h('div', { class: 'muted', style: 'font-size:13px' }, '#' + c.id + ' · ' + c.subject + ' — ' + ({ running: 'đang gửi…', done: 'xong', interrupted: 'bị gián đoạn' }[c.status] || c.status) + ' · gửi được ' + c.sent + '/' + c.total + (c.failed ? ' · lỗi ' + c.failed : '') + ' · ' + new Date(c.created_at).toLocaleString('vi-VN'))));
    drawC(ml.campaigns);
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Email'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, ml.configured ? 'Gửi từ: ' + ml.from + ' (đã cấu hình)' : '⚠️ Chưa cấu hình email gửi đi. Hãy thêm biến SMTP_USER và SMTP_PASS trên Hostinger.'),
        h('label', { class: 'check' }, chk, h('span', {}, 'Bắt buộc khách xác nhận email mới được đăng ký / đăng nhập (chỉ áp dụng cho người đăng ký mới)')),
        h('p', { class: 'muted', style: 'font-size:13px' }, 'Thành viên: ' + ml.counts.total + ' · đã xác nhận: ' + ml.counts.verified + ' · đã hủy nhận email quảng bá: ' + (ml.counts.optout || 0)),
        h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, testTo, h('button', { class: 'btn', type: 'button', onclick: async (ev) => { ev.target.disabled = true; testRes.textContent = 'Đang gửi…'; try { const r = await api('/admin/mail/test', { method: 'POST', body: { to: testTo.value } }); testRes.textContent = '✅ Đã gửi thư thử tới ' + r.to + '. Hãy kiểm tra hộp thư (cả Spam).'; } catch (e) { testRes.textContent = '❌ ' + e.message; } ev.target.disabled = false; } }, 'Gửi email thử')), testRes,
        h('hr', { style: 'border:0;border-top:1px solid var(--line);width:100%' }),
        h('b', {}, 'Gửi email quảng bá cho thành viên'), subj, body, h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, ctaL, ctaU),
        h('div', { class: 'row', style: 'gap:10px;flex-wrap:wrap;align-items:center' }, h('label', { class: 'muted', style: 'font-size:14px' }, 'Tối đa '), lim, h('span', { class: 'muted', style: 'font-size:14px' }, 'người nhận'), h('label', { class: 'check' }, ver, h('span', {}, 'Chỉ người đã xác nhận email'))),
        h('p', { class: 'muted', style: 'font-size:13px' }, 'Mỗi email có liên kết "Hủy nhận email quảng bá". Gửi chậm khoảng 1,5 giây/email để tránh bị nhà cung cấp chặn. Hãy hỏi Hostinger giới hạn số email mỗi giờ của gói bạn.'),
        h('button', { class: 'btn primary', type: 'button', onclick: async (ev) => { if (!confirm('Gửi email này cho tối đa ' + lim.value + ' thành viên?')) return; ev.target.disabled = true; try { const r = await api('/admin/mail/campaign', { method: 'POST', body: { subject: subj.value, body: body.value, limit: lim.value, verifiedOnly: ver.checked, ctaLabel: ctaL.value, ctaUrl: ctaU.value } }); toast('Đang gửi cho ' + r.total + ' người…'); const poll = setInterval(async () => { try { const x = await api('/admin/mail'); drawC(x.campaigns); if (!x.campaigns.some((c) => c.status === 'running')) { clearInterval(poll); ev.target.disabled = false; toast('Đã gửi xong'); } } catch { clearInterval(poll); } }, 4000); S.cleanups.push(() => clearInterval(poll)); drawC((await api('/admin/mail')).campaigns); } catch (e) { fail(e); ev.target.disabled = false; } } }, 'Gửi email'), camp));
  })();
  // SEO text of every area (region / province / district)
  const geoSeo = geoPicker();
  const sf = { title: h('input', { maxlength: 120, placeholder: 'Tiêu đề trang (nên dưới 60 ký tự)' }), description: h('textarea', { rows: 3, maxlength: 300, placeholder: 'Mô tả ngắn hiện trên Google (nên 120–160 ký tự)' }),
    keywords: h('textarea', { rows: 2, maxlength: 600, placeholder: 'Từ khóa, cách nhau bằng dấu phẩy' }), intro: h('textarea', { rows: 10, maxlength: 6000, placeholder: 'Nội dung giới thiệu khu vực. Để trống một dòng giữa các đoạn.' }) };
  const seoInfo = h('p', { class: 'muted', style: 'font-size:14px;margin:8px 0 12px' }, 'Chọn khu vực ở trên (ít nhất là miền) để sửa.');
  const counter = (el, n) => { const c = h('small', { class: 'muted' }); const u = () => { c.textContent = el.value.length + ' ký tự' + (n ? ' (nên ≤ ' + n + ')' : ''); c.style.color = n && el.value.length > n ? '#fbbf24' : ''; }; el.addEventListener('input', u); u(); return [c, u]; };
  const [cTitle, uTitle] = counter(sf.title, 60), [cDesc, uDesc] = counter(sf.description, 160);
  let seoDef = null, seoUrl = '';
  const seoView = h('a', { class: 'btn sm', target: '_blank', rel: 'noopener', hidden: true }, 'Xem trang này');
  const seoBody = () => { const [r, p, d] = geoSeo.el.querySelectorAll('select'); return { region: r.value, province: p.value, district: d.value }; };
  const loadSeo = async () => {
    const b = seoBody();
    if (!b.region) { seoInfo.textContent = 'Chọn khu vực ở trên (ít nhất là miền) để sửa.'; seoView.hidden = true; seoDef = null; return; }
    try {
      const d = await api('/admin/area-seo?' + new URLSearchParams(b));
      seoDef = d.defaults; seoUrl = d.url;
      const s = d.saved || {};
      // pre-filled with the ready-made text (real, editable values); saved text wins when the admin has written their own
      sf.title.value = s.title || d.defaults.title; sf.description.value = s.description || d.defaults.description; sf.keywords.value = s.keywords || d.defaults.keywords; sf.intro.value = s.intro || d.defaults.intro;
      sf.title.placeholder = d.defaults.title; sf.description.placeholder = d.defaults.description; sf.keywords.placeholder = d.defaults.keywords; sf.intro.placeholder = d.defaults.intro;
      uTitle(); uDesc();
      seoInfo.textContent = d.saved ? 'Khu vực này đang dùng nội dung bạn đã viết.' : 'Đang dùng nội dung mẫu có sẵn (đã điền trong các ô). Cần thì sửa trực tiếp rồi bấm Lưu. Nếu bạn không bấm Lưu, trang vẫn dùng mẫu này và số video tự cập nhật.';
      seoView.href = d.url; seoView.hidden = false;
    } catch (e) { fail(e); }
  };
  geoSeo.el.addEventListener('change', () => setTimeout(loadSeo, 0));
  const seoForm = h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
    h('label', { class: 'f' }, h('span', {}, 'Tiêu đề SEO'), sf.title, cTitle), h('label', { class: 'f' }, h('span', {}, 'Mô tả SEO (meta description)'), sf.description, cDesc),
    h('label', { class: 'f' }, h('span', {}, 'Từ khóa'), sf.keywords), h('label', { class: 'f' }, h('span', {}, 'Nội dung giới thiệu khu vực'), sf.intro),
    h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' },
      h('button', { class: 'btn primary', type: 'button', onclick: async () => { const b = seoBody(); if (!b.region) return toast('Hãy chọn khu vực', true); try { await api('/admin/area-seo', { method: 'PUT', body: { ...b, title: sf.title.value, description: sf.description.value, keywords: sf.keywords.value, intro: sf.intro.value } }); toast('Đã lưu nội dung SEO'); loadSeo(); } catch (e) { fail(e); } } }, 'Lưu'),
      h('button', { class: 'btn', type: 'button', onclick: () => { if (!seoDef) return toast('Hãy chọn khu vực', true); sf.title.value = seoDef.title; sf.description.value = seoDef.description; sf.keywords.value = seoDef.keywords; sf.intro.value = seoDef.intro; uTitle(); uDesc(); } }, 'Điền nội dung mẫu để sửa'),
      h('button', { class: 'btn', type: 'button', onclick: () => { sf.title.value = sf.description.value = sf.keywords.value = sf.intro.value = ''; uTitle(); uDesc(); toast('Đã xoá nội dung, bấm Lưu để quay về nội dung tự động'); } }, 'Về nội dung tự động'), seoView));
  const seoBox = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'SEO khu vực'),
    h('p', { class: 'muted', style: 'font-size:14px;margin-bottom:12px' }, 'Nội dung này hiện trên trang khu vực (xgaigu.com/khu-vuc/…) và trong kết quả Google. Hãy viết tự nhiên, đúng sự thật, và đừng nhồi nhét từ khóa.'), geoSeo.el, seoInfo, seoForm);
  main.append(h('div', { class: 'wrap', style: 'padding:32px 0' }, trafficBox, shareBox, feedBox, pageBox, tgBox, partnerBox, statBox, videosBox, optBox, musicBox, seoBox, mailBox, membersBox, h('h2', { class: 'title', style: 'margin-bottom:20px' }, 'Báo cáo chờ xử lý'),
    reports.length ? h('div', { class: 'card', style: 'overflow:auto' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['ID', 'Đối tượng', 'Lý do', 'Người báo', ''].map((x) => h('th', {}, x)))), h('tbody', {}, rows))) : h('div', { class: 'card empty' }, h('p', {}, 'Không có báo cáo nào 🎉'))));
}

// ---------- router ----------
let routeSeq = 0;
async function route() {
  const seq = ++routeSeq;
  S.cleanups.forEach((f) => { try { f(); } catch {} }); S.cleanups = [];
  document.querySelectorAll('video').forEach((v) => v.pause());
  main.innerHTML = '<div class="spin"></div>';
  renderNav();
  const [path, query] = (location.hash.slice(1) || (document.querySelector('meta[name="xg-route"]') || {}).content || '/').split('?');
  const seg = path.split('/').filter(Boolean);
  const page = async () => {
    main.innerHTML = '';
    const [a, b] = seg;
    main.classList.toggle('nopad', !a || a === 'feed' || a === 'messages' || (a === 'live' && !!b));
    if (!a) return pageFeed(null, true);
    if (a === 'welcome') return pageHome();
    if (a === 'feed') return pageFeed(b);
    if (a === 'people') return pagePeople();
    if (a === 'nearby') return pageNearby();
    if (a === 'search') return pageSearch(new URLSearchParams(query || '').get('q') || '');
    if (a === 'regions') return pageRegions(b && decodeURIComponent(b), seg[2] && decodeURIComponent(seg[2]), seg[3] && decodeURIComponent(seg[3]));
    if (a === 'u') return pageUser(b);
    if (a === 'me') return pageMe();
    if (a === 'upload') return pageUpload();
    if (a === 'messages') return pageMessages(b);
    if (a === 'dates') return pageDates();
    if (a === 'live') return b ? pageStream(b, /host=1/.test(query || '')) : pageLive();
    if (a === 'golive') return pageGoLive();
    if (a === 'terms') return pageTerms();
    if (a === 'install') return pageInstall();
    if (a === 'reset') return pageReset(query);
    if (a === 'forgot-password') { const holder = h('div'); const mm = modal(holder); holder.append(forgotForm(mm)); location.hash = '#/'; return; }
    if (a === 'email-verified') return pageEmailVerified(query);
    if (a === 'admin') return pageAdmin();
    main.append(h('div', { class: 'empty', style: 'padding:100px 20px' }, h('h3', {}, 'Không tìm thấy trang'), h('a', { class: 'btn primary', style: 'margin-top:14px', href: '#/' }, 'Về trang chủ')));
  };
  try { await page(); } catch (e) {
    if (seq !== routeSeq) return;
    main.innerHTML = ''; main.append(h('div', { class: 'empty', style: 'padding:100px 20px' }, h('h3', {}, 'Rất tiếc, có lỗi xảy ra'), h('p', {}, e.message), h('a', { class: 'btn', style: 'margin-top:14px', href: '#/' }, 'Về trang chủ')));
  }
  if (seq === routeSeq && !/^(#\/?)?$|^#\/feed/.test(location.hash)) window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

window.XG = { h, toast, icon };

// ---------- boot ----------
(async function boot() {
  const gate = $('#agegate');
  let ok = false; try { ok = localStorage.getItem('age18') === '1'; } catch {}
  if (!ok) {
    gate.hidden = false; document.body.style.overflow = 'hidden';
    $('#age-yes').addEventListener('click', () => { try { localStorage.setItem('age18', '1'); } catch {} gate.hidden = true; document.body.style.overflow = ''; });
    $('#age-yes').focus();
  }
  { const m = location.pathname.match(/^\/v\/(\d+)\/?$/); if (m) history.replaceState(null, '', '/#/feed/' + m[1]); } // opened from a shared link
  try { S.user = (await api('/me')).user; } catch {}
  api('/site-config').then((c) => { S.conf = c || {}; }).catch(() => { S.conf = {}; });
  connectEvents();
  window.addEventListener('hashchange', () => { route(); ping(true); });
  route();
  ping(true);
  setInterval(() => { if (document.visibilityState === 'visible') ping(false); }, 25000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ping(false); });
})();
})();
