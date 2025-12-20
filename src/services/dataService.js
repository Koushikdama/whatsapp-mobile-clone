// In-memory cache for data.json
let cachedData = null;

/**
 * Validates that the data has all required fields
 * @param {object} data - Data object to validate
 * @throws {Error} If validation fails
 */
const validateData = (data) => {
    if (!data) throw new Error('Data is null or undefined');
    if (!data.currentUserId) throw new Error('Missing currentUserId in data.json');
    if (!data.users) throw new Error('Missing users in data.json');
    if (!data.chats) throw new Error('Missing chats in data.json');
    if (!data.messages) throw new Error('Missing messages in data.json');
    if (!data.appConfig) throw new Error('Missing appConfig in data.json');
    return true;
};

/**
 * Service to handle data fetching.
 * In a real application, this would interact with a backend API.
 * Here, it fetches a local JSON file with caching and validation.
 */
export const dataService = {
    /**
     * Fetches the initial data for the application with caching.
     * Data is loaded once and cached in memory for better performance.
     * @returns {Promise<Object>} The application data.
     */
    fetchInitialData: async () => {
        try {
            // Return cached data if available
            if (cachedData) {
                return cachedData;
            }

            // Load data from JSON file
            const response = await import('../data/data.json');
            const data = response.default || response;

            // Validate data structure
            validateData(data);

            // Cache the data
            cachedData = data;

            return data;
        } catch (error) {
            console.error('[dataService] Error loading data:', error);

            // Provide user-friendly error messages
            if (error.message.includes('Missing')) {
                throw new Error(`Data validation failed: ${error.message}`);
            }

            throw new Error(`Failed to load application data. Please refresh the page. Details: ${error.message}`);
        }
    },

    /**
     * Clears the cache - useful for development/testing
     */
    clearCache: () => {
        cachedData = null;
    }
};
