const CACHE_NAME = 'dukan-hisab-v3'; // नया वर्ज़न
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// 1. Install Event: फाइलों को कैश (Cache) करना
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); 
});

// 2. Activate Event: पुराना कैश साफ करना
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); 
});

// 3. Fetch Event: नेटवर्क-फर्स्ट स्ट्रेटेजी
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate' || e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, response.clone());
          return response;
        });
      }).catch(() => caches.match(e.request) || caches.match('/index.html'))
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

// ==========================================
// 🚀 नए फीचर्स: बैकग्राउंड सिंक और पुश नोटिफिकेशन
// ==========================================

// 4. Background Sync: जब इंटरनेट वापस आए तब डेटा सर्वर पर भेजना
self.addEventListener('sync', event => {
  if (event.tag === 'sync-sales-data') {
    console.log('इंटरनेट वापस आ गया है! बैकग्राउंड सिंक शुरू हो रहा है...');
    event.waitUntil(
      syncDataToServer()
    );
  }
});

// डेटा सिंक करने का फंक्शन (इसे बाद में Firebase या अपने सर्वर से जोड़ा जा सकता है)
async function syncDataToServer() {
  try {
    // यहाँ IndexedDB से डेटा निकालकर सर्वर पर भेजने का कोड आएगा
    console.log('✅ डेटा सफलतापूर्वक सर्वर पर सिंक हो गया है!');
  } catch (error) {
    console.error('डेटा सिंक फेल हो गया:', error);
  }
}

// 5. Push Notifications: सर्वर से आने वाले नोटिफिकेशन फोन पर दिखाना
self.addEventListener('push', event => {
  // अगर कोई डेटा नहीं आता है, तो यह डिफ़ॉल्ट मैसेज दिखाएगा
  let notificationData = { 
    title: '🏪 दुकान हिसाब', 
    body: 'आपके स्टॉक या खाते में नया अपडेट है!' 
  };

  if (event.data) {
    notificationData = event.data.json(); // सर्वर से आया मैसेज
  }

  const options = {
    body: notificationData.body,
    icon: '/icon-192.png', // आपके ऐप का आइकॉन
    badge: '/icon-192.png', // छोटा बैज आइकॉन
    vibrate: [200, 100, 200], // फोन में वाइब्रेशन का पैटर्न
    data: { url: '/' } // नोटिफिकेशन पर क्लिक करने पर कहाँ जाना है
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// 6. Notification Click: जब यूज़र नोटिफिकेशन पर टच (क्लिक) करे
self.addEventListener('notificationclick', event => {
  event.notification.close(); // क्लिक होते ही नोटिफिकेशन हटा दें
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // अगर ऐप पहले से खुला है, तो उसे सामने लाएं
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      // अगर ऐप बंद है, तो उसे नया खोलें
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
