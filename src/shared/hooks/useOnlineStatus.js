import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Custom hook to manage online status for current user
 * Automatically marks user online/offline based on page visibility
 */
export const useOnlineStatus = () => {
    const { markUserOnline, markUserOffline, currentUserId } = useApp();

    useEffect(() => {
        if (!currentUserId) return;

        // Mark user as online when hook mounts
        markUserOnline(currentUserId);

        // Handle visibility change (tab switched, browser minimized, etc.)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                markUserOffline(currentUserId);
            } else {
                markUserOnline(currentUserId);
            }
        };

        // Handle page unload (closing tab/browser)
        const handleBeforeUnload = () => {
            markUserOffline(currentUserId);
        };

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup: mark user as offline when component unmounts
        return () => {
            markUserOffline(currentUserId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentUserId, markUserOnline, markUserOffline]);
};
