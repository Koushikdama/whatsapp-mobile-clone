import React from 'react';
import { Chessboard } from 'react-chessboard';
import { useChessGame } from '../../hooks/useChessGame';

const ChessGame = ({ onMove }) => {
    const {
        game,
        optionSquares,
        onDrop,
        onSquareClick,
        resetGame,
        isGameOver,
        isCheckmate,
        isDraw,
        turn
    } = useChessGame(onMove);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full p-2 bg-[#1f2937]">
            <div className="w-full max-w-[400px] flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">AI</div>
                    <span className="text-gray-200 text-sm font-medium">Opponent (Black)</span>
                </div>
                {turn === 'b' && !isGameOver && (
                    <span className="text-xs text-green-400 animate-pulse font-bold">THINKING...</span>
                )}
            </div>

            <div className="w-full max-w-[400px] aspect-square shadow-2xl relative">
                <Chessboard
                    position={game.fen()}
                    onPieceDrop={onDrop}
                    onSquareClick={onSquareClick}
                    customHighlightSquares={optionSquares}
                    boardOrientation="white"
                    customBoardStyle={{
                        borderRadius: "4px",
                        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
                    }}
                />
            </div>

            <div className="w-full max-w-[400px] flex justify-between items-center mt-4 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white border-2 border-wa-teal rounded-lg flex items-center justify-center text-[#111b21] font-bold">YOU</div>
                    <span className="text-gray-200 text-sm font-medium">Player (White)</span>
                </div>
                {turn === 'w' && !isGameOver && (
                    <span className="text-xs text-wa-teal font-bold bg-wa-teal/10 px-2 py-1 rounded">YOUR TURN</span>
                )}
            </div>

            {isGameOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all animate-in fade-in">
                    <div className="bg-[#1f2937] p-8 rounded-2xl shadow-2xl text-center border-2 border-wa-teal">
                        <div className="mb-4 flex justify-center">
                            <div className="w-16 h-16 bg-wa-teal rounded-full flex items-center justify-center text-white">
                                <span className="text-3xl">🏆</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white">
                            {isCheckmate ? 'Checkmate!' : 'Game Over'}
                        </h3>
                        <p className="text-gray-300 mb-6 font-medium">
                            {isCheckmate
                                ? (turn === 'w' ? 'Black Wins!' : 'White Wins!')
                                : isDraw ? "It's a Draw!" : 'Game Finished'
                            }
                        </p>
                        <button
                            onClick={resetGame}
                            className="w-full bg-wa-teal text-white px-8 py-3 rounded-xl font-bold hover:bg-wa-tealDark transition-all active:scale-95 shadow-lg"
                        >
                            New Game
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChessGame;
