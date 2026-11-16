// Members type their age instead of their birth year (sign-up, upload details, video edit); the birth year is still
// what is stored, worked out from the age, so everything that shows "x tuổi" keeps working.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}
edit('server.js', [
  ["  const birthYear = parseInt(req.body.birthYear, 10);\n  if (!/^[^@",
   "  const ageIn = parseInt(req.body.age, 10);\n  const birthYear = ageIn > 0 ? currentYear() - ageIn : parseInt(req.body.birthYear, 10);\n  if (!/^[^@"],
  ["  const by = int(b.birthYear, currentYear() - 100, currentYear() - 18);",
   "  const ageIn = parseInt(b.age, 10);\n  const by = int(ageIn > 0 ? currentYear() - ageIn : b.birthYear, currentYear() - 100, currentYear() - 18);"],
]);
edit('public/js/app.js', [
  ["h('label', { class: 'f' }, h('span', {}, 'Năm sinh'), h('input', { name: 'birthYear', type: 'number', min: thisYear - 100, max: thisYear - 18, placeholder: String(thisYear - 25), required: true })),",
   "h('label', { class: 'f' }, h('span', {}, 'Tuổi'), h('input', { name: 'age', type: 'number', inputmode: 'numeric', min: 18, max: 100, placeholder: 'VD: 25', required: true })),"],
  ["h('label', { class: 'f' }, h('span', {}, 'Năm sinh'), h('input', { value: u.birthYear, disabled: true, 'aria-describedby': 'by-note' }), h('small', { id: 'by-note' }, 'Không thể thay đổi sau khi đăng ký.')),",
   "h('label', { class: 'f' }, h('span', {}, 'Tuổi'), h('input', { value: u.birthYear ? new Date().getFullYear() - u.birthYear : '', disabled: true, 'aria-describedby': 'by-note' }), h('small', { id: 'by-note' }, 'Không thể thay đổi sau khi đăng ký.')),"],
  ["['Năm sinh', i.birthYear],", "['Tuổi', i.birthYear && new Date().getFullYear() - i.birthYear],"],
  ["field('Năm sinh', 'birthYear', { type: 'number', inputmode: 'numeric', value: me.birthYear || '' })",
   "field('Tuổi', 'age', { type: 'number', inputmode: 'numeric', min: 18, max: 100, placeholder: 'VD: 25', value: me.birthYear ? new Date().getFullYear() - me.birthYear : '' })"],
  ["input('birthYear', 'Năm sinh', i.birthYear, { inputmode: 'numeric' })",
   "input('age', 'Tuổi', i.birthYear ? new Date().getFullYear() - i.birthYear : '', { type: 'number', inputmode: 'numeric', min: 18, max: 100 })"],
]);
console.log('patched');
