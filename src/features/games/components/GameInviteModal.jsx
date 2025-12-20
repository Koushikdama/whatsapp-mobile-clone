import React from 'react';
import { createPortal } from 'react-dom';
import { X, Gamepad2, Dice5, Trophy } from 'lucide-react';



const GameOption = ({
    icon,
    title,
    desc,
    onClick,
    color
}) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-wa-dark-header border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-wa-dark-hover transition-all active:scale-95 group"
    >
        <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <h3 className="text-[#111b21] dark:text-gray-100 font-medium mb-1">{title}</h3>
        <p className="text-xs text-[#667781] dark:text-gray-400 text-center">{desc}</p>
    </button>
);

const GameInviteModal = ({ isOpen, isGroup, onClose, onSelectGame }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-wa-dark-paper w-full md:w-[450px] md:rounded-2xl rounded-t-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium text-[#111b21] dark:text-gray-100">Start a Game</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-wa-dark-hover rounded-full transition-colors">
                        <X size={24} className="text-[#54656f] dark:text-gray-400" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    {!isGroup && (
                        <GameOption
                            icon={<Trophy size={24} />}
                            title="Chess"
                            desc="Play standard chess"
                            color="bg-purple-500"
                            onClick={() => onSelectGame('chess')}
                        />
                    )}
                    <GameOption
                        icon={<Dice5 size={24} />}
                        title="Ludo"
                        desc="Classic board game"
                        color="bg-red-500"
                        onClick={() => onSelectGame('ludo')}
                    />
                    <GameOption
                        icon={<Gamepad2 size={24} />}
                        title="Snake & Ladders"
                        desc="Board game with snakes"
                        color="bg-green-500"
                        onClick={() => onSelectGame('snake')}
                    />
                    <GameOption
                        icon={<span className="text-xl font-bold">#</span>}
                        title="Tic-Tac-Toe"
                        desc="Classic 3x3 game"
                        color="bg-blue-600"
                        onClick={() => onSelectGame('tictactoe')}
                    />
                </div>

                <p className="text-center text-xs text-[#667781] dark:text-gray-500">
                    Games are played in real-time. {isGroup ? 'Group members can watch or join.' : 'Your opponent will be invited instantly.'}
                </p>
            </div>
        </div>,
        document.body
    );
};

export default GameInviteModal;