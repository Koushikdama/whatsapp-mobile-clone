/**
 * Call REST API Service
 * Template for call-related REST API operations
 */

import apiClient from '../../shared/utils/apiClient';

export const callRestService = {
    // GET /calls?userId=xxx
    async getUserCalls(userId) {
        const response = await apiClient.get('/calls', {
            params: { userId }
        });
        return { calls: response.data || response };
    },

    // POST /calls
    async initiateCall(callData) {
        const response = await apiClient.post('/calls', callData);
        return response.data || response;
    },

    // PATCH /calls/:callId
    async updateCall(callId, updates) {
        const response = await apiClient.patch(`/calls/${callId}`, updates);
        return response.data || response;
    },

    // POST /calls/:callId/end
    async endCall(callId) {
        const response = await apiClient.post(`/calls/${callId}/end`);
        return response.data || response;
    },

    // DELETE /calls/:callId
    async deleteCall(callId) {
        const response = await apiClient.delete(`/calls/${callId}`);
        return response.data || response;
    },

    // No real-time subscription for REST
    subscribeToUserCalls: null,
};

export default callRestService;
