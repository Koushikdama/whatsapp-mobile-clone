/**
 * Call Recording Notification Component
 * Shows notification when a missed group call recording is available
 */

import React from 'react';
import { Phone, Download, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CallRecordingNotification = ({ 
    callId, 
    groupName, 
    participants = [], 
    duration, 
    timestamp,
    recordingUrl,
    onDismiss,
    onPlay 
}) => {
    const navigate = useNavigate();

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const mins = Math.floor(diffInHours * 60);
            return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const handleDownload = (e) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = recordingUrl;
        link.download = `call-recording-${callId}.webm`;
        link.click();
    };

    return (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border-l-4 border-red-500 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone size={24} className="text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                Missed Group Call Recording
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {groupName}
                            </p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                            {formatTime(timestamp)}
                        </span>
                    </div>

                    {/* Participants */}
                    <div className="flex flex-wrap gap-1 mb-2">
                        {participants.slice(0, 3).map((participant, idx) => (
                            <span 
                                key={idx}
                                className="text-xs bg-white/60 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-700 dark:text-gray-300"
                            >
                                {participant}
                            </span>
                        ))}
                        {participants.length > 3 && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                +{participants.length - 3} more
                            </span>
                        )}
                    </div>

                    {/* Duration */}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Duration: {formatDuration(duration)}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onPlay}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Play size={16} />
                            Play Recording
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Download recording"
                        >
                            <Download size={18} className="text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallRecordingNotification;
