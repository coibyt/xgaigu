const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const { DATA_DIR } = require('./paths');

const db = new DatabaseSync(path.join(DATA_DIR, 'xgaigu.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  gender TEXT DEFAULT '',
  city TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  show_phone INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user',
  banned INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caption TEXT DEFAULT '',
  file TEXT DEFAULT '',
  url TEXT DEFAULT '',
  hidden INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS likes (
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, user_id)
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  kind TEXT DEFAULT 'text',
  read INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(from_id, to_id);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER,
  from_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  when_at INTEGER NOT NULL,
  place TEXT NOT NULL,
  note TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS streams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  source TEXT DEFAULT '',
  live INTEGER DEFAULT 1,
  started_at INTEGER NOT NULL,
  ended_at INTEGER
);
CREATE TABLE IF NOT EXISTS translations (
  lang TEXT NOT NULL,
  src TEXT NOT NULL,
  out TEXT NOT NULL,
  PRIMARY KEY (lang, src)
);
CREATE TABLE IF NOT EXISTS app_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  did TEXT NOT NULL,
  kind TEXT NOT NULL,
  device TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_events_kind ON app_events(kind, created_at);
CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER NOT NULL,
  followee_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);
CREATE TABLE IF NOT EXISTS presence (
  did TEXT NOT NULL,
  day TEXT NOT NULL,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (did, day)
);
CREATE INDEX IF NOT EXISTS idx_presence_last ON presence(last_seen);
CREATE TABLE IF NOT EXISTS video_activity (
  video_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_video_activity ON video_activity(video_id, at);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  resolved INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
`);

// Lightweight migrations for columns added after first release.
const userCols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
for (const [col, ddl] of [
  ['address', "address TEXT DEFAULT ''"],
  ['lat', 'lat REAL'],
  ['lng', 'lng REAL'],
  ['show_nearby', 'show_nearby INTEGER DEFAULT 1'],
  ['nickname', "nickname TEXT DEFAULT ''"],
  ['height', 'height INTEGER'],
  ['weight', 'weight INTEGER'],
  ['origin', "origin TEXT DEFAULT ''"],
  ['availability', "availability TEXT DEFAULT ''"],
  ['boundaries', "boundaries TEXT DEFAULT ''"],
  ['occupation', "occupation TEXT DEFAULT ''"],
  ['interests', "interests TEXT DEFAULT ''"],
  ['looking_for', "looking_for TEXT DEFAULT ''"],
  ['allow_calls', 'allow_calls INTEGER DEFAULT 1'],
]) if (!userCols.includes(col)) db.exec('ALTER TABLE users ADD COLUMN ' + ddl);

const videoCols = db.prepare('PRAGMA table_info(videos)').all().map((c) => c.name);
if (!videoCols.includes('thumb')) db.exec("ALTER TABLE videos ADD COLUMN thumb TEXT DEFAULT ''");
for (const [col, ddl] of [
  ['region', "region TEXT DEFAULT ''"],
  ['province', "province TEXT DEFAULT ''"],
  ['district', "district TEXT DEFAULT ''"],
  ['info', "info TEXT DEFAULT ''"],
  ['v_phone', "v_phone TEXT DEFAULT ''"],
  ['nickname', "nickname TEXT DEFAULT ''"],
  ['lat', 'lat REAL'],
  ['lng', 'lng REAL'],
  ['views', 'views INTEGER DEFAULT 0'],
  ['locked', 'locked INTEGER DEFAULT 0'],
  ['badge', "badge TEXT DEFAULT ''"],
  ['mod_note', "mod_note TEXT DEFAULT ''"],
]) if (!videoCols.includes(col)) db.exec('ALTER TABLE videos ADD COLUMN ' + ddl);

// Streams left "live" by a previous process are no longer live.
db.prepare('UPDATE streams SET live = 0, ended_at = ? WHERE live = 1').run(Date.now());

module.exports = db;
