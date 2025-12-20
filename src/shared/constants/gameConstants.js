/**
 * Game Constants
 * 
 * Centralized configuration for all games following DRY principle
 */

// Game Types
export const GAME_TYPES = {
  CHESS: 'chess',
  LUDO: 'ludo',
  SNAKE: 'snake',
  TIC_TAC_TOE: 'tictactoe',
};

// Game Status
export const GAME_STATUS = {
  PENDING: 'pending',
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
};

// Player Status
export const PLAYER_STATUS = {
  WAITING: 'waiting',
  READY: 'ready',
  PLAYING: 'playing',
  LEFT: 'left',
  FINISHED: 'finished',
};

// Game Configuration
export const GAME_CONFIG = {
  [GAME_TYPES.CHESS]: {
    minPlayers: 2,
    maxPlayers: 2,
    defaultTimeControl: 600, // 10 minutes
    colors: ['white', 'black'],
    icon: '♟️',
    displayName: 'Chess Master',
    color: 'indigo',
  },
  [GAME_TYPES.LUDO]: {
    minPlayers: 2,
    maxPlayers: 4,
    colors: ['red', 'green', 'blue', 'yellow'],
    icon: '🎲',
    displayName: 'Ludo King',
    color: 'red',
    boardSize: 15, // 15x15 grid
    tokensPerPlayer: 4,
    safeZones: [0, 1, 9, 14, 22, 27, 35, 40, 48],
  },
  [GAME_TYPES.SNAKE]: {
    minPlayers: 2,
    maxPlayers: 4,
    colors: ['blue', 'red', 'green', 'yellow'],
    icon: '🪜',
    displayName: 'Snake & Ladders',
    color: 'green',
    boardSize: 100,
    snakes: {
      99: 78, 95: 75, 92: 88, 89: 68, 74: 53,
      64: 60, 62: 19, 49: 11, 46: 25, 16: 6
    },
    ladders: {
      2: 38, 7: 14, 8: 31, 15: 26, 21: 42,
      28: 84, 36: 44, 51: 67, 71: 91, 78: 98
    },
  },
  [GAME_TYPES.TIC_TAC_TOE]: {
    minPlayers: 2,
    maxPlayers: 2,
    colors: ['X', 'O'],
    icon: '❌',
    displayName: 'Tic-Tac-Toe',
    color: 'blue',
    boardSize: 3,
  },
};

// Responsive Breakpoints for Games
export const GAME_BREAKPOINTS = {
  MOBILE_SMALL: 360,
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  DESKTOP_LARGE: 1440,
};

// Game Board Dimensions (responsive)
export const GAME_DIMENSIONS = {
  MOBILE: {
    width: '95vw',
    maxWidth: 400,
    height: '70vh',
    maxHeight: 650,
  },
  TABLET: {
    width: '70vw',
    maxWidth: 550,
    height: '65vh',
    maxHeight: 700,
  },
  DESKTOP: {
    width: 500,
    maxWidth: 600,
    height: 750,
    maxHeight: 800,
  },
};

// Animation Durations (ms)
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  DICE_ROLL: 600,
  MOVE: 400,
  WIN: 1000,
};

// Color Themes
export const GAME_COLOR_THEMES = {
  chess: {
    primary: '#4F46E5',
    secondary: '#818CF8',
    lightSquare: '#EEEED2',
    darkSquare: '#769656',
  },
  ludo: {
    primary: '#DC2626',
    secondary: '#EF4444',
    red: '#DC2626',
    green: '#16A34A',
    blue: '#2563EB',
    yellow: '#EAB308',
  },
  snake: {
    primary: '#16A34A',
    secondary: '#22C55E',
    snake: '#DC2626',
    ladder: '#16A34A',
  },
  tictactoe: {
    primary: '#2563EB',
    secondary: '#3B82F6',
    x: '#DC2626',
    o: '#2563EB',
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_MOVE: 'Invalid move. Please try again.',
  GAME_NOT_FOUND: 'Game not found.',
  ROOM_FULL: 'Game room is full.',
  NOT_YOUR_TURN: "It's not your turn.",
  GAME_ENDED: 'This game has ended.',
  CONNECTION_ERROR: 'Connection error. Please try again.',
  PLAYER_LEFT: 'A player has left the game.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  GAME_CREATED: 'Game created successfully!',
  INVITE_SENT: 'Game invitation sent!',
  JOINED_GAME: 'You joined the game!',
  MOVE_MADE: 'Move executed successfully.',
};

// Touch Target Minimum Size (for accessibility)
export const MIN_TOUCH_TARGET = 44; // pixels
