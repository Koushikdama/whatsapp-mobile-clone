/**
 * Call Service
 * Manages call history in Firestore
 */

import { db } from '../../config/firebaseConfig';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    serverTimestamp
} from 'firebase/firestore';
import FirebaseService, { handleFirebaseError } from './FirebaseService';

class CallFirebaseService extends FirebaseService {
    constructor() {
        super();
        this.collectionName = 'calls';
    }

    /**
     * Log a call
     */
    async logCall(callData) {
        try {
            const callsRef = collection(db, this.collectionName);
            
            const call = {
                userId: callData.userId,
                contactId: callData.contactId,
                type: callData.type, // 'voice' or 'video'
                direction: callData.direction, // 'incoming', 'outgoing', 'missed'
                timestamp: serverTimestamp(),
                duration: callData.duration || null,
                status: callData.status || 'completed' // 'completed', 'missed', 'declined', 'failed'
            };

            const docRef = await addDoc(callsRef, call);

            return {
                success: true,
                callId: docRef.id,
                call: { id: docRef.id, ...call }
            };
        } catch (error) {
            console.error('[CallService] Log call error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update call duration
     */
    async updateCallDuration(callId, duration) {
        try {
            const callRef = doc(db, this.collectionName, callId);
            await updateDoc(callRef, {
                duration,
                status: 'completed'
            });

            return { success: true };
        } catch (error) {
            console.error('[CallService] Update duration error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get user call history
     */
    async getCallHistory(userId, limitCount = 50) {
        try {
            const callsRef = collection(db, this.collectionName);
            const q = query(
                callsRef,
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                firestoreLimit(limitCount)
            );

            const snapshot = await getDocs(q);
            const calls = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                success: true,
                calls
            };
        } catch (error) {
            console.error('[CallService] Get call history error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Delete call from history
     */
    async deleteCall(callId) {
        try {
            const callRef = doc(db, this.collectionName, callId);
            await deleteDoc(callRef);

            return { success: true };
        } catch (error) {
            console.error('[CallService] Delete call error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Subscribe to call history
     */
    subscribeToCallHistory(userId, callback, onError) {
        const queryConstraints = [
            where('userId', '==', userId),
            orderBy('timestamp', 'desc')
        ];

        return this.subscribeToCollection(this.collectionName, queryConstraints, callback, onError);
    }
}

// Export singleton instance
export const callFirebaseService = new CallFirebaseService();
export default callFirebaseService;
