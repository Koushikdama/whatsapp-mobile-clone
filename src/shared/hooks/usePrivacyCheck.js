/**
 * Custom hook to check user privacy settings and permissions
 */
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import followFirebaseService from '../../services/firebase/FollowFirebaseService';

export const usePrivacyCheck = (targetUserId) => {
    const { currentUser, users, followedUsers } = useApp();
    const [canView, setCanView] = useState(false);
    const [relationshipStatus, setRelationshipStatus] = useState('none'); // 'none', 'following', 'pending', 'follower'
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!targetUserId || !currentUser?.id) {
            setLoading(false);
            return;
        }

        const checkPrivacy = async () => {
            setLoading(true);

            try {
                // Get target user info
                const targetUser = users[targetUserId];
                const userIsPrivate = targetUser?.isPrivate || false;
                setIsPrivate(userIsPrivate);

                // If viewing own profile or target is public, allow view
                if (targetUserId === currentUser.id || !userIsPrivate) {
                    setCanView(true);
                    setRelationshipStatus(targetUserId === currentUser.id ? 'self' : 'public');
                    setLoading(false);
                    return;
                }

                // Check relationship status
                const { success, isFollowing } = await followFirebaseService.checkFollowStatus(
                    currentUser.id,
                    targetUserId
                );

                if (success && isFollowing) {
                    // Check if accepted or pending
                    const relationshipId = followFirebaseService.generateRelationshipId(currentUser.id, targetUserId);
                    const { success: detailSuccess, relationship } = await followFirebaseService.getRelationship(relationshipId);
                    
                    if (detailSuccess) {
                        if (relationship.status === 'accepted') {
                            setCanView(true);
                            setRelationshipStatus('following');
                        } else if (relationship.status === 'pending') {
                            setCanView(false);
                            setRelationshipStatus('pending');
                        }
                    }
                } else {
                    // Not following - can't view private account
                    setCanView(false);
                    setRelationshipStatus('none');
                }
            } catch (error) {
                console.error('Privacy check error:', error);
                setCanView(false);
            }

            setLoading(false);
        };

        checkPrivacy();
    }, [targetUserId, currentUser, users, followedUsers]);

    return {
        canView,
        relationshipStatus,
        isPrivate,
        loading
    };
};
