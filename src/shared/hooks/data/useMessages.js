/**
 * useMessages Hook
 * Global hook for message operations (fetch, send, update, delete)
 * Backend-agnostic with real-time support
 */

import { useState, useEffect, useCallback } from 'react';
import { dataServices } from './serviceConfig';

export const useMessages = (chatId) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch messages
    useEffect(() => {
        if (!chatId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Subscribe to real-time updates
        const unsubscribe = dataServices.message.subscribeToMessages?.(
            chatId,
            (messagesData) => {
                setMessages(messagesData);
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
            dataServices.message.getMessages(chatId)
                .then(({ messages: messagesData }) => {
                    setMessages(messagesData);
                    setLoading(false);
                })
                .catch((err) => {
                    setError(err.message);
                    setLoading(false);
                });
        }

        return () => unsubscribe?.();
    }, [chatId]);

    // Send message
    const sendMessage = useCallback(async (messageData) => {
        try {
            setError(null);
            return await dataServices.message.sendMessage(chatId, messageData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [chatId]);

    // Update message
    const updateMessage = useCallback(async (messageId, updates) => {
        try {
            setError(null);
            return await dataServices.message.updateMessage(chatId, messageId, updates);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [chatId]);

    // Delete message
    const deleteMessage = useCallback(async (messageId, deleteForEveryone = false) => {
        try {
            setError(null);
            return await dataServices.message.deleteMessage(chatId, messageId, deleteForEveryone);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [chatId]);

    // Delete multiple messages
    const deleteMessages = useCallback(async (messageIds, deleteForEveryone = false) => {
        try {
            setError(null);
            return await dataServices.message.deleteMessages(chatId, messageIds, deleteForEveryone);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [chatId]);

    // Edit message
    const editMessage = useCallback(async (messageId, newText) => {
        try {
            setError(null);
            return await dataServices.message.editMessage(chatId, messageId, newText);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [chatId]);

    // Add reaction
    const addReaction = useCallback(async (messageId, userId, emoji) => {
        try {
            setError(null);
            return await dataServices.message.addReaction(chatId, messageId, userId, emoji);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [chatId]);

    // Remove reaction
    const removeReaction = useCallback(async (messageId, userId) => {
        try {
            setError(null);
            return await dataServices.message.removeReaction(chatId, messageId, userId);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [chatId]);

    // Toggle pin
    const togglePinMessage = useCallback(async (messageId) => {
        try {
            setError(null);
            return await dataServices.message.togglePinMessage(chatId, messageId);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [chatId]);

    // Toggle star
    const toggleStarMessage = useCallback(async (messageId) => {
        try {
            setError(null);
            return await dataServices.message.toggleStarMessage(chatId, messageId);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [chatId]);

    return {
        messages,
        loading,
        error,
        sendMessage,
        updateMessage,
        deleteMessage,
        deleteMessages,
        editMessage,
        addReaction,
        removeReaction,
        togglePinMessage,
        toggleStarMessage,
    };
};

export default useMessages;
