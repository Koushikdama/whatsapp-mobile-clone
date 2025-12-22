/**
 * Walkie-Talkie Modal Component
 * Full-screen modal for push-to-talk audio communication in group chats
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Users, AlertCircle } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import walkieTalkieService from '../../../services/WalkieTalkieService';

const WalkieTalkieModal = ({ isOpen, onClose, groupId, groupName, participants = [] }) => {
    const { users, currentUser } = useApp();
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [error, setError] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const timerRef = useRef(null);
    const longPressTimer = useRef(null);

    // Initialize session when modal opens
    useEffect(() => {
        if (isOpen && groupId && !walkieTalkieService.hasActiveSession(groupId)) {
            initializeSession();
        }

        return () => {
            // Cleanup on unmount
            if (groupId && walkieTalkieService.hasActiveSession(groupId)) {
                walkieTalkieService.endSession(groupId);
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isOpen, groupId]);

    const initializeSession = async () => {
        setIsInitializing(true);
        setError(null);

        const result = await walkieTalkieService.initSession(groupId, currentUser.id);

        if (result.success) {
            setPermissionGranted(true);
            console.log('✅ Walkie-talkie session initialized');
        } else {
            setError(result.error);
            console.error('❌ Failed to initialize session:', result.error);
        }

        setIsInitializing(false);
    };

    const startRecording = async () => {
        if (!permissionGranted) {
            setError('Microphone permission not granted');
            return;
        }

        const result = await walkieTalkieService.startRecording(groupId);

        if (result.success) {
            setIsRecording(true);
            setRecordingDuration(0);
            
            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

            console.log('🔴 Recording started');
        } else {
            setError(result.error);
        }
    };

    const stopRecording = async () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        const result = await walkieTalkieService.stopRecording(groupId);

        if (result.success) {
            console.log('⏹️ Recording stopped - Broadcasting to group');
            
            // Broadcast the audio (in real app, this would upload to Firebase and notify participants)
            await walkieTalkieService.broadcastAudio(groupId, result.audioBlob, result.duration);
            
            setIsRecording(false);
            setRecordingDuration(0);
        } else {
            setError(result.error);
            setIsRecording(false);
        }
    };

    // Mouse event handlers
    const handleMouseDown = (e) => {
        e.preventDefault();
        longPressTimer.current = setTimeout(() => {
            startRecording();
        }, 100); // Small delay to prevent accidental triggers
    };

    const handleMouseUp = (e) => {
        e.preventDefault();
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
        if (isRecording) {
            stopRecording();
        }
    };

    // Touch event handlers for mobile
    const handleTouchStart = (e) => {
        e.preventDefault();
        longPressTimer.current = setTimeout(() => {
            startRecording();
        }, 100);
    };

    const handleTouchEnd = (e) => {
        e.preventDefault();
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
        if (isRecording) {
            stopRecording();
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleClose = () => {
        if (isRecording) {
            stopRecording();
        }
        if (groupId && walkieTalkieService.hasActiveSession(groupId)) {
            walkieTalkieService.endSession(groupId);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-wa-teal rounded-full flex items-center justify-center">
                        <Mic size={20} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg">{groupName}</h2>
                        <p className="text-sm text-gray-400">Walkie-Talkie</p>
                    </div>
                </div>
                <button 
                    onClick={handleClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
                {error && (
                    <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3 text-white max-w-md">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {isInitializing ? (
                    <div className="text-center text-white">
                        <div className="w-16 h-16 border-4 border-wa-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg">Initializing microphone...</p>
                    </div>
                ) : !permissionGranted ? (
                    <div className="text-center text-white max-w-md">
                        <AlertCircle size={48} className="mx-auto mb-4 text-orange-400" />
                        <h3 className="text-xl font-semibold mb-2">Microphone Access Required</h3>
                        <p className="text-gray-400 mb-6">
                            Please grant microphone permission to use walkie-talkie
                        </p>
                        <button
                            onClick={initializeSession}
                            className="px-6 py-3 bg-wa-teal text-white rounded-full font-medium hover:bg-wa-teal/90 transition-colors"
                        >
                            Grant Permission
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Push-to-Talk Button */}
                        <div className="relative mb-6 sm:mb-8">
                            <button
                                onMouseDown={handleMouseDown}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchEnd={handleTouchEnd}
                                className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 select-none ${
                                    isRecording
                                        ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)] scale-110'
                                        : 'bg-wa-teal shadow-[0_0_30px_rgba(0,128,105,0.4)] hover:scale-105'
                                }`}
                                style={{ touchAction: 'none' }}
                            >
                                <Mic 
                                    size={56} 
                                    className={`text-white sm:w-16 sm:h-16 ${isRecording ? 'animate-pulse' : ''}`}
                                />
                            </button>

                            {/* Pulsing rings when recording */}
                            {isRecording && (
                                <>
                                    <div className="absolute inset-0 w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-red-500/30 animate-ping"></div>
                                    <div className="absolute inset-0 w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-red-500/20 animate-pulse"></div>
                                </>
                            )}
                        </div>

                        {/* Recording Status */}
                        <div className="text-center text-white mb-6 sm:mb-8 px-4">
                            {isRecording ? (
                                <>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        <p className="text-xl sm:text-2xl font-bold font-mono">
                                            {formatDuration(recordingDuration)}
                                        </p>
                                    </div>
                                    <p className="text-base sm:text-lg text-gray-300">Hold to talk...</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-lg sm:text-xl font-semibold mb-1">Press & Hold to Talk</p>
                                    <p className="text-xs sm:text-sm text-gray-400">Release to send</p>
                                </>
                            )}
                        </div>

                        {/* Participants */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4 max-w-md w-full mx-4">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3 text-white">
                                <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="text-xs sm:text-sm font-medium">Participants ({participants.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {participants.slice(0, 8).map((participantId) => {
                                    const participant = users[participantId];
                                    return (
                                        <div 
                                            key={participantId}
                                            className="flex items-center gap-1.5 sm:gap-2 bg-white/10 rounded-full px-2 py-1 sm:px-3 sm:py-1.5"
                                        >
                                            <img 
                                                src={participant?.avatar || 'https://via.placeholder.com/32'} 
                                                alt={participant?.name}
                                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                                            />
                                            <span className="text-xs sm:text-sm text-white">{participant?.name || 'User'}</span>
                                        </div>
                                    );
                                })}
                                {participants.length > 8 && (
                                    <div className="flex items-center justify-center bg-white/10 rounded-full px-3 py-1.5">
                                        <span className="text-sm text-white">+{participants.length - 8} more</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Instructions Footer */}
            {permissionGranted && !isInitializing && (
                <div className="p-6 bg-black/30 backdrop-blur-sm border-t border-white/10">
                    <div className="max-w-md mx-auto text-center">
                        <p className="text-gray-400 text-sm">
                            💡 <span className="font-medium">Tip:</span> Press and hold the button to speak. 
                            Your voice will be broadcasted to all group members.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalkieTalkieModal;
