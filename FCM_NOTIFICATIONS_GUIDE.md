# Firebase Cloud Messaging (FCM) Push Notifications - Usage Guide

## Overview

Your WhatsApp clone now supports Firebase Cloud Messaging (FCM) push notifications with full session and storage management using localStorage, sessionStorage, and cookies.

## Features Implemented

### ✅ State Management
- **useLocalStorage** - Persist data across browser sessions
- **useSessionStorage** - Temporary storage (cleared on browser close)
- **useCookie** - HTTP cookie management with expiration
- Integrated with AppContext for authentication, theme, and settings

### ✅ Push Notifications
- **FCM Token Management** - Automatic token generation and storage
- **Foreground Notifications** - Handle notifications when app is open
- **Background Notifications** - Service worker handles closed/minimized app
- **Permission Management** - Request and track notification permissions
- **VAPID Key Configured** - Ready for production use

## Quick Start

### 1. Request Notification Permission

The notification system is integrated into `AppContext`. To use it in any component:

```javascript
import { useApp } from '@/shared/context/AppContext';

function MyComponent() {
  const { 
    notificationPermission, 
    fcmToken, 
    requestNotificationPermission,
    notificationsEnabled 
  } = useApp();

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      console.log('Notifications enabled! Token:', fcmToken);
    }
  };

  return (
    <button onClick={handleEnableNotifications}>
      {notificationsEnabled ? '✅ Notifications On' : '🔔 Enable Notifications'}
    </button>
  );
}
```

### 2. Using Storage Hooks

```javascript
import { useLocalStorage, useSessionStorage, useCookie } from '@/shared/hooks/useStorage';

function SettingsComponent() {
  // Persistent across browser sessions
  const [userPrefs, setUserPrefs] = useLocalStorage('user_prefs', {
    notifications: true,
    sound: true
  });

  // Cleared when browser closes
  const [tempData, setTempData] = useSessionStorage('temp_data', null);

  // Cookie with 7-day expiration
  const [authToken, setAuthToken] = useCookie('auth_token', '', { days: 7 });

  return <div>Your settings UI</div>;
}
```

### 3. Show Manual Notifications

```javascript
import { useApp } from '@/shared/context/AppContext';

function MessageHandler() {
  const { showNotification } = useApp();

  const handleNewMessage = (message) => {
    showNotification('New Message from ' + message.sender, {
      body: message.text,
      icon: '/icon-192x192.png',
      data: { chatId: message.chatId }
    });
  };

  return <div>...</div>;
}
```

## FCM Token

The FCM token is automatically:
- ✅ Generated on permission grant
- ✅ Stored in localStorage (`fcm_token`)
- ✅ Available via `fcmToken` in AppContext
- ✅ Logged to console for testing

**Send this token to your backend** to enable push notifications from your server.

## Service Worker

The service worker is registered at `/firebase-messaging-sw.js` and handles:
- Background message reception
- Notification display
- Click handling (navigates to chat)
- Badge updates

## Testing Notifications

### Test via Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Add your FCM token (check browser console)
4. Send message

### Test Foreground Notifications

1. Keep app open and focused
2. Send a notification
3. Should see console log: "📨 New message notification:"
4. Notification appears even with app open

### Test Background Notifications

1. Minimize browser or switch tabs
2. Send a notification
3. Browser notification should appear
4. Click it to open the app

## Storage APIs

### localStorage
```javascript
import storage from '@/shared/utils/storage';

// Set
storage.local.set('key', { data: 'value' });

// Get
const data = storage.local.get('key', defaultValue);

// Remove
storage.local.remove('key');

// Clear all
storage.local.clear();
```

### sessionStorage
```javascript
// Same API as localStorage
storage.session.set('key', 'value');
storage.session.get('key');
```

### Cookies
```javascript
// Set with options
storage.cookie.set('name', 'value', {
  days: 7,
  path: '/',
  secure: true,
  sameSite: 'Strict'
});

// Get
const value = storage.cookie.get('name');

// Remove
storage.cookie.remove('name');

// Get all cookies
const allCookies = storage.cookie.getAll();
```

## Integration Points

### AppContext

All state now uses storage hooks:
- `isAuthenticated` → localStorage
- `theme` → localStorage
- `language` → localStorage
- `chatSettings` → localStorage
- `securitySettings` → localStorage
- `statusPrivacy` → localStorage
- `activeSessionId` → sessionStorage (cleared on browser close)

### New Context Values

```javascript
const {
  // Notification state
  notificationPermission,  // 'granted', 'denied', or 'default'
  fcmToken,                // FCM token string
  notificationsEnabled,    // boolean: permission === 'granted'
  
  // Notification functions
  requestNotificationPermission,
  showNotification,
  
  // Session management
  activeSessionId,
  setActiveSessionId,
} = useApp();
```

## File Structure

```
src/
├── config/
│   └── firebaseConfig.js          # ✅ Updated with messaging
├── services/
│   └── notificationService.js     # ✅ New FCM service
├── shared/
│   ├── hooks/
│   │   ├── useStorage.js          # ✅ New storage hooks
│   │   └── useNotifications.js    # ✅ New notification hook
│   ├── utils/
│   │   └── storage.js             # ✅ New storage utilities
│   ├── components/
│   │   ├── NotificationPrompt.jsx # ✅ New UI component
│   │   └── NotificationPrompt.css # ✅ New styles
│   └── context/
│       └── AppContext.jsx         # ✅ Updated with hooks
└── public/
    └── firebase-messaging-sw.js   # ✅ New service worker
```

## Environment Variables

Already configured in your Firebase config:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Sending Notifications from Backend

When your backend is ready, send notifications to users:

```javascript
// Backend pseudo-code (Node.js example)
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

async function sendNotification(fcmToken, message) {
  const payload = {
    token: fcmToken,
    notification: {
      title: message.title,
      body: message.body,
      icon: '/icon-192x192.png'
    },
    data: {
      chatId: message.chatId,
      messageId: message.id,
      senderId: message.senderId
    }
  };

  const response = await admin.messaging().send(payload);
  console.log('Notification sent:', response);
}
```

## Browser Compatibility

✅ Chrome, Edge, Firefox, Safari (iOS 16.4+)  
❌ Older Safari versions (< 16.4)

The code gracefully handles unsupported browsers without breaking.

## Common Issues

### "Messaging not supported"
- Check if browser supports notifications
- Ensure HTTPS (required for service workers)
- Check `isSupported()` returns true

### Service worker not registering
- Ensure `/public/firebase-messaging-sw.js` exists
- Check browser console for errors
- Verify HTTPS or localhost

### Token not generating
- Check notification permission is granted
- Verify Firebase config is correct
- Check browser console for errors

## Next Steps

1. ✅ Notifications are ready to use
2. 📤 Send FCM token to your backend on login/signup
3. 🔔 Configure your backend to send push notifications
4. 🎨 Customize NotificationPrompt component styling
5. 📊 Track notification analytics

---

**Everything is implemented and ready to use!** 🚀
