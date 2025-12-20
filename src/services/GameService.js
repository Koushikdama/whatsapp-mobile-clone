/**
 * GameService.js
 * 
 * Refactored service following SOLID principles
 * - Single Responsibility: Each game rule has its own class
 * - Open/Closed: Easy to add new games without modifying existing code
 * - Liskov Substitution: All rule engines follow the same interface
 * 
 * In Spring Boot migration, this would become:
 * - POST /api/games/move
 * - GET /api/games/{id}/state  
 * - POST /api/games/validate
 */

import { GAME_CONFIG, GAME_TYPES } from '../shared/constants/gameConstants';

/**
 * Base Rule Engine Interface
 */
class BaseGameRules {
  validateMove(gameState, move) {
    throw new Error('validateMove must be implemented');
  }
  
  executeMove(gameState, move) {
    throw new Error('executeMove must be implemented');
  }
  
  checkGameOver(gameState) {
    throw new Error('checkGameOver must be implemented');
  }
  
  getWinner(gameState) {
    return null;
  }
}

/**
 * Ludo Game Rules
 */
class LudoRules extends BaseGameRules {
  validateMove(gameState, move) {
    const { tokenIndex, diceRoll, playerId } = move;
    const positions = gameState.positions?.[playerId];
    
    if (!positions || tokenIndex >= positions.length) {
      return false;
    }

    const currentPos = positions[tokenIndex];
    
    // Need 6 to start
    if (currentPos === 0 && diceRoll !== 6) {
      return false;
    }

    // Cannot exceed finish line
    const newPos = this.calculateNewPosition(currentPos, diceRoll, playerId);
    if (newPos > 57) {
      return false;
    }

    return true;
  }
  
  calculateNewPosition(currentPos, roll, playerColor) {
    if (currentPos === 0) {
      return roll === 6 ? 1 : 0;
    }

    let newPos = currentPos + roll;

    if (newPos > 57) {
      return currentPos;
    }
    if (newPos === 57) {
      return 100; // Finished
    }

    return newPos;
  }
  
  checkCapture(position, opponentPositions) {
    const safeZones = [0, 1, 9, 14, 22, 27, 35, 40, 48];
    
    if (safeZones.includes(position)) {
      return null;
    }

    for (let i = 0; i < opponentPositions.length; i++) {
      if (opponentPositions[i] === position && position > 0 && position <= 52) {
        return i;
      }
    }
    
    return null;
  }
  
  checkGameOver(gameState) {
    if (!gameState.positions) return false;
    return Object.values(gameState.positions).some(playerPositions =>
      playerPositions.every(pos => pos === 57)
    );
  }
}

/**
 * Tic-Tac-Toe Game Rules
 */
class TicTacToeRules extends BaseGameRules {
  validateMove(gameState, move) {
    const { position } = move;
    
    if (position < 0 || position > 8) {
      return false;
    }

    return gameState.board?.[position] === null;
  }
  
  checkWinner(squares) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  }
  
  checkGameOver(gameState) {
    return gameState.winner !== null || !gameState.board?.includes(null);
  }
}

/**
 * Snake & Ladders Game Rules
 */
class SnakeRules extends BaseGameRules {
  constructor() {
    super();
    this.snakes = GAME_CONFIG[GAME_TYPES.SNAKE]?.snakes || {};
    this.ladders = GAME_CONFIG[GAME_TYPES.SNAKE]?.ladders || {};
  }
  
  validateMove(gameState, move) {
    return move.diceRoll >= 1 && move.diceRoll <= 6;
  }
  
  calculateNewPosition(currentPos, diceRoll) {
    let newPos = currentPos + diceRoll;

    if (newPos > 100) {
      return currentPos;
    }

    // Check for ladders
    if (this.ladders[newPos]) {
      return this.ladders[newPos];
    }

    // Check for snakes
    if (this.snakes[newPos]) {
      return this.snakes[newPos];
    }

    return newPos;
  }
  
  checkGameOver(gameState) {
    return gameState.positions?.some(pos => pos === 100);
  }
  
  getWinner(gameState) {
    const positions = gameState.positions || [];
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] === 100) {
        return i;
      }
    }
    return null;
  }
}

/**
 * Main Game Service (Facade Pattern)
 */
class GameService {
  constructor() {
    this.games = new Map(); // Mock database
    
    // Initialize rule engines (SOLID: Open/Closed Principle)
    this.ruleEngines = {
      [GAME_TYPES.LUDO]: new LudoRules(),
      [GAME_TYPES.TIC_TAC_TOE]: new TicTacToeRules(),
      [GAME_TYPES.SNAKE]: new SnakeRules(),
      // Chess uses chess.js library directly
    };
  }

  /**
   * Get rule engine for game type
   */
  getRuleEngine(gameType) {
    return this.ruleEngines[gameType];
  }

  /**
   * Helper to get a consistent game key
   */
  _getGameKey(gameId) {
    return `game_${gameId}`;
  }

  /**
   * Initialize a new game
   */
  initGame(gameId, type, config = {}) {
    const key = this._getGameKey(gameId);
    if (!this.games.has(key)) {
      let initialState = {};

      switch (type) {
        case GAME_TYPES.LUDO:
          initialState = this._createLudoState();
          break;
        case GAME_TYPES.TIC_TAC_TOE:
          initialState = this._createTicTacToeState();
          break;
        case GAME_TYPES.SNAKE:
          initialState = this._createSnakeState();
          break;
        default:
          initialState = { type, ...config };
      }

      this.games.set(key, {
        id: gameId,
        type,
        state: initialState,
        lastUpdated: new Date()
      });
    }
    return this.games.get(key);
  }

    getGameState(gameId) {
        return this.games.get(this._getGameKey(gameId))?.state || null;
    }

    // --- LUDO LOGIC ---

    _createLudoState() {
        return {
            loading: false,
            winner: null,
            turn: 'red', // red, green, blue, yellow
            diceValues: [],
            // 4 tokens per player. 0 = home base. 1-52 = main path. 53-57 = victory path. 100 = finished.
            positions: {
                red: [0, 0, 0, 0],
                green: [0, 0, 0, 0] // AI for now
            }
        };
    }

    /**
     * Calculates the new position for a Ludo token
     * @param {number} currentPos Current position index
     * @param {number} roll Dice roll value
     * @param {string} playerColor 'red' or 'green'
     */
    calculateLudoMove(currentPos, roll, playerColor) {
        // 0 means in base. Need 6 to exit.
        if (currentPos === 0) {
            return roll === 6 ? 1 : 0;
        }

        // Logic for path traversal would go here.
        // For simplified MVP:
        // Main path length = 52.
        // If > 52, enters home stretch.

        let newPos = currentPos + roll;

        // Simple win condition check
        if (newPos > 57) {
            return currentPos; // Bounce back or stay put? Standard is stay put if exact roll needed.
        }
        if (newPos === 57) {
            return 100; // Finished
        }

        return newPos;
    }

    // --- TIC-TAC-TOE LOGIC ---

    _createTicTacToeState() {
        return {
            board: Array(9).fill(null),
            isXNext: true, // X goes first
            winner: null,
            winningLine: null
        };
    }

    checkTicTacToeWinner(squares) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return { winner: squares[a], line: lines[i] };
            }
        }
        return null;
    }

    /**
     * Check if a Ludo token captures an opponent token at the given position
     * @param {number} position The position to check
     * @param {array} opponentPositions Array of opponent token positions
     * @returns {number|null} Index of captured token or null
     */
    checkLudoCapture(position, opponentPositions) {
        // Safe zones: 0 (home base), 1 (start position), 53-57 (home stretch)
        const safeZones = [0, 1, 9, 14, 22, 27, 35, 40, 48]; // Including star positions
        
        if (safeZones.includes(position)) {
            return null; // Cannot capture on safe zones
        }

        // Check if any opponent token is at this position
        for (let i = 0; i < opponentPositions.length; i++) {
            if (opponentPositions[i] === position && position > 0 && position <= 52) {
                return i; // Return index of captured token
            }
        }
        
        return null;
    }

    // --- SNAKE & LADDERS LOGIC ---

    _createSnakeLaddersState() {
        // Standard Snake & Ladders board configuration
        const snakes = {
            99: 78, 95: 75, 92: 88, 89: 68, 74: 53,
            64: 60, 62: 19, 49: 11, 46: 25, 16: 6
        };

        const ladders = {
            2: 38, 7: 14, 8: 31, 15: 26, 21: 42,
            28: 84, 36: 44, 51: 67, 71: 91, 78: 98
        };

        return {
            snakes,
            ladders,
            positions: [0, 0], // Player 1, Player 2
            turn: 0, // 0 or 1
            winner: null
        };
    }

    calculateSnakeLaddersMove(currentPos, diceRoll) {
        let newPos = currentPos + diceRoll;

        // Cannot exceed 100
        if (newPos > 100) {
            return currentPos; // Stay at current position
        }

        // Check for ladders
        const state = this._snakeLaddersConfig || this._createSnakeLaddersState();
        if (state.ladders[newPos]) {
            return state.ladders[newPos];
        }

        // Check for snakes
        if (state.snakes[newPos]) {
            return state.snakes[newPos];
        }

        return newPos;
    }

    get _snakeLaddersConfig() {
        if (!this._cachedSnakeLaddersConfig) {
            this._cachedSnakeLaddersConfig = this._createSnakeLaddersState();
        }
        return this._cachedSnakeLaddersConfig;
    }

    checkSnakeLaddersWinner(positions) {
        for (let i = 0; i < positions.length; i++) {
            if (positions[i] === 100) {
                return i; // Return player index
            }
        }
        return null;
    }

  // --- UNIFIED GAME VALIDATION ---

  /**
   * Validate if a move is legal (uses rule engines)
   */
  validateMove(gameType, gameState, move) {
    const ruleEngine = this.getRuleEngine(gameType);
    
    if (ruleEngine) {
      try {
        return ruleEngine.validateMove(gameState, move);
      } catch (error) {
        console.error(`Validation error for ${gameType}:`, error);
        return false;
      }
    }
    
    // Fallback for games without rule engines (e.g., chess.js)
    if (gameType === GAME_TYPES.CHESS) {
      return true; // chess.js handles validation
    }
    
    return false;
  }

    _validateLudoMove(gameState, move) {
        const { tokenIndex, playerId, diceRoll } = move;
        const positions = gameState.positions[playerId];
        
        if (!positions || tokenIndex >= positions.length) {
            return false;
        }

        const currentPos = positions[tokenIndex];
        
        // Need 6 to start
        if (currentPos === 0 && diceRoll !== 6) {
            return false;
        }

        // Cannot exceed finish line
        const newPos = this.calculateLudoMove(currentPos, diceRoll, playerId);
        if (newPos > 57) {
            return false;
        }

        return true;
    }

    _validateTicTacToeMove(gameState, move) {
        const { position } = move;
        
        if (position < 0 || position > 8) {
            return false;
        }

        return gameState.board[position] === null;
    }

  /**
   * Check if game is over (uses rule engines)
   */
  isGameOver(gameType, gameState) {
    const ruleEngine = this.getRuleEngine(gameType);
    
    if (ruleEngine) {
      try {
        return ruleEngine.checkGameOver(gameState);
      } catch (error) {
        console.error(`Game over check error for ${gameType}:`, error);
        return false;
      }
    }
    
    // Fallback for chess
    if (gameType === GAME_TYPES.CHESS) {
      return false; // chess.js manages this
    }
    
    return false;
  }
  
  /**
   * Get game winner
   */
  getWinner(gameType, gameState) {
    const ruleEngine = this.getRuleEngine(gameType);
    return ruleEngine ? ruleEngine.getWinner(gameState) : null;
  }
}

// Singleton instance
export const gameService = new GameService();

