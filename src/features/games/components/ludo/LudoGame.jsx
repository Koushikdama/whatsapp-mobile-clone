import React, { useMemo } from 'react';
import { useLudoGame } from '../../hooks/useLudoGame';

const LudoGame = () => {
    const {
        dice,
        rolling,
        turn,
        message,
        redTokens,
        greenTokens,
        rollDice,
        handleMove
    } = useLudoGame();

    // Coordinate Mapping for the Board Path (15x15 Grid)
    // Indexes 0-51 (Global Path starting from Red Start)
    const GLOBAL_PATH = [
        [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], // 0-4 (Red Straight)
        [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], // 5-10 (Up Red-Green)
        [0, 7], [0, 8], // 11-12 (Top Turn)
        [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], // 13-18 (Down Green)
        [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], // 19-23 (Right Green)
        [7, 14], [8, 14], // 24-25 (Right Turn)
        [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], // 26-31 (Left Yellow)
        [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], // 32-36 (Down Yellow)
        [14, 7], [14, 6], // 37-38 (Bottom Turn)
        [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], // 39-44 (Up Blue)
        [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], // 45-49 (Left Blue)
        [7, 0], [6, 0] // 50-51 (Left Turn to Red Start) -- Wait, 51 is [6,0], then 0 is [6,1]? Yes.
    ];

    // Home Paths (Private)
    const RED_HOME_RUN = [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]]; // 0-5 (5th is home)
    const GREEN_HOME_RUN = [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]];

    const getCoordinates = (player, pos) => {
        if (pos === -1) return null; // Handled in base
        if (pos === 57) return null; // Handled in center/home

        // 0-50: Main Path
        if (pos <= 50) {
            const offset = player === 'red' ? 0 : 13;
            const globalIdx = (pos + offset) % 52;
            return GLOBAL_PATH[globalIdx];
        }

        // 51-56: Home Run
        // Pos 51 is actually entry to home run? 
        // In my hook: "0-50: Main common path... 51-56: Home Run"
        // So 51 is first step of home run.
        const homeIdx = pos - 51;
        if (player === 'red') return RED_HOME_RUN[homeIdx];
        if (player === 'green') return GREEN_HOME_RUN[homeIdx];

        return null;
    };

    // Calculate Token Positions Map for Rendering
    const tokenMap = useMemo(() => {
        const map = {};

        const addToMap = (r, c, player, index) => {
            const key = `${r},${c}`;
            if (!map[key]) map[key] = [];
            map[key].push({ player, index });
        };

        redTokens.forEach((pos, i) => {
            const coords = getCoordinates('red', pos);
            if (coords) addToMap(coords[0], coords[1], 'red', i);
        });

        greenTokens.forEach((pos, i) => {
            const coords = getCoordinates('green', pos);
            if (coords) addToMap(coords[0], coords[1], 'green', i);
        });

        return map;
    }, [redTokens, greenTokens]);


    const renderCell = (row, col) => {
        // Base coordinate mapping for 15x15 grid
        const isRedBase = row < 6 && col < 6;
        const isGreenBase = row < 6 && col > 8;
        const isBlueBase = row > 8 && col < 6;
        const isYellowBase = row > 8 && col > 8;
        const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8;

        // BASES
        if (isRedBase) {
            return (row === 0 && col === 0) ? (
                <div key="red-base" className="col-span-6 row-span-6 bg-red-500 p-4 border-2 border-black flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-xl grid grid-cols-2 p-2 gap-2">
                        {redTokens.map((t, i) => (
                            <div key={i} onClick={() => t === -1 && turn === 'red' && handleMove(i)}
                                className={`w-full aspect-square rounded-full border-2 border-black/20 shadow-inner flex items-center justify-center cursor-pointer transition-transform hover:scale-110 
                                ${t === -1 ? 'bg-red-500' : 'bg-white'}`}>
                                {t !== -1 && <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg opacity-20"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null;
        }

        if (isGreenBase) {
            return (row === 0 && col === 9) ? (
                <div key="green-base" className="col-span-6 row-span-6 bg-green-500 p-4 border-2 border-black flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-xl grid grid-cols-2 p-2 gap-2">
                        {greenTokens.map((t, i) => (
                            <div key={i} className={`w-full aspect-square rounded-full border-2 border-black/20 shadow-inner flex items-center justify-center 
                                ${t === -1 ? 'bg-green-500' : 'bg-white'}`}>
                                {t !== -1 && <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg opacity-20"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null;
        }

        if (isBlueBase) return (row === 9 && col === 0) ? <div key="blue-base" className="col-span-6 row-span-6 bg-blue-500 border-2 border-black opacity-50"></div> : null;
        if (isYellowBase) return (row === 9 && col === 9) ? <div key="yellow-base" className="col-span-6 row-span-6 bg-yellow-400 border-2 border-black opacity-50"></div> : null;

        // CENTER (HOME)
        if (isCenter) return (row === 6 && col === 6) ? (
            <div key="center" className="col-span-3 row-span-3 bg-white border-2 border-black relative overflow-hidden">
                <div className="absolute inset-0" style={{ background: 'conic-gradient(#4ade80 45deg, #facc15 45deg 135deg, #3b82f6 135deg 225deg, #ef4444 225deg)' }}></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-black/10 z-10">
                    <span className="text-[10px] font-black transform rotate-[-45deg]">HOME</span>

                    {/* Render Finished Tokens */}
                    <div className="absolute inset-0 flex flex-wrap items-center justify-center p-2 gap-1">
                        {redTokens.filter(t => t === 57).map((_, i) => <div key={`r${i}`} className="w-3 h-3 bg-red-500 rounded-full border border-white" />)}
                        {greenTokens.filter(t => t === 57).map((_, i) => <div key={`g${i}`} className="w-3 h-3 bg-green-500 rounded-full border border-white" />)}
                    </div>
                </div>
            </div>
        ) : null;

        // PATHS
        let bg = 'bg-white';
        // Red Home Path
        if (row === 7 && col > 0 && col < 6) bg = 'bg-red-500';
        if (row === 6 && col === 1) bg = 'bg-red-500'; // Red Start

        // Green Home Path
        if (col === 7 && row > 0 && row < 6) bg = 'bg-green-500';
        if (row === 1 && col === 8) bg = 'bg-green-500'; // Green Start

        // Safe spots (Stars)
        const isSafe = (row === 6 && col === 2) || (row === 2 && col === 8) || (row === 8 && col === 12) || (row === 12 && col === 6);

        // Active Tokens on this cell
        const tokensHere = tokenMap[`${row},${col}`] || [];

        return (
            <div
                key={`${row}-${col}`}
                className={`w-full h-full border-[0.5px] border-black/10 flex items-center justify-center relative ${bg}`}
            >
                {isSafe && <span className="text-gray-300 text-xs absolute inset-0 flex items-center justify-center">★</span>}

                {/* Render Tokens */}
                {tokensHere.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-0.5 w-full h-full p-0.5">
                        {tokensHere.map((t, idx) => (
                            <div
                                key={idx}
                                onClick={() => t.player === 'red' && turn === 'red' && handleMove(t.index)}
                                className={`w-3 h-3 md:w-4 md:h-4 rounded-full border border-white shadow-md z-10 cursor-pointer
                                    ${t.player === 'red' ? 'bg-red-600' : 'bg-green-600'}
                                    ${t.player === 'red' && turn === 'red' ? 'animate-bounce' : ''}
                                `}
                            ></div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const grid = [];
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            const cell = renderCell(r, c);
            if (cell) grid.push(cell);
        }
    }

    return (
        <div className="flex flex-col items-center gap-4 w-full h-full p-4 bg-wa-grayBg dark:bg-wa-dark-header">
            <div className="w-full max-w-[360px] aspect-square bg-black p-[2px] grid grid-cols-15 grid-rows-15 shadow-2xl rounded-sm">
                {grid}
            </div>

            <div className="w-full max-w-[360px] bg-white dark:bg-wa-dark-paper p-4 rounded-2xl shadow-xl flex items-center justify-between border border-wa-border dark:border-wa-dark-border">
                <div className={`flex flex-col items-center transition-all ${turn === 'red' ? 'scale-110 opacity-100' : 'opacity-40'}`}>
                    <span className="text-red-600 font-bold text-xs uppercase tracking-widest mb-1">Red (You)</span>
                    <div className="flex gap-1">
                        {redTokens.map((t, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full border border-black/10 ${t === 57 ? 'bg-yellow-400' : t === -1 ? 'bg-gray-200' : 'bg-red-500'}`}></div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={rollDice}
                        disabled={rolling || !!dice || turn === 'green'}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all
                            ${turn === 'red' ? 'bg-red-500 border-red-700 text-white' : 'bg-gray-100 text-gray-400 border-gray-300'}
                            ${rolling ? 'animate-spin' : ''}
                        `}
                    >
                        {dice || '🎲'}
                    </button>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 h-4 uppercase">{message}</span>
                </div>

                <div className={`flex flex-col items-center transition-all ${turn === 'green' ? 'scale-110 opacity-100' : 'opacity-40'}`}>
                    <span className="text-green-600 font-bold text-xs uppercase tracking-widest mb-1">Green (AI)</span>
                    <div className="flex gap-1">
                        {greenTokens.map((t, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full border border-black/10 ${t === 57 ? 'bg-yellow-400' : t === -1 ? 'bg-gray-200' : 'bg-green-500'}`}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LudoGame;
