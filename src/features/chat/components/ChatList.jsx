
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, CheckCheck, Pin, PinOff, Mic, Archive, Lock } from 'lucide-react';
import { formatTimestamp } from '../../../shared/utils/formatTime';
import { useApp } from '../../../shared/context/AppContext';
import { useWorkerChatSearch } from '../../../shared/hooks/useWorkerSearch';



const ChatList = () => {
    const navigate = useNavigate();
    const { chatId: activeChatId } = useParams();
    const { searchQuery, chats, messages, toggleArchiveChat, togglePinChat, securitySettings, users, chatSettings, drafts, onlineUsers } = useApp();
    const [activeFilter, setActiveFilter] = useState('all');
    const [isLockModalOpen, setIsLockModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    // Offload sorting and filtering to a Web Worker
    const { sortedChats } = useWorkerChatSearch({
        chats,
        users,
        searchQuery,
        activeFilter
    });

    const archivedCount = chats.filter(c => c.isArchived).length;

    const handleArchivedClick = () => {
        setIsLockModalOpen(true);
        setPin('');
        setError('');
    };

    const verifyPin = () => {
        const requiredPin = securitySettings.chatLockPassword || '0000';
        if (pin === requiredPin) {
            setIsLockModalOpen(false);
            navigate('/archived');
        } else {
            setError('Incorrect PIN');
            setPin('');
        }
    };

    const FilterPill = ({ label, value }) => (
        <button
            onClick={() => setActiveFilter(value)}
            className={`
            px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap shadow-sm backdrop-blur-sm
            ${activeFilter === value
                    ? 'bg-[#e7fce3] text-[#008069] dark:bg-[#00a884]/20 dark:text-[#00a884]'
                    : 'bg-[#f0f2f5]/80 text-[#54656f] hover:bg-[#e9edef] dark:bg-[#202c33]/80 dark:text-[#8696a0] dark:hover:bg-[#2a3942]'
                }
        `}
        >
            {label}
        </button>
    );

    const containerStyle = chatSettings.chatListBackgroundImage ? {
        backgroundImage: `url(${chatSettings.chatListBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
    } : {};

    return (
        <div
            className={`flex flex-col pb-4 min-h-full ${!chatSettings.chatListBackgroundImage ? 'bg-white dark:bg-wa-dark-bg' : ''}`}
            style={containerStyle}
        >
            {isLockModalOpen && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl w-full max-w-xs p-6 flex flex-col items-center">
                        <div className="w-12 h-12 bg-wa-teal rounded-full flex items-center justify-center mb-4 text-white">
                            <Lock size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-[#111b21] dark:text-gray-100 mb-2">Locked Chats</h3>
                        <p className="text-sm text-[#667781] dark:text-gray-400 mb-6 text-center">Enter PIN to access archived chats</p>

                        <input
                            type="password"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value);
                                setError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && verifyPin()}
                            className="w-full text-center text-2xl tracking-[0.5em] font-medium py-2 border-b-2 border-wa-teal bg-transparent outline-none mb-2 text-[#111b21] dark:text-gray-100 placeholder-transparent"
                            placeholder="****"
                            autoFocus
                        />

                        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

                        <div className="flex gap-3 w-full mt-4">
                            <button onClick={() => setIsLockModalOpen(false)} className="flex-1 py-2 text-wa-teal font-medium hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover rounded-full transition-colors">
                                Cancel
                            </button>
                            <button onClick={verifyPin} className="flex-1 py-2 bg-wa-teal text-white font-medium rounded-full shadow-sm hover:shadow-md transition-all">
                                Unlock
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* When bg image is set, add a subtle gradient overlay for better text contrast */}
            {chatSettings.chatListBackgroundImage && (
                <div className="fixed inset-0 bg-white/50 dark:bg-black/50 pointer-events-none z-0 backdrop-blur-[2px]"></div>
            )}

            <div className="relative z-10">
                {!searchQuery && (
                    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
                        <FilterPill label="All" value="all" />
                        <FilterPill label="Unread" value="unread" />
                        <FilterPill label="Groups" value="groups" />
                    </div>
                )}

                {!searchQuery && activeFilter === 'all' && archivedCount > 0 && (
                    <div
                        onClick={handleArchivedClick}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-wa-grayBg/80 dark:hover:bg-wa-dark-hover/80 transition-colors group backdrop-blur-sm bg-white/60 dark:bg-wa-dark-bg/60"
                    >
                        <div className="w-12 flex items-center justify-center shrink-0">
                            <Archive size={20} className="text-wa-teal dark:text-wa-teal group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 border-b border-wa-border dark:border-wa-dark-border pb-3 -mb-3 flex justify-between items-center">
                            <div className="font-medium text-[#111b21] dark:text-gray-100 text-[17px]">Archived</div>
                            <div className="text-[#008069] dark:text-[#00a884] text-xs font-medium mr-1">{archivedCount}</div>
                        </div>
                    </div>
                )}

                {sortedChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-[#667781] dark:text-gray-400 text-center px-4 relative z-10">
                        <p className="bg-white/80 dark:bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                            No chats found {searchQuery ? `matching "${searchQuery}"` : `in ${activeFilter}`}
                        </p>
                    </div>
                ) : (
                    sortedChats.map((chat) => {
                        const user = users[chat.contactId];
                        if (!user && !chat.isGroup) return null;

                        const chatMessages = messages[chat.id] || [];
                        const lastMsg = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;
                        const isTyping = chat.id === 'c1' && Math.random() > 0.8;
                        const isActive = chat.id === activeChatId;
                        const draft = drafts[chat.id];

                        return (
                            <div
                                key={chat.id}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors relative group 
                        ${isActive ? 'bg-[#f0f2f5]/90 dark:bg-[#2a3942]/90' : 'hover:bg-wa-grayBg/80 dark:hover:bg-wa-dark-hover/80 active:bg-[#e9edef]/80 dark:active:bg-wa-dark-paper/80'}
                        ${chatSettings.chatListBackgroundImage ? 'bg-white/70 dark:bg-black/60 mb-0.5 backdrop-blur-sm' : ''}
                    `}
                                onClick={() => navigate(`/chat/${chat.id}`)}
                            >
                                <div className="relative shrink-0">
                                    <img src={chat.isGroup ? 'https://picsum.photos/300' : user?.avatar} alt={user?.name} className="w-12 h-12 rounded-full object-cover" />
                                    {/* Online indicator for individual chats */}
                                    {!chat.isGroup && onlineUsers?.has(chat.contactId) && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-wa-dark-bg rounded-full"></div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col justify-center border-b border-wa-border dark:border-wa-dark-border pb-3 -mb-3 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className="text-[17px] text-[#111b21] dark:text-gray-100 font-normal truncate">
                                            {chat.isGroup ? chat.groupName : user?.name}
                                        </h3>
                                        <span className={`text-[12px] ${chat.unreadCount > 0 || draft ? 'text-wa-lightGreen font-medium' : 'text-[#667781] dark:text-gray-400'}`}>
                                            {formatTimestamp(chat.timestamp)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1 text-[14px] text-[#667781] dark:text-gray-400 truncate w-full pr-2">
                                            {draft ? (
                                                <span className="flex items-center gap-1 text-[#667781] dark:text-gray-400 truncate">
                                                    <span className="text-red-500 font-medium">Draft:</span> {draft}
                                                </span>
                                            ) : (
                                                <>
                                                    {lastMsg?.senderId === 'me' && !isTyping && (
                                                        lastMsg.status === 'read'
                                                            ? <CheckCheck size={16} className="text-wa-blue shrink-0" />
                                                            : <Check size={16} className="shrink-0" />
                                                    )}

                                                    {isTyping ? (
                                                        <span className="text-wa-lightGreen font-medium">typing...</span>
                                                    ) : (
                                                        <span className="truncate flex items-center gap-1">
                                                            {lastMsg?.type === 'voice' && <Mic size={14} />}
                                                            {lastMsg ? lastMsg.text : 'Start a conversation'}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            {chat.isPinned && <Pin size={16} className="text-[#667781] dark:text-gray-400 rotate-45" fill="currentColor" />}
                                            {chat.unreadCount > 0 && (
                                                <div className="w-5 h-5 rounded-full bg-wa-lightGreen flex items-center justify-center">
                                                    <span className="text-white text-[10px] font-bold">{chat.unreadCount}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 md:flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); togglePinChat(chat.id); }}
                                        className="bg-white dark:bg-wa-dark-paper shadow rounded-full p-1.5 text-wa-gray hover:text-wa-teal transition-colors"
                                        title={chat.isPinned ? "Unpin chat" : "Pin chat"}
                                    >
                                        {chat.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleArchiveChat(chat.id); }}
                                        className="bg-white dark:bg-wa-dark-paper shadow rounded-full p-1.5 text-wa-gray hover:text-wa-teal transition-colors"
                                        title="Archive chat"
                                    >
                                        <Archive size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <div className="h-20 md:hidden"></div>
        </div>
    );
};

export default ChatList;
