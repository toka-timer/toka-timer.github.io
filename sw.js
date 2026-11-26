// مؤقّت المذاكرة التحفيزي - service worker
// IMPORTANT: bump this version on every app update so users get the new files.
var CACHE_NAME = 'toka-timer-v17';
var CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
var EXTRA = [
  './ypt1.p0','./ypt1.p1','./ypt1.p2','./ypt1.p3','./ypt1.p4','./ypt1.p5',
  './ypt2.p0','./ypt2.p1',
  './rain.p0','./rain.p1','./rain.p2'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){
      // core must cache or install fails and retries later
      return c.addAll(CORE).then(function(){
        // extra media: cache each on its own; a failed one never blocks install
        return Promise.all(EXTRA.map(function(u){
          return fetch(u, { cache: 'reload' }).then(function(r){
            if (r.ok) return c.put(u, r);
          }).catch(function(){ return null; });
        }));
      });
    })
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

// cache-first for our own GET files: app works fully offline after first load
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  if (e.request.url.indexOf(self.location.origin) !== 0) return;
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request);
    }).catch(function(){
      if (e.request.mode === 'navigate') return caches.match('./index.html');
      return Response.error();
    })
  );
});
