// Live v2: the stream code moves to src/live.js (gifts, reactions, pinned comment, "Live bằng video" with loop).
const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('anchor not found in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}
function cut(file, from, to) { // remove [from, to)
  let s = fs.readFileSync(file, 'utf8');
  const a = s.indexOf(from), b = s.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error('cut markers not found in ' + file + ': ' + from.slice(0, 50));
  fs.writeFileSync(file, s.slice(0, a) + s.slice(b));
}

cut('server.js', '// ---------- livestream ----------', '// ---------- 1-to-1 video calls');
cut('server.js', '// WebRTC signaling relay (host <-> viewers)', '// ---------- reports & admin ----------');
edit('server.js', [
  ["  for (const room of rooms.values()) for (const c of room.clients.values()) c.res.write(': ping\\n\\n');\n", ''],
  ["const shop = require('./src/shop').install(", "require('./src/live').install(app, { db, fail, clean, now, needUser, postLimiter, sse, send, publicUser, rmUpload, faststart, UPLOAD_DIR, VIDEO_TYPES, IMAGE_TYPES });\nconst shop = require('./src/shop').install("],
  ["File quá lớn (tối đa 100MB)", "File quá lớn (video tối đa 100MB, video phát live tối đa 1GB, ảnh tối đa 8MB)"],
]);

edit('src/db.js', [
  ["db.prepare('UPDATE streams SET live = 0, ended_at = ? WHERE live = 1').run(Date.now());",
   "// (\"Live bằng video\" keeps playing: it does not depend on the host's browser.)\ndb.prepare(\"UPDATE streams SET live = 0, ended_at = ? WHERE live = 1 AND kind <> 'video'\").run(Date.now());"],
  ["CREATE TABLE IF NOT EXISTS shops (", `CREATE TABLE IF NOT EXISTS live_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stream_id INTEGER NOT NULL, user_id INTEGER NOT NULL, kind TEXT NOT NULL,
  body TEXT DEFAULT '', gift TEXT DEFAULT '', qty INTEGER DEFAULT 0, value INTEGER DEFAULT 0, at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_live_events_stream ON live_events(stream_id, id);
CREATE TABLE IF NOT EXISTS wallets (
  user_id INTEGER PRIMARY KEY, coins INTEGER NOT NULL DEFAULT 0, day TEXT DEFAULT '', received INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS shops (`],
  ["const videoCols = db.prepare('PRAGMA table_info(videos)')", `const streamCols = db.prepare('PRAGMA table_info(streams)').all().map((c) => c.name);
for (const [col, ddl] of [
  ['file', "file TEXT DEFAULT ''"],
  ['thumb', "thumb TEXT DEFAULT ''"],
  ['duration', 'duration REAL DEFAULT 0'],
  ['loop', 'loop INTEGER DEFAULT 0'],
  ['gifts', 'gifts INTEGER DEFAULT 0'],
  ['pinned', "pinned TEXT DEFAULT ''"],
]) if (!streamCols.includes(col)) db.exec('ALTER TABLE streams ADD COLUMN ' + ddl);

const videoCols = db.prepare('PRAGMA table_info(videos)')`],
]);
console.log('patched');
