import { useEffect, useState, useCallback } from 'react';
import { webSocketService } from '../../../services/WebSocketService';

/**
 * usePlayerPresence - Hook for tracking player presence
 * 
 * Features:
 * - Real-time presence updates
 * - Online/offline status
 * - Last seen timestamps
 * - Connection health
 */
const usePlayerPresence = (userId) => {
  const [presence, setPresence] = useState({
    status: 'offline',
    lastSeen: null,
  });
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    connecting: false,
  });

  /**
   * Update presence state
   */
  const updatePresenceState = useCallback((presenceData) => {
    setOnlinePlayers(
      presenceData
        .filter(p => p.status === 'online')
        .map(p => p.userId)
    );

    if (userId) {
      const userPresence = presenceData.find(p => p.userId === userId);
      if (userPresence) {
        setPresence({
          status: userPresence.status,
          lastSeen: userPresence.lastSeen,
        });
      }
    }
  }, [userId]);

  /**
   * Update connection status
   */
  const updateConnectionStatus = useCallback((status) => {
    setConnectionStatus({
      connected: status === 'connected',
      connecting: status === 'connecting',
    });
  }, []);

  /**
   * Subscribe to presence and connection updates
   */
  useEffect(() => {
    const unsubscribePresence = webSocketService.onPresenceChange(updatePresenceState);
    const unsubscribeConnection = webSocketService.onConnectionChange(updateConnectionStatus);

    // Get initial state
    if (userId) {
      const initialPresence = webSocketService.getPlayerPresence(userId);
      setPresence(initialPresence);
    }

    const initialOnline = webSocketService.getOnlinePlayers();
    setOnlinePlayers(initialOnline);

    const initialConnection = webSocketService.getConnectionStatus();
    setConnectionStatus({
      connected: initialConnection.connected,
      connecting: initialConnection.connecting,
    });

    return () => {
      unsubscribePresence();
      unsubscribeConnection();
    };
  }, [userId, updatePresenceState, updateConnectionStatus]);

  return {
    presence,
    onlinePlayers,
    connectionStatus,
    isOnline: presence.status === 'online',
    isPlayerOnline: (playerId) => onlinePlayers.includes(playerId),
  };
};

export default usePlayerPresence;
