import { GAME_CONFIG, GAME_TYPES } from '../constants/gameConstants';

/**
 * Game Validators
 * 
 * Centralized validation logic for games (Single Responsibility)
 * Ensures input validation and game rule compliance
 */

/**
 * Validate game type
 */
export const validateGameType = (gameType) => {
  if (!gameType || typeof gameType !== 'string') {
    return { valid: false, error: 'Game type is required' };
  }
  
  const validTypes = Object.values(GAME_TYPES);
  if (!validTypes.includes(gameType)) {
    return { valid: false, error: `Invalid game type. Must be one of: ${validTypes.join(', ')}` };
  }
  
  return { valid: true };
};

/**
 * Validate number of players for a game
 */
export const validatePlayerCount = (gameType, playerCount) => {
  const typeValidation = validateGameType(gameType);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  const config = GAME_CONFIG[gameType];
  if (!config) {
    return { valid: false, error: 'Game configuration not found' };
  }
  
  if (playerCount < config.minPlayers) {
    return { 
      valid: false, 
      error: `Minimum ${config.minPlayers} players required for ${config.displayName}` 
    };
  }
  
  if (playerCount > config.maxPlayers) {
    return { 
      valid: false, 
      error: `Maximum ${config.maxPlayers} players allowed for ${config.displayName}` 
    };
  }
  
  return { valid: true };
};

/**
 * Validate move based on game type
 */
export const validateGameMove = (gameType, move) => {
  const typeValidation = validateGameType(gameType);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  if (!move || typeof move !== 'object') {
    return { valid: false, error: 'Move data is required' };
  }
  
  // Game-specific validation
  switch (gameType) {
    case GAME_TYPES.CHESS:
      return validateChessMove(move);
    case GAME_TYPES.LUDO:
      return validateLudoMove(move);
    case GAME_TYPES.SNAKE:
      return validateSnakeMove(move);
    case GAME_TYPES.TIC_TAC_TOE:
      return validateTicTacToeMove(move);
    default:
      return { valid: true }; // Default to valid
  }
};

/**
 * Validate chess move
 */
const validateChessMove = (move) => {
  if (!move.from || !move.to) {
    return { valid: false, error: 'Chess move requires from and to squares' };
  }
  
  // Basic format validation (e.g., "e2", "e4")
  const squarePattern = /^[a-h][1-8]$/;
  if (!squarePattern.test(move.from) || !squarePattern.test(move.to)) {
    return { valid: false, error: 'Invalid square notation' };
  }
  
  return { valid: true };
};

/**
 * Validate ludo move
 */
const validateLudoMove = (move) => {
  if (typeof move.tokenIndex !== 'number') {
    return { valid: false, error: 'Token index is required' };
  }
  
  if (move.tokenIndex < 0 || move.tokenIndex > 3) {
    return { valid: false, error: 'Invalid token index (0-3)' };
  }
  
  if (typeof move.diceRoll !== 'number') {
    return { valid: false, error: 'Dice roll is required' };
  }
  
  if (move.diceRoll < 1 || move.diceRoll > 6) {
    return { valid: false, error: 'Invalid dice roll (1-6)' };
  }
  
  return { valid: true };
};

/**
 * Validate snake & ladders move
 */
const validateSnakeMove = (move) => {
  if (typeof move.diceRoll !== 'number') {
    return { valid: false, error: 'Dice roll is required' };
  }
  
  if (move.diceRoll < 1 || move.diceRoll > 6) {
    return { valid: false, error: 'Invalid dice roll (1-6)' };
  }
  
  return { valid: true };
};

/**
 * Validate tic-tac-toe move
 */
const validateTicTacToeMove = (move) => {
  if (typeof move.position !== 'number') {
    return { valid: false, error: 'Position is required' };
  }
  
  if (move.position < 0 || move.position > 8) {
    return { valid: false, error: 'Invalid position (0-8)' };
  }
  
  return { valid: true };
};

/**
 * Validate game ID format
 */
export const validateGameId = (gameId) => {
  if (!gameId || typeof gameId !== 'string') {
    return { valid: false, error: 'Game ID is required' };
  }
  
  // Should match format from gameUtils.generateGameId()
  if (gameId.length < 10) {
    return { valid: false, error: 'Invalid game ID format' };
  }
  
  return { valid: true };
};

/**
 * Validate room ID format
 */
export const validateRoomId = (roomId) => {
  if (!roomId || typeof roomId !== 'string') {
    return { valid: false, error: 'Room ID is required' };
  }
  
  // Should match format from gameUtils.generateRoomId()
  if (roomId.length < 10) {
    return { valid: false, error: 'Invalid room ID format' };
  }
  
  return { valid: true };
};

/**
 * Validate game state structure
 */
export const validateGameState = (gameType, gameState) => {
  const typeValidation = validateGameType(gameType);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  if (!gameState || typeof gameState !== 'object') {
    return { valid: false, error: 'Game state is required' };
  }
  
  // Basic structure validation
  // Each game can have its own state requirements
  
  return { valid: true };
};

/**
 * Validate player data
 */
export const validatePlayer = (player) => {
  if (!player || typeof player !== 'object') {
    return { valid: false, error: 'Player data is required' };
  }
  
  if (!player.userId) {
    return { valid: false, error: 'Player userId is required' };
  }
  
  return { valid: true };
};

/**
 * Sanitize input string
 */
export const sanitizeInput = (input, maxLength = 100) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially harmful characters
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};
