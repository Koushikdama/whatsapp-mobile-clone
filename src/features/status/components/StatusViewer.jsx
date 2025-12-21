
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, Send, ChevronUp, Trash2, Eye } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';

// StatusViewerProps removed

const REACTIONS = ["😂", "😮", "😍", "😢", "👏", "🔥", "🙏", "🎉"];

// Mock viewers data since backend integration isn't fully mocked for this granularity
// Dynamic mock viewers generator
const generateMockViewers = () => {
    const baseViewers = [
        { id: 'u1', name: 'Alice Johnson', time: 'Just now' },
        { id: 'u2', name: 'Bob Smith', time: '2 minutes ago' },
        { id: 'u3', name: 'Carol Danvers', time: '5 minutes ago' },
        { id: 'u4', name: 'David Goggins', time: '10 minutes ago' },
        { id: 'u5', name: 'Eve Polastri', time: '12 minutes ago' },
        { id: 'u6', name: 'Fiona Gallagher', time: '15 minutes ago' },
        { id: 'u7', name: 'George Costanza', time: 'Today, 10:15 AM' },
        { id: 'u8', name: 'Hannah Lee', time: 'Today, 10:30 AM' }
    ];
    // Randomize count between 2 and 8
    const count = Math.floor(Math.random() * 6) + 2;
    return baseViewers.sort(() => 0.5 - Math.random()).slice(0, count);
};

const StatusViewer = ({ updates, initialIndex, onClose }) => {
    const { users, startChat, addMessage, currentUserId, deleteStatusUpdate } = useApp();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [showViewersList, setShowViewersList] = useState(false);
    const [viewers] = useState(() => generateMockViewers());
    const inputRef = useRef(null);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        setProgress(0);
        // Don't auto-advance if replying or viewing viewer list
        if (isReplying || showViewersList) return;

        const intervalTime = 30;
        const duration = 5000;
        const step = 100 / (duration / intervalTime);

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + step;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, [currentIndex, updates.length, isReplying, showViewersList]);

    // Focus input when replying starts
    useEffect(() => {
        if (isReplying && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isReplying]);

    const handleNext = () => {
        if (currentIndex < updates.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleReplyClick = (e) => {
        e.stopPropagation();
        setIsReplying(true);
    };

    const handleSendReply = (text = replyText) => {
        if (!text.trim()) return;
        const update = updates[currentIndex];
        // Find chat ID for this user
        const chatId = startChat(update.userId);
        // Send message
        addMessage(chatId, `Replying to status: ${text}`, 'text');

        setReplyText('');
        setIsReplying(false);
    };

    const handleReaction = (emoji) => {
        handleSendReply(emoji);
    };

    const handleDelete = () => {
        const updateToDelete = updates[currentIndex];
        deleteStatusUpdate(updateToDelete.id);

        // If was last item, close
        if (updates.length === 1) {
            onClose();
        } else if (currentIndex === updates.length - 1) {
            // If deleted last item but others exist, go back
            setCurrentIndex(prev => prev - 1);
        }
        // Else auto advances to next due to re-render of updates prop logic in parent if updated
    };

    if (!updates || updates.length === 0 || !updates[currentIndex]) return null;

    const update = updates[currentIndex];
    const user = users[update.userId];
    const isMe = update.userId === currentUserId;
    if (!user && !isMe) return null;

    const bgImage = update.imageUrl || `https://picsum.photos/seed/${update.id}/600/1000`;
    const displayedUser = isMe ? { name: 'My Status', avatar: users[currentUserId].avatar } : user;

    return createPortal(
        <div className="fixed inset-0 left-0 right-0 top-0 bottom-0 w-screen h-screen z-[9999] bg-black flex flex-col animate-in fade-in duration-200 font-sans">
            <div className="flex gap-1 p-2 pt-4 absolute top-0 w-full z-20">
                {updates.map((_, idx) => (
                    <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-30 ease-linear"
                            style={{
                                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                            }}
                        />
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between px-4 py-8 z-20 text-white mt-4">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="md:hidden">
                        <ArrowLeft size={24} />
                    </button>
                    <img src={displayedUser.avatar} className="w-10 h-10 rounded-full border border-white" alt={displayedUser.name} />
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{displayedUser.name}</span>
                        <span className="text-xs opacity-80">{new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isMe && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <X size={24} className="cursor-pointer hidden md:block hover:opacity-80" onClick={onClose} />
                </div>
            </div>

            {/* Navigation Areas */}
            <div className="absolute inset-0 flex z-10">
                <div className="w-1/3 h-full" onClick={handlePrev}></div>
                <div className="w-2/3 h-full" onClick={handleNext}></div>
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-gray-900 pointer-events-none">
                <img src={bgImage} className="max-h-full max-w-full object-contain" alt="Status" />
                {update.caption && (
                    <div className="absolute bottom-32 w-full text-center text-white bg-black/50 p-4 backdrop-blur-sm">
                        {update.caption}
                    </div>
                )}
            </div>

            {/* Reply Section (For Others) */}
            {!isMe && (
                <div className={`absolute bottom-0 w-full z-30 transition-all duration-300 ${isReplying ? 'bg-black/80 backdrop-blur-md pb-4 pt-2 h-auto' : 'h-24 bg-gradient-to-t from-black/80 to-transparent'}`}>
                    {isReplying && (
                        <div className="flex justify-center gap-4 mb-4 animate-in slide-in-from-bottom-5 duration-300 px-4 flex-wrap">
                            {REACTIONS.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={(e) => { e.stopPropagation(); handleReaction(emoji); }}
                                    className="text-3xl hover:scale-125 transition-transform"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="px-4 w-full flex flex-col items-center">
                        {isReplying ? (
                            <div className="flex items-center gap-2 w-full max-w-lg">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Type a reply..."
                                    className="flex-1 bg-white/20 border border-white/30 rounded-full px-4 py-2 text-white placeholder:text-white/70 outline-none backdrop-blur-sm"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                    onBlur={() => !replyText && setIsReplying(false)}
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSendReply(); }}
                                    className="p-2 bg-wa-teal rounded-full text-white shadow-lg disabled:opacity-50"
                                    disabled={!replyText.trim()}
                                >
                                    <Send size={20} className="ml-0.5" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={handleReplyClick}
                                className="flex flex-col items-center gap-1 cursor-pointer opacity-80 hover:opacity-100 transition-opacity mb-4"
                            >
                                <ChevronUp size={20} className="text-white" />
                                <span className="text-white text-sm font-medium">Reply</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Views Section (For Me) */}
            {isMe && (
                <>
                    <div className="absolute bottom-8 w-full flex flex-col items-center gap-4 z-50 pointer-events-auto">
                        <div
                            onClick={(e) => { e.stopPropagation(); setShowViewersList(true); }}
                            className="flex items-center gap-2 text-white/90 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm cursor-pointer hover:bg-black/60 transition-colors"
                        >
                            <Eye size={16} />
                            <span className="text-sm font-medium">{viewers.length} views</span>
                        </div>
                    </div>

                    {/* Viewers Bottom Sheet */}
                    {showViewersList && (
                        <div className="absolute inset-x-0 bottom-0 top-20 z-[60] bg-white dark:bg-[#111b21] rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 flex flex-col">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-[#111b21] dark:text-gray-100 flex items-center gap-2">
                                    Viewed by {viewers.length}
                                </h3>
                                <button onClick={() => setShowViewersList(false)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full">
                                    <X size={20} className="text-gray-500 dark:text-gray-300" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {viewers.map((viewer) => {
                                    const vUser = Object.values(users).find(u => u.id === viewer.id) || { avatar: 'https://picsum.photos/200' };
                                    return (
                                        <div key={viewer.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                                            <img src={vUser.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-[#111b21] dark:text-gray-100">{viewer.name}</h4>
                                                <p className="text-xs text-[#667781] dark:text-gray-500">{viewer.time}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete();
                                        setShowViewersList(false);
                                    }}
                                    className="flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-6 py-2 rounded-full transition-colors font-medium"
                                >
                                    <Trash2 size={18} /> Delete Status Update
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>,
        document.body
    );
};

export default StatusViewer;
