import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import notificationFirebaseService from '../../services/firebase/NotificationFirebaseService';

/**
 * NotificationBell Component
 * Displays a bell icon with unread notification badge
 * Click to navigate to notifications page
 */
const NotificationBell = ({ className = '' }) => {
    const navigate = useNavigate();
    const { currentUser } = useApp();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser?.id) return;

        // Load initial unread count
        loadUnreadCount();

        // Reload every 30 seconds
        const interval = setInterval(() => {
            loadUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, [currentUser?.id]);

    const loadUnreadCount = async () => {
        if (!currentUser?.id) return;

        try {
            const result = await notificationFirebaseService.getUnreadCount(currentUser.id);
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
