import React, { memo } from 'react';
import { Check, CheckCheck, Reply, Languages, Pin, CheckSquare, Globe, Lock, Info, Mic } from 'lucide-react';
import RichTextRenderer from '../../../shared/components/text/RichTextRenderer';
import MediaCarousel from '../../../shared/components/media/MediaCarousel';
import VideoMessage from '../../../shared/components/media/VideoMessage';
import PollMessage from './message/PollMessage';
import GameInviteBubble from '../../games/components/GameInviteBubble';
import ReplyIndicator from './threading/ReplyIndicator';
import ThreadPreview from './threading/ThreadPreview';


/**
 * LinkPreview Component - Shows preview for URLs in messages
 */
const LinkPreview = memo(({ text }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    if (!match) return null;

    const url = match[0];
    const domain = new URL(url).hostname;

    return (
        <div className="mt-2 bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 max-w-sm">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 relative">
                <img
                    src={`https://picsum.photos/seed/${domain}/400/200`}
                    alt="Preview"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="p-2">
                <h4 className="font-bold text-sm text-[#111b21] dark:text-gray-100 truncate">{domain}</h4>
                <p className="text-xs text-[#667781] dark:text-gray-400 line-clamp-2">Check out this interesting link from {domain}. Click to read more about this content.</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 mt-1 block truncate">{url}</a>
            </div>
        </div>
    );
});

LinkPreview.displayName = 'LinkPreview';

/**
 * MessageReactions Component - Shows reactions on a message
 */
const MessageReactions = memo(({ reactions }) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;

    return (
        <div className="absolute -bottom-2.5 left-2 bg-white dark:bg-wa-dark-paper border border-gray-100 dark:border-gray-700 rounded-full px-1.5 py-0.5 shadow-sm flex items-center gap-0.5 z-10">
            {Object.values(reactions).slice(0, 3).map((emoji, i) => (
                <span key={i} className="text-[10px]">{emoji}</span>
            ))}
            {Object.values(reactions).length > 1 && (
                <span className="text-[10px] text-gray-500 ml-0.5">{Object.values(reactions).length}</span>
            )}
        </div>
    );
});

MessageReactions.displayName = 'MessageReactions';

/**
 * MessageBubble - Memoized component for rendering individual message bubbles
 * Only re-renders when its specific props change
 */
const MessageBubble = memo(({
    msg,
    isMe,
    isActive,
    isSelected,
    isTranslated,
    formattedTime,
    displayText,
    bubbleColor,
    fontSizeClass,
    isSelectionMode,
    messageSearchQuery,
    translationLanguage,
    mockTranslate,
    onMouseEnter,
    onMouseLeave,
    onClick,
    onContextMenu,
    onToggleSelection,
    onReply,
    onTranslate,
    onTogglePin,
    onCheckSelect,
    onAddReaction,
    onVote,
    currentUserId,
    onViewVotes,
    onViewMedia,
    onDelete,
    onScrollToMessage,
    onOpenThread
}) => {
    const StatusIcon = () => (
        isMe && !msg.isDeleted ? (
            msg.status === 'read' ? (
                <CheckCheck size={14} className="text-wa-blue" />
            ) : msg.status === 'delivered' ? (
                <CheckCheck size={14} className="text-gray-400" />
            ) : (
                <Check size={14} className="text-gray-400" />
            )
        ) : null
    );

    const isMediaMessage = (msg.type === 'image' || msg.type === 'video' || (msg.mediaUrls && msg.mediaUrls.length > 0)) && !msg.isDeleted;
    const bubblePadding = isMediaMessage ? 'p-[3px]' : 'p-1.5';

    return (
        <div
            className={`relative flex mb-3.5 md:mb-4 ${isMe ? 'justify-end' : 'justify-start'} ${isSelectionMode ? 'cursor-pointer hover:bg-blue-100/10 -mx-4 px-4 py-1' : ''} ${isSelected ? 'bg-blue-100/30 dark:bg-blue-900/20' : ''}`}
            onClick={onClick}
            onContextMenu={onContextMenu}
        >
            {/* Selection Checkbox */}
            {isSelectionMode && (
                <div className={`flex items-center mr-3 ${isMe ? 'order-last ml-3 mr-0' : ''}`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-wa-teal border-wa-teal' : 'border-gray-400 bg-white dark:bg-transparent'}`}>
                        {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                </div>
            )}

            {/* Message Bubble */}
            <div
                className={`group relative max-w-[85%] md:max-w-[65%] rounded-lg shadow-sm ${bubblePadding} ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'} ${isActive ? 'z-[50]' : 'z-0'}`}
                style={{ backgroundColor: bubbleColor, color: '#111b21' }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                {/* Quick Actions (Reactions + Actions) */}
                {!msg.isDeleted && !isSelectionMode && (
                    <div className={`absolute -top-10 bg-white dark:bg-wa-dark-paper rounded-full shadow-lg p-1.5 flex items-center animate-in fade-in zoom-in duration-200 z-50 ${isMe ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'} ${isActive || 'hidden group-hover:flex'}`}>
                        <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[120px] px-1">
                            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={(e) => { e.stopPropagation(); onAddReaction(emoji); }}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-lg transition-transform hover:scale-125 shrink-0"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-1 shrink-0"></div>
                        <div className="flex gap-1 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); onReply(); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-300" title="Reply">
                                <Reply size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400" title="Delete">
                                🗑️
                            </button>
                            {msg.type === 'text' && (
                                <button onClick={(e) => { e.stopPropagation(); onTranslate(); }} className={`p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-300 ${isTranslated ? 'text-wa-teal' : ''}`} title="Translate">
                                    <Languages size={16} />
                                </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); onTogglePin(); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-300" title="Pin">
                                <Pin size={16} fill={msg.isPinned ? "currentColor" : "none"} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onCheckSelect(); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-300" title="Select">
                                <CheckSquare size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Pin Indicator */}
                {msg.isPinned && (
                    <div className="absolute -top-2 -right-2 bg-gray-100 dark:bg-gray-700 rounded-full p-1 shadow-sm z-10">
                        <Pin size={10} className="text-gray-500" fill="currentColor" />
                    </div>
                )}

                {/* Reply Indicator - Shows if this message is replying to another */}
                {msg.replyTo && (
                    <div className="px-1 pt-1">
                        <ReplyIndicator 
                            replyTo={msg.replyTo}
                            onClick={() => onScrollToMessage && onScrollToMessage(msg.replyTo.id)}
                        />
                    </div>
                )}

                {/* Message Content */}
                <div className={`${fontSizeClass} ${isMediaMessage ? '' : 'px-1'}`}>
                    {msg.isDeleted ? (
                        <span className="italic text-gray-500 flex items-center gap-1 pb-1">
                            <Info size={14} /> {msg.text}
                        </span>
                    ) : (
                        <>
                            {msg.type === 'game_invite' ? (
                                <GameInviteBubble message={msg} />
                            ) : msg.pollData ? (
                                <PollMessage
                                    msg={msg}
                                    onVote={onVote} // Need to pass this prop
                                    currentUserId={currentUserId} // Need to pass this prop
                                    onViewVotes={() => onViewVotes(msg.pollData)} // Need to pass this prop
                                />
                            ) : msg.isViewOnce ? (
                                <div
                                    onClick={() => {
                                        if (!msg.isViewed) {
                                            onViewMedia({ url: msg.mediaUrl, type: msg.type, isViewOnce: true, messageId: msg.id });
                                        }
                                    }}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${msg.isViewed ? 'opacity-60' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${msg.isViewed ? 'border-gray-400 text-gray-400' : 'border-wa-teal text-wa-teal'}`}>
                                        <span className="text-xs font-bold">1</span>
                                    </div>
                                    <span className={`font-medium ${msg.isViewed ? 'text-gray-500' : 'text-[#111b21] dark:text-gray-100'}`}>
                                        {msg.isViewed ? 'Opened' : (msg.type === 'video' ? 'Video' : 'Photo')}
                                    </span>
                                </div>
                            ) : msg.type === 'image' ? (
                                <div
                                    className="rounded-lg overflow-hidden cursor-pointer relative max-w-[300px] md:max-w-[350px]"
                                    onClick={() => onViewMedia({ url: msg.mediaUrl, type: 'image' })}
                                >
                                    <img src={msg.mediaUrl} alt="Sent media" className="w-full max-h-[250px] md:max-h-[300px] object-cover rounded-lg" />
                                </div>
                            ) : msg.mediaUrls && msg.mediaUrls.length > 0 ? (
                                <MediaCarousel mediaUrls={msg.mediaUrls} onImageClick={(url) => onViewMedia({ url, type: 'image' })} />
                            ) : msg.type === 'video' && msg.mediaUrl ? (
                                <VideoMessage
                                    src={msg.mediaUrl}
                                    poster={msg.mediaUrl}
                                    duration={msg.duration}
                                    className="rounded-lg max-w-[300px] md:max-w-[350px] max-h-[250px] md:max-h-[300px]"
                                />
                            ) : msg.type === 'voice' ? (
                                <div className="flex items-center gap-3 pr-4 min-w-[150px] py-1">
                                    <div className="w-10 h-10 rounded-full bg-wa-teal flex items-center justify-center text-white cursor-pointer relative shrink-0">
                                        <Mic size={20} />
                                    </div>
                                    <div className="flex flex-col flex-1 gap-1">
                                        <div className="h-1 bg-black/20 dark:bg-white/20 rounded-full w-full mt-2 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 h-full bg-gray-500 w-1/3"></div>
                                        </div>
                                        <span className="text-xs opacity-70">{msg.duration || '0:00'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    {messageSearchQuery ? (
                                        <span className="whitespace-pre-wrap break-words text-[#111b21] dark:text-gray-100">{displayText}</span>
                                    ) : (
                                        <RichTextRenderer text={msg.text} />
                                    )}

                                    <LinkPreview text={msg.text} />

                                    {isTranslated && (
                                        <div className="mt-2 pt-1 border-t border-black/10 dark:border-white/10 animate-in fade-in duration-300">
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                                                <Globe size={10} />
                                                <span className="uppercase">Translated to {translationLanguage}</span>
                                            </div>
                                            <p className="whitespace-pre-wrap break-words text-[#111b21] dark:text-gray-100 italic">
                                                {mockTranslate(msg.text, translationLanguage)}
                                            </p>
                                        </div>
                                    )}

                                    <span className="inline-block w-16 h-3"></span>
                                    <span className="absolute bottom-[-3px] right-0 flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 select-none whitespace-nowrap">
                                        {msg.isEdited && <span className="italic mr-1">edited</span>}
                                        {formattedTime} <StatusIcon />
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Timestamp for Media (Overlay Style) */}
                {isMediaMessage && !msg.isDeleted && (
                    <div className="absolute bottom-1 right-2 bg-black/40 text-white rounded-full px-1.5 py-0.5 backdrop-blur-sm flex items-center gap-1 select-none pointer-events-none z-10">
                        <span className="text-[10px] text-white/90">{formattedTime}</span>
                        {isMe && <CheckCheck size={14} className="text-white/90" />}
                    </div>
                )}

                {/* Reactions */}
                <MessageReactions reactions={msg.reactions} />

                {/* Thread Preview - Shows reply count if this message has replies */}
                {msg.threadReplyCount > 0 && (
                    <div className="px-1 pb-1">
                        <ThreadPreview 
                            replyCount={msg.threadReplyCount}
                            lastReply={msg.lastThreadReply}
                            onClick={() => onOpenThread && onOpenThread(msg)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
