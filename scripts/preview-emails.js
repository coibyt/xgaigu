// Renders every email to files so the design can be reviewed in a browser:  node scripts/preview-emails.js [outDir]
const fs = require('fs');
const path = require('path');
const T = require('../src/mail-templates');
const out = process.argv[2] || path.join(__dirname, '..', 'data', 'email-preview');
fs.mkdirSync(out, { recursive: true });
const base = process.env.SITE_URL || 'https://xgaigu.com';
const samples = {
  verify: T.verify({ name: 'Ngọc Anh', url: base + '/verify?token=abc123def456abc123def456abc123def456abc123def456' }),
  welcome: T.welcome({ name: 'Ngọc Anh', url: base + '/' }),
  reset: T.reset({ name: 'Ngọc Anh', url: base + '/reset?token=abc123def456abc123def456abc123def456abc123def456' }),
  'password-changed': T.passwordChanged({ name: 'Ngọc Anh', when: '19/10/2026 21:05 (giờ Việt Nam)', resetUrl: base + '/forgot' }),
  campaign: T.campaign({ name: 'Ngọc Anh', subject: 'Video mới quanh bạn tuần này', text: 'Chào {name},\n\nTuần này có nhiều video mới tại khu vực của bạn. Hãy ghé xem và làm quen với những gương mặt mới nhé.\n\nChúc bạn một tuần thật vui!', cta: { label: 'Xem video mới', url: base + '/khu-vuc' }, unsubscribeUrl: base + '/unsubscribe?u=1&t=x' }),
  test: T.test(),
};
for (const [k, v] of Object.entries(samples)) { fs.writeFileSync(path.join(out, k + '.html'), v.html); fs.writeFileSync(path.join(out, k + '.txt'), v.text); console.log(k, '-', v.subject); }
