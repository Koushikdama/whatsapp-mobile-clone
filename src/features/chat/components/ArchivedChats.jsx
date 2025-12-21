
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, ArchiveRestore, Users, Lock } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import { formatTimestamp } from '../../../shared/utils/formatTime';

const ArchivedChats = () => {
    const navigate = useNavigate();
    const { chats, messages, toggleArchiveChat, users, securitySettings } = useApp();
    const [activeTab, setActiveTab] = useState('following');

    // Archive Action PIN modal (for unarchiving)
    const [archiveTarget, setArchiveTarget] = useState(null);
    const [archivePin, setArchivePin] = useState('');
    const [archiveError, setArchiveError] = useState('');

    // Locked Chat Access PIN modal
    const [lockedChatTarget, setLockedChatTarget] = useState(null);
    const [chatLockPin, setChatLockPin] = useState('');
    const [chatLockError, setChatLockError] = useState('');

    const archivedChats = chats.filter(c => c.isArchived);

    const filteredArchived = archivedChats.filter(chat => {
        if (activeTab === 'groups') {
            return chat.isGroup;
        }

        // For Following/Followers tabs, exclude groups
        if (chat.isGroup) return false;

        // Mock logic for Following vs Followers based on ID parity
        const contactIdNum = parseInt(chat.contactId.replace(/\D/g, '')) || 0;
        const isFollowing = contactIdNum % 2 !== 0;

        return activeTab === 'following' ? isFollowing : !isFollowing;
    });

    // Archive action handler - REQUIRES Archive Lock PIN
    const handleUnarchiveAction = (chatId) => {
        if (securitySettings.archiveLockPassword && securitySettings.archiveLockPassword !== '') {
            // Archive Lock is set, require PIN
            setArchiveTarget(chatId);
            setArchivePin('');
            setArchiveError('');
        } else {
            // No Archive Lock, toggle directly
            toggleArchiveChat(chatId);
        }
    };

    const verifyArchivePin = () => {
        const requiredPin = securitySettings.archiveLockPassword || '0000';
        if (archivePin === requiredPin) {
            toggleArchiveChat(archiveTarget);
            setArchiveTarget(null);
            setArchivePin('');
        } else {
            setArchiveError('Incorrect PIN');
            setArchivePin('');
        }
    };

    // Chat click handler - checks if locked
    const handleChatClick = (chat) => {
        if (chat.isLocked) {
            // Chat is locked, require Chat Lock PIN
            if (securitySettings.chatLockPassword && securitySettings.chatLockPassword !== '') {
                setLockedChatTarget(chat.id);
                setChatLockPin('');
                setChatLockError('');
            } else {
                // No Chat Lock password set, allow access
                navigate(`/chat/${chat.id}`);
            }
        } else {
            // Not locked, navigate directly
            navigate(`/chat/${chat.id}`);
        }
    };

    const verifyChatLockPin = () => {
        const requiredPin = securitySettings.chatLockPassword || '0000';
        if (chatLockPin === requiredPin) {
            navigate(`/chat/${lockedChatTarget}`);
            setLockedChatTarget(null);
            setChatLockPin('');
        } else {
            setChatLockError('Incorrect PIN');
            setChatLockPin('');
        }
    };

    const TabButton = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 text-sm font-medium uppercase transition-all relative ${activeTab === id
                ? 'text-wa-teal dark:text-wa-teal bg-white dark:bg-wa-dark-bg'
                : 'text-[#54656f] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
        >
            {label}
            {activeTab === id && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-wa-teal rounded-t-full"></span>
            )}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-white dark:bg-wa-dark-bg">
            {/* Archive Action PIN Modal */}
            {archiveTarget && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl w-full max-w-xs p-6 flex flex-col items-center">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-4 text-white">
                            <ArchiveRestore size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-[#111b21] dark:text-gray-100 mb-2">Archive Lock</h3>
                        <p className="text-sm text-[#667781] dark:text-gray-400 mb-6 text-center">Enter PIN to unarchive chat</p>

                        <input
                            type="password"
                            maxLength={4}
                            value={archivePin}
                            onChange={(e) => {
                                setArchivePin(e.target.value);
                                setArchiveError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && verifyArchivePin()}
                            className="w-full text-center text-2xl tracking-[0.5em] font-medium py-2 border-b-2 border-purple-500 bg-transparent outline-none mb-2 text-[#111b21] dark:text-gray-100 placeholder-transparent"
                            placeholder="****"
                            autoFocus
                        />

                        {archiveError && <p className="text-red-500 text-xs mb-4">{archiveError}</p>}

                        <div className="flex gap-3 w-full mt-4">
                            <button onClick={() => setArchiveTarget(null)} className="flex-1 py-2 text-purple-500 font-medium hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover rounded-full transition-colors">
                                Cancel
                            </button>
                            <button onClick={verifyArchivePin} className="flex-1 py-2 bg-purple-500 text-white font-medium rounded-full shadow-sm hover:shadow-md transition-all">
                                Unlock
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Locked Chat Access PIN Modal */}
            {lockedChatTarget && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl w-full max-w-xs p-6 flex flex-col items-center">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4 text-white">
                            <Lock size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-[#111b21] dark:text-gray-100 mb-2">Locked Chat</h3>
                        <p className="text-sm text-[#667781] dark:text-gray-400 mb-6 text-center">Enter PIN to access locked chat</p>

                        <input
                            type="password"
                            maxLength={4}
                            value={chatLockPin}
                            onChange={(e) => {
                                setChatLockPin(e.target.value);
                                setChatLockError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && verifyChatLockPin()}
                            className="w-full text-center text-2xl tracking-[0.5em] font-medium py-2 border-b-2 border-green-500 bg-transparent outline-none mb-2 text-[#111b21] dark:text-gray-100 placeholder-transparent"
                            placeholder="****"
                            autoFocus
                        />

                        {chatLockError && <p className="text-red-500 text-xs mb-4">{chatLockError}</p>}

                        <div className="flex gap-3 w-full mt-4">
                            <button onClick={() => setLockedChatTarget(null)} className="flex-1 py-2 text-green-500 font-medium hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover rounded-full transition-colors">
                                Cancel
                            </button>
                            <button onClick={verifyChatLockPin} className="flex-1 py-2 bg-green-500 text-white font-medium rounded-full shadow-sm hover:shadow-md transition-all">
                                Unlock
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div className="h-[60px] bg-wa-teal dark:bg-wa-dark-header flex items-center gap-3 px-4 text-white shrink-0 shadow-sm md:bg-wa-grayBg md:border-b md:border-wa-border md:dark:border-wa-dark-border md:text-black md:dark:text-white transition-colors">
                <button onClick={() => navigate('/chats')} className="p-1 -ml-2 rounded-full active:bg-black/10">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-medium md:text-lg">Archived</h2>
            </div>

            <div className="flex border-b border-wa-border dark:border-wa-dark-border bg-white dark:bg-wa-dark-bg shrink-0">
                <TabButton id="following" label="Following" />
                <TabButton id="followers" label="Followers" />
                <TabButton id="groups" label="Groups" />
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
                {filteredArchived.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#667781] dark:text-gray-400 p-8 text-center">
                        <div className="w-20 h-20 bg-wa-grayBg dark:bg-wa-dark-header rounded-full flex items-center justify-center mb-4">
                            <Archive size={32} className="opacity-40" />
                        </div>
                        <p className="text-sm">No archived chats in {activeTab}</p>
                    </div>
                ) : (
                    filteredArchived.map(chat => {
                        const user = users[chat.contactId];
                        const chatMessages = messages[chat.id] || [];
                        const lastMsg = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;

                        return (
                            <div key={chat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover cursor-pointer active:bg-[#e9edef] dark:active:bg-wa-dark-paper transition-colors group relative">
                                <div
                                    className="relative shrink-0"
                                    onClick={() => handleChatClick(chat)}
                                >
                                    {chat.isGroup ? (
                                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center grayscale opacity-80">
                                            <Users size={24} className="text-gray-500 dark:text-gray-400" />
                                        </div>
                                    ) : (
                                        <img src={user?.avatar || 'https://picsum.photos/300'} alt={user?.name || chat.groupName} className="w-12 h-12 rounded-full object-cover grayscale opacity-80" />
                                    )}
                                    {/* Lock indicator for locked chats */}
                                    {chat.isLocked && (
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border border-white dark:border-wa-dark-bg">
                                            <Lock size={10} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="flex-1 border-b border-wa-border dark:border-wa-dark-border pb-3 -mb-3 min-w-0"
                                    onClick={() => handleChatClick(chat)}
                                >
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className="text-[17px] text-[#111b21] dark:text-gray-100 font-normal truncate">
                                            {chat.isGroup ? chat.groupName : user?.name}
                                        </h3>
                                        <span className="text-[12px] text-[#667781] dark:text-gray-400">
                                            {formatTimestamp(chat.timestamp)}
                                        </span>
                                    </div>
                                    <div className="text-[14px] text-[#667781] dark:text-gray-400 truncate">
                                        {lastMsg ? lastMsg.text : 'No messages'}
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleUnarchiveAction(chat.id); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-wa-dark-paper shadow-md rounded-full text-purple-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex"
                                    title="Unarchive"
                                >
                                    <ArchiveRestore size={18} />
                                </button>
                            </div>
                        );
                    })
                )}

                <div className="px-8 py-6 text-center text-xs text-[#667781] dark:text-gray-500">
                    Archived chats will remain archived when you receive a new message if you change your settings.
                </div>
            </div>
        </div>
    );
};

export default ArchivedChats;
