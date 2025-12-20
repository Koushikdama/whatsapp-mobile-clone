/**
 * Firebase Cloud Messaging (FCM) Notification Service
 * Handles push notification token management and message handling
 */

import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebaseConfig';
import storage from '../shared/utils/storage';

// VAPID Public Key for FCM
const VAPID_KEY = 'BHxKxfBbzbDEvVtcH1RSXbHBhQlv5EMzmc4alxkBQdD2E_7pPNgNYIMy3r3MeVdJoQBTQucN8t7nxEkQe0Gtzuk';

// Storage keys
const FCM_TOKEN_KEY = 'fcm_token';
const NOTIFICATION_PERMISSION_KEY = 'notification_permission';

export class NotificationService {
    constructor() {
        this.token = null;
        this.permission = storage.local.get(NOTIFICATION_PERMISSION_KEY, 'default');
        this.messageHandlers = [];
        this.messaging = messaging;
    }

    /**
     * Check if notifications are supported
     */
    isSupported() {
        return 'Notification' in window && this.messaging !== null;
    }

    /**
     * Get current notification permission status
     */
    getPermission() {
        if (!this.isSupported()) return 'denied';
        return Notification.permission;
    }

    /**
     * Request notification permission from user
     */
    async requestPermission() {
        if (!this.isSupported()) {
            console.warn('⚠️ Notifications not supported in this browser');
            return false;
        }

        try {
            console.log('📱 Requesting notification permission...');
            const permission = await Notification.requestPermission();
            
            storage.local.set(NOTIFICATION_PERMISSION_KEY, permission);
            this.permission = permission;

            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
                return true;
            } else if (permission === 'denied') {
                console.log('❌ Notification permission denied');
                return false;
            } else {
                console.log('⏸️ Notification permission dismissed');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Get FCM token for push notifications
     */
    async getToken(forceRefresh = false) {
        if (!this.isSupported()) {
            console.warn('⚠️ Messaging not supported');
            return null;
        }

        // Return cached token if available and not forcing refresh
        if (!forceRefresh && this.token) {
            return this.token;
        }

        // Check stored token
        const storedToken = storage.local.get(FCM_TOKEN_KEY);
        if (!forceRefresh && storedToken) {
            this.token = storedToken;
            return storedToken;
        }

        try {
            // Register service worker first
            const registration = await this.registerServiceWorker();
            if (!registration) {
                console.error('❌ Service worker registration failed');
                return null;
            }

            // Request permission if not granted
            if (Notification.permission !== 'granted') {
                const granted = await this.requestPermission();
                if (!granted) {
                    return null;
                }
            }

            // Get FCM token
            console.log('🔑 Generating FCM token...');
            const token = await getToken(this.messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
            });

            if (token) {
                console.log('🔔 FCM Token:', token);
                this.token = token;
                storage.local.set(FCM_TOKEN_KEY, token);
                
                // Send token to your server (when backend is ready)
                // await this.sendTokenToServer(token);
                
                return token;
            } else {
                console.warn('⚠️ No registration token available');
                return null;
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
            return null;
        }
    }

    /**
     * Register service worker for background notifications
     */
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service workers not supported');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/'
            });
            
            console.log('✅ Service worker registered:', registration);

            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            
            return registration;
        } catch (error) {
            console.error('Error registering service worker:', error);
            return null;
        }
    }

    /**
     * Handle foreground messages
     */
    onForegroundMessage(handler) {
        if (!this.isSupported()) return () => {};

        this.messageHandlers.push(handler);

        // Set up Firebase onMessage listener
        const unsubscribe = onMessage(this.messaging, (payload) => {
            console.log('📨 Foreground message received:', payload);
            
            // Call all registered handlers
            this.messageHandlers.forEach(h => {
                try {
                    h(payload);
                } catch (error) {
                    console.error('Error in message handler:', error);
                }
            });

            // Show browser notification even in foreground
            this.showNotification(payload);
        });

        // Return unsubscribe function
        return () => {
            const index = this.messageHandlers.indexOf(handler);
            if (index > -1) {
                this.messageHandlers.splice(index, 1);
            }
            unsubscribe();
        };
    }

    /**
     * Show notification manually
     */
    showNotification(payload) {
        if (!this.isSupported() || Notification.permission !== 'granted') {
            return;
        }

        const title = payload.notification?.title || payload.data?.title || 'New Message';
        const options = {
            body: payload.notification?.body || payload.data?.body || '',
            icon: payload.notification?.icon || '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: payload.data?.chatId || 'general',
            data: payload.data,
            requireInteraction: false,
            silent: false,
        };

        const notification = new Notification(title, options);
        
        notification.onclick = (event) => {
            event.preventDefault();
            notification.close();
            
            // Navigate to chat if chatId exists
            if (payload.data?.chatId) {
                window.focus();
                window.location.href = `/?chat=${payload.data.chatId}`;
            }
        };

        return notification;
    }

    /**
     * Delete FCM token
     */
    async deleteToken() {
        try {
            if (this.token) {
                // await deleteToken(this.messaging); // Uncomment when needed
                this.token = null;
                storage.local.remove(FCM_TOKEN_KEY);
                console.log('🗑️ FCM token deleted');
            }
        } catch (error) {
            console.error('Error deleting FCM token:', error);
        }
    }

    /**
     * Send token to your backend server (implement when backend is ready)
     */
    async sendTokenToServer(token) {
        try {
            // TODO: Implement API call to your backend
            // await apiClient.post('/notifications/register', { token });
            console.log('📤 Token sent to server:', token);
        } catch (error) {
            console.error('Error sending token to server:', error);
        }
    }

    /**
     * Remove token from server (implement when backend is ready)
     */
    async removeTokenFromServer(token) {
        try {
            // TODO: Implement API call to your backend
            // await apiClient.post('/notifications/unregister', { token });
            console.log('📤 Token removed from server:', token);
        } catch (error) {
            console.error('Error removing token from server:', error);
        }
    }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
