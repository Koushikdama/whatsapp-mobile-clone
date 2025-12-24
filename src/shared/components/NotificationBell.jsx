import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import unifiedNotificationService from '../../services/UnifiedNotificationService';

/**
 * NotificationBell Component
 * Displays a bell icon with unread notification badge
 * Click to navigate to notifications page
 * Uses real-time updates to stay in sync
 */
const NotificationBell = ({ className = '' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useApp();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser?.id) return;

        // Load initial unread count
        loadUnreadCount();

        // Subscribe to real-time notification updates
        const unsubscribe = unifiedNotificationService.subscribeToNotifications(
            currentUser.id,
            (data) => {
                // Update badge with unread count
                setUnreadCount(data.unreadCount);
                console.log(`🔔 Notification badge updated: ${data.unreadCount} unread`);
            }
        );

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [currentUser?.id]);

    // Reload count when navigating away from notifications page
    useEffect(() => {
        // If we're leaving the notifications page, reload count
        if (currentUser?.id && !location.pathname.includes('/notifications')) {
            loadUnreadCount();
        }
    }, [location.pathname, currentUser?.id]);

    const loadUnreadCount = async () => {
        if (!currentUser?.id) return;

        try {
            const result = await unifiedNotificationService.getUnreadCount(currentUser.id);
            if (result.success) {
                setUnreadCount(result.count);
            }
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    };

    const handleClick = () => {
        navigate('/notifications');
    };

    return (
        <button
            onClick={handleClick}
            className={`relative p-2 hover:bg-white/10 rounded-full transition-colors ${className}`}
            aria-label="Notifications"
        >
            <Bell size={22} className={className || "text-white cursor-pointer"} />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
};

export default NotificationBell;
