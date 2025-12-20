/**
 * Base Firebase Service
 * Provides common utilities and error handling for all Firebase services
 */

import { db, realtimeDb } from '../../config/firebaseConfig';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    writeBatch,
    serverTimestamp
} from 'firebase/firestore';
import { ref, get, set, update, remove, onValue, off } from 'firebase/database';

/**
 * Firebase error handler
 * Converts Firebase errors to user-friendly messages
 */
export class FirebaseError extends Error {
    constructor(code, message, originalError) {
        super(message);
        this.name = 'FirebaseError';
        this.code = code;
        this.originalError = originalError;
    }
}

/**
 * Handle Firebase errors and convert to user-friendly messages
 */
export const handleFirebaseError = (error) => {
    console.error('[Firebase Error]', error);

    const errorMessages = {
        'permission-denied': 'You do not have permission to perform this action',
        'not-found': 'The requested data was not found',
        'already-exists': 'This item already exists',
        'resource-exhausted': 'Too many requests. Please try again later',
        'unauthenticated': 'Please sign in to continue',
        'unavailable': 'Service temporarily unavailable. Please check your connection',
        'cancelled': 'Operation was cancelled',
        'network-request-failed': 'Network error. Please check your internet connection'
    };

    const message = errorMessages[error.code] || error.message || 'An unexpected error occurred';
    
    return new FirebaseError(error.code, message, error);
};

/**
 * Retry logic for Firebase operations
 */
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            if (error.code === 'permission-denied' || error.code === 'not-found') {
                throw error; // Don't retry these errors
            }
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
};

/**
 * Base Firebase Service Class
 */
export class FirebaseService {
    constructor() {
        this.db = db;
        this.realtimeDb = realtimeDb;
        this.listeners = new Map();
    }

    /**
     * Get Firestore server timestamp
     */
    getServerTimestamp() {
        return serverTimestamp();
    }

    /**
     * Get current timestamp
     */
    getCurrentTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Create a Firestore document reference
     */
    getDocRef(collectionPath, docId) {
        return doc(db, collectionPath, docId);
    }

    /**
     * Create a Firestore collection reference
     */
    getCollectionRef(collectionPath) {
        return collection(db, collectionPath);
    }

    /**
     * Create a Realtime Database reference
     */
    getRealtimeRef(path) {
        return ref(realtimeDb, path);
    }

    /**
     * Subscribe to Firestore document
     */
    subscribeToDocument(collectionPath, docId, callback, onError) {
        const docRef = this.getDocRef(collectionPath, docId);
        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    callback({ id: snapshot.id, ...snapshot.data() });
                } else {
                    callback(null);
                }
            },
            (error) => {
                console.error('[Firebase] Document subscription error:', error);
                if (onError) onError(handleFirebaseError(error));
            }
        );

        const key = `${collectionPath}/${docId}`;
        this.listeners.set(key, unsubscribe);
        
        return unsubscribe;
    }

    /**
     * Subscribe to Firestore collection
     */
    subscribeToCollection(collectionPath, queryConstraints, callback, onError) {
        const collectionRef = this.getCollectionRef(collectionPath);
        const q = queryConstraints ? query(collectionRef, ...queryConstraints) : collectionRef;
        
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(data);
            },
            (error) => {
                console.error('[Firebase] Collection subscription error:', error);
                if (onError) onError(handleFirebaseError(error));
            }
        );

        const key = `collection:${collectionPath}`;
        this.listeners.set(key, unsubscribe);
        
        return unsubscribe;
    }

    /**
     * Subscribe to Realtime Database value
     */
    subscribeToRealtimeValue(path, callback, onError) {
        const dbRef = this.getRealtimeRef(path);
        
        const handleValue = (snapshot) => {
            callback(snapshot.val());
        };

        const handleError = (error) => {
            console.error('[Firebase] Realtime subscription error:', error);
            if (onError) onError(handleFirebaseError(error));
        };

        onValue(dbRef, handleValue, handleError);

        const unsubscribe = () => off(dbRef, 'value', handleValue);
        this.listeners.set(`realtime:${path}`, unsubscribe);
        
        return unsubscribe;
    }

    /**
     * Unsubscribe from a specific listener
     */
    unsubscribe(key) {
        const unsubscribe = this.listeners.get(key);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(key);
        }
    }

    /**
     * Unsubscribe from all listeners
     */
    unsubscribeAll() {
        this.listeners.forEach((unsubscribe) => unsubscribe());
        this.listeners.clear();
    }

    /**
     * Batch write operations for Firestore
     */
    async batchWrite(operations) {
        const batch = writeBatch(db);
        
        operations.forEach(({ type, ref, data }) => {
            switch (type) {
                case 'set':
                    batch.set(ref, data);
                    break;
                case 'update':
                    batch.update(ref, data);
                    break;
                case 'delete':
                    batch.delete(ref);
                    break;
            }
        });

        try {
            await batch.commit();
            return { success: true };
        } catch (error) {
            throw handleFirebaseError(error);
        }
    }

    /**
     * Check if user is online (connection state)
     */
    monitorConnectionState(callback) {
        const connectedRef = this.getRealtimeRef('.info/connected');
        return this.subscribeToRealtimeValue('.info/connected', callback);
    }
}

export default FirebaseService;
