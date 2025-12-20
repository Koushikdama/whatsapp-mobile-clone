/**
 * useSettings Hook
 * Global hook for user settings operations
 * Backend-agnostic
 */

import { useState, useCallback } from 'react';
import { dataServices } from './serviceConfig';

export const useSettings = (userId) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all settings
    const fetchSettings = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);
            const { settings: settingsData } = await dataServices.settings.getAllSettings(userId);
            setSettings(settingsData);
            return settingsData;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Update app settings
    const updateAppSettings = useCallback(async (appSettings) => {
        try {
            setError(null);
            const result = await dataServices.settings.updateAppSettings(userId, appSettings);
            if (result.success) {
                setSettings((prev) => ({
                    ...prev,
                    appSettings: { ...prev?.appSettings, ...appSettings }
                }));
            }
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Update chat settings
    const updateChatSettings = useCallback(async (chatSettings) => {
        try {
            setError(null);
            const result = await dataServices.settings.updateChatSettings(userId, chatSettings);
            if (result.success) {
                setSettings((prev) => ({
                    ...prev,
                    chatSettings: { ...prev?.chatSettings, ...chatSettings }
                }));
            }
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Update security settings
    const updateSecuritySettings = useCallback(async (securitySettings) => {
        try {
            setError(null);
            const result = await dataServices.settings.updateSecuritySettings(userId, securitySettings);
            if (result.success) {
                setSettings((prev) => ({
                    ...prev,
                    securitySettings: { ...prev?.securitySettings, ...securitySettings }
                }));
            }
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Update privacy settings
    const updatePrivacySettings = useCallback(async (privacySettings) => {
        try {
            setError(null);
            const result = await dataServices.settings.updatePrivacySettings(userId, privacySettings);
            if (result.success) {
                setSettings((prev) => ({
                    ...prev,
                    privacySettings: { ...prev?.privacySettings, ...privacySettings }
                }));
            }
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    return {
        settings,
        loading,
        error,
        fetchSettings,
        updateAppSettings,
        updateChatSettings,
        updateSecuritySettings,
        updatePrivacySettings,
    };
};

export default useSettings;
