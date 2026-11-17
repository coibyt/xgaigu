// Admin keyword sets (server part is in src/seo.js): each set has its keywords, where they are added,
// and whether it covers every area or only the areas the admin picks.
const fs = require('fs');
const file = 'public/js/app.js';
const L = fs.readFileSync(file, 'utf8').split('\n');
const a = L.findIndex((l) => l.includes("// the admin's own keywords, added to every area automatically"));
const b = L.findIndex((l) => l.startsWith("  const seoBox = h('section'"));
if (a < 0 || b < 0 || b < a) throw new Error('anchors');
const block = String.raw`  // the admin's own keyword sets: added automatically to every area, or only to the areas the admin picks
  const areaLabel = (k) => { const p = k.split('|'); return p[0] === 'qt' ? [countryName(p[1]), ...p.slice(2)].join(' › ') : [REGION_NAMES[p[0]] || p[0], ...p.slice(1)].join(' › '); };
  const areaKey = (x) => (x.region === 'qt' ? ['qt', x.country, x.province, x.district] : [x.region, x.province, x.district]).filter(Boolean).join('|');
  let kwSets = [];
  const setsBox = h('div', { style: 'display:grid;gap:12px' });
  const chk = (val, label, on) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!val, onchange: (e) => on(e.target.checked) }), h('span', {}, label));
  const drawSets = () => {
    setsBox.replaceChildren(...kwSets.map((s, i) => {
      const kw = h('textarea', { rows: 2, maxlength: 2000, placeholder: 'VD: Giá rẻ, Uy tín, Gần đây' }); kw.value = s.keywords || '';
      kw.addEventListener('input', () => { s.keywords = kw.value; });
      const cnt = h('input', { type: 'number', min: 0, max: 5, value: s.titleCount, style: 'width:64px', oninput: (e) => { s.titleCount = e.target.value; } });
      const nm = 'kwscope' + i + '_' + Math.random().toString(36).slice(2, 6);
      const scopeOpt = (val, label) => h('label', { class: 'check' }, h('input', { type: 'radio', name: nm, checked: (s.scope || 'all') === val, onchange: () => { s.scope = val; drawSets(); } }), h('span', {}, label));
      let pickBox = '';
      if (s.scope === 'some') {
        const gp = geoPicker({}, { countries: true });
        const read = () => {
          const v = (n) => ((gp.el.querySelector('[name="' + n + '"]') || {}).value || '').trim();
          const cc = gp.country();
          return cc === 'VN' ? { region: v('region'), province: v('province'), district: v('district') } : { region: 'qt', country: cc, province: v('province'), district: v('district') };
        };
        const add = h('button', { type: 'button', class: 'btn sm', onclick: () => {
          const x = read();
          if (x.region !== 'qt' && !x.region) return toast('Hãy chọn miền, hoặc chọn một nước khác', true);
          const k = areaKey(x);
          if (!s.areas.includes(k)) s.areas.push(k);
          drawSets();
        } }, '+ Thêm khu vực này');
        pickBox = h('div', { style: 'display:grid;gap:8px;padding:12px;border:1px dashed var(--line);border-radius:14px' },
          h('small', { class: 'muted' }, 'Chọn khu vực rồi bấm "Thêm". Chọn cả miền hoặc cả nước thì mọi tỉnh, quận bên trong cũng được áp dụng.'),
          gp.el, add,
          s.areas.length ? h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, s.areas.map((k) => h('span', { class: 'chip on', style: 'display:inline-flex;gap:6px;align-items:center' }, areaLabel(k),
            h('button', { type: 'button', 'aria-label': 'Bỏ', style: 'background:none;border:0;color:inherit;cursor:pointer;font-size:15px;padding:0', onclick: () => { s.areas = s.areas.filter((x) => x !== k); drawSets(); } }, '×'))))
            : h('small', { style: 'color:#fbbf24' }, 'Chưa chọn khu vực nào: bộ này sẽ chưa áp dụng ở đâu cả.'));
      }
      return h('div', { class: 'card', style: 'padding:14px;display:grid;gap:10px;background:var(--surface2)' },
        h('div', { class: 'row', style: 'justify-content:space-between;align-items:center' }, h('b', {}, 'Bộ từ khóa ' + (i + 1)),
          h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { if (confirm('Xoá bộ từ khóa này?')) { kwSets.splice(i, 1); drawSets(); } } }, 'Xoá')),
        kw,
        chk(s.withName, 'Tự ghép tên khu vực sau mỗi từ khóa (VD "Giá rẻ" → "Giá rẻ Bangkok")', (v) => { s.withName = v; }),
        h('div', { style: 'display:grid;gap:6px' }, h('small', { class: 'muted' }, 'Thêm vào:'),
          chk(s.inTitle, 'Tiêu đề SEO', (v) => { s.inTitle = v; }), h('label', { class: 'muted', style: 'font-size:13px;margin-left:28px' }, 'Số từ khóa của bộ này đưa vào tiêu đề: ', cnt),
          chk(s.inDesc, 'Mô tả SEO', (v) => { s.inDesc = v; }), chk(s.inIntro, 'Nội dung giới thiệu khu vực', (v) => { s.inIntro = v; }), chk(s.inKeywords, 'Ô từ khóa', (v) => { s.inKeywords = v; })),
        h('div', { style: 'display:grid;gap:6px' }, h('small', { class: 'muted' }, 'Áp dụng cho:'), scopeOpt('all', 'Tất cả khu vực (Việt Nam và các nước)'), scopeOpt('some', 'Chỉ những khu vực tôi chọn')),
        pickBox);
    }));
  };
  api('/admin/seo-global').then((g) => { kwSets = (g.sets || []).map((s) => ({ ...s, areas: [...(s.areas || [])] })); if (!kwSets.length) kwSets.push(newSet()); drawSets(); }).catch(() => {});
  const newSet = () => ({ keywords: '', inTitle: true, inDesc: true, inIntro: true, inKeywords: true, titleCount: 1, withName: false, scope: 'all', areas: [] });
  const globalCard = h('div', { class: 'card', style: 'padding:18px;display:grid;gap:12px;margin-bottom:16px;border-color:rgba(232,211,166,.35)' },
    h('b', {}, '🔑 Từ khóa riêng của bạn'),
    h('p', { class: 'muted', style: 'font-size:13.5px' }, 'Gõ từ khóa riêng, VD "Giá rẻ", rồi chọn áp dụng cho tất cả khu vực hay chỉ những khu vực bạn chọn. Từ khóa tự được thêm vào tiêu đề SEO, mô tả SEO, ô từ khóa và nội dung giới thiệu của các khu vực đó, cả nội dung mẫu lẫn nội dung bạn đã viết. Viết {khu vực} trong từ khóa để tự thay bằng tên nơi đó. Từ khóa đã có sẵn trong nội dung thì không thêm lần nữa.'),
    setsBox,
    h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' },
      h('button', { class: 'btn', type: 'button', onclick: () => { kwSets.push(newSet()); drawSets(); } }, '+ Thêm bộ từ khóa'),
      h('button', { class: 'btn primary', type: 'button', onclick: async () => {
        try { const r = await api('/admin/seo-global', { method: 'PUT', body: { sets: kwSets } }); kwSets = r.sets.map((s) => ({ ...s, areas: [...s.areas] })); if (!kwSets.length) kwSets.push(newSet()); drawSets(); toast('Đã lưu từ khóa riêng'); loadSeo(); } catch (e) { fail(e); }
      } }, 'Lưu từ khóa')));`;
L.splice(a, b - a, ...block.split('\n'));
fs.writeFileSync(file, L.join('\n'));
console.log('replaced lines', a + 1, 'to', b);
