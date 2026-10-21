// One-off patch: a shareable "install the app" link (xgaigu.com/app) + admin tools to copy / share it, with QR code and visit counts.
const fs = require('fs');
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};

// ---------- server: landing page with link-preview tags, sitemap ----------
rep('src/seo.js', "  app.get('/khu-vuc', (req, res) => send(res, indexHtml(req)));", `  app.get('/khu-vuc', (req, res) => send(res, indexHtml(req)));
  // The link the admin shares: one tap on it opens a page that installs the app
  app.get(['/app', '/tai-ung-dung'], (req, res) => {
    const base = baseOf(req), title = 'Tải ứng dụng xgaigu – cài về máy chỉ một chạm', description = 'Cài ứng dụng xgaigu thẳng vào điện thoại, không cần CH Play hay App Store. Xem video, làm quen, chat và hẹn gặp an toàn. Dành cho người từ 18 tuổi.';
    const main = '<div class="wrap prose"><h1>Tải ứng dụng xgaigu</h1><p>' + escHtml(description) + '</p><p><a href="/">Vào xgaigu.com</a></p></div>';
    const ld = { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: base + '/app', inLanguage: 'vi-VN' };
    send(res, shell(req, { title, description, keywords: 'tải ứng dụng xgaigu, cài app xgaigu, xgaigu', canonical: '/app', ld, route: '/install', main }));
  });`);
rep('src/seo.js', "const urls = [{ loc: '/', pri: '1.0' }, { loc: '/khu-vuc', pri: '0.9' }];", "const urls = [{ loc: '/', pri: '1.0' }, { loc: '/app', pri: '0.7' }, { loc: '/khu-vuc', pri: '0.9' }];");

// ---------- server: count visits of the link ----------
rep('server.js', "const kind = ['click', 'install', 'open'].includes(req.body.kind) ? req.body.kind : null;", "const kind = ['click', 'install', 'open', 'visit'].includes(req.body.kind) ? req.body.kind : null;");
rep('server.js', "kind === 'open' ? 6 : kind === 'click' ? 1 : 24 * 365)", "kind === 'open' ? 6 : kind === 'click' || kind === 'visit' ? 1 : 24 * 365)");
rep('server.js', "res.json({ click: block('click'), install: block('install'), open: block('open'), byDevice, daily });", "res.json({ visit: block('visit'), click: block('click'), install: block('install'), open: block('open'), byDevice, daily });");

// ---------- client: Install helpers exported ----------
rep('public/js/app.js', "  return { run, button, standalone };", "  return { run, button, standalone, ios, inAppBrowser, report };");

// ---------- client: landing page ----------
rep('public/js/app.js', "async function pageAdmin() {", `// Landing page behind the shared link (xgaigu.com/app): one clear button that installs the app
function pageInstall() {
  Install.report('visit');
  document.title = 'Tải ứng dụng xgaigu – cài về máy chỉ một chạm';
  const installed = Install.standalone();
  const android = /android/i.test(navigator.userAgent), here = location.origin + '/app';
  const step = (n, t) => h('li', { style: 'display:flex;gap:12px;align-items:flex-start;padding:8px 0' }, h('span', { class: 'stepn' }, String(n)), h('span', {}, t));
  const hint = Install.inAppBrowser()
    ? h('div', { class: 'card inst-note' }, h('b', {}, '⚠️ Bạn đang mở trong Facebook / Zalo / Messenger'), h('p', { class: 'muted' }, 'Trình duyệt này không cài được ứng dụng. Hãy mở bằng Chrome (Android) hoặc Safari (iPhone) rồi bấm lại nút cài đặt.'),
      android && h('a', { class: 'btn primary', style: 'margin-top:8px', href: 'intent://' + location.host + '/app#Intent;scheme=https;package=com.android.chrome;end' }, 'Mở bằng Chrome'),
      h('button', { class: 'btn', type: 'button', style: 'margin-top:8px', onclick: async () => { try { await navigator.clipboard.writeText(here); toast('Đã sao chép liên kết, hãy dán vào trình duyệt'); } catch { toast(here); } } }, 'Sao chép liên kết'))
    : Install.ios()
      ? h('div', { class: 'card inst-note' }, h('b', {}, 'Cài trên iPhone / iPad (mở bằng Safari)'), h('ol', { style: 'list-style:none;padding:0;margin:8px 0 0' }, step(1, 'Bấm nút Chia sẻ ⬆️ ở thanh dưới của Safari.'), step(2, 'Chọn “Thêm vào Màn hình chính”.'), step(3, 'Bấm “Thêm”, biểu tượng XG sẽ hiện trên màn hình.')))
      : h('p', { class: 'muted', style: 'font-size:14px' }, 'Bấm nút trên, chọn “Cài đặt” khi trình duyệt hỏi. Biểu tượng XG sẽ xuất hiện ngay trên màn hình.');
  main.append(h('div', { class: 'wrap', style: 'padding:36px 0' }, h('div', { class: 'inst-hero' },
    h('img', { src: '/icons/icon-192.png', alt: 'xgaigu', width: 96, height: 96, style: 'border-radius:24px;box-shadow:0 14px 40px rgba(255,46,126,.45)' }),
    h('h1', { class: 'title', style: 'margin:18px 0 8px;font-size:30px' }, installed ? 'Bạn đã cài ứng dụng xgaigu ✅' : 'Cài ứng dụng xgaigu'),
    h('p', { class: 'muted', style: 'max-width:420px;margin:0 auto 22px;line-height:1.6' }, installed ? 'Bạn đang dùng ứng dụng. Mọi cập nhật của website tự có trong ứng dụng.' : 'Một chạm là có ngay trên màn hình điện thoại, không cần CH Play hay App Store. Ứng dụng luôn đồng bộ với website.'),
    installed ? h('a', { class: 'btn primary lg', href: '#/' }, 'Vào xgaigu')
      : h('button', { type: 'button', class: 'btn primary lg inst-btn', onclick: () => Install.run(), html: '<span aria-hidden="true">📲</span><span>Cài đặt ứng dụng</span>' }),
    !installed && h('div', { style: 'margin-top:22px;text-align:left;max-width:440px;margin-inline:auto' }, hint),
    h('p', { style: 'margin-top:26px' }, h('a', { href: '#/welcome', class: 'muted' }, 'Xem giới thiệu xgaigu')))), footer());
}

async function pageAdmin() {`);
rep('public/js/app.js', "    if (a === 'terms') return pageTerms();", "    if (a === 'terms') return pageTerms();\n    if (a === 'install') return pageInstall();");

// ---------- client: admin card to share the link ----------
rep('public/js/app.js', "  // video optimisation: shrink big videos so they load fast", `  // shareable install link + QR code
  const shareBox = (() => {
    const link = location.origin + '/app', text = 'Tải ứng dụng xgaigu về máy chỉ một chạm: ';
    const qrBox = h('div', { style: 'background:#fff;padding:12px;border-radius:14px;width:fit-content;min-height:60px' }, h('span', { style: 'color:#555;font-size:13px' }, 'Đang tạo mã QR…'));
    let qr = null;
    const draw = () => { try { qrBox.replaceChildren(); qrBox.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 0, scalable: true }); const s = qrBox.querySelector('svg'); if (s) { s.setAttribute('width', 190); s.setAttribute('height', 190); } } catch { qrBox.textContent = 'Không tạo được mã QR'; } };
    const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
    sc.onload = () => { try { qr = window.qrcode(0, 'M'); qr.addData(link); qr.make(); draw(); } catch { qrBox.textContent = 'Không tạo được mã QR'; } };
    sc.onerror = () => { qrBox.textContent = 'Không tải được thư viện mã QR'; };
    document.head.append(sc);
    const copy = async () => { try { await navigator.clipboard.writeText(link); toast('Đã sao chép liên kết'); } catch { prompt('Sao chép liên kết này:', link); } };
    const open = (u) => window.open(u, '_blank', 'noopener');
    const png = () => {
      if (!qr) return toast('Mã QR chưa sẵn sàng', true);
      const n = qr.getModuleCount(), cell = 12, pad = 24, c = document.createElement('canvas'); c.width = c.height = n * cell + pad * 2;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000';
      for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) if (qr.isDark(r, q)) g.fillRect(pad + q * cell, pad + r * cell, cell, cell);
      c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'xgaigu-tai-ung-dung-qr.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
    };
    return h('section', { style: 'margin-bottom:34px' }, h('h2', { class: 'title', style: 'margin-bottom:12px' }, 'Link tải ứng dụng'),
      h('div', { class: 'card', style: 'padding:18px;display:grid;gap:14px' },
        h('p', { class: 'muted', style: 'font-size:14px' }, 'Gửi liên kết này cho khách. Khách chỉ cần bấm vào, trang sẽ mở ra với nút “Cài đặt ứng dụng”, bấm thêm một lần là ứng dụng được cài vào máy (iPhone sẽ có hướng dẫn 3 bước).'),
        h('div', { class: 'row', style: 'gap:8px;flex-wrap:nowrap' }, h('input', { readonly: true, value: link, style: 'flex:1;min-width:0', onclick: (e) => e.target.select() }), h('button', { class: 'btn primary', type: 'button', onclick: copy }, 'Sao chép')),
        h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' },
          navigator.share && h('button', { class: 'btn', type: 'button', onclick: () => navigator.share({ title: 'Ứng dụng xgaigu', text, url: link }).catch(() => {}) }, 'Chia sẻ…'),
          h('button', { class: 'btn', type: 'button', onclick: () => open('https://zalo.me/share?url=' + encodeURIComponent(link)) }, 'Zalo'),
          h('button', { class: 'btn', type: 'button', onclick: () => open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link)) }, 'Facebook'),
          h('button', { class: 'btn', type: 'button', onclick: () => open('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text)) }, 'Telegram'),
          h('a', { class: 'btn', href: '/app', target: '_blank', rel: 'noopener' }, 'Xem trang tải')),
        h('div', { class: 'row', style: 'gap:18px;align-items:flex-end;flex-wrap:wrap' }, qrBox, h('div', { style: 'display:grid;gap:8px' }, h('span', { class: 'muted', style: 'font-size:13px' }, 'Mã QR: in ra hoặc đăng lên để khách quét bằng camera.'), h('button', { class: 'btn', type: 'button', onclick: png }, 'Tải mã QR (PNG)'))),
        h('p', { class: 'muted', style: 'font-size:13px' }, 'Lượt vào link này được đếm trong mục “Thống kê ứng dụng”.')));
  })();
  // video optimisation: shrink big videos so they load fast`);
rep('public/js/app.js', "trafficBox, videosBox, optBox, seoBox, mailBox, membersBox, statBox,", "trafficBox, shareBox, statBox, videosBox, optBox, seoBox, mailBox, membersBox,");
rep('public/js/app.js', "      kv('Lượt bấm “Tải ứng dụng”', st.click),", "      kv('Lượt vào link tải ứng dụng', st.visit, 'Số lần khách mở trang xgaigu.com/app.'), kv('Lượt bấm “Tải ứng dụng”', st.click),");

fs.appendFileSync('public/css/app.css', `
/* install landing page */
.inst-hero{text-align:center;max-width:560px;margin:0 auto}
.inst-btn{min-height:60px;font-size:19px;gap:10px;padding-inline:34px;background:#e5213c;border-color:#e5213c;box-shadow:0 12px 34px rgba(229,33,60,.5)}
.inst-note{padding:16px 18px;margin-top:6px}
.stepn{flex:none;width:26px;height:26px;border-radius:50%;background:var(--grad);display:grid;place-items:center;font-weight:800;font-size:13px}
`);
console.log('patched');
