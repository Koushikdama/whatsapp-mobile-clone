/**
 * Call Recording Player Component
 * Plays back recorded call audio with playback controls
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Clock } from 'lucide-react';

const CallRecordingPlayer = ({ recordingUrl, duration, participants = [], timestamp }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(duration || 0);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setAudioDuration(audio.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (e) => {
        const bar = e.currentTarget;
        const rect = bar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * audioDuration;

        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = recordingUrl;
        link.download = `call-recording-${timestamp || Date.now()}.webm`;
        link.click();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-blue-200 dark:border-gray-700">
            <audio ref={audioRef} src={recordingUrl} preload="metadata" />

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <Clock size={16} className="text-white" />
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                            Missed Call Recording
                        </span>
                    </div>
                    {timestamp && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 ml-10">
                            {formatDate(timestamp)}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleDownload}
                    className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-full transition-colors"
                    title="Download recording"
                >
                    <Download size={18} className="text-gray-700 dark:text-gray-300" />
                </button>
            </div>

            {/* Participants */}
            {participants.length > 0 && (
                <div className="mb-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Participants:</p>
                    <div className="flex flex-wrap gap-1">
                        {participants.map((participant, idx) => (
                            <span 
                                key={idx}
                                className="text-xs bg-white/60 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300"
                            >
                                {participant}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Playback Controls */}
            <div className="space-y-2">
                {/* Progress Bar */}
                <div 
                    className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full cursor-pointer group relative"
                    onClick={handleSeek}
                >
                    <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(currentTime / audioDuration) * 100}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                    </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {formatTime(currentTime)}
                    </span>

                    <button
                        onClick={handlePlayPause}
                        className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    >
                        {isPlaying ? (
                            <Pause size={18} className="text-white fill-white" />
                        ) : (
                            <Play size={18} className="text-white fill-white ml-0.5" />
                        )}
                    </button>

                    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {formatTime(audioDuration)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CallRecordingPlayer;
