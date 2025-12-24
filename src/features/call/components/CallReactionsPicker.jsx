import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import callReactionsService from '../../../services/CallReactionsService';

/**
 * Call Reactions Picker Component
 * Allows users to send emoji reactions during calls
 */
const CallReactionsPicker = ({ callId, onReactionSent }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const reactions = callReactionsService.getAvailableReactions();

    const handleReactionClick = (emoji) => {
        const { canSend, waitTime } = callReactionsService.canSendReaction(callId);
        
        if (!canSend) {
            setCooldown(waitTime);
            return;
        }

        const success = callReactionsService.sendReaction(callId, emoji);
        
        if (success) {
            setIsOpen(false);
            onReactionSent?.(emoji);
            
            // Update cooldown
            setCooldown(2);
        }
    };

    // Cooldown timer
    React.useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => {
                setCooldown(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    return (
        <div className="relative">
            {/* Picker Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full transition-all ${
                    isOpen 
                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                        : 'bg-white/10 text-gray-400 hover:text-white'
                }`}
                title="Send Reaction"
                disabled={cooldown > 0}
            >
                <Smile size={24} />
                {cooldown > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {cooldown}
                    </span>
                )}
            </button>

            {/* Reactions Popup */}
            {isOpen && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 rounded-2xl p-3 shadow-2xl border border-gray-700 animate-in zoom-in-95 duration-200">
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-800"></div>
                    </div>

                    {/* Reactions Grid */}
                    <div className="flex gap-2">
                        {reactions.map((emoji, index) => (
                            <button
                                key={index}
                                onClick={() => handleReactionClick(emoji)}
                                className="text-3xl p-2 hover:scale-125 transition-transform active:scale-95 hover:bg-white/10 rounded-lg"
                                disabled={cooldown > 0}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    {cooldown > 0 && (
                        <div className="text-xs text-gray-400 text-center mt-2">
                            Wait {cooldown}s
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CallReactionsPicker;
