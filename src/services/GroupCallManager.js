/**
 * Group Call Manager Service
 * Manages multiple WebRTC peer connections in a mesh topology
 * Follows Single Responsibility Principle - handles group call coordination
 */

import webRTCService from './WebRTCService';

class GroupCallManager {
    constructor() {
        // Map callId -> Map of participantId -> { stream, peerConnection, connectionState }
        this.groupCalls = new Map();
        
        // Map callId -> dominant speaker participantId
        this.dominantSpeakers = new Map();
        
        // Audio level monitoring intervals
        this.audioMonitors = new Map();
    }

    /**
     * Create mesh connections for a group call
     * @param {string} callId - Unique call identifier
     * @param {string} localUserId - Current user's ID
     * @param {Array<string>} participantIds - Array of other participant IDs
     * @param {MediaStream} localStream - Local media stream
     * @param {Object} callbacks - Callbacks for events
     * @returns {Promise<boolean>}
     */
    async createMeshConnections(callId, localUserId, participantIds, localStream, callbacks = {}) {
        try {
            console.log(`🌐 [GroupCallManager] Creating mesh for call ${callId} with ${participantIds.length} participants`);

            // Initialize group call tracking
            if (!this.groupCalls.has(callId)) {
                this.groupCalls.set(callId, new Map());
            }

            const participants = this.groupCalls.get(callId);

            // Create peer connection for each participant
            for (const participantId of participantIds) {
                if (participantId === localUserId) continue; // Skip self

                console.log(`🔗 [GroupCallManager] Creating connection to ${participantId}`);

                // Create peer connection using WebRTCService
                const peerConnection = webRTCService.createPeerConnection(
                    `${callId}_${participantId}`,
                    true, // is offerer
                    (candidate) => {
                        callbacks.onIceCandidate?.(participantId, candidate);
                    },
                    (stream) => {
                        // Received remote stream
                        console.log(`📹 [GroupCallManager] Received stream from ${participantId}`);
                        
                        const participant = participants.get(participantId);
                        if (participant) {
                            participant.stream = stream;
                        }
                        
                        callbacks.onRemoteStream?.(participantId, stream);
                    },
                    (state) => {
                        // Connection state changed
                        console.log(`🔄 [GroupCallManager] Connection to ${participantId}: ${state}`);
                        
                        const participant = participants.get(participantId);
                        if (participant) {
                            participant.connectionState = state;
                        }
                        
                        callbacks.onConnectionStateChange?.(participantId, state);
                    }
                );

                // Add local stream to peer connection
                webRTCService.addLocalStream(`${callId}_${participantId}`, localStream);

                // Store participant info
                participants.set(participantId, {
                    peerConnection,
                    stream: null,
                    connectionState: 'connecting',
                    audioLevel: 0
                });

                // Create and send offer
                const offer = await webRTCService.createOffer(`${callId}_${participantId}`);
                callbacks.onOffer?.(participantId, offer);
            }

            // Start audio level monitoring for dominant speaker detection
            this.startAudioMonitoring(callId);

            console.log('✅ [GroupCallManager] Mesh connections created');
            return true;

        } catch (error) {
            console.error('❌ [GroupCallManager] Error creating mesh connections:', error);
            return false;
        }
    }

    /**
     * Handle answer from a participant
     * @param {string} callId - Call identifier
     * @param {string} participantId - Participant who answered
     * @param {RTCSessionDescriptionInit} answer - SDP answer
     */
    async handleAnswer(callId, participantId, answer) {
        try {
            await webRTCService.setRemoteAnswer(`${callId}_${participantId}`, answer);
            console.log(`✅ [GroupCallManager] Answer processed for ${participantId}`);
        } catch (error) {
            console.error(`❌ [GroupCallManager] Error handling answer from ${participantId}:`, error);
        }
    }

    /**
     * Handle incoming offer (when joining existing group call)
     * @param {string} callId - Call identifier
     * @param {string} participantId - Participant who sent offer
     * @param {RTCSessionDescriptionInit} offer - SDP offer
     * @param {MediaStream} localStream - Local stream
     * @param {Object} callbacks - Event callbacks
     * @returns {Promise<RTCSessionDescriptionInit>} - Answer to send back
     */
    async handleOffer(callId, participantId, offer, localStream, callbacks = {}) {
        try {
            console.log(`📥 [GroupCallManager] Handling offer from ${participantId}`);

            if (!this.groupCalls.has(callId)) {
                this.groupCalls.set(callId, new Map());
            }

            const participants = this.groupCalls.get(callId);

            // Create peer connection
            const peerConnection = webRTCService.createPeerConnection(
                `${callId}_${participantId}`,
                false, // not offerer
                (candidate) => {
                    callbacks.onIceCandidate?.(participantId, candidate);
                },
                (stream) => {
                    const participant = participants.get(participantId);
                    if (participant) {
                        participant.stream = stream;
                    }
                    callbacks.onRemoteStream?.(participantId, stream);
                },
                (state) => {
                    const participant = participants.get(participantId);
                    if (participant) {
                        participant.connectionState = state;
                    }
                    callbacks.onConnectionStateChange?.(participantId, state);
                }
            );

            // Add local stream
            webRTCService.addLocalStream(`${callId}_${participantId}`, localStream);

            // Store participant
            participants.set(participantId, {
                peerConnection,
                stream: null,
                connectionState: 'connecting',
                audioLevel: 0
            });

            // Create answer
            const answer = await webRTCService.createAnswer(`${callId}_${participantId}`, offer);
            
            console.log(`✅ [GroupCallManager] Answer created for ${participantId}`);
            return answer;

        } catch (error) {
            console.error(`❌ [GroupCallManager] Error handling offer from ${participantId}:`, error);
            throw error;
        }
    }

    /**
     * Add ICE candidate for a participant
     * @param {string} callId - Call identifier
     * @param {string} participantId - Participant ID
     * @param {RTCIceCandidateInit} candidate - ICE candidate
     */
    async addIceCandidate(callId, participantId, candidate) {
        try {
            await webRTCService.addIceCandidate(`${callId}_${participantId}`, candidate);
        } catch (error) {
            console.error(`❌ [GroupCallManager] Error adding ICE candidate for ${participantId}:`, error);
        }
    }

    /**
     * Add a new participant to an existing group call
     * @param {string} callId - Call identifier
     * @param {string} participantId - New participant ID
     * @param {MediaStream} localStream - Local stream
     * @param {Object} callbacks - Event callbacks
     */
    async addParticipant(callId, participantId, localStream, callbacks = {}) {
        console.log(`➕ [GroupCallManager] Adding participant ${participantId} to call ${callId}`);
        
        // Create connection just to this participant
        await this.createMeshConnections(callId, 'local', [participantId], localStream, callbacks);
    }

    /**
     * Remove a participant from the group call
     * @param {string} callId - Call identifier
     * @param {string} participantId - Participant ID to remove
     */
    removeParticipant(callId, participantId) {
        console.log(`➖ [GroupCallManager] Removing participant ${participantId} from call ${callId}`);

        const participants = this.groupCalls.get(callId);
        if (!participants) return;

        // Close connection to this participant
        webRTCService.closePeerConnection(`${callId}_${participantId}`);
        
        // Remove from tracking
        participants.delete(participantId);

        // If no participants left, cleanup call
        if (participants.size === 0) {
            this.cleanupCall(callId);
        }
    }

    /**
     * Get all participant streams for a call
     * @param {string} callId - Call identifier
     * @returns {Map<string, MediaStream>} - Map of participantId -> stream
     */
    getParticipantStreams(callId) {
        const participants = this.groupCalls.get(callId);
        if (!participants) return new Map();

        const streams = new Map();
        participants.forEach((data, participantId) => {
            if (data.stream) {
                streams.set(participantId, data.stream);
            }
        });

        return streams;
    }

    /**
     * Get participant count for a call
     * @param {string} callId - Call identifier
     * @returns {number}
     */
    getParticipantCount(callId) {
        const participants = this.groupCalls.get(callId);
        return participants ? participants.size : 0;
    }

    /**
     * Start monitoring audio levels for dominant speaker detection
     * @private
     * @param {string} callId - Call identifier
     */
    startAudioMonitoring(callId) {
        // Clear existing monitor if any
        this.stopAudioMonitoring(callId);

        const interval = setInterval(() => {
            const participants = this.groupCalls.get(callId);
            if (!participants || participants.size === 0) {
                this.stopAudioMonitoring(callId);
                return;
            }

            // Find participant with highest audio level
            let maxLevel = 0;
            let dominantParticipant = null;

            participants.forEach((data, participantId) => {
                if (data.stream) {
                    const audioLevel = this.getAudioLevel(data.stream);
                    data.audioLevel = audioLevel;

                    if (audioLevel > maxLevel) {
                        maxLevel = audioLevel;
                        dominantParticipant = participantId;
                    }
                }
            });

            // Update dominant speaker if changed and level is significant
            if (maxLevel > 0.1) { // Threshold to avoid background noise
                const currentDominant = this.dominantSpeakers.get(callId);
                if (currentDominant !== dominantParticipant) {
                    this.dominantSpeakers.set(callId, dominantParticipant);
                    console.log(`🎤 [GroupCallManager] Dominant speaker: ${dominantParticipant}`);
                }
            }
        }, 500); // Check every 500ms

        this.audioMonitors.set(callId, interval);
    }

    /**
     * Stop audio monitoring
     * @private
     * @param {string} callId - Call identifier
     */
    stopAudioMonitoring(callId) {
        const interval = this.audioMonitors.get(callId);
        if (interval) {
            clearInterval(interval);
            this.audioMonitors.delete(callId);
        }
    }

    /**
     * Get audio level from stream
     * @private
     * @param {MediaStream} stream - Media stream
     * @returns {number} - Audio level (0-1)
     */
    getAudioLevel(stream) {
        try {
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) return 0;

            // This is a simplified version - in production you'd use Web Audio API
            // to get actual audio levels via AnalyserNode
            return Math.random(); // Placeholder - replace with actual audio analysis
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get dominant speaker for a call
     * @param {string} callId - Call identifier
     * @returns {string|null} - Participant ID of dominant speaker
     */
    getDominantSpeaker(callId) {
        return this.dominantSpeakers.get(callId) || null;
    }

    /**
     * Check if call is a group call
     * @param {string} callId - Call identifier
     * @returns {boolean}
     */
    isGroupCall(callId) {
        const participants = this.groupCalls.get(callId);
        return participants ? participants.size > 1 : false;
    }

    /**
     * Cleanup a specific call
     * @param {string} callId - Call identifier
     */
    cleanupCall(callId) {
        console.log(`🧹 [GroupCallManager] Cleaning up call: ${callId}`);

        const participants = this.groupCalls.get(callId);
        if (participants) {
            // Close all peer connections
            participants.forEach((data, participantId) => {
                webRTCService.closePeerConnection(`${callId}_${participantId}`);
            });
            participants.clear();
        }

        // Stop audio monitoring
        this.stopAudioMonitoring(callId);

        // Remove from tracking
        this.groupCalls.delete(callId);
        this.dominantSpeakers.delete(callId);

        console.log('✅ [GroupCallManager] Call cleaned up');
    }

    /**
     * Cleanup all group calls
     */
    cleanup() {
        console.log('🧹 [GroupCallManager] Cleaning up all group calls');

        this.groupCalls.forEach((participants, callId) => {
            this.cleanupCall(callId);
        });

        this.groupCalls.clear();
        this.dominantSpeakers.clear();
    }
}

// Export singleton instance
export const groupCallManager = new GroupCallManager();
export default groupCallManager;
