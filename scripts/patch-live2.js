// Live v2: client wiring (the old live pages are replaced by public/js/live.js)
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}
let s = fs.readFileSync('public/js/app.js', 'utf8');
const a = s.indexOf('// ---------- live ----------'), b = s.indexOf('// ---------- terms ----------');
if (a < 0 || b < a) throw new Error('live block not found');
fs.writeFileSync('public/js/app.js', s.slice(0, a) + s.slice(b));
edit('public/js/app.js', [
  ["    if (a === 'live') return b ? pageStream(b, /host=1/.test(query || '')) : pageLive();\n    if (a === 'golive') return pageGoLive();",
   "    if (a === 'live') return b ? window.XGLive.pageStream(b, /host=1/.test(query || '')) : window.XGLive.pageLive();\n    if (a === 'golive') return window.XGLive.pageGoLive();"],
  ["h('div', { class: 'grid g4' }, lives.streams.slice(0, 4).map(lcard))", "h('div', { class: 'lvgrid' }, lives.streams.slice(0, 4).map((s) => window.XGLive.liveCard(s)))"],
  ["window.XG = { h, toast, icon, api, modal,", "window.XG = { h, toast, icon, api, apiUpload, fmtMB, openBook, openReport, rtcConfig, modal,"],
]);
s = fs.readFileSync('public/js/app.js', 'utf8');
const c = s.indexOf('function lcard(s) {'), d = s.indexOf('function pcard(u) {');
fs.writeFileSync('public/js/app.js', s.slice(0, c) + s.slice(d));
edit('public/index.html', [
  ['<link rel="stylesheet" href="/css/shop.css">', '<link rel="stylesheet" href="/css/shop.css">\n<link rel="stylesheet" href="/css/live.css">'],
  ['<script src="/js/shop.js"></script>', '<script src="/js/shop.js"></script>\n<script src="/js/live.js"></script>'],
]);
console.log('patched');
