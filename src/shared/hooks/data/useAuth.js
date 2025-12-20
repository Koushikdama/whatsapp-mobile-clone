/**
 * useAuth Hook
 * Global hook for authentication operations
 * Backend-agnostic - works with Firebase or REST API
 */

import { useState, useEffect, useCallback } from 'react';
import { dataServices } from './serviceConfig';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = dataServices.auth.onAuthStateChange?.(async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const { user: userProfile } = await dataServices.auth.getUserProfile(firebaseUser.uid);
                    setUser(userProfile);
                    setIsAuthenticated(true);
                } catch (err) {
                    console.error('Error loading user profile:', err);
                    setError(err.message);
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            setLoading(false);
        });

        return () => unsubscribe?.();
    }, []);

    // Login
    const login = useCallback(async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            const result = await dataServices.auth.login(email, password);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Register
    const register = useCallback(async (email, password, userData) => {
        try {
            setLoading(true);
            setError(null);
            const result = await dataServices.auth.register(email, password, userData);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Logout
    const logout = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            await dataServices.auth.logout();
            setUser(null);
            setIsAuthenticated(false);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Reset password
    const resetPassword = useCallback(async (email) => {
        try {
            setError(null);
            return await dataServices.auth.resetPassword(email);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Change password
    const changePassword = useCallback(async (currentPassword, newPassword) => {
        try {
            setError(null);
            return await dataServices.auth.changePassword(currentPassword, newPassword);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    return {
        user,
        loading,
        error,
        isAuthenticated,
        login,
        register,
        logout,
        resetPassword,
        changePassword,
        userId: user?.id || null,
    };
};

export default useAuth;
