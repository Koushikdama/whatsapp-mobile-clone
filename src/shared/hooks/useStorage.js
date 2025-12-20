/**
 * Storage Hooks
 * React hooks for managing state with localStorage, sessionStorage, and cookies
 */

import { useState, useEffect, useCallback } from 'react';
import storage from '../utils/storage';

/**
 * useLocalStorage Hook
 * Persists state in localStorage with automatic serialization
 * 
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {[value, setValue, removeValue]} State value, setter, and remover
 */
export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        return storage.local.get(key, initialValue);
    });

    const setValue = useCallback((value) => {
        try {
            // Allow value to be a function like useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            storage.local.set(key, valueToStore);
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            storage.local.remove(key);
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
};

/**
 * useSessionStorage Hook
 * Persists state in sessionStorage (cleared on browser close)
 * 
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {[value, setValue, removeValue]} State value, setter, and remover
 */
export const useSessionStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        return storage.session.get(key, initialValue);
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            storage.session.set(key, valueToStore);
        } catch (error) {
            console.error(`Error setting sessionStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            storage.session.remove(key);
        } catch (error) {
            console.error(`Error removing sessionStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
};

/**
 * useCookie Hook
 * Persists state in cookies
 * 
 * @param {string} name - Cookie name
 * @param {*} initialValue - Initial value if cookie doesn't exist
 * @param {Object} options - Cookie options (days, path, domain, secure, sameSite)
 * @returns {[value, setValue, removeValue]} Cookie value, setter, and remover
 */
export const useCookie = (name, initialValue, options = {}) => {
    const [storedValue, setStoredValue] = useState(() => {
        return storage.cookie.get(name) ?? initialValue;
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            storage.cookie.set(name, valueToStore, options);
        } catch (error) {
            console.error(`Error setting cookie "${name}":`, error);
        }
    }, [name, storedValue, options]);

    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            storage.cookie.remove(name, options);
        } catch (error) {
            console.error(`Error removing cookie "${name}":`, error);
        }
    }, [name, initialValue, options]);

    return [storedValue, setValue, removeValue];
};

/**
 * usePersistedState Hook
 * Smart hook that automatically chooses the right storage based on options
 * 
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value
 * @param {Object} options - Storage options
 * @param {string} options.type - Storage type: 'local', 'session', 'cookie' (default: 'local')
 * @param {Object} options.cookieOptions - Cookie-specific options
 * @returns {[value, setValue, removeValue]} State value, setter, and remover
 */
export const usePersistedState = (key, initialValue, options = {}) => {
    const { type = 'local', cookieOptions } = options;

    switch (type) {
        case 'session':
            return useSessionStorage(key, initialValue);
        case 'cookie':
            return useCookie(key, initialValue, cookieOptions);
        default:
            return useLocalStorage(key, initialValue);
    }
};

/**
 * useStorageEvent Hook
 * Listen to storage changes from other tabs/windows
 * 
 * @param {string} key - Storage key to watch
 * @param {Function} callback - Callback when storage changes
 */
export const useStorageEvent = (key, callback) => {
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === key && e.newValue !== e.oldValue) {
                try {
                    const newValue = JSON.parse(e.newValue);
                    callback(newValue);
                } catch {
                    callback(e.newValue);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, callback]);
};

export default {
    useLocalStorage,
    useSessionStorage,
    useCookie,
    usePersistedState,
    useStorageEvent,
};
