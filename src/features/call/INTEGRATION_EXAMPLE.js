/**
 * CallContext Integration Example
 * This file shows how to integrate all new features into the existing CallContext
 * 
 * INSTRUCTIONS:
 * 1. Copy the relevant sections into your CallContext.jsx
 * 2. Update imports at the top
 * 3. Add state variables
 * 4. Add new methods
 * 5. Update the Provider value
 */

// ============================================
// SECTION 1: IMPORTS
// ============================================
// Add these to your existing imports in CallContext.jsx

import groupCallManager from '../../../services/GroupCallManager';
import callReactionsService from '../../../services/CallReactionsService';
import virtualBackgroundService from '../../../services/VirtualBackgroundService';
import noiseCancellationService from '../../../services/NoiseCancellationService';

// ============================================
// SECTION 2: STATE VARIABLES
// ============================================
// Add these to your CallProvider component

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

// ============================================
// SECTION 3: GROUP CALL METHODS
// ============================================

/**
 * Start a group call
 * @param {Array<string>} participantIds - Array of participant user IDs
 * @param {string} type - 'audio' or 'video'
 */
const startGroupCall = async (participantIds, type) => {
  try {
    console.log(`📞 Starting group ${type} call with`, participantIds);

    // Create group call in signaling
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

    // Get local media stream
    const audioEnabled = true;
    const videoEnabled = type === 'video';
    const stream = await webRTCService.getLocalStream(audioEnabled, videoEnabled);
    setLocalStream(stream);

    // Create mesh connections
    await groupCallManager.createMeshConnections(
      callId,
      currentUser.id,
      participantIds,
      stream,
      {
        onIceCandidate: (participantId, candidate) => {
          // Send ICE candidate via signaling
          signalingService.sendIceCandidate(callId, candidate, true);
        },
        onRemoteStream: (participantId, stream) => {
          console.log(`📹 Received stream from ${participantId}`);
          setParticipants(prev => {
            const existing = prev.find(p => p.id === participantId);
            if (existing) {
              return prev.map(p => p.id === participantId ? { ...p, stream } : p);
            }
            return [...prev, { id: participantId, stream, isMuted: false }];
          });
        },
        onConnectionStateChange: (participantId, state) => {
          console.log(`Connection to ${participantId}: ${state}`);
          if (state === 'connected') {
            setupReactionsForParticipant(callId, participantId);
          }
        },
        onOffer: (participantId, offer) => {
          signalingService.sendGroupCallOffer(callId, participantId, offer);
        }
      }
    );

    // Listen for participant changes
    const unsubscribe = signalingService.listenForParticipantChanges(callId, (activeParticipants) => {
      console.log('Active participants:', activeParticipants);
      // Update UI accordingly
    });
    unsubscribeListenersRef.current.push(unsubscribe);

    // Set active call
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

  } catch (error) {
    console.error('❌ Error starting group call:', error);
  }
};

// ============================================
// SECTION 4: REACTIONS METHODS
// ============================================

/**
 * Setup reactions data channel for a participant
 * @param {string} callId - Call ID
 * @param {string} participantId - Participant ID
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
        // Reaction received
        console.log(`👋 Reaction from ${fromParticipantId}: ${emoji}`);
        setReactions(prev => [
          ...prev,
          {
            participantId: fromParticipantId,
            emoji,
            timestamp: Date.now()
          }
        ]);
      }
    );
  } catch (error) {
    console.error('Error setting up reactions:', error);
  }
};

/**
 * Send a reaction
 * @param {string} emoji - Emoji to send
 */
const sendReaction = (emoji) => {
  if (!activeCall) return;

  const success = callReactionsService.sendReaction(activeCall.id, emoji);
  
  if (success) {
    // Add to own reactions for display
    setReactions(prev => [
      ...prev,
      {
        participantId: 'self',
        emoji,
        timestamp: Date.now()
      }
    ]);
  }
};

// ============================================
// SECTION 5: VIRTUAL BACKGROUND METHODS
// ============================================

/**
 * Toggle virtual background
 * @param {Object} preset - Background preset or null to disable
 */
const toggleVirtualBackground = async (preset) => {
  if (!activeCall || !localStream) return;

  try {
    if (!preset || preset.id === 'none') {
      // Remove virtual background
      if (isVirtualBackgroundEnabled) {
        const originalStream = virtualBackgroundService.removeVirtualBackground(activeCall.id);
        
        if (originalStream) {
          const videoTrack = originalStream.getVideoTracks()[0];
          
          // Replace track for all connections
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
      // Apply virtual background
      const processedStream = await virtualBackgroundService.applyVirtualBackground(
        activeCall.id,
        localStream,
        preset
      );
      
      const videoTrack = processedStream.getVideoTracks()[0];
      
      // Replace track for all connections
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

// ============================================
// SECTION 6: NOISE CANCELLATION METHODS
// ============================================

/**
 * Toggle noise cancellation
 * @param {boolean} enabled - Enable or disable
 * @param {Object} options - Noise cancellation options (preset)
 */
const toggleNoiseCancellation = async (enabled, options = null) => {
  if (!activeCall || !localStream) return;

  try {
    if (enabled) {
      // Get preset if options not provided
      const preset = options || noiseCancellationService.constructor.getPresets()[noiseCancellationLevel];
      
      // Apply noise cancellation
      const processedStream = await noiseCancellationService.applyNoiseCancellation(
        activeCall.id,
        localStream,
        preset
      );
      
      const audioTrack = processedStream.getAudioTracks()[0];
      
      // Replace track for all connections
      if (isGroupCall) {
        participants.forEach(p => {
          webRTCService.replaceAudioTrack(`${activeCall.id}_${p.id}`, audioTrack);
        });
      } else {
        await webRTCService.replaceAudioTrack(activeCall.id, audioTrack);
      }
      
      setIsNoiseCancellationEnabled(true);
    } else {
      // Remove noise cancellation
      const originalStream = noiseCancellationService.removeNoiseCancellation(activeCall.id);
      
      if (originalStream) {
        const audioTrack = originalStream.getAudioTracks()[0];
        
        // Replace track for all connections
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

// ============================================
// SECTION 7: CLEANUP
// ============================================

// Update your existing cleanup() function to include:

const cleanup = () => {
  console.log('🧹 [CallContext] Cleaning up call resources');

  if (activeCall?.id) {
    webRTCService.closePeerConnection(activeCall.id);
    
    // Cleanup group call if applicable
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

  // ... rest of existing cleanup code

  // Reset new state
  setParticipants([]);
  setIsGroupCall(false);
  setDominantSpeaker(null);
  setReactions([]);
  setIsVirtualBackgroundEnabled(false);
  setCurrentBackground(null);
  setIsNoiseCancellationEnabled(false);
};

// ============================================
// SECTION 8: PROVIDER VALUE
// ============================================

// Update your CallContext.Provider value to include:

return (
  <CallContext.Provider value={{
    // Existing state
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    connectionState,
    isRecording,
    isScreenSharing,
    isPiPMode,

    // New state
    participants,
    isGroupCall,
    dominantSpeaker,
    reactions,
    isVirtualBackgroundEnabled,
    currentBackground,
    isNoiseCancellationEnabled,
    noiseCancellationLevel,

    // Existing methods
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    minimizeCall,
    maximizeCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    getCallQuality,
    enterPiP,
    exitPiP,
    startScreenShare,
    stopScreenShare,

    // New methods
    startGroupCall,
    sendReaction,
    toggleVirtualBackground,
    toggleNoiseCancellation
  }}>
    {children}
  </CallContext.Provider>
);

// ============================================
// USAGE IN CALLOVERLAY
// ============================================

/*
In your CallOverlay.jsx component:

1. Import new components:
import ParticipantGrid from './ParticipantGrid';
import CallReactionsPicker from './CallReactionsPicker';
import CallReactionsOverlay from './CallReactionsOverlay';
import VirtualBackgroundPicker from './VirtualBackgroundPicker';
import NoiseCancellationControl from './NoiseCancellationControl';

2. Get new state/methods from context:
const { 
  participants, 
  isGroupCall, 
  dominantSpeaker, 
  reactions,
  sendReaction,
  toggleVirtualBackground,
  toggleNoiseCancellation,
  isVirtualBackgroundEnabled,
  isNoiseCancellationEnabled
} = useCall();

3. Add reactions overlay (outside main content):
<CallReactionsOverlay reactions={reactions} />

4. Replace video section for group calls:
{isGroupCall ? (
  <ParticipantGrid
    participants={participants}
    localStream={localStream}
    currentUserId={currentUser.id}
    users={users}
    dominantSpeakerId={dominantSpeaker}
  />
) : (
  // Existing 1-on-1 video UI
)}

5. Add new control buttons:
<CallReactionsPicker 
  callId={activeCall.id} 
  onReactionSent={sendReaction} 
/>

<VirtualBackgroundPicker 
  callId={activeCall.id} 
  onBackgroundChange={toggleVirtualBackground}
  isActive={isVirtualBackgroundEnabled}
/>

<NoiseCancellationControl
  onToggle={toggleNoiseCancellation}
  isActive={isNoiseCancellationEnabled}
/>
*/
