import React from 'react';
import { Check } from 'lucide-react';

const PollMessage = ({ msg, onVote, currentUserId, onViewVotes }) => {
    if (!msg.pollData) return null;

    const { question, options, allowMultiple } = msg.pollData;
    const totalVotes = options.reduce((acc, opt) => acc + opt.voters.length, 0);

    const handleOptionClick = (optionId) => {
        const currentVotedOptions = options.filter(o => o.voters.includes(currentUserId)).map(o => o.id);
        let newSelection = [];

        if (allowMultiple) {
            if (currentVotedOptions.includes(optionId)) {
                newSelection = currentVotedOptions.filter(id => id !== optionId);
            } else {
                newSelection = [...currentVotedOptions, optionId];
            }
        } else {
            if (currentVotedOptions.includes(optionId)) {
                newSelection = [];
            } else {
                newSelection = [optionId];
            }
        }
        onVote(msg.id, newSelection);
    };

    return (
        <div className="min-w-[280px]">
            <h3 className="text-base text-[#111b21] dark:text-gray-100 font-medium mb-3">{question}</h3>
            {allowMultiple && <p className="text-xs text-gray-500 mb-2">Select one or more</p>}
            <div className="space-y-2">
                {options.map(opt => {
                    const isSelected = opt.voters.includes(currentUserId);
                    const percentage = totalVotes === 0 ? 0 : Math.round((opt.voters.length / totalVotes) * 100);

                    return (
                        <div
                            key={opt.id}
                            className="relative cursor-pointer group"
                            onClick={() => handleOptionClick(opt.id)}
                        >
                            <div className="flex justify-between text-sm mb-1 text-[#111b21] dark:text-gray-100 relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-wa-teal border-wa-teal' : 'border-gray-400'}`}>
                                        {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <span>{opt.text}</span>
                                </div>
                                {opt.voters.length > 0 && <span className="font-medium">{percentage}%</span>}
                            </div>
                            <div className="h-6 w-full bg-gray-100 dark:bg-white/10 rounded-lg overflow-hidden relative">
                                <div
                                    className="h-full bg-wa-teal/20 dark:bg-wa-teal/30 transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                                <div className="absolute inset-0 flex items-center px-2 justify-between pointer-events-none">
                                    {/* Avatar stack would go here */}
                                    <div className="flex -space-x-1">
                                        {opt.voters.slice(0, 3).map((v, i) => (
                                            <div key={i} className="w-4 h-4 rounded-full bg-gray-300 ring-1 ring-white"></div>
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-gray-500">{opt.voters.length} votes</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div
                className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 text-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-b-lg -mx-2 -mb-2 py-2"
                onClick={onViewVotes}
            >
                <span className="text-xs text-wa-teal font-medium">View Votes</span>
            </div>
        </div>
    );
};

export default PollMessage;
