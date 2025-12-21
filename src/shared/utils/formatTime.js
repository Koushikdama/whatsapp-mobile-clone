/**
 * Format timestamp to human-readable format
 * @param {string | number | Date | object} timestamp - ISO timestamp string, unix timestamp, Date object, or Firestore Timestamp
 * @returns {string} Formatted time string
 */
export const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    // Handle different timestamp formats
    let date;

    // If timestamp is already a Date object
    if (timestamp instanceof Date) {
        date = timestamp;
    }
    // If timestamp is a number (unix timestamp in milliseconds)
    else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    }
    // If timestamp is a string
    else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
    }
    // Fallback for Firestore Timestamp objects with toDate() method
    else if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    }
    // Firestore Timestamp format: {seconds, nanoseconds}
    else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        date = new Date(timestamp.seconds * 1000);
    }
    else {
        // Invalid format - return empty string instead of crashing
        return '';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.warn('[formatTimestamp] Invalid date:', timestamp);
        return '';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Less than 1 minute
    if (diffMins < 1) return 'Just now';

    // Less than 1 hour - show minutes
    if (diffMins < 60) return `${diffMins}m`;

    // Less than 24 hours - show hours
    if (diffHours < 24) return `${diffHours}h`;

    // Less than 7 days - show days
    if (diffDays < 7) return `${diffDays}d`;

    // More than 7 days - show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format time for message display (HH:MM format)
 * @param {string | number | Date | object} timestamp - ISO timestamp string, unix timestamp, Date object, or Firestore Timestamp
 * @returns {string} Formatted time (e.g., "14:30")
 */
export const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';

    // Handle different timestamp formats
    let date;

    if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
    } else if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        date = new Date(timestamp.seconds * 1000);
    } else {
        return '';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.warn('[formatMessageTime] Invalid date:', timestamp);
        return '';
    }

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
};
