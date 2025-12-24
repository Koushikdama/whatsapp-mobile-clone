/**
 * Call Context with WebRTC Integration
 * Manages real-time audio/video calls using WebRTC
 * Follows SOLID principles - clean separation of concerns
 */

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import webRTCService from '../../../services/WebRTCService';
import signalingService from '../../../services/SignalingService';
import callRecordingService from '../../../services/CallRecordingService';
import callFirebaseService from '../../../services/firebase/CallFirebaseService';
import unifiedNotificationService, { NOTIFICATION_TYPES } from '../../../services/UnifiedNotificationService';
import groupCallManager from '../../../services/GroupCallManager';
import callReactionsService from '../../../services/CallReactionsService';
import virtualBackgroundService from '../../../services/VirtualBackgroundService';
import noiseCancellationService from '../../../services/NoiseCancellationService';
import { useApp } from '../../../shared/context/AppContext';
import storage from '../../../shared/utils/storage';

const CallContext = createContext(undefined);

export const CallProvider = ({ children }) => {
  // Call state
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('new'); // new, connecting, connected, disconnected, failed, closed
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isPiPMode, setIsPiPMode] = useState(false);

  // Group call state
  const [participants, setParticipants] = useState([]);
  const [isGroupCall, setIsGroupCall] = useState(false);
  const [dominantSpeaker, setDominantSpeaker] = useState(null);

  // Reactions state
  const [reactions, setReactions] = useState([]);

  // Virtual background state
  const [isVirtualBackgroundEnabled, setIsVirtualBackgroundEnabled] = useState(false);
  const [currentBackground, setCurrentBackground] = useState(null);

  // Noise cancellation state
  const [isNoiseCancellationEnabled, setIsNoiseCancellationEnabled] = useState(false);
  const [noiseCancellationLevel, setNoiseCancellationLevel] = useState('medium');

  // Refs
  const ringTimerRef = useRef(null);
  const missedCallTimerRef = useRef(null);
  const unsubscribeListenersRef = useRef([]);

  // Get current user from AppContext
  const { currentUser } = useApp();

  /**
   * Listen for incoming calls
   */
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('📞 [CallContext] Setting up incoming call listener');

    const unsubscribe = signalingService.listenForIncomingCalls(currentUser.id, (callData) => {
      console.log('📞 [CallContext] Incoming call received:', callData);

      // Only show incoming call if we don't have an active call
      if (!activeCall) {
        setIncomingCall(callData);

        // Send FCM notification
        unifiedNotificationService.sendIncomingCallNotification(
          callData.callee,
          callData.caller,
          callData.type,
          callData.callId
        );

        // Auto-reject after 30 seconds if not answered
        missedCallTimerRef.current = setTimeout(() => {
          handleMissedCall(callData.callId);
        }, 30000);
      }
    });

    unsubscribeListenersRef.current.push(unsubscribe);

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id, activeCall]);

  /**
   * Start an outgoing call
   */
  const startCall = async (contactId, type) => {
    try {
      console.log(`📞 [CallContext] Starting ${type} call to ${contactId}`);

      // Initialize call in signaling server
      const result = await signalingService.initiateCall(currentUser.id, contactId, type);
      if (!result.success) {
        console.error('Failed to initiate call');
        return;
      }

      const callId = result.callId;

      // Get local media stream
      const audioEnabled = true;
      const videoEnabled = type === 'video';
      const stream = await webRTCService.getLocalStream(audioEnabled, videoEnabled);
      setLocalStream(stream);

      // Create peer connection
      const peerConnection = webRTCService.createPeerConnection(
        callId,
        true, // is offerer
        (candidate) => {
          // Send ICE candidate
          signalingService.sendIceCandidate(callId, candidate, true);
        },
        (stream) => {
          // Received remote stream
          console.log('📹 [CallContext] Remote stream received');
          setRemoteStream(stream);
        },
        (state) => {
          // Connection state changed
          setConnectionState(state);
          if (state === 'connected') {
            setActiveCall(prev => {
              if (prev) {
                const updated = { ...prev, status: 'connected', startTime: Date.now() };
                // Send call connected notification
                handleCallConnected(callId, contactId);
                return updated;
              }
              return null;
            });
          } else if (state === 'failed' || state === 'disconnected') {
            handleCallFailed(callId, contactId, state);
          }
        }
      );

      // Add local stream to peer connection
      webRTCService.addLocalStream(callId, stream);

      // Create and send offer
      const offer = await webRTCService.createOffer(callId);
      await signalingService.sendOffer(callId, offer);

      // Listen for answer
      const unsubscribeAnswer = signalingService.listenForAnswer(callId, async (answer) => {
        console.log('📥 [CallContext] Answer received');
        await webRTCService.setRemoteAnswer(callId, answer);
      });
      unsubscribeListenersRef.current.push(unsubscribeAnswer);

      // Listen for ICE candidates
      const unsubscribeICE = signalingService.listenForIceCandidates(callId, true, (candidate) => {
        webRTCService.addIceCandidate(callId, candidate);
      });
      unsubscribeListenersRef.current.push(unsubscribeICE);

      // Listen for call status changes
      const unsubscribeStatus = signalingService.listenForStatusChange(callId, (status) => {
        if (status === 'rejected') {
          handleCallRejected();
        } else if (status === 'ended') {
          endCall();
        }
      });
      unsubscribeListenersRef.current.push(unsubscribeStatus);

      // Set active call
      setActiveCall({
        id: callId,
        contactId,
        type,
        status: 'ringing',
        isMinimized: false,
        isMuted: false,
        isVideoEnabled: videoEnabled,
        isOutgoing: true
      });

    } catch (error) {
      console.error('❌ [CallContext] Error starting call:', error);
    }
  };

  /**
   * Accept incoming call
   */
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      console.log('✅ [CallContext] Accepting call:', incomingCall.callId);

      // Clear missed call timer
      if (missedCallTimerRef.current) {
        clearTimeout(missedCallTimerRef.current);
        missedCallTimerRef.current = null;
      }

      const callId = incomingCall.callId;
      const type = incomingCall.type;

      // Get local media stream
      const audioEnabled = true;
      const videoEnabled = type === 'video';
      const stream = await webRTCService.getLocalStream(audioEnabled, videoEnabled);
      setLocalStream(stream);

      // Create peer connection
      webRTCService.createPeerConnection(
        callId,
        false, // not offerer
        (candidate) => {
          signalingService.sendIceCandidate(callId, candidate, false);
        },
        (stream) => {
          console.log('📹 [CallContext] Remote stream received');
          setRemoteStream(stream);
        },
        (state) => {
          setConnectionState(state);
          if (state === 'connected') {
            setActiveCall(prev => {
              if (prev) {
                const updated = { ...prev, status: 'connected', startTime: Date.now() };
                // Send call connected notification
                handleCallConnected(callId, incomingCall.caller);
                return updated;
              }
              return null;
            });
          } else if (state === 'failed' || state === 'disconnected') {
            handleCallFailed(callId, incomingCall.caller, state);
          }
        }
      );

      // Add local stream
      webRTCService.addLocalStream(callId, stream);

      // Listen for offer
      const unsubscribeOffer = signalingService.listenForOffer(callId, async (offer) => {
        console.log('📥 [CallContext] Offer received');
        const answer = await webRTCService.createAnswer(callId, offer);
        await signalingService.sendAnswer(callId, answer);
      });
      unsubscribeListenersRef.current.push(unsubscribeOffer);

      // Listen for ICE candidates
      const unsubscribeICE = signalingService.listenForIceCandidates(callId, false, (candidate) => {
        webRTCService.addIceCandidate(callId, candidate);
      });
      unsubscribeListenersRef.current.push(unsubscribeICE);

      // Listen for status changes
      const unsubscribeStatus = signalingService.listenForStatusChange(callId, (status) => {
        if (status === 'ended') {
          endCall();
        }
      });
      unsubscribeListenersRef.current.push(unsubscribeStatus);

      // Set active call
      setActiveCall({
        id: callId,
        contactId: incomingCall.caller,
        type: incomingCall.type,
        status: 'connecting',
        isMinimized: false,
        isMuted: false,
        isVideoEnabled: videoEnabled,
        isOutgoing: false
      });

      // Clear incoming call
      setIncomingCall(null);

    } catch (error) {
      console.error('❌ [CallContext] Error accepting call:', error);
    }
  };

  /**
   * Reject incoming call
   */
  const rejectCall = async () => {
    if (!incomingCall) return;

    console.log('❌ [CallContext] Rejecting call:', incomingCall.callId);

    // Clear missed call timer
    if (missedCallTimerRef.current) {
      clearTimeout(missedCallTimerRef.current);
      missedCallTimerRef.current = null;
    }

    // Update call status in signaling
    await signalingService.rejectCall(incomingCall.callId);

    // Send notification to caller
    await unifiedNotificationService.sendNotification(
      incomingCall.caller,
      incomingCall.callee,
      NOTIFICATION_TYPES.CALL_DECLINED,
      { callId: incomingCall.callId, callType: incomingCall.type }
    );

    setIncomingCall(null);
  };

  /**
   * Handle missed call
   */
  const handleMissedCall = async (callId) => {
    console.log('📞 [CallContext] Call missed:', callId);

    // Get call data
    const callData = await signalingService.getCallData(callId);
    if (!callData) return;

    // Mark as missed in signaling
    await signalingService.markAsMissed(callId);

    // Log to Firestore
    await callFirebaseService.logCall({
      userId: callData.callee,
      contactId: callData.caller,
      type: callData.type,
      direction: 'incoming',
      status: 'missed',
      duration: 0
    });

    // Check if auto-recording is enabled
    const autoRecord = storage.local.get('call_auto_record_missed', false);
    let recordingUrl = null;

    if (autoRecord && remoteStream) {
      console.log('🔴 [CallContext] Auto-recording missed call');
      const recordingResult = await callRecordingService.startRecording(callId, remoteStream);
      if (recordingResult.success) {
        // Stop recording after a short duration (e.g., 10 seconds)
        setTimeout(async () => {
          const stopResult = await callRecordingService.stopRecording(callId, callData);
          if (stopResult.success) {
            recordingUrl = stopResult.url;
          }
        }, 10000);
      }
    }

    // Send missed call notification
    await unifiedNotificationService.sendNotification(
      callData.callee,
      callData.caller,
      NOTIFICATION_TYPES.MISSED_CALL,
      { callId, callType: callData.type, recordingUrl }
    );

    setIncomingCall(null);
  };

  /**
   * Handle call rejection
   */
  const handleCallRejected = () => {
    console.log('❌ [CallContext] Call was rejected');

    setActiveCall(prev => prev ? { ...prev, status: 'rejected' } : null);

    setTimeout(() => {
      cleanup();
    }, 2000);
  };

  /**
   * End active call
   */
  const endCall = async () => {
    if (!activeCall) return;

    console.log('📵 [CallContext] Ending call:', activeCall.id);

    // Update call status
    await signalingService.endCall(activeCall.id);

  // Update UI
    setActiveCall(prev => prev ? { ...prev, status: 'ended' } : null);

    // Cleanup after animation
    setTimeout(() => {
      cleanup();
    }, 1000);
  };

  /**
   * Cleanup call resources
   */
  const cleanup = () => {
    console.log('🧹 [CallContext] Cleaning up call resources');

    if (activeCall?.id) {
      webRTCService.closePeerConnection(activeCall.id);

      // Cleanup group call
      if (isGroupCall) {
        groupCallManager.cleanupCall(activeCall.id);
      }

      // Cleanup reactions
      callReactionsService.cleanupCall(activeCall.id);

      // Cleanup virtual background
      if (isVirtualBackgroundEnabled) {
        virtualBackgroundService.cleanup();
      }

      // Cleanup noise cancellation
      if (isNoiseCancellationEnabled) {
        noiseCancellationService.cleanup();
      }
    }

    // Unsubscribe from all listeners
    unsubscribeListenersRef.current.forEach(unsubscribe => unsubscribe());
    unsubscribeListenersRef.current = [];

    // Clear timers
    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
    if (missedCallTimerRef.current) {
      clearTimeout(missedCallTimerRef.current);
      missedCallTimerRef.current = null;
    }

  // Clear state
    setActiveCall(null);
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState('new');
    setIsRecording(false);

    // Clear new state
    setParticipants([]);
    setIsGroupCall(false);
    setDominantSpeaker(null);
    setReactions([]);
    setIsVirtualBackgroundEnabled(false);
    setCurrentBackground(null);
    setIsNoiseCancellationEnabled(false);
  };

  /**
   * Minimize call
   */
  const minimizeCall = () => {
    setActiveCall(prev => prev ? { ...prev, isMinimized: true } : null);
  };

  /**
   * Maximize call
   */
  const maximizeCall = () => {
    setActiveCall(prev => prev ? { ...prev, isMinimized: false } : null);
  };

  /**
   * Toggle mute
   */
  const toggleMute = () => {
    if (!activeCall) return;

    const newMuted = !activeCall.isMuted;
    webRTCService.toggleAudio(activeCall.id, !newMuted);
    setActiveCall(prev => prev ? { ...prev, isMuted: newMuted } : null);
  };

  /**
   * Toggle video
   */
  const toggleVideo = () => {
    if (!activeCall) return;

    const newVideoEnabled = !activeCall.isVideoEnabled;
    webRTCService.toggleVideo(activeCall.id, newVideoEnabled);
    setActiveCall(prev => prev ? { ...prev, isVideoEnabled: newVideoEnabled } : null);
  };

  /**
   * Switch camera (front/back)
   */
  const switchCamera = async () => {
    if (!activeCall) return;
    await webRTCService.switchCamera(activeCall.id);
  };

  /**
   * Get call quality stats
   */
  const getCallQuality = async () => {
    if (!activeCall) return null;
    return await webRTCService.getConnectionStats(activeCall.id);
  };

  /**
   * Enter Picture-in-Picture mode
   */
  const enterPiP = async (videoElement) => {
    try {
      await webRTCService.enterPictureInPicture(videoElement);
      setIsPiPMode(true);
    } catch (error) {
      console.error('Failed to enter PiP:', error);
    }
  };

  /**
   * Exit Picture-in-Picture mode
   */
  const exitPiP = async () => {
    try {
      await webRTCService.exitPictureInPicture();
      setIsPiPMode(false);
    } catch (error) {
      console.error('Failed to exit PiP:', error);
    }
  };

  /**
   * Start screen sharing
   */
  const startScreenShare = async () => {
    if (!activeCall) return;

    try {
      await webRTCService.startScreenShare(activeCall.id);
      setIsScreenSharing(true);
    } catch (error) {
      console.error('Failed to start screen share:', error);
      // User cancelled or error occurred
      setIsScreenSharing(false);
    }
  };

  /**
   * Stop screen sharing
   */
  const stopScreenShare = async () => {
    if (!activeCall) return;

    try {
      await webRTCService.stopScreenShare(activeCall.id);
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Failed to stop screen share:', error);
    }
  };

  /**
   * Start a group call
   */
  const startGroupCall = async (participantIds, type) => {
    try {
      console.log(`📞 [CallContext] Starting group ${type} call`);

      // Apply noise cancellation if enabled before creating call
      let streamToUse = null;
      const audioEnabled = true;
      const videoEnabled = type === 'video';
      const rawStream = await webRTCService.getLocalStream(audioEnabled, videoEnabled);

      if (isNoiseCancellationEnabled && audioEnabled) {
        const preset = noiseCancellationService.constructor.getPresets()[noiseCancellationLevel];
        streamToUse = await noiseCancellationService.applyNoiseCancellation(
          'temp_' + Date.now(),
          rawStream,
          preset
        );
      } else {
        streamToUse = rawStream;
      }

      setLocalStream(streamToUse);

      // Create group call
      const result = await signalingService.createGroupCall(
        currentUser.id,
        [currentUser.id, ...participantIds],
        type
      );

      if (!result.success) {
        console.error('Failed to create group call');
        return;
      }

      const callId = result.callId;

      // Create mesh connections
      await groupCallManager.createMeshConnections(
        callId,
        currentUser.id,
        participantIds,
        streamToUse,
        {
          onIceCandidate: (participantId, candidate) => {
            signalingService.sendIceCandidate(callId, candidate, true);
          },
          onRemoteStream: (participantId, stream) => {
            setParticipants(prev => {
              const existing = prev.find(p => p.id === participantId);
              if (existing) {
                return prev.map(p => p.id === participantId ? { ...p, stream } : p);
              }
              return [...prev, { id: participantId, stream, isMuted: false }];
            });
          },
          onConnectionStateChange: (participantId, state) => {
            if (state === 'connected') {
              setupReactionsForParticipant(callId, participantId);
            } else if (state === 'disconnected' || state === 'failed') {
              handleParticipantLeft(participantId);
            }
          },
          onOffer: (participantId, offer) => {
            signalingService.sendGroupCallOffer(callId, participantId, offer);
          }
        }
      );

      setActiveCall({
        id: callId,
        type,
        status: 'connecting',
        isMinimized: false,
        isMuted: false,
        isVideoEnabled: videoEnabled,
        isGroupCall: true,
        isOutgoing: true
      });

      setIsGroupCall(true);

      // Monitor dominant speaker
      const speakerInterval = setInterval(() => {
        const speaker = groupCallManager.getDominantSpeaker(callId);
        if (speaker) {
          setDominantSpeaker(speaker);
        }
      }, 1000);

      // Store interval for cleanup
      unsubscribeListenersRef.current.push(() => clearInterval(speakerInterval));

    } catch (error) {
      console.error('❌ [CallContext] Error starting group call:', error);
    }
  };

  /**
   * Setup reactions for a participant
   */
  const setupReactionsForParticipant = (callId, participantId) => {
    try {
      const peerConnection = webRTCService.getPeerConnection(`${callId}_${participantId}`);
      if (!peerConnection) return;

      callReactionsService.createDataChannel(
        callId,
        participantId,
        peerConnection,
        (fromParticipantId, emoji) => {
          setReactions(prev => [
            ...prev,
            { participantId: fromParticipantId, emoji, timestamp: Date.now() }
          ]);
        }
      );
    } catch (error) {
      console.error('Error setting up reactions:', error);
    }
  };

  /**
   * Handle participant left
   */
  const handleParticipantLeft = (participantId) => {
    console.log(`➖ [CallContext] Participant left: ${participantId}`);
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  /**
   * Send reaction
   */
  const sendReaction = (emoji) => {
    if (!activeCall) return;

    const success = callReactionsService.sendReaction(activeCall.id, emoji);
    if (success) {
      setReactions(prev => [
        ...prev,
        { participantId: 'self', emoji, timestamp: Date.now() }
      ]);
    }
  };

  /**
   * Toggle virtual background
   */
  const toggleVirtualBackground = async (preset) => {
    if (!activeCall || !localStream) return;

    try {
      if (!preset || preset.id === 'none') {
        if (isVirtualBackgroundEnabled) {
          const originalStream = virtualBackgroundService.removeVirtualBackground(activeCall.id);
          if (originalStream) {
            const videoTrack = originalStream.getVideoTracks()[0];
            if (isGroupCall) {
              participants.forEach(p => {
                webRTCService.replaceVideoTrack(`${activeCall.id}_${p.id}`, videoTrack);
              });
            } else {
              await webRTCService.replaceVideoTrack(activeCall.id, videoTrack);
            }
          }
          setIsVirtualBackgroundEnabled(false);
          setCurrentBackground(null);
        }
      } else {
        const processedStream = await virtualBackgroundService.applyVirtualBackground(
          activeCall.id,
          localStream,
          preset
        );
        const videoTrack = processedStream.getVideoTracks()[0];

        if (isGroupCall) {
          participants.forEach(p => {
            webRTCService.replaceVideoTrack(`${activeCall.id}_${p.id}`, videoTrack);
          });
        } else {
          await webRTCService.replaceVideoTrack(activeCall.id, videoTrack);
        }

        setIsVirtualBackgroundEnabled(true);
        setCurrentBackground(preset);
      }
    } catch (error) {
      console.error('Error toggling virtual background:', error);
    }
  };

  /**
   * Toggle noise cancellation
   */
  const toggleNoiseCancellation = async (enabled, options = null) => {
    if (!activeCall || !localStream) return;

    try {
      if (enabled) {
        const preset = options || noiseCancellationService.constructor.getPresets()[noiseCancellationLevel];
        const processedStream = await noiseCancellationService.applyNoiseCancellation(
          activeCall.id,
          localStream,
          preset
        );
        const audioTrack = processedStream.getAudioTracks()[0];

        if (isGroupCall) {
          participants.forEach(p => {
            webRTCService.replaceAudioTrack(`${activeCall.id}_${p.id}`, audioTrack);
          });
        } else {
          await webRTCService.replaceAudioTrack(activeCall.id, audioTrack);
        }

        setIsNoiseCancellationEnabled(true);
      } else {
        const originalStream = noiseCancellationService.removeNoiseCancellation(activeCall.id);
        if (originalStream) {
          const audioTrack = originalStream.getAudioTracks()[0];

          if (isGroupCall) {
            participants.forEach(p => {
              webRTCService.replaceAudioTrack(`${activeCall.id}_${p.id}`, audioTrack);
            });
          } else {
            await webRTCService.replaceAudioTrack(activeCall.id, audioTrack);
          }
        }

        setIsNoiseCancellationEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling noise cancellation:', error);
    }
  };

  return (
    <CallContext.Provider value={{
      // State
      activeCall,
      incomingCall,
      localStream,
      remoteStream,
      connectionState,
      isRecording,
      isScreenSharing,
      isPiPMode,

      // Group call state
      participants,
      isGroupCall,
      dominantSpeaker,
      reactions,

      // Background & noise cancellation state
      isVirtualBackgroundEnabled,
      currentBackground,
      isNoiseCancellationEnabled,
      noiseCancellationLevel,

      // Outgoing call actions
      startCall,
      startGroupCall,

      // Incoming call actions
      acceptCall,
      rejectCall,

      // Active call actions
      endCall,
      minimizeCall,
      maximizeCall,
      toggleMute,
      toggleVideo,
      switchCamera,
      getCallQuality,

      // Advanced features
      enterPiP,
      exitPiP,
      startScreenShare,
      stopScreenShare,
      sendReaction,
      toggleVirtualBackground,
      toggleNoiseCancellation
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
