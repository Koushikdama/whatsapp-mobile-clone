/**
 * ReplayEngine - Game replay and move notation system
 * 
 * Features:
 * - Move recording and playback
 * - State restoration
 * - Speed control
 * - Export to various formats
 */

class ReplayEngine {
  constructor(gameType, moveHistory = [], initialState = null) {
    this.gameType = gameType;
    this.moveHistory = moveHistory;
    this.initialState = initialState;
    this.currentMoveIndex = -1;
    this.isPlaying = false;
    this.playSpeed = 1; // 1x speed
    this.playInterval = null;
  }

  /**
   * Record a move
   */
  recordMove(move, stateBefore, stateAfter, playerId, notation) {
    const moveRecord = {
      moveNumber: this.moveHistory.length + 1,
      playerId,
      move,
      notation,
      timestamp: Date.now(),
      stateBefore: this._compressState(stateBefore),
      stateAfter: this._compressState(stateAfter),
    };

    this.moveHistory.push(moveRecord);
    this.currentMoveIndex = this.moveHistory.length - 1;

    return moveRecord;
  }

  /**
   * Go to specific move
   */
  goToMove(moveIndex) {
    if (moveIndex < -1 || moveIndex >= this.moveHistory.length) {
      return null;
    }

    this.currentMoveIndex = moveIndex;

    if (moveIndex === -1) {
      return this.initialState;
    }

    return this._decompressState(this.moveHistory[moveIndex].stateAfter);
  }

  /**
   * Step forward
   */
  stepForward() {
    if (this.currentMoveIndex < this.moveHistory.length - 1) {
      return this.goToMove(this.currentMoveIndex + 1);
    }
    return null;
  }

  /**
   * Step backward
   */
  stepBackward() {
    if (this.currentMoveIndex >= 0) {
      return this.goToMove(this.currentMoveIndex - 1);
    }
    return null;
  }

  /**
   * Go to start
   */
  goToStart() {
    return this.goToMove(-1);
  }

  /**
   * Go to end
   */
  goToEnd() {
    return this.goToMove(this.moveHistory.length - 1);
  }

  /**
   * Play replay
   */
  play(onStateChange, speed = 1) {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.playSpeed = speed;

    const interval = 1000 / speed; // Adjust interval based on speed

    this.playInterval = setInterval(() => {
      const state = this.stepForward();
      
      if (state) {
        onStateChange(state, this.currentMoveIndex);
      } else {
        this.pause();
      }
    }, interval);
  }

  /**
   * Pause replay
   */
  pause() {
    this.isPlaying = false;
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return this.goToMove(this.currentMoveIndex);
  }

  /**
   * Get move at index
   */
  getMove(index) {
    return this.moveHistory[index];
  }

  /**
   * Get all moves
   */
  getAllMoves() {
    return this.moveHistory;
  }

  /**
   * Export to notation
   */
  exportNotation(format = 'text') {
    switch (format) {
      case 'pgn': // Chess PGN format
        return this._exportPGN();
      
      case 'json':
        return JSON.stringify({
          gameType: this.gameType,
          moveHistory: this.moveHistory,
          initialState: this.initialState,
        }, null, 2);
      
      case 'text':
      default:
        return this.moveHistory
          .map(m => `${m.moveNumber}. ${m.notation}`)
          .join('\n');
    }
  }

  /**
   * Export to PGN (Chess)
   */
  _exportPGN() {
    if (this.gameType !== 'chess') {
      return 'PGN format only available for chess games';
    }

    let pgn = '[Event "Game"]\n';
    pgn += `[Date "${new Date().toISOString().split('T')[0]}"]\n`;
    pgn += '[White "Player 1"]\n';
    pgn += '[Black "Player 2"]\n\n';

    for (let i = 0; i < this.moveHistory.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = this.moveHistory[i]?.notation || '';
      const blackMove = this.moveHistory[i + 1]?.notation || '';
      
      pgn += `${moveNum}. ${whiteMove} ${blackMove}\n`;
    }

    return pgn;
  }

  /**
   * Compress state for storage
   */
  _compressState(state) {
    // Simple JSON stringify - could use LZ-string for better compression
    return state;
  }

  /**
   * Decompress state
   */
  _decompressState(state) {
    return state;
  }

  /**
   * Clear replay
   */
  clear() {
    this.pause();
    this.moveHistory = [];
    this.currentMoveIndex = -1;
  }

  /**
   * Get replay stats
   */
  getStats() {
    return {
      totalMoves: this.moveHistory.length,
      currentMove: this.currentMoveIndex + 1,
      isPlaying: this.isPlaying,
      playSpeed: this.playSpeed,
    };
  }
}

export default ReplayEngine;
