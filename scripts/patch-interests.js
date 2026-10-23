// One-off patch: "Sở thích" of a video is free text (up to ~1000 words); the info sheet shows one line with "Xem thêm".
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('server.js', [
  ["  const rawInterests = Array.isArray(b.interests) ? b.interests : String(b.interests || '').split(/[,\\n]/);\n  return {\n    birthYear: by,",
   "  const interestsText = clean(Array.isArray(b.interests) ? b.interests.join(', ') : String(b.interests || '').replace(/\\r/g, ''), 8000);\n  return {\n    birthYear: by,"],
  ["    interests: [...new Set(rawInterests.map((t) => clean(t, 24).replace(/\\|/g, '')).filter(Boolean))].slice(0, 10),\n  };\n}",
   "    interests: interestsText,\n  };\n}"],
]);

edit('public/js/app.js', [
  ["field('Sở thích', 'interests', { value: (me.interests || []).join(', '), maxlength: 240, placeholder: 'du lịch, cà phê, yoga' }),",
   "field('Sở thích', 'interests', { value: (me.interests || []).join(', '), rows: 3, maxlength: 8000, placeholder: 'VD: du lịch, cà phê, yoga… Bạn có thể viết dài thoải mái (tới khoảng 1000 từ).' }, 'textarea'),"],
  ["input('interests', 'Sở thích (cách nhau bằng dấu phẩy)', (i.interests || []).join(', ')),",
   "h('label', { class: 'f' }, h('span', {}, 'Sở thích'), h('textarea', { name: 'interests', rows: 3, maxlength: 8000 }, Array.isArray(i.interests) ? i.interests.join(', ') : (i.interests || ''))),"],
  ["    i.interests && i.interests.length > 0 && h('div', { class: 'facts', style: 'margin:12px 0' }, i.interests.map((t) => h('span', { class: 'fact tag' }, t))),",
   "    interestBlock(i.interests),"],
  ["function openInfo(v) {", `// "Sở thích": one line with "Xem thêm"; tap to read all of it (it can be very long)
function interestBlock(raw) {
  const text = (Array.isArray(raw) ? raw.join(', ') : String(raw || '')).trim();
  if (!text) return null;
  const body = h('span', { class: 'int-text clamp', translate: 'no' }, text);
  const btn = h('button', { type: 'button', class: 'linkbtn int-more', hidden: true }, 'Xem thêm');
  btn.addEventListener('click', () => { const collapsed = body.classList.toggle('clamp'); btn.textContent = collapsed ? 'Xem thêm' : 'Thu gọn'; });
  const box = h('div', { class: 'int-box' }, h('b', {}, 'Sở thích: '), body, ' ', btn);
  requestAnimationFrame(() => setTimeout(() => { btn.hidden = !(body.scrollHeight > body.clientHeight + 1 || text.length > 60 || text.includes('\\n')); }, 60));
  return box;
}

function openInfo(v) {`],
]);

fs.appendFileSync('public/css/app.css', `
/* interests: one line, expandable */
.int-box{margin:12px 0;font-size:15px;line-height:1.6}
.int-text{white-space:pre-line;word-break:break-word}
.int-text.clamp{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:1;overflow:hidden;white-space:normal}
.int-more{font-weight:700;white-space:nowrap}
`);
console.log('patched');
