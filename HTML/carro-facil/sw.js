const CACHE = 'carro-facil-v4';
const ARQUIVOS = ['./', 'index.html', 'style.css', 'js/config.js', 'js/data.js', 'js/core.js', 'js/catalogo.js', 'js/garagem.js', 'js/extras.js', 'js/main.js', 'icon.svg', 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// só guarda arquivos do próprio app; respostas de outras origens (API do Supabase, fotos) nunca vão para o cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
