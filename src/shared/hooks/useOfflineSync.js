/**
 * Custom hook to handle offline/online state and message syncing
 */

import { useState, useEffect, useCallback } from 'react';
import offlineMessageService from '../../services/OfflineMessageService';

export const useOfflineSync = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queuedCount, setQueuedCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // Update queued count
    const updateQueuedCount = useCallback(async () => {
        try {
            const count = await offlineMessageService.getQueueCount();
            setQueuedCount(count);
        } catch (error) {
            console.error('[useOfflineSync] Error getting queue count:', error);
        }
    }, []);

    // Manually trigger sync
    const triggerSync = useCallback(async () => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);
        try {
            const result = await offlineMessageService.syncQueue();
            if (result.success) {
                setLastSyncTime(new Date());
                await updateQueuedCount();
            }
        } catch (error) {
            console.error('[useOfflineSync] Sync error:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, isSyncing, updateQueuedCount]);

    useEffect(() => {
        // Initial queue count
        updateQueuedCount();

        // Subscribe to offline service events
        const unsubscribe = offlineMessageService.subscribe((event) => {
            switch (event.type) {
                case 'online':
                    setIsOnline(true);
                    break;
                    
                case 'offline':
                    setIsOnline(false);
                    break;
                    
                case 'messageQueued':
                case 'messageRemoved':
                case 'messageSynced':
                    updateQueuedCount();
                    break;
                    
                case 'syncStarted':
                    setIsSyncing(true);
                    break;
                    
                case 'syncCompleted':
                case 'syncError':
                    setIsSyncing(false);
                    setLastSyncTime(new Date());
                    updateQueuedCount();
                    break;
                    
                default:
                    break;
            }
        });

        // Cleanup
        return () => {
            unsubscribe();
        };
    }, [updateQueuedCount]);

    return {
        isOnline,
        queuedCount,
        isSyncing,
        lastSyncTime,
        triggerSync,
        updateQueuedCount
    };
};

export default useOfflineSync;
