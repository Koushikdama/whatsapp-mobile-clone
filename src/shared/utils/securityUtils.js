/**
 * Security utility functions for PIN/password management
 * Provides hashing, validation, and security checks
 */

/**
 * Simple hash function for PINs (for demo purposes)
 * In production, use a proper crypto library like bcrypt
 * @param {string} pin - The PIN to hash
 * @returns {string} Hashed PIN
 */
export const hashPin = (pin) => {
    if (!pin) return '';

    // Simple hash for demo - in production use bcrypt or similar
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
        const char = pin.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
};

/**
 * Validate a PIN against its hash
 * @param {string} pin - The PIN to validate
 * @param {string} hashedPin - The stored hash
 * @returns {boolean} True if PIN matches
 */
export const validatePin = (pin, hashedPin) => {
    if (!pin || !hashedPin) return false;
    return hashPin(pin) === hashedPin;
};

/**
 * Check if a PIN is configured in security settings
 * @param {object} settings - Security settings object
 * @param {string} pinType - 'daily' or 'chat'
 * @returns {boolean} True if PIN is configured
 */
export const isPinConfigured = (settings, pinType = 'daily') => {
    if (!settings) return false;

    const pinField = pinType === 'daily'
        ? 'dailyLockPassword'
        : 'chatLockPassword';

    return Boolean(settings[pinField] && settings[pinField].trim().length > 0);
};

/**
 * Validate PIN strength
 * @param {string} pin - The PIN to validate
 * @returns {object} { valid: boolean, error: string }
 */
export const validatePinStrength = (pin) => {
    if (!pin) {
        return { valid: false, error: 'PIN is required' };
    }

    if (pin.length < 4) {
        return { valid: false, error: 'PIN must be at least 4 characters' };
    }

    if (!/^\d+$/.test(pin)) {
        return { valid: false, error: 'PIN must contain only numbers' };
    }

    // Check for weak PINs
    const weakPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];
    if (weakPins.includes(pin)) {
        return { valid: false, error: 'PIN is too common. Please choose a stronger PIN' };
    }

    return { valid: true, error: null };
};

/**
 * Check if PIN setup is required before accessing a feature
 * @param {object} settings - Security settings object
 * @param {string} pinType - 'daily' or 'chat'
 * @returns {boolean} True if setup is required
 */
export const requirePinSetup = (settings, pinType = 'daily') => {
    return !isPinConfigured(settings, pinType);
};
