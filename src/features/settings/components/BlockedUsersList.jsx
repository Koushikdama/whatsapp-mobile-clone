import React, { useState } from 'react';
import { ArrowLeft, User, X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../shared/context/AppContext';
import userService from '../../../services/firebase/UserService';

/**
 * Blocked Users List Component
 * Allows users to view and manage their blocked users list
 */
const BlockedUsersList = () => {
    const navigate = useNavigate();
    const { currentUser, users } = useApp();
    const [blockedUserIds, setBlockedUserIds] = useState(currentUser?.blockedUsers || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [unblocking, setUnblocking] = useState(null);

    const filteredBlockedUsers = blockedUserIds
        .map(userId => users[userId])
        .filter(user => user && user.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleUnblock = async (userId) => {
        if (!currentUser?.id) return;

        setUnblocking(userId);
        try {
            await userService.unblockUser(currentUser.id, userId);
            setBlockedUserIds(prev => prev.filter(id => id !== userId));
        } catch (error) {
            console.error('Error unblocking user:', error);
            alert('Failed to unblock user. Please try again.');
        } finally {
            setUnblocking(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-wa-dark-bg">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-wa-dark border-b border-gray-200 dark:border-gray-700 z-10">
                <div className="flex items-center gap-4 px-4 py-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Blocked Users
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {blockedUserIds.length} blocked
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                {blockedUserIds.length > 0 && (
                    <div className="px-4 pb-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search blocked users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wa-teal"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto p-4">
                {blockedUserIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                            <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                            No Blocked Users
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                            When you block someone, they'll appear here. Blocked users can't message you or view your profile.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredBlockedUsers.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-4 bg-white dark:bg-wa-dark rounded-xl shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                                        alt={user.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {user.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {user.about || 'Hey there! I am using WhatsApp'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleUnblock(user.id)}
                                    disabled={unblocking === user.id}
                                    className="px-4 py-2 bg-wa-teal text-white rounded-lg font-medium hover:bg-wa-teal-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {unblocking === user.id ? 'Unblocking...' : 'Unblock'}
                                </button>
                            </div>
                        ))}

                        {filteredBlockedUsers.length === 0 && searchQuery && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No blocked users found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockedUsersList;
