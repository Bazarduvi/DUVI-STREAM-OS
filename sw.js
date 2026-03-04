const CACHE = 'duvi-stream-v34';
const ASSETS = ['/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Network-first for API calls and media
  if (url.includes('groq.com') || url.includes('googleapis') ||
      url.includes('youtube.com') || url.includes('youtu.be') ||
      url.includes('img.youtube') || url.includes('fonts.')) {
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', {status: 503})));
    return;
  }
  // Cache-first for app files
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const c = res.clone();
          caches.open(CACHE).then(ca => ca.put(e.request, c));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
