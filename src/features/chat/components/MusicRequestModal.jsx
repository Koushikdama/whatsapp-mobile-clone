/**
 * Music Request Modal Component
 * Allows users to select and share music (YouTube URL or local file)
 */

import React, { useState, useRef } from 'react';
import { X, Music, Upload, Youtube, AlertCircle } from 'lucide-react';
import musicSessionService from '../../../services/MusicSessionService';

const MusicRequestModal = ({ isOpen, onClose, chatId, onSessionCreated }) => {
    const [musicType, setMusicType] = useState('youtube'); // 'youtube' | 'local'
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('audio/')) {
                setError('Please select an audio file (MP3, WAV, etc.)');
                return;
            }
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleCreateSession = async () => {
        setError(null);
        setIsCreating(true);

        try {
            let musicData;

            if (musicType === 'youtube') {
                // Validate YouTube URL
                const youtubeId = musicSessionService.extractYouTubeId(youtubeUrl);
                if (!youtubeId) {
                    setError('Invalid YouTube URL. Please enter a valid YouTube link.');
                    setIsCreating(false);
                    return;
                }

                musicData = {
                    type: 'youtube',
                    url: youtubeUrl,
                    youtubeId,
                    title: 'YouTube Video', // In production, fetch from YouTube API
                    thumbnail: `https://img.youtube.com/vi/${youtubeId}/default.jpg`
                };
            } else {
                // Local file
                if (!selectedFile) {
                    setError('Please select an audio file');
                    setIsCreating(false);
                    return;
                }

                // Create object URL for local playback
                const fileUrl = URL.createObjectURL(selectedFile);
                musicData = {
                    type: 'local',
                    url: fileUrl,
                    title: selectedFile.name,
                    duration: 0 // Will be set by audio element
                };
            }

            // Create session
            const result = await musicSessionService.createSession(
                chatId,
                'currentUserId', // Replace with actual user ID
                musicData
            );

            if (result.success) {
                console.log('✅ Music session created');
                onSessionCreated(result.session);
                onClose();
            } else {
                setError(result.error || 'Failed to create music session');
            }
        } catch (err) {
            console.error('Error creating music session:', err);
            setError(err.message || 'Something went wrong');
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-wa-dark-paper rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <Music size={18} className="text-blue-600 dark:text-blue-400 sm:w-5 sm:h-5" />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Share Music
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={18} className="text-gray-600 dark:text-gray-400 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {/* Type Selection */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMusicType('youtube')}
                            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all ${
                                musicType === 'youtube'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            <Youtube size={18} className="sm:w-5 sm:h-5" />
                            <span className="hidden xs:inline">YouTube</span>
                            <span className="xs:hidden">YT</span>
                        </button>
                        <button
                            onClick={() => setMusicType('local')}
                            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all ${
                                musicType === 'local'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            <Upload size={18} className="sm:w-5 sm:h-5" />
                            <span className="hidden xs:inline">Local File</span>
                            <span className="xs:hidden">File</span>
                        </button>
                    </div>

                    {/* YouTube URL Input */}
                    {musicType === 'youtube' && (
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                YouTube URL
                            </label>
                            <input
                                type="url"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base text-gray-900 dark:text-gray-100"
                            />
                            <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                Paste a YouTube video URL to share with the group
                            </p>
                        </div>
                    )}

                    {/* Local File Upload */}
                    {musicType === 'local' && (
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full px-3 sm:px-4 py-6 sm:py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex flex-col items-center gap-2"
                            >
                                <Upload size={28} className="text-gray-400 sm:w-8 sm:h-8" />
                                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 text-center px-2">
                                    {selectedFile ? selectedFile.name : 'Click to select audio file'}
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                    MP3, WAV, OGG, etc.
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 sm:w-[18px] sm:h-[18px]" />
                            <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300">
                            💡 All group members will be able to listen together with synchronized playback.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 sm:gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreateSession}
                        disabled={isCreating || (musicType === 'youtube' && !youtubeUrl) || (musicType === 'local' && !selectedFile)}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm sm:text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                        {isCreating ? (
                            <>
                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs sm:text-base">Creating...</span>
                            </>
                        ) : (
                            <>
                                <Music size={16} className="sm:w-[18px] sm:h-[18px]" />
                                <span>Share Music</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MusicRequestModal;
