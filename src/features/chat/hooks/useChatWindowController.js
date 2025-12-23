import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../../shared/context/AppContext';
import { useCall } from '../../call/context/CallContext';
import { useWorkerMessageSearch } from '../../../shared/hooks/useWorkerSearch';

export const useChatWindowController = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();

    // Global Context Access (Model)
    const {
        chats, messages, users, currentUser, addMessage, deleteMessages,
        togglePinMessage, addReaction, currentUserId, chatSettings,
        toggleDateLock, securitySettings, drafts, setDraft, votePoll,
        setUserTyping, updateMessageStatus, markChatAsRead,
        onlineUsers, typingUsers, lastSeen, markMessageAsViewed, editMessage,
        openGameInvite
    } = useApp();
    const { startCall } = useCall();

    // Local State (View State)
    const [inputText, setInputText] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [activeMessageId, setActiveMessageId] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState(new Set());
    const [translatedMessages, setTranslatedMessages] = useState(new Set());
    const [activeThreadId, setActiveThreadId] = useState(null);
    const messageRefs = useRef({});

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const recordingTimerRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Search & UI State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [dateLockTarget, setDateLockTarget] = useState(null);
    const [lockPin, setLockPin] = useState('');
    const [lockError, setLockError] = useState('');
    const [editingMessage, setEditingMessage] = useState(null);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Computed Data (Memoized)
    const chat = useMemo(() => chats.find(c => c.id === chatId), [chats, chatId]);
    const rawChatMessages = useMemo(() => (chatId && messages[chatId]) ? messages[chatId] : [], [chatId, messages]);
    const contact = useMemo(() => chat ? (chat.isGroup ? null : users[chat.contactId]) : null, [chat, users]);

    // Use Worker for Message Filtering
    const { filteredMessages: chatMessages } = useWorkerMessageSearch({
        messages: rawChatMessages,
        searchQuery: messageSearchQuery
    });

    // --- Draft Logic ---
    useEffect(() => {
        // Restore draft when chat changes
        if (chatId) {
            setInputText(drafts[chatId] || '');
        }
    }, [chatId]); // Only when ID changes

    const handleInputChange = useCallback((e) => {
        const text = e.target.value;
        setInputText(text);

        // Update draft
        if (chatId) {
            setDraft(chatId, text);
        }

        // Typing indicator
        if (chatId && text.length > 0) {
            setUserTyping(chatId, currentUserId, true);

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Set new timeout to stop typing after 3 seconds
            typingTimeoutRef.current = setTimeout(() => {
                setUserTyping(chatId, currentUserId, false);
            }, 3000);
        } else if (chatId) {
            // Stop typing if text is empty
            setUserTyping(chatId, currentUserId, false);
        }
    }, [chatId, currentUserId, setDraft, setUserTyping]);

    // Effects
    useEffect(() => {
        if (messagesEndRef.current && !messageSearchQuery) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [chatMessages.length, chatId, messageSearchQuery]);

    // Mark chat as read when opened and mark messages as read
    useEffect(() => {
        if (chatId && chatMessages.length > 0) {
            // Mark chat as read
            markChatAsRead(chatId);

            // Mark all unread messages as read
            const unreadMessages = chatMessages.filter(
                msg => msg.senderId !== currentUserId && msg.status !== 'read'
            );

            unreadMessages.forEach(msg => {
                updateMessageStatus(chatId, msg.id, 'read');
            });
        }
    }, [chatId, markChatAsRead, updateMessageStatus, currentUserId, chatMessages.length]);

    // Logic Handlers
    const handleSendMessage = useCallback((e) => {
        e?.preventDefault();
        if (!chatId || !inputText.trim()) return;

        // Stop typing
        setUserTyping(chatId, currentUserId, false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (editingMessage) {
            editMessage(chatId, editingMessage.id, inputText);
            setEditingMessage(null);
        } else {
            addMessage(chatId, inputText, 'text', replyTo?.id);
        }

        setInputText('');
        setDraft(chatId, ''); // Clear draft
        setReplyTo(null);
        setShowAttachMenu(false); // Close menu on send
    }, [chatId, inputText, replyTo, editingMessage, editMessage, currentUserId, addMessage, setDraft, setUserTyping]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    // Recording Logic
    const startRecording = useCallback(() => {
        setIsRecording(true);
        setRecordingSeconds(0);
        recordingTimerRef.current = setInterval(() => {
            setRecordingSeconds(prev => prev + 1);
        }, 1000);
    }, []);

    const cancelRecording = useCallback(() => {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setIsRecording(false);
        setRecordingSeconds(0);
    }, []);

    const finishRecording = useCallback(() => {
        if (!chatId) return;
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        const mins = Math.floor(recordingSeconds / 60);
        const secs = recordingSeconds % 60;
        const duration = `${mins}:${secs.toString().padStart(2, '0')}`;

        addMessage(chatId, "🎤 Voice Message", 'voice', undefined, undefined, duration);
        setIsRecording(false);
        setRecordingSeconds(0);
    }, [chatId, recordingSeconds, addMessage]);

    // Selection & Message Action Logic
    const handleReply = useCallback((msg) => {
        setReplyTo(msg);
        setActiveMessageId(null);
    }, []);

    const handleTranslate = useCallback(async (msgId) => {
        const newSet = new Set(translatedMessages);
        if (newSet.has(msgId)) {
            newSet.delete(msgId);
        } else {
            newSet.add(msgId);
        }
        setTranslatedMessages(newSet);
        setActiveMessageId(null);
    }, [translatedMessages]);

    const toggleSelection = useCallback((msgId) => {
        const newSet = new Set(selectedMessages);
        if (newSet.has(msgId)) {
            newSet.delete(msgId);
            if (newSet.size === 0) setIsSelectionMode(false);
        } else {
            newSet.add(msgId);
            setIsSelectionMode(true);
        }
        setSelectedMessages(newSet);
        setActiveMessageId(null);
    }, [selectedMessages]);

    const handleDeleteSelected = useCallback(() => {
        if (chatId) {
            deleteMessages(chatId, Array.from(selectedMessages), true);
            setSelectedMessages(new Set());
            setIsSelectionMode(false);
        }
    }, [chatId, selectedMessages, deleteMessages]);

    const handleSendPoll = useCallback((data) => {
        if (!chatId) return;
        addMessage(chatId, "Poll", 'poll', undefined, undefined, undefined, data);
        setShowAttachMenu(false);
    }, [chatId, addMessage]);

    const handleVote = useCallback((msgId, optionIds) => {
        if (chatId) votePoll(chatId, msgId, optionIds);
    }, [chatId, votePoll]);

    const handleStartEdit = useCallback((msg) => {
        setEditingMessage(msg);
        setInputText(msg.text);
        setActiveMessageId(null);
        // Focus input (handled by caller or effect if needed)
    }, [setInputText]);

    const handleCancelEdit = useCallback(() => {
        setEditingMessage(null);
        setInputText('');
    }, [setInputText]);

    // Threading Logic
    const scrollToMessage = useCallback((messageId) => {
        const messageElement = messageRefs.current[messageId];
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight briefly
            messageElement.classList.add('bg-yellow-100', 'dark:bg-yellow-900/20');
            setTimeout(() => {
                messageElement.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/20');
            }, 1500);
        }
    }, []);

    const handleOpenThread = useCallback((message) => {
        setActiveThreadId(message.id);
    }, []);

    const handleCloseThread = useCallback(() => {
        setActiveThreadId(null);
    }, []);

    // Date Lock Logic
    const handleLockVerify = useCallback((e) => {
        e.preventDefault();
        const correctPin = securitySettings.dailyLockPassword || '1234';
        if (lockPin === correctPin) {
            if (chatId && dateLockTarget) toggleDateLock(chatId, dateLockTarget);
            setDateLockTarget(null);
            setLockPin(''); // Clear PIN on successful unlock
        } else {
            setLockError('Incorrect PIN');
            setLockPin('');
        }
    }, [lockPin, chatId, dateLockTarget, securitySettings.dailyLockPassword, toggleDateLock]);

    const navigateToChats = useCallback(() => navigate('/chats'), [navigate]);
    const navigateToInfo = useCallback(() => navigate(`/chat/${chatId}/info`), [navigate, chatId]);

    return {
        // Data
        chatId,
        chat,
        contact,
        chatMessages, // Now returned from worker hook
        users,
        currentUser,
        currentUserId,
        chatSettings,

        // Online Status & Typing
        onlineUsers,
        typingUsers,
        lastSeen,

        // State
        inputText, setInputText: handleInputChange, // Use the draft-aware handler
        showPicker, setShowPicker,
        showAttachMenu, setShowAttachMenu,
        activeMessageId, setActiveMessageId,
        replyTo, setReplyTo,
        isSelectionMode, setIsSelectionMode,
        selectedMessages, setSelectedMessages,
        translatedMessages,
        isRecording,
        recordingSeconds,
        isSearchOpen, setIsSearchOpen,
        messageSearchQuery, setMessageSearchQuery,
        isMenuOpen, setIsMenuOpen,
        dateLockTarget, setDateLockTarget,
        lockPin, setLockPin,
        lockError, setLockError,

        // Refs
        messagesEndRef,
        chatContainerRef,

        // Actions
        handleSendMessage,
        handleKeyDown,
        startRecording,
        cancelRecording,
        finishRecording,
        handleReply,
        handleTranslate,
        toggleSelection,
        handleDeleteSelected,
        handleLockVerify,
        addMessage,
        handleSendPoll,
        handleVote,
        editingMessage,
        handleStartEdit,
        handleCancelEdit,

        // Threading
        activeThreadId,
        handleOpenThread,
        handleCloseThread,
        scrollToMessage,
        messageRefs,

        // Navigation / External
        navigateToChats,
        navigateToInfo,
        startCall,
        openGameInvite,
        deleteMessages,
        togglePinMessage,
        addReaction,
        markMessageAsViewed,
        securitySettings
    };
};
