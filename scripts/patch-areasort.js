// Areas with more videos come first (regions, provinces, districts) in the app and on the SEO pages.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('public/js/app.js', [
  ["h('div', { class: 'grid g3' }, Object.keys(REGION_NAMES).map((k) =>",
   "h('div', { class: 'grid g3' }, Object.keys(REGION_NAMES).sort((a, b) => sum((x) => x.region === b) - sum((x) => x.region === a)).map((k) =>"],
  ["geo[reg].filter((p) => p[0].toLowerCase().includes(q)).forEach(([name, ds]) => {",
   "[...geo[reg]].filter((p) => p[0].toLowerCase().includes(q)).sort((a, b) => sum((x) => x.region === reg && x.province === b[0]) - sum((x) => x.region === reg && x.province === a[0])).forEach(([name, ds]) => {"],
  ["      p[1].map((d) => { const n = sum(",
   "      [...p[1]].sort((a, b) => sum((x) => x.province === prov && x.district === b) - sum((x) => x.province === prov && x.district === a)).map((d) => { const n = sum("],
]);

edit('src/seo.js', [
  ["  function children(a, rows) {\n    if (a.level === 'region') return GEO",
   "  const byCount = (list) => list.sort((x, y) => y.n - x.n); // most videos first (stable: equal counts keep their normal order)\n  function children(a, rows) {\n    if (a.level === 'region') return byCount(GEO"],
]);
let s = fs.readFileSync('src/seo.js', 'utf8');
// close the byCount( ... ) wrappers on the two return lines of children()
s = s.replace(/(if \(a\.level === 'region'\) return byCount\(GEO\[a\.region\]\.map\(\(\[p\]\) => \(\{[^\n]*?\}\)\))(\);)/, '$1)$2');
s = s.replace(/(if \(a\.level === 'province'\) return )(GEO\[a\.region\]\.find\([^\n]*?\}\)\))(;)/, '$1byCount($2)$3');
fs.writeFileSync('src/seo.js', s);

edit('src/seo.js', [
  ["<ul class=\"seo-links\">${Object.keys(REGIONS).map((r) =>", "<ul class=\"seo-links\">${Object.keys(REGIONS).sort((a, b) => sumWhere(rows, (x) => x.region === b) - sumWhere(rows, (x) => x.region === a)).map((r) =>"],
  ["      Object.keys(REGIONS).map((r) => '<h2><a href=\"'", "      Object.keys(REGIONS).sort((a, b) => sumWhere(rows, (x) => x.region === b) - sumWhere(rows, (x) => x.region === a)).map((r) => '<h2><a href=\"'"],
  ["        GEO[r].map(([p]) => { const n = sumWhere(rows, (x) => x.region === r && x.province === p); return '<li>",
   "        [...GEO[r]].sort((a, b) => sumWhere(rows, (x) => x.region === r && x.province === b[0]) - sumWhere(rows, (x) => x.region === r && x.province === a[0])).map(([p]) => { const n = sumWhere(rows, (x) => x.region === r && x.province === p); return '<li>"],
]);
console.log('patched');
