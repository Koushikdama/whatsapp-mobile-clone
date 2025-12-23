/**
 * Notification Firebase Service
 * Manages follow-related notifications in Firestore
 */

import { db } from '../../config/firebaseConfig';
import {
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import FirebaseService, { handleFirebaseError } from './FirebaseService';

/**
 * Notification types for follow-related activities and groups
 */
export const NOTIFICATION_TYPES = {
    FOLLOW_REQUEST: 'follow_request',      // Someone requested to follow (private account)
    FOLLOW_ACCEPTED: 'follow_accepted',    // Your follow request was accepted
    NEW_FOLLOWER: 'new_follower',          // Someone followed you (public account)
    FOLLOW_BACK: 'follow_back',            // Someone followed you back (mutual)
    ADDED_TO_GROUP: 'added_to_group'       // Someone added you to a group
};

class NotificationFirebaseService extends FirebaseService {
    constructor() {
        super();
        this.collectionName = 'notifications';
    }

    /**
     * Create a notification
     * @param {string} userId - User who receives the notification
     * @param {string} actorId - User who triggered the notification
     * @param {string} type - Notification type (from NOTIFICATION_TYPES)
     * @param {object} metadata - Additional metadata
     */
    async createNotification(userId, actorId, type, metadata = {}) {
        try {
            // Don't create notification if user is notifying themselves
            if (userId === actorId) {
                return { success: true, message: 'Self-notification skipped' };
            }

            const notificationRef = doc(collection(db, this.collectionName));
            
            const notification = {
                userId,
                actorId,
                type,
                read: false,
                createdAt: serverTimestamp(),
                metadata
            };

            await setDoc(notificationRef, notification);

            console.log(`✅ Notification created: ${type} for user ${userId} by ${actorId}`);
            return {
                success: true,
                notificationId: notificationRef.id,
                notification: { id: notificationRef.id, ...notification }
            };
        } catch (error) {
            console.error('[NotificationService] Create notification error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get notifications for a user
     * @param {string} userId - User ID
     * @param {number} maxResults - Maximum notifications to fetch
     */
    async getUserNotifications(userId, maxResults = 50) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(maxResults)
            );

            const snapshot = await getDocs(q);
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                success: true,
                notifications,
                unreadCount: notifications.filter(n => !n.read).length
            };
        } catch (error) {
            console.error('[NotificationService] Get notifications error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     */
    async markAsRead(notificationId) {
        try {
            const notificationRef = doc(db, this.collectionName, notificationId);
            await updateDoc(notificationRef, {
                read: true
            });

            return { success: true };
        } catch (error) {
            console.error('[NotificationService] Mark as read error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Mark all notifications as read for a user
     * @param {string} userId - User ID
     */
    async markAllAsRead(userId) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                return { success: true, message: 'No unread notifications' };
            }

            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { read: true });
            });

            await batch.commit();

            console.log(`✅ Marked ${snapshot.docs.length} notifications as read for user ${userId}`);
            return {
                success: true,
                markedCount: snapshot.docs.length
            };
        } catch (error) {
            console.error('[NotificationService] Mark all as read error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Delete a notification
     * @param {string} notificationId - Notification ID
     */
    async deleteNotification(notificationId) {
        try {
            const notificationRef = doc(db, this.collectionName, notificationId);
            await deleteDoc(notificationRef);

            return { success: true };
        } catch (error) {
            console.error('[NotificationService] Delete notification error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Delete old notifications (cleanup)
     * @param {string} userId - User ID
     * @param {number} daysOld - Delete notifications older than this many days
     */
    async deleteOldNotifications(userId, daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                where('createdAt', '<', cutoffDate.toISOString())
            );

            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                return { success: true, message: 'No old notifications to delete' };
            }

            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            console.log(`✅ Deleted ${snapshot.docs.length} old notifications for user ${userId}`);
            return {
                success: true,
                deletedCount: snapshot.docs.length
            };
        } catch (error) {
            console.error('[NotificationService] Delete old notifications error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get unread notification count for a user
     * @param {string} userId - User ID
     */
    async getUnreadCount(userId) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(q);

            return {
                success: true,
                count: snapshot.size
            };
        } catch (error) {
            console.error('[NotificationService] Get unread count error:', error);
            throw handleFirebaseError(error);
        }
    }
}

// Export singleton instance
export const notificationFirebaseService = new NotificationFirebaseService();
export default notificationFirebaseService;
