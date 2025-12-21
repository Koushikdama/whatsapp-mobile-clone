/**
 * Custom hook for follow/unfollow actions with privacy support
 */
import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import followFirebaseService from '../../services/firebase/FollowFirebaseService';
import userService from '../../services/firebase/UserService';

export const useFollowActions = () => {
    const { currentUser, followedUsers, setFollowedUsers, followersCount, setFollowersCount, followingCount, setFollowingCount } = useApp();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Follow/Request to follow a user
     * Handles both public and private accounts
     */
    const followUser = useCallback(async (targetUserId) => {
        if (!currentUser?.id) {
            setError('You must be logged in to follow users');
            return { success: false };
        }

        setLoading(true);
        setError(null);

        try {
            // First check if the target user has a private account
            const { success: userSuccess, user: targetUser } = await userService.getUser(targetUserId);
            
            if (!userSuccess) {
                throw new Error('User not found');
            }

            const isPrivate = targetUser.isPrivate || false;

            // Call follow service with privacy info
            const result = await followFirebaseService.followUser(
                currentUser.id,
                targetUserId,
                isPrivate
            );

            if (result.success) {
                // If immediate follow (public account)
                if (result.status === 'accepted') {
                    // Optimistic update
                    setFollowedUsers(prev => [...prev, targetUserId]);
                    setFollowingCount(prev => prev + 1);
                }
                // If pending request (private account)
                // UI will show "Requested" state
            }

            setLoading(false);
            return result;
        } catch (err) {
            console.error('Follow error:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    }, [currentUser, setFollowedUsers, setFollowingCount]);

    /**
     * Unfollow a user
     */
    const unfollowUser = useCallback(async (targetUserId) => {
        if (!currentUser?.id) {
            setError('You must be logged in to unfollow users');
            return { success: false };
        }

        setLoading(true);
        setError(null);

        try {
            const result = await followFirebaseService.unfollowUser(
                currentUser.id,
                targetUserId
            );

            if (result.success) {
                // Optimistic update
                setFollowedUsers(prev => prev.filter(id => id !== targetUserId));
                setFollowingCount(prev => Math.max(0, prev - 1));
            }

            setLoading(false);
            return result;
        } catch (err) {
            console.error('Unfollow error:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    }, [currentUser, setFollowedUsers, setFollowingCount]);

    /**
     * Accept a follow request
     */
    const acceptRequest = useCallback(async (followerUserId) => {
        if (!currentUser?.id) {
            return { success: false };
        }

        setLoading(true);
        setError(null);

        try {
            const result = await followFirebaseService.acceptFollowRequest(
                followerUserId,
                currentUser.id
            );

            if (result.success) {
                // Update followers count
                setFollowersCount(prev => prev + 1);
            }

            setLoading(false);
            return result;
        } catch (err) {
            console.error('Accept request error:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    }, [currentUser, setFollowersCount]);

    /**
     * Reject a follow request
     */
    const rejectRequest = useCallback(async (followerUserId) => {
        if (!currentUser?.id) {
            return { success: false };
        }

        setLoading(true);
        setError(null);

        try {
            const result = await followFirebaseService.rejectFollowRequest(
                followerUserId,
                currentUser.id
            );

            setLoading(false);
            return result;
        } catch (err) {
            console.error('Reject request error:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    }, [currentUser]);

    return {
        followUser,
        unfollowUser,
        acceptRequest,
        rejectRequest,
        loading,
        error
    };
};
