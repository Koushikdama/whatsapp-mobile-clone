import React, { useState } from 'react';
import { Image, Sparkles } from 'lucide-react';
import virtualBackgroundService from '../../../services/VirtualBackgroundService';

/**
 * Virtual Background Picker Component
 * Allows users to select and configure virtual backgrounds
 */
const VirtualBackgroundPicker = ({ callId, onBackgroundChange, isActive }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState('none');

    const presets = virtualBackgroundService.constructor.getPresets();

    const handlePresetClick = (preset) => {
        setSelectedPreset(preset.id);
        setIsOpen(false);
        onBackgroundChange?.(preset);
    };

    return (
        <div className="relative">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full transition-all ${
                    isActive
                        ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]'
                        : 'bg-white/10 text-gray-400 hover:text-white'
                }`}
                title="Virtual Background"
            >
                <Sparkles size={24} />
            </button>

            {/* Picker Popup */}
            {isOpen && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 rounded-2xl p-4 shadow-2xl border border-gray-700 animate-in zoom-in-95 duration-200 w-80">
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-800"></div>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Image size={18} />
                        Virtual Background
                    </h3>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                        {presets.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => handlePresetClick(preset)}
                                className={`aspect-video rounded-lg overflow-hidden transition-all hover:scale-105 ${
                                    selectedPreset === preset.id
                                        ? 'ring-2 ring-purple-500'
                                        : 'ring-1 ring-gray-600 hover:ring-gray-500'
                                }`}
                            >
                                {preset.type === 'none' ? (
                                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                        <span className="text-xs text-gray-400">None</span>
                                    </div>
                                ) : preset.type === 'blur' ? (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 backdrop-blur-md bg-white/5"></div>
                                        <span className="text-xs text-white relative z-10">{preset.name}</span>
                                    </div>
                                ) : preset.type === 'image' && preset.url ? (
                                    <div className="relative w-full h-full">
                                        <img 
                                            src={preset.url} 
                                            alt={preset.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/20 flex items-end p-1">
                                            <span className="text-[10px] text-white">{preset.name}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center`}
                                        style={{ backgroundColor: preset.color || '#000' }}
                                    >
                                        <span className="text-xs text-white">{preset.name}</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Info */}
                    <div className="mt-3 text-xs text-gray-400 text-center">
                        {isActive ? '✓ Background active' : 'Select a background'}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VirtualBackgroundPicker;
