/**
 * Storage Utilities
 * Utilities for managing localStorage, sessionStorage, and cookies with type safety
 */

// ========== LOCAL STORAGE ==========

export const localStorage = {
    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Parsed value or default
     */
    get(key, defaultValue = null) {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    },

    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     */
    set(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    },

    /**
     * Clear all localStorage
     */
    clear() {
        try {
            window.localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    },

    /**
     * Get all keys in localStorage
     * @returns {string[]} Array of keys
     */
    keys() {
        try {
            return Object.keys(window.localStorage);
        } catch (error) {
            console.error('Error getting localStorage keys:', error);
            return [];
        }
    }
};

// ========== SESSION STORAGE ==========

export const sessionStorage = {
    /**
     * Get item from sessionStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Parsed value or default
     */
    get(key, defaultValue = null) {
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading sessionStorage key "${key}":`, error);
            return defaultValue;
        }
    },

    /**
     * Set item in sessionStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     */
    set(key, value) {
        try {
            window.sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting sessionStorage key "${key}":`, error);
        }
    },

    /**
     * Remove item from sessionStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            window.sessionStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing sessionStorage key "${key}":`, error);
        }
    },

    /**
     * Clear all sessionStorage
     */
    clear() {
        try {
            window.sessionStorage.clear();
        } catch (error) {
            console.error('Error clearing sessionStorage:', error);
        }
    },

    /**
     * Get all keys in sessionStorage
     * @returns {string[]} Array of keys
     */
    keys() {
        try {
            return Object.keys(window.sessionStorage);
        } catch (error) {
            console.error('Error getting sessionStorage keys:', error);
            return [];
        }
    }
};

// ========== COOKIES ==========

export const cookies = {
    /**
     * Get cookie value
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value or null
     */
    get(name) {
        try {
            const nameEQ = name + '=';
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) {
                    const value = c.substring(nameEQ.length, c.length);
                    try {
                        return JSON.parse(decodeURIComponent(value));
                    } catch {
                        return decodeURIComponent(value);
                    }
                }
            }
            return null;
        } catch (error) {
            console.error(`Error reading cookie "${name}":`, error);
            return null;
        }
    },

    /**
     * Set cookie
     * @param {string} name - Cookie name
     * @param {*} value - Cookie value
     * @param {Object} options - Cookie options
     * @param {number} options.days - Expiration in days (default: 7)
     * @param {string} options.path - Cookie path (default: '/')
     * @param {string} options.domain - Cookie domain
     * @param {boolean} options.secure - Secure flag
     * @param {string} options.sameSite - SameSite attribute (Strict, Lax, None)
     */
    set(name, value, options = {}) {
        try {
            const {
                days = 7,
                path = '/',
                domain,
                secure = false,
                sameSite = 'Lax'
            } = options;

            let expires = '';
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toUTCString();
            }

            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            const encodedValue = encodeURIComponent(stringValue);

            let cookie = `${name}=${encodedValue}${expires}; path=${path}`;
            if (domain) cookie += `; domain=${domain}`;
            if (secure) cookie += '; secure';
            if (sameSite) cookie += `; SameSite=${sameSite}`;

            document.cookie = cookie;
        } catch (error) {
            console.error(`Error setting cookie "${name}":`, error);
        }
    },

    /**
     * Remove cookie
     * @param {string} name - Cookie name
     * @param {Object} options - Cookie options (path, domain)
     */
    remove(name, options = {}) {
        this.set(name, '', { ...options, days: -1 });
    },

    /**
     * Check if cookie exists
     * @param {string} name - Cookie name
     * @returns {boolean} True if cookie exists
     */
    has(name) {
        return this.get(name) !== null;
    },

    /**
     * Get all cookies as an object
     * @returns {Object} All cookies
     */
    getAll() {
        try {
            const cookies = {};
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                const c = ca[i].trim();
                const [name, ...valueParts] = c.split('=');
                if (name) {
                    const value = valueParts.join('=');
                    try {
                        cookies[name] = JSON.parse(decodeURIComponent(value));
                    } catch {
                        cookies[name] = decodeURIComponent(value);
                    }
                }
            }
            return cookies;
        } catch (error) {
            console.error('Error getting all cookies:', error);
            return {};
        }
    }
};

// ========== STORAGE MANAGER (Unified Interface) ==========

export const storage = {
    local: localStorage,
    session: sessionStorage,
    cookie: cookies,

    /**
     * Clear all storage (localStorage, sessionStorage, cookies)
     */
    clearAll() {
        localStorage.clear();
        sessionStorage.clear();
        // Note: We don't automatically clear all cookies as some may be essential
        console.warn('Cleared localStorage and sessionStorage. Cookies need to be removed individually.');
    }
};

export default storage;
