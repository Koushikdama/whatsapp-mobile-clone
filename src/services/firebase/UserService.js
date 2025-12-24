/**
 * User Service
 * Manages user profiles and user-related operations in Firestore
 */

import { db } from '../../config/firebaseConfig';
import {
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import FirebaseService, { handleFirebaseError } from './FirebaseService';

class UserService extends FirebaseService {
    constructor() {
        super();
        this.collectionName = 'users';
    }

    /**
     * Get user by ID
     */
    async getUser(userId) {
        try {
            const userRef = doc(db, this.collectionName, userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return {
                    success: true,
                    user: { id: userSnap.id, ...userSnap.data() }
                };
            } else {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
        } catch (error) {
            console.error('[UserService] Get user error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get multiple users by IDs
     */
    async getUsers(userIds) {
        try {
            const users = {};
            
            // Fetch users in parallel
            const promises = userIds.map(async (userId) => {
                const userRef = doc(db, this.collectionName, userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    users[userId] = { id: userSnap.id, ...userSnap.data() };
                }
            });

            await Promise.all(promises);

            return {
                success: true,
                users
            };
        } catch (error) {
            console.error('[UserService] Get users error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId, updates) {
        try {
            const userRef = doc(db, this.collectionName, userId);
            
            // Filter out undefined values
            const validUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            await updateDoc(userRef, {
                ...validUpdates,
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('[UserService] Update profile error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update user avatar
     */
    async updateAvatar(userId, avatarUrl) {
        try {
            return await this.updateUserProfile(userId, { avatar: avatarUrl });
        } catch (error) {
            console.error('[UserService] Update avatar error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update user about/status
     */
    async updateAbout(userId, about) {
        try {
            return await this.updateUserProfile(userId, { about });
        } catch (error) {
            console.error('[UserService] Update about error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update user name
     */
    async updateName(userId, name) {
        try {
            return await this.updateUserProfile(userId, { name });
        } catch (error) {
            console.error('[UserService] Update name error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Search users by name or email
     */
    async searchUsers(searchQuery, maxResults = 20) {
        try {
            const usersRef = collection(db, this.collectionName);
            
            // Search by name (case-insensitive prefix match)
            const q = query(
                usersRef,
                where('name', '>=', searchQuery),
                where('name', '<=', searchQuery + '\uf8ff'),
                limit(maxResults)
            );

            const snapshot = await getDocs(q);
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                success: true,
                users
            };
        } catch (error) {
            console.error('[UserService] Search users error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        try {
            const usersRef = collection(db, this.collectionName);
            const q = query(usersRef, where('email', '==', email), limit(1));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return {
                    success: true,
                    user: { id: doc.id, ...doc.data() }
                };
            } else {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
        } catch (error) {
            console.error('[UserService] Get user by email error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get all users
     */
    async getAllUsers(maxResults = 50) {
        try {
            const usersRef = collection(db, this.collectionName);
            const q = query(usersRef, limit(maxResults));
            const snapshot = await getDocs(q);

            const users = [];
            snapshot.forEach(doc => {
                users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return {
                success: true,
                users
            };
        } catch (error) {
            console.error('[UserService] Get all users error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update user online status
     */
    async updateOnlineStatus(userId, isOnline) {
        try {
            const userRef = doc(db, this.collectionName, userId);
            await updateDoc(userRef, {
                isOnline,
                lastSeen: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('[UserService] Update online status error:', error);
            // Don't throw for online status errors
            return { success: false };
        }
    }

    /**
     * Block user
     */
    async blockUser(userId, blockedUserId) {
        try {
            const userRef = doc(db, this.collectionName, userId);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                throw new Error('User not found');
            }

            const userData = userSnap.data();
            const blockedUsers = userData.blockedUsers || [];
            
            if (!blockedUsers.includes(blockedUserId)) {
                blockedUsers.push(blockedUserId);
                await updateDoc(userRef, { blockedUsers });
            }

            return { success: true };
        } catch (error) {
            console.error('[UserService] Block user error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Unblock user
     */
    async unblockUser(userId, blockedUserId) {
        try {
            const userRef = doc(db, this.collectionName, userId);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                throw new Error('User not found');
            }

            const userData = userSnap.data();
            const blockedUsers = (userData.blockedUsers || []).filter(id => id !== blockedUserId);
            
            await updateDoc(userRef, { blockedUsers });

            return { success: true };
        } catch (error) {
            console.error('[UserService] Unblock user error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Subscribe to user profile changes
     */
    subscribeToUser(userId, callback, onError) {
        return this.subscribeToDocument(this.collectionName, userId, callback, onError);
    }

    /**
     * Save FCM token for a user
     * @param {string} userId - User ID
     * @param {string} fcmToken - FCM registration token
     */
    async saveFcmToken(userId, fcmToken) {
        try {
            if (!userId || !fcmToken) {
                return { success: false, error: 'userId and fcmToken are required' };
            }

            const userRef = doc(db, this.collectionName, userId);
            await updateDoc(userRef, {
                fcmToken,
                updatedAt: serverTimestamp()
            });

            console.log(`✅ FCM token saved for user ${userId}`);
            return { success: true };
        } catch (error) {
            console.error('[UserService] Save FCM token error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get FCM token for a user
     * @param {string} userId - User ID
     */
    async getFcmToken(userId) {
        try {
            const userResult = await this.getUser(userId);
            if (userResult.success && userResult.user?.fcmToken) {
                return { success: true, token: userResult.user.fcmToken };
            }
            return { success: false, error: 'No FCM token found' };
        } catch (error) {
            console.error('[UserService] Get FCM token error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove FCM token for a user
     * @param {string} userId - User ID
     */
    async removeFcmToken(userId) {
        try {
            const userRef = doc(db, this.collectionName, userId);
            await updateDoc(userRef, {
                fcmToken: null,
                updatedAt: serverTimestamp()
            });

            console.log(`✅ FCM token removed for user ${userId}`);
            return { success: true };
        } catch (error) {
            console.error('[UserService] Remove FCM token error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Subscribe to online users
     */
    subscribeToOnlineUsers(callback, onError) {
        const queryConstraints = [
            where('isOnline', '==', true),
            orderBy('lastSeen', 'desc')
        ];
        
        return this.subscribeToCollection(this.collectionName, queryConstraints, callback, onError);
    }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
