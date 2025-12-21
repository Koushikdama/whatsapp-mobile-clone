
import React, { useRef, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
    ArrowLeft, MoreVertical, Phone, Video as VideoIcon, Search, Smile, Paperclip, Mic, Send,
    Check, CheckCheck, Reply, Trash2, Star, Forward, Info, X,
    Languages, Pin, Lock, ArrowUp, ArrowDown, CheckSquare, Globe,
    FileText, Camera, Image as ImageIcon, Headphones, MapPin, User, BarChart2, PenTool, Link as LinkIcon,
    Crop, Type, Sliders, Plus, Gamepad2
} from 'lucide-react';
import { useChatWindowController } from '../hooks/useChatWindowController';
import { useApp } from '../../../shared/context/AppContext';
import MediaCarousel from '../../../shared/components/media/MediaCarousel';
import VideoMessage from '../../../shared/components/media/VideoMessage';
import DrawingCanvas from '../../../shared/components/media/DrawingCanvas';
import PollCreator from '../../../shared/components/media/PollCreator';
import MediaEditor from '../../../shared/components/media/MediaEditor';
import GameInviteBubble from '../../games/components/GameInviteBubble';
import TypingIndicator from './TypingIndicator';
import { formatLastSeen } from '../../../shared/utils/dateUtils';
import EmojiPicker from '../../../shared/components/input/EmojiPicker';
import { useVoiceRecorder } from '../../../shared/hooks/useVoiceRecorder';
import VoiceMessagePlayer from '../../../shared/components/media/VoiceMessagePlayer';
import { useMentions } from '../../../shared/hooks/useMentions';
import MentionAutocomplete from '../../../shared/components/input/MentionAutocomplete';
import AdvancedSearchPanel from './AdvancedSearchPanel';
import PollMessage from './message/PollMessage';
import LinkPreview from './message/LinkPreview';
import PollDetailsModal from './message/PollDetailsModal';
import { combineFormatting } from '../../../shared/components/text/MessageFormatting';
import AttachmentMenu from './AttachmentMenu';
import MessageList from './MessageList';
import ThreadView from './threading/ThreadView';
import { translateText } from '../../../services/TranslationService';
import DeleteMessageModal from './DeleteMessageModal';
import EmptyChatState from '../../../shared/components/chat/EmptyChatState';


const REACTIONS_LIST = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// Synchronous wrapper for async translation
// Returns a placeholder immediately and text will update when translation completes
const mockTranslate = (text, lang) => {
    // This is a synchronous placeholder that returns the original text
    // The actual translation happens in the message bubble component
    return text;
};


const ChatWindow = () => {
    const location = useLocation();
    const ctrl = useChatWindowController();
    const { toggleStarMessage, deleteForMe, deleteForEveryone, canDeleteForEveryone, hiddenMessages, isFollowing } = useApp();
    const fileInputRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [viewingPoll, setViewingPoll] = useState(null);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);

    // Media Preview State
    const [previewMedia, setPreviewMedia] = useState(null);

    // Phase 2: Voice Recording
    const voiceRecorder = useVoiceRecorder();
    const inputRef = useRef(null);

    // Phase 2: @Mentions
    const mentions = useMentions();
    const [mentionTrigger, setMentionTrigger] = useState(null);

    // Phase 2: Advanced Search
    const [selectedSearchResult, setSelectedSearchResult] = useState(null);



    // Delete handlers
    const handleDeleteForMe = () => {
        if (messageToDelete) {
            deleteForMe(ctrl.chatId, [messageToDelete.id]);
            ctrl.setActiveMessageId(null);
        }
    };

    const handleDeleteForEveryone = () => {
        if (messageToDelete) {
            deleteForEveryone(ctrl.chatId, [messageToDelete.id]);
            ctrl.setActiveMessageId(null);
        }
    };

    const canDeleteMsgForEveryone = messageToDelete ? canDeleteForEveryone(messageToDelete.timestamp) : false;
    const timeWarning = !canDeleteMsgForEveryone && messageToDelete
        ? "You can only delete for everyone within 1 hour of sending the message."
        : null;

    // If chat doesn't exist in state, create a temporary one for new chats
    // This matches WhatsApp behavior - show empty chat instead of "not found"
    const effectiveChat = useMemo(() => {
        if (ctrl.chat) return ctrl.chat;

        // Check if we have contact info from navigation state
        const navState = location.state;
        if (ctrl.chatId && navState?.contactId) {
            return {
                id: ctrl.chatId,
                type: 'individual',
                contactId: navState.contactId,
                isGroup: false,
                participants: [ctrl.currentUserId, navState.contactId],
                unreadCount: 0
            };
        }

        // Try to extract user info from chatId as fallback
        if (ctrl.chatId) {
            const parts = ctrl.chatId.split('_');

            // Try to find the other user ID
            let otherUserId = null;
            for (const part of parts) {
                if (part !== 'chat' &&
                    part !== 'me' &&
                    isNaN(part) &&
                    part !== ctrl.currentUserId &&
                    ctrl.users[part]) {
                    otherUserId = part;
                    break;
                }
            }

            if (otherUserId) {
                return {
                    id: ctrl.chatId,
                    type: 'individual',
                    contactId: otherUserId,
                    isGroup: false,
                    participants: [ctrl.currentUserId, otherUserId],
                    unreadCount: 0
                };
            }

            // Create minimal chat object
            return {
                id: ctrl.chatId,
                type: 'individual',
                contactId: null,
                isGroup: false,
                participants: [ctrl.currentUserId],
                unreadCount: 0
            };
        }

        return null;
    }, [ctrl.chat, ctrl.chatId, ctrl.currentUserId, ctrl.users, location.state]);

    const effectiveContact = useMemo(() => {
        if (effectiveChat && !effectiveChat.isGroup) {
            // First try navigation state
            const navState = location.state;
            if (navState?.contactId && navState.contactId === effectiveChat.contactId) {
                return {
                    id: navState.contactId,
                    name: navState.contactName || 'User',
                    avatar: navState.contactAvatar,
                    about: navState.contactAbout || 'Hey there! I am using WhatsApp.'
                };
            }

            // Then try users from context
            if (effectiveChat.contactId) {
                return ctrl.users[effectiveChat.contactId];
            }
        }
        return null;
    }, [effectiveChat, ctrl.users, location.state]);

    // Only show error if we truly can't create a chat interface
    if (!effectiveChat) return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-wa-bg">
            <p>Unable to load chat</p>
            <button onClick={ctrl.navigateToChats} className="mt-4 text-wa-teal">Go back</button>
        </div>
    );

    // Use effectiveChat and effectiveContact instead of ctrl.chat and ctrl.contact
    const displayChat = effectiveChat;
    const displayContact = effectiveContact;

    const filteredMessages = ctrl.messageSearchQuery
        ? ctrl.chatMessages.filter(m => m.text.toLowerCase().includes(ctrl.messageSearchQuery.toLowerCase()))
        : ctrl.chatMessages;

    // Filter out hidden messages (Delete for Me)
    const visibleMessages = filteredMessages.filter(msg => {
        const chatHidden = hiddenMessages[ctrl.chatId] || [];
        return !chatHidden.includes(msg.id);
    });





    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAttachmentSelect = (type) => {
        if (!fileInputRef.current) return;

        if (type === 'gallery' || type === 'camera') {
            fileInputRef.current.accept = "image/*,video/*";
            fileInputRef.current.click();
        } else if (type === 'document') {
            fileInputRef.current.accept = "*/*";
            fileInputRef.current.click();
        } else if (type === 'draw') {
            setIsDrawing(true);
        } else if (type === 'poll') {
            setIsPolling(true);
        } else if (type === 'location') {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    // Use a standardized Google Maps URL 
                    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                    ctrl.addMessage(ctrl.chatId, `📍 My Current Location\n${mapUrl}`, 'text');
                }, (error) => {
                    console.error("Location error:", error);
                    alert('Unable to retrieve location. Please check your permissions.');
                });
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        } else if (type === 'game') {
            ctrl.openGameInvite({
                isGroup: displayChat?.isGroup || false,
                chatId: displayChat?.id,
                opponentId: displayChat?.isGroup ? 'group' : displayChat?.contactId
            });
            ctrl.setShowAttachMenu(false);
            return;
        } else {
            alert(`${type} feature coming soon!`);
        }
        ctrl.setShowAttachMenu(false);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                const url = URL.createObjectURL(file);
                const type = file.type.startsWith('video/') ? 'video' : 'image';
                setPreviewMedia({ url, file, type });
            } else {
                ctrl.addMessage(ctrl.chatId, `📄 ${file.name}`, 'text');
            }
        }
        e.target.value = '';
    };

    const handleSendMedia = (caption, isViewOnce) => {
        if (!previewMedia || !ctrl.chatId) return;

        ctrl.addMessage(
            ctrl.chatId,
            caption,
            previewMedia.type,
            undefined,
            previewMedia.url,
            undefined,
            undefined,
            isViewOnce
        );

        setPreviewMedia(null);
        ctrl.setShowAttachMenu(false);
    };

    const handleDrawingSend = (dataUrl) => {
        if (ctrl.chatId) {
            ctrl.addMessage(ctrl.chatId, "🎨 Drawing", 'image', undefined, dataUrl);
        }
        setIsDrawing(false);
    };

    const handlePollSend = (pollData) => {
        ctrl.handleSendPoll(pollData);
        setIsPolling(false);
    };

    return (
        <div className="flex flex-col h-full bg-[#EFEAE2] dark:bg-[#0b141a] relative">
            <div className="absolute inset-0 opacity-40 pointer-events-none z-0"
                style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
            </div>

            {isDrawing && <DrawingCanvas onClose={() => setIsDrawing(false)} onSend={handleDrawingSend} />}
            {isPolling && <PollCreator onClose={() => setIsPolling(false)} onSend={handlePollSend} />}

            {/* Media Preview Modal using reusable Editor */}
            {previewMedia && !previewMedia.isViewOnce && (
                <MediaEditor
                    file={previewMedia}
                    onClose={() => setPreviewMedia(null)}
                    onSend={handleSendMedia}
                    footerElement={
                        <div className="bg-[#2a3942] rounded-full px-3 py-1 text-gray-300 text-xs cursor-pointer hover:bg-[#374248] flex items-center gap-1 truncate max-w-[200px]">
                            <span className="truncate">{displayChat.isGroup ? displayChat.groupName : displayContact?.name}</span>
                        </div>
                    }
                />
            )}

            {/* View Once Preview */}
            {previewMedia && previewMedia.isViewOnce && (
                <div className="fixed inset-0 z-[110] bg-black flex flex-col animate-in fade-in duration-200">
                    <div className="flex items-center justify-between p-4 z-20 absolute top-0 w-full">
                        <button onClick={() => setPreviewMedia(null)} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div className="text-white font-medium">View Once</div>
                        <div className="w-10"></div>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4">
                        {previewMedia.type === 'video' ? (
                            <video src={previewMedia.url} controls autoPlay className="max-w-full max-h-full" />
                        ) : (
                            <img src={previewMedia.url} alt="View Once" className="max-w-full max-h-full object-contain" />
                        )}
                    </div>
                </div>
            )}

            {/* Date Lock Modal */}
            {ctrl.dateLockTarget && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-wa-dark-paper rounded-xl shadow-2xl w-full max-w-[340px] sm:max-w-xs p-5 sm:p-6 flex flex-col items-center">
                        <div className="w-12 h-12 bg-wa-teal rounded-full flex items-center justify-center mb-4 text-white"><Lock size={24} /></div>
                        <h3 className="text-base sm:text-lg font-medium text-[#111b21] dark:text-gray-100 mb-1">{displayChat.userSettings?.hiddenDates?.includes(ctrl.dateLockTarget) ? 'Unlock Date' : 'Lock Date'}</h3>
                        <p className="text-xs text-[#667781] dark:text-gray-400 mb-5 sm:mb-6 text-center">Enter Daily PIN to {displayChat.userSettings?.hiddenDates?.includes(ctrl.dateLockTarget) ? 'show' : 'hide'} messages from <br /><strong>{ctrl.dateLockTarget}</strong></p>
                        <form onSubmit={ctrl.handleLockVerify} className="w-full flex flex-col items-center">
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={4}
                                value={ctrl.lockPin}
                                onChange={(e) => { ctrl.setLockPin(e.target.value); ctrl.setLockError(''); }}
                                className="w-full text-center text-xl sm:text-2xl tracking-[0.5em] font-medium py-2 border-b-2 border-wa-teal bg-transparent outline-none mb-2 text-[#111b21] dark:text-gray-100 placeholder-transparent touch-manipulation"
                                placeholder="****"
                                autoFocus
                            />
                            {ctrl.lockError && <p className="text-red-500 text-xs mb-4 font-medium">{ctrl.lockError}</p>}
                            <div className="flex gap-3 w-full mt-4">
                                <button type="button" onClick={() => { ctrl.setDateLockTarget(null); ctrl.setLockPin(''); ctrl.setLockError(''); }} className="flex-1 py-2.5 text-wa-teal font-medium hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover rounded-full transition-colors touch-manipulation">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-wa-teal text-white font-medium rounded-full shadow-sm hover:shadow-md transition-all touch-manipulation">{displayChat.userSettings?.hiddenDates?.includes(ctrl.dateLockTarget) ? 'Unlock' : 'Lock'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Message Modal */}
            <DeleteMessageModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setMessageToDelete(null);
                }}
                onDeleteForMe={handleDeleteForMe}
                onDeleteForEveryone={handleDeleteForEveryone}
                messageCount={1}
                canDeleteForEveryone={canDeleteMsgForEveryone}
                timeWarning={timeWarning}
            />

            {/* Header / Selection Mode / Search */}
            {ctrl.isSelectionMode ? (
                <div className="h-[60px] bg-wa-teal dark:bg-wa-dark-header flex items-center px-4 gap-6 text-white z-10 shrink-0 shadow-md">
                    <div className="flex items-center gap-4"><button onClick={() => { ctrl.setIsSelectionMode(false); ctrl.setSelectedMessages(new Set()); }}><X size={24} /></button><span className="font-bold text-xl">{ctrl.selectedMessages.size}</span></div>
                    <div className="flex-1"></div>
                    <div className="flex-1"></div>
                    <div className="flex items-center gap-6">
                        <button><Reply size={24} className="scale-x-[-1]" /></button>
                        <button onClick={() => {
                            ctrl.selectedMessages.forEach(msgId => {
                                toggleStarMessage(ctrl.chatId, msgId);
                            });
                            ctrl.setIsSelectionMode(false);
                            ctrl.setSelectedMessages(new Set());
                        }}>
                            <Star size={24} />
                        </button>
                        {ctrl.selectedMessages.size === 1 && (() => {
                            const msgId = Array.from(ctrl.selectedMessages)[0];
                            const msg = ctrl.chatMessages.find(m => m.id === msgId);
                            return msg && msg.type === 'text' && (
                                <button onClick={() => {
                                    ctrl.handleTranslate(msgId);
                                    ctrl.setIsSelectionMode(false);
                                    ctrl.setSelectedMessages(new Set());
                                }} title="Translate">
                                    <Languages size={24} />
                                </button>
                            );
                        })()}
                        <button onClick={ctrl.handleDeleteSelected}><Trash2 size={24} /></button>
                        <button><Forward size={24} /></button>
                    </div>
                </div>
            ) : ctrl.isSearchOpen ? (
                <AdvancedSearchPanel
                    messages={ctrl.chatMessages}
                    users={ctrl.users}
                    onResultSelect={(msg) => {
                        setSelectedSearchResult(msg);
                        const element = document.getElementById(`msg-${msg.id}`);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }}
                    onClose={() => {
                        ctrl.setIsSearchOpen(false);
                        setSelectedSearchResult(null);
                    }}
                />
            ) : (
                <div className="h-[60px] bg-wa-grayBg dark:bg-wa-dark-header flex items-center px-4 justify-between border-b border-wa-border dark:border-wa-dark-border z-10 shrink-0">
                    <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 mr-2" onClick={ctrl.navigateToInfo}>
                        <button onClick={(e) => { e.stopPropagation(); ctrl.navigateToChats(); }} className="md:hidden mr-1 shrink-0"><ArrowLeft size={24} className="text-[#54656f] dark:text-gray-400" /></button>
                                <img src={displayChat.isGroup ? 'https://picsum.photos/300' : displayContact?.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                        <div className="flex flex-col justify-center min-w-0">
                                    <h2 className="text-[#111b21] dark:text-gray-100 font-medium text-base truncate">{displayChat.isGroup ? displayChat.groupName : displayContact?.name}</h2>
                            {(() => {
                                const { typingUsers, onlineUsers, lastSeen, users } = ctrl;
                                const chatTyping = typingUsers?.[ctrl.chatId] || [];

                                // Show typing indicator if anyone is typing (except current user)
                                const othersTyping = chatTyping.filter(uid => uid !== ctrl.currentUserId);
                                if (othersTyping.length > 0) {
                                    return <TypingIndicator typingUserIds={othersTyping} users={users} />;
                                }

                                // Show online status for individual chats
                                        if (!displayChat.isGroup && displayContact) {
                                            const isOnline = onlineUsers?.has(displayContact.id);
                                    if (isOnline) {
                                        return (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <p className="text-xs text-[#667781] dark:text-gray-400">online</p>
                                            </div>
                                        );
                                    } else {
                                        const lastSeenTime = lastSeen?.[displayContact.id];
                                        const statusText = lastSeenTime ? `last seen ${formatLastSeen(lastSeenTime)}` : '';
                                        return <p className="text-xs text-[#667781] dark:text-gray-400">{statusText}</p>;
                                    }
                                }

                                // Group chat: show participants
                                return (
                                    <p className="text-xs text-[#667781] dark:text-gray-400 overflow-x-auto whitespace-nowrap no-scrollbar">
                                        {displayChat.groupParticipants?.map(p => users[p]?.name).join(', ') || 'click for info'}
                                    </p>
                                );
                            })()}
                        </div>
                    </div>
                            <div className="flex items-center gap-2 md:gap-4 text-wa-teal dark:text-wa-teal shrink-0">
                                <button onClick={() => displayContact && ctrl.startCall(displayContact.id, 'video')} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><VideoIcon size={24} /></button>
                                <button onClick={() => displayContact && ctrl.startCall(displayContact.id, 'voice')} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><Phone size={22} /></button>
                        <button className="hidden md:block p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full" onClick={() => ctrl.setIsSearchOpen(true)}><Search size={22} className="text-[#54656f] dark:text-gray-400" /></button>
                        <div className="relative">
                            <button onClick={() => ctrl.setIsMenuOpen(!ctrl.isMenuOpen)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-[#54656f] dark:text-gray-400"><MoreVertical size={22} /></button>
                            {ctrl.isMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => ctrl.setIsMenuOpen(false)}></div>
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl border border-wa-border dark:border-wa-dark-border z-50 py-2 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                                                <button onClick={() => { ctrl.navigateToInfo(); ctrl.setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-wa-dark-hover text-[#111b21] dark:text-gray-100 text-[15px]">{displayChat.isGroup ? 'Group info' : 'Contact info'}</button>
                                        <button onClick={() => { ctrl.setIsSearchOpen(true); ctrl.setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-wa-dark-hover text-[#111b21] dark:text-gray-100 text-[15px]">Search</button>
                                        <button onClick={() => { ctrl.deleteMessages(ctrl.chatId, [], true); ctrl.setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-wa-dark-hover text-[#111b21] dark:text-gray-100 text-[15px]">Clear chat</button>
                                        <button onClick={() => { ctrl.setIsMenuOpen(false); ctrl.navigateToChats(); }} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-wa-dark-hover text-[#111b21] dark:text-gray-100 text-[15px]">Close chat</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Messages List or Empty State */}
            {visibleMessages.length === 0 ? (
                <EmptyChatState
                    contactName={displayChat.isGroup ? displayChat.groupName : displayContact?.name}
                    contactAvatar={displayChat.isGroup ? 'https://picsum.photos/300' : displayContact?.avatar}
                    isGroup={displayChat.isGroup}
                />
            ) : (
                <MessageList
                    messages={visibleMessages}
                    currentUser={{ id: ctrl.currentUserId }}
                    chatContainerRef={ctrl.chatContainerRef}
                    messagesEndRef={ctrl.messagesEndRef}
                    activeMessageId={ctrl.activeMessageId}
                    selectedMessages={ctrl.selectedMessages}
                    isSelectionMode={ctrl.isSelectionMode}
                    messageSearchQuery={ctrl.messageSearchQuery}
                    translatedMessages={ctrl.translatedMessages}
                    chatSettings={ctrl.chatSettings}
                        hiddenDates={displayChat?.userSettings?.hiddenDates}
                        mockTranslate={mockTranslate}
                        onDateLock={ctrl.handleDateLock || ctrl.setDateLockTarget} // Assuming handleDateLock might not exist, falling back to setting target
                        onAction={(action, payload) => {
                            switch (action) {
                                case 'setActive': ctrl.setActiveMessageId(payload); break;
                                case 'startSelection':
                                    ctrl.setIsSelectionMode(true);
                                    ctrl.setSelectedMessages(new Set([payload]));
                                    break;
                                case 'toggleSelection': ctrl.toggleSelection(payload); break;
                                case 'reply': ctrl.handleReply(payload); break;
                                case 'translate': ctrl.handleTranslate(payload); break;
                                case 'togglePin':
                                    ctrl.togglePinMessage(ctrl.chatId, payload);
                                    ctrl.setActiveMessageId(null);
                                    break;
                                case 'addReaction':
                                    ctrl.addReaction(ctrl.chatId, payload.msgId, payload.emoji);
                                    ctrl.setActiveMessageId(null);
                                    break;
                                case 'vote':
                                    ctrl.handleVote(payload.msg.id, payload.optionId);
                                    break;
                                case 'viewVotes':
                                    setViewingPoll(payload);
                                    break;
                                case 'viewMedia':
                                    const { url, type, isViewOnce, messageId } = payload;
                                    if (isViewOnce && messageId) {
                                        setPreviewMedia({ url, type, isViewOnce, messageId });
                                        ctrl.markMessageAsViewed(ctrl.chatId, messageId);
                                    } else {
                                        setPreviewMedia({ url, type });
                                    }
                                    break;
                                case 'delete':
                                    const msgId = payload;
                                    const msg = ctrl.chatMessages.find(m => m.id === msgId);
                                    setMessageToDelete(msg);
                                    setDeleteModalOpen(true);
                                    break;
                                default: break;
                            }
                        }}
                    />
            )}

            {ctrl.editingMessage && (
                <div className="bg-wa-tealBg dark:bg-wa-tealDark/20 px-4 py-2 border-l-4 border-wa-teal flex justify-between items-center z-10 mx-2 mt-2 rounded-lg animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex flex-col text-sm max-w-[90%]">
                        <span className="text-wa-teal font-medium text-xs">Editing message</span>
                        <span className="truncate text-gray-600 dark:text-gray-300">{ctrl.editingMessage.text}</span>
                    </div>
                    <button onClick={() => ctrl.handleCancelEdit()}><X size={20} className="text-gray-500" /></button>
                </div>
            )}

            {ctrl.replyTo && <div className="bg-gray-100 dark:bg-wa-dark-paper px-4 py-2 border-l-4 border-wa-teal flex justify-between items-center z-10 mx-2 mt-2 rounded-lg"><div className="flex flex-col text-sm max-w-[90%]"><span className="text-wa-teal font-medium text-xs">Replying to {ctrl.users[ctrl.replyTo.senderId]?.name || 'User'}</span><span className="truncate text-gray-600 dark:text-gray-300">{ctrl.replyTo.text}</span></div><button onClick={() => ctrl.setReplyTo(null)}><X size={20} className="text-gray-500" /></button></div>}

            {/* Input Area */}
            {ctrl.isSelectionMode ? (
                <div className="p-3 bg-wa-grayBg dark:bg-wa-dark-header border-t border-wa-border dark:border-wa-dark-border z-10 flex items-center justify-center text-sm text-gray-500">Selection Mode Active</div>
            ) : !displayChat.isGroup && displayContact?.isPrivate && !isFollowing(displayContact.id) && displayContact.id !== ctrl.currentUserId ? (
                <div className="p-4 bg-wa-grayBg dark:bg-wa-dark-header border-t border-wa-border dark:border-wa-dark-border z-10 flex flex-col items-center justify-center text-center gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        You cannot message this account because they are private and you are not following them.
                    </p>
                </div>
            ) : ctrl.isRecording ? (
                <div className="p-2 md:p-3 bg-wa-grayBg dark:bg-wa-dark-header border-t border-wa-border dark:border-wa-dark-border z-10 flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-200">
                    <button onClick={ctrl.cancelRecording} className="p-3 text-red-500 hover:bg-black/5 rounded-full transition-colors">
                        <Trash2 size={22} />
                    </button>

                    <div className="flex-1 flex items-center gap-3">
                        <div className="flex items-center gap-2 text-[#54656f] dark:text-gray-300 text-lg font-mono">
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                            {formatRecordingTime(ctrl.recordingSeconds)}
                        </div>
                        <span className="text-xs text-[#667781] dark:text-gray-500 animate-pulse">Recording...</span>
                    </div>

                    <button onClick={ctrl.finishRecording} className="p-3 bg-wa-teal text-white rounded-full shadow-md hover:scale-105 transition-transform">
                        <Send size={20} className="ml-0.5" />
                    </button>
                </div>
            ) : (
                <div className="p-2 md:p-3 bg-wa-grayBg dark:bg-wa-dark-header border-t border-wa-border dark:border-wa-dark-border z-10 flex items-center gap-2 relative">

                    {/* Hidden File Input (Outside of Attach Menu check to keep it mounted) */}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                    {/* Attachment Menu */}
                    {ctrl.showAttachMenu && (
                        <AttachmentMenu
                            onSelect={handleAttachmentSelect}
                            onClose={() => ctrl.setShowAttachMenu(false)}
                        />
                    )}

                    {/* Emoji Picker */}
                    <div className="relative">
                        <button
                            onClick={() => ctrl.setShowPicker(!ctrl.showPicker)}
                            className="p-2 text-[#54656f] dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                        >
                            <Smile size={24} />
                        </button>

                        {ctrl.showPicker && (
                            <>
                                {/* Click-outside overlay */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => ctrl.setShowPicker(false)}
                                />

                                {/* Emoji Picker */}
                                <EmojiPicker
                                    onEmojiSelect={(emoji) => {
                                        // Insert emoji at cursor position
                                        ctrl.setInputText(ctrl.inputText + emoji);
                                        ctrl.setShowPicker(false);
                                    }}
                                    onClose={() => ctrl.setShowPicker(false)}
                                />
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => ctrl.setShowAttachMenu(!ctrl.showAttachMenu)}
                        className={`p-2 rounded-full transition-colors transition-transform ${ctrl.showAttachMenu ? 'bg-black/10 dark:bg-white/10 rotate-45 text-[#54656f] dark:text-gray-300' : 'text-[#54656f] dark:text-gray-400 hover:bg-black/5'}`}
                    >
                        <Paperclip size={24} />
                    </button>

                    <div className="flex-1 bg-white dark:bg-wa-dark-input rounded-lg flex items-center px-4 py-2"><input type="text" className="w-full bg-transparent outline-none text-[#111b21] dark:text-gray-100 placeholder:text-[#667781] dark:placeholder:text-gray-500 text-[15px]" placeholder="Type a message" value={ctrl.inputText} onChange={ctrl.setInputText} onKeyDown={ctrl.handleKeyDown} /></div>
                    {ctrl.inputText.trim() ? (
                        <button onClick={() => ctrl.handleSendMessage()} className="p-3 bg-wa-teal text-white rounded-full shadow-md hover:scale-105 transition-transform"><Send size={20} className="ml-0.5" /></button>
                    ) : (
                        <button onClick={ctrl.startRecording} className="p-3 bg-wa-teal text-white rounded-full shadow-md hover:scale-105 transition-transform active:scale-95"><Mic size={20} /></button>
                    )}
                </div>
            )}

            {viewingPoll && (
                <PollDetailsModal
                    pollData={viewingPoll}
                    onClose={() => setViewingPoll(null)}
                />
            )}

            {/* Thread View Modal */}
            {ctrl.activeThreadId && (() => {
                const parentMessage = ctrl.chatMessages.find(m => m.id === ctrl.activeThreadId);
                return parentMessage ? (
                    <ThreadView 
                        parentMessage={parentMessage}
                        onClose={ctrl.handleCloseThread}
                    />
                ) : null;
            })()}
        </div>
    );
};

export default ChatWindow;
