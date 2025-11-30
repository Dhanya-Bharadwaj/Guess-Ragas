// Simple service worker offering basic offline support.
// It caches the app shell (index.html, manifest, icons) on install and
// uses a runtime cache for navigation and media. This is intentionally
// simple so it works without build-time injection. For stronger
// production caching use Workbox InjectManifest/GenerateSW.

const CACHE_NAME = 'raga-app-v1';
const RUNTIME_CACHE = 'raga-runtime-v1';

// Files to precache from /public
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // precache app shell first
      await cache.addAll(PRECACHE_URLS);
      // try to fetch a generated manifest of audio files and precache those as well
      try {
        const manifestResp = await fetch('/assets/ragas/manifest.json');
        if (manifestResp && manifestResp.ok) {
          const list = await manifestResp.json();
          if (Array.isArray(list) && list.length) {
            await Promise.all(list.map((u) => cache.add(u).catch(() => {})));
          }
        }
      } catch (err) {
        // manifest not available (dev) or fetch failed - that's ok
        // eslint-disable-next-line no-console
        console.warn('sw: audio manifest not precached', err && err.message ? err.message : err);
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME && key !== RUNTIME_CACHE) return caches.delete(key);
        return Promise.resolve();
      })
    ))
  );
  self.clients.claim();
});

// Allow the page to tell the SW to skipWaiting (useful to activate new SW immediately)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper: determine if request is navigation (SPA route)
function isNavigation(req) {
  return req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept') && req.headers.get('accept').includes('text/html'));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Always allow access to devtools and chrome extensions
  if (url.origin !== location.origin) {
    // For cross-origin media (CDN) we simply do network-first
    event.respondWith(networkFirst(req));
    return;
  }

  // SPA navigation: network-first with cache fallback to index.html
  if (isNavigation(req)) {
    event.respondWith(
      fetch(req).then((res) => {
        // put a copy in runtime cache too
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For audio and media files: cache-first (so offline playback after first play)
  if (req.destination === 'audio' || req.url.includes('/assets/')) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // For other requests (JS/CSS/images): try cache, else network and cache
  event.respondWith(runtimeCache(req));
});

function cacheFirst(req) {
  return caches.match(req).then((cached) => cached || fetch(req).then((res) => { caches.open(RUNTIME_CACHE).then((c) => c.put(req, res.clone())); return res; }));
}

function runtimeCache(req) {
  return caches.match(req).then((cached) => cached || fetch(req).then((res) => { caches.open(RUNTIME_CACHE).then((c) => c.put(req, res.clone())); return res; }));
}

function networkFirst(req) {
  return fetch(req).then((res) => { caches.open(RUNTIME_CACHE).then((c) => c.put(req, res.clone())); return res; }).catch(() => caches.match(req));
}
