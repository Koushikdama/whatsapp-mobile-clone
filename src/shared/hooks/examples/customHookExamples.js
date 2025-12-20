/**
 * Example: Custom Hook using Generic Hooks
 * Demonstrates how to create feature-specific hooks using the generic hooks
 */

import { useState, useCallback } from 'react';
import { useFetch, useMutation } from '../shared/hooks/data';
import { dataServices } from '../shared/hooks/data/serviceConfig';

/**
 * Example 1: useContactSearch
 * Custom hook for searching and adding contacts
 */
export const useContactSearch = () => {
    const [query, setQuery] = useState('');

    // Fetch search results
    const { data: searchResults, loading: searching } = useFetch(
        () => dataServices.user.searchUsers(query),
        {
            skip: !query || query.length < 2,
            enableCache: true,
            cacheKey: `contact-search-${query}`,
        },
        [query]
    );

    // Add contact mutation
    const {
        mutate: addContact,
        loading: adding,
        error: addError,
    } = useMutation(
        (userId, contactId) => dataServices.user.addContact(userId, contactId),
        {
            onSuccess: (result) => {
                console.log('Contact added:', result);
                setQuery(''); // Clear search
            },
            onError: (err) => {
                console.error('Failed to add contact:', err);
            },
        }
    );

    return {
        query,
        setQuery,
        searchResults: searchResults || [],
        searching,
        addContact,
        adding,
        addError,
    };
};

/**
 * Example 2: useMessageActions
 * Custom hook bundling multiple message operations
 */
export const useMessageActions = (chatId) => {
    const { mutate: editMsg, loading: editing } = useMutation(
        (messageId, newText) => dataServices.message.editMessage(chatId, messageId, newText)
    );

    const { mutate: deleteMsg, loading: deleting } = useMutation(
        (messageId, deleteForEveryone) => 
            dataServices.message.deleteMessage(chatId, messageId, deleteForEveryone)
    );

    const { mutate: reactToMsg, loading: reacting } = useMutation(
        (messageId, userId, emoji) => 
            dataServices.message.addReaction(chatId, messageId, userId, emoji)
    );

    const { mutate: pinMsg, loading: pinning } = useMutation(
        (messageId) => dataServices.message.togglePinMessage(chatId, messageId)
    );

    const { mutate: starMsg, loading: starring } = useMutation(
        (messageId) => dataServices.message.toggleStarMessage(chatId, messageId)
    );

    return {
        editMessage: editMsg,
        deleteMessage: deleteMsg,
        addReaction: reactToMsg,
        togglePin: pinMsg,
        toggleStar: starMsg,
        loading: editing || deleting || reacting || pinning || starring,
    };
};

/**
 * Example 3: useChatManagement
 * Complete chat management with filtering and sorting
 */
export const useChatManagement = (userId) => {
    const [filter, setFilter] = useState('all'); // all, unread, groups, archived
    const [sortBy, setSortBy] = useState('recent'); // recent, name, unread

    // Fetch chats
    const { data: chats, loading, error, refetch } = useFetch(
        () => dataServices.chat.getUserChats(userId),
        {},
        [userId]
    );

    // Filter and sort chats
    const processedChats = useCallback(() => {
        if (!chats?.chats) return [];

        let filtered = [...chats.chats];

        // Apply filter
        switch (filter) {
            case 'unread':
                filtered = filtered.filter(c => c.unreadCount > 0);
                break;
            case 'groups':
                filtered = filtered.filter(c => c.isGroup);
                break;
            case 'archived':
                filtered = filtered.filter(c => c.isArchived);
                break;
            default:
                filtered = filtered.filter(c => !c.isArchived);
        }

        // Apply sort
        switch (sortBy) {
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'unread':
                filtered.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
                break;
            default: // recent
                filtered.sort((a, b) => {
                    const aTime = a.lastMessageTime?.toMillis?.() || 0;
                    const bTime = b.lastMessageTime?.toMillis?.() || 0;
                    return bTime - aTime;
                });
        }

        return filtered;
    }, [chats, filter, sortBy]);

    // Mutations
    const { mutate: createChat } = useMutation(
        (contactId) => dataServices.chat.createIndividualChat(userId, contactId)
    );

    const { mutate: archiveChat } = useMutation(
        (chatId) => dataServices.chat.toggleArchiveChat(chatId, userId),
        { onSuccess: refetch }
    );

    const { mutate: deleteChat } = useMutation(
        (chatId) => dataServices.chat.deleteChat(chatId),
        { onSuccess: refetch }
    );

    return {
        chats: processedChats(),
        loading,
        error,
        filter,
        setFilter,
        sortBy,
        setSortBy,
        createChat,
        archiveChat,
        deleteChat,
        refetch,
    };
};

/**
 * Example 4: usePollingData
 * For REST APIs that need polling instead of real-time updates
 */
export const usePollingData = (fetchFn, interval = 5000, dependencies = []) => {
    const { data, loading, error, refetch } = useFetch(fetchFn, {}, dependencies);

    // Set up polling
    useState(() => {
        const intervalId = setInterval(() => {
            refetch();
        }, interval);

        return () => clearInterval(intervalId);
    });

    return { data, loading, error, refetch };
};

/**
 * Example 5: useBulkOperations
 * For batch operations on multiple items
 */
export const useBulkMessageDelete = (chatId) => {
    const [selectedIds, setSelectedIds] = useState([]);

    const { mutate: bulkDelete, loading, error } = useMutation(
        (messageIds, deleteForEveryone = false) => 
            dataServices.message.deleteMessages(chatId, messageIds, deleteForEveryone),
        {
            onSuccess: () => {
                setSelectedIds([]);
                console.log('Messages deleted successfully');
            },
        }
    );

    const toggleSelect = useCallback((messageId) => {
        setSelectedIds(prev => 
            prev.includes(messageId)
                ? prev.filter(id => id !== messageId)
                : [...prev, messageId]
        );
    }, []);

    const selectAll = useCallback((messageIds) => {
        setSelectedIds(messageIds);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds([]);
    }, []);

    return {
        selectedIds,
        toggleSelect,
        selectAll,
        clearSelection,
        bulkDelete: () => bulkDelete(selectedIds),
        loading,
        error,
        hasSelection: selectedIds.length > 0,
    };
};
