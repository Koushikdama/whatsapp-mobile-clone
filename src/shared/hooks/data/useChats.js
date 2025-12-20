/**
 * useChats Hook
 * Global hook for chat operations (list, create, update, delete)
 * Backend-agnostic
 */

import { useState, useEffect, useCallback } from 'react';
import { dataServices } from './serviceConfig';

export const useChats = (userId) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch chats
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Subscribe to real-time updates (Firebase) or fetch (REST API)
        const unsubscribe = dataServices.chat.subscribeToUserChats?.(
            userId,
            (chatsData) => {
                setChats(chatsData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );

        // Fallback for non-realtime backends
        if (!unsubscribe) {
            dataServices.chat.getUserChats(userId)
                .then(({ chats: chatsData }) => {
                    setChats(chatsData);
                    setLoading(false);
                })
                .catch((err) => {
                    setError(err.message);
                    setLoading(false);
                });
        }

        return () => unsubscribe?.();
    }, [userId]);

    // Create individual chat
    const createChat = useCallback(async (contactId) => {
        try {
            setError(null);
            const result = await dataServices.chat.createIndividualChat(userId, contactId);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Create group chat
    const createGroup = useCallback(async (groupName, participantIds, groupData = {}) => {
        try {
            setError(null);
            const result = await dataServices.chat.createGroupChat(userId, groupName, participantIds, groupData);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Update chat
    const updateChat = useCallback(async (chatId, updates) => {
        try {
            setError(null);
            return await dataServices.chat.updateChat(chatId, updates);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Delete chat
    const deleteChat = useCallback(async (chatId) => {
        try {
            setError(null);
            return await dataServices.chat.deleteChat(chatId);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Pin/unpin chat
    const togglePinChat = useCallback(async (chatId) => {
        try {
            setError(null);
            return await dataServices.chat.togglePinChat(chatId, userId);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Archive/unarchive chat
    const toggleArchiveChat = useCallback(async (chatId) => {
        try {
            setError(null);
            return await dataServices.chat.toggleArchiveChat(chatId, userId);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    // Mark chat as read
    const markAsRead = useCallback(async (chatId) => {
        try {
            setError(null);
            return await dataServices.chat.updateUserChatSettings?.(chatId, userId, { unreadCount: 0 });
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [userId]);

    return {
        chats,
        loading,
        error,
        createChat,
        createGroup,
        updateChat,
        deleteChat,
        togglePinChat,
        toggleArchiveChat,
        markAsRead,
    };
};

export default useChats;
