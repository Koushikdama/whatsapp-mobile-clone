import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import ReplayEngine from '../../../services/ReplayEngine';
import MoveHistoryPanel from './MoveHistoryPanel';

/**
 * GameReplayViewer - Complete replay interface with controls
 * 
 * Features:
 * - Playback controls (play/pause/step)
 * - Speed adjustment
 * - Progress bar
 * - Move history panel
 * - Export functionality
 */
const GameReplayViewer = ({ 
  gameType, 
  moveHistory = [], 
  initialState, 
  onClose,
  onStateChange 
}) => {
  const [replayEngine] = useState(() => new ReplayEngine(gameType, moveHistory, initialState));
  const [currentMove, setCurrentMove] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);

  const speeds = [0.5, 1, 1.5, 2];

  /**
   * Handle state change
   */
  const handleStateChange = (state, moveIndex) => {
    setCurrentMove(moveIndex);
    if (onStateChange) {
      onStateChange(state);
    }
  };

  /**
   * Play/Pause
   */
  const togglePlay = () => {
    if (isPlaying) {
      replayEngine.pause();
      setIsPlaying(false);
    } else {
      replayEngine.play(handleStateChange, playSpeed);
      setIsPlaying(true);
    }
  };

  /**
   * Step controls
   */
  const stepForward = () => {
    const state = replayEngine.stepForward();
    if (state) {
      handleStateChange(state, replayEngine.currentMoveIndex);
    }
  };

  const stepBackward = () => {
    const state = replayEngine.stepBackward();
    if (state) {
      handleStateChange(state, replayEngine.currentMoveIndex);
    }
  };

  const goToStart = () => {
    replayEngine.pause();
    setIsPlaying(false);
    const state = replayEngine.goToStart();
    handleStateChange(state, -1);
  };

  const goToEnd = () => {
    replayEngine.pause();
    setIsPlaying(false);
    const state = replayEngine.goToEnd();
    handleStateChange(state, replayEngine.moveHistory.length - 1);
  };

  /**
   * Jump to move
   */
  const jumpToMove = (moveIndex) => {
    replayEngine.pause();
    setIsPlaying(false);
    const state = replayEngine.goToMove(moveIndex);
    if (state) {
      handleStateChange(state, moveIndex);
    }
  };

  /**
   * Change speed
   */
  const cycleSpeed = () => {
    const currentIndex = speeds.indexOf(playSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaySpeed(newSpeed);
    
    if (isPlaying) {
      replayEngine.pause();
      replayEngine.play(handleStateChange, newSpeed);
    }
  };

  /**
   * Export
   */
  const handleExport = (format) => {
    const notation = replayEngine.exportNotation(format);
    
    // Download file
    const blob = new Blob([notation], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-replay-${Date.now()}.${format === 'pgn' ? 'pgn' : format === 'json' ? 'json' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Cleanup
   */
  useEffect(() => {
    return () => {
      replayEngine.pause();
    };
  }, [replayEngine]);

  const progress = moveHistory.length > 0 
    ? ((currentMove + 1) / moveHistory.length) * 100 
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Game Replay
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex gap-4 p-4">
          {/* Game Display Area */}
          <div className="flex-1">
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              Game board would render here
            </div>
          </div>

          {/* Move History */}
          <MoveHistoryPanel
            moves={moveHistory}
            currentMoveIndex={currentMove}
            onMoveClick={jumpToMove}
            onExport={handleExport}
            gameType={gameType}
          />
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Move {currentMove + 1} / {moveHistory.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-wa-teal transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={goToStart}
              disabled={currentMove === -1}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Go to start"
            >
              <ChevronsLeft size={20} className="text-gray-700 dark:text-gray-300" />
            </button>

            <button
              onClick={stepBackward}
              disabled={currentMove === -1}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous move"
            >
              <SkipBack size={20} className="text-gray-700 dark:text-gray-300" />
            </button>

            <button
              onClick={togglePlay}
              disabled={moveHistory.length === 0}
              className="p-3 bg-wa-teal hover:bg-teal-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button
              onClick={stepForward}
              disabled={currentMove >= moveHistory.length - 1}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next move"
            >
              <SkipForward size={20} className="text-gray-700 dark:text-gray-300" />
            </button>

            <button
              onClick={goToEnd}
              disabled={currentMove >= moveHistory.length - 1}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Go to end"
            >
              <ChevronsRight size={20} className="text-gray-700 dark:text-gray-300" />
            </button>

            <div className="ml-4 border-l border-gray-300 dark:border-gray-600 pl-4">
              <button
                onClick={cycleSpeed}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
              >
                {playSpeed}x
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GameReplayViewer;
