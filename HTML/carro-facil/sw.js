const CACHE = 'cade-meu-carro-v8';
const ARQUIVOS = ['./', 'index.html', 'style.css', 'js/config.js', 'js/data.js', 'js/core.js', 'js/push.js', 'js/catalogo.js', 'js/garagem.js', 'js/negocio.js', 'js/financeiro.js', 'js/extras.js', 'js/main.js', 'icon.svg', 'manifest.json'];

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

// Web Push: mostra o aviso e abre o app na tela certa ao tocar
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch { /* sem corpo */ }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Cadê meu carro?', {
    body: d.corpo || '', icon: 'icon.svg', badge: 'icon.svg', tag: d.url || 'geral', data: { url: d.url || '#/' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const alvo = new URL('index.html' + (e.notification.data?.url || '#/'), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const aberta = cs.find(c => c.url.startsWith(self.registration.scope));
    if (aberta) { aberta.focus(); return aberta.navigate(alvo); }
    return self.clients.openWindow(alvo);
  }));
});
