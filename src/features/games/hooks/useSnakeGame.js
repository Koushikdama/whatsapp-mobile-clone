import { useState, useCallback } from 'react';

// Default configuration if none provided
const DEFAULT_CONFIG = {
    snakes: { "16": 6, "47": 26, "49": 11, "56": 53, "62": 19, "64": 60, "87": 24, "93": 73, "95": 75, "98": 78 },
    ladders: { "1": 38, "4": 14, "9": 31, "21": 42, "28": 84, "36": 44, "51": 67, "71": 91, "80": 100 }
};

export const useSnakeGame = (customConfig) => {
    const config = customConfig || DEFAULT_CONFIG;

    // Players: P1 (User), P2 (CPU)
    const [players, setPlayers] = useState([
        { id: 'p1', pos: 1, color: 'bg-blue-500', name: 'You' },
        { id: 'p2', pos: 1, color: 'bg-red-500', name: 'CPU' }
    ]);

    const [turn, setTurn] = useState(0); // 0 = Player, 1 = CPU
    const [dice, setDice] = useState(null);
    const [rolling, setRolling] = useState(false);
    const [message, setMessage] = useState('Roll to start');

    const movePlayer = useCallback((pIdx, roll) => {
        let winner = null;

        setPlayers(prev => {
            const newPlayers = [...prev];
            const p = newPlayers[pIdx];
            let nextPos = p.pos + roll;

            // Rule: Must land exactly on 100? Or bounce?
            // "If nextPos > 100 ... nextPos = p.pos" (Skip turn)
            if (nextPos > 100) {
                setMessage(`${p.name} rolled ${roll} (Too high)`);
                nextPos = p.pos;
            } else {
                // Check Snakes/Ladders
                if (config.snakes[nextPos]) {
                    setMessage(`${p.name} hit a snake! 🐍`);
                    nextPos = config.snakes[nextPos];
                } else if (config.ladders[nextPos]) {
                    setMessage(`${p.name} climbed a ladder! 🪜`);
                    nextPos = config.ladders[nextPos];
                } else {
                    setMessage(`${p.name} moved to ${nextPos}`);
                }
                newPlayers[pIdx].pos = nextPos;
            }

            if (nextPos === 100) {
                setMessage(`${p.name} Wins! 🏆`);
                winner = pIdx;
                // Game Over state could be managed here
            }

            return newPlayers;
        });

        // Return info for async flow
        return { winner };
    }, [config]);

    const performTurn = useCallback((pIdx) => {
        if (rolling) return;
        setRolling(true);
        setMessage(pIdx === 0 ? 'Rolling...' : 'CPU Rolling...');

        setTimeout(() => {
            const rollVal = Math.floor(Math.random() * 6) + 1;
            setDice(rollVal);
            setRolling(false);

            const result = movePlayer(pIdx, rollVal);

            if (result.winner !== null) return; // Game Over

            // Turn passing logic
            if (rollVal !== 6) {
                // Next turn
                setTimeout(() => {
                    const nextT = pIdx === 0 ? 1 : 0;
                    setTurn(nextT);
                    setDice(null);
                    // If CPU turn next, trigger it
                    if (nextT === 1) setTimeout(() => shouldTriggerCPUTurn(true), 1000); // Trigger via flag? 
                    // Better to just call performTurn(1) recursively safely
                }, 1500);
            } else {
                // Bonus turn
                setMessage(`${pIdx === 0 ? 'You' : 'CPU'} rolled a 6! Roll again.`);
                setTimeout(() => {
                    setDice(null);
                    if (pIdx === 1) setTimeout(() => shouldTriggerCPUTurn(true), 1000);
                }, 1000);
            }
        }, 600);
    }, [rolling, movePlayer]);

    // Helper to safely trigger CPU
    const shouldTriggerCPUTurn = (trigger) => {
        if (trigger) performTurn(1);
    };

    const handlePlayerRoll = () => {
        if (turn !== 0 || rolling) return;
        performTurn(0);
    };

    // Effect to start CPU turn if it's CPU turn and we are idle (failsafe)
    // But performTurn handles the loop.

    const resetGame = () => {
        setPlayers([
            { id: 'p1', pos: 1, color: 'bg-blue-500', name: 'You' },
            { id: 'p2', pos: 1, color: 'bg-red-500', name: 'CPU' }
        ]);
        setTurn(0);
        setDice(null);
        setRolling(false);
        setMessage('Roll to start');
    };

    return {
        players,
        turn,
        dice,
        rolling,
        message,
        handleRoll: handlePlayerRoll,
        resetGame,
        config
    };
};
