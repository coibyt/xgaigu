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
  if (!r.ok) { const e = new Error(data.error || 'Có lỗi xảy ra'); e.status = r.status; throw e; }
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
      h('button', { class: 'btn primary lg', style: 'width:100%', type: 'submit' }, reg ? 'Tạo tài khoản' : 'Đăng nhập'));
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      d.agree = !!f.agree?.checked;
      if (reg) Object.assign(d, picker.get());
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      try {
        const r = await api(reg ? '/register' : '/login', { method: 'POST', body: d });
        S.user = r.user; m.close(); afterAuth(); toast(reg ? 'Chào mừng đến với xgaigu 💖' : 'Đã đăng nhập');
      } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; }
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
  window.addEventListener('appinstalled', () => { evt = null; known = true; lsSet(); refresh(); toast('Đã cài ứng dụng xgaigu!'); });
  // if the website moved to a new domain, an app installed from the old one jumps to the new domain
  fetch('/api/site', { cache: 'no-store' }).then((r) => r.json()).then((j) => { if (j && j.moved && j.url) location.replace(j.url + location.pathname + location.search + location.hash); }).catch(() => {});
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  const steps = (items) => h('ol', { style: 'margin:12px 0 0 20px;display:grid;gap:8px;line-height:1.5' }, items.map((t) => h('li', {}, t)));
  async function run() {
    if (evt) { const e = evt; evt = null; e.prompt(); await e.userChoice.catch(() => {}); refresh(); return; }
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
  return { run, button, standalone };
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
  const el = h('video', { playsinline: true, muted: true, preload: 'metadata', poster: v.thumb || null, controls: controls || null, 'aria-label': v.caption || 'Video' });
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
        if (on && !v.src) v.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${S.sound ? 0 : 1}&enablejsapi=1&playsinline=1&rel=0&modestbranding=1`;
        else if (!on && v.src) v.removeAttribute('src');
        return;
      }
      if (!(v instanceof HTMLVideoElement)) return;
      if (e.isIntersecting && e.intersectionRatio > 0.6) {
        v.muted = !S.sound; v._sync && v._sync();
        v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
      } else v.pause();
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
    try { await api('/videos/' + v.id + '/comments', { method: 'POST', body: { body: input.value } }); input.value = ''; load(); } catch (ex) { fail(ex); }
  });
}

async function toggleLike(v, btn) {
  if (!(await needLogin())) return;
  try {
    const r = await api('/videos/' + v.id + '/like', { method: 'POST' });
    v.liked = r.liked; v.likes = r.likes;
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
    media.addEventListener('click', () => { if (performance.now() - (S.unmutedAt || 0) < 500) return; media.paused ? media.play() : media.pause(); });
  } else { mute.hidden = true; if (media.dataset.yt) observePlay(media); }
  const like = actBtn('like' + (v.liked ? ' liked' : ''), 'Thích', 'heart', v.likes, () => toggleLike(v, like));
  const cm = actBtn('', 'Bình luận', 'msg', v.comments, () => openComments(v, cm.querySelector('.n')));
  const rail = h('div', { class: 'rail' },
    like, cm,
    actBtn('chat', 'Nhắn tin', 'send', null, () => startChat(v.user)),
    actBtn('call', 'Gọi', 'phone', null, () => openCall({ ...v.user, canCall: v.hasPhone }, v.id)),
    actBtn('book', 'Hẹn gặp', 'cal', null, () => openBook(v.user, v.id)),
    actBtn('', 'Chia sẻ', 'share', null, () => share(v)),
    v.file && actBtn('', 'Tải xuống', 'download', null, () => downloadVideo(v)),
    actBtn('', 'Báo cáo', 'flag', null, () => openReport('video', v.id)));
  const el = h('article', { class: 'slide', 'data-id': v.id },
    h('div', { class: 'player' }, media, mute,
      h('div', { class: 'meta' },
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
  const more = async () => {
    if (loading || done) return; loading = true;
    try {
      const { videos } = await api('/videos' + (before ? '?before=' + before : ''));
      if (!videos.length && first && home) { loading = false; main.innerHTML = ''; return pageHome(); }
      if (!videos.length) { done = true; box.append(h('div', { class: 'slide' }, h('div', { class: 'endcap' }, videos.length || !first ? 'Bạn đã xem hết video 🎉' : ''))); if (first) { box.innerHTML = ''; box.append(emptyFeed()); } }
      else { videos.forEach((v) => box.append(slide(v))); before = videos[videos.length - 1].id; if (videos.length < 12) done = true; }
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
    h('span', { class: 'views', title: fmtCount(v.views || 0) + ' lượt xem', html: icon('heart') + v.likes + '<span class="vsep">·</span>' + icon('eye2') + fmtCount(v.views || 0) }),
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
    h('div', { class: 'row' }, h('a', { class: 'xg-install', hidden: Install.standalone(), href: '#', onclick: (e) => { e.preventDefault(); Install.run(); } }, '📲 Cài đặt ứng dụng'), h('a', { href: '#', onclick: (e) => { e.preventDefault(); openLanguage(); } }, '🌐 Ngôn ngữ / Language'), h('a', { href: '#/welcome' }, 'Giới thiệu'), h('a', { href: '#/terms' }, 'Điều khoản & Quy tắc cộng đồng'))));
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
      h('div', { class: 'row', style: 'flex-wrap:nowrap;align-items:flex-start' }, h('div', { style: 'flex:1;min-width:0' }, picker.el), go),
      h('p', { class: 'muted', style: 'font-size:13px' }, 'Vị trí của bạn chỉ dùng để tìm kiếm, không được lưu lên máy chủ. Người khác chỉ thấy khoảng cách làm tròn.')),
    status, grid), footer());
  if (pos) show();
}

async function pageUser(id) {
  const { user, videos } = await api('/users/' + id);
  const me = S.user && S.user.id === user.id;
  const w = h('div', { class: 'wrap' },
    h('div', { class: 'profile-head' }, avatar(user, 'lg'),
      h('div', { style: 'flex:1;min-width:220px' }, h('h2', { class: 'title' }, user.name + ', ' + user.age), user.nickname && h('p', { class: 'muted' }, 'Biệt danh: ' + user.nickname), h('p', { class: 'muted', html: icon('pin') + ' ' + esc(user.city || 'Việt Nam') }), user.bio && h('p', { style: 'margin-top:10px;max-width:560px', translate: 'no' }, user.bio),
        h('div', { class: 'facts' }, [['Nghề nghiệp', user.occupation], ['Xuất xứ', user.origin], ['Chiều cao', user.height && user.height + ' cm'], ['Cân nặng', user.weight && user.weight + ' kg'], ['Thời gian rảnh', user.availability]].filter((x) => x[1]).map(([k, v]) => h('span', { class: 'fact' }, h('b', {}, k), v))),
        user.interests && user.interests.length > 0 && h('div', { class: 'facts' }, h('b', { class: 'muted', style: 'font-size:14px;align-self:center' }, 'Sở thích:'), user.interests.map((t) => h('span', { class: 'fact tag' }, t))),
        user.lookingFor && h('p', { style: 'margin-top:10px;max-width:560px;font-size:15px' }, h('b', { style: 'color:#ffb3cd' }, 'Kiểu người mong muốn: '), user.lookingFor),
        user.boundaries && h('p', { class: 'muted', style: 'margin-top:10px;max-width:560px;font-size:14px' }, h('b', {}, 'Điều không muốn: '), user.boundaries)),
      !me ? h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: () => startChat(user), html: icon('send') + 'Nhắn tin' }),
        h('button', { class: 'btn', onclick: () => openCall(user), html: icon('phone') + 'Gọi' }),
        h('button', { class: 'btn', onclick: () => startVideoCall(user), html: icon('video') + 'Gọi video' }),
        h('button', { class: 'btn', onclick: () => openBook(user), html: icon('cal') + 'Hẹn gặp' }),
        h('button', { class: 'iconbtn', 'aria-label': 'Báo cáo', onclick: () => openReport('user', user.id), html: icon('flag') })) : h('a', { class: 'btn', href: '#/me' }, 'Sửa hồ sơ')),
    h('h3', { style: 'margin:8px 0 16px' }, 'Video'),
    videos.length ? h('div', { class: 'grid g4' }, videos.map((v) => {
      const c = vthumb(v);
      if (me) c.append(h('button', { class: 'iconbtn', style: 'position:absolute;top:44px;right:10px;width:36px;height:36px;background:rgba(0,0,0,.6)', 'aria-label': 'Xoá video', html: icon('trash'), onclick: async (e) => { e.preventDefault(); e.stopPropagation(); if (!confirm('Xoá video này?')) return; try { await api('/videos/' + v.id, { method: 'DELETE' }); route(); } catch (er) { fail(er); } } }));
      return c;
    })) : h('div', { class: 'card empty' }, h('p', {}, 'Chưa có video.')));
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

function openInfo(v) {
  const i = v.info || {};
  const rows = [
    ['Khu vực', [v.district, v.province, REGION_NAMES[v.region]].filter(Boolean).join(', ')],
    ['Lượt xem', fmtCount(v.views || 0)],
    ['Năm sinh', i.birthYear], ['Chiều cao', i.height && i.height + ' cm'], ['Cân nặng', i.weight && i.weight + ' kg'],
    ['Xuất xứ', i.origin], ['Nghề nghiệp', i.occupation], ['Địa chỉ', i.address], ['Thời gian rảnh', i.workTime],
  ].filter((r) => r[1]);
  const body = h('div', {}, h('h3', {}, v.user.name), (v.caption ? h('p', { class: 'sub', translate: 'no' }, v.caption) : h('p', { class: 'sub' }, 'Thông tin giới thiệu')),
    h('dl', { class: 'info-list' }, rows.map(([k, val]) => h('div', {}, h('dt', {}, k), h('dd', {}, String(val))))),
    i.interests && i.interests.length > 0 && h('div', { class: 'facts', style: 'margin:12px 0' }, i.interests.map((t) => h('span', { class: 'fact tag' }, t))),
    i.boundaries && h('p', { class: 'muted', style: 'font-size:14px;margin-bottom:12px' }, h('b', {}, 'Điều không muốn: '), i.boundaries),
    !rows.length && !i.boundaries && h('p', { class: 'muted' }, 'Người đăng chưa điền thêm thông tin.'),
    h('div', { class: 'row', style: 'margin-top:14px' },
      h('button', { class: 'btn primary', onclick: () => startChat(v.user), html: icon('send') + 'Nhắn tin' }),
      h('button', { class: 'btn', onclick: () => startVideoCall(v.user), html: icon('video') + 'Gọi video' }),
      v.hasPhone && h('button', { class: 'btn', onclick: () => openCall({ ...v.user, canCall: true }, v.id), html: icon('phone') + 'Gọi' }),
      h('button', { class: 'btn', onclick: () => openBook(v.user, v.id), html: icon('cal') + 'Hẹn gặp' })));
  modal(body, { sheet: true });
}

async function pageRegions(reg, prov, dist) {
  const [geo, { areas }] = await Promise.all([loadGeo(), api('/areas')]);
  const sum = (f) => areas.filter(f).reduce((n, x) => n + x.n, 0);
  const enc = encodeURIComponent;
  const crumb = [h('a', { href: '#/regions' }, 'Khu vực')];
  if (reg && geo[reg]) crumb.push(h('span', {}, ' › '), h('a', { href: '#/regions/' + reg }, REGION_NAMES[reg]));
  if (prov) crumb.push(h('span', {}, ' › '), h('a', { href: `#/regions/${reg}/${enc(prov)}` }, prov));
  if (dist) crumb.push(h('span', {}, ' › '), h('span', {}, dist));
  const wrap = h('div', { class: 'wrap', style: 'padding:28px 0' }, h('p', { class: 'crumbs' }, crumb));
  if (!reg || !geo[reg]) {
    wrap.append(h('h2', { class: 'title', style: 'margin-bottom:20px' }, 'Chọn khu vực'),
      h('div', { class: 'grid g3' }, Object.keys(REGION_NAMES).map((k) => h('a', { class: 'card region-card ' + k, href: '#/regions/' + k },
        h('h3', {}, REGION_NAMES[k]), h('p', { class: 'muted' }, geo[k].length + ' tỉnh / thành phố'), h('span', { class: 'status st-accepted' }, sum((x) => x.region === k) + ' video')))));
  } else if (!prov) {
    const filter = h('input', { placeholder: 'Tìm tỉnh / thành phố…', 'aria-label': 'Tìm tỉnh' });
    const grid = h('div', { class: 'grid g4 prov-grid' });
    const draw = () => {
      const q = filter.value.trim().toLowerCase(); grid.replaceChildren();
      geo[reg].filter((p) => p[0].toLowerCase().includes(q)).forEach(([name, ds]) => {
        const n = sum((x) => x.region === reg && x.province === name);
        grid.append(h('a', { class: 'card prov-card' + (n ? ' has' : ''), href: `#/regions/${reg}/${enc(name)}` }, h('b', {}, name), h('span', { class: 'muted' }, ds.length + ' quận/huyện'), n > 0 && h('span', { class: 'badge', style: 'margin:0' }, n)));
      });
    };
    filter.addEventListener('input', draw); draw();
    wrap.append(h('h2', { class: 'title', style: 'margin-bottom:16px' }, REGION_NAMES[reg]), h('div', { class: 'filters' }, filter), grid);
  } else {
    const p = geo[reg].find((x) => x[0] === prov);
    if (!p) { wrap.append(h('div', { class: 'empty' }, h('h3', {}, 'Không tìm thấy khu vực'))); main.append(wrap); return; }
    const chips = h('div', { class: 'ed-chips', style: 'margin:14px 0 24px' }, h('a', { class: 'chip' + (!dist ? ' on' : ''), href: `#/regions/${reg}/${enc(prov)}` }, 'Tất cả'),
      p[1].map((d) => { const n = sum((x) => x.province === prov && x.district === d); return h('a', { class: 'chip' + (dist === d ? ' on' : ''), href: `#/regions/${reg}/${enc(prov)}/${enc(d)}` }, d, n > 0 && h('span', { class: 'badge', style: 'margin:0 0 0 4px' }, n)); }));
    const grid = h('div', { class: 'grid g4' }, h('div', { class: 'spin' }));
    wrap.append(h('h2', { class: 'title' }, dist || prov), chips, grid);
    const q = `/videos?limit=48&region=${reg}&province=${enc(prov)}` + (dist ? '&district=' + enc(dist) : '');
    api(q).then(({ videos }) => {
      grid.replaceChildren();
      if (!videos.length) grid.append(h('div', { class: 'card empty', style: 'grid-column:1/-1' }, h('div', { class: 'ico', html: icon('video') }), h('h3', {}, 'Chưa có video ở khu vực này'), h('p', {}, 'Hãy là người đầu tiên đăng video tại đây.'), h('a', { class: 'btn primary', style: 'margin-top:12px', href: '#/upload' }, 'Đăng video')));
      videos.forEach((v) => grid.append(vthumb(v)));
    }).catch(fail);
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
    field('Sở thích', 'interests', { value: (me.interests || []).join(', '), maxlength: 240, placeholder: 'du lịch, cà phê, yoga' }),
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
async function pageAdmin() {
  if (!S.user || S.user.role !== 'admin') { location.hash = '#/'; return; }
  const { reports } = await api('/admin/reports');
  const rows = reports.map((r) => h('tr', {}, h('td', {}, '#' + r.id), h('td', {}, r.target_type + ' #' + r.target_id), h('td', {}, r.reason), h('td', {}, r.reporter),
    h('td', {}, h('div', { class: 'row' },
      r.target_type === 'video' && h('button', { class: 'btn sm', onclick: async () => { await api('/admin/videos/' + r.target_id + '/hide', { method: 'POST' }); toast('Đã ẩn'); } }, 'Ẩn video'),
      r.target_type === 'user' && h('button', { class: 'btn sm', onclick: async () => { if (confirm('Khoá người dùng này?')) { await api('/admin/users/' + r.target_id + '/ban', { method: 'POST' }); toast('Đã khoá'); } } }, 'Khoá user'),
      h('button', { class: 'btn sm primary', onclick: async () => { await api('/admin/reports/' + r.id + '/resolve', { method: 'POST' }); route(); } }, 'Xong')))));
  main.append(h('div', { class: 'wrap', style: 'padding:32px 0' }, h('h2', { class: 'title', style: 'margin-bottom:20px' }, 'Báo cáo chờ xử lý'),
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
  const [path, query] = (location.hash.slice(1) || '/').split('?');
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
  connectEvents();
  window.addEventListener('hashchange', route);
  route();
})();
})();
