// One-off patch: the home page now contains real links to every area page, the app page and recent videos, so crawlers that do not
// run JavaScript (xml-sitemaps.com, simple SEO tools) can follow them and find all pages.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/seo.js', [
  ["  // ---------- robots.txt and sitemap.xml ----------", `  // ---------- crawlable home page content ----------
  function homeHtml(req) {
    const rows = counts();
    const vids = listVideos(null, { limit: 24 });
    return '<div class="wrap prose seo-area">' +
      '<h1>xgaigu – Video, livestream &amp; hẹn hò an toàn</h1>' +
      '<p>xgaigu.com là nơi bạn xem video giới thiệu, làm quen qua tin nhắn, xem livestream và đặt lịch hẹn gặp có kiểm soát. Dành cho người từ 18 tuổi trở lên.</p>' +
      '<p><a href="/khu-vuc">Xem video theo khu vực</a> · <a href="/app">Tải ứng dụng xgaigu</a></p>' +
      Object.keys(REGIONS).map((r) => '<h2><a href="' + urlOf({ level: 'region', region: r }) + '">' + escHtml(REGIONS[r]) + '</a></h2><ul class="seo-links">' +
        GEO[r].map(([p]) => { const n = sumWhere(rows, (x) => x.region === r && x.province === p); return '<li><a href="' + urlOf({ level: 'province', region: r, province: p }) + '">' + escHtml(shortName(p)) + '</a>' + (n ? ' (' + n + ' video)' : '') + '</li>'; }).join('') + '</ul>').join('') +
      (vids.length ? '<h2>Video mới</h2><ul class="seo-links">' + vids.map((v) => '<li><a href="/v/' + v.id + '">' + escHtml(cut(v.caption || 'Video của ' + v.user.name, 80)) + '</a></li>').join('') + '</ul>' : '') +
      '</div>';
  }

  // ---------- robots.txt and sitemap.xml ----------`],
  ["\n}\n\nmodule.exports = { install, REGIONS };", "\n  return { homeHtml };\n}\n\nmodule.exports = { install, REGIONS };"],
]);

edit('server.js', [
  ["require('./src/seo').install(app, {", "const seo = require('./src/seo').install(app, {"],
  ["  html = html.replace('</head>', tags + '\\n</head>');\n  res.set('Cache-Control', 'no-cache')", "  if (!v && req.path === '/') html = html.replace('<main id=\"main\" tabindex=\"-1\"></main>', () => '<main id=\"main\" tabindex=\"-1\">' + seo.homeHtml(req) + '</main>'); // links for crawlers; the app replaces it\n  html = html.replace('</head>', tags + '\\n</head>');\n  res.set('Cache-Control', 'no-cache')"],
]);
console.log('patched');
