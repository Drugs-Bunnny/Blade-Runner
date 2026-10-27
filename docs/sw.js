/* Offline support for the GitHub Pages copy. The page is fetched from the network when online
   (so updates show straight away) and served from the cache when offline. The fonts ship with the site and are cached on install. */
const BUILD = '030';
const CACHE = 'br-archive-' + BUILD;
const CORE = ['./', './manifest.webmanifest', './img/icon-192.png', './img/icon-512.png', './img/icon-180.png', './img/favicon.svg', './img/favicon-32.png'].concat(["./fonts/chakra-petch-latin-400-normal.woff2", "./fonts/chakra-petch-latin-600-normal.woff2", "./fonts/chakra-petch-latin-700-normal.woff2", "./fonts/barlow-latin-400-normal.woff2", "./fonts/barlow-latin-400-italic.woff2", "./fonts/barlow-latin-500-normal.woff2", "./fonts/barlow-latin-500-italic.woff2", "./fonts/barlow-latin-600-normal.woff2", "./fonts/barlow-latin-600-italic.woff2", "./fonts/share-tech-mono-latin-400-normal.woff2"]);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => (k.startsWith('br-archive-') && k !== CACHE) || k === 'br-fonts').map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function withTimeout(p, ms) { return Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]); }

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // the page itself: network first, cached copy when offline or very slow
  if (req.mode === 'navigate') {
    e.respondWith(withTimeout(fetch(req), 5000)
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); } return res; })
      .catch(() => caches.match('./', { cacheName: CACHE }).then((r) => r || caches.match('./'))));
    return;
  }
  // everything else on this site: answer from the cache, refresh it in the background
  if (url.origin === self.location.origin) {
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
