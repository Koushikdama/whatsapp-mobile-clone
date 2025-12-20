import React, { useState } from 'react';
import { pollService } from '../../../../services/PollService';
import { useApp } from '../../../../shared/context/AppContext';

const PollBubble = ({ pollId }) => {
    // In a real app we'd subscribe to the poll ID. 
    // Here we'll read from service (which mocks the DB) and use local state for immediate updates.

    // NOTE: This assumes the poll object is passed or we look it up.
    // If only pollId is passed, we fetch it.

    const [poll, setPoll] = useState(pollService.getPoll(pollId));
    const { currentUserId } = useApp();

    if (!poll) return <div className="p-3 bg-red-100 text-red-500 rounded-lg">Poll not found</div>;

    const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes.length, 0);

    const handleVote = (optionId) => {
        const updatedPoll = pollService.vote(poll.id, optionId, currentUserId);
        if (updatedPoll) {
            setPoll(updatedPoll);
        }
    };

    return (
        <div className="w-full min-w-[240px] max-w-[320px] select-none">
            <div className="mb-3">
                <h3 className="text-[17px] font-medium text-[#111b21] dark:text-gray-100 leading-tight">
                    {poll.question}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                    {poll.allowMultipleAnswers ? 'Select one or more' : 'Select one'}
                </span>
            </div>

            <div className="space-y-2">
                {poll.options.map(opt => {
                    const isVoted = opt.votes.includes(currentUserId);
                    const voteCount = opt.votes.length;
                    const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);

                    return (
                        <div
                            key={opt.id}
                            onClick={() => handleVote(opt.id)}
                            className="cursor-pointer group relative"
                        >
                            {/* Progress Bar Background */}
                            <div className="absolute inset-0 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden">
                                <div
                                    className="h-full bg-wa-teal/20 dark:bg-wa-teal/10 transition-all duration-500 ease-out"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>

                            <div className="relative flex items-center justify-between p-3 z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                         ${isVoted ? 'border-wa-teal bg-wa-teal text-white' : 'border-gray-400 dark:border-gray-500 bg-transparent group-hover:border-gray-500'}
                                     `}>
                                        {isVoted && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <span className="text-[15px] text-[#111b21] dark:text-gray-100 font-medium">
                                        {opt.text}
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {voteCount > 0 && <span>{voteCount}</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-white/10 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{totalVotes} votes</span>
                <span>View votes</span>
            </div>
        </div>
    );
};

export default PollBubble;
