/**
 * Custom hook to check user privacy settings and permissions
 * Provides comprehensive privacy checks for profile, content, and messaging
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import followFirebaseService from '../../services/firebase/FollowFirebaseService';

export const usePrivacyCheck = (targetUserId) => {
    const { currentUser, users, followedUsers } = useApp();
    const [canView, setCanView] = useState(false);
    const [relationshipStatus, setRelationshipStatus] = useState('none'); // 'none', 'following', 'pending', 'follower', 'self', 'public'
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!targetUserId || !currentUser?.id) {
            setLoading(false);
            return;
        }

        const checkPrivacy = async () => {
            setLoading(true);
            setError(null);

            try {
                // Get target user info
                const targetUser = users[targetUserId];
                const userIsPrivate = targetUser?.isPrivate || false;
                setIsPrivate(userIsPrivate);

                // If viewing own profile, always allow
                if (targetUserId === currentUser.id) {
                    setCanView(true);
                    setRelationshipStatus('self');
                    setLoading(false);
                    return;
                }

                // If target is public account, allow view
                if (!userIsPrivate) {
                    setCanView(true);
                    setRelationshipStatus('public');
                    setLoading(false);
                    return;
                }

                // For private accounts, check follow status
                const { success, isFollowing, isPending, status } = await followFirebaseService.checkFollowStatus(
                    currentUser.id,
                    targetUserId
                );

                if (success) {
                    if (status === 'accepted' && isFollowing) {
                        // Accepted follow - can view profile
                        setCanView(true);
                        setRelationshipStatus('following');
                    } else if (status === 'pending' || isPending) {
                        // Pending request - cannot view yet
                        setCanView(false);
                        setRelationshipStatus('pending');
                    } else {
                        // No relationship - cannot view private account
                        setCanView(false);
                        setRelationshipStatus('none');
                    }
                } else {
                    setCanView(false);
                    setRelationshipStatus('none');
                }
            } catch (err) {
                console.error('Privacy check error:', err);
                setError(err.message || 'Failed to check privacy settings');
                setCanView(false);
                setRelationshipStatus('none');
            }

            setLoading(false);
        };

        checkPrivacy();
    }, [targetUserId, currentUser, users, followedUsers]);

    // Memoized helper methods for specific content types
    const canViewStatus = useMemo(() => {
        // Status visible if: own profile, public account, or following (accepted)
        return relationshipStatus === 'self' ||
            relationshipStatus === 'public' ||
            relationshipStatus === 'following';
    }, [relationshipStatus]);

    const canViewMedia = useMemo(() => {
        // Media visible with same rules as status
        return canViewStatus;
    }, [canViewStatus]);

    const canSendMessage = useMemo(() => {
        // Can send message if: own profile (shouldn't happen) or following/public
        return relationshipStatus === 'self' ||
            relationshipStatus === 'public' ||
            relationshipStatus === 'following';
    }, [relationshipStatus]);

    const canViewProfile = useMemo(() => {
        return canView;
    }, [canView]);

    return {
        // Main privacy check
        canView,
        canViewProfile,

        // Content-specific checks
        canViewStatus,
        canViewMedia,
        canSendMessage,

        // Relationship info
        relationshipStatus,
        isPrivate,

        // State
        loading,
        error
    };
};
