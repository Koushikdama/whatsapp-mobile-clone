import React from 'react';

/**
 * parseMessageFormatting - Utility to parse WhatsApp-style text formatting
 * Supports: *bold*, _italic_, ~strikethrough~, `code`
 * 
 * @param {string} text - Raw text with formatting markers
 * @returns {Array} - Array of strings and React elements
 */
export const parseMessageFormatting = (text) => {
    if (!text || typeof text !== 'string') return [text];

    const parts = [];
    let currentIndex = 0;

    // Combined regex for all formatting types
    // Order matters: longer patterns first to avoid conflicts
    const formatRegex = /(\*([^*]+)\*)|(_([^_]+)_)|(~([^~]+)~)|(`([^`]+)`)/g;

    let match;
    while ((match = formatRegex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > currentIndex) {
            parts.push(text.substring(currentIndex, match.index));
        }

        // Determine which group matched and apply appropriate styling
        if (match[1]) {
            // Bold: *text*
            parts.push(
                <strong key={`bold-${match.index}`} className="font-bold">
                    {match[2]}
                </strong>
            );
        } else if (match[3]) {
            // Italic: _text_
            parts.push(
                <em key={`italic-${match.index}`} className="italic">
                    {match[4]}
                </em>
            );
        } else if (match[5]) {
            // Strikethrough: ~text~
            parts.push(
                <span key={`strike-${match.index}`} className="line-through">
                    {match[6]}
                </span>
            );
        } else if (match[7]) {
            // Code: `text`
            parts.push(
                <code
                    key={`code-${match.index}`}
                    className="bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-sm font-mono"
                >
                    {match[8]}
                </code>
            );
        }

        currentIndex = formatRegex.lastIndex;
    }

    // Add remaining text
    if (currentIndex < text.length) {
        parts.push(text.substring(currentIndex));
    }

    return parts.length > 0 ? parts : [text];
};

/**
 * MessageFormatting - Component wrapper for formatted text
 * Can be used directly in message bubbles
 */
export const MessageFormatting = ({ text, className = '' }) => {
    const formattedParts = parseMessageFormatting(text);

    return (
        <span className={className}>
            {formattedParts}
        </span>
    );
};

/**
 * combineFormatting - Combine message formatting with mention parsing
 * Useful when both features need to work together
 * 
 * @param {string|Array} content - Text or array from mention parsing
 * @param {Function} mentionParser - Optional mention parser function
 * @returns {Array} - Combined formatted content
 */
export const combineFormatting = (content, mentionParser = null) => {
    // If content is already an array (from mention parsing), process each part
    if (Array.isArray(content)) {
        return content.map((part, index) => {
            // If part is a React element (mention), keep it as is
            if (React.isValidElement(part)) {
                return part;
            }
            // If part is a string, apply formatting
            if (typeof part === 'string') {
                const formatted = parseMessageFormatting(part);
                return <React.Fragment key={`frag-${index}`}>{formatted}</React.Fragment>;
            }
            return part;
        });
    }

    // If content is a string
    if (typeof content === 'string') {
        // First apply mention parsing if provided
        if (mentionParser) {
            const withMentions = mentionParser(content);
            if (Array.isArray(withMentions)) {
                return combineFormatting(withMentions);
            }
        }
        // Just apply formatting
        return parseMessageFormatting(content);
    }

    return [content];
};

export default parseMessageFormatting;
