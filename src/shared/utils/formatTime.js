/**
 * Format timestamp to human-readable format
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time string
 */
export const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
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
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time (e.g., "14:30")
 */
export const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
};
