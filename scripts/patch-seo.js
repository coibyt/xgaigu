// One-off patch: wire the SEO area pages (src/seo.js) into the server, the app and the admin page.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---------- db ----------
rep('src/db.js', 'CREATE TABLE IF NOT EXISTS reports (', `CREATE TABLE IF NOT EXISTS area_seo (
  key TEXT PRIMARY KEY,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  keywords TEXT DEFAULT '',
  intro TEXT DEFAULT '',
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (`);

// ---------- server ----------
rep('server.js', "app.get('/v/:id(\\\\d+)', (req, res) => renderPage(", "require('./src/seo').install(app, { db, GEO, listVideos, escHtml, cut, needAdmin, fail, clean, now, assetV: () => ASSET_V });\napp.get('/v/:id(\\\\d+)', (req, res) => renderPage(");

// ---------- client: real URL -> app route ----------
rep('public/js/app.js', "  const [path, query] = (location.hash.slice(1) || '/').split('?');", "  const [path, query] = (location.hash.slice(1) || (document.querySelector('meta[name=\"xg-route\"]') || {}).content || '/').split('?');");

// ---------- client: regions page shows intro + keywords ----------
rep('public/js/app.js', "  const [geo, { areas }] = await Promise.all([loadGeo(), api('/areas')]);\n  const sum =",
`  const infoQ = new URLSearchParams({ region: reg || '', province: prov || '', district: dist || '' });
  const [geo, { areas }, info] = await Promise.all([loadGeo(), api('/areas'), reg ? api('/area-info?' + infoQ).catch(() => null) : null]);
  document.title = info ? info.title : 'Làm quen & hẹn hò theo khu vực – Bắc, Trung, Nam | xgaigu';
  const seoBox = (i) => (i ? h('section', { class: 'seo-box' }, h('div', { class: 'seo-intro' }, i.intro), h('div', { class: 'facts', style: 'margin-top:14px' }, i.keywords.map((k) => h('span', { class: 'fact tag' }, k)))) : null);
  const sum =`);
rep('public/js/app.js', "h('div', { class: 'filters' }, filter), grid);", "h('div', { class: 'filters' }, filter), grid, seoBox(info));");
rep('public/js/app.js', "    wrap.append(h('h2', { class: 'title' }, dist || prov), chips, grid);", "    wrap.append(h('h2', { class: 'title' }, dist || prov), chips, grid, seoBox(info));");

// footer link (a real link, so crawlers find the area pages from every page)
rep('public/js/app.js', "h('a', { href: '#/welcome' }, 'Giới thiệu'),", "h('a', { href: '/khu-vuc' }, 'Khu vực'), h('a', { href: '#/welcome' }, 'Giới thiệu'),");

// ---------- client: admin editor ----------
rep('public/js/app.js', "  main.append(h('div', { class: 'wrap', style: 'padding:32px 0' }, trafficBox, videosBox, membersBox, statBox,", `  // SEO text of every area (region / province / district)
  const geoSeo = geoPicker();
  const sf = { title: h('input', { maxlength: 120, placeholder: 'Tiêu đề trang (nên dưới 60 ký tự)' }), description: h('textarea', { rows: 3, maxlength: 300, placeholder: 'Mô tả ngắn hiện trên Google (nên 120–160 ký tự)' }),
    keywords: h('textarea', { rows: 2, maxlength: 600, placeholder: 'Từ khóa, cách nhau bằng dấu phẩy' }), intro: h('textarea', { rows: 10, maxlength: 6000, placeholder: 'Nội dung giới thiệu khu vực. Để trống một dòng giữa các đoạn.' }) };
  const seoInfo = h('p', { class: 'muted', style: 'font-size:14px;margin:8px 0 12px' }, 'Chọn khu vực ở trên (ít nhất là miền) để sửa.');
  const counter = (el, n) => { const c = h('small', { class: 'muted' }); const u = () => { c.textContent = el.value.length + ' ký tự' + (n ? ' (nên ≤ ' + n + ')' : ''); c.style.color = n && el.value.length > n ? '#fbbf24' : ''; }; el.addEventListener('input', u); u(); return [c, u]; };
  const [cTitle, uTitle] = counter(sf.title, 60), [cDesc, uDesc] = counter(sf.description, 160);
  let seoDef = null, seoUrl = '';
  const seoView = h('a', { class: 'btn sm', target: '_blank', rel: 'noopener', hidden: true }, 'Xem trang này');
  const seoBody = () => { const [r, p, d] = geoSeo.el.querySelectorAll('select'); return { region: r.value, province: p.value, district: d.value }; };
  const loadSeo = async () => {
    const b = seoBody();
    if (!b.region) { seoInfo.textContent = 'Chọn khu vực ở trên (ít nhất là miền) để sửa.'; seoView.hidden = true; seoDef = null; return; }
    try {
      const d = await api('/admin/area-seo?' + new URLSearchParams(b));
      seoDef = d.defaults; seoUrl = d.url;
      const s = d.saved || {};
      sf.title.value = s.title || ''; sf.description.value = s.description || ''; sf.keywords.value = s.keywords || ''; sf.intro.value = s.intro || '';
      sf.title.placeholder = d.defaults.title; sf.description.placeholder = d.defaults.description; sf.keywords.placeholder = d.defaults.keywords; sf.intro.placeholder = d.defaults.intro;
      uTitle(); uDesc();
      seoInfo.textContent = d.saved ? 'Khu vực này đang dùng nội dung bạn đã viết.' : 'Khu vực này đang dùng nội dung tự động (hiện mờ trong các ô). Hãy viết nội dung riêng để tăng SEO.';
      seoView.href = d.url; seoView.hidden = false;
    } catch (e) { fail(e); }
  };
  geoSeo.el.addEventListener('change', () => setTimeout(loadSeo, 0));
  const seoForm = h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px' },
    h('label', { class: 'f' }, h('span', {}, 'Tiêu đề SEO'), sf.title, cTitle), h('label', { class: 'f' }, h('span', {}, 'Mô tả SEO (meta description)'), sf.description, cDesc),
    h('label', { class: 'f' }, h('span', {}, 'Từ khóa'), sf.keywords), h('label', { class: 'f' }, h('span', {}, 'Nội dung giới thiệu khu vực'), sf.intro),
    h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' },
      h('button', { class: 'btn primary', type: 'button', onclick: async () => { const b = seoBody(); if (!b.region) return toast('Hãy chọn khu vực', true); try { await api('/admin/area-seo', { method: 'PUT', body: { ...b, title: sf.title.value, description: sf.description.value, keywords: sf.keywords.value, intro: sf.intro.value } }); toast('Đã lưu nội dung SEO'); loadSeo(); } catch (e) { fail(e); } } }, 'Lưu'),
      h('button', { class: 'btn', type: 'button', onclick: () => { if (!seoDef) return toast('Hãy chọn khu vực', true); sf.title.value = seoDef.title; sf.description.value = seoDef.description; sf.keywords.value = seoDef.keywords; sf.intro.value = seoDef.intro; uTitle(); uDesc(); } }, 'Điền nội dung mẫu để sửa'),
      h('button', { class: 'btn', type: 'button', onclick: () => { sf.title.value = sf.description.value = sf.keywords.value = sf.intro.value = ''; uTitle(); uDesc(); toast('Đã xoá nội dung, bấm Lưu để quay về nội dung tự động'); } }, 'Về nội dung tự động'), seoView));
  const seoBox = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'SEO khu vực'),
    h('p', { class: 'muted', style: 'font-size:14px;margin-bottom:12px' }, 'Nội dung này hiện trên trang khu vực (xgaigu.com/khu-vuc/…) và trong kết quả Google. Hãy viết tự nhiên, đúng sự thật, và đừng nhồi nhét từ khóa.'), geoSeo.el, seoInfo, seoForm);
  main.append(h('div', { class: 'wrap', style: 'padding:32px 0' }, trafficBox, videosBox, seoBox, membersBox, statBox,`);

fs.appendFileSync('public/css/app.css', `
/* SEO area pages */
.seo-box{margin-top:30px;padding:22px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface)}
.seo-intro{white-space:pre-line;line-height:1.65;color:#d6c9e2}
.seo-area ul.seo-links{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:6px 18px}
.seo-area .seo-links a{color:#ffb3cd}
.seo-area .crumbs{margin-bottom:10px}
.seo-kw{color:var(--muted);font-size:14px}
`);
console.log('patched');
