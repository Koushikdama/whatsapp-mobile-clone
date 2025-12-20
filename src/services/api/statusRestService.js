/**
 * Status REST API Service
 * Template for status-related REST API operations
 */

import apiClient from '../../shared/utils/apiClient';

export const statusRestService = {
    // GET /status?userId=xxx
    async getUserStatuses(userId) {
        const response = await apiClient.get('/status', {
            params: { userId }
        });
        return { statuses: response.data || response };
    },

    // POST /status
    async createStatus(userId, statusData) {
        const response = await apiClient.post('/status', {
            userId,
            ...statusData
        });
        return response.data || response;
    },

    // DELETE /status/:statusId
    async deleteStatus(statusId) {
        const response = await apiClient.delete(`/status/${statusId}`);
        return response.data || response;
    },

    // POST /status/:statusId/view
    async markStatusAsViewed(statusId, viewerId) {
        const response = await apiClient.post(`/status/${statusId}/view`, {
            viewerId
        });
        return response.data || response;
    },

    // No real-time subscription for REST
    subscribeToStatuses: null,
};

export default statusRestService;
