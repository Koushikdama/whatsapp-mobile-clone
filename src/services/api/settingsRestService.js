/**
 * Settings REST API Service
 * Template for settings-related REST API operations
 */

import apiClient from '../../shared/utils/apiClient';

export const settingsRestService = {
    // GET /users/:userId/settings
    async getSettings(userId) {
        const response = await apiClient.get(`/users/${userId}/settings`);
        return response.data || response;
    },

    // PATCH /users/:userId/settings
    async updateSettings(userId, settings) {
        const response = await apiClient.patch(`/users/${userId}/settings`, settings);
        return response.data || response;
    },

    // PATCH /users/:userId/settings/privacy
    async updatePrivacySettings(userId, privacySettings) {
        const response = await apiClient.patch(`/users/${userId}/settings/privacy`, privacySettings);
        return response.data || response;
    },

    // PATCH /users/:userId/settings/notifications
    async updateNotificationSettings(userId, notificationSettings) {
        const response = await apiClient.patch(`/users/${userId}/settings/notifications`, notificationSettings);
        return response.data || response;
    },

    // No real-time subscription for REST
    subscribeToSettings: null,
};

export default settingsRestService;
