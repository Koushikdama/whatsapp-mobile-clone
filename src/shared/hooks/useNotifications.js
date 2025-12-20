/**
 * useNotifications Hook
 * React hook for managing push notifications
 */

import { useState, useEffect, useCallback } from 'react';
import notificationService from '../../services/notificationService';

export const useNotifications = (options = {}) => {
    const {
        autoRequest = false, // Automatically request permission on mount
        onMessage, // Callback for foreground messages
    } = options;

    const [permission, setPermission] = useState(notificationService.getPermission());
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [supported, setSupported] = useState(notificationService.isSupported());

    // Request notification permission
    const requestPermission = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const granted = await notificationService.requestPermission();
            setPermission(notificationService.getPermission());
            
            if (granted) {
                // Get FCM token after permission granted
                const fcmToken = await notificationService.getToken();
                setToken(fcmToken);
            }
            
            setLoading(false);
            return granted;
        } catch (err) {
            setError(err.message);
            setLoading(false);
            return false;
        }
    }, []);

    // Get FCM token
    const getToken = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        setError(null);

        try {
            const fcmToken = await notificationService.getToken(forceRefresh);
            setToken(fcmToken);
            setLoading(false);
            return fcmToken;
        } catch (err) {
            setError(err.message);
            setLoading(false);
            return null;
        }
    }, []);

    // Delete token
    const deleteToken = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await notificationService.deleteToken();
            setToken(null);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }, []);

    // Show notification manually
    const showNotification = useCallback((title, options) => {
        if (!supported || permission !== 'granted') {
            console.warn('Cannot show notification: not supported or permission not granted');
            return null;
        }

        return notificationService.showNotification({
            notification: { title, ...options },
            data: options?.data || {}
        });
    }, [supported, permission]);

    // Initialize
    useEffect(() => {
        setSupported(notificationService.isSupported());
        
        if (!notificationService.isSupported()) {
            console.warn('⚠️ Notifications not supported in this browser');
            return;
        }

        // Auto-request permission if enabled
        if (autoRequest && permission === 'default') {
            requestPermission();
        }

        // Get existing token if permission already granted
        if (permission === 'granted') {
            notificationService.getToken().then(setToken);
        }
    }, [autoRequest, permission, requestPermission]);

    // Set up foreground message listener
    useEffect(() => {
        if (!supported || !onMessage) return;

        const unsubscribe = notificationService.onForegroundMessage((payload) => {
            onMessage(payload);
        });

        return unsubscribe;
    }, [supported, onMessage]);

    return {
        // State
        permission,
        token,
        loading,
        error,
        supported,
        
        // Actions
        requestPermission,
        getToken,
        deleteToken,
        showNotification,
        
        // Computed
        isGranted: permission === 'granted',
        isDenied: permission === 'denied',
        isDefault: permission === 'default',
    };
};

export default useNotifications;
