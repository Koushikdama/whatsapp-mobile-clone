/**
 * useCalls Hook
 * Global hook for call history operations
 * Backend-agnostic
 */

import { useState, useCallback } from 'react';
import { dataServices } from './serviceConfig';

export const useCalls = (userId) => {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch call history
    const fetchCalls = useCallback(async (limitCount = 50) => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);
            const { calls: callsData } = await dataServices.call.getCallHistory(userId, limitCount);
            setCalls(callsData);
            return callsData;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Log call
    const logCall = useCallback(async (callData) => {
        try {
            setError(null);
            return await dataServices.call.logCall({ ...callData, userId });
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Update call duration
    const updateCallDuration = useCallback(async (callId, duration) => {
        try {
            setError(null);
            return await dataServices.call.updateCallDuration(callId, duration);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Delete call
    const deleteCall = useCallback(async (callId) => {
        try {
            setError(null);
            const result = await dataServices.call.deleteCall(callId);
            if (result.success) {
                setCalls((prev) => prev.filter((call) => call.id !== callId));
            }
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    return {
        calls,
        loading,
        error,
        fetchCalls,
        logCall,
        updateCallDuration,
        deleteCall,
    };
};

export default useCalls;
