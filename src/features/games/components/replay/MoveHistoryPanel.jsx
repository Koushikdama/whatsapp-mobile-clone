import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import ReplayEngine from '../../../services/ReplayEngine';

/**
 * MoveHistoryPanel - Display move-by-move game history
 * 
 * Features:
 * - Scrollable move list
 * - Click to jump to position
 * - Export functionality
 * - Current move highlighting
 */
const MoveHistoryPanel = ({ 
  moves = [], 
  currentMoveIndex = -1, 
  onMoveClick, 
  onExport,
  gameType 
}) => {
  /**
   * Export moves
   */
  const handleExport = (format) => {
    if (onExport) {
      onExport(format);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          Move History
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {moves.length} moves
        </span>
      </div>

      {/* Move List */}
      <div className="flex-1 overflow-y-auto space-y-1 mb-3">
        {moves.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm">
            No moves yet
          </div>
        ) : (
          <AnimatePresence>
            {moves.map((move, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => onMoveClick && onMoveClick(index)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                  ${index === currentMoveIndex
                    ? 'bg-wa-teal text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono">
                    {move.moveNumber}. {move.notation}
                  </span>
                  {index === currentMoveIndex && (
                    <span className="text-xs">◀</span>
                  )}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Export Buttons */}
      {moves.length > 0 && (
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleExport('text')}
            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Export TXT
          </button>
          {gameType === 'chess' && (
            <button
              onClick={() => handleExport('pgn')}
              className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Export PGN
            </button>
          )}
          <button
            onClick={() => handleExport('json')}
            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            JSON
          </button>
        </div>
      )}
    </div>
  );
};

export default MoveHistoryPanel;
