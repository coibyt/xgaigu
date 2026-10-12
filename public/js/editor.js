/* xgaigu – in-browser video editor.
 * Plays the source clips onto a <canvas> (trim, speed, transitions, text/emoji, fireworks, blink…),
 * mixes original audio + music with WebAudio, and records the result with MediaRecorder.
 * Nothing is uploaded until the user presses "Dùng video này". */
(() => {
'use strict';

const MAX_TOTAL = 90; // seconds of output
const FONT = "'Be Vietnam Pro', system-ui, sans-serif";
const EMOJI = ['❤️', '😍', '😘', '🥰', '😉', '🔥', '✨', '💋', '💖', '🌹', '🎉', '🥂', '😎', '🤗', '💃', '🕺', '🍷', '☕', '🌙', '⭐', '👍', '💕', '🎶', '🦋'];
const TRANS = [['none', 'Không'], ['fade', 'Mờ dần'], ['zoom', 'Phóng to'], ['slide', 'Trượt'], ['wipe', 'Quét màu'], ['flash', 'Chớp sáng']];
const FX = [['fireworks', '🎆 Pháo hoa'], ['blink', '⚡ Nhấp nháy'], ['disco', '🌈 Disco'], ['hearts', '💗 Tim bay'], ['sparkle', '✨ Lấp lánh']];
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];

const ICONS = {
  scissors: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12',
  music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  type: 'M4 7V4h16v3M9 20h6M12 4v16',
  wand: 'M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5',
  film: 'M2 4h20v16H2zM7 4v16M17 4v16M2 12h20M2 8h5M2 16h5M17 8h5M17 16h5',
  play: 'M5 3l14 9-14 9z',
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  plus: 'M12 5v14M5 12h14',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M19 12l-7 7-7-7',
};
const ico = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;
const fmt = (t) => { t = Math.max(0, t); const m = Math.floor(t / 60); return m + ':' + (t - m * 60).toFixed(1).padStart(4, '0'); };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function supported() {
  return !!(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream && (window.AudioContext || window.webkitAudioContext));
}
function pickMime() {
  const list = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4'];
  return list.find((m) => MediaRecorder.isTypeSupported(m)) || '';
}

function createEditor(files, { onDone, onCancel }) {
  const { h, toast } = window.XG;
  const mobile = innerWidth < 760;
  const W = mobile ? 540 : 720, H = mobile ? 960 : 1280;

  const S = {
    clips: [], sel: 0, fit: 'cover',
    music: null, musicStart: 0, musicVol: 0.8, vidVol: 1,
    overlays: [], selOv: -1, effects: [],
    trans: { type: 'fade', dur: 0.6 },
    t: 0, run: null, particles: [], lastTs: 0, nextBurst: 0, nextHeart: 0, nextSpark: 0, uid: 1,
  };

  // ---------- canvas ----------
  const canvas = h('canvas', { width: W, height: H, class: 'ed-canvas', 'aria-label': 'Xem trước video' });
  const g = canvas.getContext('2d');

  // ---------- audio ----------
  let actx = null, outGain = null, dest = null, vidGain = null, musGain = null, routed = null;
  function ensureAudio() {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      outGain = actx.createGain(); vidGain = actx.createGain(); musGain = actx.createGain();
      vidGain.connect(outGain); musGain.connect(outGain);
      dest = actx.createMediaStreamDestination();
    }
    for (const c of S.clips) if (c.v && !c.node) { c.node = actx.createMediaElementSource(c.v); c.node.connect(vidGain); }
    if (S.music && !S.music.node) { S.music.node = actx.createMediaElementSource(S.music.el); S.music.node.connect(musGain); }
    vidGain.gain.value = S.vidVol; musGain.gain.value = S.musicVol;
  }
  function route(mode) {
    if (routed) { try { outGain.disconnect(routed); } catch {} }
    routed = mode === 'export' ? dest : actx.destination;
    outGain.connect(routed);
  }

  // ---------- clips ----------
  function loadMeta(v) {
    return new Promise((res, rej) => {
      const done = () => { v.removeEventListener('error', fail); res(); };
      const fail = () => rej(new Error('Không đọc được video này'));
      v.addEventListener('error', fail, { once: true });
      v.addEventListener('loadedmetadata', () => {
        if (isFinite(v.duration)) return done();
        v.currentTime = 1e9; v.addEventListener('timeupdate', () => { v.currentTime = 0; done(); }, { once: true });
      }, { once: true });
    });
  }
  async function addClip(file) {
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
      const img = new Image();
      try { await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; }); } catch { URL.revokeObjectURL(url); throw new Error('Không đọc được ảnh này'); }
      const clip = { id: S.uid++, file, url, img, v: null, dur: 15, start: 0, end: 3, speed: 1, kb: true, node: null };
      S.clips.push(clip); S.sel = S.clips.length - 1;
      return clip;
    }
    const v = document.createElement('video');
    v.src = url; v.playsInline = true; v.preload = 'auto'; v.muted = false;
    await loadMeta(v);
    const clip = { id: S.uid++, file, url, v, dur: v.duration, start: 0, end: Math.min(v.duration, 30), speed: 1, node: null };
    S.clips.push(clip); S.sel = S.clips.length - 1;
    return clip;
  }
  const outDur = (c) => (c.end - c.start) / c.speed;
  const totalDur = () => S.clips.reduce((a, c) => a + outDur(c), 0);
  function segs() { let t = 0; return S.clips.map((clip, i) => { const s = { clip, i, startOut: t, outDur: outDur(clip) }; t += s.outDur; return s; }); }

  // ---------- drawing ----------
  const seek = (v, t) => new Promise((res) => {
    if (Math.abs(v.currentTime - t) < 0.02) return res();
    const f = () => { v.removeEventListener('seeked', f); res(); };
    v.addEventListener('seeked', f); v.currentTime = t;
    setTimeout(res, 1500);
  });

  function drawVideo(v, kb = 1) {
    const vw = v.naturalWidth || v.videoWidth, vh = v.naturalHeight || v.videoHeight;
    if (!vw || !vh) return;
    const cover = Math.max(W / vw, H / vh) * kb, contain = Math.min(W / vw, H / vh) * kb;
    if (S.fit === 'contain') {
      if ('filter' in g) { g.filter = 'blur(28px) brightness(.55)'; g.drawImage(v, (W - vw * cover) / 2, (H - vh * cover) / 2, vw * cover, vh * cover); g.filter = 'none'; }
      g.drawImage(v, (W - vw * contain) / 2, (H - vh * contain) / 2, vw * contain, vh * contain);
    } else g.drawImage(v, (W - vw * cover) / 2, (H - vh * cover) / 2, vw * cover, vh * cover);
  }

  function transitionP(t, seg) {
    if (S.trans.type === 'none' || !seg) return null;
    const d = S.trans.dur, half = d / 2, local = t - seg.startOut, remain = seg.outDur - local;
    if (local < half) return 0.5 + local / d;
    if (remain < half) return (half - remain) / d;
    return null;
  }

  function spawn(type, t) {
    const P = S.particles;
    if (type === 'fireworks') {
      const x = W * (0.15 + 0.7 * Math.random()), y = H * (0.12 + 0.38 * Math.random()), hue = Math.random() * 360;
      for (let i = 0; i < 56; i++) {
        const a = (i / 56) * Math.PI * 2 + Math.random() * 0.2, sp = (130 + Math.random() * 260) * (W / 720);
        P.push({ k: 'fw', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 1.1 + Math.random() * 0.8, c: `hsl(${hue + Math.random() * 40},100%,${60 + Math.random() * 15}%)`, s: 2.5 * (W / 720) });
      }
    } else if (type === 'hearts') {
      P.push({ k: 'heart', x: Math.random() * W, y: H + 30, vx: (Math.random() - 0.5) * 40, vy: -(120 + Math.random() * 160) * (H / 1280), life: 0, max: 5, ph: Math.random() * 6, s: (22 + Math.random() * 34) * (W / 720), c: ['#ff2e7e', '#ff6b9a', '#ff8ab4', '#fff'][Math.floor(Math.random() * 4)] });
    } else if (type === 'sparkle') {
      P.push({ k: 'spark', x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, life: 0, max: 0.5 + Math.random() * 0.7, s: (8 + Math.random() * 18) * (W / 720), c: '#fff' });
    }
  }

  function updateFx(t, dt) {
    const active = (type) => S.effects.some((e) => e.type === type && t >= e.from && t <= e.to);
    if (active('fireworks') && t >= S.nextBurst) { spawn('fireworks', t); S.nextBurst = t + 0.55 + Math.random() * 0.6; }
    if (active('hearts') && t >= S.nextHeart) { spawn('hearts', t); S.nextHeart = t + 0.16; }
    if (active('sparkle') && t >= S.nextSpark) { for (let i = 0; i < 3; i++) spawn('sparkle', t); S.nextSpark = t + 0.1; }
    for (const p of S.particles) {
      p.life += dt;
      if (p.k === 'fw') { p.vy += 260 * dt * (H / 1280); p.vx *= 0.985; p.vy *= 0.985; }
      if (p.k === 'heart') p.vx = Math.sin(p.life * 2 + p.ph) * 40;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    S.particles = S.particles.filter((p) => p.life < p.max);
  }

  function star(x, y, r) {
    g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r);
    g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill();
  }

  function drawFx(t) {
    g.save();
    for (const e of S.effects) {
      if (t < e.from || t > e.to) continue;
      if (e.type === 'blink') { if (Math.floor(t * 5) % 2 === 0) { g.fillStyle = 'rgba(255,255,255,.32)'; g.fillRect(0, 0, W, H); } }
      if (e.type === 'disco') { g.globalCompositeOperation = 'screen'; g.fillStyle = `hsla(${(t * 720) % 360},100%,55%,${Math.floor(t * 6) % 2 ? 0.34 : 0.14})`; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
    }
    g.globalCompositeOperation = 'lighter';
    for (const p of S.particles) {
      const a = clamp(1 - p.life / p.max, 0, 1);
      if (p.k === 'fw') { g.globalAlpha = a; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.s * (0.6 + a), 0, 6.3); g.fill(); }
      else if (p.k === 'spark') { g.globalAlpha = Math.sin((p.life / p.max) * Math.PI); g.fillStyle = p.c; star(p.x, p.y, p.s); }
    }
    g.globalCompositeOperation = 'source-over';
    for (const p of S.particles) if (p.k === 'heart') {
      g.globalAlpha = clamp(Math.min(1, (p.max - p.life) / 1.2), 0, 1) * 0.95; g.fillStyle = p.c;
      g.font = `${p.s}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♥', p.x, p.y);
    }
    g.restore();
  }

  function overlayFont(o) { return `${o.kind === 'emoji' ? 600 : 800} ${(o.size / 100) * W}px ${FONT}`; }
  function overlayBox(o) {
    g.font = overlayFont(o);
    const lines = o.text.split('\n'), fs = (o.size / 100) * W;
    const w = Math.max(...lines.map((l) => g.measureText(l).width)), hh = fs * 1.2 * lines.length;
    return { x: o.x * W - w / 2, y: o.y * H - hh / 2, w, h: hh, fs, lines };
  }
  function drawOverlays(t) {
    S.overlays.forEach((o, idx) => {
      if (t < o.from || t > o.to) return;
      const b = overlayBox(o);
      let sc = 1, dy = 0, alpha = 1;
      const age = t - o.from;
      if (age < 0.3) sc *= 0.4 + 0.6 * (1 - Math.pow(1 - age / 0.3, 3)) + (age / 0.3) * 0.1; // pop-in
      if (o.anim === 'pulse') sc *= 1 + 0.1 * Math.sin(t * 7);
      if (o.anim === 'bounce') dy = -Math.abs(Math.sin(t * 5)) * H * 0.025;
      if (o.anim === 'blink') alpha = Math.floor(t * 4) % 2 ? 0.2 : 1;
      g.save();
      g.translate(o.x * W, o.y * H + dy); g.scale(sc, sc); g.globalAlpha = alpha;
      g.font = overlayFont(o); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineJoin = 'round'; g.lineWidth = b.fs * 0.14; g.strokeStyle = 'rgba(0,0,0,.65)'; g.fillStyle = o.color;
      b.lines.forEach((l, i) => {
        const y = (i - (b.lines.length - 1) / 2) * b.fs * 1.2;
        if (o.kind === 'text') g.strokeText(l, 0, y);
        g.fillText(l, 0, y);
      });
      g.restore();
      if (!S.run && idx === S.selOv) { g.save(); g.strokeStyle = '#fff'; g.setLineDash([10, 8]); g.lineWidth = 3; g.strokeRect(b.x - 10, b.y - 6, b.w + 20, b.h + 12); g.restore(); }
    });
  }

  function render(t, seg) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const sg = seg || segs().find((s) => t >= s.startOut && t <= s.startOut + s.outDur + 0.001) || segs()[0];
    if (!sg) return;
    const p = transitionP(t, sg), type = S.trans.type;
    g.save();
    if (p !== null) {
      const s = Math.sin(Math.PI * p);
      if (type === 'zoom') { const k = 1 + 0.4 * s; g.translate(W / 2, H / 2); g.scale(k, k); g.translate(-W / 2, -H / 2); }
      if (type === 'slide') g.translate(p < 0.5 ? -p * 2 * W : (2 - 2 * p) * W, 0);
    }
    drawVideo(sg.clip.img || sg.clip.v, sg.clip.img && sg.clip.kb ? 1 + 0.12 * clamp((t - sg.startOut) / Math.max(0.1, sg.outDur), 0, 1) : 1);
    g.restore();
    if (p !== null) {
      const s = Math.sin(Math.PI * p);
      if (type === 'fade') { g.fillStyle = `rgba(0,0,0,${s})`; g.fillRect(0, 0, W, H); }
      if (type === 'zoom') { g.fillStyle = `rgba(255,255,255,${0.6 * s * s})`; g.fillRect(0, 0, W, H); }
      if (type === 'flash') { g.fillStyle = `rgba(255,255,255,${s})`; g.fillRect(0, 0, W, H); }
      if (type === 'wipe') {
        const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#ff2e7e'); gr.addColorStop(1, '#ff6b4a');
        g.fillStyle = gr;
        if (p < 0.5) g.fillRect(0, 0, p * 2 * W, H); else g.fillRect((2 * p - 1) * W, 0, W - (2 * p - 1) * W, H);
      }
    }
    drawFx(t);
    drawOverlays(t);
  }

  // ---------- playback / export ----------
  const ui = {};
  function idleRender() { if (!S.run) requestAnimationFrame(() => !S.run && render(S.t)); }

  async function seekTimeline(t) {
    t = clamp(t, 0, Math.max(0, totalDur() - 0.01)); S.t = t;
    const sg = segs().find((s) => t >= s.startOut && t < s.startOut + s.outDur) || segs()[0];
    if (sg && sg.clip.v) { await seek(sg.clip.v, sg.clip.start + (t - sg.startOut) * sg.clip.speed); }
    S.particles = []; render(t, sg); syncTransport();
  }

  async function play(mode) {
    if (S.run) return;
    const all = segs(); if (!all.length) return;
    ensureAudio(); await actx.resume(); route(mode);
    const total = totalDur();
    let from = mode === 'export' || S.t >= total - 0.1 ? 0 : S.t;
    const run = (S.run = { mode, stop: false });
    S.particles = []; S.nextBurst = from; syncTransport();
    let rec = null; const chunks = [];
    if (mode === 'export') {
      const stream = canvas.captureStream(30);
      dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
      const mime = pickMime();
      rec = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: mobile ? 2_200_000 : 3_500_000, audioBitsPerSecond: 128_000 });
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.start(500); run.mime = mime;
    }
    const startIdx = Math.max(0, all.findIndex((s) => from >= s.startOut && from < s.startOut + s.outDur));
    if (S.music) {
      S.music.el.loop = true; S.music.el.currentTime = S.musicStart + from; S.music.el.play().catch(() => {});
    }
    for (let i = startIdx; i < all.length && !run.stop; i++) {
      const sg = all[i], v = sg.clip.v;
      if (sg.clip.img) { // photo: timed by the wall clock
        const nx = all[i + 1]; if (nx && nx.clip.v) { nx.clip.v.pause(); seek(nx.clip.v, nx.clip.start); }
        const t0 = performance.now() - (i === startIdx ? (from - sg.startOut) * 1000 : 0);
        await new Promise((res) => {
          S.lastTs = performance.now();
          const frame = (ts) => {
            if (run.stop) return res();
            const dt = Math.min(0.1, (ts - S.lastTs) / 1000); S.lastTs = ts;
            const local = (performance.now() - t0) / 1000, t = sg.startOut + local;
            S.t = t; updateFx(t, dt); render(t, sg); syncTransport();
            if (local >= sg.outDur) return res();
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
        continue;
      }
      v.playbackRate = sg.clip.speed;
      await seek(v, sg.clip.start + (i === startIdx ? (from - sg.startOut) * sg.clip.speed : 0));
      if (run.stop) break;
      try { await v.play(); } catch {}
      const next = all[i + 1]; if (next && next.clip.v) { next.clip.v.pause(); seek(next.clip.v, next.clip.start); }
      await new Promise((res) => {
        S.lastTs = performance.now();
        const frame = (ts) => {
          if (run.stop) return res();
          const dt = Math.min(0.1, (ts - S.lastTs) / 1000); S.lastTs = ts;
          const t = sg.startOut + Math.max(0, (v.currentTime - sg.clip.start) / sg.clip.speed);
          S.t = t; updateFx(t, dt); render(t, sg); syncTransport();
          if (v.currentTime >= sg.clip.end - 0.04 || v.ended) return res();
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      v.pause();
    }
    const stopped = run.stop;
    if (S.music) S.music.el.pause();
    S.clips.forEach((c) => c.v && c.v.pause());
    S.run = null; syncTransport();
    if (mode === 'export') {
      await new Promise((res) => { rec.onstop = res; try { rec.stop(); } catch { res(); } });
      route('preview');
      if (stopped) return null;
      const type = run.mime && run.mime.startsWith('video/mp4') ? 'video/mp4' : 'video/webm';
      return new File([new Blob(chunks, { type })], 'xgaigu-edit' + (type === 'video/mp4' ? '.mp4' : '.webm'), { type });
    }
    return null;
  }
  const stop = () => { if (S.run) S.run.stop = true; };

  // ---------- UI ----------
  const playBtn = h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Phát / dừng', html: ico('play'), onclick: () => (S.run ? stop() : play('preview')) });
  const scrub = h('input', { type: 'range', min: 0, max: 1, step: 0.01, value: 0, 'aria-label': 'Thanh thời gian', oninput: () => { stop(); seekTimeline(+scrub.value); } });
  const timeLbl = h('span', { class: 'muted ed-time' }, '0:00.0 / 0:00.0');
  function syncTransport() {
    const total = totalDur();
    scrub.max = String(Math.max(0.1, total)); if (!S.run || document.activeElement !== scrub) scrub.value = String(S.t);
    timeLbl.textContent = fmt(S.t) + ' / ' + fmt(total);
    playBtn.innerHTML = ico(S.run && S.run.mode === 'preview' ? 'pause' : 'play');
    if (ui.total) { ui.total.textContent = 'Độ dài video: ' + fmt(total); ui.total.classList.toggle('over', total > MAX_TOTAL); }
    if (ui.export) ui.export.disabled = !!S.run || total > MAX_TOTAL || !S.clips.length;
  }

  // drag overlays on canvas
  let drag = null;
  const toCanvas = (e) => { const r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; };
  canvas.addEventListener('pointerdown', (e) => {
    if (S.run) return;
    const p = toCanvas(e);
    for (let i = S.overlays.length - 1; i >= 0; i--) {
      const o = S.overlays[i]; if (S.t < o.from || S.t > o.to) continue;
      const b = overlayBox(o);
      if (p.x >= b.x - 14 && p.x <= b.x + b.w + 14 && p.y >= b.y - 10 && p.y <= b.y + b.h + 10) {
        S.selOv = i; drag = { i, dx: o.x * W - p.x, dy: o.y * H - p.y }; canvas.setPointerCapture(e.pointerId); showTab('text'); idleRender(); return;
      }
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return; const p = toCanvas(e), o = S.overlays[drag.i];
    o.x = clamp((p.x + drag.dx) / W, 0.03, 0.97); o.y = clamp((p.y + drag.dy) / H, 0.03, 0.97); idleRender();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);

  // ----- tabs -----
  const tabsDef = [['cut', 'scissors', 'Cắt & tốc độ'], ['music', 'music', 'Nhạc'], ['text', 'type', 'Chữ & icon'], ['fx', 'wand', 'Hiệu ứng'], ['trans', 'film', 'Chuyển cảnh']];
  const panel = h('div', { class: 'ed-panel' });
  const tabBar = h('div', { class: 'ed-tabs', role: 'tablist' });
  let tab = 'cut';
  function showTab(name) {
    tab = name;
    tabBar.querySelectorAll('button').forEach((b) => { b.classList.toggle('on', b.dataset.t === name); b.setAttribute('aria-selected', String(b.dataset.t === name)); });
    panel.replaceChildren(({ cut: panelCut, music: panelMusic, text: panelText, fx: panelFx, trans: panelTrans })[name]());
  }
  tabsDef.forEach(([k, ic, label]) => tabBar.append(h('button', { type: 'button', role: 'tab', 'data-t': k, onclick: () => showTab(k), html: ico(ic) + '<span>' + label + '</span>' })));

  const slider = (label, min, max, step, value, oninput, fmtFn = (v) => v) => {
    const out = h('b', {}, fmtFn(value));
    const inp = h('input', { type: 'range', min, max, step, value, oninput: () => { out.textContent = fmtFn(+inp.value); oninput(+inp.value, inp); } });
    return h('label', { class: 'ed-row' }, h('span', {}, label, out), inp);
  };

  function panelCut() {
    const box = h('div', {});
    const list = h('div', { class: 'ed-chips' });
    S.clips.forEach((c, i) => list.append(h('button', { type: 'button', class: 'chip' + (i === S.sel ? ' on' : ''), onclick: async () => { S.sel = i; S.t = segs()[i].startOut; await seekTimeline(S.t); showTab('cut'); } }, (c.img ? 'Ảnh ' : 'Clip ') + (i + 1) + ' · ' + fmt(outDur(c)))));
    const fileIn = h('input', { type: 'file', accept: 'video/*,image/*', multiple: true, class: 'sr', id: 'ed-add' });
    fileIn.addEventListener('change', async () => {
      try { for (const f of fileIn.files) await addClip(f); ensureAudio(); showTab('cut'); await seekTimeline(segs()[S.sel].startOut); toast('Đã thêm clip'); } catch (e) { toast(e.message, true); }
    });
    list.append(h('label', { class: 'chip add', for: 'ed-add', html: ico('plus') + ' Thêm ảnh / video' }), fileIn);
    box.append(list);
    const c = S.clips[S.sel];
    if (c) {
      const sg = () => segs()[S.sel];
      if (!c.img) box.append(
        slider('Bắt đầu cắt', 0, c.dur, 0.1, c.start, async (v, inp) => { c.start = Math.min(v, c.end - 0.3); inp.value = c.start; await seekTimeline(sg().startOut); syncTransport(); }, fmt),
        slider('Kết thúc cắt', 0, c.dur, 0.1, c.end, async (v, inp) => { c.end = Math.max(v, c.start + 0.3); inp.value = c.end; await seekTimeline(Math.max(sg().startOut, sg().startOut + sg().outDur - 0.1)); syncTransport(); }, fmt));
      const sp = h('div', { class: 'ed-chips' });
      SPEEDS.forEach((s) => sp.append(h('button', { type: 'button', class: 'chip' + (c.speed === s ? ' on' : ''), onclick: () => { c.speed = s; showTab('cut'); syncTransport(); } }, s + '×')));
      if (c.img) box.append(
        slider('Thời gian hiển thị ảnh này', 1, 15, 0.5, c.end, (v) => { c.end = v; syncTransport(); idleRender(); }, (v) => v + 's'),
        h('div', { class: 'ed-chips' }, h('button', { type: 'button', class: 'chip' + (c.kb ? ' on' : ''), onclick: () => { c.kb = !c.kb; showTab('cut'); idleRender(); } }, 'Phóng to nhẹ khi chiếu: ' + (c.kb ? 'Bật' : 'Tắt'))));
      else box.append(h('div', { class: 'ed-label' }, 'Tốc độ phát (', h('span', { class: 'muted' }, '0.25× = chậm, 3× = nhanh'), ')'), sp);
      const mv = h('div', { class: 'row', style: 'margin-top:12px' },
        S.clips.length > 1 && h('button', { type: 'button', class: 'btn sm', html: ico('up') + 'Lên', onclick: () => { if (S.sel > 0) { [S.clips[S.sel - 1], S.clips[S.sel]] = [S.clips[S.sel], S.clips[S.sel - 1]]; S.sel--; showTab('cut'); syncTransport(); } } }),
        S.clips.length > 1 && h('button', { type: 'button', class: 'btn sm', html: ico('down') + 'Xuống', onclick: () => { if (S.sel < S.clips.length - 1) { [S.clips[S.sel + 1], S.clips[S.sel]] = [S.clips[S.sel], S.clips[S.sel + 1]]; S.sel++; showTab('cut'); syncTransport(); } } }),
        S.clips.length > 1 && h('button', { type: 'button', class: 'btn sm', html: ico('trash') + 'Xoá clip', onclick: () => { const [r] = S.clips.splice(S.sel, 1); URL.revokeObjectURL(r.url); S.sel = 0; showTab('cut'); seekTimeline(0); } }));
      box.append(mv);
    }
    const fit = h('div', { class: 'ed-chips', style: 'margin-top:14px' },
      [['cover', 'Lấp đầy khung'], ['contain', 'Vừa khung + nền mờ']].map(([k, l]) => h('button', { type: 'button', class: 'chip' + (S.fit === k ? ' on' : ''), onclick: () => { S.fit = k; showTab('cut'); idleRender(); } }, l)));
    box.append(h('div', { class: 'ed-label' }, 'Cách hiển thị video'), fit);
    return box;
  }

  function panelMusic() {
    const box = h('div', {});
    const f = h('input', { type: 'file', accept: 'audio/*', class: 'sr', id: 'ed-music' });
    f.addEventListener('change', () => {
      const file = f.files[0]; if (!file) return;
      if (S.music) { S.music.el.pause(); URL.revokeObjectURL(S.music.url); S.music = null; }
      const url = URL.createObjectURL(file), el = new Audio(url); el.preload = 'auto';
      S.music = { file, url, el, node: null }; S.musicStart = 0;
      el.addEventListener('loadedmetadata', () => { S.music.dur = el.duration; showTab('music'); });
      ensureAudio(); showTab('music');
    });
    box.append(h('p', { class: 'muted', style: 'font-size:14px;margin-bottom:12px' }, 'Chọn file nhạc từ máy của bạn (MP3, M4A, WAV…). Chỉ dùng nhạc bạn có quyền sử dụng.'),
      h('label', { class: 'btn', for: 'ed-music', html: ico('music') + (S.music ? 'Đổi bài nhạc' : 'Chọn nhạc từ máy') }), f);
    if (S.music) {
      box.append(h('p', { style: 'margin:12px 0;font-weight:600;word-break:break-all' }, '🎵 ' + S.music.file.name),
        slider('Bắt đầu từ giây thứ', 0, Math.max(1, Math.floor((S.music.dur || 60) - 1)), 1, S.musicStart, (v) => { S.musicStart = v; }, (v) => v + 's'),
        slider('Âm lượng nhạc', 0, 1, 0.05, S.musicVol, (v) => { S.musicVol = v; if (musGain) musGain.gain.value = v; }, (v) => Math.round(v * 100) + '%'),
        h('button', { type: 'button', class: 'btn sm', style: 'margin-top:8px', html: ico('trash') + 'Gỡ nhạc', onclick: () => { S.music.el.pause(); S.music = null; showTab('music'); } }));
    }
    box.append(slider('Âm lượng tiếng gốc của video', 0, 1, 0.05, S.vidVol, (v) => { S.vidVol = v; if (vidGain) vidGain.gain.value = v; }, (v) => Math.round(v * 100) + '%'));
    return box;
  }

  function addOverlay(kind, text) {
    const total = totalDur();
    S.overlays.push({ kind, text, x: 0.5, y: kind === 'emoji' ? 0.4 : 0.75, size: kind === 'emoji' ? 16 : 8, color: '#ffffff', anim: 'none', from: 0, to: total });
    S.selOv = S.overlays.length - 1; showTab('text'); idleRender();
  }
  function panelText() {
    const box = h('div', {});
    const inp = h('input', { placeholder: 'Nhập chữ muốn chèn…', maxlength: 80, 'aria-label': 'Nội dung chữ' });
    const add = () => { if (inp.value.trim()) { addOverlay('text', inp.value.trim()); } else inp.focus(); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    box.append(h('div', { class: 'row', style: 'flex-wrap:nowrap' }, inp, h('button', { type: 'button', class: 'btn primary', onclick: add }, 'Thêm chữ')));
    const grid = h('div', { class: 'emoji-grid' });
    EMOJI.forEach((e) => grid.append(h('button', { type: 'button', 'aria-label': 'Chèn ' + e, onclick: () => addOverlay('emoji', e) }, e)));
    box.append(h('div', { class: 'ed-label' }, 'Chèn icon'), grid);
    const o = S.overlays[S.selOv];
    if (S.overlays.length) {
      const chips = h('div', { class: 'ed-chips', style: 'margin-top:14px' });
      S.overlays.forEach((x, i) => chips.append(h('button', { type: 'button', class: 'chip' + (i === S.selOv ? ' on' : ''), onclick: () => { S.selOv = i; showTab('text'); idleRender(); } }, x.text.length > 10 ? x.text.slice(0, 10) + '…' : x.text)));
      box.append(h('div', { class: 'ed-label' }, 'Các mục đã chèn (kéo trực tiếp trên video để di chuyển)'), chips);
    }
    if (o) {
      const total = totalDur();
      box.append(
        o.kind === 'text' && h('label', { class: 'ed-row' }, h('span', {}, 'Nội dung'), h('input', { value: o.text, maxlength: 80, oninput: (e) => { o.text = e.target.value || ' '; idleRender(); } })),
        o.kind === 'text' && h('label', { class: 'ed-row' }, h('span', {}, 'Màu chữ'), h('input', { type: 'color', value: o.color, style: 'height:46px;padding:4px', oninput: (e) => { o.color = e.target.value; idleRender(); } })),
        slider('Cỡ', 3, 30, 1, o.size, (v) => { o.size = v; idleRender(); }, (v) => v),
        h('label', { class: 'ed-row' }, h('span', {}, 'Chuyển động'), h('select', { onchange: (e) => { o.anim = e.target.value; } },
          [['none', 'Đứng yên'], ['pulse', 'Phập phồng'], ['bounce', 'Nảy lên'], ['blink', 'Nhấp nháy']].map(([v, l]) => h('option', { value: v, selected: o.anim === v }, l)))),
        slider('Hiện từ giây', 0, total, 0.1, o.from, (v) => { o.from = Math.min(v, o.to - 0.2); idleRender(); }, fmt),
        slider('Ẩn ở giây', 0, total, 0.1, o.to, (v) => { o.to = Math.max(v, o.from + 0.2); idleRender(); }, fmt),
        h('button', { type: 'button', class: 'btn sm', html: ico('trash') + 'Xoá mục này', onclick: () => { S.overlays.splice(S.selOv, 1); S.selOv = S.overlays.length - 1; showTab('text'); idleRender(); } }));
    }
    return box;
  }

  function panelFx() {
    const box = h('div', {});
    const grid = h('div', { class: 'ed-chips' });
    FX.forEach(([k, l]) => grid.append(h('button', { type: 'button', class: 'chip', onclick: () => { S.effects.push({ id: S.uid++, type: k, from: 0, to: totalDur() }); showTab('fx'); } }, l)));
    box.append(h('p', { class: 'muted', style: 'font-size:14px;margin-bottom:10px' }, 'Bấm để thêm hiệu ứng, rồi chọn khoảng thời gian hiệu ứng xuất hiện.'), grid);
    S.effects.forEach((e) => {
      const total = totalDur(), label = FX.find((x) => x[0] === e.type)[1];
      box.append(h('div', { class: 'ed-fx' }, h('div', { class: 'row', style: 'justify-content:space-between;flex-wrap:nowrap' }, h('b', {}, label),
        h('button', { type: 'button', class: 'iconbtn', style: 'width:36px;height:36px', 'aria-label': 'Xoá hiệu ứng', html: ico('trash'), onclick: () => { S.effects = S.effects.filter((x) => x !== e); showTab('fx'); idleRender(); } })),
        slider('Từ giây', 0, total, 0.1, e.from, (v) => { e.from = Math.min(v, e.to - 0.2); }, fmt),
        slider('Đến giây', 0, total, 0.1, e.to, (v) => { e.to = Math.max(v, e.from + 0.2); }, fmt)));
    });
    box.append(h('button', { type: 'button', class: 'btn sm', style: 'margin-top:12px', onclick: () => { S.t = 0; seekTimeline(0).then(() => play('preview')); } }, 'Xem thử từ đầu'));
    return box;
  }

  function panelTrans() {
    const box = h('div', {});
    const grid = h('div', { class: 'ed-chips' });
    TRANS.forEach(([k, l]) => grid.append(h('button', { type: 'button', class: 'chip' + (S.trans.type === k ? ' on' : ''), onclick: () => { S.trans.type = k; showTab('trans'); } }, l)));
    box.append(h('p', { class: 'muted', style: 'font-size:14px;margin-bottom:10px' }, 'Hiệu ứng chuyển cảnh áp dụng giữa các clip và ở đầu/cuối video.'), grid,
      slider('Thời lượng chuyển cảnh', 0.3, 1.5, 0.1, S.trans.dur, (v) => { S.trans.dur = v; }, (v) => v.toFixed(1) + 's'),
      h('button', { type: 'button', class: 'btn sm', style: 'margin-top:12px', onclick: async () => { const s = segs()[Math.max(0, S.sel - (S.sel > 0 ? 1 : 0))]; await seekTimeline(Math.max(0, s.startOut + s.outDur - 1.2)); play('preview'); } }, 'Xem thử'));
    return box;
  }

  // ----- export bar -----
  const bar = h('div', { class: 'ed-progress', hidden: true }, h('i'));
  const status = h('p', { class: 'muted', style: 'font-size:13px;margin-top:8px' });
  ui.total = h('span', { class: 'ed-total' }, '');
  ui.export = h('button', { type: 'button', class: 'btn primary lg', style: 'flex:1', onclick: async () => {
    stop(); await seekTimeline(0);
    ui.export.disabled = true; bar.hidden = false; status.textContent = 'Đang xuất video… vui lòng giữ tab này ở phía trước, không chuyển sang ứng dụng khác.';
    const total = totalDur();
    const tick = setInterval(() => { bar.firstChild.style.width = clamp((S.t / total) * 100, 0, 100) + '%'; }, 200);
    try {
      const file = await play('export');
      clearInterval(tick); bar.firstChild.style.width = '100%';
      if (file) { status.textContent = 'Xong! ' + (file.size / 1048576).toFixed(1) + ' MB'; onDone(file); } else status.textContent = 'Đã dừng xuất video.';
    } catch (e) { clearInterval(tick); status.textContent = ''; toast('Xuất video thất bại: ' + e.message, true); }
    bar.hidden = true; syncTransport();
  } }, 'Xuất video & dùng để đăng');
  ui.stopBtn = h('button', { type: 'button', class: 'btn', onclick: () => { stop(); } }, 'Dừng');

  const el = h('section', { class: 'ed card', 'aria-label': 'Trình chỉnh sửa video' },
    h('div', { class: 'ed-main' },
      h('div', { class: 'ed-stage' }, canvas),
      h('div', { class: 'ed-transport' }, playBtn, scrub, timeLbl),
      ui.total),
    h('div', { class: 'ed-side' }, tabBar, panel,
      h('div', { class: 'row', style: 'margin-top:18px;flex-wrap:nowrap' }, ui.export, ui.stopBtn, h('button', { type: 'button', class: 'btn ghost', onclick: () => { stop(); destroy(); onCancel(); } }, 'Huỷ')),
      bar, status));

  function destroy() {
    stop();
    S.clips.forEach((c) => { c.v && c.v.pause(); URL.revokeObjectURL(c.url); });
    if (S.music) { S.music.el.pause(); URL.revokeObjectURL(S.music.url); }
    try { actx && actx.close(); } catch {}
    el.remove();
  }

  (async () => {
    try {
      for (const f of files) await addClip(f);
      S.sel = 0;
      ensureAudio(); showTab('cut'); await seekTimeline(0); syncTransport();
    } catch (e) { toast(e.message, true); destroy(); onCancel(); }
  })();

  return { el, destroy };
}

window.XGEditor = { createEditor, supported };
})();
