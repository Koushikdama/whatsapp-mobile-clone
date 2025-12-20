import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useChatData } from '../../features/chat/hooks/useChatData';
import { generateGameId, generateRoomId } from '../utils/gameUtils';
import { webSocketService, GameEventTypes } from '../../services/WebSocketService';
import { useLocalStorage, useSessionStorage } from '../hooks/useStorage';
import { useNotifications } from '../hooks/useNotifications';
import authService from '../../services/firebase/AuthService';
import { messageFirebaseService } from '../../services/firebase/MessageFirebaseService';

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
  isAppLockEnabled: false
};

export const AppProvider = ({ children }) => {
  const { data, loading: dataLoading } = useChatData();

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
            console.log('✅ User profile loaded:', userProfile.name);
          }
        } catch (error) {
          console.error('❌ Error loading user profile:', error);
          // Use basic user info from auth
          setCurrentUser({
            id: user.uid,
            email: user.email,
            name: user.displayName || 'User',
            avatar: user.photoURL,
            about: 'Hey there! I am using WhatsApp'
          });
        }
        
        // Generate session ID
        if (!activeSessionId) {
          setActiveSessionId(`session_${Date.now()}_${user.uid}`);
        }
      } else {
        // User logged out - cleanup
        setCurrentUser(null);
        setActiveSessionId(null);
        
        // Cleanup all message subscriptions
        messageSubscriptions.forEach(unsubscribe => unsubscribe());
        setMessageSubscriptions(new Map());
      }
      
      setAuthLoading(false);
    });

    return () => {
      console.log('🔐 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  // Initialize data when fetched
  useEffect(() => {
    if (data) {
      // Current User
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      } else {
        // Fallback to data.json user if not in local storage
        const userFromData = data.users[data.currentUserId];
        if (userFromData) {
          setCurrentUser(userFromData);
        }
      }

      // Users (Static for now)
      setUsers(data.users);

      // Chats (LocalStorage or Data)
      // Enrich existing groups with roles if missing
      const enrichedChats = data.chats.map(c => {
        if (c.isGroup && !c.groupRoles) {
          const roles = {};
          c.groupParticipants?.forEach((pid) => {
            // Mock logic: 'me' is owner for c5 (created by me), 'u5' is admin everywhere else
            if (c.id === 'c5' && pid === 'me') roles[pid] = 'owner';
            else if (pid === 'u5') roles[pid] = 'admin';
            else roles[pid] = 'member';
          });

          // Fallback: Make first participant owner if none exists
          if (!Object.values(roles).includes('owner') && c.groupParticipants && c.groupParticipants.length > 0) {
            roles[c.groupParticipants[0]] = 'owner';
          }

          return {
            ...c,
            groupRoles: roles,
            groupSettings: {
              editInfo: 'all',
              sendMessages: 'all',
              addMembers: 'all',
              approveMembers: false
            }
          };
        }
        return c;
      });

      setChats(enrichedChats);
      setMessages(data.messages);
      setCalls(data.calls);
      setStatusUpdates(data.statusUpdates);
      setChannels(data.channels || []);
      setChatDocuments(data.chatDocuments || {});
    }
  }, [data]);

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

  const updateChatSettings = useCallback((newSettings) => {
    setChatSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateSecuritySettings = useCallback((newSettings) => {
    setSecuritySettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

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

  const startChat = useCallback((contactId) => {
    const existingChat = chats.find(c => c.contactId === contactId && !c.isGroup);
    if (existingChat) return existingChat.id;

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
  }, [chats]);

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

  const addMessage = useCallback((chatId, text, type, replyToId, mediaUrl, duration, pollData, isViewOnce) => {
    const newMessage = {
      id: `m_${Date.now()}`,
      chatId,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toISOString(),
      status: 'sent',
      type,
      replyToId,
      mediaUrl,
      duration,
      pollData,
      isViewOnce
    };

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
      if (prev[chatIndex].isLocked) {
        updatedChat.isArchived = true;
      }
      const newChats = [...prev];
      newChats.splice(chatIndex, 1);
      return [updatedChat, ...newChats];
    });

    // Simulate message delivery status progression
    // sent -> delivered (1 second) -> read (when chat is next opened)
    setTimeout(() => {
      updateMessageStatus(chatId, newMessage.id, 'delivered');
    }, 1000);
  }, [currentUser, updateMessageStatus]);

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

  const deleteMessages = useCallback((chatId, messageIds, deleteForEveryone) => {
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      const idsSet = new Set(messageIds);

      if (deleteForEveryone) {
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
                replyToId: undefined,
                pollData: undefined
              }
              : msg
          )
        };
      } else {
        return {
          ...prev,
          [chatId]: chatMessages.filter(msg => !idsSet.has(msg.id))
        };
      }
    });
  }, [currentUser]);

  const toggleArchiveChat = useCallback((chatId) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, isArchived: !chat.isArchived } : chat
    ));
  }, []);

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

  const updateChatTheme = useCallback((chatId, color, type) => {
    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      return type === 'outgoing'
        ? { ...c, themeColor: color }
        : { ...c, incomingThemeColor: color };
    }));
  }, []);

  const toggleChatLock = useCallback((chatId) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        const newLocked = !c.isLocked;
        return {
          ...c,
          isLocked: newLocked,
          isArchived: newLocked ? true : c.isArchived
        };
      }
      return c;
    }));
  }, []);

  const toggleDateLock = useCallback((chatId, dateString) => {
    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      const currentHidden = c.hiddenDates || [];
      const isHidden = currentHidden.includes(dateString);
      let newHidden;
      if (isHidden) {
        newHidden = currentHidden.filter(d => d !== dateString);
      } else {
        newHidden = [...currentHidden, dateString];
      }
      return { ...c, hiddenDates: newHidden };
    }));
  }, []);

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
    authLoading,
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
    currentUserId: data?.currentUserId || 'me',
    drafts,
    chatSettings,
    securitySettings,
    statusPrivacy,
    searchQuery,
    logoEffect,
    appConfig: data?.appConfig,
    gameConfig: data?.gameConfig,

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
    toggleArchiveChat,
    togglePinChat,
    setSearchQuery,
    setLogoEffect,
    // Online Status & Typing Actions
    markUserOnline,
    markUserOffline,
    setUserTyping,
    updateMessageStatus,
    markChatAsRead,
    togglePinMessage,
    toggleStarMessage
  }), [
    chats, messages, users, calls, statusUpdates, channels, chatDocuments,
    currentUser, data?.currentUserId, drafts, chatSettings,
    securitySettings, statusPrivacy, searchQuery, logoEffect, data?.appConfig,
    data?.gameConfig, isAuthenticated, authLoading, firebaseUser, login, logout, updateChatSettings, updateSecuritySettings,
    toggleTheme, updateUserProfile, setDraft, startChat, createGroup,
    addGroupParticipants, updateGroupSettings, updateGroupRole, addMessage,
    votePoll, deleteMessages, toggleArchiveChat, togglePinChat,
    toggleDateLock, addStatusUpdate, deleteStatusUpdate, setSearchQuery,
    setLogoEffect, activeGame, activeGames, gameRooms, gameHistory, isGameInviteOpen, inviteOptions, 
    openGameInvite, closeGameInvite, inviteToGame, joinGame, makeGameMove, updateGameState,
    endGame, closeGame, minimizeGame, maximizeGame, editMessage, markMessageAsViewed,
    onlineUsers, typingUsers, lastSeen, markUserOnline, markUserOffline,
    setUserTyping, updateMessageStatus, markChatAsRead, togglePinMessage, toggleStarMessage,
    addReaction, updateChatTheme, toggleChatLock,
    // Notification state and functions
    notificationPermission, fcmToken, requestNotificationPermission, showNotification, notificationsEnabled,
    // Session management
    activeSessionId, setActiveSessionId, messageSubscriptions
  ]);


  // Early return AFTER all hooks - Show loading for auth or data
  if (authLoading || dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#EFEAE2] dark:bg-[#111b21] gap-4">
        <div className="w-12 h-12 border-4 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
        <div className="text-wa-teal dark:text-gray-300 font-medium animate-pulse">
          {authLoading ? 'Authenticating...' : 'Loading WhatsApp...'}
        </div>
      </div>
    )
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
