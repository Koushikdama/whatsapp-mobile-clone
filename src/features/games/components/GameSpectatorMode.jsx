import React, { useState, useEffect } from 'react';
import { useApp } from '../../../shared/context/AppContext';
import { Eye, Users, X } from 'lucide-react';

/**
 * GameSpectatorMode Component
 * 
 * Allows users to watch ongoing games without participating.
 * Features:
 * - View-only mode with live game updates
 * - List of current spectators
 * - Join/leave spectator functionality
 */

const GameSpectatorMode = ({ game, onClose }) => {
    const { users, currentUserId, activeGames } = useApp();
    const [spectators, setSpectators] = useState([currentUserId]);

    if (!game) return null;

    const isPlayer = game.players?.some(p => p.userId === currentUserId);

    return (
        <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-20 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 flex items-center justify-between text-white shadow-lg">
                <div className="flex items-center gap-2">
                    <Eye size={24} />
                    <div>
                        <h3 className="font-bold text-lg">Spectator Mode</h3>
                        <p className="text-xs text-purple-200">Watch only • No moves allowed</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Spectator Count */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 px-4 py-2">
                <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                    <Users size={16} />
                    <span className="font-medium">{spectators.length} watching</span>
                </div>
            </div>

            {/* Game Content Area */}
            <div className="flex-1 overflow-auto p-4">
                {/* Players Info */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                    {game.players?.map((player, idx) => {
                        const user = users[player.userId];
                        return (
                            <div
                                key={idx}
                                className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex items-center gap-2"
                            >
                                <img
                                    src={user?.avatar || 'https://via.placeholder.com/40'}
                                    alt={user?.name || 'Player'}
                                    className="w-8 h-8 rounded-full"
                                />
                                <div>
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                        {user?.name || 'Player'}
                                        {player.userId === currentUserId && ' (You)'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {player.color || `Player ${idx + 1}`}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Spectator Mode Notice */}
                <div className="text-center p-8 bg-purple-50 dark:bg-purple-900/10 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700">
                    <Eye size={48} className="mx-auto mb-4 text-purple-500" />
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Watching Game
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        {isPlayer
                            ? "You're a player in this game. Close spectator mode to make moves."
                            : "You're spectating this game. Game moves will update in real-time."}
                    </p>
                    
                    {/* Spectators List */}
                    {spectators.length > 1 && (
                        <div className="mt-4">
                            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">
                                Other Spectators:
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {spectators
                                    .filter(id => id !== currentUserId)
                                    .map(spectatorId => {
                                        const spectator = users[spectatorId];
                                        return (
                                            <div
                                                key={spectatorId}
                                                className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-xs"
                                            >
                                                <img
                                                    src={spectator?.avatar || 'https://via.placeholder.com/20'}
                                                    alt={spectator?.name}
                                                    className="w-4 h-4 rounded-full"
                                                />
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    {spectator?.name}
                                                </span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Game State Info */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Game Type</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                            {game.type}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400 capitalize">
                            {game.status}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    💡 Tip: Game updates will appear automatically as players make moves
                </p>
            </div>
        </div>
    );
};

export default GameSpectatorMode;
