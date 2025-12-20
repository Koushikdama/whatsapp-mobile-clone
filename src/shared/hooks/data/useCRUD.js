/**
 * useCRUD Hook
 * Generic hook for CRUD operations with optimistic updates
 * Provides create, read, update, delete operations with loading and error states
 */

import { useState, useCallback } from 'react';

/**
 * Generic CRUD hook
 * @param {Object} service - Service object with CRUD methods
 * @param {Object} options - Configuration options
 * @returns {Object} - CRUD operations and state
 */
export const useCRUD = (service, options = {}) => {
    const {
        onCreateSuccess,
        onUpdateSuccess,
        onDeleteSuccess,
        onError,
        enableOptimisticUpdates = false,
    } = options;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // CREATE operation
    const create = useCallback(async (data) => {
        setLoading(true);
        setError(null);

        try {
            const result = await service.create(data);
            setLoading(false);
            
            if (onCreateSuccess) {
                onCreateSuccess(result);
            }
            
            return result;
        } catch (err) {
            const errorMessage = err.message || 'Failed to create';
            setError(errorMessage);
            setLoading(false);
            
            if (onError) {
                onError(err);
            }
            
            throw err;
        }
    }, [service, onCreateSuccess, onError]);

    // READ operation
    const read = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            const result = await service.read(id);
            setLoading(false);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'Failed to read';
            setError(errorMessage);
            setLoading(false);
            
            if (onError) {
                onError(err);
            }
            
            throw err;
        }
    }, [service, onError]);

    // UPDATE operation
    const update = useCallback(async (id, updates) => {
        setLoading(true);
        setError(null);

        try {
            const result = await service.update(id, updates);
            setLoading(false);
            
            if (onUpdateSuccess) {
                onUpdateSuccess(result);
            }
            
            return result;
        } catch (err) {
            const errorMessage = err.message || 'Failed to update';
            setError(errorMessage);
            setLoading(false);
            
            if (onError) {
                onError(err);
            }
            
            throw err;
        }
    }, [service, onUpdateSuccess, onError]);

    // DELETE operation
    const remove = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            const result = await service.delete(id);
            setLoading(false);
            
            if (onDeleteSuccess) {
                onDeleteSuccess(result);
            }
            
            return result;
        } catch (err) {
            const errorMessage = err.message || 'Failed to delete';
            setError(errorMessage);
            setLoading(false);
            
            if (onError) {
                onError(err);
            }
            
            throw err;
        }
    }, [service, onDeleteSuccess, onError]);

    // LIST operation (if service supports it)
    const list = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);

        try {
            if (!service.list) {
                throw new Error('List operation not supported');
            }

            const result = await service.list(filters);
            setLoading(false);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'Failed to list';
            setError(errorMessage);
            setLoading(false);
            
            if (onError) {
                onError(err);
            }
            
            throw err;
        }
    }, [service, onError]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        loading,
        error,
        clearError,
        create,
        read,
        update,
        delete: remove,
        list,
    };
};

/**
 * useMutation - For single operations (create/update/delete)
 * Simpler version of useCRUD for one-off mutations
 */
export const useMutation = (mutationFn, options = {}) => {
    const { onSuccess, onError } = options;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const mutate = useCallback(async (...args) => {
        setLoading(true);
        setError(null);

        try {
            const result = await mutationFn(...args);
            setData(result);
            setLoading(false);
            
            if (onSuccess) {
                onSuccess(result);
            }
            
            return result;
        } catch (err) {
            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            setLoading(false);
            
            if (onError) {
                onError(err);
            }
            
            throw err;
        }
    }, [mutationFn, onSuccess, onError]);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        mutate,
        loading,
        error,
        data,
        reset,
    };
};

export default useCRUD;
