/**
 * Status Service
 * Manages status updates (stories) in Firestore with 24-hour expiry
 */

import { db } from '../../config/firebaseConfig';
import {
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    serverTimestamp,
    addDoc,
    updateDoc,
    arrayUnion
} from 'firebase/firestore';
import FirebaseService, { handleFirebaseError } from './FirebaseService';

class StatusFirebaseService extends FirebaseService {
    constructor() {
        super();
        this.collectionName = 'statusUpdates';
    }

    /**
     * Post a status update
     */
    async postStatus(userId, statusData) {
        try {
            const statusesRef = collection(db, this.collectionName);
            
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const status = {
                userId,
                type: statusData.type || 'image',
                mediaUrl: statusData.mediaUrl || null,
                text: statusData.text || null,
                caption: statusData.caption || null,
                backgroundColor: statusData.backgroundColor || null,
                timestamp: serverTimestamp(),
                expiresAt: expiresAt.toISOString(),
                viewers: [],
                privacy: statusData.privacy || 'contacts',
                selectedContacts: statusData.selectedContacts || []
            };

            const docRef = await addDoc(statusesRef, status);

            return {
                success: true,
                statusId: docRef.id,
                status: { id: docRef.id, ...status }
            };
        } catch (error) {
            console.error('[StatusService] Post status error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Delete status
     */
    async deleteStatus(statusId) {
        try {
            const statusRef = doc(db, this.collectionName, statusId);
            await deleteDoc(statusRef);

            return { success: true };
        } catch (error) {
            console.error('[StatusService] Delete status error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Mark status as viewed
     */
    async markAsViewed(statusId, userId) {
        try {
            const statusRef = doc(db, this.collectionName, statusId);
            await updateDoc(statusRef, {
                viewers: arrayUnion({
                    userId,
                    viewedAt: new Date().toISOString()
                })
            });

            return { success: true };
        } catch (error) {
            console.error('[StatusService] Mark viewed error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get user statuses (not expired)
     */
    async getUserStatuses(userId) {
        try {
            const now = new Date().toISOString();
            const statusesRef = collection(db, this.collectionName);
            const q = query(
                statusesRef,
                where('userId', '==', userId),
                where('expiresAt', '>', now),
                orderBy('expiresAt', 'desc'),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(q);
            const statuses = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                success: true,
                statuses
            };
        } catch (error) {
            console.error('[StatusService] Get user statuses error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get all visible statuses (for current user)
     */
    async getVisibleStatuses(currentUserId, contactIds) {
        try {
            const now = new Date().toISOString();
            const statusesRef = collection(db, this.collectionName);
            
            // Get statuses from contacts
            const q = query(
                statusesRef,
                where('userId', 'in', [...contactIds, currentUserId]),
                where('expiresAt', '>', now),
                orderBy('expiresAt', 'desc'),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(q);
            const statuses = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter by privacy settings
            // For now, return all. In production, check privacy settings

            return {
                success: true,
                statuses
            };
        } catch (error) {
            console.error('[StatusService] Get visible statuses error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Subscribe to status updates
     */
    subscribeToStatuses(callback, onError) {
        const now = new Date().toISOString();
        const queryConstraints = [
            where('expiresAt', '>', now),
            orderBy('expiresAt', 'desc'),
            orderBy('timestamp', 'desc')
        ];

        return this.subscribeToCollection(this.collectionName, queryConstraints, callback, onError);
    }
}

// Export singleton instance
export const statusFirebaseService = new StatusFirebaseService();
export default statusFirebaseService;
