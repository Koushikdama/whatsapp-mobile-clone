/**
 * Avatar Settings Component
 * Allows users to customize their call avatar
 */

import React, { useState, useEffect } from 'react';
import { Smile, Palette, Upload, Check } from 'lucide-react';
import storage from '../../../shared/utils/storage';

const AVATAR_PRESETS = [
    { id: 'gold', name: 'Gold', color: '#FFD700' },
    { id: 'pink', name: 'Pink', color: '#FFB6C1' },
    { id: 'blue', name: 'Blue', color: '#87CEEB' },
    { id: 'green', name: 'Green', color: '#90EE90' },
    { id: 'purple', name: 'Purple', color: '#DDA0DD' },
    { id: 'orange', name: 'Orange', color: '#FFA500' },
    { id: 'red', name: 'Red', color: '#FF6B6B' },
    { id: 'cyan', name: 'Cyan', color: '#40E0D0' },
];

const AvatarSettings = () => {
    const [selectedColor, setSelectedColor] = useState('#FFD700');
    const [customColor, setCustomColor] = useState('');
    const [avatarEnabled, setAvatarEnabled] = useState(true);

    // Load settings
    useEffect(() => {
        const savedColor = storage.local.get('avatar_skin_color', '#FFD700');
        const enabled = storage.local.get('avatar_mode_enabled', true);
        setSelectedColor(savedColor);
        setAvatarEnabled(enabled);
    }, []);

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        storage.local.set('avatar_skin_color', color);
    };

    const handleCustomColor = (e) => {
        const color = e.target.value;
        setCustomColor(color);
        setSelectedColor(color);
        storage.local.set('avatar_skin_color', color);
    };

    const handleAvatarToggle = (enabled) => {
        setAvatarEnabled(enabled);
        storage.local.set('avatar_mode_enabled', enabled);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Avatar Settings</h1>

            {/* Avatar Mode Toggle */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Smile className="text-wa-teal" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Avatar Mode</h2>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Enable Avatar Mode</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Replace your video feed with an animated avatar that tracks your facial expressions
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4">
                            <input
                                type="checkbox"
                                checked={avatarEnabled}
                                onChange={(e) => handleAvatarToggle(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wa-teal/20 dark:peer-focus:ring-wa-teal/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-wa-teal"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Avatar Color Selection */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Palette className="text-wa-teal" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Avatar Appearance</h2>
                </div>

                {/* Preset Colors */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Choose a Color</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {AVATAR_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => handleColorSelect(preset.color)}
                                className={`relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                                    selectedColor === preset.color
                                        ? 'border-wa-teal shadow-lg'
                                        : 'border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                <div
                                    className="w-full h-12 rounded-lg mb-2"
                                    style={{ backgroundColor: preset.color }}
                                />
                                <p className="text-xs text-gray-700 dark:text-gray-300 text-center font-medium">
                                    {preset.name}
                                </p>
                                {selectedColor === preset.color && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-wa-teal rounded-full flex items-center justify-center">
                                        <Check size={14} className="text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Color Picker */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Custom Color</h3>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={customColor || selectedColor}
                            onChange={handleCustomColor}
                            className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                        />
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Choose any color you like
                            </p>
                            <p className="text-xs font-mono text-gray-500 dark:text-gray-500">
                                {selectedColor}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Avatar Preview */}
            <div className="mb-8">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Preview</h3>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg p-8 flex items-center justify-center">
                    <div className="relative">
                        {/* Simple preview of avatar */}
                        <div
                            className="w-32 h-32 rounded-full border-4 border-gray-700"
                            style={{ backgroundColor: selectedColor }}
                        />
                        {/* Eyes */}
                        <div className="absolute top-10 left-8 w-6 h-6 bg-white rounded-full border-2 border-gray-800">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full" />
                        </div>
                        <div className="absolute top-10 right-8 w-6 h-6 bg-white rounded-full border-2 border-gray-800">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full" />
                        </div>
                        {/* Mouth */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-800 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Expression Controls Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">How It Works</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• <strong>Smile</strong> - Your avatar will smile when you smile</li>
                    <li>• <strong>Surprised</strong> - Wide eyes and raised eyebrows</li>
                    <li>• <strong>Sad</strong> - Downturned mouth and eyebrows</li>
                    <li>• <strong>Blink</strong> - Your avatar blinks when you blink</li>
                    <li>• <strong>Talk</strong> - Mouth opens when you speak</li>
                </ul>
            </div>
        </div>
    );
};

export default AvatarSettings;
