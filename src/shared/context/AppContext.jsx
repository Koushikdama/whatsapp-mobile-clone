import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { generateGameId, generateRoomId } from '../utils/gameUtils';
import { webSocketService, GameEventTypes } from '../../services/WebSocketService';
import { useLocalStorage, useSessionStorage } from '../hooks/useStorage';
import { useNotifications } from '../hooks/useNotifications';
import offlineMessageService from '../../services/OfflineMessageService';
import authService from '../../services/firebase/AuthService';
import settingsService from '../../services/firebase/SettingsService';
import chatFirebaseService from '../../services/firebase/ChatFirebaseService';
import { messageFirebaseService } from '../../services/firebase/MessageFirebaseService';
import followFirebaseService from '../../services/firebase/FollowFirebaseService';
import userService from '../../services/firebase/UserService';
import { DEFAULT_PRIVACY_SETTINGS } from '../constants/privacyLevels';

const AppContext = createContext(undefined);

const DEFAULT_CHAT_SETTINGS = {
  fontSize: 'medium',
  appColor: '#008069',
  outgoingBubbleColor: '#D9FDD3',
  incomingBubbleColor: '#FFFFFF',
  chatListBackgroundImage: null,
  contactInfoBackgroundImage: null,
  translationLanguage: 'Spanish'
};

const DEFAULT_SECURITY_SETTINGS = {
  dailyLockPassword: '',  // User must set their own PIN
  chatLockPassword: '',   // User must set their own PIN
  archiveLockPassword: '', // User must set their own PIN
  isAppLockEnabled: false
};

export const AppProvider = ({ children }) => {
  // All data now loaded from Firebase only - no static data.json

  // Auth State - Firebase as source of truth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [language, setLanguage] = useLocalStorage('language', 'English');
  
  // Session state (cleared on browser close)
  const [activeSessionId, setActiveSessionId] = useSessionStorage('session_id', null);

  const [logoEffect, setLogoEffect] = useState('none');

  const [chatSettings, setChatSettings] = useLocalStorage('chatSettings', DEFAULT_CHAT_SETTINGS);
  const [securitySettings, setSecuritySettings] = useLocalStorage('securitySettings', DEFAULT_SECURITY_SETTINGS);
  const [privacySettings, setPrivacySettings] = useLocalStorage('privacySettings', DEFAULT_PRIVACY_SETTINGS);

  // Status Privacy (kept separate for backward compatibility)
  const [statusPrivacy, setStatusPrivacy] = useLocalStorage('statusPrivacy', 'contacts');
  
  // Notification state
  const {
    permission: notificationPermission,
    token: fcmToken,
    requestPermission: requestNotificationPermission,
    showNotification,
    isGranted: notificationsEnabled,
  } = useNotifications({
    autoRequest: false, // Don't auto-request, let user trigger it
    onMessage: (payload) => {
      console.log('📨 New message notification:', payload);
      // Handle foreground notifications here
      // You can show a toast or update UI
    },
  });

  const [searchQuery, setSearchQuery] = useState('');

  // State for data that might be modified
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState({});
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState({});
  const [calls, setCalls] = useState([]);
  const [statusUpdates, setStatusUpdates] = useState([]);
  const [channels, setChannels] = useState([]);
  const [chatDocuments, setChatDocuments] = useState({});
  const [drafts, setDrafts] = useState({});

  // Online Status & Typing State
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({}); // { chatId: [userId1, userId2] }
  const [lastSeen, setLastSeen] = useState({}); // { userId: timestamp }

  // Comprehensive Game State
  const [activeGame, setActiveGame] = useState(null); // Currently active/focused game
  const [activeGames, setActiveGames] = useState(new Map()); // All active games: gameId -> game object
  const [gameRooms, setGameRooms] = useState(new Map()); // Multiplayer rooms: roomId -> room object
  const [gameHistory, setGameHistory] = useState([]); // Completed games
  const [isGameInviteOpen, setIsGameInviteOpen] = useState(false);
  const [inviteOptions, setInviteOptions] = useState({ isGroup: false });

  // Real-time subscriptions tracking
  const [messageSubscriptions, setMessageSubscriptions] = useState(new Map());

  // Hidden messages for "Delete for Me" functionality
  const [hiddenMessages, setHiddenMessages] = useLocalStorage('hiddenMessages', {});

  // Offline messaging state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Follow functionality - Instagram-style (synced with Firebase)
  const [followedUsers, setFollowedUsers] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followSubscription, setFollowSubscription] = useState(null);
  const [newFollowersCount, setNewFollowersCount] = useState(0); // For notification badge
  const [outgoingRequests, setOutgoingRequests] = useState([]); // Users I have requested to follow
  const [pendingRequests, setPendingRequests] = useState([]); // Users requesting to follow me

  // === EFFECTS ===

  // Firebase Auth State Listener
  useEffect(() => {
    console.log('🔐 Setting up Firebase auth state listener');
    
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      console.log('🔐 Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setFirebaseUser(user);
      setIsAuthenticated(!!user);
      
      if (user) {
        // Load user profile from Firestore
        try {
          const { user: userProfile } = await authService.getUserProfile(user.uid);
          if (userProfile) {
            setCurrentUser({
              id: user.uid,
              email: user.email,
              name: userProfile.name || user.displayName || 'User',
              avatar: userProfile.avatar || user.photoURL,
              about: userProfile.about || 'Hey there! I am using WhatsApp',
              phone: userProfile.phone || '',
              ...userProfile
            });

            // Also update users state to include current user
            setUsers(prev => ({
              ...prev,
              [user.uid]: {
                id: user.uid,
                name: userProfile.name || user.displayName || 'User',
                avatar: userProfile.avatar || user.photoURL,
                about: userProfile.about || 'Hey there! I am using WhatsApp',
                ...userProfile
              }
            }));

            console.log('✅ User profile loaded:', userProfile.name);
          }
        } catch (error) {
          console.error('❌ Error loading user profile:', error);
          // Use basic user info from auth
          const fallbackUser = {
            id: user.uid,
            email: user.email,
            name: user.displayName || 'User',
            avatar: user.photoURL,
            about: 'Hey there! I am using WhatsApp'
          };

          setCurrentUser(fallbackUser);

          // Also update users state
          setUsers(prev => ({
            ...prev,
            [user.uid]: fallbackUser
          }));
        }
        
        // Load settings from Firebase
        try {
          const { settings: firebaseSettings } = await settingsService.getAllSettings(user.uid);
          if (firebaseSettings) {
            console.log('🔧 Loading settings from Firebase...');

            // Load app settings (theme, language, logoEffect)
            if (firebaseSettings.appSettings) {
              if (firebaseSettings.appSettings.theme) {
                setTheme(firebaseSettings.appSettings.theme);
              }
              if (firebaseSettings.appSettings.language) {
                setLanguage(firebaseSettings.appSettings.language);
              }
              if (firebaseSettings.appSettings.logoEffect) {
                setLogoEffect(firebaseSettings.appSettings.logoEffect);
              }
            }

            // Load chat settings
            if (firebaseSettings.chatSettings) {
              setChatSettings(firebaseSettings.chatSettings);
            }

            // Load security settings
            if (firebaseSettings.securitySettings) {
              setSecuritySettings(firebaseSettings.securitySettings);
            }

            // Load privacy settings
            if (firebaseSettings.privacySettings?.statusPrivacy) {
              setStatusPrivacy(firebaseSettings.privacySettings.statusPrivacy);
            }

            console.log('✅ Settings loaded from Firebase');
          }
        } catch (error) {
          console.log('⚠️ No Firebase settings found, using localStorage:', error.message);
          // Continue with localStorage values (already loaded)
        }

        // Load follow relationships from Firebase
        try {
          console.log('👥 Loading follow relationships from Firebase...');

          // Load who the user is following
          const { success, following } = await followFirebaseService.getFollowing(user.uid);
          if (success && following) {
            const followingIds = following.map(f => f.followingId);
            console.log('📋 Following IDs to set:', followingIds);
            setFollowedUsers(followingIds);
            console.log(`✅ Loaded ${followingIds.length} following relationships`);
          } else {
            console.log('⚠️ No following relationships found or failed to load');
          }

          // Load follow stats
          const statsResult = await followFirebaseService.getFollowStats(user.uid);
          if (statsResult.success) {
            setFollowersCount(statsResult.stats.followersCount);
            setFollowingCount(statsResult.stats.followingCount);
            console.log(`✅ Follow stats - Followers: ${statsResult.stats.followersCount}, Following: ${statsResult.stats.followingCount} `);
          }

          // Load outgoing requests
          const requestsResult = await followFirebaseService.getOutgoingRequests(user.uid);
          if (requestsResult.success) {
            setOutgoingRequests(requestsResult.requests.map(r => r.followingId));
            console.log(`✅ Loaded ${requestsResult.requests.length} outgoing follow requests`);
          }

          // Load pending incoming requests
          const pendingResult = await followFirebaseService.getPendingRequests(user.uid);
          if (pendingResult.success) {
            setPendingRequests(pendingResult.requests);
            console.log(`✅ Loaded ${pendingResult.requests.length} pending follow requests`);
          }

          // Load all Firebase users into users state
          try {
            console.log('👥 Loading all Firebase users...');
            const { success: usersFetchSuccess, users: firebaseUsersList } = await userService.getAllUsers(100);
            if (usersFetchSuccess && firebaseUsersList && firebaseUsersList.length > 0) {
              console.log(`✅ Loaded ${firebaseUsersList.length} Firebase users`);
              // Convert array to object keyed by ID and merge with existing users
              const firebaseUsersObj = {};
              firebaseUsersList.forEach(u => {
                firebaseUsersObj[u.id] = u;
              });
              setUsers(prev => ({
                ...prev,
                ...firebaseUsersObj
              }));
            }
          } catch (error) {
            console.log('⚠️ Could not load Firebase users:', error.message);
          }

          // Subscribe to real-time follow updates
          const unsubscribeFollow = followFirebaseService.subscribeToFollowUpdates(
            user.uid,
            async (update) => {
              console.log('📡 Follow update received:', update.type);

              // Reload following list
              const { success, following } = await followFirebaseService.getFollowing(user.uid);
              if (success && following) {
                const followingIds = following.map(f => f.followingId);
                setFollowedUsers(followingIds);
              }

              // Reload stats
              const statsResult = await followFirebaseService.getFollowStats(user.uid);
              if (statsResult.success) {
                const previousFollowersCount = followersCount;
                setFollowersCount(statsResult.stats.followersCount);
                setFollowingCount(statsResult.stats.followingCount);

                // Check if we have new followers
                if (update.type === 'followers' && statsResult.stats.followersCount > previousFollowersCount) {
                  const newFollowers = statsResult.stats.followersCount - previousFollowersCount;
                  setNewFollowersCount(prev => prev + newFollowers);

                  // Show notification
                  if (showNotification && newFollowers > 0) {
                    showNotification(
                      'New Follower!',
                      {
                        body: `You have ${newFollowers} new follower${newFollowers > 1 ? 's' : ''}`,
                        icon: '/logo.png'
                      }
                    );
                  }
                }
              }

              // Reload outgoing requests
              const reqResult = await followFirebaseService.getOutgoingRequests(user.uid);
              if (reqResult.success) {
                setOutgoingRequests(reqResult.requests.map(r => r.followingId));
              }

              // Reload pending requests
              const pendResult = await followFirebaseService.getPendingRequests(user.uid);
              if (pendResult.success) {
                setPendingRequests(pendResult.requests);
              }
            },
            (error) => {
              console.error('❌ Follow subscription error:', error);
            }
          );

          setFollowSubscription(unsubscribeFollow);
        } catch (error) {
          console.error('❌ Error loading follow data:', error);
          // Continue without follow data
        }

        // Load chats from Firebase
        try {
          console.log('💬 Loading chats from Firebase...');
          const { success: chatsSuccess, chats: firebaseChats } = await chatFirebaseService.getUserChats(user.uid);

          if (chatsSuccess && firebaseChats && firebaseChats.length > 0) {
            console.log(`✅ Loaded ${firebaseChats.length} chats from Firebase`);

            // Transform Firebase chats to match app structure
            const transformedChats = firebaseChats.map(chat => ({
              id: chat.id,
              isGroup: chat.type === 'group',
              groupName: chat.groupName,
              groupParticipants: chat.participants,
              groupRoles: chat.groupRoles,
              groupSettings: chat.groupSettings,
              contactId: chat.type === 'individual' ? chat.participants.find(p => p !== user.uid) : undefined,
              timestamp: chat.updatedAt || chat.createdAt,
              lastMessageId: chat.lastMessageId,
              unreadCount: chat.userSettings?.unreadCount || 0,
              isPinned: chat.userSettings?.isPinned || false,
              isMuted: chat.userSettings?.isMuted || false,
              isArchived: chat.userSettings?.isArchived || false,
              isLocked: chat.userSettings?.isLocked || false,
              // Keep userSettings nested for proper data structure
              userSettings: {
                isPinned: chat.userSettings?.isPinned || false,
                isMuted: chat.userSettings?.isMuted || false,
                isArchived: chat.userSettings?.isArchived || false,
                isLocked: chat.userSettings?.isLocked || false,
                hiddenDates: chat.userSettings?.hiddenDates || [],
                unreadCount: chat.userSettings?.unreadCount || 0,
                themeColor: chat.userSettings?.themeColor || null,
                incomingThemeColor: chat.userSettings?.incomingThemeColor || null,
                wallpaper: chat.userSettings?.wallpaper || null
              }
            }));

            // Set Firebase chats as the only source of truth
            setChats(transformedChats);
            console.log(`✅ Set ${transformedChats.length} chats from Firebase`);
          } else {
            console.log('⚠️ No chats found in Firebase');
          }
        } catch (error) {
          console.error('❌ Error loading chats from Firebase:', error);
          // Continue with local chats
        }

        // Generate session ID
        if (!activeSessionId) {
          setActiveSessionId(`session_${Date.now()}_${user.uid}`);
        }

        // Subscribe to messages for all chats
        console.log('📨 Setting up message subscriptions...');
        try {
          chats.forEach(chat => {
            const chatId = chat.id;
            // Skip if already subscribed
            if (messageSubscriptions.has(chatId)) return;

            console.log(`Subscribing to messages for chat: ${chatId}`);
            const unsubscribe = messageFirebaseService.subscribeToMessages(
              chatId,
              (loadedMessages) => {
                console.log(`✅ Loaded ${loadedMessages.length} messages for chat ${chatId}`);
                setMessages(prev => ({
                  ...prev,
                  [chatId]: loadedMessages
                }));
              },
              (error) => {
                console.error(`❌ Error loading messages for chat ${chatId}:`, error);
              }
            );
            setMessageSubscriptions(prev => new Map(prev).set(chatId, unsubscribe));
          });
        } catch (error) {
          console.error('❌ Error setting up message subscriptions:', error);
        }
      } else {
        // User logged out - cleanup
        setCurrentUser(null);
        setActiveSessionId(null);
        
        // Cleanup all message subscriptions
        messageSubscriptions.forEach(unsubscribe => unsubscribe());
        setMessageSubscriptions(new Map());

        // Cleanup follow subscription
        if (followSubscription) {
          followSubscription();
          setFollowSubscription(null);
        }

        // Clear follow data
        setFollowedUsers([]);
        setFollowersCount(0);
        setFollowingCount(0);
        setOutgoingRequests([]);
      }
      
      setAuthLoading(false);
    });

    return () => {
      console.log('🔐 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  // Subscribe to messages for all chats (runs whenever chats array changes)
  useEffect(() => {
    if (!currentUser?.id || chats.length === 0) return;

    console.log(`📨 Checking message subscriptions... (${chats.length} chats)`);

    chats.forEach(chat => {
      const chatId = chat.id;

      // Skip if already subscribed
      if (messageSubscriptions.has(chatId)) {
        return;
      }

      console.log(`📨 Subscribing to messages for NEW chat: ${chatId}`);

      try {
        const unsubscribe = messageFirebaseService.subscribeToMessages(
          chatId,
          (loadedMessages) => {
            console.log(`✅ Loaded ${loadedMessages.length} messages for chat ${chatId}`);
            setMessages(prev => ({
              ...prev,
              [chatId]: loadedMessages
            }));
          },
          (error) => {
            console.error(`❌ Error loading messages for chat ${chatId}:`, error);
          }
        );

        setMessageSubscriptions(prev => new Map(prev).set(chatId, unsubscribe));
      } catch (error) {
        console.error(`❌ Failed to subscribe to chat ${chatId}:`, error);
      }
    });
  }, [chats, currentUser]);

  // Note: All data initialization removed - using Firebase only
  // Users, chats, messages, etc. are now loaded exclusively from Firebase
  // via the Firebase auth state listener effect above

  // Sync Theme with CSS only (storage is handled by hook)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Sync Chat Settings with CSS variables only (storage is handled by hook)
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--wa-teal', chatSettings.appColor);
    root.style.setProperty('--wa-teal-dark', chatSettings.appColor);
    root.style.setProperty('--wa-bubble-out', chatSettings.outgoingBubbleColor);
    root.style.setProperty('--wa-bubble-in', chatSettings.incomingBubbleColor);
  }, [chatSettings]);

  // Online/Offline Event Listeners and Offline Message Sync
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 [AppContext] Connection restored');
      setIsOnline(true);
      // Trigger automatic sync when back online
      offlineMessageService.syncQueue(messageFirebaseService);
    };

    const handleOffline = () => {
      console.log('📴 [AppContext] Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to offline service events for message status updates
    const unsubscribe = offlineMessageService.subscribe((event) => {
      if (event.type === 'messageSynced') {
        // Update message status to sent/delivered after successful sync
        updateMessageStatus(event.chatId, event.messageId, 'sent');
        setTimeout(() => {
          updateMessageStatus(event.chatId, event.messageId, 'delivered');
        }, 1000);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []); // updateMessageStatus is stable (useCallback), no need in deps


  const login = useCallback(() => {
    // Note: This is called from Login component after successful Firebase auth
    // The actual auth state is managed by Firebase listener above
    console.log('✅ Login called - Firebase auth listener will update state');
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Logging out...');
      
      // Cleanup all message subscriptions before logout
      messageSubscriptions.forEach(unsubscribe => unsubscribe());
      setMessageSubscriptions(new Map());
      
      // Clear all local state
      setChats([]);
      setMessages({});
      setDrafts({});
      setActiveGame(null);
      setActiveGames(new Map());
      setGameRooms(new Map());
      
      // Firebase logout - this will trigger the auth state listener
      await authService.logout();
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear local state even if Firebase logout fails
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  }, [messageSubscriptions]);

  const updateChatSettings = useCallback(async (newSettings) => {
  // Update localStorage immediately for responsive UI
    setChatSettings(prev => ({ ...prev, ...newSettings }));

    // Sync to Firebase in background (non-blocking)
    if (currentUser?.id) {
      try {
        const merged = { ...chatSettings, ...newSettings };
        await settingsService.updateChatSettings(currentUser.id, merged);
        console.log('✅ Chat settings synced to Firebase');
      } catch (error) {
        console.error('❌ Failed to sync chat settings to Firebase:', error);
        // UI continues to work with localStorage
      }
    }
  }, [currentUser, chatSettings]);

  // Update Privacy Settings
  const updatePrivacySettings = useCallback(async (newSettings) => {
    console.log('🔒 [AppContext] Updating privacy settings:', newSettings);
    try {
      // Update localStorage immediately
      setPrivacySettings(prev => {
        const updated = { ...prev, ...newSettings };
        console.log('🔒 [AppContext] New privacy settings:', updated);
        return updated;
      });

      // Sync to Firebase in background
      if (currentUser?.id) {
        const merged = { ...privacySettings, ...newSettings };
        await settingsService.updatePrivacySettings(currentUser.id, merged);
        console.log('✅ Privacy settings synced to Firebase');
      }
    } catch (error) {
      console.error('❌ [AppContext] Error updating privacy settings:', error);
    }
  }, [currentUser?.id, privacySettings]);

  const updateSecuritySettings = useCallback(async (newSettings) => {
  // Update localStorage immediately for responsive UI
    setSecuritySettings(prev => ({ ...prev, ...newSettings }));

    // Sync to Firebase in background (non-blocking)
    if (currentUser?.id) {
      try {
        const merged = { ...securitySettings, ...newSettings };
        await settingsService.updateSecuritySettings(currentUser.id, merged);
        console.log('✅ Security settings synced to Firebase');
      } catch (error) {
        console.error('❌ Failed to sync security settings to Firebase:', error);
        // UI continues to work with localStorage
      }
    }
  }, [currentUser, securitySettings]);

  const updateAppSettings = useCallback(async (newSettings) => {
    // Update individual settings in localStorage
    if (newSettings.theme !== undefined) {
      setTheme(newSettings.theme);
    }
    if (newSettings.language !== undefined) {
      setLanguage(newSettings.language);
    }
    if (newSettings.logoEffect !== undefined) {
      setLogoEffect(newSettings.logoEffect);
    }

    // Sync to Firebase in background
    if (currentUser?.id) {
      try {
        const appSettingsToSync = {
          theme: newSettings.theme !== undefined ? newSettings.theme : theme,
          language: newSettings.language !== undefined ? newSettings.language : language,
          logoEffect: newSettings.logoEffect !== undefined ? newSettings.logoEffect : logoEffect
        };
        await settingsService.updateAppSettings(currentUser.id, appSettingsToSync);
        console.log('✅ App settings synced to Firebase');
      } catch (error) {
        console.error('❌ Failed to sync app settings to Firebase:', error);
      }
    }
  }, [currentUser, theme, language, logoEffect]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    updateAppSettings({ theme: newTheme });
  }, [theme, updateAppSettings]);

  const updateUserProfile = useCallback((name, about, avatar) => {
    const updated = { ...currentUser, name, about, avatar };
    setCurrentUser(updated);
    localStorage.setItem('currentUser', JSON.stringify(updated));
  }, [currentUser]);

  const setDraft = useCallback((chatId, text) => {
    setDrafts(prev => {
      if (!text) {
        const newState = { ...prev };
        delete newState[chatId];
        return newState;
      }
      return { ...prev, [chatId]: text };
    });
  }, []);

  // Online Status Management
  const markUserOnline = useCallback((userId) => {
    setOnlineUsers(prev => new Set([...prev, userId]));
    setLastSeen(prev => ({ ...prev, [userId]: null })); // null means currently online
  }, []);

  const markUserOffline = useCallback((userId) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
    setLastSeen(prev => ({ ...prev, [userId]: new Date().toISOString() }));
  }, []);

  // Typing Indicator Management
  const setUserTyping = useCallback((chatId, userId, isTyping) => {
    setTypingUsers(prev => {
      const chatTyping = prev[chatId] || [];
      if (isTyping) {
        if (!chatTyping.includes(userId)) {
          return { ...prev, [chatId]: [...chatTyping, userId] };
        }
      } else {
        return { ...prev, [chatId]: chatTyping.filter(id => id !== userId) };
      }
      return prev;
    });
  }, []);

  // Message Status Management
  const updateMessageStatus = useCallback((chatId, messageId, status) => {
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: chatMessages.map(msg =>
          msg.id === messageId ? { ...msg, status } : msg
        )
      };
    });
  }, []);

  // Mark Chat as Read
  const markChatAsRead = useCallback((chatId) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    ));
  }, []);

  const startChat = useCallback(async (contactId) => {
  // Check if chat already exists locally
    const existingChat = chats.find(c => c.contactId === contactId && !c.isGroup);
    if (existingChat) return existingChat.id;

    // Create or get chat from Firebase
    try {
      console.log(`💬 Creating/fetching chat with contact: ${contactId}`);
      const result = await chatFirebaseService.createDirectChat(currentUser.id, contactId);

      if (result.success && result.chat) {
        const firebaseChat = result.chat;
        console.log(`✅ Chat ${result.isNew ? 'created' : 'found'}: ${firebaseChat.id}`);

        // Transform Firebase chat to app structure
        const newChat = {
          id: firebaseChat.id,
          contactId: contactId,
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isGroup: false,
          timestamp: firebaseChat.updatedAt || firebaseChat.createdAt || new Date().toISOString()
        };

        // Add to local state if not already there
        setChats(prev => {
          const exists = prev.find(c => c.id === firebaseChat.id);
          if (exists) return prev;
          return [newChat, ...prev];
        });

        // Initialize messages array
        setMessages(prev => ({ ...prev, [firebaseChat.id]: [] }));

        return firebaseChat.id;
      }
    } catch (error) {
      console.error('❌ Error creating chat in Firebase:', error);
    }

    // Fallback to local chat creation  if Firebase fails
    const newChatId = `c_${Date.now()}`;
    const newChat = {
      id: newChatId,
      contactId: contactId,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isGroup: false,
      timestamp: new Date().toISOString()
    };

    setChats([newChat, ...chats]);
    setMessages(prev => ({ ...prev, [newChatId]: [] }));

    return newChatId;
  }, [chats, currentUser]);

  const createGroup = useCallback((groupName, participantIds) => {
    const newChatId = `c_g_${Date.now()}`;
    const groupRoles = {};

    // Creator is owner
    groupRoles[currentUser.id] = 'owner';
    participantIds.forEach(id => groupRoles[id] = 'member');

    const newChat = {
      id: newChatId,
      contactId: '', // No single contact ID for group
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isGroup: true,
      groupName: groupName,
      groupParticipants: [...participantIds, currentUser.id],
      groupRoles: groupRoles,
      groupSettings: {
        editInfo: 'all',
        sendMessages: 'all',
        addMembers: 'all',
        approveMembers: false
      },
      timestamp: new Date().toISOString()
    };

    setChats([newChat, ...chats]);

    // Add initial system message
    const sysMsgId = `m_${Date.now()}`;
    setMessages(prev => ({
      ...prev,
      [newChatId]: [{
        id: sysMsgId,
        chatId: newChatId,
        senderId: 'system',
        text: `You created group "${groupName}"`,
        timestamp: new Date().toISOString(),
        status: 'read',
        type: 'text',
        isPinned: false
      }]
    }));

    return newChatId;
  }, [currentUser, chats]);

  const addGroupParticipants = useCallback((chatId, participantIds) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId && c.isGroup) {
        const currentParticipants = c.groupParticipants || [];
        const newIds = participantIds.filter(id => !currentParticipants.includes(id));
        if (newIds.length === 0) return c;

        const updatedParticipants = [...currentParticipants, ...newIds];
        const updatedRoles = { ...c.groupRoles };
        newIds.forEach(id => {
          updatedRoles[id] = 'member';
        });

        return {
          ...c,
          groupParticipants: updatedParticipants,
          groupRoles: updatedRoles
        };
      }
      return c;
    }));

    // Add system message
    if (participantIds.length > 0) {
      const names = participantIds.map(id => users[id]?.name || 'Someone').join(', ');
      const sysMsgId = `m_add_${Date.now()}`;

      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), {
          id: sysMsgId,
          chatId,
          senderId: 'system',
          text: `You added ${names}`,
          timestamp: new Date().toISOString(),
          status: 'read',
          type: 'text',
          isPinned: false
        }]
      }));
    }
  }, [users]);

  const updateGroupSettings = useCallback((chatId, settings) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId && c.isGroup) {
        return { ...c, groupSettings: { ...c.groupSettings, ...settings } };
      }
      return c;
    }));
  }, []);

  const updateGroupRole = useCallback((chatId, userId, role) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId && c.isGroup) {
        return {
          ...c,
          groupRoles: { ...c.groupRoles, [userId]: role }
        };
      }
      return c;
    }));
  }, []);

  const markMessageAsViewed = useCallback((chatId, messageId) => {
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: chatMessages.map(msg =>
          msg.id === messageId ? { ...msg, isViewed: true } : msg
        )
      };
    });
  }, []);

  const editMessage = useCallback((chatId, messageId, newText) => {
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: chatMessages.map(msg =>
          msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg
        )
      };
    });
  }, []);

  const addMessage = useCallback(async (chatId, text, type, replyToId, mediaUrl, duration, pollData, isViewOnce) => {
    const newMessage = {
      id: `m_${Date.now()}`,
      chatId,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toISOString(),
      status: isOnline ? 'sent' : 'queued', // Set to queued if offline
      type,
      replyToId,
      mediaUrl,
      duration,
      pollData,
      isViewOnce
    };

    // Optimistic update - show immediately in UI
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage]
    }));

    setChats(prev => {
      const chatIndex = prev.findIndex(c => c.id === chatId);
      if (chatIndex === -1) return prev;

      const updatedChat = {
        ...prev[chatIndex],
        timestamp: new Date().toISOString(),
        lastMessageId: newMessage.id,
        isArchived: prev[chatIndex].isLocked ? true : false
      };
      const newChats = [...prev];
      newChats[chatIndex] = updatedChat;

      // Move to top of list
      newChats.splice(chatIndex, 1);
      newChats.unshift(updatedChat);

      return newChats;
    });

    // Check if online
    if (!isOnline) {
      // Queue message for later sending
      console.log('📴 [AppContext] User is offline, queueing message');
      try {
        const cleanMessage = Object.fromEntries(
          Object.entries(newMessage).filter(([_, value]) => value !== undefined)
        );
        await offlineMessageService.queueMessage(chatId, cleanMessage);
        console.log('📦 Message queued for later sending');
      } catch (error) {
        console.error('❌ Error queueing message:', error);
      }
      return; // Don't try to send to Firebase when offline
    }

    // Save to Firebase (only when online)
    try {
      // Clean message object - remove undefined properties
      const cleanMessage = Object.fromEntries(
        Object.entries(newMessage).filter(([_, value]) => value !== undefined)
      );

      await messageFirebaseService.sendMessage(chatId, cleanMessage);
      console.log('✅ Message saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving message to Firebase:', error);
      // If send fails, queue it for retry
      try {
        const cleanMessage = Object.fromEntries(
          Object.entries(newMessage).filter(([_, value]) => value !== undefined)
        );
        await offlineMessageService.queueMessage(chatId, cleanMessage);
        console.log('📦 Message queued for retry due to error');

        // Update message status to queued
        updateMessageStatus(chatId, newMessage.id, 'queued');
      } catch (queueError) {
        console.error('❌ Error queueing message:', queueError);
      }
    }

    // Simulate message delivery status progression
    // sent -> delivered (1 second) -> read (when chat is next opened)
    if (isOnline) {
      setTimeout(() => {
        updateMessageStatus(chatId, newMessage.id, 'delivered');
      }, 1000);
    }
  }, [currentUser, isOnline, updateMessageStatus]);

  const votePoll = useCallback((chatId, messageId, optionIds) => {
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: chatMessages.map(msg => {
          if (msg.id === messageId && msg.type === 'poll' && msg.pollData) {
            const newOptions = msg.pollData.options.map(opt => {
              const hasVoted = optionIds.includes(opt.id);
              const voters = new Set(opt.voters);

              if (hasVoted) voters.add(currentUser.id);
              else voters.delete(currentUser.id);

              return { ...opt, voters: Array.from(voters) };
            });

            return { ...msg, pollData: { ...msg.pollData, options: newOptions } };
          }
          return msg;
        })
      };
    });
  }, [currentUser]);

  // Delete for Me - hides messages locally
  const deleteForMe = useCallback((chatId, messageIds) => {
    setHiddenMessages(prev => {
      const chatHidden = new Set(prev[chatId] || []);
      messageIds.forEach(id => chatHidden.add(id));
      return {
        ...prev,
        [chatId]: Array.from(chatHidden)
      };
    });
  }, [setHiddenMessages]);

  // Delete for Everyone - marks as deleted for all users 
  const deleteForEveryone = useCallback((chatId, messageIds) => {
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      const idsSet = new Set(messageIds);

      return {
        ...prev,
        [chatId]: chatMessages.map(msg =>
          idsSet.has(msg.id)
            ? {
              ...msg,
              isDeleted: true,
              text: msg.senderId === currentUser.id ? 'You deleted this message' : 'This message was deleted',
              type: 'text',
              reactions: undefined,
              mediaUrl: undefined,
              mediaUrls: undefined,
              replyToId: undefined,
              pollData: undefined
            }
            : msg
        )
      };
    });
  }, [currentUser]);

  // Check if message can be deleted for everyone (time limit check)
  const canDeleteForEveryone = useCallback((messageTimestamp) => {
    const TIME_LIMIT_MS = 60 * 60 * 1000; // 1 hour in milliseconds
    const now = Date.now();
    const messageTime = new Date(messageTimestamp).getTime();
    return (now - messageTime) < TIME_LIMIT_MS;
  }, []);

  // Legacy deleteMessages function - keeping for compatibility
  const deleteMessages = useCallback((chatId, messageIds, deleteForEveryoneFlag) => {
    if (deleteForEveryoneFlag) {
      deleteForEveryone(chatId, messageIds);
    } else {
      deleteForMe(chatId, messageIds);
    }
  }, [deleteForMe, deleteForEveryone]);

  const toggleArchiveChat = useCallback(async (chatId) => {
  // 1. Optimistic Update
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, isArchived: !chat.isArchived } : chat
    ));

    // 2. Persist to Firestore
    try {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        const newArchived = !chat.isArchived;
        await chatFirebaseService.updateUserChatSettings(chatId, currentUser.id, {
          isArchived: newArchived
        });
        console.log(`✅ Chat ${newArchived ? 'archived' : 'unarchived'} successfully`);
      }
    } catch (error) {
      console.error('Failed to persist archive status:', error);
      // Optionally revert state here
    }
  }, [chats, currentUser]);

  const togglePinChat = useCallback((chatId) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat
    ));
  }, []);

  const togglePinMessage = useCallback((chatId, messageId) => {
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: chatMessages.map(msg =>
          msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
        )
      };
    });
  }, []);

  const toggleStarMessage = useCallback((chatId, messageId) => {
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: chatMessages.map(msg =>
          msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
        )
      };
    });
  }, []);

  // Follow/Unfollow Functions - Firebase integrated
  const followUser = useCallback(async (userId) => {
    if (!currentUser?.id) {
      console.error('❌ Cannot follow: No current user');
      return;
    }

    try {
      // Optimistic update
      setFollowedUsers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
      setFollowingCount(prev => prev + 1);

      // Call Firebase service
      const result = await followFirebaseService.followUser(currentUser.id, userId);

      if (result.success) {
        console.log(`✅ Successfully followed user ${userId} `);

        // Show notification to the user being followed (if they have notifications enabled)
        // Note: In a real app, this would be handled server-side via Cloud Functions
        // For now, we'll show a local notification
        const followedUserName = users[userId]?.name || 'User';
        if (showNotification) {
          showNotification(
            'New Follower',
            {
              body: `You started following ${followedUserName} `,
              icon: users[userId]?.avatar || '/default-avatar.png'
            }
          );
        }
      } else {
        // Revert optimistic update
        setFollowedUsers(prev => prev.filter(id => id !== userId));
        setFollowingCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Error following user:', error);
      // Revert optimistic update
      setFollowedUsers(prev => prev.filter(id => id !== userId));
      setFollowingCount(prev => Math.max(0, prev - 1));
    }
  }, [currentUser, users, showNotification]);

  const unfollowUser = useCallback(async (userId) => {
    if (!currentUser?.id) {
      console.error('❌ Cannot unfollow: No current user');
      return;
    }

    try {
      // Optimistic update
      setFollowedUsers(prev => prev.filter(id => id !== userId));
      setFollowingCount(prev => Math.max(0, prev - 1));

      // Call Firebase service
      const result = await followFirebaseService.unfollowUser(currentUser.id, userId);

      if (result.success) {
        console.log(`✅ Successfully unfollowed user ${userId} `);
      }
    } catch (error) {
      console.error('❌ Error unfollowing user:', error);
      // Revert optimistic update
      setFollowedUsers(prev => [...prev, userId]);
      setFollowingCount(prev => prev + 1);
    }
  }, [currentUser]);

  const isFollowing = useCallback((userId) => {
    return followedUsers.includes(userId);
  }, [followedUsers]);

  /**
   * Get mutual connections count (users who both follow each other)
   */
  const getMutualConnectionsCount = useCallback(async (userId) => {
    try {
      if (!currentUser?.id) return 0;

      // Get who the current user follows
      const myFollowing = followedUsers;

      // Get who the other user follows
      const { success, following } = await followFirebaseService.getFollowing(userId);

      if (!success || !following) return 0;

      const theirFollowing = following.map(f => f.followingId);

      // Find mutual follows (people both users follow)
      const mutualCount = myFollowing.filter(id => theirFollowing.includes(id)).length;

      return mutualCount;
    } catch (error) {
      console.error('Error getting mutual connections:', error);
      return 0;
    }
  }, [currentUser, followedUsers]);

  /**
   * Check if two users mutually follow each other
   */
  const isMutualFollow = useCallback((userId) => {
    // You follow them
    const youFollowThem = followedUsers.includes(userId);

    // They follow you (we'd need to check if userId is in your followers)
    // For now, we'll just return if you follow them
    // This can be enhanced with a followers list
    return youFollowThem;
  }, [followedUsers]);

  /**
   * Clear new followers badge count
   */
  const clearNewFollowersBadge = useCallback(() => {
    setNewFollowersCount(0);
  }, []);

  const addReaction = useCallback((chatId, messageId, emoji) => {
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: chatMessages.map(msg => {
          if (msg.id !== messageId) return msg;
          const currentReactions = msg.reactions || {};
          if (currentReactions[currentUser.id] === emoji) {
            const newReactions = { ...currentReactions };
            delete newReactions[currentUser.id];
            return { ...msg, reactions: newReactions };
          }
          return {
            ...msg,
            reactions: { ...currentReactions, [currentUser.id]: emoji }
          };
        })
      };
    });
  }, [currentUser]);

  const updateChatTheme = useCallback(async (chatId, color, type) => {
  // 1. Optimistic Update for instant UI feedback
    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;

      // Update both root level (backward compatibility) and userSettings (Firebase structure)
      if (type === 'outgoing') {
        return {
          ...c,
          themeColor: color,
          userSettings: {
            ...c.userSettings,
            themeColor: color
          }
        };
      } else {
        return {
          ...c,
          incomingThemeColor: color,
          userSettings: {
            ...c.userSettings,
            incomingThemeColor: color
          }
        };
      }
    }));

    // 2. Persist to Firebase in background (non-blocking)
    try {
      if (currentUser?.id) {
        const settings = type === 'outgoing'
          ? { themeColor: color }
          : { incomingThemeColor: color };

        await chatFirebaseService.updateUserChatSettings(chatId, currentUser.id, settings);
        console.log(`✅ Theme ${type} color updated successfully`);
      }
    } catch (error) {
      console.error('❌ Failed to persist theme color:', error);
      // UI continues to work with local state even if Firebase sync fails
    }
  }, [currentUser]);

  const toggleChatLock = useCallback(async (chatId) => {
  // 1. Optimistic Update
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        const newLocked = !c.isLocked;
        return {
          ...c,
          isLocked: newLocked
        };
      }
      return c;
    }));

    // 2. Persist to Firestore
    try {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        const newLocked = !chat.isLocked;
        await chatFirebaseService.updateUserChatSettings(chatId, currentUser.id, {
          isLocked: newLocked
        });
        console.log(`✅ Chat ${newLocked ? 'locked' : 'unlocked'} successfully`);
      }
    } catch (error) {
      console.error('Failed to persist lock status:', error);
      // Optionally revert state here
    }
  }, [chats, currentUser]);

  const toggleDateLock = useCallback(async (chatId, dateString) => {
  // 1. Optimistic Update
    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;

      const userSettings = c.userSettings || {};
      const currentHidden = userSettings.hiddenDates || [];
      const isHidden = currentHidden.includes(dateString);

      let newHidden;
      if (isHidden) {
        newHidden = currentHidden.filter(d => d !== dateString);
      } else {
        newHidden = [...currentHidden, dateString];
      }

      return {
        ...c,
        userSettings: {
          ...userSettings,
          hiddenDates: newHidden
        }
      };
    }));

    // 2. Persist to Firestore
    try {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        const userSettings = chat.userSettings || {};
        const currentHidden = userSettings.hiddenDates || [];
        const isHidden = currentHidden.includes(dateString);

        let newHidden;
        if (isHidden) {
          newHidden = currentHidden.filter(d => d !== dateString);
        } else {
          newHidden = [...currentHidden, dateString];
        }

        await chatFirebaseService.updateUserChatSettings(chatId, currentUser.id, {
          hiddenDates: newHidden
        });
      }
    } catch (error) {
      console.error('Failed to persist date lock:', error);
      // Optionally revert state here
    }
  }, [chats, currentUser]);

  const addStatusUpdate = useCallback((status) => {
    setStatusUpdates(prev => [status, ...prev]);
  }, []);

  const deleteStatusUpdate = useCallback((statusId) => {
    setStatusUpdates(prev => prev.filter(s => s.id !== statusId));
  }, []);

  // ======= ENHANCED GAME ACTIONS =======
  
  /**
   * Open game invitation modal
   */
  const openGameInvite = useCallback((options) => {
    setInviteOptions(options || { isGroup: false });
    setIsGameInviteOpen(true);
  }, []);

  /**
   * Close game invitation modal
   */
  const closeGameInvite = useCallback(() => {
    setIsGameInviteOpen(false);
    setInviteOptions({ isGroup: false });
  }, []);

  /**
   * Send game invitation message
   */
  const inviteToGame = useCallback((chatId, gameType) => {
    const roomId = generateRoomId();
    const gameId = generateGameId();

    // Create game invitation message
    addMessage(
      chatId,
      "🎮 Game Invite",
      "game_invite",
      undefined, // replyToId
      undefined, // mediaUrl
      undefined, // duration
      {
        gameType,
        roomId,
        gameId,
        status: "pending",
        hostId: currentUser.id,
        players: [currentUser.id],
        maxPlayers: gameType === 'ludo' || gameType === 'snake' ? 4 : 2,
        createdAt: new Date().toISOString()
      } // Game data stored in pollData field temporarily (will be gameData)
    );

    // Create game room
    setGameRooms(prev => {
      const newRooms = new Map(prev);
      newRooms.set(roomId, {
        id: roomId,
        gameId,
        gameType,
        hostId: currentUser.id,
        chatId,
        players: [{ userId: currentUser.id, ready: true }],
        maxPlayers: gameType === 'ludo' || gameType === 'snake' ? 4 : 2,
        status: 'waiting',
        createdAt: new Date().toISOString()
      });
      return newRooms;
    });

    closeGameInvite();
  }, [currentUser, addMessage]);

  /**
   * Join a game from invitation
   */
  const joinGame = useCallback((gameType, roomId, chatId) => {
    // Get room
    const room = gameRooms.get(roomId);
    
    if (!room) {
      console.error('Game room not found:', roomId);
      return;
    }

    // Check if already in room
    const alreadyJoined = room.players.some(p => p.userId === currentUser.id);
    
    if (!alreadyJoined && room.players.length < room.maxPlayers) {
      // Add player to room
      setGameRooms(prev => {
        const newRooms = new Map(prev);
        const updatedRoom = { ...room };
        updatedRoom.players.push({ userId: currentUser.id, ready: true });
        
        // Start game if minimum players reached
        if (updatedRoom.players.length >= 2) {
          updatedRoom.status = 'in_progress';
        }
        
        newRooms.set(roomId, updatedRoom);
        return newRooms;
      });

      // Broadcast join event
      webSocketService.sendGameEvent(GameEventTypes.GAME_JOINED, {
        gameId: room.gameId,
        roomId,
        userId: currentUser.id
      });
    }

    // Create/activate game
    const newGame = {
      id: room.gameId,
      type: gameType,
      roomId,
      chatId,
      status: room.status,
      timestamp: new Date().toISOString(),
      currentTurn: room.players[0].userId,
      players: room.players.map((p, idx) => ({
        userId: p.userId,
        status: 'playing',
        color: gameType === 'ludo' ? ['red', 'green', 'blue', 'yellow'][idx] : 
               gameType === 'chess' ? (idx === 0 ? 'white' : 'black') : 
               idx === 0 ? 'X' : 'O'
      })),
      isMinimized: false,
      gameState: {} // Game-specific state
    };

    setActiveGame(newGame);
    setActiveGames(prev => {
      const newGames = new Map(prev);
      newGames.set(newGame.id, newGame);
      return newGames;
    });

    // Subscribe to game events
    webSocketService.subscribeToGame(newGame.id, (event) => {
      handleGameEvent(event);
    });
  }, [gameRooms, currentUser]);

  /**
   * Handle incoming game events from WebSocket
   */
  const handleGameEvent = useCallback((event) => {
    const { type, data } = event;

    switch (type) {
      case GameEventTypes.GAME_MOVE:
        updateGameState(data.gameId, data.gameState);
        break;
      case GameEventTypes.GAME_STATE_UPDATE:
        updateGameState(data.gameId, data.gameState);
        break;
      case GameEventTypes.GAME_END:
        endGame(data.gameId, data.result);
        break;
      case GameEventTypes.PLAYER_LEFT:
        // Handle player leaving
        break;
      default:
        break;
    }
  }, []);

  /**
   * Make a move in game
   */
  const makeGameMove = useCallback((gameId, move) => {
    const game = activeGames.get(gameId);
    if (!game) return;

    // Broadcast move to other players
    webSocketService.sendGameEvent(GameEventTypes.GAME_MOVE, {
      gameId,
      move,
      playerId: currentUser.id,
      timestamp: new Date().toISOString()
    });

    // Move handling will be done by individual game components
    // They will call updateGameState after processing the move
  }, [activeGames, currentUser]);

  /**
   * Update game state
   */
  const updateGameState = useCallback((gameId, newState) => {
    setActiveGames(prev => {
      const newGames = new Map(prev);
      const game = newGames.get(gameId);
      if (game) {
        newGames.set(gameId, { ...game, gameState: newState });
      }
      return newGames;
    });

    // Update active game if it's the current one
    setActiveGame(prev => {
      if (prev && prev.id === gameId) {
        return { ...prev, gameState: newState };
      }
      return prev;
    });
  }, []);

  /**
   * End game and save to history
   */
  const endGame = useCallback((gameId, result) => {
    const game = activeGames.get(gameId);
    if (!game) return;

    // Add to history
    const completedGame = {
      ...game,
      status: 'finished',
      result,
      endedAt: new Date().toISOString()
    };

    setGameHistory(prev => [completedGame, ...prev]);

    // Remove from active games
    setActiveGames(prev => {
      const newGames = new Map(prev);
      newGames.delete(gameId);
      return newGames;
    });

    // Close if it's the active game
    if (activeGame && activeGame.id === gameId) {
      setActiveGame(null);
    }

    // Add result message to chat
    if (game.chatId) {
      const winnerName = result.winner ? users[result.winner]?.name : null;
      const resultText = result.isDraw ? "Game ended in a draw" : 
                        result.winner === currentUser.id ? "You won the game! 🎉" :
                        `${winnerName} won the game!`;
      
      addMessage(game.chatId, resultText, 'text');
    }

    // Unsubscribe from events
    webSocketService.unsubscribeFromGame(gameId);

    // Broadcast end event
    webSocketService.sendGameEvent(GameEventTypes.GAME_END, {
      gameId,
      result
    });
  }, [activeGames, activeGame, currentUser, users, addMessage]);

  /**
   * Close/quit current game
   */
  const closeGame = useCallback(() => {
    if (activeGame) {
      // If game is in progress, end it
      if (activeGame.status === 'in_progress') {
        endGame(activeGame.id, {
          winner: null,
          reason: 'quit',
          quitBy: currentUser.id
        });
      }
      
      setActiveGame(null);
    }
  }, [activeGame, endGame, currentUser]);

  /**
   * Minimize active game
   */
  const minimizeGame = useCallback(() => {
    setActiveGame(prev => prev ? { ...prev, isMinimized: true } : null);
  }, []);

  /**
   * Maximize active game
   */
  const maximizeGame = useCallback(() => {
    setActiveGame(prev => prev ? { ...prev, isMinimized: false } : null);
  }, []);

  // Memoize context value - MUST be called before any conditional returns
  const contextValue = useMemo(() => ({
    isAuthenticated,
    authLoading, // Only Firebase auth loading, no more static data loading
    firebaseUser,
    login,
    logout,
    // State
    chats,
    messages,
    users,
    calls,
    statusUpdates,
    channels,
    chatDocuments,
    currentUser,
    currentUserId: currentUser?.id || 'me',
    drafts,
    chatSettings,
    updateChatSettings,
    securitySettings,
    updateSecuritySettings,
    privacySettings,
    updatePrivacySettings,
    statusPrivacy,
    searchQuery,
    logoEffect,
    // App and game configs are loaded from Firebase or environment\n    // appConfig and gameConfig removed - use Firebase settings instead


    // Online Status & Typing State
    onlineUsers,
    typingUsers,
    lastSeen,

    // Game State
    activeGame,
    activeGames,
    gameRooms,
    gameHistory,
    isGameInviteOpen,
    inviteOptions,

    // Actions
    // prevent duplicates: login/logout were here twice
    updateChatSettings,
    updateSecuritySettings,
    updateAppSettings,
    toggleTheme,
    updateUserProfile,
    setDraft,
    startChat,
    createGroup,
    addGroupParticipants,
    updateGroupSettings,
    updateGroupRole,
    addMessage,
    votePoll,
    // Game Actions
    openGameInvite,
    closeGameInvite,
    inviteToGame,
    joinGame,
    makeGameMove,
    updateGameState,
    endGame,
    closeGame,
    minimizeGame,
    maximizeGame,
    editMessage,
    markMessageAsViewed,
    deleteMessages,
    deleteForMe,
    deleteForEveryone,
    canDeleteForEveryone,
    hiddenMessages,
    toggleArchiveChat,
    togglePinChat,
    toggleChatLock,
    updateChatTheme,
    toggleDateLock,
    addStatusUpdate,
    deleteStatusUpdate,
    addReaction,
    setSearchQuery,
    setLogoEffect: (effect) => updateAppSettings({ logoEffect: effect }),
    setLanguage: (lang) => updateAppSettings({ language: lang }),
    // Online Status & Typing Actions
    markUserOnline,
    markUserOffline,
    setUserTyping,
    updateMessageStatus,
    markChatAsRead,
    togglePinMessage,
    toggleStarMessage,
    // Follow functions
    followUser,
    unfollowUser,
    isFollowing,
    acceptRequest: async (requesterId) => {
      const result = await followFirebaseService.acceptFollowRequest(requesterId, currentUser.id);
      if (result.success) {
        setPendingRequests(prev => prev.filter(r => r.followerId !== requesterId));
        setFollowersCount(prev => prev + 1);
      }
      return result;
    },
    rejectRequest: async (requesterId) => {
      const result = await followFirebaseService.rejectFollowRequest(requesterId, currentUser.id);
      if (result.success) {
        setPendingRequests(prev => prev.filter(r => r.followerId !== requesterId));
      }
      return result;
    },

    followedUsers,
    outgoingRequests,
    pendingRequests,
    // Offline messaging
    isOnline
  }), [
    chats, messages, users, calls, statusUpdates, channels, chatDocuments,
    currentUser, drafts, chatSettings,
    securitySettings, statusPrivacy, searchQuery, logoEffect,
    isAuthenticated, authLoading, firebaseUser, login, logout,
    updateChatSettings, updateSecuritySettings, updateAppSettings,
    toggleTheme, updateUserProfile, setDraft, startChat, createGroup,
    addGroupParticipants, updateGroupSettings, updateGroupRole, addMessage,
    votePoll, deleteMessages, deleteForMe, deleteForEveryone, canDeleteForEveryone, hiddenMessages,
    toggleArchiveChat, togglePinChat,
    toggleDateLock, addStatusUpdate, deleteStatusUpdate, setSearchQuery,
    activeGame, activeGames, gameRooms, gameHistory, isGameInviteOpen, inviteOptions, 
    openGameInvite, closeGameInvite, inviteToGame, joinGame, makeGameMove, updateGameState,
    endGame, closeGame, minimizeGame, maximizeGame, editMessage, markMessageAsViewed,
    onlineUsers, typingUsers, lastSeen, markUserOnline, markUserOffline,
    setUserTyping, updateMessageStatus, markChatAsRead, togglePinMessage, toggleStarMessage,
    followUser, unfollowUser, isFollowing, followedUsers,
    followersCount,
    followingCount,
    newFollowersCount,
    clearNewFollowersBadge,
    getMutualConnectionsCount,
    isMutualFollow,
    addReaction, updateChatTheme, toggleChatLock,
    followedUsers, followersCount, followingCount, newFollowersCount,
    outgoingRequests, pendingRequests, // Added to dependency array
    // Notification state and functions
    notificationPermission, fcmToken, requestNotificationPermission, showNotification, notificationsEnabled,
    // Session management
    activeSessionId, setActiveSessionId, messageSubscriptions,
    // Offline messaging  
    isOnline
  ]);


  // Early return AFTER all hooks - Show loading for auth only (no more static data)
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#EFEAE2] dark:bg-[#111b21] gap-4">
        <div className="w-12 h-12 border-4 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
        <div className="text-wa-teal dark:text-gray-300 font-medium animate-pulse">
          Authenticating...
        </div>
      </div>
    );
  }


  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
