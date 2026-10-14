// xgaigu service worker. The app IS the website: pages, scripts and data are always fetched from the
// network first, so every change on the site shows up in the app at once. The cache is only an offline fallback.
const CACHE = 'xg-shell-v1';
const SHELL = ['/', '/css/app.css', '/js/app.js', '/js/i18n.js', '/js/music.js', '/js/editor.js', '/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // live data, uploaded media (range requests) and the worker itself always go straight to the network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/') || url.pathname === '/sw.js' || req.headers.has('range')) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req.mode === 'navigate' ? '/' : req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req.mode === 'navigate' ? '/' : req);
      if (hit) return hit;
      throw err;
    }
  })());
});
