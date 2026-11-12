// Videos can be placed in any country: a country field (default Việt Nam). Việt Nam keeps its region / province / district
// lists; other countries type their state and city with suggestions, and the address suggestions follow the country.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/db.js', [
  ["  ['opt_claim', 'opt_claim INTEGER DEFAULT 0'],", "  ['opt_claim', 'opt_claim INTEGER DEFAULT 0'],\n  ['country', \"country TEXT DEFAULT 'VN'\"],"],
]);

edit('server.js', [
  // area: Việt Nam from the lists, other countries as typed (region "qt" = quốc tế)
  [`function readArea(b) {
  const region = Object.keys(GEO).includes(b.region) ? b.region : '';`, `const COUNTRY_RE = /^[A-Z]{2}$/;
const countryName = (() => { let dn = null; try { dn = new Intl.DisplayNames(['vi'], { type: 'region' }); } catch {} return (c) => { try { return (dn && dn.of(c)) || c; } catch { return c; } }; })();
function readArea(b) {
  const cc = String(b.country || '').toUpperCase();
  if ((COUNTRY_RE.test(cc) && cc !== 'VN') || b.region === 'qt') {
    const province = clean(b.province, 80);
    return { region: province ? 'qt' : '', province, district: province ? clean(b.district, 80) : '', country: COUNTRY_RE.test(cc) ? cc : '' };
  }
  const region = Object.keys(GEO).includes(b.region) ? b.region : '';`],
  ["  const district = prov && prov[1].includes(b.district) ? b.district : '';\n  return { region, province, district };",
   "  const district = prov && prov[1].includes(b.district) ? b.district : '';\n  return { region, province, district, country: 'VN' };"],
  // address suggestions in the chosen country
  [`  const q = clean(req.query.q, 120);
  if (q.length < 3) return res.json({ suggestions: [] });
  const key = q.toLowerCase();`, `  const q = clean(req.query.q, 120), cc = COUNTRY_RE.test(String(req.query.country || '').toUpperCase()) ? String(req.query.country).toLowerCase() : 'vn';
  if (q.length < 3) return res.json({ suggestions: [] });
  const key = cc + '|' + q.toLowerCase();`],
  ["&countrycodes=vn&accept-language=vi&q=' + encodeURIComponent(q);", "&countrycodes=' + cc + '&accept-language=vi,en&q=' + encodeURIComponent(q);"],
  ["app.get('/api/users/:id', (req, res) => {", `// state / city suggestions for countries other than Việt Nam (Photon, the OpenStreetMap search made for typing)
const placeCache = new Map();
app.get('/api/place-suggest', geoLimiter, async (req, res) => {
  const cc = String(req.query.country || '').toUpperCase(), kind = req.query.kind === 'city' ? 'city' : 'state';
  const q = clean(req.query.q, 80), within = clean(req.query.within, 80);
  if (!COUNTRY_RE.test(cc) || q.length < 2) return res.json({ suggestions: [] });
  const key = [cc, kind, q.toLowerCase(), within.toLowerCase()].join('|');
  if (placeCache.has(key)) return res.json({ suggestions: placeCache.get(key) });
  try {
    const layers = kind === 'state' ? ['state'] : ['city', 'district', 'county', 'locality'];
    const url = 'https://photon.komoot.io/api/?limit=40&lang=en&q=' + encodeURIComponent(q + (kind === 'city' && within ? ', ' + within : '')) + layers.map((l) => '&layer=' + l).join('');
    const r = await fetch(url, { headers: { 'User-Agent': 'xgaigu.com' }, signal: AbortSignal.timeout(8000) });
    const data = r.ok ? await r.json() : { features: [] };
    const seen = new Set(), out = [];
    for (const f of data.features || []) {
      const p = f.properties || {};
      if (String(p.countrycode || '').toUpperCase() !== cc || !p.name) continue;
      const state = kind === 'city' ? p.state || '' : '';
      if (kind === 'city' && within && state && state.toLowerCase() !== within.toLowerCase()) continue;
      const k = (p.name + '|' + state).toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k); out.push({ name: p.name, state });
      if (out.length >= 8) break;
    }
    if (placeCache.size > 2000) placeCache.delete(placeCache.keys().next().value);
    placeCache.set(key, out);
    res.json({ suggestions: out });
  } catch { res.json({ suggestions: [] }); }
});

app.get('/api/users/:id', (req, res) => {`],
  // upload: any country
  ["  if (!area.region || !area.province) { dropAll(); return fail(res, 400, 'Vui lòng chọn khu vực (miền và tỉnh/thành) của video'); }",
   "  if (!area.region || !area.province) { dropAll(); return fail(res, 400, area.country && area.country !== 'VN' ? 'Vui lòng nhập tỉnh / bang / thành phố của video' : 'Vui lòng chọn khu vực (miền và tỉnh/thành) của video'); }"],
  ["  const newId = Number(r.lastInsertRowid);\n", "  const newId = Number(r.lastInsertRowid);\n  db.prepare('UPDATE videos SET country = ? WHERE id = ?').run(area.country || 'VN', newId);\n"],
  ["      region: r.region || '', province: r.province || '', district: r.district || '', info,",
   "      region: r.region || '', province: r.province || '', district: r.district || '', country: r.country || 'VN', countryName: r.country && r.country !== 'VN' ? countryName(r.country) : '', info,"],
  // profile areas carry the country
  ["  const rows = db.prepare(`SELECT region, province, district, COUNT(*) AS n FROM videos WHERE user_id = ? AND hidden = 0 AND region <> '' AND province <> ''\n    GROUP BY region, province, district ORDER BY n DESC`).all(uid);\n  res.json({ areas: rows.map((r) => ({ region: r.region, province: r.province, district: r.district || '', count: r.n })) });",
   "  const rows = db.prepare(`SELECT region, province, district, COALESCE(country, 'VN') AS country, COUNT(*) AS n FROM videos WHERE user_id = ? AND hidden = 0 AND region <> '' AND province <> ''\n    GROUP BY region, province, district, COALESCE(country, 'VN') ORDER BY n DESC`).all(uid);\n  res.json({ areas: rows.map((r) => ({ region: r.region, province: r.province, district: r.district || '', country: r.country, countryName: r.country !== 'VN' ? countryName(r.country) : '', count: r.n })) });"],
  ["  if (!area.region && req.query.from) { const v = db.prepare('SELECT region, province, district FROM videos WHERE id = ?').get(Number(req.query.from)); if (v) area = readArea(v); }",
   "  if (!area.region && req.query.from) { const v = db.prepare('SELECT region, province, district, country FROM videos WHERE id = ?').get(Number(req.query.from)); if (v) area = readArea(v); }"],
]);

edit('server.js', [["thumb: r.thumb, region: r.region, province: r.province, district: r.district,", "thumb: r.thumb, region: r.region, province: r.province, district: r.district, country: r.country || 'VN',"]]);
// editing a video keeps / changes its country
let s = fs.readFileSync('server.js', 'utf8');
const editAnchor = "  db.prepare('UPDATE videos SET caption = ?, nickname = ?, v_phone = ?, region = ?, province = ?, district = ?, info = ? WHERE id = ?')";
if (!s.includes(editAnchor)) throw new Error('edit anchor');
s = s.replace(editAnchor, () => "  db.prepare('UPDATE videos SET country = ? WHERE id = ?').run(area.country || 'VN', id);\n" + editAnchor);
fs.writeFileSync('server.js', s);
console.log('server patched');
