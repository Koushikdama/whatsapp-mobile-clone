/**
 * WebSocketService.js
 * 
 * Mock WebSocket service for real-time game communication.
 * Uses localStorage events to simulate real-time updates across tabs.
 * 
 * In a Spring Boot backend, this will be replaced with actual WebSocket:
 * - Connection: ws://localhost:8080/ws/game
 * - STOMP protocol over SockJS
 * - Topic subscriptions: /topic/game/{gameId}
 */

class WebSocketService {
    constructor() {
        this.connected = false;
        this.userId = null;
        this.subscriptions = new Map(); // gameId -> callback
        this.eventChannel = 'whatsapp_game_events';
    }

    /**
     * Initialize connection (simulated)
     * @param {string} userId Current user ID
     */
    connect(userId) {
        if (this.connected) return;

        this.userId = userId;
        this.connected = true;

        // Listen for storage events (cross-tab communication)
        window.addEventListener('storage', this._handleStorageEvent.bind(this));

        console.log(`[WebSocket] Connected as user: ${userId}`);
    }

    /**
     * Handle storage events from other tabs
     * @private
     */
    _handleStorageEvent(event) {
        if (event.key !== this.eventChannel) return;

        try {
            const eventData = JSON.parse(event.newValue);
            
            // Don't process our own events
            if (eventData.senderId === this.userId) return;

            // Route to appropriate subscriber
            const { gameId, type, data } = eventData;
            const callback = this.subscriptions.get(gameId);

            if (callback) {
                callback({ type, data, senderId: eventData.senderId });
            }
        } catch (error) {
            console.error('[WebSocket] Error processing event:', error);
        }
    }

    /**
     * Send a game event
     * @param {string} type Event type (GAME_INVITE, GAME_MOVE, etc.)
     * @param {object} data Event data
     */
    sendGameEvent(type, data) {
        if (!this.connected) {
            console.warn('[WebSocket] Not connected');
            return;
        }

        const event = {
            type,
            data,
            senderId: this.userId,
            gameId: data.gameId,
            timestamp: new Date().toISOString()
        };

        // Broadcast via localStorage (will trigger storage events in other tabs)
        try {
            const currentValue = localStorage.getItem(this.eventChannel);
            localStorage.setItem(this.eventChannel, JSON.stringify(event));
            
            // Reset to allow same event again
            setTimeout(() => {
                if (localStorage.getItem(this.eventChannel) === JSON.stringify(event)) {
                    localStorage.removeItem(this.eventChannel);
                }
            }, 100);

            console.log(`[WebSocket] Sent ${type}:`, data);
        } catch (error) {
            console.error('[WebSocket] Error sending event:', error);
        }
    }

    /**
     * Subscribe to game updates
     * @param {string} gameId Game ID to subscribe to
     * @param {function} callback Function to call on updates
     */
    subscribeToGame(gameId, callback) {
        this.subscriptions.set(gameId, callback);
        console.log(`[WebSocket] Subscribed to game: ${gameId}`);
    }

    /**
     * Unsubscribe from game updates
     * @param {string} gameId Game ID to unsubscribe from
     */
    unsubscribeFromGame(gameId) {
        this.subscriptions.delete(gameId);
        console.log(`[WebSocket] Unsubscribed from game: ${gameId}`);
    }

    /**
     * Disconnect and cleanup
     */
    disconnect() {
        if (!this.connected) return;

        window.removeEventListener('storage', this._handleStorageEvent.bind(this));
        this.subscriptions.clear();
        this.connected = false;
        this.userId = null;

        console.log('[WebSocket] Disconnected');
    }
}

// Singleton instance
export const webSocketService = new WebSocketService();

// Event type constants
export const GameEventTypes = {
    GAME_INVITE: 'GAME_INVITE',
    GAME_JOINED: 'GAME_JOINED',
    GAME_MOVE: 'GAME_MOVE',
    GAME_STATE_UPDATE: 'GAME_STATE_UPDATE',
    GAME_END: 'GAME_END',
    PLAYER_LEFT: 'PLAYER_LEFT'
};
