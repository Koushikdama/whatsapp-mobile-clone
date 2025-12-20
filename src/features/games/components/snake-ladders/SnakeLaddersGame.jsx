import React from 'react';
import { useApp } from '../../../../shared/context/AppContext';
import { useSnakeGame } from '../../hooks/useSnakeGame';

const SnakeLaddersGame = () => {
    const { gameConfig } = useApp();
    const snakeConfig = gameConfig?.snakeAndLadders;

    const {
        players,
        turn,
        dice,
        rolling,
        message,
        handleRoll,
        config // Access config from hook (merged default if needed)
    } = useSnakeGame(snakeConfig);

    const renderBoard = () => {
        const cells = [];
        for (let row = 9; row >= 0; row--) {
            for (let col = 0; col < 10; col++) {
                // Zigzag logic:
                // Row 0 (bottom): 1-10 (L to R)
                // Row 1: 20-11 (R to L) (Odd row index if 0-based from bottom? No, 0 is even)
                // Row indices here are 9 down to 0.
                // Row 0 is bottom.
                // If row is even (0, 2, 4...), numbers go L->R (1-10, 21-30).
                // If row is odd (1, 3, 5...), numbers go R->L (20-11, 40-31).

                let num;
                if (row % 2 === 0) {
                    num = (row * 10) + (col + 1);
                } else {
                    num = (row * 10) + (10 - col);
                }

                const isSnake = config.snakes[num];
                const isLadder = config.ladders[num];
                const isEven = (row + col) % 2 === 0;

                cells.push(
                    <div key={num} className={`relative flex items-center justify-center border-[0.5px] border-black/10 transition-colors
                        ${isEven ? 'bg-white dark:bg-white/5' : 'bg-gray-50 dark:bg-white/10'}
                        ${isSnake ? 'bg-red-50/50' : ''}
                        ${isLadder ? 'bg-green-50/50' : ''}
                    `}>
                        <span className="absolute top-0.5 left-1 text-[8px] text-gray-400 font-bold">{num}</span>

                        {isSnake && <span className="text-xl md:text-2xl drop-shadow-sm opacity-80 z-10">🐍</span>}
                        {isLadder && <span className="text-xl md:text-2xl drop-shadow-sm opacity-80 z-10">🪜</span>}

                        <div className="absolute inset-0 flex items-center justify-center gap-0.5 pointer-events-none">
                            {players.map((p, i) => p.pos === num && (
                                <div key={i} className={`w-3.5 h-3.5 md:w-5 md:h-5 rounded-full ${p.color} border-2 border-white shadow-lg z-20 transition-all transform scale-110`}></div>
                            ))}
                        </div>
                    </div>
                );
            }
        }
        return cells;
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-4 bg-wa-grayBg dark:bg-[#111b21]">
            <div className="w-full max-w-[360px] aspect-square bg-white rounded-xl shadow-2xl overflow-hidden grid grid-cols-10 grid-rows-10 border-4 border-wa-border dark:border-gray-800">
                {renderBoard()}
            </div>

            <div className="w-full max-w-[360px] mt-4 bg-white dark:bg-wa-dark-paper p-4 rounded-2xl shadow-xl flex items-center justify-between border border-wa-border dark:border-wa-dark-border">
                <div className={`flex flex-col items-center transition-all ${turn === 0 ? 'scale-110 opacity-100' : 'opacity-40'}`}>
                    <div className="w-10 h-10 bg-blue-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs">YOU</div>
                    <span className="text-[10px] text-gray-500 font-bold mt-1">POS: {players[0].pos}</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={handleRoll}
                        disabled={turn !== 0 || rolling}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all
                            ${turn === 0 ? 'bg-indigo-600 border-indigo-800 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 border-gray-300'}
                            ${rolling ? 'animate-bounce' : ''}
                        `}
                    >
                        {dice || '🎲'}
                    </button>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 h-4 uppercase max-w-[120px] truncate">{message}</span>
                </div>

                <div className={`flex flex-col items-center transition-all ${turn === 1 ? 'scale-110 opacity-100' : 'opacity-40'}`}>
                    <div className="w-10 h-10 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs">CPU</div>
                    <span className="text-[10px] text-gray-500 font-bold mt-1">POS: {players[1].pos}</span>
                </div>
            </div>
        </div>
    );
};

export default SnakeLaddersGame;
