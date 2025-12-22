/**
 * Floating Music Player Component
 * Draggable, minimizable music player for synchronized playback
 * Supports YouTube videos and local audio files
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Minimize2, Maximize2, Volume2 } from 'lucide-react';
import musicSessionService from '../../../services/MusicSessionService';

const FloatingMusicPlayer = ({ session, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 180 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    
    const playerRef = useRef(null);
    const audioRef = useRef(null);
    const youtubePlayerRef = useRef(null);

    // Subscribe to session updates
    useEffect(() => {
        if (!session) return;

        const unsubscribe = musicSessionService.subscribeToSession(session.id, (updatedSession) => {
            if (updatedSession.isPlaying !== isPlaying) {
                setIsPlaying(updatedSession.isPlaying);
                
                // Sync playback
                if (session.musicType === 'youtube' && youtubePlayerRef.current) {
                    if (updatedSession.isPlaying) {
                        youtubePlayerRef.current.playVideo();
                    } else {
                        youtubePlayerRef.current.pauseVideo();
                    }
                } else if (audioRef.current) {
                    if (updatedSession.isPlaying) {
                        audioRef.current.play();
                    } else {
                        audioRef.current.pause();
                    }
                }
            }

            // Sync time (with threshold to avoid constant updates)
            if (Math.abs(updatedSession.currentTime - currentTime) > 2) {
                setCurrentTime(updatedSession.currentTime);
                if (session.musicType === 'youtube' && youtubePlayerRef.current) {
                    youtubePlayerRef.current.seekTo(updatedSession.currentTime);
                } else if (audioRef.current) {
                    audioRef.current.currentTime = updatedSession.currentTime;
                }
            }
        });

        return unsubscribe;
    }, [session]);

    // YouTube player initialization
    useEffect(() => {
        if (session?.musicType === 'youtube' && session.youtubeId) {
            // Load YouTube IFrame API
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                document.body.appendChild(tag);

                window.onYouTubeIframeAPIReady = () => {
                    initYouTubePlayer();
                };
            } else {
                initYouTubePlayer();
            }
        }
    }, [session]);

    const initYouTubePlayer = () => {
        youtubePlayerRef.current = new window.YT.Player('youtube-player', {
            height: '0',
            width: '0',
            videoId: session.youtubeId,
            events: {
                onReady: (event) => {
                    setDuration(event.target.getDuration());
                },
                onStateChange: (event) => {
                    if (event.data === window.YT.PlayerState.PLAYING) {
                        // Update session when local user plays
                        if (!isPlaying) {
                            handlePlayPause();
                        }
                    } else if (event.data === window.YT.PlayerState.PAUSED) {
                        if (isPlaying) {
                            handlePlayPause();
                        }
                    }
                }
            }
        });

        // Update current time periodically
        const interval = setInterval(() => {
            if (youtubePlayerRef.current?.getCurrentTime) {
                setCurrentTime(youtubePlayerRef.current.getCurrentTime());
            }
        }, 1000);

        return () => clearInterval(interval);
    };

    // Local audio player
    useEffect(() => {
        if (session?.musicType === 'local' && audioRef.current) {
            audioRef.current.addEventListener('loadedmetadata', () => {
                setDuration(audioRef.current.duration);
            });

            audioRef.current.addEventListener('timeupdate', () => {
                setCurrentTime(audioRef.current.currentTime);
            });
        }
    }, [session]);

    const handlePlayPause = async () => {
        const newIsPlaying = !isPlaying;
        setIsPlaying(newIsPlaying);

        // Update session for all participants
        await musicSessionService.updatePlaybackState(
            session.id,
            newIsPlaying,
            currentTime
        );
    };

    const handleSeek = async (e) => {
        const bar = e.currentTarget;
        const rect = bar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;

        setCurrentTime(newTime);
        await musicSessionService.seek(session.id, newTime);

        if (session.musicType === 'youtube' && youtubePlayerRef.current) {
            youtubePlayerRef.current.seekTo(newTime);
        } else if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Dragging handlers
    const handleMouseDown = (e) => {
        if (e.target.closest('.player-controls')) return; // Don't drag when clicking controls
        
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // Keep within viewport bounds
            const maxX = window.innerWidth - 320;
            const maxY = window.innerHeight - (isMinimized ? 60 : 160);

            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleClose = async () => {
        await musicSessionService.endSession(session.id);
        onClose();
    };

    if (!session) return null;

    // Responsive sizing
    const playerWidth = isDragging ? (isMinimized ? 240 : 320) : (isMinimized ? 240 : 320);
    const playerHeight = isMinimized ? 60 : 160;

    return (
        <div
            ref={playerRef}
            className={`fixed z-[150] bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl transition-all duration-300 ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `min(${playerWidth}px, calc(100vw - 32px))`, // Responsive width
                height: `${playerHeight}px`,
                minWidth: '200px' // Minimum width for readability
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Hidden YouTube Player */}
            {session.musicType === 'youtube' && (
                <div id="youtube-player" style={{ display: 'none' }}></div>
            )}

            {/* Hidden Audio Element */}
            {session.musicType === 'local' && (
                <audio ref={audioRef} src={session.musicUrl} />
            )}

            {/* Header */}
            <div className="flex items-center justify-between p-2 sm:p-3 border-b border-white/20">
                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-xs sm:text-sm truncate">
                        {session.musicTitle}
                    </h4>
                    {!isMinimized && (
                        <p className="text-white/70 text-[10px] sm:text-xs">{session.participants.length} listening</p>
                    )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 ml-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                        className="p-1 sm:p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    >
                        {isMinimized ? <Maximize2 size={14} className="text-white sm:w-4 sm:h-4" /> : <Minimize2 size={14} className="text-white sm:w-4 sm:h-4" />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleClose(); }}
                        className="p-1 sm:p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={14} className="text-white sm:w-4 sm:h-4" />
                    </button>
                </div>
            </div>

            {/* Controls - Only show when not minimized */}
            {!isMinimized && (
                <div className="p-3 sm:p-4 player-controls" onClick={(e) => e.stopPropagation()}>
                    {/* Progress Bar */}
                    <div 
                        className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full mb-3 sm:mb-4 cursor-pointer group"
                        onClick={handleSeek}
                    >
                        <div 
                            className="h-full bg-white rounded-full transition-all group-hover:h-1.5 sm:group-hover:h-2"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        ></div>
                    </div>

                    {/* Time and Controls */}
                    <div className="flex items-center justify-between">
                        <span className="text-white/70 text-[10px] sm:text-xs font-mono whitespace-nowrap">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>

                        <button
                            onClick={handlePlayPause}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:scale-105"
                        >
                            {isPlaying ? (
                                <Pause size={18} className="text-white fill-white sm:w-5 sm:h-5" />
                            ) : (
                                <Play size={18} className="text-white fill-white ml-0.5 sm:w-5 sm:h-5" />
                            )}
                        </button>

                        <Volume2 size={16} className="text-white/70 sm:w-[18px] sm:h-[18px]" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloatingMusicPlayer;
