// Shrinks uploaded videos so they load fast on phones: H.264, index at the front of the file, one video at a time with a single
// ffmpeg thread (shared hosting friendly). The original is only replaced when the new file is clearly smaller and valid, so a
// failure never breaks a video.
// How much to shrink is set by the admin (settings key "video_compress"):
//   - big files are brought down to a share of their size (by default: over 20 MB -> 50 %, over 100 MB -> 40 %);
//   - smaller files (over 2 MB) are only re-encoded when they are heavier than what a phone needs;
//   - a quality level sets the lowest bitrate allowed, so a video always stays clear on a phone.
// Several server processes may run at once: a video is claimed before it is encoded and only one encode runs site-wide.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DEFAULTS = { enabled: true, autoNew: true, autoOld: false, tier1Mb: 20, tier1Pct: 50, tier2Mb: 100, tier2Pct: 40, maxSide: 720, quality: 'balanced' };
const QUALITY = { // lowest / highest video bitrate (kbit/s) and the CRF used for files below the first tier
  light: { floor: 320, cap: 1300, crf: 27 },
  balanced: { floor: 450, cap: 1800, crf: 24 },
  sharp: { floor: 700, cap: 2600, crf: 22 },
};
const LEVEL = 2; // opt_level written once a video went through these rules (older rules wrote optimized = 1 only)

function readSettings(raw) {
  let s = {}; try { s = JSON.parse(raw || '{}') || {}; } catch {}
  const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
  const out = {
    enabled: s.enabled !== false, autoNew: s.autoNew !== false, autoOld: !!s.autoOld,
    tier1Mb: num(s.tier1Mb, 3, 2000, DEFAULTS.tier1Mb), tier1Pct: num(s.tier1Pct, 10, 90, DEFAULTS.tier1Pct),
    tier2Mb: num(s.tier2Mb, 5, 5000, DEFAULTS.tier2Mb), tier2Pct: num(s.tier2Pct, 10, 90, DEFAULTS.tier2Pct),
    maxSide: [480, 540, 720, 1080].includes(Number(s.maxSide)) ? Number(s.maxSide) : DEFAULTS.maxSide,
    quality: QUALITY[s.quality] ? s.quality : DEFAULTS.quality,
  };
  if (out.tier2Mb <= out.tier1Mb) out.tier2Mb = out.tier1Mb + 1;
  return out;
}

function create({ ffmpeg, uploadDir, db, afterNotSmaller, settings, log = console.log }) {
  const queue = [];
  const stats = { running: false, done: 0, failed: 0, skipped: 0, savedBytes: 0, current: 0 };
  let stopFlag = false, busy = false;
  const conf = () => readSettings(settings ? settings() : '');

  const scaleTo = (side) => `scale='if(gt(iw,ih),-2,min(${side},iw))':'if(gt(iw,ih),min(${side},ih),-2)'`;

  function encode(input, output, opts, timeoutMs) {
    return new Promise((resolve) => {
      const rate = opts.kbps
        ? ['-b:v', opts.kbps + 'k', '-maxrate', Math.round(opts.kbps * 1.4) + 'k', '-bufsize', opts.kbps * 2 + 'k']
        : ['-crf', String(opts.crf), '-maxrate', opts.cap + 'k', '-bufsize', opts.cap * 2 + 'k'];
      const args = ['-y', '-nostdin', '-hide_banner', '-loglevel', 'error', '-i', input, '-map', '0:v:0', '-map', '0:a:0?', '-vf', scaleTo(opts.side),
        '-c:v', 'libx264', '-preset', 'veryfast', ...rate, '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', opts.audio + 'k', '-movflags', '+faststart', '-threads', '1', '-f', 'mp4', output];
      const p = spawn(ffmpeg, args, { stdio: 'ignore' });
      const timer = setTimeout(() => p.kill('SIGKILL'), timeoutMs);
      p.on('error', () => { clearTimeout(timer); resolve(false); });
      p.on('close', (code) => { clearTimeout(timer); resolve(code === 0); });
    });
  }

  // width, height, length and average bitrate of a file (parsed from ffmpeg's banner; there is no ffprobe in ffmpeg-static)
  function probe(file, size) {
    return new Promise((resolve) => {
      const p = spawn(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'ignore', 'pipe'] });
      let err = ''; p.stderr.on('data', (d) => { err = (err + d).slice(-6000); });
      const timer = setTimeout(() => p.kill('SIGKILL'), 20_000);
      p.on('error', () => { clearTimeout(timer); resolve(null); });
      p.on('close', () => {
        clearTimeout(timer);
        const d = err.match(/Duration: (\d+):(\d+):([\d.]+)/), v = err.match(/Video: [^\n]*?, (\d{2,5})x(\d{2,5})/);
        if (!d || !v) return resolve(null);
        const secs = +d[1] * 3600 + +d[2] * 60 + parseFloat(d[3]);
        resolve({ w: +v[1], h: +v[2], secs, kbps: secs > 0 ? size * 8 / secs / 1000 : 0 });
      });
    });
  }

  // what to do with a file: null = leave it, else the encoder settings
  function plan(before, info, c) {
    const q = QUALITY[c.quality], MB = 1048576;
    const pct = before > c.tier2Mb * MB ? c.tier2Pct : before > c.tier1Mb * MB ? c.tier1Pct : 0;
    if (pct && info && info.secs > 0) {
      // aim at pct % of the current size, but never below the quality floor (a phone must still show it clearly)
      const total = before * pct / 100 * 8 / info.secs / 1000;
      const audio = total < 700 ? 64 : 96;
      const kbps = Math.round(Math.min(q.cap, Math.max(q.floor, total - audio)));
      if (kbps >= info.kbps * 0.92) return null; // already at or below that level
      const side = kbps < 550 ? Math.min(c.maxSide, 540) : c.maxSide;
      return { kbps, side, audio };
    }
    // smaller files: only when heavier than what a phone needs (above the max size or the quality's top bitrate)
    if (before < 2 * MB || !info) return null;
    if (Math.min(info.w, info.h) <= c.maxSide && info.kbps <= q.cap * 0.9) return null;
    return { crf: q.crf, cap: q.cap, side: c.maxSide, audio: 96 };
  }

  // one encode at a time across all server processes (a lock row in settings, renewed while encoding)
  const takeLock = () => {
    const until = Date.now() + 15 * 60_000;
    db.prepare("INSERT INTO settings (key, value) VALUES ('video_opt_lock', '0') ON CONFLICT(key) DO NOTHING").run();
    return db.prepare("UPDATE settings SET value = ? WHERE key = 'video_opt_lock' AND CAST(value AS INTEGER) < ?").run(String(until), Date.now()).changes > 0;
  };
  const dropLock = () => db.prepare("UPDATE settings SET value = '0' WHERE key = 'video_opt_lock'").run();
  const claim = (id) => db.prepare('UPDATE videos SET opt_claim = ? WHERE id = ? AND COALESCE(opt_claim, 0) < ?').run(Date.now(), id, Date.now() - 3 * 3600_000).changes > 0;
  const finish = (id) => db.prepare('UPDATE videos SET optimized = 1, opt_level = ? WHERE id = ?').run(LEVEL, id);

  async function processOne({ stored, id }) {
    const input = path.join(uploadDir, path.basename(stored));
    if (!fs.existsSync(input)) { stats.skipped++; return; }
    if (!claim(id)) { stats.skipped++; return; } // another process has it
    const before = fs.statSync(input).size, ext = path.extname(input).toLowerCase();
    const c = conf();
    const info = before < 2 * 1048576 ? null : await probe(input, before);
    const todo = plan(before, info, c);
    if (!todo) {
      finish(id);
      stats.skipped++; stats.light = (stats.light || 0) + 1;
      if (afterNotSmaller) afterNotSmaller(stored);
      return;
    }
    const tmp = input + '.opt.mp4';
    stats.current = id;
    const timeout = Math.min(90 * 60_000, Math.max(6 * 60_000, (info ? info.secs : 0) * 4000));
    // keep the site-wide lock alive during long encodes
    const renew = setInterval(() => db.prepare("UPDATE settings SET value = ? WHERE key = 'video_opt_lock'").run(String(Date.now() + 15 * 60_000)), 5 * 60_000);
    const ok = await encode(input, tmp, todo, timeout).finally(() => clearInterval(renew));
    let after = 0; try { after = ok ? fs.statSync(tmp).size : 0; } catch {}
    if (ok && after > 2048 && after < before * 0.92) {
      const finalPath = ext === '.mp4' ? input : input.slice(0, -ext.length) + '.mp4';
      fs.renameSync(tmp, finalPath);
      if (finalPath !== input) { // .webm / .mov became .mp4: point the video at the new file, remove the old one a bit later
        db.prepare('UPDATE videos SET file = ? WHERE id = ?').run('/uploads/' + path.basename(finalPath), id);
        setTimeout(() => fs.rm(input, { force: true }, () => {}), 10 * 60_000).unref();
      }
      finish(id);
      stats.done++; stats.savedBytes += before - after;
      log(`optimized video ${id}: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB (${Math.round(after / before * 100)} %)`);
    } else {
      fs.rm(tmp, { force: true }, () => {});
      finish(id); // already small / not improvable: don't retry
      if (ok) stats.skipped++; else stats.failed++;
      if (afterNotSmaller) afterNotSmaller(stored);
    }
  }

  async function pump() {
    if (busy) return; busy = true; stats.running = true; stopFlag = false;
    while (queue.length && !stopFlag) {
      if (!takeLock()) { await new Promise((r) => setTimeout(r, 20_000)); continue; } // another process is encoding
      const job = queue.shift();
      try { await processOne(job); } catch (e) { stats.failed++; console.error('optimize failed:', e.message); } finally { dropLock(); }
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (stopFlag) queue.length = 0;
    busy = false; stats.running = false; stats.current = 0;
  }

  // videos the current rules would still look at: never processed (over 2 MB), or processed by older rules and over the first tier
  function candidates(limit = 3000) {
    const c = conf(), MB = 1048576, out = [];
    const rows = db.prepare('SELECT id, file, optimized FROM videos WHERE file != \'\' AND COALESCE(opt_level, 0) < ? AND COALESCE(opt_claim, 0) < ? ORDER BY id DESC LIMIT ?').all(LEVEL, Date.now() - 3 * 3600_000, limit);
    for (const r of rows) {
      try {
        const size = fs.statSync(path.join(uploadDir, path.basename(r.file))).size;
        if (size > (r.optimized ? c.tier1Mb * MB : 2 * MB)) out.push({ id: r.id, file: r.file, size });
      } catch {}
    }
    return out;
  }
  // "compress old videos automatically": a few at a time whenever nothing else is being encoded
  setInterval(() => {
    try {
      const c = conf();
      if (!ffmpeg || !c.enabled || !c.autoOld || busy || queue.length) return;
      for (const x of candidates(200).slice(0, 3)) queue.push({ stored: x.file, id: x.id });
      if (queue.length) pump();
    } catch (e) { log('auto optimize: ' + e.message); }
  }, 90_000).unref();

  return {
    stats, candidates, conf,
    pending: () => queue.length,
    // new uploads (skipped when the admin turned compression or auto-compress for new videos off)
    enqueueNew(stored, id) {
      const c = conf();
      if (!c.enabled || !c.autoNew) { if (afterNotSmaller) afterNotSmaller(stored); return false; } // still gets the quick-start index
      return this.enqueue(stored, id);
    },
    enqueue(stored, id) { if (!ffmpeg || !stored || !id) return false; queue.push({ stored, id }); pump(); return true; },
    stop() { stopFlag = true; },
  };
}

module.exports = { create, readSettings, DEFAULTS };
