import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import{ RotateCcw } from 'lucide-react';
import useGameLogic from '../hooks/useGameLogic';
import { gameService } from '../../../services/GameService';
import { GAME_TYPES, GAME_CONFIG, ANIMATION_DURATION } from '../../../shared/constants/gameConstants';
import ResponsiveGameContainer from '../../../shared/components/games/ResponsiveGameContainer';

/**
 * SnakeLaddersGame - Refactored with useGameLogic hook
 * 
 * Improvements:
 * - Uses useGameLogic for turn management and state
 * - Snakes and ladders configuration from constants
 * - Improved animations and visual feedback
 * - Responsive design
 */
const SnakeLaddersGame = ({ onMove, onGameEnd, numPlayers = 2 }) => {
  const snakeConfig = GAME_CONFIG[GAME_TYPES.SNAKE];
  
  const initialState = {
    positions: new Array(numPlayers).fill(0),
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
  } = useGameLogic(GAME_TYPES.SNAKE, initialState, {
    onGameEnd,
    onMove,
    autoAI: false,
  });

  const [dice, setDice] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState('Roll the dice to start!');
  const [animatingSquare, setAnimatingSquare] = useState(null);

  const playerColors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500'];
  const playerNames = ['You', 'AI', 'Player 3', 'Player 4'];

  /**
   * Handle dice roll
   */
  const handleRoll = useCallback(() => {
    if (rolling || winner || (turn !== 0 && numPlayers === 2)) return;
    performTurn();
  }, [rolling, winner, turn, numPlayers]);

  /**
   * Perform a turn (dice roll + move)
   */
  const performTurn = useCallback(() => {
    setRolling(true);
    setMessage('Rolling...');

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDice(roll);
      setRolling(false);

      movePlayer(roll);
    }, ANIMATION_DURATION.DICE_ROLL);
  }, []);

  /**
   * Move player based on dice roll
   */
  const movePlayer = useCallback((roll) => {
    const currentPos = gameState.positions[turn];
    let newPos = currentPos + roll;

    // Can't exceed 100
    if (newPos > 100) {
      setMessage(`Need ${100 - currentPos} to win! Try again.`);
      changeTurn(roll);
      return;
    }

    setAnimatingSquare(newPos);

    // Apply snakes and ladders
    setTimeout(() => {
      const finalPos = gameService.getRuleEngine(GAME_TYPES.SNAKE).calculateNewPosition(currentPos, roll);
      
      const newPositions = [...gameState.positions];
      newPositions[turn] = finalPos;
      updateState({ positions: newPositions });

      // Update message
      if (finalPos < newPos) {
        setMessage(`🐍 Snake! Down to ${finalPos}`);
      } else if (finalPos > newPos) {
        setMessage(`🪜 Ladder! Up to ${finalPos}`);
      } else {
        setMessage(`Moved to ${finalPos}`);
      }

      // Check winner
      if (finalPos === 100) {
        setWinner(turn);
        setMessage(`🎉 ${playerNames[turn]} Wins!`);
        
        if (onGameEnd) {
          onGameEnd({
            winner: turn,
            gameState: { ...gameState, positions: newPositions },
            timestamp: new Date().toISOString(),
          });
        }
        return;
      }

      // Change turn after animation
      setTimeout(() => {
        setAnimatingSquare(null);
        changeTurn(roll);
      }, ANIMATION_DURATION.SLOW);
    }, ANIMATION_DURATION.NORMAL);
  }, [gameState, turn, updateState, setWinner, onGameEnd, playerNames]);

  /**
   * Change to next player's turn
   */
  const changeTurn = useCallback((roll) => {
    // Roll 6 = go again
    if (roll === 6 && winner === null) {
      setMessage(`Rolled 6! ${playerNames[turn]} rolls again!`);
      setDice(null);
      
      if (turn === 1) {
        // AI rolls again
        setTimeout(() => performTurn(), 1500);
      }
      return;
    }

    // Next player
    const nextTurn = (turn + 1) % numPlayers;
    updateState({ turn: nextTurn });
    setDice(null);
    
    if (nextTurn === 1 && numPlayers === 2) {
      // AI turn in 2-player mode
      setMessage("AI's turn...");
      setTimeout(() => performTurn(), 1500);
    } else {
      setMessage(`${playerNames[nextTurn]}'s turn!`);
    }
  }, [turn, winner, numPlayers, playerNames, performTurn, updateState]);

  /**
   * Reset game
   */
  const resetGame = useCallback(() => {
    resetLogic();
    setDice(null);
    setRolling(false);
    setMessage('Roll the dice to start!');
    setAnimatingSquare(null);
  }, [resetLogic]);

  /**
   * Render game board
   */
  const renderBoard = () => {
    const cells = [];
    
    for (let row = 9; row >= 0; row--) {
      for (let col = 0; col < 10; col++) {
        let cellNum = 0;
        if (row % 2 === 0) {
          cellNum = (row * 10) + col + 1;
        } else {
          cellNum = (row * 10) + (10 - col);
        }

        const isSnakeHead = snakeConfig.snakes[cellNum];
        const isLadderBase = snakeConfig.ladders[cellNum];
        const playersHere = gameState.positions
          .map((pos, idx) => (pos === cellNum ? idx : null))
          .filter(idx => idx !== null);
        const isAnimating = animatingSquare === cellNum;

        cells.push(
          <motion.div 
            key={cellNum}
            animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`
              relative border border-gray-300 dark:border-gray-700 
              flex items-center justify-center text-[10px] font-bold
              ${isSnakeHead ? 'bg-red-100 dark:bg-red-900/30' : ''}
              ${isLadderBase ? 'bg-green-100 dark:bg-green-900/30' : ''}
              ${isAnimating ? 'ring-2 ring-yellow-400' : ''}
              transition-all duration-300
            `}
          >
            <span className="absolute top-0.5 left-0.5 text-gray-400 dark:text-gray-600 z-0">
              {cellNum}
            </span>
            
            {isSnakeHead && <div className="text-lg z-10">🐍</div>}
            {isLadderBase && <div className="text-lg z-10">🪜</div>}

            {playersHere.length > 0 && (
              <div className="absolute bottom-1 flex gap-0.5 z-20">
                {playersHere.map((playerIdx) => (
                  <motion.div
                    key={playerIdx}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-3 h-3 rounded-full ${playerColors[playerIdx]} shadow border border-white`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        );
      }
    }
    
    return cells;
  };

  return (
    <ResponsiveGameContainer minHeight="600px" maxWidth="600px">
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between w-full max-w-[350px]">
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Snake & Ladders
            </h3>
            <p className="text-sm text-wa-teal dark:text-wa-teal font-medium">
              {message}
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
        <div className="w-full max-w-[350px] aspect-square bg-white dark:bg-[#1a2c38] grid grid-cols-10 grid-rows-10 shadow-2xl border-4 border-gray-400 dark:border-gray-700 rounded-lg overflow-hidden">
          {renderBoard()}
        </div>

        {/* Controls */}
        <div className="flex justify-between w-full max-w-[350px] items-center px-4">
          {/* Players */}
          {Array.from({ length: numPlayers }).map((_, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center transition-all ${
                turn === idx ? 'opacity-100 scale-110' : 'opacity-50 scale-100'
              }`}
            >
              <div className={`w-10 h-10 ${playerColors[idx]} rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-lg`}>
                {playerNames[idx][0]}
              </div>
              <span className="text-xs mt-1 font-medium text-gray-700 dark:text-gray-300">
                {gameState.positions[idx]}/100
              </span>
            </div>
          ))}

          {/* Dice (center for 2 players) */}
          {numPlayers === 2 && (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleRoll}
                disabled={turn !== 0 || rolling || winner !== null}
                className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-xl transition-all active:scale-95 border-2
                  ${turn === 0 && !winner ? 'bg-wa-teal hover:bg-teal-600 text-white cursor-pointer border-teal-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 border-gray-300 cursor-not-allowed'}
                  ${rolling ? 'animate-bounce' : ''}
                `}
              >
                {dice || '🎲'}
              </button>
            </div>
          )}
        </div>

        {/* Winner Banner */}
        {winner !== null && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="text-2xl font-bold text-yellow-500 animate-bounce flex items-center gap-2">
              🏆 {playerNames[winner]} Wins! 🏆
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
          <p>🎲 Roll 6 to get another turn • 🐍 Beware of snakes • 🪜 Climb the ladders • Reach exactly 100 to win!</p>
        </div>
      </div>
    </ResponsiveGameContainer>
  );
};

export default SnakeLaddersGame;