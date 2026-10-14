// Generates the app icons (pink→orange gradient + white heart) into public/icons/. No dependencies.
//   node scripts/make-icons.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(out, { recursive: true });

const heartIn = (x, y) => { const a = x * x + y * y - 1; return a * a * a - x * x * y * y * y <= 0; };
const mix = (a, b, t) => a + (b - a) * t;

function render(size, { maskable }) {
  const SS = 3, raw = Buffer.alloc((size * 4 + 1) * size);
  const radius = maskable ? 0 : size * 0.22;                 // maskable icons are full-bleed; the OS applies its own mask
  const heartScale = size * (maskable ? 0.21 : 0.255);      // keep the heart inside the maskable safe zone (centre 60%)
  const cx = size / 2, cy = size / 2 + size * 0.02;
  for (let py = 0; py < size; py++) {
    const row = py * (size * 4 + 1); raw[row] = 0;
    for (let px = 0; px < size; px++) {
      let shape = 0, heart = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const X = px + (sx + 0.5) / SS, Y = py + (sy + 0.5) / SS;
        // rounded-square mask
        const dx = Math.max(Math.abs(X - cx) - (size / 2 - radius), 0), dy = Math.max(Math.abs(Y - size / 2) - (size / 2 - radius), 0);
        if (dx * dx + dy * dy <= radius * radius) shape++;
        if (heartIn((X - cx) / heartScale, -(Y - cy) / heartScale)) heart++;
      }
      shape /= SS * SS; heart /= SS * SS;
      const t = Math.min(1, Math.max(0, (px + py) / (size * 2)));
      const bg = [mix(255, 255, t), mix(46, 107, t), mix(126, 74, t)];       // #ff2e7e → #ff6b4a
      const o = row + 1 + px * 4;
      for (let k = 0; k < 3; k++) raw[o + k] = Math.round(bg[k] * (1 - heart) + 255 * heart);
      raw[o + 3] = Math.round(255 * shape);
    }
  }
  return raw;
}

function png(size, opts) {
  const raw = render(size, opts);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

for (const [name, size, opts] of [
  ['icon-192.png', 192, { maskable: false }], ['icon-512.png', 512, { maskable: false }],
  ['maskable-512.png', 512, { maskable: true }], ['apple-touch-icon.png', 180, { maskable: true }], ['favicon-32.png', 32, { maskable: false }],
]) { const b = png(size, opts); fs.writeFileSync(path.join(out, name), b); console.log(name, b.length + ' bytes'); }
