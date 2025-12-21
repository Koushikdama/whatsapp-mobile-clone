import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
// import { useFollowActions } from '../../../shared/hooks/useFollowActions';

/**
 * FollowButton - Smart component to handle follow actions
 * Handles 3 states:
 * 1. Not Following (Show Follow button)
 * 2. Following (Show Following button)
 * 3. Requested (Show Requested button for private accounts)
 */
const FollowButton = ({ targetUserId, className = '', isPrivate = false }) => {
    const { isFollowing, followedUsers, outgoingRequests, currentUser, followUser, unfollowUser } = useApp();
    // const { followUser, unfollowUser, loading } = useFollowActions();
    const [loading, setLoading] = useState(false);
    
    // Determine current state
    const isAlreadyFollowing = isFollowing(targetUserId);
    const isRequested = outgoingRequests.includes(targetUserId);
    const isMe = currentUser?.id === targetUserId;

    if (isMe) return null;

    const handleClick = async (e) => {
        e.stopPropagation();
        
        if (loading) return;
        setLoading(true);

        try {
            if (isAlreadyFollowing) {
                // Unfollow
                if (confirm('Are you sure you want to unfollow this user?')) {
                    await unfollowUser(targetUserId);
                }
            } else if (isRequested) {
                // Cancel request (using unfollow)
                await unfollowUser(targetUserId);
            } else {
                // Follow
                await followUser(targetUserId);
            }
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isAlreadyFollowing) {
        return (
            <button
                onClick={handleClick}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 
                    hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400
                    ${className}`}
            >
                {loading ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <CheckCircle2 size={18} />
                        <span>Following</span>
                    </>
                )}
            </button>
        );
    }

    if (isRequested) {
        return (
            <button
                onClick={handleClick}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 
                    hover:bg-gray-200 dark:hover:bg-gray-600
                    ${className}`}
            >
                {loading ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <Clock size={18} />
                        <span>Requested</span>
                    </>
                )}
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-sm
                ${className}`}
        >
            {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
                <>
                    <UserPlus size={18} />
                    <span>Follow</span>
                </>
            )}
        </button>
    );
};

export default FollowButton;
