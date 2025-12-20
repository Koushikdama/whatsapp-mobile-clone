import React from 'react';
import { useApp } from '../../../shared/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Trophy, Gamepad2, X, TrendingUp } from 'lucide-react';
import { getGameIcon, getGameTitle, getGameColor } from '../../../shared/utils/gameUtils';

const GameHistoryPanel = ({ onClose }) => {
    const { gameHistory, users, currentUserId } = useApp();
    const navigate = useNavigate();

    if (gameHistory.length === 0) {
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white dark:bg-wa-dark-paper rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Trophy className="text-yellow-500" size={24} />
                            Game History
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Gamepad2 size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No games played yet</p>
                        <p className="text-sm mt-2">Start a game from any chat!</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-wa-dark-paper rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={24} />
                        Game History
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Game List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {gameHistory.map((game, index) => {
                        const isWinner = game.result?.winner === currentUserId;
                        const isDraw = game.result?.isDraw;
                        const winnerName = game.result?.winner ? users[game.result.winner]?.name : null;

                        return (
                            <div
                                key={game.id}
                                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-wa-teal dark:hover:border-wa-teal transition-all"
                            >
                                {/* Game Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl"
                                            style={{ backgroundColor: getGameColor(game.type) }}
                                        >
                                            {getGameIcon(game.type)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {getGameTitle(game.type)}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(game.endedAt).toLocaleDateString()} at {new Date(game.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Result Badge */}
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        isWinner ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                        isDraw ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    }`}>
                                        {isWinner ? '🏆 Won' : isDraw ? '🤝 Draw' : '❌ Lost'}
                                    </div>
                                </div>

                                {/* Players */}
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span>Players:</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {game.players.map((player, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded text-xs">
                                                {player.userId === currentUserId ? 'You' : users[player.userId]?.name || 'Player'}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Winner Info */}
                                {!isDraw && winnerName && (
                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        Winner: <span className="font-semibold text-gray-700 dark:text-gray-300">{winnerName}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Stats */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/30">
                    <div className="flex justify-around text-center">
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{gameHistory.length}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Games</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {gameHistory.filter(g => g.result?.winner === currentUserId).length}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Wins</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {gameHistory.filter(g => g.result?.winner && g.result.winner !== currentUserId && !g.result.isDraw).length}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Losses</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameHistoryPanel;
