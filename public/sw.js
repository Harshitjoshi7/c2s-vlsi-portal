const CACHE_NAME = 'c2s-pwa-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/design-system.css',
  '/css/components.css',
  '/css/layouts.css',
  '/css/animations.css',
  '/js/api.js',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

/* ── Push Notifications ────────────────────────────────────── */
self.addEventListener('push', event => {
  let data = { title: 'C2S VLSI Lab', body: 'You have a new notification.', link: '/dashboard' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch (e) {}
  }

  const options = {
    body: data.body,
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    tag: 'c2s-notification',           // Collapse duplicates
    renotify: true,
    vibrate: [150, 75, 150],
    data: { link: data.link },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/* ── Notification Click ────────────────────────────────────── */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const link = event.notification.data?.link || '/dashboard';
  const targetUrl = self.location.origin + link;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // If app is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin)) {
          client.postMessage({ type: 'NAVIGATE', link });
          return client.focus();
        }
      }
      // Otherwise open a new window
      return clients.openWindow(targetUrl);
    })
  );
});

