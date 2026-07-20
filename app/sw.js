/* GestCom PWA — service worker
   Cache leve do app-shell para abrir offline.
   Os DADOS ficam em localStorage (gestcom_cache), não aqui. */
const CACHE = 'gestcom-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(()=>{})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // Firebase e CDNs: sempre rede (dados frescos), sem cache
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('cloudflare') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')) {
    return; // deixa o browser tratar
  }

  // App-shell: cache-first com atualização em segundo plano
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200 && req.method === 'GET') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
