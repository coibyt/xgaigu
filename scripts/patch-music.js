// One-off: 12 more energetic remix styles x 25 = 300 more built-in tracks (600 total).
const fs = require('fs');
let s = fs.readFileSync('public/js/music.js', 'utf8');
const anchor = "const PER_STYLE = 25;";
if (!s.includes(anchor)) throw new Error('anchor');
const marker = "  { id: 'jazz',";
const i = s.indexOf(marker);
const end = s.indexOf('\n', i);
const add = `
  // ---- remix / party styles ----
  { id: 'vinahouse', name: 'Vinahouse Remix', bpm: [138, 146], swing: 0, k: 'x...x...x...x...', s: '....x.......x...', h: '..o...o...o...o.', chord: 'stab', cp: 'x..x..x.x..x..x.', bass: 'pump', lead: 'saw', pump: true, rev: 0.15, vol: 1 },
  { id: 'bassboost', name: 'Remix Bass Boost', bpm: [126, 134], swing: 0, k: 'x...x...x...x.x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', chord: 'stab', cp: 'x...x...x..x....', bass: '808', lead: 'saw', pump: true, rev: 0.15, vol: 1 },
  { id: 'dancepop', name: 'Dance Pop Remix', bpm: [118, 128], swing: 0, k: 'x...x...x...x...', s: '....x.......x...', h: '..o...o...o...o.', chord: 'pluck', cp: 'x.x.x.x.x.x.x.x.', bass: 'saw', lead: 'bell', pump: true, rev: 0.2, vol: 1 },
  { id: 'futurehouse', name: 'Future House', bpm: [124, 130], swing: 0, k: 'x...x...x...x...', s: '....x.......x...', h: '..o...o...o...o.', chord: 'stab', cp: 'x..x..x...x.x...', bass: 'pump', lead: 'saw', pump: true, rev: 0.2, vol: 1 },
  { id: 'tropical', name: 'Tropical House Remix', bpm: [100, 110], swing: 0, k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', chord: 'pluck', cp: 'x..x..x.x..x..x.', bass: 'sub', lead: 'bell', rev: 0.35, vol: 1 },
  { id: 'drill', name: 'Drill Remix', bpm: [140, 146], swing: 0, k: 'x.....x...x...x.', s: '........x.......', h: 'x.xxx.xxx.xxx.xx', chord: 'keys', bass: '808', lead: 'bell', rev: 0.25, vol: 1 },
  { id: 'reggaeton', name: 'Reggaeton Sôi Động', bpm: [92, 98], swing: 0, k: 'x..x..x.x..x..x.', s: '...x..x....x..x.', h: 'x.x.x.x.x.x.x.x.', chord: 'stab', cp: 'x..x..x.x..x..x.', bass: '808', lead: 'pluck', rev: 0.2, vol: 1 },
  { id: 'hardstyle', name: 'Hardstyle Mạnh', bpm: [150, 158], swing: 0, k: 'x...x...x...x...', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', chord: 'stab', cp: 'x.x.x.x.x.x.x.x.', bass: 'pump', lead: 'saw', pump: true, rev: 0.15, vol: 1 },
  { id: 'eurodance', name: 'Eurodance Remix', bpm: [128, 136], swing: 0, k: 'x...x...x...x...', s: '....x.......x...', h: '..o...o...o...o.', chord: 'arp16', bass: 'saw', lead: 'saw', rev: 0.25, vol: 1 },
  { id: 'techno', name: 'Techno Party', bpm: [128, 135], swing: 0, k: 'x...x...x...x...', s: '........x.......', h: '.xx..xx..xx..xx.', chord: 'arp16', bass: 'pump', lead: 'bell', pump: true, rev: 0.2, vol: 0.95 },
  { id: 'moombah', name: 'Moombahton Remix', bpm: [105, 112], swing: 0, k: 'x..x..x.x..x..x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', chord: 'stab', cp: 'x..x..x.x..x..x.', bass: '808', lead: 'pluck', rev: 0.2, vol: 1 },
  { id: 'kpopdance', name: 'Dance Remix Sôi Động', bpm: [118, 126], swing: 0, k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', chord: 'pluck', cp: 'x.x..x.x..x.x...', bass: 'disco', lead: 'bell', pump: true, rev: 0.2, vol: 1 },`;
s = s.slice(0, end) + add + s.slice(end);
s = s.replace(' * 300 original instrumental', ' * 600 original instrumental');
fs.writeFileSync('public/js/music.js', s);
console.log('ok');
