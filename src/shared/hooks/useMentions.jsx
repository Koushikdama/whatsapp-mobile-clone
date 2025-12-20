import { useCallback } from 'react';

/**
 * useMentions - Hook for handling @mentions in messages
 * Detects @triggers, manages autocomplete, and formats mentions
 */
export const useMentions = () => {

    /**
     * Detect if user is typing a mention
     * @param {string} text - Current input text
     * @param {number} cursorPos - Cursor position
     * @returns {Object|null} - {query, startPos} or null
     */
    const detectMentionTrigger = useCallback((text, cursorPos) => {
        const beforeCursor = text.substring(0, cursorPos);
        const atIndex = beforeCursor.lastIndexOf('@');

        if (atIndex !== -1) {
            const afterAt = beforeCursor.substring(atIndex + 1);

            // Check if there's no space after @
            if (!afterAt.includes(' ') && afterAt.length <= 20) {
                return {
                    query: afterAt,
                    startPos: atIndex
                };
            }
        }

        return null;
    }, []);

    /**
     * Insert a mention into text
     * @param {string} text - Current text
     * @param {number} cursorPos - Cursor position
     * @param {Object} user - User object {id, name}
     * @param {number} mentionStart - Position where @ starts
     * @returns {string} - New text with mention
     */
    const insertMention = useCallback((text, cursorPos, user, mentionStart) => {
        const before = text.substring(0, mentionStart);
        const after = text.substring(cursorPos);

        // Format: @[UserName](userId)
        const mention = `@[${user.name}](${user.id})`;

        return before + mention + ' ' + after;
    }, []);

    /**
     * Parse mentions for display (convert to React elements)
     * @param {string} text - Text with mention markup
     * @returns {Array} - Array of strings and React elements
     */
    const parseMentionsForDisplay = useCallback((text) => {
        if (!text) return [];

        // Match @[Name](userId) pattern
        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }

            const name = match[1];
            const userId = match[2];

            // Add the mention as a styled span
            parts.push(
                <span
                    key={`${userId}-${match.index}`}
                    className="text-wa-teal dark:text-wa-teal font-medium bg-wa-teal/10 dark:bg-wa-teal/20 px-1 rounded cursor-pointer hover:underline"
                >
                    @{name}
                </span>
            );

            lastIndex = mentionRegex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : [text];
    }, []);

    /**
     * Extract mentioned user IDs from text
     * @param {string} text - Text with mentions
     * @returns {string[]} - Array of user IDs
     */
    const extractMentionedUsers = useCallback((text) => {
        if (!text) return [];

        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        const mentions = [];
        let match;

        while ((match = mentionRegex.exec(text)) !== null) {
            mentions.push(match[2]); // userId is the second capture group
        }

        return mentions;
    }, []);

    return {
        detectMentionTrigger,
        insertMention,
        parseMentionsForDisplay,
        extractMentionedUsers
    };
};
