// Builds scripts/i18n/catalog.json: the list of Vietnamese interface strings that get translated.
// Run:  node scripts/i18n-catalog.js            (prints the catalog; add new strings to translations afterwards)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const files = ['public/js/app.js', 'public/js/editor.js', 'public/js/music.js', 'public/index.html', 'server.js'];
const vi = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const SKIP = new Set(['Ngôn ngữ không hợp lệ', 'Không tải được danh sách khu vực', 'Hà Nội']); // not shown to people
const EXTRA = ['Video', 'Live', 'Chat', 'Mic', 'Camera', 'Có {0} video và {1} thành viên quanh bạn', '{0} bài', 'Livestream', 'Bỏ qua điều hướng', 'Gặp gỡ qua video,', 'làm quen qua livestream'];
// Templates: {n} is filled with the dynamic part (a name, a number…), which lets each language put it where its grammar wants.
const TEMPLATES = ['{0} phút trước', '{0} giờ trước', '{0} ngày trước', 'Gọi cho {0}', 'Hẹn gặp {0}', 'Cuộc gọi nhỡ từ {0}', 'Đã chuyển sang {0}', 'Xem video của {0}',
  'Bạn mời {0}', 'Lời mời từ {0}', 'Biệt danh: {0}', 'Chèn {0}', 'Ảnh {0}', 'Clip {0}', 'Nghe thử {0}', 'Dừng nghe thử {0}', 'Đã gắn nhạc: {0}',
  'Không tạo được bài nhạc: {0}', 'Xuất video thất bại: {0}', 'Phóng to nhẹ khi chiếu: Bật', 'Phóng to nhẹ khi chiếu: Tắt', 'Video của {0}'];

// Stable order: strings already in catalog.json keep their index (translations are matched by position); new ones are appended.
const catalogPath = path.join(__dirname, 'i18n', 'catalog.json');
const set = fs.existsSync(catalogPath) ? JSON.parse(fs.readFileSync(catalogPath, 'utf8')) : [];
const add = (s) => { s = s.replace(/\s+/g, (m) => (m.length > 1 ? ' ' : m)); if (s.trim() && !set.includes(s) && !SKIP.has(s)) set.push(s); };
for (const f of files) {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
  let m;
  while ((m = re.exec(src))) {
    const s = (m[1] ?? m[2] ?? m[3]).replace(/\\'/g, "'");
    if (!vi.test(s) || /\$\{/.test(s)) continue;
    if (/<[^>]+>/.test(s)) { s.split(/<[^>]+>/).forEach((seg) => { if (vi.test(seg) && seg.trim()) add(seg); }); continue; } // text between html tags
    add(s);
  }
}
// visible text written directly in index.html (age gate etc.)
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
for (const m of html.matchAll(/>([^<>]+)</g)) if (vi.test(m[1])) add(m[1].trim());
EXTRA.forEach(add);
TEMPLATES.forEach(add);
fs.mkdirSync(path.join(__dirname, 'i18n'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'i18n', 'catalog.json'), JSON.stringify(set));
if (process.argv[2] === '--print') set.forEach((s, i) => console.log(i + '|' + s));
console.log(set.length + ' strings');
