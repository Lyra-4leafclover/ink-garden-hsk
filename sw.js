const V = 'inkgarden-v2';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/app.js', 'vendor/hanzi-writer.min.js', 'vendor/pinyin-pro.js', 'manifest.webmanifest', 'art/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return /\/(audio|art|data|vendor)\//.test(u.pathname) && hit ? hit : net.then(r => r || hit);
  }));
});
