/**
 * useUser Hook
 * Global hook for user profile operations
 * Backend-agnostic
 */

import { useState, useCallback } from 'react';
import { dataServices } from './serviceConfig';

export const useUser = (userId = null) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch user
    const fetchUser = useCallback(async (id = userId) => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);
            const { user: userData } = await dataServices.user.getUser(id);
            setUser(userData);
            return userData;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Update profile
    const updateProfile = useCallback(async (updates) => {
        try {
            setError(null);
            const result = await dataServices.user.updateUserProfile(userId, updates);
            if (result.success) {
                setUser((prev) => ({ ...prev, ...updates }));
            }
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Update avatar
    const updateAvatar = useCallback(async (avatarUrl) => {
        try {
            setError(null);
            return await dataServices.user.updateAvatar(userId, avatarUrl);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Update name
    const updateName = useCallback(async (name) => {
        try {
            setError(null);
            return await dataServices.user.updateName(userId, name);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Update about
    const updateAbout = useCallback(async (about) => {
        try {
            setError(null);
            return await dataServices.user.updateAbout(userId, about);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Search users
    const searchUsers = useCallback(async (query, maxResults = 20) => {
        try {
            setError(null);
            return await dataServices.user.searchUsers(query, maxResults);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Block user
    const blockUser = useCallback(async (blockedUserId) => {
        try {
            setError(null);
            return await dataServices.user.blockUser(userId, blockedUserId);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Unblock user
    const unblockUser = useCallback(async (blockedUserId) => {
        try {
            setError(null);
            return await dataServices.user.unblockUser(userId, blockedUserId);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    return {
        user,
        loading,
        error,
        fetchUser,
        updateProfile,
        updateAvatar,
        updateName,
        updateAbout,
        searchUsers,
        blockUser,
        unblockUser,
    };
};

export default useUser;
