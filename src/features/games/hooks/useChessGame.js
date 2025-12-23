import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';

/**
 * Custom hook for Chess game logic (Single Responsibility Principle)
 * Handles all chess-specific game state and move validation for MULTIPLAYER
 * Separated from UI rendering and timer logic
 * 
 * @param {Object} activeGame - Current active game from AppContext
 * @param {string} currentUserId - Current user's ID
 * @param {Function} makeGameMove - Function to broadcast moves via WebSocket
 */
const useChessGame = (activeGame, currentUserId, makeGameMove) => {
    const [game, setGame] = useState(new Chess());
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [possibleMoves, setPossibleMoves] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [turn, setTurn] = useState('w');

    // Determine player color from activeGame
    const myPlayer = activeGame?.players?.find(p => p.userId === currentUserId);
    const playerColor = myPlayer?.color === 'white' ? 'w' : 'b';

    // Sync game state from WebSocket updates (multiplayer synchronization)
    useEffect(() => {
        if (activeGame?.gameState?.fen && activeGame.gameState.fen !== game.fen()) {
            const newGame = new Chess(activeGame.gameState.fen);
            setGame(newGame);
            setTurn(newGame.turn());
            setSelectedSquare(null);
            setPossibleMoves([]);

            // Check for game over
            if (newGame.isGameOver()) {
                setGameOver(true);
                setWinner(newGame.turn() === 'w' ? 'Black' : 'White');
            }
        }
    }, [activeGame?.gameState?.fen, game]);

    /**
     * Handle square click - validates and makes moves
     */
    const handleSquareClick = useCallback((square) => {
        if (gameOver) return;
        if (turn !== playerColor) return; // Only allow moves during player's turn

        // Select piece
        if (!selectedSquare) {
            const piece = game.get(square);
            if (piece && piece.color === game.turn()) {
                setSelectedSquare(square);
                const moves = game.moves({ square, verbose: true }).map(m => m.to);
                setPossibleMoves(moves);
            }
            return;
        }

        // Deselect if clicking same square
        if (selectedSquare === square) {
            setSelectedSquare(null);
            setPossibleMoves([]);
            return;
        }

        // Try to make move
        try {
            const newGame = new Chess(game.fen());
            const move = newGame.move({
                from: selectedSquare,
                to: square,
                promotion: 'q' // Auto-promote to queen
            });

            if (move) {
                setGame(newGame);
                setSelectedSquare(null);
                setPossibleMoves([]);
                setTurn(newGame.turn());

                // Broadcast move via WebSocket to other player
                if (activeGame) {
                    makeGameMove(activeGame.id, {
                        fen: newGame.fen(),
                        move: move,
                        turn: newGame.turn()
                    });
                }

                // Check for game over
                if (newGame.isGameOver()) {
                    setGameOver(true);
                    setWinner(newGame.turn() === 'w' ? 'Black' : 'White');
                }
            } else {
                // If invalid move, try selecting another piece
                const piece = game.get(square);
                if (piece && piece.color === game.turn()) {
                    setSelectedSquare(square);
                    const moves = game.moves({ square, verbose: true }).map(m => m.to);
                    setPossibleMoves(moves);
                } else {
                    setSelectedSquare(null);
                    setPossibleMoves([]);
                }
            }
        } catch (e) {
            setSelectedSquare(null);
            setPossibleMoves([]);
        }
    }, [game, selectedSquare, gameOver, turn, playerColor, activeGame, makeGameMove]);

    /**
     * Reset game to initial state
     */
    const resetGame = useCallback(() => {
        setGame(new Chess());
        setSelectedSquare(null);
        setPossibleMoves([]);
        setGameOver(false);
        setWinner(null);
        setTurn('w');
    }, []);

    return {
        game,
        selectedSquare,
        possibleMoves,
        gameOver,
        winner,
        turn,
        playerColor,
        handleSquareClick,
        resetGame,
        isCheckmate: game.isCheckmate(),
        isDraw: game.isDraw(),
        inCheck: game.inCheck()
    };
};

export default useChessGame;
