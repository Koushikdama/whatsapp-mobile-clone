import React from 'react';

/**
 * TypingIndicator component - displays animated typing indicator
 * @param {Object} props
 * @param {string[]} props.typingUserIds - Array of user IDs who are typing
 * @param {Object} props.users - Users object from context
 */
const TypingIndicator = ({ typingUserIds, users }) => {
    if (!typingUserIds || typingUserIds.length === 0) return null;

    // Get names of users who are typing
    const typingNames = typingUserIds
        .map(uid => users[uid]?.name || 'Someone')
        .slice(0, 3); // Show max 3 names

    const displayText = typingUserIds.length === 1
        ? `${typingNames[0]} is typing`
        : typingUserIds.length === 2
            ? `${typingNames[0]} and ${typingNames[1]} are typing`
            : typingUserIds.length === 3
                ? `${typingNames[0]}, ${typingNames[1]}, and ${typingNames[2]} are typing`
                : `${typingNames[0]}, ${typingNames[1]}, and ${typingUserIds.length - 2} others are typing`;

    return (
        <div className="flex items-center gap-1 text-wa-teal dark:text-wa-teal text-sm animate-in fade-in duration-200">
            <span>{displayText}</span>
            <div className="flex gap-0.5 ml-1">
                <span
                    className="inline-block w-1 h-1 bg-wa-teal dark:bg-wa-teal rounded-full animate-bounce"
                    style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
                />
                <span
                    className="inline-block w-1 h-1 bg-wa-teal dark:bg-wa-teal rounded-full animate-bounce"
                    style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
                />
                <span
                    className="inline-block w-1 h-1 bg-wa-teal dark:bg-wa-teal rounded-full animate-bounce"
                    style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
                />
            </div>
        </div>
    );
};

export default TypingIndicator;
