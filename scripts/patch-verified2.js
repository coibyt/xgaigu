// Second half of the "Đã xác minh" patch (first half already applied by patch-verified.js up to the dialog checkbox).
const fs = require('fs');
const css = fs.readFileSync(__dirname + '/patch-verified.js', 'utf8').split('fs.appendFileSync(\'public/css/app.css\', `')[1].split('`);')[0];
const rep = (file, from, to) => {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.includes(from)) throw new Error('anchor not found in ' + file + ': ' + from.slice(0, 70));
  fs.writeFileSync(file, s.replace(from, () => to));
};
rep('public/js/app.js', "    own ? null : h('div', { class: 'row', style: 'margin-bottom:10px' }, badgeSel), own ? null : note,", "    own ? null : h('label', { class: 'check verify-tick' }, verChk, h('span', {}, h('b', {}, 'Đã xác minh'), ' – hiện huy hiệu xác minh nổi bật trên video này (chỉ admin được chọn)')), own ? null : h('div', { class: 'row', style: 'margin-bottom:10px' }, badgeSel), own ? null : note,");
rep('public/js/app.js', "      h('td', {}, '#' + x.id),", "      h('td', {}, '#' + x.id, x.verified && h('span', { title: 'Đã xác minh', style: 'color:#38bdf8;margin-left:4px' }, '✔')),");
fs.appendFileSync('public/css/app.css', css);
console.log('patched part 2');
