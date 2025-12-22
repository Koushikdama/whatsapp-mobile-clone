import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Check } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import notificationFirebaseService, { NOTIFICATION_TYPES } from '../../../services/firebase/NotificationFirebaseService';
import userService from '../../../services/firebase/UserService';

/**
 * NotificationItem Component
 * Displays a single notification with appropriate icon, message, and actions
 */
const NotificationItem = ({ notification, onActionTaken }) => {
    const navigate = useNavigate();
    const { users, acceptRequest, rejectRequest, followUser, unfollowUser, isFollowing } = useApp();
    const [loading, setLoading] = useState(false);
    const [actorUser, setActorUser] = useState(null);

    // Load actor user data
    useEffect(() => {
        const loadActor = async () => {
            if (notification.actorId && !users[notification.actorId]) {
                try {
                    const result = await userService.getUser(notification.actorId);
                    if (result.success) {
                        setActorUser(result.user);
                    }
                } catch (error) {
                    console.error('Failed to load actor:', error);
                }
            } else {
                setActorUser(users[notification.actorId]);
            }
        };
        loadActor();
    }, [notification.actorId, users]);

    const actor = actorUser;
    if (!actor) return null;

    const getNotificationContent = () => {
        switch (notification.type) {
            case NOTIFICATION_TYPES.FOLLOW_REQUEST:
                return {
                    icon: '👤',
                    message: `requested to follow you`,
                    action: (
                        <div className="flex gap-2">
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        await acceptRequest(notification.actorId);
                                        onActionTaken?.();
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                                className="px-4 py-1.5 bg-wa-teal text-white rounded-lg text-sm font-medium hover:bg-wa-tealDark disabled:opacity-50"
                            >
                                Accept
                            </button>
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        await rejectRequest(notification.actorId);
                                        onActionTaken?.();
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                                className="px-4 py-1.5 bg-gray-200 dark:bg-wa-dark-hover text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-wa-dark-border disabled:opacity-50"
                            >
                                Reject
                            </button>
                        </div>
                    )
                };
            case NOTIFICATION_TYPES.FOLLOW_ACCEPTED:
                return {
                    icon: '✅',
                    message: `accepted your follow request`,
                    action: (
                        <button
                            onClick={() => navigate(`/profile/${actor.id}`)}
                            className="px-4 py-1.5 bg-gray-200 dark:bg-wa-dark-hover text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-wa-dark-border"
                        >
                            View Profile
                        </button>
                    )
                };
            case NOTIFICATION_TYPES.NEW_FOLLOWER:
                return {
                    icon: '👥',
                    message: `started following you`,
                    action: isFollowing(actor.id) ? (
                        <button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    await unfollowUser(actor.id);
                                    onActionTaken?.();
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className="px-4 py-1.5 bg-gray-200 dark:bg-wa-dark-hover text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-wa-dark-border disabled:opacity-50"
                        >
                            Following
                        </button>
                    ) : (
                        <button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    await followUser(actor.id);
                                    onActionTaken?.();
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className="px-4 py-1.5 bg-wa-teal text-white rounded-lg text-sm font-medium hover:bg-wa-tealDark disabled:opacity-50"
                        >
                            Follow Back
                        </button>
                    )
                };
            case NOTIFICATION_TYPES.FOLLOW_BACK:
                return {
                    icon: '🔄',
                    message: `followed you back`,
                    action: (
                        <button
                            onClick={() => navigate(`/chat/${actor.id}`)}
                            className="px-4 py-1.5 bg-wa-teal text-white rounded-lg text-sm font-medium hover:bg-wa-tealDark"
                        >
                            Message
                        </button>
                    )
                };
            default:
                return {
                    icon: '📬',
                    message: '',
                    action: null
                };
        }
    };

    const content = getNotificationContent();
    const timeAgo = getTimeAgo(notification.createdAt);

    return (
        <div
            className={`flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-wa-dark-hover transition-colors cursor-pointer ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
            }`}
            onClick={() => navigate(`/profile/${actor.id}`)}
        >
            {/* Avatar */}
            <img
                src={actor.avatar || `https://ui-avatars.com/api/?name=${actor.name}&background=128c7e&color=fff`}
                alt={actor.name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                            <span className="font-semibold">{actor.name}</span>{' '}
                            <span className="text-gray-600 dark:text-gray-400">{content.message}</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{timeAgo}</p>
                    </div>
                    <span className="text-lg shrink-0">{content.icon}</span>
                </div>

                {/* Action Buttons */}
                {content.action && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                        {content.action}
                    </div>
                )}
            </div>

            {/* Unread Indicator */}
            {!notification.read && (
                <div className="w-2 h-2 bg-wa-teal rounded-full shrink-0 mt-2"></div>
            )}
        </div>
    );
};

/**
 * NotificationsPage Component
 * Main page displaying all user notifications
 */
const NotificationsPage = () => {
    const navigate = useNavigate();
    const { currentUser } = useApp();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadNotifications();
        // Mark all as read when page is viewed
        return () => {
            if (unreadCount > 0) {
                notificationFirebaseService.markAllAsRead(currentUser?.id).catch(err =>
                    console.error('Failed to mark notifications as read:', err)
                );
            }
        };
    }, [currentUser?.id]);

    const loadNotifications = async () => {
        if (!currentUser?.id) return;

        setLoading(true);
        try {
            const result = await notificationFirebaseService.getUserNotifications(currentUser.id, 50);
            if (result.success) {
                setNotifications(result.notifications);
                setUnreadCount(result.unreadCount);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActionTaken = () => {
        // Reload notifications after an action
        loadNotifications();
    };

    return (
        <div className="flex flex-col pb-20 bg-white dark:bg-wa-dark-bg min-h-full">
            {/* Desktop Header with Back Button - Only visible on md+ screens */}
            <div className="hidden md:flex h-[60px] bg-wa-grayBg dark:bg-wa-dark-header items-center gap-3 px-4 shrink-0 border-b border-wa-border dark:border-wa-dark-border text-[#111b21] dark:text-gray-100 transition-colors sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-medium md:text-lg">Notifications</h2>
                {unreadCount > 0 && (
                    <span className="ml-auto text-sm bg-wa-teal/10 text-wa-teal px-2 py-1 rounded-full">
                        {unreadCount} unread
                    </span>
                )}
            </div>

            {/* Mobile Header */}
            <div className="flex md:hidden items-center justify-between px-4 py-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-wa-dark-hover rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-[#111b21] dark:text-gray-100" />
                    </button>
                    <h1 className="text-xl font-medium text-[#111b21] dark:text-gray-100">Notifications</h1>
                </div>
                {unreadCount > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {unreadCount} unread
                    </span>
                )}
            </div>

            {/* Notifications List - Responsive Container */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-12 h-12 border-4 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-wa-dark-hover rounded-full flex items-center justify-center mb-4">
                                <BellOff size={40} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                No notifications yet
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                When someone follows you or requests to follow, you'll see it here
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-wa-dark-border">
                            {notifications.map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onActionTaken={handleActionTaken}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper function to get time ago
function getTimeAgo(timestamp) {
    if (!timestamp) return '';

    const now = new Date();
    const createdAt = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now - createdAt) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
}

export default NotificationsPage;
