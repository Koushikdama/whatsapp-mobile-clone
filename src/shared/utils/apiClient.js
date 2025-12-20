/**
 * API Client Utility
 * Centralized HTTP client for REST API calls
 * Supports interceptors, authentication, and error handling
 */

class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.headers = {
            'Content-Type': 'application/json',
        };
        this.interceptors = {
            request: [],
            response: [],
        };
    }

    // Set authentication token
    setAuthToken(token) {
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.headers['Authorization'];
        }
    }

    // Add custom header
    setHeader(key, value) {
        this.headers[key] = value;
    }

    // Add request interceptor
    addRequestInterceptor(interceptor) {
        this.interceptors.request.push(interceptor);
    }

    // Add response interceptor
    addResponseInterceptor(interceptor) {
        this.interceptors.response.push(interceptor);
    }

    // Process request through interceptors
    async processRequest(config) {
        let processedConfig = { ...config };
        for (const interceptor of this.interceptors.request) {
            processedConfig = await interceptor(processedConfig);
        }
        return processedConfig;
    }

    // Process response through interceptors
    async processResponse(response) {
        let processedResponse = response;
        for (const interceptor of this.interceptors.response) {
            processedResponse = await interceptor(processedResponse);
        }
        return processedResponse;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            body = null,
            headers = {},
            params = {},
        } = options;

        // Build URL with query params
        const url = new URL(`${this.baseURL}${endpoint}`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        // Prepare request config
        let config = {
            method,
            headers: { ...this.headers, ...headers },
        };

        if (body && method !== 'GET') {
            config.body = JSON.stringify(body);
        }

        // Process through request interceptors
        config = await this.processRequest(config);

        try {
            const response = await fetch(url.toString(), config);

            // Process through response interceptors
            const processedResponse = await this.processResponse(response);

            // Handle errors
            if (!processedResponse.ok) {
                const errorData = await processedResponse.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${processedResponse.status}: ${processedResponse.statusText}`);
            }

            // Return JSON response
            const contentType = processedResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await processedResponse.json();
            }

            return await processedResponse.text();
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // Convenience methods
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }

    put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }

    patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

// Create default instance
const apiClient = new ApiClient(
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
);

// Add default interceptors

// Request interceptor - Add timestamp
apiClient.addRequestInterceptor(async (config) => {
    console.log(`[API Request] ${config.method} ${config.url || 'endpoint'}`);
    return config;
});

// Response interceptor - Log responses
apiClient.addResponseInterceptor(async (response) => {
    console.log(`[API Response] ${response.status} ${response.statusText}`);
    return response;
});

export { ApiClient };
export default apiClient;
