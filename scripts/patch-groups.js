// Nhóm Chat: wire the module in (server, router, bottom bar instead of "Live", menu, page files).
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}
edit('server.js', [[
  "const shop = require('./src/shop').install(",
  "require('./src/groups').install(app, { db, fail, clean, now, needUser, rmUpload, faststart, UPLOAD_DIR, VIDEO_TYPES, IMAGE_TYPES, rateLimit });\nconst shop = require('./src/shop').install(",
]]);
edit('public/js/app.js', [
  ["    tab('#/live', 'Live', 'live'),\n", "    tab('#/groups', 'Nhóm Chat', 'users'),\n"],
  ["['#/live', 'Livestream', 'live'],", "['#/groups', 'Nhóm Chat', 'users'], ['#/live', 'Livestream', 'live'],"],
  ["main.classList.toggle('nopad', !a || a === 'feed' || a === 'messages' || (a === 'live' && !!b));", "main.classList.toggle('nopad', !a || a === 'feed' || a === 'messages' || (a === 'live' && !!b) || (a === 'groups' && /^\\d+$/.test(b || '')));"],
  ["    if (a === 'golive') return window.XGLive.pageGoLive();", "    if (a === 'golive') return window.XGLive.pageGoLive();\n    if (a === 'groups') return window.XGGroups.page(b, seg[2]);"],
]);
edit('public/index.html', [
  ['<link rel="stylesheet" href="/css/telegram.css">', '<link rel="stylesheet" href="/css/telegram.css">\n<link rel="stylesheet" href="/css/groups.css">'],
  ['<script src="/js/telegram.js"></script>', '<script src="/js/telegram.js"></script>\n<script src="/js/groups.js"></script>'],
]);
console.log('patched');
