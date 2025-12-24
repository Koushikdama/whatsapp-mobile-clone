/**
 * Incoming Call Notification Component
 * Full-screen notification for incoming calls
 * Displays caller info and accept/decline actions
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { useCall } from '../context/CallContext';
import { useApp } from '../../../shared/context/AppContext';

const IncomingCallNotification = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();
  const { users } = useApp();
  const [isRinging, setIsRinging] = useState(false);
  const audioRef = useRef(null);

  // Get caller info
  const caller = incomingCall ? users[incomingCall.caller] : null;

  // Play ringtone when incoming call
  useEffect(() => {
    if (incomingCall) {
      setIsRinging(true);
      // Play ringtone (you can add actual audio file)
      // audioRef.current?.play();
    } else {
      setIsRinging(false);
      // audioRef.current?.pause();
    }

    return () => {
      // audioRef.current?.pause();
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  const isVideoCall = incomingCall.type === 'video';

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-between animate-in fade-in duration-300">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Caller Info */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 px-6">
        {/* Animated Ripple Effect */}
        {isRinging && (
          <div className="absolute w-64 h-64 md:w-80 md:h-80">
            <div className="absolute inset-0 bg-wa-teal/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 bg-wa-teal/10 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          </div>
        )}

        {/* Avatar */}
        <div className="relative z-20 mb-8">
          {caller?.avatar ? (
            <img
              src={caller.avatar}
              alt={caller.name}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 shadow-2xl"
            />
          ) : (
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 bg-gray-700 flex items-center justify-center shadow-2xl">
              <User size={64} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Caller Name */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center drop-shadow-lg">
          {caller?.name || 'Unknown Caller'}
        </h1>

        {/* Call Type */}
        <p className="text-lg md:text-xl text-gray-300 mb-1 flex items-center gap-2">
          {isVideoCall ? (
            <>
              <Video size={20} />
              <span>Incoming Video Call</span>
            </>
          ) : (
            <>
              <Phone size={20} />
              <span>Incoming Call</span>
            </>
          )}
        </p>

        {/* Ringing Text */}
        <p className="text-sm text-gray-400 animate-pulse">
          Ringing...
        </p>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md px-8 pb-12 z-10">
        <div className="flex items-center justify-between gap-8">
          {/* Decline Button */}
          <button
            onClick={rejectCall}
            className="flex-1 flex flex-col items-center gap-3 group"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-2xl transform transition-all hover:scale-110 active:scale-95">
              <PhoneOff size={32} className="text-white" fill="currentColor" />
            </div>
            <span className="text-white text-sm font-medium">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={acceptCall}
            className="flex-1 flex flex-col items-center gap-3 group"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl transform transition-all hover:scale-110 active:scale-95 animate-pulse">
              {isVideoCall ? (
                <Video size={32} className="text-white" fill="currentColor" />
              ) : (
                <Phone size={32} className="text-white" fill="currentColor" />
              )}
            </div>
            <span className="text-white text-sm font-medium">Accept</span>
          </button>
        </div>
      </div>

      {/* Hidden Audio Element for Ringtone */}
      <audio ref={audioRef} loop>
        {/* Add your ringtone audio source here */}
        {/* <source src="/ringtone.mp3" type="audio/mpeg" /> */}
      </audio>

      {/* Encryption Label */}
      <div className="absolute top-6 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-gray-500"></span>
          End-to-end encrypted
        </div>
      </div>
    </div>,
    document.body
  );
};

export default IncomingCallNotification;
