import React, { useState, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useApp } from '../../context/AppContext';

/**
 * EmojiPicker - Enhanced emoji picker with search and categories
 * Uses emoji-mart library for full-featured emoji selection
 * 
 * @param {Object} props
 * @param {Function} props.onEmojiSelect - Callback when emoji is selected
 * @param {Function} props.onClose - Callback to close picker
 */
const EmojiPicker = ({ onEmojiSelect, onClose }) => {
    const { theme } = useApp();
    const [recentEmojis, setRecentEmojis] = useState(() => {
        try {
            const saved = localStorage.getItem('recentEmojis');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading recent emojis:', error);
            return [];
        }
    });

    const handleEmojiSelect = (emoji) => {
        // Pass the native emoji to parent
        onEmojiSelect(emoji.native);

        // Update recent emojis (keep last 20)
        const updated = [
            emoji.native,
            ...recentEmojis.filter(e => e !== emoji.native)
        ].slice(0, 20);

        setRecentEmojis(updated);

        try {
            localStorage.setItem('recentEmojis', JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving recent emojis:', error);
        }
    };

    return (
        <div className="absolute bottom-full right-0 mb-2 z-50 animate-in fade-in zoom-in-95 duration-200 shadow-2xl rounded-lg overflow-hidden">
            <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme={theme === 'dark' ? 'dark' : 'light'}
                previewPosition="none"
                skinTonePosition="search"
                searchPosition="sticky"
                navPosition="bottom"
                perLine={8}
                maxFrequentRows={2}
                set="native"
                emojiSize={24}
                emojiButtonSize={36}
                locale="en"
                // Style customizations to match WhatsApp theme
                style={{
                    width: '100%',
                    maxWidth: '352px',
                    border: 'none',
                }}
            />
        </div>
    );
};

export default EmojiPicker;
