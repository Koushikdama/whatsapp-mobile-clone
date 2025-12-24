import React, { useState, useEffect } from 'react';

/**
 * Call Reactions Overlay Component
 * Displays floating emoji reactions with animations
 */
const CallReactionsOverlay = ({ reactions = [] }) => {
    const [activeReactions, setActiveReactions] = useState([]);

    useEffect(() => {
        if (reactions.length === 0) return;

        const latestReaction = reactions[reactions.length - 1];
        
        // Add new reaction with unique ID and random position
        const newReaction = {
            id: `${latestReaction.participantId}-${latestReaction.timestamp}`,
            emoji: latestReaction.emoji,
            x: Math.random() * 60 + 20, // Random x position (20-80%)
            participantId: latestReaction.participantId
        };

        setActiveReactions(prev => [...prev, newReaction]);

        // Remove reaction after animation (3 seconds)
        setTimeout(() => {
            setActiveReactions(prev => prev.filter(r => r.id !== newReaction.id));
        }, 3000);
    }, [reactions]);

    return (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
            {activeReactions.map(reaction => (
                <FloatingReaction
                    key={reaction.id}
                    emoji={reaction.emoji}
                    x={reaction.x}
                />
            ))}
        </div>
    );
};

/**
 * Single Floating Reaction Component
 */
const FloatingReaction = ({ emoji, x }) => {
    return (
        <div
            className="absolute bottom-0 animate-float-up"
            style={{
                left: `${x}%`,
                animation: 'floatUp 3s ease-out forwards'
            }}
        >
            <div className="text-6xl drop-shadow-lg animate-wiggle">
                {emoji}
            </div>
        </div>
    );
};

export default CallReactionsOverlay;

// Add these animations to your global CSS or tailwind config
// @keyframes floatUp {
//   0% {
//     bottom: 0;
//     opacity: 0;
//   }
//   10% {
//     opacity: 1;
//   }
//   90% {
//     opacity: 1;
//   }
//   100% {
//     bottom: 100%;
//     opacity: 0;
//   }
// }
// 
// @keyframes wiggle {
//   0%, 100% { transform: rotate(-5deg); }
//   50% { transform: rotate(5deg); }
// }
