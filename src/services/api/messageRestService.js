/**
 * Message REST API Service
 * Template for message-related REST API operations
 * This is a placeholder - update endpoints when backend is ready
 */

import apiClient from '../../shared/utils/apiClient';

export const messageRestService = {
    // GET /chats/:chatId/messages
    async getMessages(chatId, options = {}) {
        const { limit, offset } = options;
        const response = await apiClient.get(`/chats/${chatId}/messages`, {
            params: { limit, offset }
        });
        return { messages: response.data || response };
    },

    // POST /chats/:chatId/messages
    async sendMessage(chatId, messageData) {
        const response = await apiClient.post(`/chats/${chatId}/messages`, messageData);
        return response.data || response;
    },

    // PATCH /chats/:chatId/messages/:messageId
    async updateMessage(chatId, messageId, updates) {
        const response = await apiClient.patch(`/chats/${chatId}/messages/${messageId}`, updates);
        return response.data || response;
    },

    // DELETE /chats/:chatId/messages/:messageId
    async deleteMessage(chatId, messageId, deleteForEveryone = false) {
        const response = await apiClient.delete(`/chats/${chatId}/messages/${messageId}`, {
            params: { deleteForEveryone }
        });
        return response.data || response;
    },

    // DELETE /chats/:chatId/messages (batch delete)
    async deleteMessages(chatId, messageIds, deleteForEveryone = false) {
        const response = await apiClient.post(`/chats/${chatId}/messages/batch-delete`, {
            messageIds,
            deleteForEveryone
        });
        return response.data || response;
    },

    // PATCH /chats/:chatId/messages/:messageId/edit
    async editMessage(chatId, messageId, newText) {
        const response = await apiClient.patch(`/chats/${chatId}/messages/${messageId}/edit`, {
            text: newText
        });
        return response.data || response;
    },

    // POST /chats/:chatId/messages/:messageId/reactions
    async addReaction(chatId, messageId, userId, emoji) {
        const response = await apiClient.post(`/chats/${chatId}/messages/${messageId}/reactions`, {
            userId,
            emoji
        });
        return response.data || response;
    },

    // DELETE /chats/:chatId/messages/:messageId/reactions/:userId
    async removeReaction(chatId, messageId, userId) {
        const response = await apiClient.delete(`/chats/${chatId}/messages/${messageId}/reactions/${userId}`);
        return response.data || response;
    },

    // PATCH /chats/:chatId/messages/:messageId/pin
    async togglePinMessage(chatId, messageId) {
        const response = await apiClient.patch(`/chats/${chatId}/messages/${messageId}/pin`);
        return response.data || response;
    },

    // PATCH /chats/:chatId/messages/:messageId/star
    async toggleStarMessage(chatId, messageId) {
        const response = await apiClient.patch(`/chats/${chatId}/messages/${messageId}/star`);
        return response.data || response;
    },

    // Note: REST API doesn't support real-time subscriptions
    // You would need to implement polling or use WebSockets for real-time updates
    subscribeToMessages: null, // Not supported in REST
};

export default messageRestService;
