/**
 * useFetch Hook
 * Generic hook for fetching data with loading, error states, and optional caching
 * Works with both real-time subscriptions and standard HTTP requests
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic fetch hook
 * @param {Function} fetchFn - Function that returns a Promise or sets up a subscription
 * @param {Object} options - Configuration options
 * @param {Array} dependencies - Dependencies array for useEffect
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useFetch = (fetchFn, options = {}, dependencies = []) => {
    const {
        initialData = null,
        skip = false,
        onSuccess,
        onError,
        enableCache = false,
        cacheKey = null,
    } = options;

    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(!skip);
    const [error, setError] = useState(null);
    const cacheRef = useRef(new Map());
    const isMountedRef = useRef(true);

    // Fetch function
    const fetch = useCallback(async () => {
        if (skip) {
            setLoading(false);
            return;
        }

        // Check cache
        if (enableCache && cacheKey && cacheRef.current.has(cacheKey)) {
            const cachedData = cacheRef.current.get(cacheKey);
            setData(cachedData);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await fetchFn();
            
            if (!isMountedRef.current) return;

            setData(result);
            setLoading(false);

            // Cache the result
            if (enableCache && cacheKey) {
                cacheRef.current.set(cacheKey, result);
            }

            if (onSuccess) {
                onSuccess(result);
            }
        } catch (err) {
            if (!isMountedRef.current) return;

            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            setLoading(false);

            if (onError) {
                onError(err);
            }
        }
    }, [fetchFn, skip, enableCache, cacheKey, onSuccess, onError]);

    // Effect for fetching
    useEffect(() => {
        isMountedRef.current = true;
        fetch();

        return () => {
            isMountedRef.current = false;
        };
    }, [fetch, ...dependencies]);

    // Refetch function
    const refetch = useCallback(() => {
        // Clear cache for this key
        if (enableCache && cacheKey) {
            cacheRef.current.delete(cacheKey);
        }
        return fetch();
    }, [fetch, enableCache, cacheKey]);

    return {
        data,
        loading,
        error,
        refetch,
    };
};

/**
 * useFetch with real-time subscription support
 * Automatically handles subscribe/unsubscribe pattern
 */
export const useFetchRealtime = (subscribeFn, fallbackFetchFn, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);

        // Try subscription first (for Firebase or WebSocket)
        const unsubscribe = subscribeFn?.(
            (newData) => {
                setData(newData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err.message || 'An error occurred');
                setLoading(false);
            }
        );

        // Fallback to regular fetch (for REST API)
        if (!unsubscribe && fallbackFetchFn) {
            fallbackFetchFn()
                .then((result) => {
                    setData(result);
                    setLoading(false);
                    setError(null);
                })
                .catch((err) => {
                    setError(err.message || 'An error occurred');
                    setLoading(false);
                });
        }

        return () => unsubscribe?.();
    }, dependencies);

    return { data, loading, error };
};

export default useFetch;
