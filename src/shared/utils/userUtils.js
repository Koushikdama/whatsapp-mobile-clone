/**
 * User Utility Functions
 * Shared utilities for filtering and managing user lists
 * Eliminates code duplication across components
 */

/**
 * Get all users except the current user
 * @param {Object} users - Users object keyed by user ID
 * @param {string} currentUserId - Current user's ID
 * @returns {Array} Array of user objects excluding current user
 */
export const getUsersExcludingCurrent = (users, currentUserId) => {
    return Object.values(users).filter(u => u.id !== currentUserId);
};

/**
 * Get users who are not being followed
 * @param {Object} users - Users object keyed by user ID
 * @param {string} currentUserId - Current user's ID
 * @param {Function} isFollowingFn - Function to check if user is being followed
 * @returns {Array} Array of non-followed user objects
 */
export const getNonFollowedUsers = (users, currentUserId, isFollowingFn) => {
    return Object.values(users)
        .filter(u => u.id !== currentUserId && !isFollowingFn(u.id));
};

/**
 * Get users by connection type (following or follower)
 * @param {Object} users - Users object keyed by user ID
 * @param {string} currentUserId - Current user's ID
 * @param {string} connectionType - 'following' or 'follower'
 * @returns {Array} Array of user objects with specified connection type
 */
export const getUsersByConnectionType = (users, currentUserId, connectionType) => {
    return Object.values(users)
        .filter(u => u.id !== currentUserId && u.connectionType === connectionType);
};

/**
 * Filter users by search query
 * @param {Array} users - Array of user objects
 * @param {string} searchQuery - Search term
 * @returns {Array} Filtered array of user objects
 */
export const filterUsersBySearch = (users, searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
        return users;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    return users.filter(u => 
        u.name.toLowerCase().includes(lowerQuery) ||
        (u.about && u.about.toLowerCase().includes(lowerQuery))
    );
};

/**
 * Combine and deduplicate user lists from multiple sources
 * @param {Array} firebaseUsers - Users from Firebase
 * @param {Object} localUsers - Local users object
 * @param {string} currentUserId - Current user's ID
 * @returns {Array} Deduplicated array of users (Firebase takes precedence)
 */
export const mergeUserLists = (firebaseUsers, localUsers, currentUserId) => {
    const localUsersArray = Object.values(localUsers).filter(u => u.id !== currentUserId);
    const allUsersMap = new Map(localUsersArray.map(u => [u.id, u]));
    
    // Firebase users take precedence over local users
    firebaseUsers.forEach(u => allUsersMap.set(u.id, u));
    
    return Array.from(allUsersMap.values()).filter(u => u.id !== currentUserId);
};
