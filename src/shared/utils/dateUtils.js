/**
 * Date and time utility functions for messaging app
 */

/**
 * Format last seen timestamp to human-readable string
 * @param {string|null} timestamp - ISO timestamp or null if online
 * @returns {string} Formatted last seen text
 */
export const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'online';

    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;

    return then.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: now.getFullYear() !== then.getFullYear() ? 'numeric' : undefined
    });
};

/**
 * Format message timestamp to short time format
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Format timestamp for chat list (Today, Yesterday, or date)
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date/time
 */
export const formatChatListTime = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffDays = Math.floor((now - then) / 86400000);

    if (diffDays === 0) {
        return formatMessageTime(timestamp);
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return then.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
        return then.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: now.getFullYear() !== then.getFullYear() ? '2-digit' : undefined
        });
    }
};

/**
 * Get relative time description (e.g., "2 minutes ago", "just now")
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Relative time description
 */
export const getRelativeTime = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffSecs < 30) return 'just now';
    if (diffSecs < 60) return 'a few seconds ago';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;

    return then.toLocaleDateString();
};
