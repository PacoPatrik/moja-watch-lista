// Service Worker - Osnovna verzija (sw.js)

const CACHE_NAME = 'watchlist-cache-v1';
// Popis osnovnih datoteka koje želimo odmah cacheati (opcionalno za osnovnu instalaciju)
// const urlsToCache = [
//   '/',
//   '/index.html',
//   '/style.css',
//   '/script.js',
//   '/images/icon-192x192.png', // Dodaj svoje ikone
//   '/images/icon-512x512.png',
//   'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
//   'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
//   // Možeš dodati i fontove ako ih Bootstrap Icons koristi lokalno
// ];

// Instalacija Service Workera
self.addEventListener('install', event => {
  console.log('Service Worker: Instaliran');
  // Opcionalno: Pred-cacheiranje osnovnih resursa
  // event.waitUntil(
  //   caches.open(CACHE_NAME)
  //     .then(cache => {
  //       console.log('Otvoren cache, dodajem osnovne datoteke');
  //       return cache.addAll(urlsToCache).catch(error => {
  //         console.error('Greška kod cache.addAll:', error);
  //       });
  //     })
  //     .then(() => self.skipWaiting()) // Forsiraj aktivaciju novog SW odmah
  // );
   event.waitUntil(self.skipWaiting()); // Samo forsiraj aktivaciju za sad
});

// Aktivacija Service Workera
self.addEventListener('activate', event => {
  console.log('Service Worker: Aktivan');
  // Opcionalno: Brisanje starih cacheva
  // event.waitUntil(
  //   caches.keys().then(cacheNames => {
  //     return Promise.all(
  //       cacheNames.map(cache => {
  //         if (cache !== CACHE_NAME) {
  //           console.log('Service Worker: Brišem stari cache:', cache);
  //           return caches.delete(cache);
  //         }
  //       })
  //     );
  //   }).then(() => self.clients.claim()) // Preuzmi kontrolu nad otvorenim stranicama
  // );
   event.waitUntil(self.clients.claim()); // Samo preuzmi kontrolu
});

// Presretanje mrežnih zahtjeva (Fetch Event)
// Ovdje bi išla logika za offline rad (cache-first, network-first...)
// Za sada, samo prosljeđujemo zahtjev mreži (online-only ponašanje)
self.addEventListener('fetch', event => {
  // console.log('Service Worker: Presrećem fetch za:', event.request.url);
  // Za sada ne radimo ništa s cacheom, samo idemo na mrežu
   event.respondWith(fetch(event.request).catch(error => {
       console.warn('Mrežni zahtjev nije uspio (offline?):', event.request.url, error);
       // Ovdje bismo mogli vratiti neku offline stranicu ili poruku
   }));
});