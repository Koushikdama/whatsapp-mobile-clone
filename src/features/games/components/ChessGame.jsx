import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useGame } from '../context/GameContext';
import { Clock, RotateCcw } from 'lucide-react';
import { GAME_CONFIG, GAME_TYPES } from '../../../shared/constants/gameConstants';
import ResponsiveGameContainer from '../../../shared/components/games/ResponsiveGameContainer';

const ChessGame = ({ onMove, timeControl }) => {
    const { activeGame } = useGame();
    const chessConfig = GAME_CONFIG[GAME_TYPES.CHESS];
    const defaultTimeControl = timeControl || chessConfig.defaultTimeControl || 600; // Default 10 minutes (600 seconds)
    const [game, setGame] = useState(new Chess());
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [possibleMoves, setPossibleMoves] = useState([]);
    const [playerColor, setPlayerColor] = useState('w'); // 'w' for white, 'b' for black
    const [gameOver, setGameOver] = useState(false);
    const [turn, setTurn] = useState('w');

    // Timer state
    const [whiteTime, setWhiteTime] = useState(defaultTimeControl);
    const [blackTime, setBlackTime] = useState(defaultTimeControl);
    const [timerActive, setTimerActive] = useState(false);
    const [timeExpired, setTimeExpired] = useState(null); // 'w' or 'b' if time expired
    const [winner, setWinner] = useState(null);

    // Pieces Map for simple rendering
    const PIECES = {
        'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
        'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
    };

    // Timer countdown effect
    useEffect(() => {
        if (!timerActive || gameOver || timeExpired) return;

        const interval = setInterval(() => {
            if (turn === 'w') {
                setWhiteTime(prev => {
                    if (prev <= 1) {
                        setTimeExpired('w');
                        setGameOver(true);
                        setWinner('Black');
                        setTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            } else {
                setBlackTime(prev => {
                    if (prev <= 1) {
                        setTimeExpired('b');
                        setGameOver(true);
                        setWinner('White');
                        setTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timerActive, turn, gameOver, timeExpired]);

    // AI Move Logic (Random)
    useEffect(() => {
        if (turn !== playerColor && !gameOver && timerActive) {
            setTimeout(() => {
                const moves = game.moves();
                if (moves.length > 0) {
                    const randomMove = moves[Math.floor(Math.random() * moves.length)];
                    const newGame = new Chess(game.fen());
                    newGame.move(randomMove);
                    setGame(newGame);
                    setTurn(newGame.turn());

                    if (onMove) onMove(newGame.fen());

                    if (newGame.isGameOver()) {
                        setGameOver(true);
                        setWinner(newGame.turn() === 'w' ? 'Black' : 'White');
                        setTimerActive(false);
                    }
                }
            }, 500);
        }
    }, [turn, playerColor, gameOver, timerActive, game, onMove]);

    const handleSquareClick = (square) => {
        if (gameOver) return; // Prevent moves if game is over

        // If it's AI's turn, do nothing
        if (turn !== playerColor) return;

        // If selecting a piece to move
        if (!selectedSquare) {
            const piece = game.get(square);
            if (piece && piece.color === game.turn()) {
                setSelectedSquare(square);
                const moves = game.moves({ square, verbose: true }).map(m => m.to);
                setPossibleMoves(moves);
            }
            return;
        }

        // If clicking same square, deselect
        if (selectedSquare === square) {
            setSelectedSquare(null);
            setPossibleMoves([]);
            return;
        }

        // Try move
        try {
            const newGame = new Chess(game.fen()); // Create a new game instance for the move
            const move = newGame.move({
                from: selectedSquare,
                to: square,
                promotion: 'q' // always promote to queen for simplicity
            });

            if (move) {
                setGame(newGame); // Update game state
                setSelectedSquare(null);
                setPossibleMoves([]);
                setTurn(newGame.turn()); // Update turn

                if (onMove) onMove(newGame.fen());

                // Start timer on first move
                if (!timerActive) {
                    setTimerActive(true);
                }

                if (newGame.isGameOver()) {
                    setGameOver(true);
                    setWinner(newGame.turn() === 'w' ? 'Black' : 'White');
                    setTimerActive(false);
                }
            } else {
                // If invalid move but clicking another own piece, select that instead
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
    };

    const board = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const square = (files[f] + ranks[r]);
            const piece = game.get(square);
            const isDark = (r + f) % 2 === 1;
            const isSelected = selectedSquare === square;
            const isPossible = possibleMoves.includes(square);
            const inCheck = piece?.type === 'k' && piece.color === game.turn() && game.inCheck();

            board.push(
                <div
                    key={square}
                    onClick={() => handleSquareClick(square)}
                    className={`
                        w-[12.5%] aspect-square flex items-center justify-center text-3xl cursor-pointer relative select-none
                        ${isDark ? 'bg-[#769656]' : 'bg-[#eeeed2]'}
                        ${isSelected ? 'bg-yellow-200 ring-inset ring-4 ring-yellow-400' : ''}
                        ${inCheck ? 'bg-red-500' : ''}
                    `}
                >
                    {isPossible && (
                        <div className={`absolute w-3 h-3 rounded-full ${piece ? 'ring-4 ring-black/20 w-full h-full rounded-none' : 'bg-black/20'}`}></div>
                    )}
                    <span className={`${piece?.color === 'w' ? 'text-white drop-shadow-md' : 'text-black'}`}>
                        {piece ? PIECES[piece.type === 'p' ? (piece.color === 'w' ? 'P' : 'p') : piece.type] : ''}
                        {/* Fallback to text if unicode fails visually, but using piece.type for logic mapping above */}
                        {piece && PIECES[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                    </span>

                    {f === 0 && <span className={`absolute top-0.5 left-0.5 text-[8px] font-bold ${isDark ? 'text-[#eeeed2]' : 'text-[#769656]'}`}>{ranks[r]}</span>}
                    {r === 7 && <span className={`absolute bottom-0.5 right-0.5 text-[8px] font-bold ${isDark ? 'text-[#eeeed2]' : 'text-[#769656]'}`}>{files[f]}</span>}
                </div>
            );
        }
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const resetGame = () => {
        setGame(new Chess());
        setSelectedSquare(null);
        setPossibleMoves([]);
        setGameOver(false);
        setWinner(null);
        setWhiteTime(timeControl);
        setBlackTime(timeControl);
        setTimerActive(false);
        setTimeExpired(null);
        setTurn('w');
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-[500px] mx-auto p-4">
            {/* Timer and Controls */}
            <div className="w-full flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                {/* White Timer */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    turn === 'w' && timerActive && !gameOver ? 'bg-white dark:bg-gray-700 ring-2 ring-blue-400' : 'bg-gray-50 dark:bg-gray-900'
                }`}>
                    <Clock size={18} className={whiteTime < 30 && timerActive && !timeExpired ? 'text-red-500 animate-pulse' : 'text-gray-600 dark:text-gray-300'} />
                    <span className={`font-mono font-bold ${whiteTime < 30 && timerActive && !timeExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {formatTime(whiteTime)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">White</span>
                </div>

                {/* Reset Button */}
                <button
                    onClick={resetGame}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Reset Game"
                >
                    <RotateCcw size={20} className="text-gray-600 dark:text-gray-300" />
                </button>

                {/* Black Timer */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    turn === 'b' && timerActive && !gameOver ? 'bg-gray-900 dark:bg-gray-700 ring-2 ring-red-400' : 'bg-gray-800 dark:bg-gray-900'
                }`}>
                    <span className="text-xs text-gray-300 dark:text-gray-400">Black</span>
                    <span className={`font-mono font-bold ${blackTime < 30 && timerActive && !timeExpired ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                        {formatTime(blackTime)}
                    </span>
                    <Clock size={18} className={blackTime < 30 && timerActive && !timeExpired ? 'text-red-400 animate-pulse' : 'text-gray-300'} />
                </div>
            </div>

            {/* Game Status */}
            {gameOver && (
                <div className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-3 rounded-lg text-center font-bold animate-in zoom-in">
                    {timeExpired ? `${winner} wins on time! ⏱️` : `${winner} wins!`}
                </div>
            )}

            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Chess</h3>
            <div className="flex flex-wrap w-full max-w-[350px] shadow-lg border-4 border-[#3a3a3a]">
                {board}
            </div>
        </div>
    );
};

export default ChessGame;
