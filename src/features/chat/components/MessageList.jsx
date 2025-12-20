import React, { useMemo } from 'react';
import { Lock } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { useMentions } from '../../../shared/hooks/useMentions';
import { combineFormatting } from '../../../shared/components/text/MessageFormatting';

const MessageList = ({
    messages,
    currentUser,
    chatContainerRef,
    messagesEndRef,
    activeMessageId,
    selectedMessages,
    isSelectionMode,
    messageSearchQuery,
    translatedMessages,
    chatSettings,
    onScrollToBottom,

    // Actions
    onAction,
    onDateLock,
    hiddenDates,
    mockTranslate,
    
    // Threading
    onScrollToMessage,
    onOpenThread,
    messageRefs
}) => {
    const mentions = useMentions();

    // Group messages by date
    const groupedMessages = useMemo(() => {
        const groups = [];
        messages.forEach(msg => {
            let date = 'Unknown Date';
            try { date = new Date(msg.timestamp).toLocaleDateString(); } catch (e) { }
            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.date === date) lastGroup.msgs.push(msg);
            else groups.push({ date, msgs: [msg] });
        });
        return groups;
    }, [messages]);

    const getBubbleColor = (isMe) => isMe ? chatSettings.outgoingBubbleColor : chatSettings.incomingBubbleColor;
    const getFontSizeClass = () => {
        switch (chatSettings.fontSize) {
            case 'small': return 'text-[13px]';
            case 'large': return 'text-[17px]';
            default: return 'text-[15px]';
        }
    };

    const processDisplayText = (msg) => {
        let displayText = msg.text;

        // Mention highlighting
        if (msg.type === 'text' && msg.text.includes('@[')) {
            displayText = mentions.parseMentionsForDisplay(msg.text);
        }

        // Formatting
        if (msg.type === 'text') {
            displayText = combineFormatting(displayText,
                msg.text.includes('@[') ? null : mentions.parseMentionsForDisplay
            );
        }

        // Search Highlighting
        if (messageSearchQuery && msg.type === 'text') {
            const query = messageSearchQuery.toLowerCase();
            const highlightText = (text) => {
                if (typeof text !== 'string') return text;
                const parts = text.split(new RegExp(`(${messageSearchQuery})`, 'gi'));
                return parts.map((part, i) =>
                    part.toLowerCase() === query ?
                        <span key={i} className="bg-yellow-200 text-black">{part}</span> :
                        part
                );
            };

            if (Array.isArray(displayText)) {
                displayText = displayText.map(part => highlightText(part));
            } else {
                displayText = highlightText(displayText);
            }
        }
        return displayText;
    };

    return (
        <div className="flex-1 overflow-y-auto p-2 md:p-4 z-0 relative scroll-smooth" ref={chatContainerRef}>
            {!messageSearchQuery && (
                <div className="flex justify-center mb-6">
                    <div className="bg-[#FFEECD] dark:bg-[#1f2c34] text-[#54656f] dark:text-[#ffcc00] text-[10px] md:text-xs px-3 py-1.5 rounded-lg text-center shadow-sm max-w-[80%] flex items-center gap-1.5">
                        <Lock size={10} /> Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
                    </div>
                </div>
            )}

            {groupedMessages.map((group, gIdx) => {
                const isDateLocked = hiddenDates?.includes(group.date);
                return (
                    <div key={gIdx}>
                        <div
                            className="flex justify-center mb-4 sticky top-2 z-30 cursor-pointer select-none group"
                            onDoubleClick={() => onDateLock(group.date)}
                            title="Double-click to lock/unlock date"
                        >
                            <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm border uppercase tracking-wide transition-all ${isDateLocked ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border-red-100 dark:border-red-800' : 'bg-white dark:bg-wa-dark-paper text-[#54656f] dark:text-gray-400 border-gray-100 dark:border-gray-800 group-hover:scale-105'}`}>
                                {isDateLocked && <Lock size={10} />} {group.date === new Date().toLocaleDateString() ? 'Today' : group.date}
                            </span>
                        </div>

                        {!isDateLocked ? (
                            group.msgs.map((msg) => {
                                const isMe = msg.senderId === currentUser.id;
                                const isActive = activeMessageId === msg.id;
                                const isSelected = selectedMessages.has(msg.id);
                                const isTranslated = translatedMessages.has(msg.id);
                                const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <MessageBubble
                                        key={msg.id}
                                        msg={msg}
                                        isMe={isMe}
                                        isActive={isActive}
                                        isSelected={isSelected}
                                        isTranslated={isTranslated}
                                        formattedTime={formattedTime}
                                        displayText={processDisplayText(msg)}
                                        bubbleColor={getBubbleColor(isMe)}
                                        fontSizeClass={getFontSizeClass()}
                                        isSelectionMode={isSelectionMode}
                                        messageSearchQuery={messageSearchQuery}
                                        translationLanguage={chatSettings.translationLanguage}
                                        mockTranslate={mockTranslate}
                                        currentUserId={currentUser.id}

                                        // Handlers
                                        onMouseEnter={() => !isSelectionMode && onAction('setActive', msg.id)}
                                        onMouseLeave={() => !isSelectionMode && onAction('setActive', null)}
                                        onClick={() => isSelectionMode && onAction('toggleSelection', msg.id)}
                                        onContextMenu={(e) => { e.preventDefault(); if (!isSelectionMode) onAction('startSelection', msg.id); }}

                                        onToggleSelection={() => onAction('toggleSelection', msg.id)}
                                        onReply={() => onAction('reply', msg)}
                                        onDelete={() => onAction('delete', msg.id)}
                                        onTranslate={() => onAction('translate', msg.id)}
                                        onTogglePin={() => onAction('togglePin', msg.id)}
                                        onCheckSelect={() => onAction('toggleSelection', msg.id)}
                                        onAddReaction={(emoji) => onAction('addReaction', { msgId: msg.id, emoji })}
                                        onVote={(optionId) => onAction('vote', { msg, optionId })}
                                        onViewVotes={(pollData) => onAction('viewVotes', pollData)}
                                        onViewMedia={(media) => onAction('viewMedia', media)}
                                        onScrollToMessage={onScrollToMessage}
                                        onOpenThread={onOpenThread}
                                    />
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 mb-4 opacity-60">
                                <Lock size={16} className="text-gray-400 mb-1" />
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">Messages Hidden</span>
                            </div>
                        )}
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
