/**
 * Follow Firebase Service
 * Manages follow relationships and related operations in Firestore
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
    increment,
    writeBatch,
    arrayUnion,
    arrayRemove,
    onSnapshot
} from 'firebase/firestore';
import FirebaseService, { handleFirebaseError } from './FirebaseService';
import { notificationFirebaseService, NOTIFICATION_TYPES } from './NotificationFirebaseService';

/**
 * FollowFirebaseService
 * Manages user follow relationships with support for private account privacy.
 * Implements Instagram-style follow request workflow for private accounts.
 * 
 * @extends FirebaseService
 * @class
 */
class FollowFirebaseService extends FirebaseService {
    constructor() {
        super();
        this.collectionName = 'follows';
    }

    /**
     * Generates a unique relationship ID for two users
     * Format: follows_{smallerId}_{largerId}
     * 
     * @param {string} followerId - The ID of the user initiating the follow.
     * @param {string} followingId - The ID of the user being followed.
     * @returns {string} Unique relationship ID
     * @private
     */
    generateRelationshipId(followerId, followingId) {
        return `${followerId}_${followingId}`;
    }

    /**
     * Follow a user (handles both public and private accounts)
     * For private accounts, creates a pending follow request
     * For public accounts, creates immediate follow relationship
     */
    async followUser(followerId,followingId, isPrivateAccount = false) {
        try {
            if (followerId === followingId) {
                throw new Error('Cannot follow yourself');
            }

            const relationshipId = this.generateRelationshipId(followerId, followingId);
            const relationshipRef = doc(db, this.collectionName, relationshipId);

            // Check if already following or request exists
            const existingDoc = await getDoc(relationshipRef);
            if (existingDoc.exists()) {
                const status = existingDoc.data().status;
                if (status === 'accepted') {
                    return {
                        success: true,
                        message: 'Already following this user'
                    };
                } else if (status === 'pending') {
                    return {
                        success: true,
                        isPending: true,
                        message: 'Follow request already pending'
                    };
                }
            }

            const batch = writeBatch(db);

            // Determine status based on account privacy
            const status = isPrivateAccount ? 'pending' : 'accepted';

            // Create follow relationship
            batch.set(relationshipRef, {
                followerId,
                followingId,
                status,  // 'pending' or 'accepted'
                createdAt: serverTimestamp(),
                notificationSent: false
            });

            // Only update counts if immediately accepted (public account)
            if (status === 'accepted') {
                // Update follower's following count and following array
                const followerRef = doc(db, 'users', followerId);
                batch.update(followerRef, {
                    followingCount: increment(1),
                    following: arrayUnion(followingId)
                });

                // Update following user's followers count and followers array
                const followingRef = doc(db, 'users', followingId);
                batch.update(followingRef, {
                    followersCount: increment(1),
                    followers: arrayUnion(followerId)
                });
            }

            await batch.commit();

            // Create notification
            if (status === 'pending') {
                // Private account - send follow request notification
                await notificationFirebaseService.createNotification(
                    followingId,
                    followerId,
                    NOTIFICATION_TYPES.FOLLOW_REQUEST,
                    { relationshipId }
                ).catch(err => console.error('Notification creation failed:', err));
            } else {
                // Public account - send new follower notification
                await notificationFirebaseService.createNotification(
                    followingId,
                    followerId,
                    NOTIFICATION_TYPES.NEW_FOLLOWER,
                    { relationshipId }
                ).catch(err => console.error('Notification creation failed:', err));

                // Check if this is a follow-back (mutual)
                const reverseRelationshipId = this.generateRelationshipId(followingId, followerId);
                const reverseDoc = await getDoc(doc(db, this.collectionName, reverseRelationshipId));
                if (reverseDoc.exists() && reverseDoc.data().status === 'accepted') {
                    // It's a follow-back!
                    await notificationFirebaseService.createNotification(
                        followingId,
                        followerId,
                        NOTIFICATION_TYPES.FOLLOW_BACK,
                        { relationshipId }
                    ).catch(err => console.error('Follow-back notification failed:', err));
                }
            }

            console.log(`✅ User ${followerId} ${status === 'pending' ? 'requested to follow' : 'followed'} ${followingId}`);
            return {
                success: true,
                relationshipId,
                isPending: status === 'pending',
                status
            };
        } catch (error) {
            console.error('[FollowService] Follow user error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Unfollow a user
     */
    async unfollowUser(followerId, followingId) {
        try {
            const relationshipId = this.generateRelationshipId(followerId, followingId);
            const relationshipRef = doc(db, this.collectionName, relationshipId);

            // Check if relationship exists
            const existingDoc = await getDoc(relationshipRef);
            if (!existingDoc.exists()) {
                return {
                    success: true,
                    message: 'Not following this user'
                };
            }

            // Use batch write for atomic operation
            const batch = writeBatch(db);

            // Delete follow relationship
            batch.delete(relationshipRef);

            // Update follower's following count and following array
            const followerRef = doc(db, 'users', followerId);
            batch.update(followerRef, {
                followingCount: increment(-1),
                following: arrayRemove(followingId)  // Remove from following array
            });

            // Update following user's followers count and followers array
            const followingRef = doc(db, 'users', followingId);
            batch.update(followingRef, {
                followersCount: increment(-1),
                followers: arrayRemove(followerId)  // Remove from followers array
            });

            await batch.commit();

            console.log(`✅ User ${followerId} unfollowed ${followingId}`);
            return {
                success: true
            };
        } catch (error) {
            console.error('[FollowService] Unfollow user error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Check if user is following another user
     */
    async checkFollowStatus(followerId, followingId) {
        try {
            const relationshipId = this.generateRelationshipId(followerId, followingId);
            const relationshipRef = doc(db, this.collectionName, relationshipId);
            const docSnap = await getDoc(relationshipRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    success: true,
                    isFollowing: data.status === 'accepted',
                    isPending: data.status === 'pending',
                    status: data.status
                };
            }

            return {
                success: true,
                isFollowing: false,
                isPending: false,
                status: null
            };
        } catch (error) {
            console.error('[FollowService] Check follow status error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get all followers of a user
     */
    async getFollowers(userId, maxResults = 100) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('followingId', '==', userId),
                where('status', '==', 'accepted'),
                orderBy('createdAt', 'desc'),
                limit(maxResults)
            );

            const snapshot = await getDocs(q);
            const followers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                followerId: doc.data().followerId
            }));

            return {
                success: true,
                followers,
                count: followers.length
            };
        } catch (error) {
            console.error('[FollowService] Get followers error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get all users that a user is following
     */
    async getFollowing(userId, maxResults = 100) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('followerId', '==', userId),
                where('status', '==', 'accepted'),
                orderBy('createdAt', 'desc'),
                limit(maxResults)
            );

            const snapshot = await getDocs(q);
            const following = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                followingId: doc.data().followingId
            }));

            return {
                success: true,
                following,
                count: following.length
            };
        } catch (error) {
            console.error('[FollowService] Get following error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get mutual connections (users who follow each other)
     */
    async getMutualConnections(userId, otherUserId) {
        try {
            // Check if both users follow each other
            const followsOther = await this.checkFollowStatus(userId, otherUserId);
            const otherFollowsBack = await this.checkFollowStatus(otherUserId, userId);

            const isMutual = followsOther.isFollowing && otherFollowsBack.isFollowing;

            return {
                success: true,
                isMutual
            };
        } catch (error) {
            console.error('[FollowService] Get mutual connections error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get follow statistics for a user
     */
    async getFollowStats(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            const userData = userSnap.data();

            return {
                success: true,
                stats: {
                    followersCount: userData.followersCount || 0,
                    followingCount: userData.followingCount || 0
                }
            };
        } catch (error) {
            console.error('[FollowService] Get follow stats error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Subscribe to follow updates for a user (real-time)
     */
    subscribeToFollowUpdates(userId, callback, onError) {
        // Subscribe to changes where user is being followed
        const followersQuery = query(
            collection(db, this.collectionName),
            where('followingId', '==', userId)
        );

        // Subscribe to changes where user is following others
        const followingQuery = query(
            collection(db, this.collectionName),
            where('followerId', '==', userId)
        );

        const unsubscribeFollowers = onSnapshot(
            followersQuery,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback({ type: 'followers', data });
            },
            (error) => {
                console.error('[Firebase] Followers subscription error:', error);
                if (onError) onError(handleFirebaseError(error));
            }
        );

        const unsubscribeFollowing = onSnapshot(
            followingQuery,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback({ type: 'following', data });
            },
            (error) => {
                console.error('[Firebase] Following subscription error:', error);
                if (onError) onError(handleFirebaseError(error));
            }
        );

        // Return combined unsubscribe function
        return () => {
            unsubscribeFollowers();
            unsubscribeFollowing();
        };
    }

    /**
     * Mark notification as sent for a follow relationship
     */
    async markNotificationSent(followerId, followingId) {
        try {
            const relationshipId = this.generateRelationshipId(followerId, followingId);
            const relationshipRef = doc(db, this.collectionName, relationshipId);

            await updateDoc(relationshipRef, {
                notificationSent: true
            });

            return { success: true };
        } catch (error) {
            console.error('[FollowService] Mark notification sent error:', error);
            // Don't throw, notification marking is non-critical
            return { success: false };
        }
    }

    /**
     * Accept a follow request (for private accounts)
     */
    async acceptFollowRequest(followerId, followingId) {
        try {
            const relationshipId = this.generateRelationshipId(followerId, followingId);
            const relationshipRef = doc(db, this.collectionName, relationshipId);

            // Check if relationship exists and is pending
            const existingDoc = await getDoc(relationshipRef);
            if (!existingDoc.exists()) {
                return {
                    success: false,
                    error: 'Follow request not found'
                };
            }

            if (existingDoc.data().status !== 'pending') {
                return {
                    success: false,
                    error: 'No pending request to accept'
                };
            }

            // Use batch write for atomic operation
            const batch = writeBatch(db);

            // Update relationship status to accepted
            batch.update(relationshipRef, {
                status: 'accepted',
                acceptedAt: serverTimestamp()
            });

            // Update follower's following count and array
            const followerRef = doc(db, 'users', followerId);
            batch.update(followerRef, {
                followingCount: increment(1),
                following: arrayUnion(followingId)
            });

            // Update following user's followers count and array
            const followingRef = doc(db, 'users', followingId);
            batch.update(followingRef, {
                followersCount: increment(1),
                followers: arrayUnion(followerId)
            });

            await batch.commit();

            // Create notification for follower (their request was accepted)
            await notificationFirebaseService.createNotification(
                followerId,
                followingId,
                NOTIFICATION_TYPES.FOLLOW_ACCEPTED,
                { relationshipId }
            ).catch(err => console.error('Accepted notification failed:', err));

            console.log(`✅ Follow request from ${followerId} accepted by ${followingId}`);
            return {
                success: true
            };
        } catch (error) {
            console.error('[FollowService] Accept follow request error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Reject a follow request (for private accounts)
     */
    async rejectFollowRequest(followerId, followingId) {
        try {
            const relationshipId = this.generateRelationshipId(followerId, followingId);
            const relationshipRef = doc(db, this.collectionName, relationshipId);

            // Check if relationship exists and is pending
            const existingDoc = await getDoc(relationshipRef);
            if (!existingDoc.exists()) {
                return {
                    success: false,
                    error: 'Follow request not found'
                };
            }

            if (existingDoc.data().status !== 'pending') {
                return {
                    success: false,
                    error: 'No pending request to reject'
                };
            }

            // Delete the relationship
            await deleteDoc(relationshipRef);

            console.log(`✅ Follow request from ${followerId} rejected by ${followingId}`);
            return {
                success: true
            };
        } catch (error) {
            console.error('[FollowService] Reject follow request error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get pending follow requests for a user (incoming requests)
     */
    async getPendingRequests(userId, maxResults = 50) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('followingId', '==', userId),
                where('status', '==', 'pending'),
                orderBy('createdAt', 'desc'),
                limit(maxResults)
            );

            const snapshot = await getDocs(q);
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                followerId: doc.data().followerId
            }));

            return {
                success: true,
                requests,
                count: requests.length
            };
        } catch (error) {
            console.error('[FollowService] Get pending requests error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get outgoing follow requests (users I requested to follow)
     */
    async getOutgoingRequests(userId, maxResults = 50) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('followerId', '==', userId),
                where('status', '==', 'pending'),
                orderBy('createdAt', 'desc'),
                limit(maxResults)
            );

            const snapshot = await getDocs(q);
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                followingId: doc.data().followingId
            }));

            return {
                success: true,
                requests,
                count: requests.length
            };
        } catch (error) {
            console.error('[FollowService] Get outgoing requests error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Cancel an outgoing follow request (withdraw request)
     * This is the same as unfollowing before the request is accepted
     */
    async cancelFollowRequest(followerId, followingId) {
        try {
            const relationshipId = this.generateRelationshipId(followerId, followingId);
            const relationshipRef = doc(db, this.collectionName, relationshipId);

            // Check if relationship exists and is pending
            const existingDoc = await getDoc(relationshipRef);
            if (!existingDoc.exists()) {
                return {
                    success: false,
                    error: 'Follow request not found'
                };
            }

            if (existingDoc.data().status !== 'pending') {
                return {
                    success: false,
                    error: 'No pending request to cancel'
                };
            }

            // Delete the pending relationship
            await deleteDoc(relationshipRef);

            console.log(`✅ Follow request from ${followerId} to ${followingId} cancelled`);
            return {
                success: true
            };
        } catch (error) {
            console.error('[FollowService] Cancel follow request error:', error);
            throw handleFirebaseError(error);
        }
    }
}

// Export singleton instance
export const followFirebaseService = new FollowFirebaseService();
export default followFirebaseService;
