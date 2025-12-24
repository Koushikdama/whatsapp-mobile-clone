import React, { useState } from 'react';
import { Headphones } from 'lucide-react';
import noiseCancellationService from '../../../services/NoiseCancellationService';

/**
 * Noise Cancellation Control Component
 * Toggle and settings for AI noise cancellation
 */
const NoiseCancellationControl = ({ onToggle, isActive }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [level, setLevel] = useState('medium');

    const presets = noiseCancellationService.constructor.getPresets();

    const handleToggle = () => {
        onToggle?.(!isActive);
    };

    const handleLevelChange = (newLevel) => {
        setLevel(newLevel);
        onToggle?.(true, presets[newLevel]);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Toggle Button */}
            <button
                onClick={handleToggle}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
                className={`p-4 rounded-full transition-all ${
                    isActive
                        ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                        : 'bg-white/10 text-gray-400 hover:text-white'
                }`}
                title="AI Noise Cancellation"
            >
                <Headphones size={24} />
                {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                )}
            </button>

            {/* Settings Popup */}
            {isOpen && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 rounded-2xl p-4 shadow-2xl border border-gray-700 animate-in zoom-in-95 duration-200 w-64">
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-800"></div>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Headphones size={18} />
                        Noise Cancellation
                    </h3>

                    {/* Level Options */}
                    <div className="space-y-2">
                        {Object.keys(presets).map((presetKey) => (
                            <button
                                key={presetKey}
                                onClick={() => handleLevelChange(presetKey)}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                                    level === presetKey
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="capitalize">{presetKey}</span>
                                    {level === presetKey && (
                                        <span className="text-sm">✓</span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {presetKey === 'light' && 'Minimal processing'}
                                    {presetKey === 'medium' && 'Balanced (recommended)'}
                                    {presetKey === 'aggressive' && 'Maximum suppression'}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Info */}
                    <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
                        <p>Removes background noise using AI</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoiseCancellationControl;
