/**
 * Music Share Request Component
 * Notification shown to group members when someone wants to share music
 */

import React from 'react';
import { Music, Check, X } from 'lucide-react';

const MusicShareRequest = ({ 
    requesterName, 
    musicTitle, 
    musicType,
    thumbnailUrl,
    onAccept, 
    onReject 
}) => {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border-l-4 border-blue-500 shadow-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start gap-3">
                {/* Icon or Thumbnail */}
                {musicType === 'youtube' && thumbnailUrl ? (
                    <img 
                        src={thumbnailUrl} 
                        alt="Thumbnail"
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                ) : (
                    <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Music size={28} className="text-white" />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="mb-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {requesterName} wants to share music
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                            🎵 {musicTitle}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                            {musicType === 'youtube' ? 'YouTube Video' : 'Audio File'}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onAccept}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Check size={16} />
                            Join
                        </button>
                        <button
                            onClick={onReject}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            <X size={16} />
                            Decline
                        </button>
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                    💡 Join to listen together with synced playback
                </p>
            </div>
        </div>
    );
};

export default MusicShareRequest;
