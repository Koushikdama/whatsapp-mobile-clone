import React from 'react';
import { Lock } from 'lucide-react';

/**
 * Empty Chat State Component
 * Displays a welcoming message when a chat has no messages yet
 * Similar to WhatsApp's empty conversation state
 */
const EmptyChatState = ({ 
    contactName = 'User', 
    contactAvatar = null, 
    isGroup = false 
}) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16 z-10">
            {/* Avatar */}
            {contactAvatar && (
                <div className="mb-6">
                    <img 
                        src={contactAvatar} 
                        alt={contactName}
                        className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white dark:border-wa-dark-bg"
                    />
                </div>
            )}

            {/* Welcome Message */}
            <h2 className="text-2xl font-medium text-[#111b21] dark:text-gray-100 mb-3 text-center">
                {isGroup ? `Welcome to ${contactName}` : `Say hello to ${contactName}`}
            </h2>
            
            <p className="text-[#667781] dark:text-gray-400 text-center mb-8 max-w-sm">
                {isGroup 
                    ? 'Start a conversation with the group members.'
                    : 'Send a message to start the conversation.'
                }
            </p>

            {/* Encryption Message */}
            <div className="flex items-center gap-2 bg-[#fef5e7] dark:bg-[#2a3942] px-4 py-3 rounded-lg max-w-md">
                <Lock size={16} className="text-[#d4a373] dark:text-[#d4a373] shrink-0" />
                <p className="text-xs text-[#54656f] dark:text-gray-300 text-center">
                    Messages are end-to-end encrypted. No one outside this chat can read them.
                </p>
            </div>
        </div>
    );
};

export default EmptyChatState;
