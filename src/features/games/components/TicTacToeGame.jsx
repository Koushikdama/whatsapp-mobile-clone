import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Trophy } from 'lucide-react';
import useGameLogic from '../hooks/useGameLogic';
import { gameService } from '../../../services/GameService';
import { GAME_TYPES, ANIMATION_DURATION } from '../../../shared/constants/gameConstants';
import ResponsiveGameContainer from '../../../shared/components/games/ResponsiveGameContainer';

/**
 * TicTacToeGame - Refactored with useGameLogic hook
 * 
 * Improvements:
 * - Uses useGameLogic for common game logic (DRY)
 * - Responsive container for all screen sizes
 * - AI difficulty levels
 * - Clean separation of concerns
 */
const TicTacToeGame = ({ onMove, onGameEnd, aiEnabled = true, aiDifficulty = 'medium' }) => {
  const initialState = {
    board: Array(9).fill(null),
    isXNext: true,
    winner: null,
    winningLine: null,
    numPlayers: 2,
  };

  const {
    gameState,
    turn,
    winner,
    loading,
    error,
    updateState,
    makeMove,
    checkGameOver,
    resetGame,
    setWinner,
  } = useGameLogic(GAME_TYPES.TIC_TAC_TOE, initialState, {
    onGameEnd,
    onMove,
    autoAI: false, // We'll handle AI manually for better control
  });

  const [hoveredSquare, setHoveredSquare] = useState(null);

  /**
   * Handle square click
   */
  const handleSquareClick = useCallback((index) => {
    if (loading || winner || gameState.board[index] !== null) return;
    
    // Validate move
    const move = { position: index, player: gameState.isXNext ? 'X' : 'O' };
    if (!makeMove(move)) return;

    // Update board
    const newBoard = [...gameState.board];
    newBoard[index] = gameState.isXNext ? 'X' : 'O';
    
    updateState({
      board: newBoard,
      isXNext: !gameState.isXNext,
    });

    // Check for winner
    const result = gameService.ruleEngines[GAME_TYPES.TIC_TAC_TOE].checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      updateState({ winner: result.winner, winningLine: result.line });
      
      if (onGameEnd) {
        onGameEnd({
          winner: result.winner,
          gameState: { ...gameState, board: newBoard, winner: result.winner },
          timestamp: new Date().toISOString(),
        });
      }
    } else if (!newBoard.includes(null)) {
      // Draw
      setWinner('draw');
      updateState({ winner: 'draw' });
      
      if (onGameEnd) {
        onGameEnd({
          winner: null,
          isDraw: true,
          gameState: { ...gameState, board: newBoard },
          timestamp: new Date().toISOString(),
        });
      }
    } else if (aiEnabled && !gameState.isXNext) {
      // AI's turn (O)
      setTimeout(() => makeAIMove(newBoard), 500);
    }
  }, [gameState, loading, winner, makeMove, updateState, setWinner, onGameEnd, aiEnabled]);

  /**
   * AI Move Logic
   */
  const makeAIMove = useCallback((currentBoard) => {
    let bestMove = -1;

    if (aiDifficulty === 'easy') {
      // Random move
      const emptySquares = currentBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter(val => val !== null);
      bestMove = emptySquares[Math.floor(Math.random() * emptySquares.length)];
    } else if (aiDifficulty === 'medium') {
      // Block player or win if possible
      bestMove = findBestMove(currentBoard, 'O') || findBestMove(currentBoard, 'X') || 
                 findRandomMove(currentBoard);
    } else {
      // Hard: Minimax algorithm
      bestMove = findMinimaxMove(currentBoard);
    }

    if (bestMove !== -1) {
      handleSquareClick(bestMove);
    }
  }, [aiDifficulty, handleSquareClick]);

  /**
   * Find winning move for a player
   */
  const findBestMove = (board, player) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (board[a] === player && board[b] === player && board[c] === null) return c;
      if (board[a] === player && board[c] === player && board[b] === null) return b;
      if (board[b] === player && board[c] === player && board[a] === null) return a;
    }
    return null;
  };

  /**
   * Find random empty square
   */
  const findRandomMove = (board) => {
    const emptySquares = board
      .map((val, idx) => (val === null ? idx : null))
      .filter(val => val !== null);
    return emptySquares[Math.floor(Math.random() * emptySquares.length)] || -1;
  };

  /**
   * Minimax algorithm for hard difficulty
   */
  const findMinimaxMove = (board) => {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const score = minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const minimax = (board, depth, isMaximizing) => {
    const result = gameService.ruleEngines[GAME_TYPES.TIC_TAC_TOE].checkWinner(board);
    
    if (result) {
      return result.winner === 'O' ? 10 - depth : depth - 10;
    }
    if (!board.includes(null)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          bestScore = Math.max(bestScore, minimax(board, depth + 1, false));
          board[i] = null;
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          bestScore = Math.min(bestScore, minimax(board, depth + 1, true));
          board[i] = null;
        }
      }
      return bestScore;
    }
  };

  /**
   * Render game board
   */
  const renderBoard = () => {
    return (
      <div className="grid grid-cols-3 gap-2 md:gap-3 w-full max-w-[350px] mx-auto">
        {gameState.board.map((value, index) => {
          const isWinningSquare = gameState.winningLine?.includes(index);
          const isHovered = hoveredSquare === index && !value && !winner;

          return (
            <motion.button
              key={index}
              onClick={() => handleSquareClick(index)}
              onMouseEnter={() => setHoveredSquare(index)}
              onMouseLeave={() => setHoveredSquare(null)}
              disabled={loading || winner || value !== null}
              whileHover={!value && !winner ? { scale: 1.05 } : {}}
              whileTap={!value && !winner ? { scale: 0.95 } : {}}
              className={`
                aspect-square rounded-xl flex items-center justify-center text-5xl md:text-6xl font-bold
                transition-all duration-200 shadow-md
                ${isWinningSquare 
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white ring-4 ring-yellow-300' 
                  : value === 'X'
                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
                    : value === 'O'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                ${isHovered ? 'ring-2 ring-wa-teal' : ''}
                ${!value && !winner ? 'cursor-pointer' : 'cursor-not-allowed'}
              `}
              style={{ minHeight: '80px', minWidth: '80px' }}
            >
              {value && (
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  {value}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  return (
    <ResponsiveGameContainer minHeight="500px" maxWidth="500px">
      <div className="flex flex-col items-center gap-4 md:gap-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between w-full max-w-[350px]">
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Tic-Tac-Toe
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {winner 
                ? winner === 'draw' ? "It's a draw!" : `${winner} wins!`
                : `${gameState.isXNext ? 'X' : 'O'}'s turn`
              }
            </p>
          </div>
          
          <button
            onClick={resetGame}
            className="p-2 md:p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            title="Reset Game"
          >
            <RotateCcw size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Game Board */}
        {renderBoard()}

        {/* Winner Banner */}
        {winner && winner !== 'draw' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full shadow-lg"
          >
            <Trophy size={24} />
            <span className="font-bold text-lg">{winner} Wins!</span>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        {/* Game Info */}
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 max-w-[300px]">
          {aiEnabled ? `Playing against AI (${aiDifficulty} difficulty)` : 'Two player game'}
        </div>
      </div>
    </ResponsiveGameContainer>
  );
};

export default TicTacToeGame;
