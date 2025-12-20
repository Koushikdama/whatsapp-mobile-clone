// Firebase Configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDQjvWVnK8Mv00F4Z7atVkaARlOmA4dJgY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "frontend-40733.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "frontend-40733",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "frontend-40733.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "191364639424",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:191364639424:web:e260794329d28a4f009b25",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-04P8GMX5HV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in production)
let analytics = null;
if (typeof window !== 'undefined' && import.meta.env.PROD) {
    analytics = getAnalytics(app);
}

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);
const storage = getStorage(app);

// Initialize Firebase Messaging (only if supported)
let messaging = null;
if (typeof window !== 'undefined') {
    isSupported().then(supported => {
        if (supported) {
            messaging = getMessaging(app);
            console.log('🔔 Firebase Messaging initialized');
        } else {
            console.warn('⚠️ Firebase Messaging not supported in this browser');
        }
    }).catch(err => {
        console.error('Error checking messaging support:', err);
    });
}

// Connect to emulators in development (optional)
const USE_EMULATORS = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

if (USE_EMULATORS && import.meta.env.DEV) {
    console.log('🔧 Using Firebase Emulators');
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
    connectStorageEmulator(storage, 'localhost', 9199);
}

// Enable offline persistence for Firestore
import { enableIndexedDbPersistence } from 'firebase/firestore';

if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Firebase persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('Firebase persistence not available in this browser');
        }
    });
}

export {
    app,
    analytics,
    auth,
    db,
    realtimeDb,
    storage,
    messaging,
    firebaseConfig
};

export default app;
