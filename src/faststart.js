// Makes MP4/MOV files start playing quickly: moves the "moov" index to the front of the file (ffmpeg stream copy, no re-encoding).
// Phone and desktop recorders often put it at the end, which forces the browser to download the whole file before the first frame.
// New uploads are fixed in the background; old files are fixed gradually after start-up. Everything fails safe: the original stays if anything goes wrong.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Reads the top-level boxes: true when "mdat" (the media) comes before "moov" (the index).
function needsFaststart(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const size = fs.fstatSync(fd).size, head = Buffer.alloc(16);
    let pos = 0;
    for (let i = 0; i < 64 && pos + 8 <= size; i++) {
      fs.readSync(fd, head, 0, 16, pos);
      let len = head.readUInt32BE(0); const type = head.toString('latin1', 4, 8);
      if (type === 'moov') return false;
      if (type === 'mdat') return true;
      if (len === 1) len = Number(head.readBigUInt64BE(8)); else if (len === 0) len = size - pos;
      if (len < 8) return false;
      pos += len;
    }
    return false;
  } catch { return false; } finally { if (fd !== undefined) try { fs.closeSync(fd); } catch {} }
}

function create({ ffmpeg, uploadDir, log = console.log }) {
  const queue = [];
  let busy = false;

  function run(file) {
    return new Promise((resolve) => {
      const ext = path.extname(file).toLowerCase(), tmp = file + '.fs' + ext;
      const p = spawn(ffmpeg, ['-y', '-nostdin', '-hide_banner', '-loglevel', 'error', '-i', file, '-map', '0', '-c', 'copy', '-movflags', '+faststart', '-f', ext === '.mov' ? 'mov' : 'mp4', tmp], { stdio: 'ignore' });
      const timer = setTimeout(() => p.kill('SIGKILL'), 240_000);
      p.on('error', () => { clearTimeout(timer); fs.rm(tmp, { force: true }, () => resolve(false)); });
      p.on('close', (code) => {
        clearTimeout(timer);
        try {
          if (code === 0 && fs.existsSync(tmp) && fs.statSync(tmp).size > 1024) { fs.renameSync(tmp, file); return resolve(true); }
        } catch {}
        fs.rm(tmp, { force: true }, () => resolve(false));
      });
    });
  }

  async function pump() {
    if (busy) return; busy = true;
    while (queue.length) {
      const file = queue.shift();
      try { if (/\.(mp4|mov)$/i.test(file) && fs.existsSync(file) && needsFaststart(file)) { const ok = await run(file); log('faststart', path.basename(file), ok ? 'ok' : 'skipped'); } } catch {}
      await new Promise((r) => setTimeout(r, 1500)); // one at a time, gently
    }
    busy = false;
  }

  return {
    needsFaststart,
    enqueue(storedPath) { if (!ffmpeg || !storedPath) return; queue.push(path.join(uploadDir, path.basename(storedPath))); pump(); },
  };
}

module.exports = { create, needsFaststart };
