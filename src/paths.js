// Where the SQLite file and uploaded media live.
//
// Hosting platforms (Hostinger included) rebuild the app folder on every deploy, so anything stored
// inside it is wiped. In production we therefore keep data in a folder OUTSIDE the app, under the
// account's home directory, unless DATA_DIR / UPLOAD_DIR are set to absolute paths.
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const PROD = process.env.NODE_ENV === 'production';

function writable(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); fs.accessSync(dir, fs.constants.W_OK); return true; } catch { return false; }
}

function pick(envValue, localDefault, persistentDefault) {
  if (envValue && path.isAbsolute(envValue)) return envValue;
  if (PROD && writable(persistentDefault)) return persistentDefault;
  return path.resolve(root, envValue || localDefault);
}

const base = path.join(os.homedir(), 'xgaigu-data');
const DATA_DIR = pick(process.env.DATA_DIR, 'data', path.join(base, 'db'));
const UPLOAD_DIR = pick(process.env.UPLOAD_DIR, 'uploads', path.join(base, 'uploads'));
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// One-time move: if the old in-app folders still hold data and the new ones are empty, copy it over.
function adopt(from, to, isDb) {
  try {
    if (path.resolve(from) === path.resolve(to) || !fs.existsSync(from)) return;
    if (isDb ? fs.existsSync(path.join(to, 'xgaigu.db')) : fs.readdirSync(to).length) return;
    for (const f of fs.readdirSync(from)) {
      if (f === '.gitkeep') continue;
      if (isDb && !f.startsWith('xgaigu.db')) continue;
      fs.copyFileSync(path.join(from, f), path.join(to, f));
    }
    console.log('Copied existing data from', from, 'to', to);
  } catch (e) { console.error('Could not copy old data:', e.message); }
}
adopt(path.join(root, 'data'), DATA_DIR, true);
adopt(path.join(root, 'uploads'), UPLOAD_DIR, false);

console.log('Data dir:', DATA_DIR, '| Uploads dir:', UPLOAD_DIR);
module.exports = { DATA_DIR, UPLOAD_DIR };
