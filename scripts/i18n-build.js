// Builds public/i18n/*.json from the translation sources in scripts/i18n/.
//   scripts/i18n/catalog.json   – the Vietnamese UI strings (index = position), made by scripts/i18n-catalog.js
//   scripts/i18n/<lang>.txt     – one line per string:  <index>|<translation>   (e.g.  71|Home)
// Output: public/i18n/catalog.json, public/i18n/<lang>.json (array aligned with the catalog) and public/i18n/index.json.
// Run:  node scripts/i18n-build.js
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'i18n');
const out = path.join(__dirname, '..', 'public', 'i18n');
fs.mkdirSync(out, { recursive: true });

const catalog = JSON.parse(fs.readFileSync(path.join(src, 'catalog.json'), 'utf8'));
fs.writeFileSync(path.join(out, 'catalog.json'), JSON.stringify(catalog));

const holders = (s) => (s.match(/\{\d\}/g) || []).sort().join('');
const langs = [];
let problems = 0;
for (const f of fs.readdirSync(src).filter((n) => n.endsWith('.txt')).sort()) {
  const code = f.replace(/\.txt$/, '');
  const arr = new Array(catalog.length).fill('');
  for (const line of fs.readFileSync(path.join(src, f), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^(\d+)\|(.*)$/);
    if (!m) continue;
    const i = Number(m[1]);
    if (i >= catalog.length) { console.warn(`${code}: index ${i} out of range`); problems++; continue; }
    arr[i] = m[2];
  }
  const missing = arr.reduce((n, t, i) => n + (t === '' ? 1 : 0), 0);
  catalog.forEach((k, i) => { if (arr[i] && holders(k) !== holders(arr[i])) { console.warn(`${code}: placeholder mismatch at ${i}: ${k}`); problems++; } });
  fs.writeFileSync(path.join(out, code + '.json'), JSON.stringify(arr));
  langs.push(code);
  console.log(`${code}: ${catalog.length - missing}/${catalog.length} strings`);
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify({ langs }));
console.log(`${langs.length} languages built${problems ? `, ${problems} problem(s)` : ''}`);
