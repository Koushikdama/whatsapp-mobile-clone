import React, { useState } from 'react';
import { User as UserIcon, Palette } from 'lucide-react';
import avatarService from '../../../services/AvatarService';

/**
 * Avatar Customization Component
 * Allows users to customize their avatar style during calls
 */
const AvatarCustomization = ({ currentUser, onAvatarChange, isActive }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState('avataaars');

    const availableStyles = avatarService.getAvailableStyles();

    const handleStyleSelect = (styleId) => {
        setSelectedStyle(styleId);
        
        // Generate new avatar with selected style
        const newAvatar = avatarService.generateAvatar(
            currentUser.id || currentUser.name || 'user',
            { style: styleId }
        );
        
        onAvatarChange?.({ type: styleId, url: newAvatar });
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full transition-all ${
                    isActive
                        ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                        : 'bg-white/10 text-gray-400 hover:text-white'
                }`}
                title="Customize Avatar"
            >
                <Palette size={24} />
            </button>

            {/* Picker Popup */}
            {isOpen && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 rounded-2xl p-4 shadow-2xl border border-gray-700 animate-in zoom-in-95 duration-200 w-96 max-h-[500px] overflow-y-auto">
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-800"></div>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <UserIcon size={18} />
                        Choose Avatar Style
                    </h3>

                    {/* Styles Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {availableStyles.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => handleStyleSelect(style.id)}
                                className={`p-3 rounded-lg transition-all hover:scale-105 ${
                                    selectedStyle === style.id
                                        ? 'bg-pink-600 ring-2 ring-pink-400'
                                        : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                            >
                                {/* Avatar Preview */}
                                <div className="w-full aspect-square bg-gray-900 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                    {style.preview ? (
                                        <img 
                                            src={style.preview} 
                                            alt={style.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon size={32} className="text-gray-500" />
                                    )}
                                </div>

                                {/* Style Info */}
                                <div className="text-left">
                                    <h4 className="text-white text-sm font-medium mb-1">{style.name}</h4>
                                    <p className="text-gray-400 text-xs line-clamp-2">{style.description}</p>
                                </div>

                                {/* Selected Indicator */}
                                {selectedStyle === style.id && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Info */}
                    <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400 text-center">
                        <p>Your avatar is shown when video is off</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvatarCustomization;
