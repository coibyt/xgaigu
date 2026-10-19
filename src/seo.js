// SEO pages for the "Khu vực" (regions → provinces → districts) section.
// Real URLs (/khu-vuc/mien-nam/ho-chi-minh/quan-8) rendered on the server with title, meta tags, structured data,
// intro text, keywords, links and a list of videos, plus sitemap.xml and robots.txt. Admins can edit the text of every area.
// Defaults are generated from real data only (names and video counts); admins can replace them with their own text.
const fs = require('fs');
const path = require('path');

const REGIONS = { bac: 'Miền Bắc', trung: 'Miền Trung', nam: 'Miền Nam' };
const REGION_SLUG = { bac: 'mien-bac', trung: 'mien-trung', nam: 'mien-nam' };

const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const shortName = (p) => String(p).replace(/^(TP\.?\s*|Thành phố\s+|Tỉnh\s+)/i, '').trim();

function install(app, ctx) {
  const { db, GEO, listVideos, escHtml, cut, needAdmin, fail, clean, now } = ctx;

  // ---------- area index ----------
  const byPath = new Map(); // "mien-nam/ho-chi-minh/quan-8" -> area
  const pathOf = (region, province, district) => {
    const parts = [REGION_SLUG[region]];
    if (province) parts.push(slugify(shortName(province)));
    if (district) parts.push(slugify(district));
    return parts.join('/');
  };
  for (const region of Object.keys(GEO)) {
    byPath.set(pathOf(region), { level: 'region', region });
    for (const [province, districts] of GEO[region]) {
      byPath.set(pathOf(region, province), { level: 'province', region, province });
      const seen = new Set();
      for (const district of districts) {
        let p = pathOf(region, province, district);
        if (seen.has(p)) p += '-' + (seen.size + 1);
        seen.add(p);
        byPath.set(p, { level: 'district', region, province, district });
      }
    }
  }
  const urlOf = (a) => '/khu-vuc/' + pathOf(a.region, a.province, a.district);
  const keyOf = (a) => [a.region, a.province, a.district].filter(Boolean).join('|');
  const nameOf = (a) => (a.district || (a.province ? shortName(a.province) : REGIONS[a.region]));
  const fullName = (a) => (a.district ? a.district + ', ' + shortName(a.province) : nameOf(a));

  // ---------- data ----------
  const counts = () => db.prepare(
    `SELECT v.region, v.province, v.district, COUNT(*) AS n FROM videos v JOIN users u ON u.id = v.user_id
     WHERE v.hidden = 0 AND u.banned = 0 AND v.region != '' GROUP BY v.region, v.province, v.district`).all();
  const sumWhere = (rows, f) => rows.filter(f).reduce((n, x) => n + x.n, 0);

  function children(a, rows) {
    if (a.level === 'region') return GEO[a.region].map(([p]) => ({ name: p, url: urlOf({ level: 'province', region: a.region, province: p }), n: sumWhere(rows, (x) => x.region === a.region && x.province === p) }));
    if (a.level === 'province') return GEO[a.region].find((p) => p[0] === a.province)[1].map((d) => ({ name: d, url: urlOf({ level: 'district', region: a.region, province: a.province, district: d }), n: sumWhere(rows, (x) => x.province === a.province && x.district === d) }));
    return [];
  }
  const totalOf = (a, rows) => sumWhere(rows, (x) => x.region === a.region && (!a.province || x.province === a.province) && (!a.district || x.district === a.district));

  // ---------- generated defaults (only facts we really know: names, counts) ----------
  function defaults(a, rows) {
    const name = nameOf(a), full = fullName(a), total = totalOf(a, rows), kids = children(a, rows);
    const top = [...kids].sort((x, y) => y.n - x.n).filter((x) => x.n > 0).slice(0, 5);
    const safety = 'Mọi thành viên phải từ 18 tuổi trở lên. Hãy gặp gỡ ở nơi công cộng, không chuyển tiền trước cho người lạ và báo cáo ngay nội dung đáng ngờ để xgaigu xử lý.';
    const place = a.level === 'region' ? name : full;
    const keywords = [`làm quen ${place}`, `kết bạn ${place}`, `hẹn hò ${place}`, `video ${place}`, `chat ${place}`, `livestream ${place}`, `tìm bạn ${place}`, 'xgaigu'];
    let intro;
    if (a.level === 'region') {
      intro = `${name} gồm ${kids.length} tỉnh/thành phố: ${kids.map((k) => shortName(k.name)).join(', ')}.\n\n` +
        `Trên xgaigu.com bạn có thể xem video giới thiệu của thành viên ở từng tỉnh/thành, nhắn tin làm quen, xem livestream và đặt lịch hẹn gặp có kiểm soát. ` +
        (total ? `Hiện có ${total} video tại ${name}` + (top.length ? `, nhiều nhất ở ${top.map((t) => `${shortName(t.name)} (${t.n})`).join(', ')}.` : '.') : `Khu vực này đang chờ những video đầu tiên.`) + `\n\n${safety}`;
    } else if (a.level === 'province') {
      intro = `${name} có ${kids.length} quận/huyện/thị xã được liệt kê trên xgaigu.com.\n\n` +
        `Tại đây bạn có thể xem video giới thiệu của thành viên ở ${name}, làm quen qua tin nhắn và livestream, rồi sắp xếp cuộc hẹn an toàn. ` +
        (total ? `Hiện có ${total} video tại ${name}` + (top.length ? `, nhiều nhất ở ${top.map((t) => `${t.name} (${t.n})`).join(', ')}.` : '.') : `Hãy là người đầu tiên đăng video tại ${name}.`) + `\n\n${safety}`;
    } else {
      intro = `Danh sách video giới thiệu của thành viên tại ${full} trên xgaigu.com.\n\n` +
        (total ? `Hiện có ${total} video tại khu vực này. ` : `Khu vực này chưa có video, hãy là người đầu tiên đăng. `) +
        `Bạn có thể xem thông tin, nhắn tin làm quen hoặc đặt lịch hẹn gặp.\n\n${safety}`;
    }
    return {
      title: a.level === 'region' ? `Làm quen & hẹn hò ${name} – video, livestream | xgaigu` : `Làm quen & hẹn hò tại ${full} | xgaigu`,
      description: cut(`Xem video giới thiệu, nhắn tin làm quen và hẹn gặp an toàn tại ${place}` + (total ? ` (${total} video)` : '') + ' trên xgaigu.com. Dành cho người từ 18 tuổi.', 160),
      keywords: keywords.join(', '), intro,
    };
  }
  const saved = (a) => db.prepare('SELECT title, description, keywords, intro FROM area_seo WHERE key = ?').get(keyOf(a)) || null;
  function content(a, rows) {
    const d = defaults(a, rows), s = saved(a) || {};
    return { title: s.title || d.title, description: s.description || d.description, keywords: s.keywords || d.keywords, intro: s.intro || d.intro };
  }

  // ---------- area lookup from request data ----------
  const GEO_OK = (region, province, district) => {
    if (!GEO[region]) return null;
    if (!province) return { level: 'region', region };
    const p = GEO[region].find((x) => x[0] === province);
    if (!p) return null;
    if (!district) return { level: 'province', region, province };
    return p[1].includes(district) ? { level: 'district', region, province, district } : null;
  };

  // ---------- page shell ----------
  const baseOf = (req) => (process.env.SITE_URL || req.protocol + '://' + req.get('host')).replace(/\/$/, '');
  function shell(req, { title, description, keywords, canonical, ld, route, main }) {
    const base = baseOf(req);
    let html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
    html = html.replace(/<title>[\s\S]*?<\/title>\s*/, '').replace(/<meta name="description"[^>]*>\s*/, '').replace(/<meta property="og:[^>]*>\s*/g, '');
    const tags = [
      `<title>${escHtml(title)}</title>`,
      `<meta name="description" content="${escHtml(description)}">`,
      keywords ? `<meta name="keywords" content="${escHtml(keywords)}">` : '',
      '<meta name="robots" content="index,follow,max-image-preview:large">',
      `<link rel="canonical" href="${escHtml(base + canonical)}">`,
      '<meta property="og:site_name" content="xgaigu"><meta property="og:locale" content="vi_VN"><meta property="og:type" content="website">',
      `<meta property="og:url" content="${escHtml(base + canonical)}">`,
      `<meta property="og:title" content="${escHtml(title)}">`,
      `<meta property="og:description" content="${escHtml(description)}">`,
      `<meta property="og:image" content="${escHtml(base + '/img/og-default.png')}">`,
      '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">',
      '<meta name="twitter:card" content="summary_large_image">',
      `<meta name="twitter:title" content="${escHtml(title)}">`,
      `<meta name="twitter:description" content="${escHtml(description)}">`,
      `<meta name="xg-route" content="${escHtml(route)}">`, // tells the app which page to show for this real URL
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    ].filter(Boolean).join('\n');
    html = html.replace('</head>', tags + '\n</head>');
    html = html.replace(/(\/(?:js\/[\w.-]+\.js|css\/app\.css))"/g, '$1?v=' + ctx.assetV() + '"');
    html = html.replace('<main id="main" tabindex="-1"></main>', `<main id="main" tabindex="-1">${main}</main>`);
    return html;
  }

  const paragraphs = (t) => String(t).split(/\n{2,}/).map((p) => `<p>${escHtml(p.trim())}</p>`).join('');
  const crumbsOf = (a) => {
    const out = [{ name: 'Trang chủ', url: '/' }, { name: 'Khu vực', url: '/khu-vuc' }];
    out.push({ name: REGIONS[a.region], url: urlOf({ level: 'region', region: a.region }) });
    if (a.province) out.push({ name: shortName(a.province), url: urlOf({ level: 'province', region: a.region, province: a.province }) });
    if (a.district) out.push({ name: a.district, url: urlOf(a) });
    return out;
  };

  function areaHtml(req, a) {
    const rows = counts(), c = content(a, rows), kids = children(a, rows), name = a.level === 'region' ? nameOf(a) : fullName(a);
    const vids = listVideos(null, { region: a.region, province: a.province || null, district: a.district || null, limit: 12 });
    const crumbs = crumbsOf(a), base = baseOf(req);
    const h1 = a.level === 'region' ? `Làm quen & hẹn hò ${name}` : `Làm quen & hẹn hò tại ${name}`;
    const kw = c.keywords.split(',').map((x) => x.trim()).filter(Boolean);
    const main = `<div class="wrap prose seo-area">
<nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((x, i) => (i < crumbs.length - 1 ? `<a href="${escHtml(x.url)}">${escHtml(x.name)}</a> › ` : `<span>${escHtml(x.name)}</span>`)).join('')}</nav>
<h1>${escHtml(h1)}</h1>
${paragraphs(c.intro)}
${kids.length ? `<h2>${a.level === 'region' ? 'Tỉnh / thành phố' : 'Quận / huyện'} thuộc ${escHtml(name)}</h2><ul class="seo-links">${kids.map((k) => `<li><a href="${escHtml(k.url)}">${escHtml(k.name)}</a>${k.n ? ` (${k.n} video)` : ''}</li>`).join('')}</ul>` : ''}
${vids.length ? `<h2>Video mới tại ${escHtml(name)}</h2><ul class="seo-links">${vids.map((v) => `<li><a href="/v/${v.id}">${escHtml(cut(v.caption || 'Video của ' + v.user.name, 90))}</a></li>`).join('')}</ul>` : ''}
${kw.length ? `<p class="seo-kw"><b>Từ khóa:</b> ${kw.map(escHtml).join(' · ')}</p>` : ''}
<p><a href="/#/regions/${a.region}${a.province ? '/' + encodeURIComponent(a.province) : ''}${a.district ? '/' + encodeURIComponent(a.district) : ''}">Xem video và làm quen tại ${escHtml(name)}</a></p>
</div>`;
    const ld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: crumbs.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: base + x.url })) },
      { '@type': 'CollectionPage', name: c.title, description: c.description, url: base + urlOf(a), inLanguage: 'vi-VN', isPartOf: { '@type': 'WebSite', name: 'xgaigu', url: base + '/' } },
    ] };
    const route = '/regions/' + a.region + (a.province ? '/' + encodeURIComponent(a.province) : '') + (a.district ? '/' + encodeURIComponent(a.district) : '');
    return shell(req, { title: c.title, description: c.description, keywords: c.keywords, canonical: urlOf(a), ld, route, main });
  }

  function indexHtml(req) {
    const rows = counts(), base = baseOf(req);
    const main = `<div class="wrap prose seo-area">
<nav class="crumbs"><a href="/">Trang chủ</a> › <span>Khu vực</span></nav>
<h1>Làm quen & hẹn hò theo khu vực – Miền Bắc, Miền Trung, Miền Nam</h1>
<p>Chọn khu vực để xem video giới thiệu, nhắn tin làm quen, xem livestream và hẹn gặp an toàn trên xgaigu.com. Dành cho người từ 18 tuổi trở lên.</p>
<ul class="seo-links">${Object.keys(REGIONS).map((r) => `<li><a href="${urlOf({ level: 'region', region: r })}">${REGIONS[r]}</a> – ${GEO[r].length} tỉnh/thành, ${sumWhere(rows, (x) => x.region === r)} video</li>`).join('')}</ul>
</div>`;
    const title = 'Làm quen & hẹn hò theo khu vực – Bắc, Trung, Nam | xgaigu';
    const description = 'Chọn khu vực Miền Bắc, Miền Trung, Miền Nam để xem video giới thiệu, làm quen, chat và hẹn gặp an toàn trên xgaigu.com. Dành cho người từ 18 tuổi.';
    const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url: base + '/khu-vuc', inLanguage: 'vi-VN' };
    return shell(req, { title, description, keywords: 'làm quen theo khu vực, hẹn hò miền Bắc, hẹn hò miền Trung, hẹn hò miền Nam, xgaigu', canonical: '/khu-vuc', ld, route: '/regions', main });
  }

  const send = (res, html) => res.set('Cache-Control', 'public, max-age=600').type('html').send(html);
  app.get('/khu-vuc', (req, res) => send(res, indexHtml(req)));
  app.get(/^\/khu-vuc\/([a-z0-9-]+(?:\/[a-z0-9-]+){0,2})\/?$/, (req, res, next) => {
    const a = byPath.get(req.params[0]);
    if (!a) { res.status(404); return next(); } // unknown area: real 404 status, not a soft 404
    send(res, areaHtml(req, a));
  });

  // ---------- public JSON for the app ----------
  app.get('/api/area-info', (req, res) => {
    const a = GEO_OK(String(req.query.region || ''), String(req.query.province || ''), String(req.query.district || ''));
    if (!a) return fail(res, 404, 'Không tìm thấy khu vực');
    const rows = counts(), c = content(a, rows);
    res.json({ name: a.level === 'region' ? nameOf(a) : fullName(a), title: c.title, description: c.description, intro: c.intro,
      keywords: c.keywords.split(',').map((x) => x.trim()).filter(Boolean), url: urlOf(a) });
  });

  // ---------- admin editing ----------
  const parse = (src) => GEO_OK(String(src.region || ''), String(src.province || ''), String(src.district || ''));
  app.get('/api/admin/area-seo', needAdmin, (req, res) => {
    const a = parse(req.query);
    if (!a) return fail(res, 400, 'Hãy chọn khu vực (ít nhất là miền)');
    const rows = counts();
    res.json({ key: keyOf(a), url: urlOf(a), saved: saved(a), defaults: defaults(a, rows) });
  });
  app.put('/api/admin/area-seo', needAdmin, (req, res) => {
    const a = parse(req.body);
    if (!a) return fail(res, 400, 'Khu vực không hợp lệ');
    const f = { title: clean(req.body.title, 120), description: clean(req.body.description, 300), keywords: clean(req.body.keywords, 600), intro: String(req.body.intro || '').replace(/\r/g, '').trim().slice(0, 6000) };
    if (!f.title && !f.description && !f.keywords && !f.intro) db.prepare('DELETE FROM area_seo WHERE key = ?').run(keyOf(a));
    else db.prepare('INSERT INTO area_seo (key, title, description, keywords, intro, updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET title=excluded.title, description=excluded.description, keywords=excluded.keywords, intro=excluded.intro, updated_at=excluded.updated_at')
      .run(keyOf(a), f.title, f.description, f.keywords, f.intro, now());
    res.json({ ok: true, url: urlOf(a) });
  });

  // ---------- robots.txt and sitemap.xml ----------
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /uploads/wm/\n\nSitemap: ${baseOf(req)}/sitemap.xml\n`);
  });
  app.get('/sitemap.xml', (req, res) => {
    const base = baseOf(req), rows = counts(), today = new Date().toISOString().slice(0, 10);
    const custom = new Set(db.prepare('SELECT key FROM area_seo').all().map((r) => r.key));
    const urls = [{ loc: '/', pri: '1.0' }, { loc: '/khu-vuc', pri: '0.9' }];
    for (const a of byPath.values()) {
      if (a.level === 'district' && !custom.has(keyOf(a)) && !totalOf(a, rows)) continue; // skip empty districts (thin pages)
      urls.push({ loc: urlOf(a), pri: a.level === 'region' ? '0.8' : a.level === 'province' ? '0.7' : '0.5', mod: today });
    }
    for (const v of db.prepare('SELECT v.id, v.created_at FROM videos v JOIN users u ON u.id = v.user_id WHERE v.hidden = 0 AND u.banned = 0 ORDER BY v.id DESC LIMIT 5000').all())
      urls.push({ loc: '/v/' + v.id, pri: '0.4', mod: new Date(v.created_at).toISOString().slice(0, 10) });
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map((u) => `<url><loc>${escHtml(base + u.loc)}</loc>${u.mod ? `<lastmod>${u.mod}</lastmod>` : ''}<priority>${u.pri}</priority></url>`).join('\n') + '\n</urlset>\n';
    res.set('Cache-Control', 'public, max-age=3600').type('application/xml').send(xml);
  });
}

module.exports = { install, REGIONS };
