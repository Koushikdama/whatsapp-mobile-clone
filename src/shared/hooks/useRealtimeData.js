/**
 * useRealtimeData Hook
 * Fetches data from Firebase with local caching for instant loading
 * Automatically syncs with real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @param {string} key - Unique key for this data (e.g., 'chats', 'messages-chatId')
 * @param {Function} fetchFn - Async function to fetch data from Firebase
 * @param {Function} subscribeFn - Function that subscribes to real-time updates (returns unsubscribe)
 * @param {Object} options - Configuration options
 */
export const useRealtimeData = (key, fetchFn, subscribeFn, options = {}) => {
    const {
        cacheTime = 5 * 60 * 1000, // 5 minutes default
        staleTime = 30 * 1000, // 30 seconds default
        refetchOnMount = true,
        enableCache = true
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(0);
    
    const unsubscribeRef = useRef(null);
    const cacheKey = `realtime_cache_${key}`;

    // Load from cache immediately
    useEffect(() => {
        if (enableCache) {
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const { data: cachedData, timestamp } = JSON.parse(cached);
                    const age = Date.now() - timestamp;
                    
                    if (age < cacheTime) {
                        setData(cachedData);
                        setLastFetchTime(timestamp);
                        setLoading(false); // Show cached data immediately
                    }
                }
            } catch (err) {
                console.warn('[useRealtimeData] Cache read error:', err);
            }
        }
    }, [key, enableCache, cacheTime, cacheKey]);

    // Fetch fresh data
    const fetchData = useCallback(async (force = false) => {
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTime;

        // Skip if data is still fresh (unless forced)
        if (!force && timeSinceLastFetch < staleTime && data !== null) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const freshData = await fetchFn();
            setData(freshData);
            setLastFetchTime(now);

            // Update cache
            if (enableCache) {
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        data: freshData,
                        timestamp: now
                    }));
                } catch (err) {
                    console.warn('[useRealtimeData] Cache write error:', err);
                }
            }

            setLoading(false);
        } catch (err) {
            console.error('[useRealtimeData] Fetch error:', err);
            setError(err.message || 'Failed to fetch data');
            setLoading(false);
        }
    }, [fetchFn, lastFetchTime, staleTime, data, enableCache, cacheKey]);

    // Setup real-time subscription
    useEffect(() => {
        if (!subscribeFn) return;

        // Subscribe to real-time updates
        unsubscribeRef.current = subscribeFn((updatedData) => {
            setData(updatedData);
            setLastFetchTime(Date.now());

            // Update cache
            if (enableCache) {
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        data: updatedData,
                        timestamp: Date.now()
                    }));
                } catch (err) {
                    console.warn('[useRealtimeData] Cache update error:', err);
                }
            }
        });

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [subscribeFn, enableCache, cacheKey]);

    // Initial fetch
    useEffect(() => {
        if (refetchOnMount || data === null) {
            fetchData();
        }
    }, [key]); // Only re-fetch when key changes

    const refetch = useCallback(() => {
        return fetchData(true);
    }, [fetchData]);

    const mutate = useCallback((newData) => {
        setData(newData);
        setLastFetchTime(Date.now());

        // Update cache
        if (enableCache) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: newData,
                    timestamp: Date.now()
                }));
            } catch (err) {
                console.warn('[useRealtimeData] Cache mutate error:', err);
            }
        }
    }, [enableCache, cacheKey]);

    return {
        data,
        loading,
        error,
        refetch,
        mutate, // Manually update data without fetching
        isStale: Date.now() - lastFetchTime > staleTime
    };
};

export default useRealtimeData;
