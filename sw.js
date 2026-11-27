// مؤقّت المذاكرة التحفيزي - service worker
// IMPORTANT: bump this version on every app update so users get the new files.
var CACHE_NAME = 'toka-timer-v31';
var CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
var EXTRA = [
  './ypt1.p0','./ypt1.p1','./ypt1.p2','./ypt1.p3','./ypt1.p4','./ypt1.p5',
  './ypt2.p0','./ypt2.p1',
  './rain.p0','./rain.p1','./rain.p2'];

// fetch with a hard ceiling so a hung request can never stall the install
function timeoutFetch(u, ms){
  return Promise.race([
    fetch(u, { cache: 'reload' }),
    new Promise(function(_, rej){ setTimeout(function(){ rej(new Error('timeout ' + u)); }, ms); })
  ]);
}

self.addEventListener('install', function(e){
  // activate immediately: never leave an update stuck in "waiting" behind an old page
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){
      // core (4 small files) must all cache or install fails and retries later;
      // cache:'reload' bypasses any stale/corrupt HTTP cache entry
      var core = Promise.all(CORE.map(function(u){
        return timeoutFetch(u, 30000).then(function(r){
          if (!r.ok) throw new Error('core fetch failed: ' + u);
          return c.put(u, r);
        });
      }));
      // extra media: each on its own, capped at 15s; a slow or failed one never blocks install
      var extra = Promise.all(EXTRA.map(function(u){
        return timeoutFetch(u, 15000).then(function(r){
          if (r && r.ok) return c.put(u, r);
        }).catch(function(){ return null; });
      }));
      return Promise.all([core, extra]);
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME && k !== 'quran-audio-v1'; }).map(function(k){ return caches.delete(k); }));
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
  // Quran audio: never cached by the app cache; the page manages its own cache and streams from the network
  if (new URL(e.request.url).pathname.indexOf('/quran/') !== -1) return;
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request);
    }).catch(function(){
      if (e.request.mode === 'navigate') return caches.match('./index.html');
      return Response.error();
    })
  );
});
