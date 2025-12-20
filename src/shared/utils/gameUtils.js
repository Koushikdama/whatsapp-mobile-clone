/**
 * Game utility functions
 * 
 * Centralized utility methods for game-related operations.
 * Follows DRY principle by extracting common game logic.
 */

/**
 * Generate a unique game ID
 * @returns {string} Unique game ID
 */
export const generateGameId = () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 11);
    return `game_${timestamp}_${randomStr}`;
};

/**
 * Generate a unique room ID for multiplayer games
 * @returns {string} Unique room ID
 */
export const generateRoomId = () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `room_${timestamp}_${randomStr}`;
};

/**
 * Format game timer display
 * @param {number} seconds Time in seconds
 * @returns {string} Formatted time (MM:SS)
 */
export const formatGameTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get emoji/icon for game type
 * @param {string} gameType Type of game
 * @returns {string} Emoji icon
 */
export const getGameIcon = (gameType) => {
    const icons = {
        chess: '♟️',
        ludo: '🎲',
        snake: '🐍',
        tictactoe: '⭕'
    };
    return icons[gameType] || '🎮';
};

/**
 * Get display title for game type
 * @param {string} gameType Type of game
 * @returns {string} Display title
 */
export const getGameTitle = (gameType) => {
    const titles = {
        chess: 'Chess Master',
        ludo: 'Ludo King',
        snake: 'Snake & Ladders',
        tictactoe: 'Tic-Tac-Toe'
    };
    return titles[gameType] || 'Game';
};

/**
 * Get theme color for game type
 * @param {string} gameType Type of game
 * @returns {string} Color class
 */
export const getGameColor = (gameType) => {
    const colors = {
        chess: '#6366f1', // Indigo
        ludo: '#ef4444', // Red
        snake: '#22c55e', // Green
        tictactoe: '#3b82f6' // Blue
    };
    return colors[gameType] || '#008069'; // Default teal
};

/**
 * Serialize game state for storage/transmission
 * @param {string} gameType Type of game
 * @param {object} state Game state object
 * @returns {string} Serialized state
 */
export const serializeGameState = (gameType, state) => {
    try {
        return JSON.stringify({
            type: gameType,
            state,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error serializing game state:', error);
        return null;
    }
};

/**
 * Deserialize game state from storage/transmission
 * @param {string} serialized Serialized state string
 * @returns {object} Game state object
 */
export const deserializeGameState = (serialized) => {
    try {
        return JSON.parse(serialized);
    } catch (error) {
        console.error('Error deserializing game state:', error);
        return null;
    }
};

/**
 * Get player color/symbol based on index
 * @param {string} gameType Type of game
 * @param {number} playerIndex Player index (0, 1, 2, 3)
 * @returns {string} Color name or symbol
 */
export const getPlayerColor = (gameType, playerIndex) => {
    const colors = {
        ludo: ['red', 'green', 'blue', 'yellow'],
        chess: ['white', 'black'],
        snake: ['red', 'blue', 'green', 'yellow'],
        tictactoe: ['X', 'O']
    };
    
    const gameColors = colors[gameType];
    if (!gameColors) return 'player';
    
    return gameColors[playerIndex % gameColors.length];
};

/**
 * Calculate player statistics from game history
 * @param {array} gameHistory Array of completed games
 * @param {string} userId User ID
 * @returns {object} Statistics object
 */
export const calculatePlayerStats = (gameHistory, userId) => {
    const stats = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        byGameType: {}
    };

    gameHistory.forEach(game => {
        if (!game.players.includes(userId)) return;

        stats.totalGames++;

        if (game.result.winner === userId) {
            stats.wins++;
        } else if (game.result.winner === null) {
            stats.draws++;
        } else {
            stats.losses++;
        }

        // Track by game type
        if (!stats.byGameType[game.type]) {
            stats.byGameType[game.type] = { played: 0, won: 0 };
        }
        stats.byGameType[game.type].played++;
        if (game.result.winner === userId) {
            stats.byGameType[game.type].won++;
        }
    });

    return stats;
};

/**
 * Check if user can join game
 * @param {object} game Game object
 * @param {string} userId User ID
 * @returns {boolean} Can join
 */
export const canJoinGame = (game, userId) => {
    if (!game || game.status === 'finished') return false;
    if (game.players.includes(userId)) return true; // Already in game
    if (game.players.length >= game.maxPlayers) return false;
    return game.status === 'waiting' || game.status === 'lobby';
};

/**
 * Get game status display text
 * @param {object} game Game object
 * @returns {string} Status text
 */
export const getGameStatusText = (game) => {
    const statusMap = {
        waiting: 'Waiting for players...',
        lobby: 'In lobby',
        in_progress: 'In progress',
        paused: 'Paused',
        finished: 'Finished'
    };
    return statusMap[game.status] || 'Unknown';
};
