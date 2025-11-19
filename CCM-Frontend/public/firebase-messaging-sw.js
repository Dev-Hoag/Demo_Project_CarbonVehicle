// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config from Firebase Console
firebase.initializeApp({
  apiKey: "AIzaSyBQK5SNzTIQpMyv9DTdEo-pGq1MW48BJks",
  authDomain: "carbon-credit-market-70bb9.firebaseapp.com",
  projectId: "carbon-credit-market-70bb9",
  storageBucket: "carbon-credit-market-70bb9.firebasestorage.app",
  messagingSenderId: "845627294988",
  appId: "1:845627294988:web:a0a5f4927a09195d3c3529",
  measurementId: "G-50EQJGYYTS"
});

const messaging = firebase.messaging();

// Handle background messages (when browser/tab is not active)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: payload.data,
    requireInteraction: false,
    tag: payload.data?.notificationId || 'default',
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();
  
  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
