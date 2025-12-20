import React from 'react';
import { ArrowLeft, Star, ChevronRight, Image as ImageIcon, Mic, BarChart2 } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import { formatTimestamp } from '../../../shared/utils/formatTime';

const StarredMessagesScreen = ({ onClose }) => {
    const { chats, messages, users, currentUserId } = useApp();

    // Aggregate all starred messages
    const starredMessages = [];
    Object.keys(messages).forEach(chatId => {
        const chatMessages = messages[chatId];
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        chatMessages.forEach(msg => {
            if (msg.isStarred) {
                starredMessages.push({
                    ...msg,
                    chatId,
                    chatName: chat.isGroup ? chat.groupName : (users[chat.contactId]?.name || 'Unknown'),
                    chatAvatar: chat.isGroup ? 'https://picsum.photos/300' : (users[chat.contactId]?.avatar)
                });
            }
        });
    });

    // Sort by date desc
    starredMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
        <div className="absolute inset-0 z-20 bg-white dark:bg-wa-dark-bg flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="h-[60px] bg-wa-teal dark:bg-wa-dark-header flex items-center px-4 shrink-0 shadow-sm text-white">
                <button onClick={onClose} className="mr-3 p-1 rounded-full active:bg-white/10">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-medium">Starred Messages</h2>
            </div>

            <div className="flex-1 overflow-y-auto bg-wa-bg dark:bg-wa-dark-bg p-4 flex flex-col gap-2">
                {starredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#667781] dark:text-gray-500 gap-4 mt-20">
                        <div className="w-32 h-32 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                            <Star size={48} className="text-[#667781] opacity-50" />
                        </div>
                        <p className="font-medium text-lg">No starred messages yet.</p>
                        <p className="text-sm text-center px-10 text-[#667781]">Tap and hold on any message to star it, so you can easily find it later.</p>
                    </div>
                ) : (
                    starredMessages.map(msg => (
                        <div key={msg.id} className="bg-white dark:bg-wa-dark-paper rounded-lg p-3 shadow-sm border border-wa-border dark:border-white/5 flex flex-col gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    <img src={msg.chatAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                    <span className="text-xs font-bold text-[#111b21] dark:text-gray-200">{msg.chatName}</span>
                                    <span className="text-[10px] text-[#667781] dark:text-gray-500">• {formatTimestamp(msg.timestamp)}</span>
                                </div>
                                <ChevronRight size={16} className="text-[#667781] dark:text-gray-500" />
                            </div>

                            {/* Message Content Preview */}
                            <div className="text-sm text-[#111b21] dark:text-gray-100 pl-8">
                                {msg.type === 'text' && msg.text}
                                {msg.type === 'image' && <div className="flex items-center gap-1 italic text-gray-500"><ImageIcon size={14} /><span className="text-xs">Photo</span></div>}
                                {msg.type === 'video' && <div className="flex items-center gap-1 italic text-gray-500"><ImageIcon size={14} /><span className="text-xs">Video</span></div>}
                                {msg.type === 'voice' && <div className="flex items-center gap-1 italic text-gray-500"><Mic size={14} /><span className="text-xs">Voice Message</span></div>}
                                {msg.pollData && <div className="flex items-center gap-1 italic text-gray-500"><BarChart2 size={14} /><span className="text-xs">Poll: {msg.pollData.question}</span></div>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StarredMessagesScreen;
