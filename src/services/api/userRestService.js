/**
 * User REST API Service
 * Template for user-related REST API operations
 */

import apiClient from '../../shared/utils/apiClient';

export const userRestService = {
    // GET /users/:userId
    async getUser(userId) {
        const response = await apiClient.get(`/users/${userId}`);
        return response.data || response;
    },

    // GET /users
    async getUsers(userIds = []) {
        const response = await apiClient.get('/users', {
            params: { ids: userIds.join(',') }
        });
        return response.data || response;
    },

    // PATCH /users/:userId
    async updateUser(userId, updates) {
        const response = await apiClient.patch(`/users/${userId}`, updates);
        return response.data || response;
    },

    // POST /users/:userId/profile-photo
    async updateProfilePhoto(userId, photoData) {
        const response = await apiClient.post(`/users/${userId}/profile-photo`, photoData);
        return response.data || response;
    },

    // GET /users/search
    async searchUsers(query) {
        const response = await apiClient.get('/users/search', {
            params: { q: query }
        });
        return response.data || response;
    },

    // GET /users/:userId/contacts
    async getContacts(userId) {
        const response = await apiClient.get(`/users/${userId}/contacts`);
        return response.data || response;
    },

    // POST /users/:userId/contacts
    async addContact(userId, contactId) {
        const response = await apiClient.post(`/users/${userId}/contacts`, {
            contactId
        });
        return response.data || response;
    },

    // DELETE /users/:userId/contacts/:contactId
    async removeContact(userId, contactId) {
        const response = await apiClient.delete(`/users/${userId}/contacts/${contactId}`);
        return response.data || response;
    },

    // PATCH /users/:userId/status
    async updateOnlineStatus(userId, isOnline) {
        const response = await apiClient.patch(`/users/${userId}/status`, {
            isOnline,
            lastSeen: new Date().toISOString()
        });
        return response.data || response;
    },

    // No real-time subscription for REST
    subscribeToUser: null,
    subscribeToUsers: null,
};

export default userRestService;
