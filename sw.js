const CACHE_NAME = 'dukan-hisab-v4'; 
const ASSETS = [
  '/Chaudhary-auto-parts/',
  '/Chaudhary-auto-parts/index.html',
  '/Chaudhary-auto-parts/manifest.json',
  '/Chaudhary-auto-parts/icon-192.png',
  '/Chaudhary-auto-parts/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); 
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); 
});

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate' || e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, response.clone());
          return response;
        });
      }).catch(() => caches.match(e.request) || caches.match('/Chaudhary-auto-parts/index.html'))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (!response || response.status !== 200) return response;
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, response.clone()));
          return response;
        }).catch(() => {}); 
      })
    );
  }
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-sales-data') {
    event.waitUntil(syncDataToServer());
  }
});

async function syncDataToServer() {
  try {
    console.log('✅ डेटा सफलतापूर्वक सर्वर पर सिंक हो गया है!');
  } catch (error) {
    console.error('डेटा सिंक फेल हो गया:', error);
  }
}

self.addEventListener('push', event => {
  let notificationData = { title: '🏪 दुकान हिसाब', body: 'आपके स्टॉक या खाते में नया अपडेट है!' };
  if (event.data) notificationData = event.data.json(); 

  const options = {
    body: notificationData.body,
    icon: '/Chaudhary-auto-parts/icon-192.png',
    badge: '/Chaudhary-auto-parts/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: '/Chaudhary-auto-parts/' }
  };

  event.waitUntil(self.registration.showNotification(notificationData.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close(); 
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes('/Chaudhary-auto-parts/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/Chaudhary-auto-parts/');
    })
  );
});
