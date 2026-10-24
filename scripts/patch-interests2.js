// "Sở thích": keep the member's line breaks. Collapsed view = first line (with …), expanded view = every line as written.
const fs = require('fs');
let s = fs.readFileSync('public/js/app.js', 'utf8');
const a = s.indexOf('function interestBlock(raw) {');
const b = s.indexOf('function openInfo(v) {');
if (a < 0 || b < 0 || b < a) throw new Error('interestBlock not found');
const fn = `function interestBlock(raw) {
  const text = (Array.isArray(raw) ? raw.join(', ') : String(raw || '')).replace(/\\r/g, '').trim();
  if (!text) return null;
  const lines = text.split('\\n'), moreLines = lines.slice(1).some((l) => l.trim());
  const short = h('span', { class: 'int-short', translate: 'no' }, lines[0] + (moreLines ? ' …' : ''));
  const full = h('span', { class: 'int-full', translate: 'no', hidden: true }, text); // pre-line: every line break stays
  const btn = h('button', { type: 'button', class: 'linkbtn int-more', hidden: !moreLines }, 'Xem thêm');
  btn.addEventListener('click', () => { const open = full.hidden; full.hidden = !open; short.hidden = open; btn.textContent = open ? 'Thu gọn' : 'Xem thêm'; });
  const box = h('div', { class: 'int-box' }, h('b', {}, 'Sở thích'), h('div', {}, short, full), btn);
  requestAnimationFrame(() => setTimeout(() => { if (btn.hidden && short.scrollWidth > short.clientWidth + 1) btn.hidden = false; }, 60));
  return box;
}

`;
s = s.slice(0, a) + fn + s.slice(b);
fs.writeFileSync('public/js/app.js', s);
fs.appendFileSync('public/css/app.css', `
/* interests: first line collapsed, every line when expanded */
.int-box b{display:block;margin-bottom:2px}
.int-short{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.int-full{display:block;white-space:pre-line;word-break:break-word}
.int-short[hidden],.int-full[hidden]{display:none}
.int-more{display:block;margin-top:2px}
`);
console.log('patched');
