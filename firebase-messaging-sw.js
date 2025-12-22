/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyDQjvWVnK8Mv00F4Z7atVkaARlOmA4dJgY",
    authDomain: "frontend-40733.firebaseapp.com",
    projectId: "frontend-40733",
    storageBucket: "frontend-40733.firebasestorage.app",
    messagingSenderId: "191364639424",
    appId: "1:191364639424:web:e260794329d28a4f009b25",
    measurementId: "G-04P8GMX5HV"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'New Message';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'You have a new message',
        icon: payload.notification?.icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: payload.data?.chatId || 'general',
        data: {
            chatId: payload.data?.chatId,
            messageId: payload.data?.messageId,
            senderId: payload.data?.senderId,
            url: payload.data?.url || '/',
        },
        actions: [
            {
                action: 'open',
                title: 'Open Chat',
            },
            {
                action: 'close',
                title: 'Dismiss',
            }
        ],
        requireInteraction: false,
        silent: false,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Get the URL from notification data
    const urlToOpen = event.notification.data?.url || '/';
    const chatId = event.notification.data?.chatId;

    // Navigate to the chat if chatId exists
    const finalUrl = chatId ? `/?chat=${chatId}` : urlToOpen;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url === finalUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(finalUrl);
            }
        })
    );
});

// Handle push event (alternative to onBackgroundMessage)
self.addEventListener('push', (event) => {
    if (event.data) {
        console.log('[firebase-messaging-sw.js] Push event received:', event.data.text());
        
        try {
            const data = event.data.json();
            const title = data.notification?.title || 'New Notification';
            const options = {
                body: data.notification?.body || '',
                icon: data.notification?.icon || '/icon-192x192.png',
                badge: '/badge-72x72.png',
                data: data.data || {},
            };

            event.waitUntil(
                self.registration.showNotification(title, options)
            );
        } catch (error) {
            console.error('[firebase-messaging-sw.js] Error parsing push data:', error);
        }
    }
});
