/**
 * Group Service
 * Handles all group-related operations following SOLID principles
 * Clean, simple, and easy to understand
 */

import { db } from '../../config/firebaseConfig';
import {
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import FirebaseService, { handleFirebaseError } from './FirebaseService';
import { NOTIFICATION_TYPES } from './NotificationFirebaseService';

class GroupService extends FirebaseService {
    constructor() {
        super();
        this.collectionName = 'groups';
        this.unifiedNotificationService = null;
    }

    /**
     * Lazy load unified notification service to avoid circular dependencies
     * @private
     */
    async getNotificationService() {
        if (!this.unifiedNotificationService) {
            const module = await import('../UnifiedNotificationService');
            this.unifiedNotificationService = module.default;
        }
        return this.unifiedNotificationService;
    }

    /**
     * Update group basic information
     * @param {string} groupId - Group ID
     * @param {object} updates - Fields to update (name, description, avatar)
     */
    async updateGroupInfo(groupId, updates) {
        try {
            const groupRef = doc(db, this.collectionName, groupId);
            
            const allowedFields = ['name', 'description', 'avatar'];
            const filteredUpdates = Object.keys(updates)
                .filter(key => allowedFields.includes(key))
                .reduce((obj, key) => {
                    obj[key] = updates[key];
                    return obj;
                }, {});

            if (Object.keys(filteredUpdates).length === 0) {
                return { success: false, error: 'No valid fields to update' };
            }

            await updateDoc(groupRef, {
                ...filteredUpdates,
                updatedAt: serverTimestamp()
            });

            console.log(`✅ Group ${groupId} info updated`);
            return { success: true };
        } catch (error) {
            console.error('[GroupService] Update group info error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update group permissions
     * @param {string} groupId - Group ID
     * @param {object} permissions - Permission settings
     */
    async updateGroupPermissions(groupId, permissions) {
        try {
            const groupRef = doc(db, this.collectionName, groupId);
            
            await updateDoc(groupRef, {
                permissions,
                updatedAt: serverTimestamp()
            });

            console.log(`✅ Group ${groupId} permissions updated`);
            return { success: true };
        } catch (error) {
            console.error('[GroupService] Update group permissions error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update group settings (e.g., showHistoryToNewMembers)
     * @param {string} groupId - Group ID
     * @param {object} settings - Settings object to update
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updateGroupSettings(groupId, settings) {
        try {
            if (!groupId) {
                return { success: false, error: 'Group ID is required' };
            }

            const groupRef = doc(db, this.collectionName, groupId);

            // Check if group exists
            const groupDoc = await getDoc(groupRef);
            if (!groupDoc.exists()) {
                return { success: false, error: 'Group not found' };
            }

            // Build settings update object with nested field notation
            const settingsUpdate = {};
            Object.keys(settings).forEach(key => {
                settingsUpdate[`settings.${key}`] = settings[key];
            });

            await updateDoc(groupRef, {
                ...settingsUpdate,
                updatedAt: serverTimestamp()
            });

            console.log(`✅ Group ${groupId} settings updated:`, settings);
            return { success: true };
        } catch (error) {
            console.error('[GroupService] Update group settings error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Add participant to group
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID to add
     */
    async addParticipant(groupId, userId) {
        try {
            const groupRef = doc(db, this.collectionName, groupId);
            
            // Check if user is already a participant
            const groupDoc = await getDoc(groupRef);
            if (!groupDoc.exists()) {
                return { success: false, error: 'Group not found' };
            }

            const participants = groupDoc.data().participants || [];
            if (participants.includes(userId)) {
                return { success: false, error: 'User is already a participant' };
            }

            await updateDoc(groupRef, {
                participants: arrayUnion(userId),
                updatedAt: serverTimestamp()
            });

            // Send notification to the added user
            try {
                const notificationService = await this.getNotificationService();
                const addedBy = groupDoc.data().owner || 'admin';
                await notificationService.sendNotification(
                    userId,
                    addedBy,
                    NOTIFICATION_TYPES.ADDED_TO_GROUP,
                    {
                        groupId,
                        groupName: groupDoc.data().name || 'a group'
                    }
                );
            } catch (notifError) {
                console.warn('⚠️ Failed to send notification:', notifError);
            }

            console.log(`✅ User ${userId} added to group ${groupId}`);
            return { success: true };
        } catch (error) {
            console.error('[GroupService] Add participant error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Remove participant from group
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID to remove
     */
    async removeParticipant(groupId, userId) {
        try {
            const batch = writeBatch(db);
            const groupRef = doc(db, this.collectionName, groupId);
            
            // Remove from participants and admins
            batch.update(groupRef, {
                participants: arrayRemove(userId),
                admins: arrayRemove(userId),
                updatedAt: serverTimestamp()
            });

            await batch.commit();

            console.log(`✅ User ${userId} removed from group ${groupId}`);
            return { success: true };
        } catch (error) {
            console.error('[GroupService] Remove participant error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Promote user to admin
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID to promote
     */
    async promoteToAdmin(groupId, userId) {
        try {
            const groupRef = doc(db, this.collectionName, groupId);
            
            // Verify user is a participant
            const groupDoc = await getDoc(groupRef);
            if (!groupDoc.exists()) {
                return { success: false, error: 'Group not found' };
            }

            const participants = groupDoc.data().participants || [];
            const admins = groupDoc.data().admins || [];

            if (!participants.includes(userId)) {
                return { success: false, error: 'User is not a participant' };
            }

            if (admins.includes(userId)) {
                return { success: false, error: 'User is already an admin' };
            }

            await updateDoc(groupRef, {
                admins: arrayUnion(userId),
                updatedAt: serverTimestamp()
            });

            console.log(`✅ User ${userId} promoted to admin in group ${groupId}`);
            return { success: true };
        } catch (error) {
            console.error('[GroupService] Promote to admin error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Demote admin to regular member
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID to demote
     */
    async demoteFromAdmin(groupId, userId) {
        try {
            const groupRef = doc(db, this.collectionName, groupId);
            
            await updateDoc(groupRef, {
                admins: arrayRemove(userId),
                updatedAt: serverTimestamp()
            });

            console.log(`✅ User ${userId} demoted from admin in group ${groupId}`);
            return { success: true };
        } catch (error) {
            console.error('[GroupService] Demote from admin error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Transfer group ownership
     * @param {string} groupId - Group ID
     * @param {string} newOwnerId - New owner user ID
     * @param {string} currentOwnerId - Current owner user ID  
     */
    async transferOwnership(groupId, newOwnerId, currentOwnerId) {
        try {
            const batch = writeBatch(db);
            const groupRef = doc(db, this.collectionName, groupId);
            
            // Verify new owner is a participant
            const groupDoc = await getDoc(groupRef);
            if (!groupDoc.exists()) {
                return { success: false, error: 'Group not found' };
            }

            const participants = groupDoc.data().participants || [];
            if (!participants.includes(newOwnerId)) {
                return { success: false, error: 'New owner must be a participant' };
            }

            // Transfer ownership and make both admins
            batch.update(groupRef, {
                owner: newOwnerId,
                admins: arrayUnion(newOwnerId, currentOwnerId),
                updatedAt: serverTimestamp()
            });

            await batch.commit();

            console.log(`✅ Ownership transferred to ${newOwnerId} in group ${groupId}`);
            return { success: true };
        } catch (error) {
            console.error('[GroupService] Transfer ownership error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Leave group (for regular members and admins)
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID leaving
     */
    async leaveGroup(groupId, userId) {
        try {
            const groupDoc = await getDoc(doc(db, this.collectionName, groupId));
            if (!groupDoc.exists()) {
                return { success: false, error: 'Group not found' };
            }

            const group = groupDoc.data();
            
            // Owner cannot leave, must transfer ownership first
            if (group.owner === userId) {
                return { 
                    success: false, 
                    error: 'Owner must transfer ownership before leaving' 
                };
            }

            // Remove from group
            await this.removeParticipant(groupId, userId);

            console.log(`✅ User ${userId} left group ${groupId}`);
            return { success: true };
        } catch (error) {
            console.error('[GroupService] Leave group error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Delete group (owner only)
     * @param {string} groupId - Group ID
     */
    async deleteGroup(groupId) {
        try {
            const groupRef = doc(db, this.collectionName, groupId);
            await deleteDoc(groupRef);

            console.log(`✅ Group ${groupId} deleted`);
            return { success: true };
        } catch (error) {
            console.error('[GroupService] Delete group error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Mute group notifications
     * @param {string} groupId - Group ID
     * @param {number|null} duration - Mute duration in milliseconds (null for unmute)
     */
    async muteGroup(groupId, duration) {
        try {
            const groupRef = doc(db, this.collectionName, groupId);
            const muteUntil = duration ? new Date(Date.now() + duration) : null;

            await updateDoc(groupRef, {
                'settings.muteUntil': muteUntil,
                updatedAt: serverTimestamp()
            });

            console.log(`✅ Group ${groupId} mute status updated`);
            return { success: true };
        } catch (error) {
            console.error('[GroupService] Mute group error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Check if user is admin
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID
     */
    async isAdmin(groupId, userId) {
        try {
            const groupDoc = await getDoc(doc(db, this.collectionName, groupId));
            if (!groupDoc.exists()) {
                return false;
            }

            const admins = groupDoc.data().admins || [];
            return admins.includes(userId) || groupDoc.data().owner === userId;
        } catch (error) {
            console.error('[GroupService] Is admin check error:', error);
            return false;
        }
    }

    /**
     * Check if user is owner
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID
     */
    async isOwner(groupId, userId) {
        try {
            const groupDoc = await getDoc(doc(db, this.collectionName, groupId));
            if (!groupDoc.exists()) {
                return false;
            }

            return groupDoc.data().owner === userId;
        } catch (error) {
            console.error('[GroupService] Is owner check error:', error);
            return false;
        }
    }
}

// Export singleton instance
export const groupService = new GroupService();
export default groupService;
