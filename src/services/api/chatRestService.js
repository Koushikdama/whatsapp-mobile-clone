/**
 * Chat REST API Service
 * Template for chat-related REST API operations
 * This is a placeholder - update endpoints when backend is ready
 */

import apiClient from '../../shared/utils/apiClient';

export const chatRestService = {
    // GET /chats?userId=xxx
    async getUserChats(userId) {
        const response = await apiClient.get('/chats', {
            params: { userId }
        });
        return { chats: response.data || response };
    },

    // GET /chats/:chatId
    async getChat(chatId) {
        const response = await apiClient.get(`/chats/${chatId}`);
        return { chat: response.data || response };
    },

    // POST /chats/individual
    async createIndividualChat(userId, contactId) {
        const response = await apiClient.post('/chats/individual', {
            userId,
            contactId
        });
        return response.data || response;
    },

    // POST /chats/group
    async createGroupChat(userId, groupName, participantIds, groupData = {}) {
        const response = await apiClient.post('/chats/group', {
            userId,
            name: groupName,
            participants: participantIds,
            ...groupData
        });
        return response.data || response;
    },

    // PATCH /chats/:chatId
    async updateChat(chatId, updates) {
        const response = await apiClient.patch(`/chats/${chatId}`, updates);
        return response.data || response;
    },

    // DELETE /chats/:chatId
    async deleteChat(chatId) {
        const response = await apiClient.delete(`/chats/${chatId}`);
        return response.data || response;
    },

    // PATCH /chats/:chatId/pin
    async togglePinChat(chatId, userId) {
        const response = await apiClient.patch(`/chats/${chatId}/pin`, {
            userId
        });
        return response.data || response;
    },

    // PATCH /chats/:chatId/archive
    async toggleArchiveChat(chatId, userId) {
        const response = await apiClient.patch(`/chats/${chatId}/archive`, {
            userId
        });
        return response.data || response;
    },

    // PATCH /chats/:chatId/settings
    async updateUserChatSettings(chatId, userId, settings) {
        const response = await apiClient.patch(`/chats/${chatId}/settings`, {
            userId,
            settings
        });
        return response.data || response;
    },

    // Note: REST API doesn't support real-time subscriptions
    // You would need to implement polling or use WebSockets for real-time updates
    subscribeToUserChats: null, // Not supported in REST
};

export default chatRestService;
