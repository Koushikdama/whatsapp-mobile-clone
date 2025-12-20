
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';


const CallContext = createContext(undefined);

export const CallProvider = ({ children }) => {
  const [activeCall, setActiveCall] = useState(null);
  const ringTimerRef = useRef(null);

  const startCall = (contactId, type) => {
    // Create new call instance
    const newCall = {
      id: `call_${Date.now()}`,
      contactId,
      type,
      status: 'ringing',
      isMinimized: false,
      isMuted: false,
      isVideoEnabled: type === 'video'
    };
    setActiveCall(newCall);

    // Simulate connection delay
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    ringTimerRef.current = window.setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'connected', startTime: Date.now() } : null);
    }, 3000);
  };

  const endCall = () => {
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    setActiveCall(prev => prev ? { ...prev, status: 'ended' } : null);

    // Clear call data after animation
    setTimeout(() => {
      setActiveCall(null);
    }, 1000);
  };

  const minimizeCall = () => {
    setActiveCall(prev => prev ? { ...prev, isMinimized: true } : null);
  };

  const maximizeCall = () => {
    setActiveCall(prev => prev ? { ...prev, isMinimized: false } : null);
  };

  const toggleMute = () => {
    setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null);
  };

  const toggleVideo = () => {
    setActiveCall(prev => prev ? { ...prev, isVideoEnabled: !prev.isVideoEnabled } : null);
  };

  return (
    <CallContext.Provider value={{
      activeCall,
      startCall,
      endCall,
      minimizeCall,
      maximizeCall,
      toggleMute,
      toggleVideo
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
};
