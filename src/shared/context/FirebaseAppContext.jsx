/**
 * Firebase-enabled AppContext
 * This context integrates Firebase services for real-time data synchronization
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Firebase Services
import authService from '../../services/firebase/AuthService';
import userService from '../../services/firebase/UserService';
import settingsService from '../../services/firebase/SettingsService';
import chatFirebaseService from '../../services/firebase/ChatFirebaseService';
import messageFirebaseService from '../../services/firebase/MessageFirebaseService';
import statusFirebaseService from '../../services/firebase/StatusFirebaseService';
import callFirebaseService from '../../services/firebase/CallFirebaseService';

const FirebaseAppContext = createContext(undefined);

export const FirebaseAppProvider = ({ children }) => {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // App State
    const [theme, setTheme] = useState('light');
    const [language, setLanguage] = useState('English');
    const [chatSettings, setChatSettings] = useState(null);
    const [securitySettings, setSecuritySettings] = useState(null);
    const [statusPrivacy, setStatusPrivacy] = useState('contacts');

    // Data State
    const [users, setUsers] = useState({});
    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState({});
    const [calls, setCalls] = useState([]);
    const [statusUpdates, setStatusUpdates] = useState([]);

    // Real-time State
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [typingUsers, setTypingUsers] = useState({});

    // Loading States
    const [loadingData, setLoadingData] = useState(true);

    // Listen to Firebase Auth state
    useEffect(() => {
        const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Get user profile from Firestore
                    const { user } = await authService.getUserProfile(firebaseUser.uid);
                    setCurrentUser(user);
                    setIsAuthenticated(true);

                    // Load user settings
                    if (user.settings) {
                        setTheme(user.settings.appSettings?.theme || 'light');
                        setLanguage(user.settings.appSettings?.language || 'English');
                        setChatSettings(user.settings.chatSettings);
                        setSecuritySettings(user.settings.securitySettings);
                        setStatusPrivacy(user.settings.privacySettings?.statusPrivacy || 'contacts');
                    }
                } catch (error) {
                    console.error('Error loading user profile:', error);
                }
            } else {
                setCurrentUser(null);
                setIsAuthenticated(false);
            }
            setLoadingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    // Load user's chats when authenticated
    useEffect(() => {
        if (!currentUser?.id) {
            setLoadingData(false);
            return;
        }

        setLoadingData(true);

        const unsubscribe = chatFirebaseService.subscribeToUserChats(
            currentUser.id,
            (chatsData) => {
                setChats(chatsData);
                setLoadingData(false);
            },
            (error) => {
                console.error('Error loading chats:', error);
                setLoadingData(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser?.id]);

    // Subscribe to messages for all chats
    useEffect(() => {
        if (!chats.length) return;

        const unsubscribers = chats.map((chat) => {
            return messageFirebaseService.subscribeToMessages(
                chat.id,
                (chatMessages) => {
                    setMessages((prev) => ({
                        ...prev,
                        [chat.id]: chatMessages
                    }));
                },
                (error) => {
                    console.error(`Error loading messages for ${chat.id}:`, error);
                }
            );
        });

        return () => {
            unsubscribers.forEach((unsub) => unsub());
        };
    }, [chats]);

    // Sync theme with CSS
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    // Sync chat settings with CSS vars
    useEffect(() => {
        if (!chatSettings) return;

        const root = document.documentElement;
        root.style.setProperty('--wa-teal', chatSettings.appColor || '#008069');
        root.style.setProperty('--wa-bubble-out', chatSettings.outgoingBubbleColor || '#D9FDD3');
        root.style.setProperty('--wa-bubble-in', chatSettings.incomingBubbleColor || '#FFFFFF');
    }, [chatSettings]);

    // Auth Actions
    const login = useCallback(() => {
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
            setIsAuthenticated(false);
            setCurrentUser(null);
            setChats([]);
            setMessages({});
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, []);

    // User Profile Actions
    const updateUserProfile = useCallback(async (name, about, avatar) => {
        try {
            await userService.updateUserProfile(currentUser.id, { name, about, avatar });
            setCurrentUser((prev) => ({ ...prev, name, about, avatar }));
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }, [currentUser?.id]);

    // Settings Actions
    const updateChatSettings = useCallback(async (newSettings) => {
        try {
            await settingsService.updateChatSettings(currentUser.id, {
                ...chatSettings,
                ...newSettings
            });
            setChatSettings((prev) => ({ ...prev, ...newSettings }));
        } catch (error) {
            console.error('Update chat settings error:', error);
            throw error;
        }
    }, [currentUser?.id, chatSettings]);

    const updateSecuritySettings = useCallback(async (newSettings) => {
        try {
            await settingsService.updateSecuritySettings(currentUser.id, {
                ...securitySettings,
                ...newSettings
            });
            setSecuritySettings((prev) => ({ ...prev, ...newSettings }));
        } catch (error) {
            console.error('Update security settings error:', error);
            throw error;
        }
    }, [currentUser?.id, securitySettings]);

    const toggleTheme = useCallback(async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        
        try {
            await settingsService.updateAppSettings(currentUser.id, {
                theme: newTheme
            });
        } catch (error) {
            console.error('Update theme error:', error);
        }
    }, [theme, currentUser?.id]);

    // Chat Actions
    const startChat = useCallback(async (contactId) => {
        try {
            const { chatId } = await chatFirebaseService.createIndividualChat(currentUser.id, contactId);
            return chatId;
        } catch (error) {
            console.error('Start chat error:', error);
            throw error;
        }
    }, [currentUser?.id]);

    const createGroup = useCallback(async (groupName, participantIds) => {
        try {
            const { chatId } = await chatFirebaseService.createGroupChat(
                currentUser.id,
                groupName,
                participantIds
            );
            return chatId;
        } catch (error) {
            console.error('Create group error:', error);
            throw error;
        }
    }, [currentUser?.id]);

    // Message Actions
    const addMessage = useCallback(async (chatId, text, type = 'text', options = {}) => {
        try {
            const messageData = {
                senderId: currentUser.id,
                text,
                type,
                ...options
            };

            await messageFirebaseService.sendMessage(chatId, messageData);
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }, [currentUser?.id]);

    const addReaction = useCallback(async (chatId, messageId, emoji) => {
        try {
            await messageFirebaseService.addReaction(chatId, messageId, currentUser.id, emoji);
        } catch (error) {
            console.error('Add reaction error:', error);
            throw error;
        }
    }, [currentUser?.id]);

    const deleteMessages = useCallback(async (chatId, messageIds, deleteForEveryone) => {
        try {
            await messageFirebaseService.deleteMessages(chatId, messageIds, deleteForEveryone);
        } catch (error) {
            console.error('Delete messages error:', error);
            throw error;
        }
    }, []);

    // Chat Management Actions
    const togglePinChat = useCallback(async (chatId) => {
        try {
            await chatFirebaseService.togglePinChat(chatId, currentUser.id);
        } catch (error) {
            console.error('Toggle pin error:', error);
            throw error;
        }
    }, [currentUser?.id]);

    const toggleArchiveChat = useCallback(async (chatId) => {
        try {
            await chatFirebaseService.toggleArchiveChat(chatId, currentUser.id);
        } catch (error) {
            console.error('Toggle archive error:', error);
            throw error;
        }
    }, [currentUser?.id]);

    const markChatAsRead = useCallback(async (chatId) => {
        try {
            await chatFirebaseService.updateUserChatSettings(chatId, currentUser.id, {
                unreadCount: 0
            });
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    }, [currentUser?.id]);

    // Provide context value
    const value = {
        // Auth
        isAuthenticated,
        currentUser,
        login,
        logout,
        loadingAuth,

        // Settings
        theme,
        language,
        chatSettings,
        securitySettings,
        statusPrivacy,
        setTheme,
        setLanguage,
        toggleTheme,
        updateChatSettings,
        updateSecuritySettings,

        // User
        updateUserProfile,

        // Data
        users,
        chats,
        messages,
        calls,
        statusUpdates,
        loadingData,

        // Online Status
        onlineUsers,
        typingUsers,

        // Chat Actions
        startChat,
        createGroup,
        togglePinChat,
        toggleArchiveChat,
        markChatAsRead,

        // Message Actions
        addMessage,
        addReaction,
        deleteMessages,

        // Services (for advanced usage)
        authService,
        userService,
        chatFirebaseService,
        messageFirebaseService,
        statusFirebaseService,
        callFirebaseService
    };

    return (
        <FirebaseAppContext.Provider value={value}>
            {children}
        </FirebaseAppContext.Provider>
    );
};

export const useFirebaseApp = () => {
    const context = useContext(FirebaseAppContext);
    if (context === undefined) {
        throw new Error('useFirebaseApp must be used within a FirebaseAppProvider');
    }
    return context;
};

export default FirebaseAppProvider;
