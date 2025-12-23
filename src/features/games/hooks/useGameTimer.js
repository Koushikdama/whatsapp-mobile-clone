import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for Chess timer logic (Single Responsibility Principle)
 * Handles countdown timers for both players
 * Separated from chess game logic and UI rendering
 */
const useGameTimer = (defaultTimeControl = 600, activeGame, turn) => {
    const [whiteTime, setWhiteTime] = useState(defaultTimeControl);
    const [blackTime, setBlackTime] = useState(defaultTimeControl);
    const [timerActive, setTimerActive] = useState(false);
    const [timeExpired, setTimeExpired] = useState(null);

    // Sync timer from activeGame if available (multiplayer sync)
    useEffect(() => {
        if (activeGame?.gameState?.whiteTime !== undefined) {
            setWhiteTime(activeGame.gameState.whiteTime);
        }
        if (activeGame?.gameState?.blackTime !== undefined) {
            setBlackTime(activeGame.gameState.blackTime);
        }
        if (activeGame?.gameState?.timerActive !== undefined) {
            setTimerActive(activeGame.gameState.timerActive);
        }
    }, [activeGame?.gameState]);

    // Timer countdown effect
    useEffect(() => {
        if (!timerActive || timeExpired) return;

        const interval = setInterval(() => {
            if (turn === 'w') {
                setWhiteTime(prev => {
                    if (prev <= 1) {
                        setTimeExpired('w');
                        setTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            } else {
                setBlackTime(prev => {
                    if (prev <= 1) {
                        setTimeExpired('b');
                        setTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timerActive, turn, timeExpired]);

    /**
     * Start the timer (called on first move)
     */
    const startTimer = useCallback(() => {
        setTimerActive(true);
    }, []);

    /**
     * Reset timer to initial state
     */
    const resetTimer = useCallback((timeControl = defaultTimeControl) => {
        setWhiteTime(timeControl);
        setBlackTime(timeControl);
        setTimerActive(false);
        setTimeExpired(null);
    }, [defaultTimeControl]);

    /**
     * Format time as MM:SS
     */
    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return {
        whiteTime,
        blackTime,
        timerActive,
        timeExpired,
        startTimer,
        resetTimer,
        formatTime
    };
};

export default useGameTimer;
