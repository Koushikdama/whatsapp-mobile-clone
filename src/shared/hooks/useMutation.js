/**
 * useMutation Hook
 * Handles data mutations with optimistic updates and Firebase sync
 * Perfect for create, update, delete operations
 */

import { useState, useCallback } from 'react';

/**
 * @param {Function} mutationFn - Async function that performs the mutation in Firebase
 * @param {Object} options - Configuration options
 */
export const useMutation = (mutationFn, options = {}) => {
    const {
        onSuccess,
        onError,
        onSettled,
        optimisticUpdate,
        rollbackOnError = true
    } = options;

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const mutate = useCallback(async (variables, optimisticData) => {
        setIsLoading(true);
        setIsSuccess(false);
        setIsError(false);
        setError(null);

        let rollbackFn = null;

        try {
            // 1. Optimistic update (if provided)
            if (optimisticUpdate && optimisticData) {
                rollbackFn = optimisticUpdate(optimisticData);
            }

            // 2. Execute mutation
            const result = await mutationFn(variables);
            setData(result);
            setIsSuccess(true);

            // 3. Success callback
            if (onSuccess) {
                onSuccess(result, variables);
            }

            setIsLoading(false);
            return { success: true, data: result };
        } catch (err) {
            console.error('[useMutation] Error:', err);
            setError(err.message || 'Mutation failed');
            setIsError(true);

            // 4. Rollback optimistic update on error
            if (rollbackOnError && rollbackFn) {
                rollbackFn();
            }

            // 5. Error callback
            if (onError) {
                onError(err, variables);
            }

            setIsLoading(false);
            return { success: false, error: err.message };
        } finally {
            // 6. Settled callback (always runs)
            if (onSettled) {
                onSettled(data, error, variables);
            }
        }
    }, [mutationFn, optimisticUpdate, onSuccess, onError, onSettled, rollbackOnError]);

    const reset = useCallback(() => {
        setIsLoading(false);
        setIsSuccess(false);
        setIsError(false);
        setError(null);
        setData(null);
    }, []);

    return {
        mutate,
        isLoading,
        isSuccess,
        isError,
        error,
        data,
        reset
    };
};

export default useMutation;
