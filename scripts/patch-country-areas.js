// "Khu vực" browser lists the other countries that have videos (below Miền Bắc / Trung / Nam):
// country → its states / cities → districts, and every area query keeps foreign places apart by country.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b, all] of pairs) {
    if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70));
    s = all ? s.split(a).join(b) : s.replace(a, () => b);
  }
  fs.writeFileSync(file, s);
}

const CF = " AND (? = '' OR COALESCE(v.country, 'VN') = ?)";
edit('server.js', [
  // the country only matters for foreign areas (region "qt")
  ["function readArea(b) {", "const areaCc = (a) => (a.region === 'qt' ? a.country || '' : '');\nfunction readArea(b) {"],
  [`     WHERE v.hidden = 0 AND u.banned = 0 AND v.region = ? AND (? = '' OR v.province = ?) AND (? = '' OR v.district = ?) ORDER BY v.id\`
  ).all(area.region, area.province, area.province, area.district, area.district);`,
   `     WHERE v.hidden = 0 AND u.banned = 0 AND v.region = ? AND (? = '' OR v.province = ?) AND (? = '' OR v.district = ?)${CF} ORDER BY v.id\`
  ).all(area.region, area.province, area.province, area.district, area.district, areaCc(area), areaCc(area));`, true],
  [`AND (? = '' OR v.region = ?) AND (? = '' OR v.province = ?) AND (? = '' OR v.district = ?)",
    args: [uid, own, area.region, area.region, area.province, area.province, area.district, area.district],`,
   `AND (? = '' OR v.region = ?) AND (? = '' OR v.province = ?) AND (? = '' OR v.district = ?)${CF}",
    args: [uid, own, area.region, area.region, area.province, area.province, area.district, area.district, areaCc(area), areaCc(area)],`],
  ["const levels = [area.district && { ...area }, area.province && { ...area, district: '' }, area.region && { region: area.region, province: '', district: '' }].filter(Boolean);",
   "const levels = [area.district && { ...area }, area.province && { ...area, district: '' }, area.region === 'qt' && area.country && { region: 'qt', country: area.country, province: '', district: '' }, area.region && { region: area.region, province: '', district: '' }].filter(Boolean);"],
  [`AND v.user_id <> ? AND v.region = ? AND (? = '' OR v.province = ?) AND (? = '' OR v.district = ?)
        AND instr(?, ',' || v.id || ',') = 0 ORDER BY RANDOM() LIMIT 8\`).all(exclude, a.region, a.province, a.province, a.district, a.district, seenList)`,
   `AND v.user_id <> ? AND v.region = ? AND (? = '' OR v.province = ?) AND (? = '' OR v.district = ?)${CF}
        AND instr(?, ',' || v.id || ',') = 0 ORDER BY RANDOM() LIMIT 8\`).all(exclude, a.region, a.province, a.province, a.district, a.district, areaCc(a), areaCc(a), seenList)`],
  // counts per country too
  [`    \`SELECT v.region, v.province, v.district, COUNT(*) AS n FROM videos v JOIN users u ON u.id = v.user_id
     WHERE v.hidden = 0 AND u.banned = 0 AND v.region != '' GROUP BY v.region, v.province, v.district\`
  ).all();
  res.json({ areas: rows });`,
   `    \`SELECT v.region, v.province, v.district, COALESCE(v.country, 'VN') AS country, COUNT(*) AS n FROM videos v JOIN users u ON u.id = v.user_id
     WHERE v.hidden = 0 AND u.banned = 0 AND v.region != '' GROUP BY v.region, v.province, v.district, COALESCE(v.country, 'VN')\`
  ).all();
  res.json({ areas: rows.map((r) => (r.region === 'qt' ? { ...r, countryName: countryName(r.country) } : r)) });`],
]);
console.log('server patched');
