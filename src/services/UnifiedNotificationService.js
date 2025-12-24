/**
 * Unified Notification Service
 * Combines Firestore notifications with FCM push notifications
 * Follows SOLID principles - Single Responsibility, Clean and Simple
 */

import notificationFirebaseService, { NOTIFICATION_TYPES } from './firebase/NotificationFirebaseService';
import fcmNotificationService from './notificationService';
import userService from './firebase/UserService';
import { db } from '../config/firebaseConfig';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';

class UnifiedNotificationService {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Send a complete notification (Firestore + FCM Push)
     * This is the main method to use for sending notifications
     * 
     * @param {string} userId - User who receives the notification
     * @param {string} actorId - User who triggered the notification
     * @param {string} type - Notification type (from NOTIFICATION_TYPES)
     * @param {object} metadata - Additional metadata
     * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
     */
    async sendNotification(userId, actorId, type, metadata = {}) {
        try {
            // Don't send notification to self
            if (userId === actorId) {
                return { success: true, message: 'Self-notification skipped' };
            }

            console.log(`📬 Sending notification: ${type} from ${actorId} to ${userId}`);

            // Step 1: Create Firestore notification record
            const firestoreResult = await notificationFirebaseService.createNotification(
                userId,
                actorId,
                type,
                metadata
            );

            if (!firestoreResult.success) {
                console.error('❌ Failed to create Firestore notification:', firestoreResult.error);
                return { success: false, error: 'Failed to create notification' };
            }

            // Step 2: Send FCM push notification
            try {
                await this.sendPushNotification(userId, actorId, type, metadata);
            } catch (pushError) {
                // Don't fail the whole operation if push fails
                console.warn('⚠️ FCM push failed, but Firestore notification was saved:', pushError);
            }

            console.log('✅ Notification sent successfully');
            return {
                success: true,
                notificationId: firestoreResult.notificationId
            };
        } catch (error) {
            console.error('[UnifiedNotificationService] Send notification error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send notification'
            };
        }
    }

    /**
     * Send FCM push notification to a user
     * Internal method - use sendNotification() instead
     * 
     * @private
     */
    async sendPushNotification(userId, actorId, type, metadata = {}) {
        try {
            // Get recipient's FCM token
            const userResult = await userService.getUser(userId);
            if (!userResult.success || !userResult.user?.fcmToken) {
                console.log('ℹ️ User has no FCM token, skipping push notification');
                return;
            }

            // Get actor's info for notification content
            const actorResult = await userService.getUser(actorId);
            const actorName = actorResult.success ? actorResult.user?.name || 'Someone' : 'Someone';

            // Build notification content based on type
            const { title, body, data } = this.buildNotificationContent(type, actorName, metadata);

            // Show notification via FCM service
            if (fcmNotificationService.isSupported()) {
                fcmNotificationService.showNotification({
                    notification: { title, body },
                    data
                });
            }

            console.log(`📲 FCM push sent to ${userId}`);
        } catch (error) {
            console.error('[UnifiedNotificationService] Send push error:', error);
            throw error;
        }
    }

    /**
     * Build notification content based on type
     * @private
     */
    buildNotificationContent(type, actorName, metadata) {
        switch (type) {
            case NOTIFICATION_TYPES.FOLLOW_REQUEST:
                return {
                    title: 'New Follow Request',
                    body: `${actorName} requested to follow you`,
                    data: { type, actorName }
                };

            case NOTIFICATION_TYPES.FOLLOW_ACCEPTED:
                return {
                    title: 'Follow Request Accepted',
                    body: `${actorName} accepted your follow request`,
                    data: { type, actorName }
                };

            case NOTIFICATION_TYPES.NEW_FOLLOWER:
                return {
                    title: 'New Follower',
                    body: `${actorName} started following you`,
                    data: { type, actorName }
                };

            case NOTIFICATION_TYPES.FOLLOW_BACK:
                return {
                    title: 'New Follower',
                    body: `${actorName} followed you back`,
                    data: { type, actorName }
                };

            case NOTIFICATION_TYPES.ADDED_TO_GROUP:
                return {
                    title: 'Added to Group',
                    body: `${actorName} added you to "${metadata.groupName || 'a group'}"`,
                    data: {
                        type,
                        actorName,
                        groupId: metadata.groupId,
                        groupName: metadata.groupName,
                        chatId: metadata.groupId,
                        url: `/chat/${metadata.groupId}`
                    }
                };

            case NOTIFICATION_TYPES.INCOMING_CALL:
                return {
                    title: `Incoming ${metadata.callType === 'video' ? 'Video' : ''} Call`,
                    body: `${actorName} is calling you`,
                    data: {
                        type,
                        actorName,
                        callId: metadata.callId,
                        callType: metadata.callType,
                        action: 'answer_call'
                    }
                };

            case NOTIFICATION_TYPES.MISSED_CALL:
                return {
                    title: 'Missed Call',
                    body: `You missed a ${metadata.callType === 'video' ? 'video' : ''} call from ${actorName}`,
                    data: {
                        type,
                        actorName,
                        callId: metadata.callId,
                        callType: metadata.callType,
                        recordingUrl: metadata.recordingUrl
                    }
                };

            case NOTIFICATION_TYPES.CALL_DECLINED:
                return {
                    title: 'Call Declined',
                    body: `${actorName} declined your call`,
                    data: {
                        type,
                        actorName,
                        callId: metadata.callId,
                        callType: metadata.callType
                    }
                };

            default:
                return {
                    title: 'New Notification',
                    body: `${actorName} sent you a notification`,
                    data: { type, actorName }
                };
        }
    }

    /**
     * Subscribe to real-time notifications for a user
     * 
     * @param {string} userId - User ID to subscribe to
     * @param {function} callback - Callback function for new notifications
     * @returns {function} Unsubscribe function
     */
    subscribeToNotifications(userId, callback) {
        try {
            // Check if already subscribed
            if (this.listeners.has(userId)) {
                console.log('ℹ️ Already subscribed to notifications for user:', userId);
                return this.listeners.get(userId);
            }

            console.log('🔔 Subscribing to notifications for user:', userId);

            const notificationsRef = collection(db, 'notifications');
            const q = query(
                notificationsRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const notifications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const unreadCount = notifications.filter(n => !n.read).length;

                callback({
                    notifications,
                    unreadCount,
                    totalCount: notifications.length
                });
            }, (error) => {
                console.error('❌ Notification listener error:', error);
            });

            this.listeners.set(userId, unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('[UnifiedNotificationService] Subscribe error:', error);
            return () => {};
        }
    }

    /**
     * Unsubscribe from notifications
     */
    unsubscribeFromNotifications(userId) {
        if (this.listeners.has(userId)) {
            const unsubscribe = this.listeners.get(userId);
            unsubscribe();
            this.listeners.delete(userId);
            console.log('🔕 Unsubscribed from notifications for user:', userId);
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId) {
        try {
            return await notificationFirebaseService.getUnreadCount(userId);
        } catch (error) {
            console.error('[UnifiedNotificationService] Get unread count error:', error);
            return { success: false, count: 0 };
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        try {
            return await notificationFirebaseService.markAsRead(notificationId);
        } catch (error) {
            console.error('[UnifiedNotificationService] Mark as read error:', error);
            return { success: false };
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        try {
            return await notificationFirebaseService.markAllAsRead(userId);
        } catch (error) {
            console.error('[UnifiedNotificationService] Mark all as read error:', error);
            return { success: false };
        }
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId, limit = 50) {
        try {
            return await notificationFirebaseService.getUserNotifications(userId, limit);
        } catch (error) {
            console.error('[UnifiedNotificationService] Get notifications error:', error);
            return { success: false, notifications: [], unreadCount: 0 };
        }
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId) {
        try {
            return await notificationFirebaseService.deleteNotification(notificationId);
        } catch (error) {
            console.error('[UnifiedNotificationService] Delete notification error:', error);
            return { success: false };
        }
    }
}

// Export singleton instance
const unifiedNotificationService = new UnifiedNotificationService();
export { NOTIFICATION_TYPES };
export default unifiedNotificationService;
