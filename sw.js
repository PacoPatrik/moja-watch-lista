// Service Worker (sw.js) - Minimalna verzija za PWA instalaciju

// Instalacija - preskačemo čekanje da se SW odmah aktivira
self.addEventListener('install', event => {
  console.log('SW: Instaliran');
  event.waitUntil(self.skipWaiting());
});

// Aktivacija - preuzimamo kontrolu nad stranicama
self.addEventListener('activate', event => {
  console.log('SW: Aktivan');
  event.waitUntil(self.clients.claim());
});

// Fetch - za sada ne radimo ništa s cacheom (samo mreža)
// Ovo je potrebno da preglednik prepozna stranicu kao PWA
self.addEventListener('fetch', event => {
  // Minimalna implementacija fetch handlera je dovoljna za PWA instalaciju
  // console.log('SW: Fetching', event.request.url);
  // Možemo samo pustiti da ide na mrežu:
  // event.respondWith(fetch(event.request));
  // Ili ne raditi ništa eksplicitno ovdje za najosnovniju PWA
});