import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Users, Lock, ChevronRight } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import followFirebaseService from '../../../services/firebase/FollowFirebaseService';
import FollowButton from './FollowButton';

/**
 * UserProfile - Dedicated user profile page
 * Shows user information, follower/following counts, and action buttons
 */
const UserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const {
        users,
        currentUserId,
        followUser,
        unfollowUser,
        isFollowing,
        followersCount: currentUserFollowersCount,
        followingCount: currentUserFollowingCount
    } = useApp();

    const [profileUser, setProfileUser] = useState(null);
    const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
    const [mutualCount, setMutualCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const isOwnProfile = userId === currentUserId;

    // Load user profile and stats
    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);

            // Get user from local data
            const user = users[userId];
            if (user) {
                setProfileUser(user);
            }

            // Load follow stats from Firebase
            try {
                const statsResult = await followFirebaseService.getFollowStats(userId);
                if (statsResult.success) {
                    setStats(statsResult.stats);
                }

                // Calculate mutual connections if not own profile
                if (!isOwnProfile && currentUserId) {
                    const { success, following } = await followFirebaseService.getFollowing(userId);
                    if (success && following) {
                        const theirFollowing = following.map(f => f.followingId);
                        
                        // Get current user's following
                        const myFollowingResult = await followFirebaseService.getFollowing(currentUserId);
                        if (myFollowingResult.success) {
                            const myFollowing = myFollowingResult.following.map(f => f.followingId);
                            const mutual = myFollowing.filter(id => theirFollowing.includes(id));
                            setMutualCount(mutual.length);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            }

            setLoading(false);
        };

        loadProfile();
    }, [userId, users, currentUserId, isOwnProfile]);

    const canViewProfile = isOwnProfile || !profileUser.isPrivate || isFollowing(userId);

    const handleMessage = async () => {
        // Import chat service dynamically
        const chatFirebaseService = (await import('../../../services/firebase/ChatFirebaseService')).default;
        
        try {
            const result = await chatFirebaseService.createDirectChat(currentUserId, userId);
            if (result.success) {
                // If chat is new, add it to chats state before navigating
                if (result.isNew && result.chat) {
                    const { chats: currentChats } = useApp();
                    const newChat = {
                        ...result.chat,
                        contactId: userId,
                        contactName: profileUser?.name || 'User',
                        contactAvatar: profileUser?.avatar,
                        unreadCount: 0
                    };
                    
                    // Note: We'll use navigate with state to pass the new chat
                    navigate(`/chat/${result.chatId}`, { state: { newChat } });
                } else {
                    navigate(`/chat/${result.chatId}`);
                }
            }
        } catch (error) {
            console.error('Error creating chat:', error);
            alert('Unable to create chat. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-wa-dark">
                <div className="text-gray-500 dark:text-gray-400">Loading profile...</div>
            </div>
        );
    }

    if (!profileUser) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-wa-dark">
                <div className="text-gray-500 dark:text-gray-400 mb-4">User not found</div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-wa-dark">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-wa-dark-bg border-b border-gray-200 dark:border-gray-700 z-10">
                <div className="flex items-center gap-4 px-4 py-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Profile
                        </h1>
                    </div>
                </div>
            </div>

            {/* Profile Content */}
            <div className="max-w-2xl mx-auto">
                {/* Cover/Header Section */}
                <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-500"></div>

                {/* Avatar and Basic Info */}
                <div className="px-6 -mt-16 pb-6">
                    <div className="flex flex-col items-center text-center mb-6">
                        {/* Avatar */}
                        <div className="relative mb-4">
                            <img
                                src={profileUser.avatar}
                                alt={profileUser.name}
                                className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg"
                            />
                        </div>

                        {/* Name */}
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                            {profileUser.name}
                        </h2>

                        {/* About */}
                        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                            {profileUser.about || 'Hey there! I am using WhatsApp.'}
                        </p>

                        {/* Stats */}
                        {/* Stats - Only show if can view profile */}
                        {canViewProfile && (
                            <div className="flex gap-8 mb-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {isOwnProfile ? currentUserFollowersCount : stats.followersCount}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {isOwnProfile ? currentUserFollowingCount : stats.followingCount}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Following</div>
                                </div>
                            </div>
                        )}

                        {/* Mutual Connections */}
                        {!isOwnProfile && mutualCount > 0 && (
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
                                <Users size={18} />
                                <span className="text-sm font-medium">
                                    {mutualCount} mutual connection{mutualCount > 1 ? 's' : ''}
                                </span>
                            </div>
                        )}

                        {/* Action Buttons - Only show if not own profile */}
                        {!isOwnProfile && (
                            <div className="flex gap-3 w-full max-w-sm">
                                {/* Follow Button */}
                                <FollowButton 
                                    targetUserId={userId} 
                                    className="flex-1"
                                    isPrivate={profileUser.isPrivate}
                                />

                                {/* Message Button - Only show if following */}
                                {isFollowing(userId) && (
                                    <button
                                        onClick={handleMessage}
                                        className="flex-1 py-3 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={18} />
                                        Message
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Private Account Message */}
                    {!canViewProfile && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl mt-6 mx-6 border border-gray-100 dark:border-gray-800">
                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                                <Lock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                This account is private
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                                Follow this account to see their photos and updates.
                            </p>
                        </div>
                    )}

                    {/* Additional Info Section - Only show if can view profile */}
                    {canViewProfile && (
                        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 px-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Information
                            </h3>
                            
                            <div className="space-y-3">
                                {profileUser.phone && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 dark:text-gray-400 w-24">Phone</span>
                                        <span className="text-gray-900 dark:text-gray-100">{profileUser.phone}</span>
                                    </div>
                                )}
                                {profileUser.email && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 dark:text-gray-400 w-24">Email</span>
                                        <span className="text-gray-900 dark:text-gray-100">{profileUser.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Own Profile Actions */}
                    {isOwnProfile && (
                        <div className="px-6 mt-6">
                             <button
                                onClick={() => navigate('/follow-requests')}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                        <Users size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-medium text-gray-900 dark:text-white">Follow Requests</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Manage incoming requests</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-400" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
