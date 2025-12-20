/**
 * useStatus Hook
 * Global hook for status updates operations
 * Backend-agnostic
 */

import { useState, useCallback } from 'react';
import { dataServices } from './serviceConfig';

export const useStatus = () => {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Post status
    const postStatus = useCallback(async (statusData) => {
        try {
            setError(null);
            return await dataServices.status.postStatus(statusData.userId, statusData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Delete status
    const deleteStatus = useCallback(async (statusId) => {
        try {
            setError(null);
            return await dataServices.status.deleteStatus(statusId);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Mark as viewed
    const markAsViewed = useCallback(async (statusId, userId) => {
        try {
            setError(null);
            return await dataServices.status.markAsViewed(statusId, userId);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Get user statuses
    const getUserStatuses = useCallback(async (userId) => {
        try {
            setLoading(true);
            setError(null);
            const { statuses: statusesData } = await dataServices.status.getUserStatuses(userId);
            return statusesData;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Get visible statuses
    const getVisibleStatuses = useCallback(async (currentUserId, contactIds) => {
        try {
            setLoading(true);
            setError(null);
            const { statuses: statusesData } = await dataServices.status.getVisibleStatuses(currentUserId, contactIds);
            setStatuses(statusesData);
            return statusesData;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        statuses,
        loading,
        error,
        postStatus,
        deleteStatus,
        markAsViewed,
        getUserStatuses,
        getVisibleStatuses,
    };
};

export default useStatus;
