// مؤقّت المذاكرة التحفيزي - service worker
// IMPORTANT: bump this version on every app update so users get the new files.
var CACHE_NAME = 'toka-timer-v1';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){ return c.addAll(ASSETS); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('message', function(e){
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// cache-first: app works fully offline after first load
self.addEventListener('fetch', function(e){
  e.respondWith(
    caches.match(e.request).then(function(r){ return r || fetch(e.request); })
  );
});
