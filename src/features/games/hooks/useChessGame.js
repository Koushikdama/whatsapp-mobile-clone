import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';

export const useChessGame = (onMove) => {
    const [game, setGame] = useState(new Chess());
    const [moveFrom, setMoveFrom] = useState("");
    const [optionSquares, setOptionSquares] = useState({});
    const [history, setHistory] = useState([]); // Track history for potential undo functionality in future

    // Helper to safely mutate game state
    const safeGameMutate = (modify) => {
        setGame((g) => {
            const update = new Chess(g.fen());
            modify(update);
            return update;
        });
    };

    /**
     * Attempts to make a move on the board.
     * @param {Object} move - The move object {from, to, promotion}
     * @returns {Object|null} - The move result object if successful, null otherwise
     */
    const makeAMove = useCallback((move) => {
        const gameCopy = new Chess(game.fen());
        try {
            const result = gameCopy.move(move);
            if (result) {
                setGame(gameCopy);
                if (onMove) onMove(gameCopy.fen());
                return result;
            }
        } catch (e) {
            return null;
        }
        return null;
    }, [game, onMove]);

    /**
     * Makes a random move for the AI (Black)
     */
    const makeRandomMove = useCallback(() => {
        const possibleMoves = game.moves();
        if (game.isGameOver() || game.isDraw() || possibleMoves.length === 0) return;

        // Simple optimization: Try to capture a piece if possible, otherwise random
        const captureMoves = possibleMoves.filter(m => m.includes('x'));
        const move = captureMoves.length > 0
            ? captureMoves[Math.floor(Math.random() * captureMoves.length)]
            : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

        safeGameMutate((g) => {
            g.move(move);
            if (onMove) onMove(g.fen());
        });
    }, [game, onMove]);

    // AI Turn Effect
    useEffect(() => {
        if (game.turn() === 'b' && !game.isGameOver()) {
            const timer = setTimeout(makeRandomMove, 1000);
            return () => clearTimeout(timer);
        }
    }, [game, makeRandomMove]);

    /**
     * Handles DnD drop event
     */
    function onDrop(sourceSquare, targetSquare) {
        const move = makeAMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q",
        });
        return move !== null;
    }

    /**
     * Handles Click-to-move interaction
     */
    function onSquareClick(square) {
        const piece = game.get(square);

        // Case 1: Clicking to move a selected piece
        if (moveFrom) {
            const move = makeAMove({
                from: moveFrom,
                to: square,
                promotion: "q",
            });

            // If move valid, reset selection
            if (move) {
                setMoveFrom("");
                setOptionSquares({});
                return;
            }
        }

        // Case 2: Selecting a piece (or changing selection)
        // Only select if it's the player's turn (White's pieces) and the piece exists
        if (piece && piece.color === game.turn()) {
            // Allow re-selection or new selection
            setMoveFrom(square);

            // Highlight moves
            const moves = game.moves({ square, verbose: true });
            const newSquares = {};
            moves.forEach((m) => {
                newSquares[m.to] = {
                    background: "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
                    borderRadius: "50%",
                };
            });
            newSquares[square] = { background: "rgba(255, 255, 0, 0.4)" };
            setOptionSquares(newSquares);
        } else {
            // Clicking empty square or opponent piece without a valid move pending -> deselect
            setMoveFrom("");
            setOptionSquares({});
        }
    }

    const resetGame = () => {
        setGame(new Chess());
        setMoveFrom("");
        setOptionSquares({});
    };

    return {
        game,
        optionSquares,
        onDrop,
        onSquareClick,
        resetGame,
        isGameOver: game.isGameOver(),
        isCheckmate: game.isCheckmate(),
        isDraw: game.isDraw(),
        turn: game.turn()
    };
};
