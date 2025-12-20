import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../../shared/context/AppContext';
import { generateGameId, generateRoomId } from '../../../shared/utils/gameUtils';
import { webSocketService, GameEventTypes } from '../../../services/WebSocketService';
import { validateGameType, validatePlayerCount } from '../../../shared/utils/gameValidators';
import { GAME_CONFIG, GAME_STATUS } from '../../../shared/constants/gameConstants';

const GameContext = createContext(undefined);

/**
 * GameProvider - Dedicated context for game-related state and actions (SOLID: Single Responsibility)
 */
export const GameProvider = ({ children }) => {
  const { currentUserId, addMessage } = useApp();
  
  // ========== STATE ==========
  const [activeGame, setActiveGame] = useState(null);
  const [activeGames, setActiveGames] = useState(new Map());
  const [gameRooms, setGameRooms] = useState(new Map());
  const [gameHistory, setGameHistory] = useState(() => {
    const saved = localStorage.getItem('gameHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isGameInviteOpen, setIsGameInviteOpen] = useState(false);
  const [inviteOptions, setInviteOptions] = useState({ isGroup: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ========== PERSISTENCE ==========
  useEffect(() => {
    localStorage.setItem('gameHistory', JSON.stringify(gameHistory.slice(0, 50)));
  }, [gameHistory]);

  // ========== HELPER FUNCTIONS ==========
  const getPlayerColor = useCallback((gameType, index) => {
    const config = GAME_CONFIG[gameType];
    return config?.colors?.[index] || 'default';
  }, []);

  // ========== INVITATION ==========
  const openGameInvite = useCallback((options = {}) => {
    setInviteOptions({ isGroup: false, ...options });
    setIsGameInviteOpen(true);
  }, []);

  const closeGameInvite = useCallback(() => {
    setIsGameInviteOpen(false);
    setInviteOptions({ isGroup: false });
  }, []);

  /**
   * Create and send game invitation
   */
  const inviteGame = useCallback((type, chatId) => {
    const validation = validateGameType(type);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    const roomId = generateRoomId();
    const gameId = generateGameId();
    
    const inviteData = {
      gameType: type,
      roomId,
      gameId,
      status: GAME_STATUS.PENDING,
      hostId: currentUserId,
      players: [currentUserId],
      maxPlayers: GAME_CONFIG[type]?.maxPlayers || 2,
      createdAt: new Date().toISOString()
    };

    // Create game room
    setGameRooms(prev => {
      const newRooms = new Map(prev);
      newRooms.set(roomId, {
        id: roomId,
        gameId,
        gameType: type,
        hostId: currentUserId,
        chatId,
        players: [{ userId: currentUserId, ready: true }],
        maxPlayers: inviteData.maxPlayers,
        status: GAME_STATUS.WAITING,
        createdAt: new Date().toISOString()
      });
      return newRooms;
    });

    // Send invitation message
    addMessage(
      chatId,
      "🎮 Game Invite",
      "game_invite",
      undefined,
      undefined,
      undefined,
      inviteData
    );

    closeGameInvite();
  }, [currentUserId, addMessage, closeGameInvite]);

  // ========== GAME LIFECYCLE ==========
  
  /**
   * Join a game room
   */
  const joinGame = useCallback((type, roomId, chatId) => {
    setLoading(true);
    setError(null);

    try {
      const room = gameRooms.get(roomId);
      
      if (!room) {
        throw new Error('Game room not found');
      }

      const alreadyJoined = room.players.some(p => p.userId === currentUserId);
      
      if (!alreadyJoined) {
        if (room.players.length >= room.maxPlayers) {
          throw new Error('Game room is full');
        }

        // Add player to room
        setGameRooms(prev => {
          const newRooms = new Map(prev);
          const updatedRoom = { ...room };
          updatedRoom.players.push({ userId: currentUserId, ready: true });
          
          if (updatedRoom.players.length >= 2) {
            updatedRoom.status = GAME_STATUS.IN_PROGRESS;
          }
          
          newRooms.set(roomId, updatedRoom);
          return newRooms;
        });

        webSocketService.sendGameEvent(GameEventTypes.GAME_JOINED, {
          gameId: room.gameId,
          roomId,
          userId: currentUserId
        });
      }

      // Create active game
      const newGame = {
        id: room.gameId,
        type,
        roomId,
        chatId,
        status: room.status,
        timestamp: new Date().toISOString(),
        currentTurn: room.players[0].userId,
        players: room.players.map((p, idx) => ({
          userId: p.userId,
          status: 'playing',
          color: getPlayerColor(type, idx)
        })),
        isMinimized: false,
        gameState: {}
      };

      setActiveGame(newGame);
      setActiveGames(prev => {
        const newGames = new Map(prev);
        newGames.set(newGame.id, newGame);
        return newGames;
      });

      webSocketService.subscribeToGame(newGame.id, handleGameEvent);

    } catch (err) {
      setError(err.message);
      console.error('Join game error:', err);
    } finally {
      setLoading(false);
    }
  }, [gameRooms, currentUserId, getPlayerColor]);

  /**
   * Create a new game
   */
  const createGame = useCallback((type, chatId, opponentId) => {
    const validation = validatePlayerCount(type, 2);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    const gameId = generateGameId();
    const newGame = {
      id: gameId,
      type,
      chatId,
      status: GAME_STATUS.IN_PROGRESS,
      timestamp: new Date().toISOString(),
      currentTurn: currentUserId,
      players: [
        { userId: currentUserId, status: 'playing', color: getPlayerColor(type, 0) },
        { userId: opponentId, status: 'playing', color: getPlayerColor(type, 1) }
      ],
      isMinimized: false,
      gameState: {}
    };
    
    setActiveGame(newGame);
    setActiveGames(prev => {
      const newGames = new Map(prev);
      newGames.set(gameId, newGame);
      return newGames;
    });
    closeGameInvite();
  }, [currentUserId, getPlayerColor, closeGameInvite]);

  /**
   * Handle incoming game events
   */
  const handleGameEvent = useCallback((event) => {
    const { type, data } = event;

    switch (type) {
      case GameEventTypes.GAME_MOVE:
      case GameEventTypes.GAME_STATE_UPDATE:
        updateGameState(data.gameId, data.gameState);
        break;
      case GameEventTypes.GAME_END:
        endGame(data.gameId, data.result);
        break;
      case GameEventTypes.PLAYER_LEFT:
        handlePlayerLeft(data.gameId, data.userId);
        break;
      default:
        break;
    }
  }, []);

  /**
   * Make a game move
   */
  const makeGameMove = useCallback((gameId, move) => {
    const game = activeGames.get(gameId);
    if (!game) return;

    webSocketService.sendGameEvent(GameEventTypes.GAME_MOVE, {
      gameId,
      move,
      playerId: currentUserId,
      timestamp: new Date().toISOString()
    });
  }, [activeGames, currentUserId]);

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

    setActiveGame(prev => {
      if (prev && prev.id === gameId) {
        return { ...prev, gameState: newState };
      }
      return prev;
    });
  }, []);

  /**
   * End game
   */
  const endGame = useCallback((gameId, result) => {
    const game = activeGames.get(gameId);
    if (!game) return;

    const completedGame = {
      ...game,
      status: GAME_STATUS.FINISHED,
      result,
      endedAt: new Date().toISOString()
    };

    setGameHistory(prev => [completedGame, ...prev].slice(0, 50));

    setActiveGames(prev => {
      const newGames = new Map(prev);
      newGames.delete(gameId);
      return newGames;
    });

    if (activeGame && activeGame.id === gameId) {
      setActiveGame(null);
    }

    webSocketService.unsubscribeFromGame(gameId);
    webSocketService.sendGameEvent(GameEventTypes.GAME_END, { gameId, result });
  }, [activeGames, activeGame]);

  /**
   * Handle player leaving
   */
  const handlePlayerLeft = useCallback((gameId, userId) => {
    const game = activeGames.get(gameId);
    if (!game) return;

    const updatedGame = {
      ...game,
      players: game.players.map(p => 
        p.userId === userId ? { ...p, status: 'left' } : p
      )
    };

    setActiveGames(prev => {
      const newGames = new Map(prev);
      newGames.set(gameId, updatedGame);
      return newGames;
    });

    if (activeGame && activeGame.id === gameId) {
      setActiveGame(updatedGame);
    }
  }, [activeGames, activeGame]);

  /**
   * Close game
   */
  const closeGame = useCallback(() => {
    if (activeGame) {
      if (activeGame.status === GAME_STATUS.IN_PROGRESS) {
        endGame(activeGame.id, {
          winner: null,
          reason: 'quit',
          quitBy: currentUserId
        });
      }
      setActiveGame(null);
    }
  }, [activeGame, endGame, currentUserId]);

  /**
   * Minimize/Maximize game
   */
  const minimizeGame = useCallback(() => {
    setActiveGame(prev => prev ? { ...prev, isMinimized: true } : null);
  }, []);

  const maximizeGame = useCallback(() => {
    setActiveGame(prev => prev ? { ...prev, isMinimized: false } : null);
  }, []);

  /**
   * Clear history
   */
  const clearGameHistory = useCallback(() => {
    setGameHistory([]);
  }, []);

  // ========== CONTEXT VALUE ==========
  const contextValue = useMemo(() => ({
    activeGame,
    activeGames,
    gameRooms,
    gameHistory,
    isGameInviteOpen,
    inviteOptions,
    loading,
    error,
    openGameInvite,
    closeGameInvite,
    inviteGame,
    joinGame,
    createGame,
    makeGameMove,
    updateGameState,
    endGame,
    closeGame,
    minimizeGame,
    maximizeGame,
    clearGameHistory,
  }), [
    activeGame, activeGames, gameRooms, gameHistory, isGameInviteOpen, inviteOptions,
    loading, error, openGameInvite, closeGameInvite, inviteGame, joinGame, createGame,
    makeGameMove, updateGameState, endGame, closeGame, minimizeGame, maximizeGame, clearGameHistory
  ]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};
