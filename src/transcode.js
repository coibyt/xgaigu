// Shrinks uploaded videos so they load fast on phones: H.264, shorter side at most 720 px, ~2 Mbit/s, index at the front of the file.
// Runs in the background, one video at a time with a single ffmpeg thread (shared hosting friendly). The original is only replaced when
// the new file is clearly smaller and valid, so a failure never breaks a video.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function create({ ffmpeg, uploadDir, db, afterNotSmaller, log = console.log }) {
  const queue = [];
  const stats = { running: false, done: 0, failed: 0, skipped: 0, savedBytes: 0, current: 0 };
  let stopFlag = false, busy = false;

  const baseScale = "scale='if(gt(iw,ih),-2,min(720,iw))':'if(gt(iw,ih),min(720,ih),-2)'";

  function encode(input, output) {
    return new Promise((resolve) => {
      const args = ['-y', '-nostdin', '-hide_banner', '-loglevel', 'error', '-i', input, '-map', '0:v:0', '-map', '0:a:0?', '-vf', baseScale,
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-maxrate', '1800k', '-bufsize', '3600k', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-threads', '1', '-f', 'mp4', output];
      const p = spawn(ffmpeg, args, { stdio: 'ignore' });
      const timer = setTimeout(() => p.kill('SIGKILL'), 6 * 60_000);
      p.on('error', () => { clearTimeout(timer); resolve(false); });
      p.on('close', (code) => { clearTimeout(timer); resolve(code === 0); });
    });
  }

  // width, height and average bitrate of a file (parsed from ffmpeg's banner; there is no ffprobe in ffmpeg-static)
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
        resolve({ w: +v[1], h: +v[2], kbps: secs > 0 ? size * 8 / secs / 1000 : 0 });
      });
    });
  }

  async function processOne({ stored, id }) {
    const input = path.join(uploadDir, path.basename(stored));
    if (!fs.existsSync(input)) { stats.skipped++; return; }
    const before = fs.statSync(input).size, ext = path.extname(input).toLowerCase();
    // Small files (under 2 MB) and files that are already light (<= 720p and <= 1.6 Mbit/s, the level of other short-video sites)
    // are NOT re-encoded: re-compressing them would only lose quality. They just get the quick-start index.
    const info = before < 2 * 1048576 ? null : await probe(input, before);
    const alreadyLight = before < 2 * 1048576 || (info && Math.min(info.w, info.h) <= 720 && info.kbps <= 1600);
    if (alreadyLight) {
      db.prepare('UPDATE videos SET optimized = 1 WHERE id = ?').run(id);
      stats.skipped++; stats.light = (stats.light || 0) + 1;
      if (afterNotSmaller) afterNotSmaller(stored);
      return;
    }
    const tmp = input + '.opt.mp4';
    stats.current = id;
    const ok = await encode(input, tmp);
    let after = 0; try { after = ok ? fs.statSync(tmp).size : 0; } catch {}
    if (ok && after > 2048 && after < before * 0.92) {
      const finalPath = ext === '.mp4' ? input : input.slice(0, -ext.length) + '.mp4';
      fs.renameSync(tmp, finalPath);
      if (finalPath !== input) { // .webm / .mov became .mp4: point the video at the new file, remove the old one a bit later
        db.prepare('UPDATE videos SET file = ? WHERE id = ?').run('/uploads/' + path.basename(finalPath), id);
        setTimeout(() => fs.rm(input, { force: true }, () => {}), 10 * 60_000).unref();
      }
      db.prepare('UPDATE videos SET optimized = 1 WHERE id = ?').run(id);
      stats.done++; stats.savedBytes += before - after;
      log(`optimized video ${id}: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`);
    } else {
      fs.rm(tmp, { force: true }, () => {});
      db.prepare('UPDATE videos SET optimized = 1 WHERE id = ?').run(id); // already small / not improvable: don't retry
      if (ok) stats.skipped++; else stats.failed++;
      if (afterNotSmaller) afterNotSmaller(stored);
    }
  }

  async function pump() {
    if (busy) return; busy = true; stats.running = true; stopFlag = false;
    while (queue.length && !stopFlag) {
      const job = queue.shift();
      try { await processOne(job); } catch (e) { stats.failed++; console.error('optimize failed:', e.message); }
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (stopFlag) queue.length = 0;
    busy = false; stats.running = false; stats.current = 0;
  }

  return {
    stats,
    pending: () => queue.length,
    enqueue(stored, id) { if (!ffmpeg || !stored || !id) return false; queue.push({ stored, id }); pump(); return true; },
    stop() { stopFlag = true; },
  };
}

module.exports = { create };
