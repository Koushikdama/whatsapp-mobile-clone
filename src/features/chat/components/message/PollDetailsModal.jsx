import React from 'react';
import { X, Check } from 'lucide-react';
import { useApp } from '../../../../shared/context/AppContext';

const PollDetailsModal = ({ pollData, onClose }) => {
    const { users, currentUserId } = useApp();
    const { question, options } = pollData;
    const totalVotes = options.reduce((acc, opt) => acc + opt.voters.length, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-wa-dark-paper w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 bg-wa-grayBg dark:bg-wa-dark-header border-b border-wa-border dark:border-wa-dark-border">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                        <X size={24} className="text-[#54656f] dark:text-gray-300" />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-lg font-medium text-[#111b21] dark:text-gray-100">Poll details</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4">
                    <h3 className="text-xl font-medium text-[#111b21] dark:text-gray-100 mb-6">{question}</h3>

                    <div className="space-y-6">
                        {options.map(opt => {
                            const percentage = totalVotes > 0 ? Math.round((opt.voters.length / totalVotes) * 100) : 0;
                            const isVotedByMe = opt.voters.includes(currentUserId);

                            return (
                                <div key={opt.id}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-[#111b21] dark:text-gray-100">{opt.text}</span>
                                            {isVotedByMe && (
                                                <div className="bg-wa-teal/10 dark:bg-wa-teal/20 text-wa-teal text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                                                    You
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-[#111b21] dark:text-gray-100">{opt.voters.length}</span>
                                            <span className="text-xs text-[#667781] dark:text-gray-500">votes</span>
                                        </div>
                                    </div>

                                    <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mb-3">
                                        <div
                                            className="h-full bg-wa-teal transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>

                                    {/* Voters List */}
                                    <div className="space-y-3 pl-2">
                                        {opt.voters.map(voterId => {
                                            const voter = users[voterId];
                                            if (!voter) return null;
                                            return (
                                                <div key={voterId} className="flex items-center gap-3">
                                                    <img src={voter.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    <span className="text-sm text-[#111b21] dark:text-gray-200">
                                                        {voterId === currentUserId ? 'You' : voter.name}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        {opt.voters.length === 0 && (
                                            <div className="text-xs text-gray-400 italic pl-1">No votes yet</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PollDetailsModal;
