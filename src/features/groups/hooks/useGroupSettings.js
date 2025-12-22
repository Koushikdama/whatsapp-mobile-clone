/**
 * Custom hook for managing group settings including walkie-talkie permissions
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase/firebaseConfig';

export const useGroupSettings = (groupId) => {
    const [settings, setSettings] = useState({
        walkieTalkieEnabled: true,
        walkieTalkiePermission: 'all', // 'all' | 'admins' | 'specific'
        walkieTalkieAllowedUsers: [],
        callRecordingEnabled: true,
        musicSharingEnabled: true,
        musicSharingPermission: 'all'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load group settings from Firestore
    useEffect(() => {
        if (!groupId) return;

        const loadSettings = async () => {
            try {
                setLoading(true);
                const groupRef = doc(db, 'chats', groupId);
                const groupSnap = await getDoc(groupRef);

                if (groupSnap.exists()) {
                    const data = groupSnap.data();
                    setSettings(prevSettings => ({
                        ...prevSettings,
                        ...data.groupSettings
                    }));
                }
            } catch (err) {
                console.error('[useGroupSettings] Load error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [groupId]);

    // Update group settings
    const updateSettings = useCallback(async (newSettings) => {
        if (!groupId) return { success: false, error: 'No group ID' };

        try {
            const groupRef = doc(db, 'chats', groupId);
            await updateDoc(groupRef, {
                groupSettings: {
                    ...settings,
                    ...newSettings
                }
            });

            setSettings(prev => ({ ...prev, ...newSettings }));
            console.log('✅ [useGroupSettings] Settings updated');
            return { success: true };
        } catch (err) {
            console.error('[useGroupSettings] Update error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, [groupId, settings]);

    // Check if user has walkie-talkie permission
    const hasWalkieTalkiePermission = useCallback((userId, userRole) => {
        if (!settings.walkieTalkieEnabled) return false;

        switch (settings.walkieTalkiePermission) {
            case 'all':
                return true;
            case 'admins':
                return userRole === 'admin' || userRole === 'owner';
            case 'specific':
                return settings.walkieTalkieAllowedUsers.includes(userId);
            default:
                return false;
        }
    }, [settings]);

    // Check if user has music sharing permission
    const hasMusicSharingPermission = useCallback((userId, userRole) => {
        if (!settings.musicSharingEnabled) return false;

        switch (settings.musicSharingPermission) {
            case 'all':
                return true;
            case 'admins':
                return userRole === 'admin' || userRole === 'owner';
            default:
                return false;
        }
    }, [settings]);

    return {
        settings,
        loading,
        error,
        updateSettings,
        hasWalkieTalkiePermission,
        hasMusicSharingPermission
    };
};

export default useGroupSettings;
