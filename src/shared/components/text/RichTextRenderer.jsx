import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * RichTextRenderer - Renders markdown-formatted text
 * Supports: bold, italic, strikethrough, code, links
 * 
 * @param {Object} props
 * @param {string} props.text - Text to render with markdown formatting
 */
const RichTextRenderer = ({ text }) => {
    if (!text) return null;

    return (
        <div className="whitespace-pre-wrap break-words text-[#111b21] dark:text-gray-100">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Bold
                    strong: ({ children }) => (
                        <strong className="font-bold">{children}</strong>
                    ),
                    // Italic
                    em: ({ children }) => (
                        <em className="italic">{children}</em>
                    ),
                    // Strikethrough
                    del: ({ children }) => (
                        <del className="line-through opacity-75">{children}</del>
                    ),
                    // Inline code
                    code: ({ inline, children }) =>
                        inline ? (
                            <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">
                                {children}
                            </code>
                        ) : (
                            <code className="block bg-gray-200 dark:bg-gray-700 p-2 rounded text-sm font-mono my-1 overflow-x-auto">
                                {children}
                            </code>
                        ),
                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {children}
                        </a>
                    ),
                    // Paragraphs (remove default margin)
                    p: ({ children }) => <span>{children}</span>,
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
};

export default RichTextRenderer;
