import { useState, useCallback, useEffect, useRef } from 'react';
import { gameService } from '../../../services/GameService';

/**
 * useGameLogic - Reusable hook for common game logic
 * 
 * Eliminates code duplication across game components (DRY principle)
 * Provides common functionality: turn management, winner detection, state updates
 * 
 * @param {string} gameType - Type of game ('chess', 'ludo', 'snake', 'tictactoe')
 * @param {object} initialState - Initial game state
 * @param {object} config - Game configuration options
 */
const useGameLogic = (gameType, initialState = {}, config = {}) => {
  const {
    onGameEnd,
    onMove,
    onStateChange,
    autoAI = true,
    aiDelay = 1000,
  } = config;

  // Core state
  const [gameState, setGameState] = useState(initialState);
  const [turn, setTurn] = useState(0); // Current player turn index
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // AI processing flag
  const aiProcessingRef = useRef(false);

  /**
   * Update game state with optional callback
   */
  const updateState = useCallback((updates) => {
    setGameState(prev => {
      const newState = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      
      // Notify parent of state change
      if (onStateChange) {
        onStateChange(newState);
      }
      
      return newState;
    });
  }, [onStateChange]);

  /**
   * Validate if a move is legal
   */
  const validateMove = useCallback((move) => {
    try {
      return gameService.validateMove(gameType, gameState, move);
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [gameType, gameState]);

  /**
   * Make a move in the game
   */
  const makeMove = useCallback((move) => {
    if (loading || winner) return false;

    // Validate move
    if (!validateMove(move)) {
      setError('Invalid move');
      return false;
    }

    setError(null);
    
    // Notify parent
    if (onMove) {
      onMove(move, turn);
    }

    return true;
  }, [loading, winner, validateMove, onMove, turn]);

  /**
   * Change turn to next player
   */
  const nextTurn = useCallback((currentTurn = turn) => {
    const numPlayers = gameState.numPlayers || 2;
    const newTurn = (currentTurn + 1) % numPlayers;
    setTurn(newTurn);
    return newTurn;
  }, [turn, gameState.numPlayers]);

  /**
   * Check if game is over
   */
  const checkGameOver = useCallback(() => {
    try {
      const isOver = gameService.isGameOver(gameType, gameState);
      
      if (isOver) {
        // Determine winner based on game state
        let gameWinner = null;
        
        switch (gameType) {
          case 'tictactoe':
            gameWinner = gameState.winner;
            break;
          case 'ludo':
          case 'snake':
            // Find player who reached goal
            gameWinner = turn; // Simplified, should check actual game state
            break;
          default:
            gameWinner = null;
        }
        
        setWinner(gameWinner);
        
        if (onGameEnd) {
          onGameEnd({
            winner: gameWinner,
            gameState,
            timestamp: new Date().toISOString()
          });
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [gameType, gameState, turn, onGameEnd]);

  /**
   * Reset game to initial state
   */
  const resetGame = useCallback(() => {
    setGameState(initialState);
    setTurn(0);
    setWinner(null);
    setError(null);
    setLoading(false);
    aiProcessingRef.current = false;
  }, [initialState]);

  /**
   * Execute AI move (if applicable)
   */
  const executeAIMove = useCallback(() => {
    if (aiProcessingRef.current || !autoAI || winner) return;
    
    aiProcessingRef.current = true;
    setLoading(true);

    // Delay AI move for better UX
    setTimeout(() => {
      // This should be overridden by game-specific logic
      // or implement basic AI here
      setLoading(false);
      aiProcessingRef.current = false;
    }, aiDelay);
  }, [autoAI, winner, aiDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      aiProcessingRef.current = false;
    };
  }, []);

  return {
    // State
    gameState,
    turn,
    winner,
    loading,
    error,
    
    // Actions
    updateState,
    makeMove,
    validateMove,
    nextTurn,
    checkGameOver,
    resetGame,
    executeAIMove,
    
    // Utils
    setLoading,
    setError,
    setWinner,
  };
};

export default useGameLogic;
