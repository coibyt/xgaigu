// Admin "SEO khu vực": any country (not only Việt Nam), a preview of what Google shows, and the admin's own keywords
// added automatically to every area. Country pages in the app also show their SEO text.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}
edit('public/js/app.js', [
  ["  const geoSeo = geoPicker();\n", "  const geoSeo = geoPicker({}, { countries: true });\n"],
  ["  const seoInfo = h('p', { class: 'muted', style: 'font-size:14px;margin:8px 0 12px' }, 'Chọn khu vực ở trên (ít nhất là miền) để sửa.');",
   "  const seoInfo = h('p', { class: 'muted', style: 'font-size:14px;margin:8px 0 12px' }, 'Chọn quốc gia và khu vực ở trên (Việt Nam: ít nhất là miền; nước khác: chọn nước, có thể gõ thêm tỉnh / thành phố) để sửa.');\n" +
   "  const seoPrev = h('div', { class: 'seo-prev', hidden: true });"],
  ["  const seoBody = () => { const [r, p, d] = geoSeo.el.querySelectorAll('select'); return { region: r.value, province: p.value, district: d.value }; };",
   "  const seoBody = () => {\n" +
   "    const val = (n) => ((geoSeo.el.querySelector('[name=\"' + n + '\"]') || {}).value || '').trim();\n" +
   "    const cc = geoSeo.country();\n" +
   "    return cc === 'VN' ? { region: val('region'), province: val('province'), district: val('district') } : { region: 'qt', country: cc, province: val('province'), district: val('district') };\n" +
   "  };"],
  ["    if (!b.region) { seoInfo.textContent = 'Chọn khu vực ở trên (ít nhất là miền) để sửa.'; seoView.hidden = true; seoDef = null; return; }",
   "    if (!b.region) { seoInfo.textContent = 'Chọn khu vực ở trên (ít nhất là miền) để sửa.'; seoView.hidden = true; seoPrev.hidden = true; seoDef = null; return; }"],
  ["      seoView.href = d.url; seoView.hidden = false;\n",
   "      seoView.href = d.url; seoView.hidden = false;\n" +
   "      if (b.region === 'qt' && !d.total && !d.saved) seoInfo.textContent += ' Nơi này chưa có video: trang chỉ hiện trên Google sau khi bạn bấm Lưu hoặc khi có người đăng video ở đây.';\n" +
   "      seoPrev.hidden = false;\n" +
   "      seoPrev.replaceChildren(h('small', {}, 'Bản hiển thị trên Google (đã tự thêm từ khóa chung của bạn):'), h('div', { class: 'seo-prev-g' }, h('span', { class: 'seo-prev-url' }, location.host + d.url), h('b', {}, d.final.title), h('p', {}, d.final.description)));\n"],
  ["  geoSeo.el.addEventListener('change', () => setTimeout(loadSeo, 0));",
   "  let seoT = 0;\n  geoSeo.el.addEventListener('change', () => setTimeout(loadSeo, 0));\n  geoSeo.el.addEventListener('input', (e) => { if (e.target.tagName === 'INPUT') { clearTimeout(seoT); seoT = setTimeout(loadSeo, 800); } });"],
  ["  const seoBox = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'SEO khu vực'),\n    h('p', { class: 'muted', style: 'font-size:14px;margin-bottom:12px' }, 'Nội dung này hiện trên trang khu vực (xgaigu.com/khu-vuc/…) và trong kết quả Google. Hãy viết tự nhiên, đúng sự thật, và đừng nhồi nhét từ khóa.'), geoSeo.el, seoInfo, seoForm);",
   `  // the admin's own keywords, added to every area automatically
  const gk = { keywords: h('textarea', { rows: 3, maxlength: 2000, placeholder: 'VD: gái xinh {khu vực}, hẹn hò {khu vực}, kết bạn bốn phương' }),
    inTitle: h('input', { type: 'checkbox' }), inDesc: h('input', { type: 'checkbox' }), inIntro: h('input', { type: 'checkbox' }), inKeywords: h('input', { type: 'checkbox' }),
    titleCount: h('input', { type: 'number', min: 0, max: 5, style: 'width:70px' }) };
  api('/admin/seo-global').then((g) => { gk.keywords.value = (g.keywords || '').split(', ').filter(Boolean).join(', '); ['inTitle', 'inDesc', 'inIntro', 'inKeywords'].forEach((k) => { gk[k].checked = !!g[k]; }); gk.titleCount.value = g.titleCount; }).catch(() => {});
  const chk = (el, label) => h('label', { class: 'check' }, el, h('span', {}, label));
  const globalCard = h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px;margin-bottom:16px;border-color:rgba(232,211,166,.35)' },
    h('b', {}, '🔑 Từ khóa chung cho mọi khu vực'),
    h('p', { class: 'muted', style: 'font-size:13.5px' }, 'Các từ khóa này tự động được thêm vào MỌI khu vực (Việt Nam và các nước), cả nội dung mẫu lẫn nội dung bạn đã viết. Cách nhau bằng dấu phẩy. Viết {khu vực} để tự thay bằng tên nơi đó, VD "hẹn hò {khu vực}" → "hẹn hò Bangkok". Từ khóa nào đã có sẵn trong nội dung thì không thêm lần nữa.'),
    gk.keywords,
    h('div', { style: 'display:grid;gap:6px' }, chk(gk.inTitle, 'Thêm vào tiêu đề SEO'), h('label', { class: 'muted', style: 'font-size:13.5px;margin-left:28px' }, 'Số từ khóa thêm vào tiêu đề: ', gk.titleCount, ' (tiêu đề dài quá Google sẽ cắt bớt)'),
      chk(gk.inDesc, 'Thêm vào mô tả SEO'), chk(gk.inIntro, 'Thêm vào cuối nội dung giới thiệu khu vực'), chk(gk.inKeywords, 'Thêm vào ô từ khóa')),
    h('div', { class: 'row', style: 'gap:8px' }, h('button', { class: 'btn primary', type: 'button', onclick: async () => {
      try { await api('/admin/seo-global', { method: 'PUT', body: { keywords: gk.keywords.value, inTitle: gk.inTitle.checked, inDesc: gk.inDesc.checked, inIntro: gk.inIntro.checked, inKeywords: gk.inKeywords.checked, titleCount: gk.titleCount.value } }); toast('Đã lưu từ khóa chung, áp dụng cho mọi khu vực'); loadSeo(); } catch (e) { fail(e); }
    } }, 'Lưu từ khóa chung')));
  const seoBox = h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'SEO khu vực'),
    h('p', { class: 'muted', style: 'font-size:14px;margin-bottom:12px' }, 'Nội dung này hiện trên trang khu vực (xgaigu.com/khu-vuc/…) và trong kết quả Google, cho cả Việt Nam và các nước khác. Hãy viết tự nhiên, đúng sự thật, và đừng nhồi nhét từ khóa.'), globalCard, geoSeo.el, seoInfo, seoPrev, seoForm);`],
  // country pages in the app show their SEO text like Việt Nam areas do
  ["  const { areas: all } = await api('/areas');\n  const areas = all.filter((x) => x.region === 'qt' && x.country === cc);",
   "  const infoQ = new URLSearchParams({ region: 'qt', country: cc, province: prov || '', district: dist || '' });\n  const [{ areas: all }, info] = await Promise.all([api('/areas'), api('/area-info?' + infoQ).catch(() => null)]);\n  const areas = all.filter((x) => x.region === 'qt' && x.country === cc);\n  const seoBox = (i) => (i ? h('section', { class: 'seo-box' }, h('div', { class: 'seo-intro' }, i.intro), h('div', { class: 'facts', style: 'margin-top:14px' }, i.keywords.map((k) => h('span', { class: 'fact tag' }, k)))) : null);"],
  ["  document.title = (prov ? (dist ? dist + ', ' : '') + prov + ' – ' : '') + cname + ' – làm quen & hẹn hò | xgaigu';",
   "  document.title = info ? info.title : (prov ? (dist ? dist + ', ' : '') + prov + ' – ' : '') + cname + ' – làm quen & hẹn hò | xgaigu';"],
  ["    wrap.append(h('h2', { class: 'title', style: 'margin-bottom:16px' }, h('span', { class: 'cflag' }, flagOf(cc)), cname), provs.size > 8 ? h('div', { class: 'filters' }, filter) : '', grid);",
   "    wrap.append(h('h2', { class: 'title', style: 'margin-bottom:16px' }, h('span', { class: 'cflag' }, flagOf(cc)), cname), provs.size > 8 ? h('div', { class: 'filters' }, filter) : '', grid, seoBox(info));"],
  ["    wrap.append(h('h2', { class: 'title' }, dist || prov, count), chips, grid, pagerEl);",
   "    wrap.append(h('h2', { class: 'title' }, dist || prov, count), chips, grid, pagerEl, seoBox(info));"],
]);
fs.appendFileSync('public/css/app.css', `
.seo-prev{display:grid;gap:6px;margin:0 0 12px}
.seo-prev small{color:var(--muted);font-size:12.5px}
.seo-prev-g{background:#fff;color:#202124;border-radius:14px;padding:14px 16px;display:grid;gap:3px;font-family:Arial,sans-serif}
.seo-prev-g .seo-prev-url{font-size:12.5px;color:#4d5156;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.seo-prev-g b{color:#1a0dab;font-size:18px;font-weight:400;line-height:1.3}
.seo-prev-g p{font-size:13.5px;color:#4d5156;line-height:1.45}
`);
console.log('patched');
