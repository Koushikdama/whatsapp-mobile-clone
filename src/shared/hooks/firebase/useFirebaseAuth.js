/**
 * useFirebaseAuth Hook
 * Custom hook for Firebase authentication
 */

import { useState, useEffect } from 'react';
import authService from '../../../services/firebase/AuthService';

export const useFirebaseAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = authService.onAuthStateChange((firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const register = async (email, password, userData) => {
        try {
            setLoading(true);
            setError(null);
            const result = await authService.register(email, password, userData);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            const result = await authService.login(email, password);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            setError(null);
            await authService.logout();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email) => {
        try {
            setLoading(true);
            setError(null);
            const result = await authService.resetPassword(email);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        loading,
        error,
        register,
        login,
        logout,
        resetPassword,
        isAuthenticated: !!user,
        userId: user?.uid || null
    };
};

export default useFirebaseAuth;
