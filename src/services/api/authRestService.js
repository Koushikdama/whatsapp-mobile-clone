/**
 * Auth REST API Service
 * Template for authentication-related REST API operations
 */

import apiClient from '../../shared/utils/apiClient';

export const authRestService = {
    // POST /auth/register
    async signUp(email, password, displayName) {
        const response = await apiClient.post('/auth/register', {
            email,
            password,
            displayName
        });
        
        // Set auth token for future requests
        if (response.token) {
            apiClient.setAuthToken(response.token);
        }
        
        return response;
    },

    // POST /auth/login
    async signIn(email, password) {
        const response = await apiClient.post('/auth/login', {
            email,
            password
        });
        
        // Set auth token for future requests
        if (response.token) {
            apiClient.setAuthToken(response.token);
        }
        
        return response;
    },

    // POST /auth/logout
    async signOut() {
        const response = await apiClient.post('/auth/logout');
        
        // Clear auth token
        apiClient.setAuthToken(null);
        
        return response;
    },

    // POST /auth/refresh
    async refreshToken(refreshToken) {
        const response = await apiClient.post('/auth/refresh', {
            refreshToken
        });
        
        // Update auth token
        if (response.token) {
            apiClient.setAuthToken(response.token);
        }
        
        return response;
    },

    // POST /auth/forgot-password
    async sendPasswordResetEmail(email) {
        const response = await apiClient.post('/auth/forgot-password', {
            email
        });
        return response;
    },

    // POST /auth/reset-password
    async resetPassword(token, newPassword) {
        const response = await apiClient.post('/auth/reset-password', {
            token,
            newPassword
        });
        return response;
    },

    // GET /auth/me
    async getCurrentUser() {
        const response = await apiClient.get('/auth/me');
        return response.data || response;
    },

    // No real-time subscription for REST
    onAuthStateChanged: null,
};

export default authRestService;
