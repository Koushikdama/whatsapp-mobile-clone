/**
 * useOptimisticUpdate Hook
 * Provides instant UI updates while syncing with Firebase in the background
 * Automatically rolls back on errors
 */

import { useState, useCallback, useRef } from 'react';

export const useOptimisticUpdate = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const rollbackRef = useRef(null);

    /**
     * Execute an update with optimistic UI
     * @param {Function} optimisticUpdate - Function to update local state immediately
     * @param {Function} firebaseUpdate - Async function to sync with Firebase
     * @param {Function} rollback - Function to rollback on error (optional)
     */
    const execute = useCallback(async (optimisticUpdate, firebaseUpdate, rollback) => {
        setIsUpdating(true);
        setError(null);

        try {
            // 1. Update UI immediately (optimistic)
            const rollbackData = optimisticUpdate();
            rollbackRef.current = rollback || rollbackData;

            // 2. Sync with Firebase in background
            const result = await firebaseUpdate();

            setIsUpdating(false);
            return { success: true, data: result };
        } catch (err) {
            console.error('[useOptimisticUpdate] Error:', err);
            setError(err.message || 'Update failed');

            // 3. Rollback on error
            if (rollbackRef.current) {
                if (typeof rollbackRef.current === 'function') {
                    rollbackRef.current();
                }
            }

            setIsUpdating(false);
            return { success: false, error: err.message };
        }
    }, []);

    const reset = useCallback(() => {
        setIsUpdating(false);
        setError(null);
        rollbackRef.current = null;
    }, []);

    return {
        execute,
        isUpdating,
        error,
        reset
    };
};

export default useOptimisticUpdate;
