/**
 * Service Worker para Pomodoro PWA
 * Estrategia: Network-first para HTML, Cache-first para assets
 */

const CACHE_NAME = 'pomodoro-v1';
const STATIC_CACHE_NAME = 'pomodoro-static-v1';

// Assets estáticos para precache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Instalar: precache de assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activar inmediatamente
  self.skipWaiting();
});

// Activar: limpiar caches antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Tomar control inmediatamente
  self.clients.claim();
});

// Fetch: estrategia híbrida
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Solo manejar requests del mismo origen
  if (url.origin !== self.location.origin) {
    return;
  }

  // HTML: Network-first con fallback a cache
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cachear la respuesta
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Assets estáticos (JS, CSS, imágenes): Cache-first
  if (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font' ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          // Actualizar en background
          fetch(event.request).then((response) => {
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, response);
            });
          });
          return cached;
        }
        return fetch(event.request).then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Otros requests: Network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Notificaciones push (preparado para futuro uso)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'pomodoro',
    renotify: true,
    requireInteraction: true,
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Abrir o enfocar la app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Mensaje desde la app para mostrar notificación
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: tag || 'pomodoro',
      renotify: true,
      requireInteraction: false,
    });
  }
});
