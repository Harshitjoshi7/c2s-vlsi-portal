const CACHE_NAME = 'c2s-pwa-v13';
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

// Listen for SKIP_WAITING message from the page to activate new version immediately
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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

  // Network-first strategy: try network, fall back to cache for offline support
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

/* ── Push Notifications ────────────────────────────────────── */
self.addEventListener('push', event => {
  let data = { title: 'C2S VLSI Lab', body: 'You have a new notification.', link: '/dashboard' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch (e) {}
  }

  // Use unique tag so attendance notifications don't collapse with others
  const uniqueTag = 'c2s-' + Date.now();

  const options = {
    body: data.body,
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    tag: uniqueTag,
    renotify: true,
    vibrate: [150, 75, 150, 75, 200],
    silent: false,                     // Enforce default system sound
    data: { link: data.link },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, options),
      // Broadcast to open clients to play custom sound if app is open
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        windowClients.forEach(client => {
          client.postMessage({ type: 'PLAY_SOUND', notification: data });
        });
      })
    ])
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

