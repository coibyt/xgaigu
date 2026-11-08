// Link previews and Telegram posts always carry a picture: a frame from the video, or a designed card.
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}

edit('src/db.js', [
  ["  ['product_id', 'product_id INTEGER'],", "  ['product_id', 'product_id INTEGER'],\n  ['thumb_try', 'thumb_try INTEGER DEFAULT 0'],"],
]);

edit('server.js', [
  ["const transcode = require('./src/transcode').create(",
   "const thumbs = require('./src/thumbs').create({ ffmpeg: FFMPEG, db, uploadDir: UPLOAD_DIR });\nconst transcode = require('./src/transcode').create("],
  // a cover from the video itself when none was sent
  ["  if (file) setTimeout(() => transcode.enqueue('/uploads/' + file.filename, newId), 1500); // shrink for fast loading, in the background\n",
   "  if (file && !thumb) thumbs.ensureThumb(newId).catch(() => {}); // a cover picked from the video itself\n  if (file) setTimeout(() => transcode.enqueue('/uploads/' + file.filename, newId), 1500); // shrink for fast loading, in the background\n"],
  // link previews: the cover, else YouTube's, else the designed card
  ["  const image = v ? (abs(v.thumb) || (yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : '')) : '';",
   "  const image = v ? (abs(v.thumb) || (yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : '') || `${base}/og/v/${v.id}.jpg`) : '';\n  const isCard = !!v && image.endsWith('/og/v/' + v.id + '.jpg');\n  if (isCard && v.file) thumbs.ensureThumb(v.id).catch(() => {}); // next time the preview shows a frame of the video"],
  ["    ...(image ? [] : ['<meta property=\"og:image:width\" content=\"1200\">', '<meta property=\"og:image:height\" content=\"630\">']),",
   "    ...(image && !isCard ? [] : ['<meta property=\"og:image:width\" content=\"1200\">', '<meta property=\"og:image:height\" content=\"630\">']),\n    ...(v ? [`<meta property=\"og:image:alt\" content=\"${escHtml(title)}\">`] : []),"],
  ["function renderPage(req, res, v) {", `// the designed preview card of a video that has no picture
app.get('/og/v/:id(\\\\d+).jpg', async (req, res) => {
  const file = await thumbs.card(Number(req.params.id)).catch(() => '');
  if (!file) return res.redirect(302, '/img/og-default.png');
  res.set('Cache-Control', 'public, max-age=86400').type('jpg').sendFile(file);
});
function renderPage(req, res, v) {`],
  ["telegram = require('./src/telegram').install(app, { db, fail, clean, now, needUser, needAdmin, UPLOAD_DIR });",
   "telegram = require('./src/telegram').install(app, { db, fail, clean, now, needUser, needAdmin, UPLOAD_DIR, thumbs });"],
]);

edit('src/telegram.js', [
  ["function install(app, { db, fail, clean, now, needUser, needAdmin, UPLOAD_DIR }) {", "function install(app, { db, fail, clean, now, needUser, needAdmin, UPLOAD_DIR, thumbs }) {"],
  [`    // the video's cover picture, else the member's profile picture, else Telegram's own preview of the link
    const photo = localFile(v.thumb) || localFile(owner.avatar);`,
   `    // the video's cover, else a frame picked from the video, else a designed card; Telegram's own preview as a last resort
    const photo = localFile(v.thumb) || (thumbs ? await thumbs.pictureFile(v.id).catch(() => '') : '');`],
]);
console.log('patched');
