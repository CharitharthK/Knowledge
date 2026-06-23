// Knowledge Hub — Service Worker (cache-first with network fallback)
const CACHE_NAME = 'knowledge-v2';
const ASSETS = [
  './',
  'index.html',
  'hub.html',
  'assets/index.css',
  'assets/hub.css',
  'assets/hub.js',
  'assets/icon.png',
  'assets/fonts/inter-400.ttf',
  'assets/fonts/inter-500.ttf',
  'assets/fonts/inter-600.ttf',
  'assets/fonts/jetbrains-mono-400.ttf',
  'assets/fonts/jetbrains-mono-500.ttf',
  'assets/fonts/jetbrains-mono-700.ttf',
  'assets/fonts/space-grotesk-400.ttf',
  'assets/fonts/space-grotesk-500.ttf',
  'assets/fonts/space-grotesk-600.ttf',
  'assets/fonts/space-grotesk-700.ttf',
  'data/index.json',
  'data/ml.json',
  'data/ai-eng.json',
  'manifest.webmanifest'
];

// Pre-cache shell assets on install
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Clean old caches on activate
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Stale-while-revalidate for data files, cache-first for everything else
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  // For data JSON files: serve from cache but update in background
  if (url.pathname.match(/\/data\/.*\.json$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(event.request).then(function (cached) {
          var fetched = fetch(event.request).then(function (response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(function () { return cached; });
          return cached || fetched;
        });
      })
    );
    return;
  }

  // Everything else: cache-first
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).then(function (response) {
        if (response.ok && url.origin === self.location.origin) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, clone); });
        }
        return response;
      });
    })
  );
});
