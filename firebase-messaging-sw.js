// ── Firebase Messaging Service Worker ──────────────────
// Handles background push notifications for therapist portal
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyAw7KXjgZaHM833PZDwTLUSNGNk7WJx_sY",
  authDomain:        "therapist-gallery.firebaseapp.com",
  projectId:         "therapist-gallery",
  storageBucket:     "therapist-gallery.firebasestorage.app",
  messagingSenderId: "826400735387",
  appId:             "1:826400735387:web:379974d8aa913786f0063e"
});

const messaging = firebase.messaging();

// ── Background message handler ───────────────────────
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {};
  const isNow = payload.data?.type === 'now';

  self.registration.showNotification(title || '🔔 New Booking', {
    body:              body || 'You have a new booking request',
    icon:              '/icon-192.png',
    badge:             '/icon-192.png',
    vibrate:           isNow
                         ? [300,100,300,100,300,100,300,100,300]
                         : [200,100,200],
    requireInteraction: isNow,   // stays on screen for Book Now; auto-dismisses for Book Later
    tag:               'booking',
    renotify:          true,
    data:              payload.data,
    actions: [
      { action:'open', title:'Open Portal' },
      { action:'dismiss', title:'Dismiss' },
    ],
  });
});

// ── Notification click → open therapist portal ────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      for (const c of list) {
        if (c.url.includes('/therapist') && 'focus' in c) return c.focus();
      }
      return clients.openWindow('/therapist');
    })
  );
});
