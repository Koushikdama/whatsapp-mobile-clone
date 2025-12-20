import React, { useState } from 'react';
import { Compass, BadgeCheck, ChevronUp, ChevronDown } from 'lucide-react';

const ChannelSuggestions = ({ channels, isExpanded, onToggle, searchQuery }) => {
    if (searchQuery) return null;

    return (
        <div className="border-t border-wa-border dark:border-wa-dark-border mt-4">
            <div
                onClick={onToggle}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600">
                        <Compass size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-[17px] text-[#111b21] dark:text-gray-200 font-medium">Suggestions</h3>
                        <p className="text-[13px] text-[#667781] dark:text-gray-500">Find channels to follow</p>
                    </div>
                </div>
                <div className="text-[#667781] dark:text-gray-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {isExpanded && (
                <div className="animate-in slide-in-from-top-2 duration-200 pb-4">
                    <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
                        {channels.map(channel => (
                            <div key={channel.id} className="w-[140px] shrink-0 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col items-center gap-3 bg-white dark:bg-wa-dark-paper shadow-sm transition-transform hover:scale-[1.02] cursor-pointer">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full p-0.5 border border-gray-100 dark:border-gray-600 bg-white">
                                        <img src={channel.avatar} alt={channel.name} className="w-full h-full rounded-full object-cover" />
                                    </div>
                                    {channel.isVerified && (
                                        <div className="absolute bottom-0 right-0 bg-white dark:bg-wa-dark-paper rounded-full p-[2px]">
                                            <BadgeCheck size={18} className="text-[#008069] fill-white dark:fill-wa-dark-paper" />
                                        </div>
                                    )}
                                </div>

                                <div className="text-center w-full">
                                    <h4 className="text-sm font-medium text-[#111b21] dark:text-gray-100 truncate leading-tight mb-0.5">{channel.name}</h4>
                                    <p className="text-[11px] text-[#667781] dark:text-gray-500 truncate">{channel.followers}</p>
                                </div>

                                <button className="w-full py-1.5 bg-[#dcf8c6] text-[#008069] dark:bg-[#005c4b]/30 dark:text-[#00a884] hover:brightness-95 transition-all rounded-full text-sm font-medium">
                                    Follow
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end px-4 mt-2">
                        <button className="text-wa-teal hover:opacity-80 text-sm font-medium transition-opacity">See all</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChannelSuggestions;
