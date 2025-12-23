import React from 'react';
import { useApp } from '../../../shared/context/AppContext';
import { Gamepad2, Play, UserPlus } from 'lucide-react';

const GameInviteBubble = ({ message }) => {
    const { joinGame, currentUserId, users } = useApp();

    // Extract payload from pollData (reused as payload) or equivalent
    const payload = message.pollData || {};
    const { gameType, roomId, status, hostId } = payload;

    const isMe = message.senderId === currentUserId;
    const isHost = hostId === currentUserId;

    const getGameTitle = (type) => {
        switch (type) {
            case 'chess': return 'Chess Master';
            case 'ludo': return 'Ludo King';
            case 'snake': return 'Snake & Ladders';
            default: return 'Game';
        }
    };

    const handleJoin = () => {
        // Pass the full payload so joinGame can reconstruct the room if needed
        joinGame(gameType, roomId, message.chatId, payload);
    };

    return (
        <div className="bg-white dark:bg-wa-dark-paper rounded-lg overflow-hidden shadow-sm max-w-[300px] border border-black/5 dark:border-white/5">
            {/* Header */}
            <div className="bg-gradient-to-r from-wa-teal to-teal-600 p-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                    <Gamepad2 size={20} />
                    <span className="font-bold text-sm tracking-wide">{getGameTitle(gameType)}</span>
                </div>
                <div className="text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {status === 'active' ? 'Live' : 'Invite'}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-4xl shadow-inner">
                    {gameType === 'chess' && '♟️'}
                    {gameType === 'ludo' && '🎲'}
                    {gameType === 'snake' && '🐍'}
                </div>

                <div className="text-center">
                    <h3 className="text-[#111b21] dark:text-gray-100 font-medium text-sm">
                        {isMe ? 'You invited others to play' : `${users[message.senderId]?.name || 'Someone'} invited you to play`}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {status === 'pending' ? 'Waiting for players...' : 'Game in progress'}
                    </p>
                </div>

                {/* Action Button */}
                {status === 'pending' && (
                    <button
                        onClick={handleJoin}
                        className={`w-full py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 bg-wa-teal text-white hover:bg-teal-600 shadow-md hover:shadow-lg active:scale-95`}
                    >
                        {isMe ? (
                            <>
                                <Play size={16} fill="currentColor" />
                                Enter Game
                            </>
                        ) : (
                            <>
                                <Play size={16} fill="currentColor" />
                                Join Game
                            </>
                        )}
                    </button>
                )}

                {status === 'active' && (
                    <button
                        onClick={handleJoin}
                        className="w-full py-2 rounded-lg font-bold text-sm bg-wa-teal text-white hover:bg-teal-600 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                        <Gamepad2 size={16} /> Return to Game
                    </button>
                )}
            </div>

            {/* Footer info */}
            <div className="px-4 pb-2 text-[10px] text-center text-gray-400">
                Room ID: {roomId?.slice(-6)}
            </div>
        </div>
    );
};

export default GameInviteBubble;
