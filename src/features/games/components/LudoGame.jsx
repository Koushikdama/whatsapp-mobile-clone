import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import useGameLogic from '../hooks/useGameLogic';
import { gameService } from '../../../services/GameService';
import { GAME_TYPES, GAME_CONFIG, ANIMATION_DURATION } from '../../../shared/constants/gameConstants';
import ResponsiveGameContainer from '../../../shared/components/games/ResponsiveGameContainer';

/**
 * LudoGame - Refactored with useGameLogic hook
 * 
 * Features:
 * - Uses useGameLogic for turn management
 * - Configuration from GAME_CONFIG constants
 * - Improved AI with capture priority
 * - Safe zones and capture mechanics
 * - Responsive design
 * - Smooth animations
 */
const LudoGame = ({ onMove, onGameEnd, numPlayers = 2 }) => {
  const ludoConfig = GAME_CONFIG[GAME_TYPES.LUDO];
  
  const initialState = {
    positions: {
      red: [0, 0, 0, 0],
      green: [0, 0, 0, 0],
      blue: [0, 0, 0, 0],
      yellow: [0, 0, 0, 0],
    },
    numPlayers,
  };

  const {
    gameState,
    turn,
    winner,
    loading,
    updateState,
    makeMove,
    resetGame: resetLogic,
    setWinner,
  } = useGameLogic(GAME_TYPES.LUDO, initialState, {
    onGameEnd,
    onMove,
    autoAI: false,
  });

  const [dice, setDice] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  const playerColors = ludoConfig.colors.slice(0, numPlayers);
  const currentPlayer = playerColors[turn % numPlayers];

  /**
   * Roll dice
   */
  const rollDice = useCallback(() => {
    if (rolling || dice || winner) return;
    
    // Only player can roll in 2-player mode (turn 0)
    if (numPlayers === 2 && turn !== 0) return;
    
    setRolling(true);
    setTimeout(() => {
      const val = Math.floor(Math.random() * 6) + 1;
      setDice(val);
      setRolling(false);

      // Auto-pass if no move possible
      if (!canMoveAny(currentPlayer, val)) {
        setTimeout(() => changeTurn(val), 1000);
      } else if (turn === 1 && numPlayers === 2) {
        // AI turn
        setTimeout(() => makeAIMove(val), 1000);
      }
    }, ANIMATION_DURATION.DICE_ROLL);
  }, [rolling, dice, winner, turn, numPlayers, currentPlayer]);

  /**
   * Check if any token can move
   */
  const canMoveAny = useCallback((player, roll) => {
    const positions = gameState.positions[player];
    return positions.some(p => {
      if (p === 0) return roll === 6;
      return p + roll <= 57;
    });
  }, [gameState]);

  /**
   * Handle token click
   */
  const handleTokenClick = useCallback((tokenIndex) => {
    if (!dice || winner || turn !== 0) return;
    
    const move = {
      tokenIndex,
      diceRoll: dice,
      playerId: currentPlayer,
    };

    if (!makeMove(move)) return;

    moveToken(tokenIndex, dice);
  }, [dice, winner, turn, currentPlayer, makeMove]);

  /**
   * Move a token
   */
  const moveToken = useCallback((tokenIndex, roll) => {
    const positions = { ...gameState.positions };
    const currentPos = positions[currentPlayer][tokenIndex];

    // Calculate new position
    const ruleEngine = gameService.getRuleEngine(GAME_TYPES.LUDO);
    const newPos = ruleEngine.calculateNewPosition(currentPos, roll, currentPlayer);

    if (newPos === currentPos && roll !== 0 && currentPos !== 0) {
      return; // Invalid move
    }

    // Check for capture
    let captureHappened = false;
    playerColors.forEach(color => {
      if (color === currentPlayer) return;
      
      const capturedIndex = ruleEngine.checkCapture(newPos, positions[color]);
      if (capturedIndex !== null) {
        positions[color][capturedIndex] = 0;
        captureHappened = true;
      }
    });

    // Update position
    positions[currentPlayer][tokenIndex] = newPos;
    updateState({ positions });

    // Check win
    if (positions[currentPlayer].every(p => p === 57)) {
      setWinner(turn);
      if (onGameEnd) {
        onGameEnd({
          winner: turn,
          gameState: { positions },
          timestamp: new Date().toISOString(),
        });
      }
      return;
    }

    // Turn management
    if (roll !== 6 && !captureHappened) {
      changeTurn(roll);
    } else {
      setDice(null);
      if (turn === 1 && numPlayers === 2) {
        setTimeout(() => rollDice(), 1000);
      }
    }
  }, [gameState, currentPlayer, playerColors, updateState, setWinner, onGameEnd, turn, numPlayers, rollDice]);

  /**
   * AI Move Logic (improved with capture priority)
   */
  const makeAIMove = useCallback((roll) => {
    const aiColor = playerColors[1];
    const positions = gameState.positions[aiColor];

    // Find valid moves
    const validMoves = positions
      .map((p, i) => ({ index: i, pos: p }))
      .filter(({ pos }) => {
        if (pos === 0) return roll === 6;
        return pos + roll <= 57;
      });

    if (validMoves.length === 0) {
      changeTurn(roll);
      return;
    }

    // AI Priority:
    // 1. Capture opponent
    // 2. Move token that's furthest
    // 3. Exit home if on 6

    let bestMove = validMoves[0];
    let bestScore = -1;

    const ruleEngine = gameService.getRuleEngine(GAME_TYPES.LUDO);

    validMoves.forEach(({ index, pos }) => {
      const newPos = ruleEngine.calculateNewPosition(pos, roll, aiColor);
      let score = newPos; // Base score = progress

      // Check if this move captures
      playerColors.forEach(color => {
        if (color === aiColor) return;
        const capturedIndex = ruleEngine.checkCapture(newPos, gameState.positions[color]);
        if (capturedIndex !== null) {
          score += 100; // High priority for capture
        }
      });

      // Bonus for exiting home
      if (pos === 0 && roll === 6) {
        score += 10;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = { index, pos };
      }
    });

    moveToken(bestMove.index, roll);
  }, [gameState, playerColors, moveToken]);

  /**
   * Change turn
   */
  const changeTurn = useCallback((roll) => {
    setDice(null);
    setSelectedToken(null);
    
    const nextTurn = (turn + 1) % numPlayers;
    updateState({ turn: nextTurn });

    if (nextTurn === 1 && numPlayers === 2) {
      setTimeout(() => rollDice(), 1500);
    }
  }, [turn, numPlayers, updateState, rollDice]);

  /**
   * Reset game
   */
  const resetGame = useCallback(() => {
    resetLogic();
    setDice(null);
    setRolling(false);
    setSelectedToken(null);
  }, [resetLogic]);

  /**
   * Render simplified Ludo board
   */
  const renderBoard = () => {
    return (
      <div className="relative w-full aspect-square bg-white dark:bg-gray-800 grid grid-cols-11 grid-rows-11 shadow-2xl border-4 border-gray-800 rounded-lg overflow-hidden">
        {/* Red Base */}
        <div className="col-span-4 row-span-4 bg-red-500 border-r-4 border-b-4 border-black p-3 grid grid-cols-2 gap-2">
          {gameState.positions.red.map((p, i) => (
            <div key={`r-${i}`} className="bg-white rounded-full flex items-center justify-center shadow-inner relative">
              {p === 0 && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleTokenClick(i)}
                  className={`w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-600 ring-2 ring-black shadow-lg ${
                    turn === 0 && dice === 6 ? 'cursor-pointer animate-pulse' : 'cursor-not-allowed opacity-50'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Top Path - simplified */}
        <div className="col-span-3 row-span-4 bg-gray-100 dark:bg-gray-700" />

        {/* Green Base */}
        <div className="col-span-4 row-span-4 bg-green-500 border-l-4 border-b-4 border-black p-3 grid grid-cols-2 gap-2">
          {gameState.positions.green.map((p, i) => (
            <div key={`g-${i}`} className="bg-white rounded-full flex items-center justify-center shadow-inner">
              {p === 0 && (
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-600 ring-2 ring-black shadow-lg" />
              )}
            </div>
          ))}
        </div>

        {/* Left Path */}
        <div className="col-span-4 row-span-3 bg-gray-100 dark:bg-gray-700" />

        {/* Center Home */}
        <div className="col-span-3 row-span-3 bg-gradient-to-br from-yellow-100 to-blue-100 dark:from-yellow-900 dark:to-blue-900 flex flex-col items-center justify-center border-4 border-black/20">
          <div className="text-xs font-bold text-gray-600 dark:text-gray-300">HOME</div>
          <div className="flex gap-1 mt-1 flex-wrap justify-center">
            {gameState.positions.red.map((p, i) => p === 57 && <div key={`rf-${i}`} className="w-2 h-2 bg-red-500 rounded-full border border-white" />)}
            {gameState.positions.green.map((p, i) => p === 57 && <div key={`gf-${i}`} className="w-2 h-2 bg-green-500 rounded-full border border-white" />)}
          </div>
        </div>

        {/* Right Path */}
        <div className="col-span-4 row-span-3 bg-gray-100 dark:bg-gray-700" />

        {/* Blue Base (disabled if only 2 players) */}
        <div className={`col-span-4 row-span-4 bg-blue-500 border-r-4 border-t-4 border-black ${numPlayers < 3 ? 'opacity-30' : ''}`} />

        {/* Bottom Path */}
        <div className="col-span-3 row-span-4 bg-gray-100 dark:bg-gray-700" />

        {/* Yellow Base (disabled if only 2 players) */}
        <div className={`col-span-4 row-span-4 bg-yellow-400 border-l-4 border-t-4 border-black ${numPlayers < 4 ? 'opacity-30' : ''}`} />

        {/* Active tokens on path */}
        {playerColors.map(color => (
          gameState.positions[color].map((pos, idx) => {
            if (pos > 0 && pos < 57) {
              return (
                <motion.div
                  key={`${color}-token-${idx}-${pos}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute w-4 h-4 rounded-full bg-${color}-500 border-2 border-white shadow-lg`}
                  style={{
                    left: `${(pos % 11) * 9}%`,
                    top: `${Math.floor(pos / 11) * 9}%`,
                  }}
                />
              );
            }
            return null;
          })
        ))}
      </div>
    );
  };

  return (
    <ResponsiveGameContainer minHeight="500px" maxWidth="600px">
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between w-full max-w-[350px]">
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Ludo King
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {winner !== null ? `${playerColors[winner]} wins!` : `${currentPlayer}'s turn`}
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

        {/* Board */}
        <div className="w-full max-w-[350px]">
          {renderBoard()}
        </div>

        {/* Controls */}
        <div className="flex justify-between w-full max-w-[350px] items-center px-4">
          {/* Red Player */}
          <div className={`flex flex-col items-center gap-2 transition-all ${turn === 0 ? 'scale-110 opacity-100' : 'opacity-60'}`}>
            <div className="font-bold text-red-600">YOU</div>
            <div className="flex gap-1">
              {gameState.positions.red.map((p, i) => (
                p > 0 && p < 57 && (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleTokenClick(i)}
                    className={`w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[8px] text-white font-bold ${
                      turn === 0 && dice ? 'cursor-pointer hover:bg-red-400' : 'cursor-not-allowed'
                    }`}
                  >
                    {p}
                  </motion.div>
                )
              ))}
            </div>
          </div>

          {/* Dice */}
          <button
            onClick={rollDice}
            disabled={turn !== 0 || rolling || dice || winner}
            className={`
              w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-xl transition-all active:scale-95 border-2
              ${turn === 0 && !dice && !winner ? 'bg-wa-teal hover:bg-teal-600 text-white cursor-pointer border-teal-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 border-gray-300 cursor-not-allowed'}
              ${rolling ? 'animate-spin' : ''}
            `}
          >
            {dice || '🎲'}
          </button>

          {/* Green Player (AI) */}
          <div className={`flex flex-col items-center gap-2 transition-all ${turn === 1 ? 'scale-110 opacity-100' : 'opacity-60'}`}>
            <div className="font-bold text-green-600">AI</div>
            <div className="flex gap-1">
              {gameState.positions.green.map((p, i) => (
                p > 0 && p < 57 && (
                  <div
                    key={i}
                    className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[8px] text-white font-bold"
                  >
                    {p}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Winner Banner */}
        {winner !== null && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="text-2xl font-bold text-yellow-500 animate-bounce">
              🏆 {playerColors[winner].toUpperCase()} Wins! 🏆
            </div>
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-wa-teal hover:bg-teal-600 text-white rounded-full font-bold shadow-lg transition-all active:scale-95"
            >
              Play Again
            </button>
          </motion.div>
        )}

        {/* Rules */}
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 max-w-[300px]">
          <p>🎲 Roll 6 to start • Capture opponents • Safe zones protect you • Reach home to win!</p>
        </div>
      </div>
    </ResponsiveGameContainer>
  );
};

export default LudoGame;