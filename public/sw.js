// Via99 Service Worker — Push Notifications
const CACHE = 'via99-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'Via99';
  const options = {
    body:    data.body || 'You have a new trip request.',
    icon:    '/favicon.svg',
    badge:   '/favicon.svg',
    vibrate: [200, 100, 200],
    tag:     data.tag || 'via99-trip',
    data:    { url: data.url || '/driver.html' },
    actions: [
      { action: 'open', title: 'Open app' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('driver.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(e.notification.data.url);
      }
    })
  );
});
