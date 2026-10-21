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
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-maxrate', '2200k', '-bufsize', '4400k', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-threads', '1', '-f', 'mp4', output];
      const p = spawn(ffmpeg, args, { stdio: 'ignore' });
      const timer = setTimeout(() => p.kill('SIGKILL'), 6 * 60_000);
      p.on('error', () => { clearTimeout(timer); resolve(false); });
      p.on('close', (code) => { clearTimeout(timer); resolve(code === 0); });
    });
  }

  async function processOne({ stored, id }) {
    const input = path.join(uploadDir, path.basename(stored));
    if (!fs.existsSync(input)) { stats.skipped++; return; }
    const before = fs.statSync(input).size, ext = path.extname(input).toLowerCase();
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
