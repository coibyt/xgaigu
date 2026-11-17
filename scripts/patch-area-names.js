// Area pages in the app: names carry the admin's keyword in front ("Giá rẻ Phuket"), and the address bar shows the
// area's real page (/khu-vuc/...) so a shared link previews with that area's title, description and picture.
const fs = require('fs');
const file = 'public/js/app.js';
let s = fs.readFileSync(file, 'utf8');
function rep(a, b, all) {
  if (!s.includes(a)) throw new Error('anchor not found: ' + a.slice(0, 80));
  s = all ? s.split(a).join(b) : s.replace(a, () => b);
}

// helper, loaded once a minute
rep('async function pageCountry(cc, prov, dist) {', `// the admin's keyword in front of area names ("Phuket" -> "Giá rẻ Phuket"), same rule as the server's SEO pages
let seoNamesP = null, seoNamesAt = 0;
async function seoNamer() {
  if (!seoNamesP || Date.now() - seoNamesAt > 60_000) { seoNamesAt = Date.now(); seoNamesP = api('/seo-names').catch(() => ({ sets: [] })); }
  const { sets } = await seoNamesP;
  const tag = /\\{\\s*(khu vực|khu vuc|area)\\s*\\}/gi;
  return (key, name) => {
    const set = (sets || []).find((x) => x.scope !== 'some' || (x.areas || []).some((k) => key === k || key.startsWith(k + '|')));
    if (!set) return name;
    if (new RegExp(tag.source, 'i').test(set.word)) return set.word.replace(tag, name);
    return name.toLowerCase().includes(set.word.toLowerCase()) ? name : set.word + ' ' + name;
  };
}
// show the area's real address (its SEO page), keeping the app route after "#"
function showAreaUrl(url) {
  try { if (url && location.pathname !== url) history.replaceState(history.state, '', url + location.search + location.hash); } catch {}
}

async function pageCountry(cc, prov, dist) {`);

// ---- pageCountry ----
rep("  const [{ areas: all }, info] = await Promise.all([api('/areas'), api('/area-info?' + infoQ).catch(() => null)]);",
  "  const [{ areas: all }, info, lab] = await Promise.all([api('/areas'), api('/area-info?' + infoQ).catch(() => null), seoNamer()]);\n  if (info) showAreaUrl(info.url);");
rep("h('a', { class: 'card prov-card has', href: `#/regions/${cc}/${enc(p.name)}` }, h('b', {}, p.name),",
  "h('a', { class: 'card prov-card has', href: `#/regions/${cc}/${enc(p.name)}` }, h('b', {}, lab('qt|' + cc + '|' + p.name, p.name)),");
rep("h('span', { class: 'cflag' }, flagOf(cc)), cname), provs.size", "h('span', { class: 'cflag' }, flagOf(cc)), lab('qt|' + cc, cname)), provs.size");
rep("href: `#/regions/${cc}/${enc(prov)}/${enc(d)}` }, d,", "href: `#/regions/${cc}/${enc(prov)}/${enc(d)}` }, lab('qt|' + cc + '|' + prov + '|' + d, d),");
rep("    wrap.append(h('h2', { class: 'title' }, dist || prov, count), chips, grid, pagerEl, seoBox(info));",
  "    wrap.append(h('h2', { class: 'title' }, lab(['qt', cc, prov, dist].filter(Boolean).join('|'), dist || prov), count), chips, grid, pagerEl, seoBox(info));");

// ---- pageRegions (Việt Nam) ----
rep("  const [geo, { areas }, info] = await Promise.all([loadGeo(), api('/areas'), reg ? api('/area-info?' + infoQ).catch(() => null) : null]);",
  "  const [geo, { areas }, info, lab] = await Promise.all([loadGeo(), api('/areas'), reg ? api('/area-info?' + infoQ).catch(() => null) : null, seoNamer()]);\n  showAreaUrl(info ? info.url : '/khu-vuc');");
rep("        h('h3', {}, REGION_NAMES[k]), h('p', { class: 'muted' }, geo[k].length", "        h('h3', {}, lab(k, REGION_NAMES[k])), h('p', { class: 'muted' }, geo[k].length");
rep("h('h3', {}, h('span', { class: 'cflag' }, flagOf(c.cc)), c.name),", "h('h3', {}, h('span', { class: 'cflag' }, flagOf(c.cc)), lab('qt|' + c.cc, c.name)),");
rep("href: `#/regions/${reg}/${enc(name)}` }, h('b', {}, name),", "href: `#/regions/${reg}/${enc(name)}` }, h('b', {}, lab(reg + '|' + name, name)),");
rep("h('h2', { class: 'title', style: 'margin-bottom:16px' }, REGION_NAMES[reg]),", "h('h2', { class: 'title', style: 'margin-bottom:16px' }, lab(reg, REGION_NAMES[reg])),");
rep("href: `#/regions/${reg}/${enc(prov)}/${enc(d)}` }, d,", "href: `#/regions/${reg}/${enc(prov)}/${enc(d)}` }, lab(reg + '|' + prov + '|' + d, d),");
rep("    wrap.append(h('h2', { class: 'title' }, dist || prov, count), chips, first, grid, pagerEl, seoBox(info));",
  "    wrap.append(h('h2', { class: 'title' }, lab([reg, prov, dist].filter(Boolean).join('|'), dist || prov), count), chips, first, grid, pagerEl, seoBox(info));");

// ---- router: leaving the area pages puts the address back on the home page ----
rep("    const [a, b] = seg;\n", "    const [a, b] = seg;\n    if (a !== 'regions' && /^\\/khu-vuc(\\/|$)/.test(location.pathname)) { try { history.replaceState(history.state, '', '/' + location.search + location.hash); } catch {} }\n");

fs.writeFileSync(file, s);
console.log('patched');
