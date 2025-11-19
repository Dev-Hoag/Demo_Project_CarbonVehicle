import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';

// Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBQK5SNzTIQpMyv9DTdEo-pGq1MW48BJks",
  authDomain: "carbon-credit-market-70bb9.firebaseapp.com",
  projectId: "carbon-credit-market-70bb9",
  storageBucket: "carbon-credit-market-70bb9.firebasestorage.app",
  messagingSenderId: "845627294988",
  appId: "1:845627294988:web:a0a5f4927a09195d3c3529",
  measurementId: "G-50EQJGYYTS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging: Messaging | null = null;

try {
  // Check if messaging is supported (requires HTTPS or localhost)
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Register service worker first
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('✅ Service worker registered:', registration);
        messaging = getMessaging(app);
        console.log('✅ Firebase messaging initialized');
      })
      .catch((error) => {
        console.warn('⚠️ Service worker registration failed:', error);
      });
  }
} catch (error) {
  console.warn('⚠️ Firebase messaging not supported:', error);
}

export { messaging, getToken, onMessage };
export default app;
