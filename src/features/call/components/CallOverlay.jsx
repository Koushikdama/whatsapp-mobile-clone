
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Phone, Video, Mic, MicOff, VideoOff, Maximize2, Minimize2, PhoneOff, User as UserIcon, X, Smile } from 'lucide-react';
import { useCall } from '../context/CallContext';
import { useApp } from '../../../shared/context/AppContext';
import { useAvatarMode } from '../hooks/useAvatarMode';

const CallOverlay = () => {
    const { activeCall, endCall, minimizeCall, maximizeCall, toggleMute, toggleVideo } = useCall();
    const { users } = useApp();
    const [duration, setDuration] = useState(0);

    // Avatar Mode Hook
    const { isAvatarMode, toggleAvatarMode, canvasRef, videoRef, isLoading, avatarStream } = useAvatarMode();

    // Dragging State
    const [position, setPosition] = useState(null);
    const draggingRef = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
        let interval;
        if (activeCall?.status === 'connected' && activeCall.startTime) {
            interval = window.setInterval(() => {
                setDuration(Math.floor((Date.now() - activeCall.startTime) / 1000));
            }, 1000);
        } else {
            setDuration(0);
        }
        return () => clearInterval(interval);
    }, [activeCall?.status, activeCall?.startTime]);

    // Reset position when minimized/maximized changes
    useEffect(() => {
        if (!activeCall?.isMinimized) {
            setPosition(null);
        }
    }, [activeCall?.isMinimized]);

    // --- Drag Handlers (Mouse) ---
    const handleMouseDown = (e) => {
        if (!activeCall?.isMinimized || !overlayRef.current) return;
        // Don't start drag if clicking a button
        if ((e.target).closest('button')) return;

        const rect = overlayRef.current.getBoundingClientRect();
        draggingRef.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            initialLeft: rect.left,
            initialTop: rect.top,
            hasMoved: false
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!draggingRef.current?.isDragging) return;
        e.preventDefault(); // Prevent selection

        const dx = e.clientX - draggingRef.current.startX;
        const dy = e.clientY - draggingRef.current.startY;

        // Threshold to differentiate click vs drag
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            draggingRef.current.hasMoved = true;
        }

        setPosition({
            x: draggingRef.current.initialLeft + dx,
            y: draggingRef.current.initialTop + dy
        });
    };

    const handleMouseUp = () => {
        if (draggingRef.current) {
            draggingRef.current.isDragging = false;
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // --- Drag Handlers (Touch) ---
    const handleTouchStart = (e) => {
        if (!activeCall?.isMinimized || !overlayRef.current) return;
        if ((e.target).closest('button')) return;

        const touch = e.touches[0];
        const rect = overlayRef.current.getBoundingClientRect();

        draggingRef.current = {
            isDragging: true,
            startX: touch.clientX,
            startY: touch.clientY,
            initialLeft: rect.left,
            initialTop: rect.top,
            hasMoved: false
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    };

    const handleTouchMove = (e) => {
        if (!draggingRef.current?.isDragging) return;
        e.preventDefault(); // Prevent scrolling while dragging

        const touch = e.touches[0];
        const dx = touch.clientX - draggingRef.current.startX;
        const dy = touch.clientY - draggingRef.current.startY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            draggingRef.current.hasMoved = true;
        }

        setPosition({
            x: draggingRef.current.initialLeft + dx,
            y: draggingRef.current.initialTop + dy
        });
    };

    const handleTouchEnd = () => {
        if (draggingRef.current) {
            draggingRef.current.isDragging = false;
        }
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    };

    const handleOverlayClick = () => {
        // Only maximize if it was a click, not a drag release
        if (!draggingRef.current?.hasMoved) {
            maximizeCall();
        }
    };

    // Cleanup listeners
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    if (!activeCall) return null;

    const contact = users[activeCall.contactId];
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusText = () => {
        switch (activeCall.status) {
            case 'ringing': return 'Ringing...';
            case 'connected': return formatTime(duration);
            case 'ended': return 'Call Ended';
            default: return 'Connecting...';
        }
    };

    // --- MINIMIZED VIEW ---
    if (activeCall.isMinimized) {
        return createPortal(
            <div
                ref={overlayRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onClick={handleOverlayClick}
                style={position ? { left: position.x, top: position.y, right: 'auto', transform: 'none' } : {}}
                className={`fixed z-[100] w-40 md:w-64 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden cursor-grab active:cursor-grabbing group touch-none
                    ${!position ? 'top-20 right-4 animate-in zoom-in-95 duration-200' : ''}
                `}
            >
                {/* Close Button (X) */}
                <button
                    onClick={(e) => { e.stopPropagation(); endCall(); }}
                    className="absolute top-2 right-2 z-50 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full transition-all shadow-sm"
                    title="End Call"
                >
                    <X size={14} strokeWidth={3} />
                </button>

                {/* Minimized Content */}
                <div className="relative aspect-video bg-gray-800 pointer-events-none">
                    {activeCall.type === 'video' && activeCall.isVideoEnabled ? (
                        <img src={`https://picsum.photos/seed/${contact?.id}/400/300`} className="w-full h-full object-cover opacity-80" alt="Video" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <img src={contact?.avatar} className="w-12 h-12 rounded-full opacity-60" alt="" />
                        </div>
                    )}

                    {/* Overlay Info */}
                    <div className="absolute inset-0 bg-black/30 flex flex-col justify-between p-2">
                        <div className="flex justify-between items-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-white">
                            <h4 className="text-xs font-medium truncate">{contact?.name}</h4>
                            <p className="text-[10px] text-gray-300">{getStatusText()}</p>
                        </div>
                    </div>

                    {/* Hover Actions (Centered) */}
                    <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center gap-3 pointer-events-auto">
                        <button
                            onClick={(e) => { e.stopPropagation(); maximizeCall(); }}
                            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
                            title="Maximize"
                        >
                            <Maximize2 size={16} />
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    // --- FULL SCREEN VIEW ---
    return createPortal(
        <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col animate-in fade-in duration-300">
            {/* Hidden Video/Canvas for Tracking */}
            <video ref={videoRef} className="hidden" playsInline muted autoPlay />
            <canvas ref={canvasRef} className="hidden" width={480} height={480} />

            {/* Background / Video Feed */}
            <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
                {activeCall.type === 'video' && activeCall.isVideoEnabled ? (
                    <>
                        {/* Remote Video (Mock) */}
                        <img
                            src={`https://picsum.photos/seed/${contact?.id}/800/1200`}
                            className="absolute inset-0 w-full h-full object-cover opacity-60 blur-sm md:blur-0"
                            alt="Background"
                        />
                        {/* "Self View" - Replaced by Avatar if Active */}
                        <div className="absolute top-4 right-4 w-28 h-36 bg-black rounded-lg border border-gray-600 overflow-hidden shadow-lg z-20">
                            {isAvatarMode ? (
                                <div className="w-full h-full relative">
                                    {isLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-[10px]">
                                            Loading...
                                        </div>
                                    )}
                                    {/* Create a fresh canvas to render stream or just re-append the ref? 
                                        Since we need to show it, we can't easily "show" the hidden canvas ref if it's hidden.
                                        Actually, we can just remove 'hidden' class from the canvasRef above if we want to show it there,
                                        OR, better, we use a simple Video element to show the 'avatarStream' we captured!
                                        That proves the stream is working.
                                    */}
                                    <VideoPreview stream={avatarStream} />
                                </div>
                            ) : (
                                <img src="https://picsum.photos/seed/me/200/300" className="w-full h-full object-cover" alt="Me" />
                            )}
                        </div>
                    </>
                ) : (
                    // Audio Call Background
                    <div className="absolute inset-0 bg-[#111b21] flex items-center justify-center">
                        {/* Ripple Effect if Ringing */}
                        {activeCall.status === 'ringing' && (
                            <div className="absolute w-64 h-64 bg-wa-teal/20 rounded-full animate-ping"></div>
                        )}
                        <img src={contact?.avatar} className="w-32 h-32 rounded-full border-4 border-gray-700 z-10" alt={contact?.name} />
                    </div>
                )}

                {/* Call Info (Top Center) */}
                <div className="relative z-10 flex flex-col items-center mt-10 md:mt-0">
                    <h2 className="text-2xl font-semibold text-white mb-2 drop-shadow-md">{contact?.name}</h2>
                    <p className="text-gray-300 text-sm font-medium bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                        {getStatusText()}
                    </p>
                </div>

                {/* Encrypted Label */}
                <div className="absolute top-12 md:top-6 flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                    End-to-end encrypted
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="bg-[#1f2c34] pb-8 pt-6 px-6 rounded-t-3xl shadow-2xl relative z-20">
                <button
                    onClick={minimizeCall}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <Minimize2 size={24} />
                </button>

                <div className="flex justify-center items-center gap-6 md:gap-10">
                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full transition-all ${activeCall.isVideoEnabled ? 'bg-white/10 text-white' : 'bg-white text-gray-900'}`}
                        disabled={activeCall.status === 'ended'}
                    >
                        {activeCall.isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                    </button>

                    <button
                        onClick={toggleMute}
                        className={`p-4 rounded-full transition-all ${!activeCall.isMuted ? 'bg-white/10 text-white' : 'bg-white text-gray-900'}`}
                        disabled={activeCall.status === 'ended'}
                    >
                        {activeCall.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    {/* Avatar Toggle Button */}
                    {activeCall.type === 'video' && (
                        <button
                            onClick={toggleAvatarMode}
                            className={`p-4 rounded-full transition-all ${isAvatarMode ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                            disabled={activeCall.status === 'ended'}
                            title="Avatar Mode"
                        >
                            <Smile size={24} />
                        </button>
                    )}

                    <button
                        onClick={endCall}
                        className="p-5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transform hover:scale-105 transition-all"
                    >
                        <PhoneOff size={32} fill="currentColor" />
                    </button>

                </div>
            </div>
        </div>,
        document.body
    );
};

// Helper component to display MediaStream
const VideoPreview = ({ stream }) => {
    const videoRef = useRef(null);
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);
    return <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-[#111827]" />;
};

export default CallOverlay;
