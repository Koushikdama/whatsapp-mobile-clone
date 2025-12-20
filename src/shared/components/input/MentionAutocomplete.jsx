import React, { useState, useEffect } from 'react';

/**
 * MentionAutocomplete - Dropdown for selecting users to mention
 * 
 * @param {Object} props
 * @param {Object} props.users - Users object {userId: userData}
 * @param {string} props.searchQuery - Current search query after @
 * @param {Function} props.onSelect - Callback when user is selected
 * @param {Object} props.position - Position for dropdown
 */
const MentionAutocomplete = ({ users, searchQuery, onSelect, position }) => {
    const [filteredUsers, setFilteredUsers] = useState([]);

    useEffect(() => {
        if (searchQuery !== null && searchQuery !== undefined) {
            const query = searchQuery.toLowerCase();
            const filtered = Object.values(users).filter(user =>
                user.name.toLowerCase().includes(query)
            );
            setFilteredUsers(filtered.slice(0, 5)); // Show max 5 results
        } else {
            setFilteredUsers([]);
        }
    }, [searchQuery, users]);

    if (filteredUsers.length === 0) return null;

    return (
        <div
            className="absolute bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 max-h-60 overflow-y-auto z-50 min-w-[250px] animate-in fade-in zoom-in-95 duration-200"
            style={{
                bottom: position?.bottom || '100%',
                left: position?.left || 0,
                marginBottom: '8px'
            }}
        >
            {filteredUsers.map(user => (
                <div
                    key={user.id}
                    onClick={() => onSelect(user)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-wa-dark-hover cursor-pointer transition-colors"
                >
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            @{user.name.toLowerCase().replace(/\s+/g, '')}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MentionAutocomplete;
