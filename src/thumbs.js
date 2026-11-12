// Pictures for link previews (Telegram, Facebook, Zalo…) and Telegram posts.
// 1. Videos uploaded without a cover get one: ffmpeg picks a representative frame from the video itself.
// 2. Videos that still have no picture (links to other sites, unreadable files) get a designed 1200×630 card:
//    brand, name, area, a short summary and a "tap to watch" button, with the member's photo in a video frame.
// The card background and shapes are drawn here (small PNG encoder, no image library); ffmpeg adds the photo and the text.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { spawn } = require('child_process');

const W = 1200, H = 630;
const FRAME = { x: 770, y: 58, w: 366, h: 514, r: 34 };
const FONTS = path.join(__dirname, '..', 'assets', 'fonts');

// ---------- tiny PNG encoder + shape helpers ----------
function png(w, h, data, gray = false) {
  const ch = gray ? 1 : 4, raw = Buffer.alloc((w * ch + 1) * h);
  for (let y = 0; y < h; y++) data.copy(raw, y * (w * ch + 1) + 1, y * w * ch, (y + 1) * w * ch);
  const chunk = (type, body) => { const len = Buffer.alloc(4); len.writeUInt32BE(body.length); const tb = Buffer.concat([Buffer.from(type), body]); const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(tb) >>> 0); return Buffer.concat([len, tb, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = gray ? 0 : 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}
const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp = (v) => Math.max(0, Math.min(1, v));
// signed distance to a rounded rectangle (negative inside)
const rrect = (px, py, x, y, w, h, r) => { const qx = Math.abs(px - (x + w / 2)) - (w / 2 - r), qy = Math.abs(py - (y + h / 2)) - (h / 2 - r); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r; };
const cover = (d) => clamp(0.5 - d); // anti-aliased coverage from a distance
const inTri = (px, py, [ax, ay], [bx, by], [cx, cy]) => { const s = (p1x, p1y, p2x, p2y, p3x, p3y) => (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y); const d1 = s(px, py, ax, ay, bx, by), d2 = s(px, py, bx, by, cx, cy), d3 = s(px, py, cx, cy, ax, ay); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
const triCover = (px, py, a, b, c) => { let n = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (inTri(px - 0.375 + i * 0.25, py - 0.375 + j * 0.25, a, b, c)) n++; return n / 16; };
const heart = (x, y) => { const a = x * x + y * y - 1; return a * a * a - x * x * y * y * y <= 0; };

// the card background with the brand mark, the badge, the pin, the video frame and the button
function background() {
  const buf = Buffer.alloc(W * H * 4);
  const bg1 = hex('#12081b'), bg2 = hex('#2a0d35'), pink = hex('#ff2e7e'), orange = hex('#ff6b4a'), violet = hex('#8b5cf6'), white = [255, 255, 255];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = mix(bg1, bg2, clamp(x / W * 0.6 + y / H * 0.4));
    const g1 = clamp(1 - Math.hypot(x - 1000, y - 80) / 560), g2 = clamp(1 - Math.hypot(x - 120, y - 640) / 520);
    c = mix(c, pink, 0.38 * g1 * g1); c = mix(c, violet, 0.32 * g2 * g2);
    // soft shadow under the video frame
    const fd = rrect(x, y - 14, FRAME.x, FRAME.y, FRAME.w, FRAME.h, FRAME.r);
    if (fd > 0 && fd < 40) c = mix(c, [0, 0, 0], 0.45 * (1 - fd / 40) ** 2);
    // video frame (filled with a gradient; a photo goes on top when there is one)
    const fa = cover(rrect(x, y, FRAME.x, FRAME.y, FRAME.w, FRAME.h, FRAME.r));
    if (fa) c = mix(c, mix(mix(pink, orange, (y - FRAME.y) / FRAME.h), white, 0.12 * clamp(1 - Math.hypot(x - 900, y - 150) / 300)), fa);
    // brand mark: rounded square with a heart
    const ba = cover(rrect(x, y, 64, 48, 56, 56, 16));
    if (ba) { c = mix(c, mix(pink, orange, (x - 64) / 56), ba); if (heart((x - 92) / 15, -(y - 78) / 15)) c = mix(c, white, ba); }
    // "VIDEO MỚI" badge outline
    const bd = rrect(x, y, 300, 56, 196, 42, 21);
    if (bd < 0.5) c = mix(c, pink, 0.2 * cover(bd));
    if (Math.abs(bd + 1) < 1.5) c = mix(c, pink, clamp(1.5 - Math.abs(bd + 1)));
    // location pin
    const pd = Math.hypot(x - 78, y - 252);
    if (pd < 12.5 || inTri(x, y, [67, 258], [89, 258], [78, 274])) c = mix(c, hex('#ff8fb5'), pd < 5 ? 0 : clamp(12.5 - pd) || 1);
    // "watch" button
    const cd = rrect(x, y, 64, 500, 470, 78, 39);
    if (cd < 0.5) c = mix(c, mix(pink, orange, (x - 64) / 470), cover(cd));
    const t = triCover(x, y, [100, 522], [100, 556], [128, 539]);
    if (t) c = mix(c, white, t);
    const o = (y * W + x) * 4; buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2]; buf[o + 3] = 255;
  }
  return png(W, H, buf);
}
// the frame's rounded mask (for the member's photo)
function frameMask() {
  const buf = Buffer.alloc(FRAME.w * FRAME.h);
  for (let y = 0; y < FRAME.h; y++) for (let x = 0; x < FRAME.w; x++) buf[y * FRAME.w + x] = Math.round(255 * cover(rrect(x + 0.5, y + 0.5, 0, 0, FRAME.w, FRAME.h, FRAME.r)));
  return png(FRAME.w, FRAME.h, buf, true);
}
// drawn over the frame: darker bottom and a big play button
function frameFx() {
  const buf = Buffer.alloc(FRAME.w * FRAME.h * 4), cx = FRAME.w / 2, cy = FRAME.h / 2;
  const pink = hex('#ff2e7e');
  for (let y = 0; y < FRAME.h; y++) for (let x = 0; x < FRAME.w; x++) {
    const inside = cover(rrect(x + 0.5, y + 0.5, 0, 0, FRAME.w, FRAME.h, FRAME.r));
    let c = [0, 0, 0], a = inside * 0.4 * clamp((y - FRAME.h * 0.55) / (FRAME.h * 0.45)) ** 1.5;
    const ring = Math.hypot(x - cx, y - cy);
    const ca = cover(ring - 66);
    if (ca) { c = mix(c, [255, 255, 255], ca); a = a + (1 - a) * ca; }
    const ga = clamp(1 - Math.abs(ring - 80) / 14) * 0.35; // glow ring
    if (ga && !ca) { c = [255, 255, 255]; a = Math.max(a, ga); }
    const t = triCover(x, y, [cx - 20, cy - 32], [cx - 20, cy + 32], [cx + 34, cy]);
    if (t) c = mix(c, pink, t);
    const o = (y * FRAME.w + x) * 4; buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2]; buf[o + 3] = Math.round(255 * a);
  }
  return png(FRAME.w, FRAME.h, buf);
}

// ---------- text layout ----------
const clean = (s) => String(s || '').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim(); // the font has no emoji
function wrap(text, perLine, maxLines) {
  const words = clean(text).split(' ').filter(Boolean), lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= perLine) cur = (cur + ' ' + w).trim();
    else { if (cur) lines.push(cur); cur = w.length > perLine ? w.slice(0, perLine - 1) + '…' : w; }
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '').replace(/[,.;:!?-]+$/, '') + '…';
  return lines;
}

function create({ ffmpeg, db, uploadDir, log = console.log }) {
  const OG = path.join(uploadDir, 'og');
  const fileOf = (p) => { if (!p || !p.startsWith('/uploads/')) return ''; const f = path.join(uploadDir, path.basename(p)); return fs.existsSync(f) ? f : ''; };
  const run = (args, cwd) => new Promise((resolve) => {
    const p = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'], cwd });
    let err = ''; p.stderr.on('data', (d) => { err += d; });
    const t = setTimeout(() => p.kill('SIGKILL'), 60_000);
    p.on('close', (code) => { clearTimeout(t); if (code) log('[thumbs] ffmpeg: ' + err.slice(-300)); resolve(code === 0); });
    p.on('error', () => { clearTimeout(t); resolve(false); });
  });
  const okFile = (f) => { try { return fs.statSync(f).size > 500; } catch { return false; } };

  // ---------- 1. a cover from the video itself ----------
  const busy = new Map();
  function ensureThumb(videoId) {
    if (busy.has(videoId)) return busy.get(videoId);
    const job = (async () => {
      const v = db.prepare('SELECT id, file, thumb FROM videos WHERE id = ?').get(videoId);
      if (!v) return '';
      if (v.thumb) return v.thumb;
      const src = fileOf(v.file);
      if (!ffmpeg || !src) return '';
      db.prepare('UPDATE videos SET thumb_try = ? WHERE id = ?').run(Date.now(), v.id);
      const name = crypto.randomBytes(16).toString('hex') + '.jpg', out = path.join(uploadDir, name);
      const vf = "thumbnail=40,scale='min(720,iw)':-2";
      let ok = await run(['-ss', '1', '-i', src, '-vf', vf, '-frames:v', '1', '-q:v', '3', out]) && okFile(out);
      if (!ok) ok = await run(['-i', src, '-vf', vf, '-frames:v', '1', '-q:v', '3', out]) && okFile(out);
      if (!ok) { try { fs.rmSync(out, { force: true }); } catch {} return ''; }
      const changed = db.prepare("UPDATE videos SET thumb = ? WHERE id = ? AND (thumb IS NULL OR thumb = '')").run('/uploads/' + name, v.id).changes;
      if (!changed) { try { fs.rmSync(out, { force: true }); } catch {} return db.prepare('SELECT thumb FROM videos WHERE id = ?').get(v.id).thumb || ''; }
      return '/uploads/' + name;
    })().finally(() => busy.delete(videoId));
    busy.set(videoId, job);
    return job;
  }
  // older videos without a cover get one in the background, a few at a time; each row is claimed so several
  // server processes do not do the same video, and a video that fails is retried a day later
  let sweeping = false;
  async function sweep() {
    if (sweeping || !ffmpeg) return;
    sweeping = true;
    try {
      const rows = db.prepare("SELECT id FROM videos WHERE file <> '' AND (thumb IS NULL OR thumb = '') AND COALESCE(thumb_try, 0) < ? ORDER BY id DESC LIMIT 15").all(Date.now() - 86400_000);
      for (const r of rows) {
        if (!db.prepare('UPDATE videos SET thumb_try = ? WHERE id = ? AND COALESCE(thumb_try, 0) < ?').run(Date.now(), r.id, Date.now() - 86400_000).changes) continue;
        await ensureThumbClaimed(r.id);
      }
    } catch (e) { log('[thumbs] sweep: ' + e.message); } finally { sweeping = false; }
  }
  const ensureThumbClaimed = (id) => ensureThumb(id).catch(() => '');
  setTimeout(sweep, 20_000).unref();
  setInterval(sweep, 120_000).unref();

  // ---------- 2. the designed card ----------
  let assets = null;
  function prepareAssets() {
    if (assets) return assets;
    fs.mkdirSync(OG, { recursive: true });
    const a = { bg: path.join(OG, '_bg-v1.png'), mask: path.join(OG, '_mask-v1.png'), fx: path.join(OG, '_fx-v2.png') };
    if (!fs.existsSync(a.bg)) fs.writeFileSync(a.bg, background());
    if (!fs.existsSync(a.mask)) fs.writeFileSync(a.mask, frameMask());
    if (!fs.existsSync(a.fx)) fs.writeFileSync(a.fx, frameFx());
    return (assets = a);
  }
  const fq = (p) => "'" + p.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'") + "'";
  function cardText(v, owner) {
    let info = {}; try { info = JSON.parse(v.info || '{}') || {}; } catch {}
    const name = clean(v.nickname || owner.name) || 'xgaigu';
    const area = clean([v.district, v.province, (v.country && v.country !== 'VN' ? (() => { try { return new Intl.DisplayNames(['vi'], { type: 'region' }).of(v.country); } catch { return v.country; } })() : '')].filter(Boolean).join(' · ')) || 'xgaigu.com';
    const facts = [info.birthYear && (new Date().getFullYear() - info.birthYear) + ' tuổi', info.height && info.height + ' cm', info.weight && info.weight + ' kg', info.origin && 'Quê ' + clean(info.origin)].filter(Boolean).join('  •  ');
    const caption = wrap(v.caption || 'Video mới trên xgaigu. Bấm vào để xem ngay và làm quen nhé!', 36, facts ? 3 : 4);
    return { name: name.length > 24 ? name.slice(0, 23) + '…' : name, area: area.length > 44 ? area.slice(0, 43) + '…' : area, facts, caption };
  }
  async function card(videoId) {
    if (!ffmpeg) return '';
    const v = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);
    if (!v) return '';
    const owner = db.prepare('SELECT name, avatar FROM users WHERE id = ?').get(v.user_id) || { name: '' };
    const t = cardText(v, owner), photo = fileOf(owner.avatar);
    const key = crypto.createHash('sha1').update(JSON.stringify([t, photo, 'v3'])).digest('hex').slice(0, 10);
    const out = path.join(OG, `${v.id}-${key}.jpg`);
    if (okFile(out)) return out;
    const a = prepareAssets();
    // the text goes through files, so nothing in it needs escaping
    const dir = fs.mkdtempSync(path.join(OG, '_t-'));
    const lines = [];
    const text = (s, font, size, color, x, y, extra = '') => {
      const f = path.join(dir, lines.length + '.txt'); fs.writeFileSync(f, s);
      lines.push(`drawtext=fontfile=${fq(path.join(FONTS, font))}:textfile=${fq(f)}:fontsize=${size}:fontcolor=${color}:x=${x}:y=${y}${extra}`);
    };
    const nameSize = Math.max(40, Math.min(62, Math.floor(640 / (t.name.length * 0.58))));
    text('xgaigu', 'BeVietnamPro-Bold.ttf', 40, 'white', 136, 52);
    text('VIDEO MỚI', 'BeVietnamPro-SemiBold.ttf', 20, '0xff8fb5', '300+(196-text_w)/2', 67);
    text(t.name, 'BeVietnamPro-Bold.ttf', nameSize, 'white', 64, 150, ':shadowcolor=black@0.35:shadowy=3');
    text(t.area, 'BeVietnamPro-SemiBold.ttf', 26, '0xffb3cf', 102, 236);
    t.caption.forEach((l, i) => text(l, 'BeVietnamPro-Regular.ttf', 29, '0xefe6f5', 64, 296 + i * 42));
    if (t.facts) text(t.facts, 'BeVietnamPro-SemiBold.ttf', 24, '0xd9c6e6', 64, 296 + t.caption.length * 42 + 10);
    text('Bấm để xem video ngay', 'BeVietnamPro-Bold.ttf', 29, 'white', 146, 520);
    if (!photo) text((t.name[0] || 'X').toUpperCase(), 'BeVietnamPro-Bold.ttf', 150, 'white@0.22', `${FRAME.x}+(${FRAME.w}-text_w)/2`, `${FRAME.y + 40}`);
    const inputs = ['-i', a.bg, '-i', a.fx];
    let graph = '';
    if (photo) {
      inputs.push('-i', photo, '-i', a.mask);
      graph = `[2:v]scale=${FRAME.w}:${FRAME.h}:force_original_aspect_ratio=increase,crop=${FRAME.w}:${FRAME.h},format=rgba[ph];[3:v]format=gray[mk];[ph][mk]alphamerge[phm];[0:v][phm]overlay=${FRAME.x}:${FRAME.y}[b1];[b1][1:v]overlay=${FRAME.x}:${FRAME.y}[b2];[b2]`;
    } else graph = `[0:v][1:v]overlay=${FRAME.x}:${FRAME.y}[b2];[b2]`;
    graph += lines.join(',') + ',format=rgb24[out]';
    const tmp = out + '.tmp.jpg';
    const ok = await run([...inputs, '-filter_complex', graph, '-map', '[out]', '-frames:v', '1', '-q:v', '3', tmp]) && okFile(tmp);
    fs.rmSync(dir, { recursive: true, force: true });
    if (!ok) { try { fs.rmSync(tmp, { force: true }); } catch {} return ''; }
    fs.renameSync(tmp, out);
    for (const f of fs.readdirSync(OG)) if (f.startsWith(v.id + '-') && f !== path.basename(out)) try { fs.rmSync(path.join(OG, f), { force: true }); } catch {}
    return out;
  }

  // the picture to use for a video: its cover, else one from the video, else the designed card (a file path)
  async function pictureFile(videoId) {
    const v = db.prepare('SELECT thumb FROM videos WHERE id = ?').get(videoId);
    return fileOf(v && v.thumb) || fileOf(await ensureThumb(videoId)) || (await card(videoId).catch(() => ''));
  }
  return { ensureThumb, card, pictureFile };
}

module.exports = { create };
