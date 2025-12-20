import { useState, useCallback, useEffect } from 'react';

/**
 * Ludo Game Hook
 * Implements 2-player Ludo logic (Red vs Green)
 * 
 * Path Logic:
 * -1: Base
 * 0-50: Main common path (52 cells total global, but enters home run at 51)
 * 51-56: Home Run (Private)
 * 57: Finished
 * 
 * Global Path Mapping (Standard Ludo board):
 * Red Start: 0
 * Green Start: 13
 * (Assumes 13 cells difference between starts)
 */
export const useLudoGame = () => {
    const [dice, setDice] = useState(null);
    const [turn, setTurn] = useState('red');
    const [rolling, setRolling] = useState(false);
    const [message, setMessage] = useState('Roll to start');

    // Tokens: 4 per player, value represents position
    const [redTokens, setRedTokens] = useState([-1, -1, -1, -1]);
    const [greenTokens, setGreenTokens] = useState([-1, -1, -1, -1]);

    const getGlobalPos = useCallback((player, relPos) => {
        if (relPos < 0 || relPos > 50) return -1; // Not on shared path (Base or Home Run)
        const offset = player === 'red' ? 0 : 13;
        return (relPos + offset) % 52;
    }, []);

    const performMove = useCallback((player, tokenIdx, rollVal) => {
        const isRed = player === 'red';
        const currentTokens = isRed ? [...redTokens] : [...greenTokens];
        const opponentTokens = isRed ? [...greenTokens] : [...redTokens];
        const setPlayerTokens = isRed ? setRedTokens : setGreenTokens;
        const setOpponentTokens = isRed ? setGreenTokens : setRedTokens;

        const currentPos = currentTokens[tokenIdx];
        let newPos = currentPos;

        // Move logic
        if (currentPos === -1) {
            newPos = 0; // Move to start
        } else {
            newPos = currentPos + rollVal;
        }

        if (newPos > 57) return false; // Cannot move beyond finish

        // Collision/Capture Logic
        let captured = false;
        let captureMessage = '';

        if (newPos >= 0 && newPos <= 50) { // Only on shared path
            const myGlobal = (newPos + (player === 'red' ? 0 : 13)) % 52;

            // Check against opponent tokens
            opponentTokens.forEach((oppPos, idx) => {
                if (oppPos >= 0 && oppPos <= 50) {
                    const oppGlobal = (oppPos + (player === 'red' ? 13 : 0)) % 52; // Opponent global

                    if (myGlobal === oppGlobal) {
                        // Collision! Check safety (Standard Ludo Safe Spots: 0, 8, 13, 21, 26, 34, 39, 47)
                        // This corresponds to relative 0 and 8 for each player (0,8, 13,21, 26,34, 39,47)
                        const isSafe = [0, 8, 13, 21, 26, 34, 39, 47].includes(myGlobal);

                        if (!isSafe) {
                            // CAPTURE!
                            opponentTokens[idx] = -1; // Send back to base
                            captured = true;
                            captureMessage = `Captured! ${player === 'red' ? 'Green' : 'Red'} piece sent home!`;
                        }
                    }
                }
            });
        }

        // Update tokens
        currentTokens[tokenIdx] = newPos;
        setPlayerTokens(currentTokens);
        if (captured) setOpponentTokens(opponentTokens);

        // Turn management
        const rolledSix = rollVal === 6;
        const reachedHome = newPos === 57;

        // Return state for next step decision
        return {
            bonusTurn: rolledSix || reachedHome || captured,
            captureMessage
        };
    }, [redTokens, greenTokens]);

    const handlePlayerMove = (tokenIdx) => {
        if (turn !== 'red' || !dice) return;

        const t = redTokens[tokenIdx];
        // Validate if move possible
        if (t === -1 && dice !== 6) return;
        if (t >= 0 && t + dice > 57) return;

        const result = performMove('red', tokenIdx, dice);

        if (result) {
            if (result.bonusTurn) {
                setDice(null);
                setMessage(result.captureMessage || (t + dice === 57 ? 'Home Run! Roll again.' : 'Rolled a 6! Roll again.'));
            } else {
                setTurn('green');
                setDice(null);
                setMessage("Opponent's turn");
            }
        }
    };

    const rollDiceInternal = useCallback((isAI = false) => {
        setRolling(true);
        setMessage(isAI ? 'CPU Rolling...' : 'Rolling...');

        setTimeout(() => {
            const val = Math.floor(Math.random() * 6) + 1;
            setDice(val);
            setRolling(false);

            if (isAI) {
                // Determine moves for green
                // We need the current state, so we read from refs or just closures? 
                // Closures in timeout will be stale if dependencies not updated.
                // But this function is recreated on render if dependencies change? 
                // Wait, recursion risk if dependencies change too fast.
                // We'll manage AI move in a separate effect or direct call?
                // Direct call inside timeout is fine if we have fresh state. 
                // But performMove needs fresh state.

                // Let's rely on a separate processing step for AI move *selection* after dice is set.
                // But `dice` state update is async.
                // So we can't do `setDice(val); performAI(val);` immediately with hooks if performAI uses `dice` state.
                // However, we can pass `val` directly to performAI logic.

                // AI LOGIC
                // (Duplicated simplistic logic here for closure access)
                processAIMove(val);
            } else {
                setMessage(val === 6 ? 'Rolled a 6!' : `Rolled a ${val}`);
                // Check moves availability for Red
                const canMove = redTokens.some(t => (t === -1 && val === 6) || (t >= 0 && t + val <= 57));
                if (!canMove) {
                    setMessage(`Rolled ${val}. No moves.`);
                    setTimeout(() => {
                        setTurn('green');
                        setDice(null);
                        setMessage("Opponent's turn");
                    }, 1500);
                }
            }
        }, 600);
    }, [redTokens, greenTokens, performMove]); // Dependencies for processAIMove if inline

    const processAIMove = (val) => {
        // Need fresh tokens from state (closed over)
        // Filter valid moves
        const moves = greenTokens.map((t, i) => {
            if (t === -1 && val !== 6) return null;
            if (t >= 0 && t + val > 57) return null;

            let score = 0;
            const pos = t === -1 ? 0 : t + val;

            // Prioritize kills
            if (pos <= 50) {
                const myGlobal = (pos + 13) % 52;
                redTokens.forEach(rt => {
                    if (rt >= 0 && rt <= 50) {
                        const rGlobal = rt; // Red offset 0
                        if (rGlobal === myGlobal && ![0, 8, 13, 21, 26, 34, 39, 47].includes(myGlobal)) {
                            score += 100;
                        }
                    }
                });
            }
            if (t === -1 && val === 6) score += 50;
            if (pos === 57) score += 200;
            score += pos;

            return { idx: i, score };
        }).filter(m => m !== null);

        if (moves.length === 0) {
            setMessage(`CPU Rolled ${val}. No moves.`);
            setTimeout(() => {
                setTurn('red');
                setDice(null);
                setMessage("Your turn");
            }, 1500);
            return;
        }

        moves.sort((a, b) => b.score - a.score);
        const result = performMove('green', moves[0].idx, val);

        if (result.bonusTurn) {
            setMessage(result.captureMessage || 'CPU gets bonus turn!');
            setTimeout(() => rollDiceInternal(true), 1500);
        } else {
            setTimeout(() => {
                setTurn('red');
                setDice(null);
                setMessage("Your turn");
            }, 1000);
        }
    };

    const rollDice = () => {
        if (turn !== 'red' || rolling || dice) return;
        rollDiceInternal(false);
    };

    useEffect(() => {
        if (turn === 'green' && !rolling && !dice) {
            const timer = setTimeout(() => {
                rollDiceInternal(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [turn, rolling, dice, rollDiceInternal]);

    return {
        dice,
        rolling,
        turn,
        message,
        redTokens,
        greenTokens,
        rollDice,
        handleMove: handlePlayerMove,
        getGlobalPos
    };
};
