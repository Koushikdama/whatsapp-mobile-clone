/**
 * Signaling Service
 * Manages WebRTC signaling using Firebase Realtime Database
 * Handles SDP offer/answer exchange and ICE candidate transmission
 * Follows SOLID principles - Single Responsibility for signaling
 */

import { realtimeDb } from '../config/firebaseConfig';
import { ref, set, push, onValue, off, update, remove, serverTimestamp } from 'firebase/database';

class SignalingService {
    constructor() {
        this.activeListeners = new Map(); // Track active listeners for cleanup
    }

    /**
     * Initiate a call - create call record in Realtime Database
     * @param {string} callerId - User initiating the call
     * @param {string} calleeId - User receiving the call
     * @param {string} type - Call type ('audio' or 'video')
     * @returns {Promise<{success: boolean, callId?: string, error?: string}>}
     */
    async initiateCall(callerId, calleeId, type) {
        try {
            console.log(`📞 [Signaling] Initiating ${type} call from ${callerId} to ${calleeId}`);

            const callId = `call_${Date.now()}_${callerId}`;
            const callRef = ref(realtimeDb, `calls/${callId}`);

            const callData = {
                callId,
                caller: callerId,
                callee: calleeId,
                type, // 'audio' or 'video'
                status: 'ringing', // ringing, accepted, rejected, ended, missed
                createdAt: serverTimestamp(),
                offer: null,
                answer: null
            };

            await set(callRef, callData);
            console.log(`✅ [Signaling] Call record created: ${callId}`);

            return { success: true, callId };
        } catch (error) {
            console.error('❌ [Signaling] Error initiating call:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send SDP offer
     * @param {string} callId - Call identifier
     * @param {RTCSessionDescriptionInit} offer - SDP offer
     */
    async sendOffer(callId, offer) {
        try {
            console.log(`📤 [Signaling] Sending offer for call: ${callId}`);
            const offerRef = ref(realtimeDb, `calls/${callId}/offer`);
            await set(offerRef, {
                type: offer.type,
                sdp: offer.sdp
            });
            console.log('✅ [Signaling] Offer sent');
        } catch (error) {
            console.error('❌ [Signaling] Error sending offer:', error);
            throw error;
        }
    }

    /**
     * Send SDP answer
     * @param {string} callId - Call identifier
     * @param {RTCSessionDescriptionInit} answer - SDP answer
     */
    async sendAnswer(callId, answer) {
        try {
            console.log(`📤 [Signaling] Sending answer for call: ${callId}`);
            const answerRef = ref(realtimeDb, `calls/${callId}/answer`);
            await set(answerRef, {
                type: answer.type,
                sdp: answer.sdp
            });

            // Update call status to accepted
            await this.updateCallStatus(callId, 'accepted');
            console.log('✅ [Signaling] Answer sent and call status updated to accepted');
        } catch (error) {
            console.error('❌ [Signaling] Error sending answer:', error);
            throw error;
        }
    }

    /**
     * Send ICE candidate
     * @param {string} callId - Call identifier
     * @param {RTCIceCandidateInit} candidate - ICE candidate
     * @param {boolean} isOfferer - Whether sender is the offerer
     */
    async sendIceCandidate(callId, candidate, isOfferer) {
        try {
            const candidatesPath = isOfferer ? 'callerCandidates' : 'calleeCandidates';
            const candidatesRef = ref(realtimeDb, `calls/${callId}/${candidatesPath}`);
            
            await push(candidatesRef, {
                candidate: candidate.candidate,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex,
                timestamp: Date.now()
            });

            console.log(`🧊 [Signaling] ICE candidate sent (${candidatesPath})`);
        } catch (error) {
            console.error('❌ [Signaling] Error sending ICE candidate:', error);
        }
    }

    /**
     * Listen for incoming calls for a specific user
     * @param {string} userId - User ID to listen for calls
     * @param {function} callback - Callback function when call is received
     * @returns {function} Unsubscribe function
     */
    listenForIncomingCalls(userId, callback) {
        console.log(`👂 [Signaling] Listening for incoming calls for user: ${userId}`);

        const callsRef = ref(realtimeDb, 'calls');
        
        const handleValue = (snapshot) => {
            if (!snapshot.exists()) return;

            const calls = snapshot.val();
            
            // Find calls where this user is the callee and status is ringing
            Object.entries(calls).forEach(([callId, callData]) => {
                if (callData.callee === userId && callData.status === 'ringing') {
                    console.log(`📞 [Signaling] Incoming call detected: ${callId}`);
                    callback({
                        callId,
                        ...callData
                    });
                }
            });
        };

        onValue(callsRef, handleValue);

        // Store listener for cleanup
        this.activeListeners.set(`incoming_${userId}`, { ref: callsRef, handler: handleValue });

        // Return unsubscribe function
        return () => {
            off(callsRef, 'value', handleValue);
            this.activeListeners.delete(`incoming_${userId}`);
            console.log(`🔇 [Signaling] Stopped listening for incoming calls`);
        };
    }

    /**
     * Listen for call answer (for caller)
     * @param {string} callId - Call identifier
     * @param {function} callback - Callback function when answer is received
     * @returns {function} Unsubscribe function
     */
    listenForAnswer(callId, callback) {
        console.log(`👂 [Signaling] Listening for answer on call: ${callId}`);

        const answerRef = ref(realtimeDb, `calls/${callId}/answer`);
        
        const handleValue = (snapshot) => {
            if (snapshot.exists()) {
                const answer = snapshot.val();
                console.log(`📥 [Signaling] Answer received`);
                callback(answer);
                // Unsubscribe after receiving answer
                off(answerRef, 'value', handleValue);
            }
        };

        onValue(answerRef, handleValue);

        return () => {
            off(answerRef, 'value', handleValue);
            console.log(`🔇 [Signaling] Stopped listening for answer`);
        };
    }

    /**
     * Listen for call offer (for callee)
     * @param {string} callId - Call identifier
     * @param {function} callback - Callback function when offer is received
     * @returns {function} Unsubscribe function
     */
    listenForOffer(callId, callback) {
        console.log(`👂 [Signaling] Listening for offer on call: ${callId}`);

        const offerRef = ref(realtimeDb, `calls/${callId}/offer`);
        
        const handleValue = (snapshot) => {
            if (snapshot.exists()) {
                const offer = snapshot.val();
                console.log(`📥 [Signaling] Offer received`);
                callback(offer);
                // Unsubscribe after receiving offer
                off(offerRef, 'value', handleValue);
            }
        };

        onValue(offerRef, handleValue);

        return () => {
            off(offerRef, 'value', handleValue);
            console.log(`🔇 [Signaling] Stopped listening for offer`);
        };
    }

    /**
     * Listen for ICE candidates
     * @param {string} callId - Call identifier
     * @param {boolean} isOfferer - Whether listener is the offerer
     * @param {function} callback - Callback function when candidate is received
     * @returns {function} Unsubscribe function
     */
    listenForIceCandidates(callId, isOfferer, callback) {
        // Listen to the opposite side's candidates
        const candidatesPath = isOfferer ? 'calleeCandidates' : 'callerCandidates';
        console.log(`👂 [Signaling] Listening for ICE candidates at: ${candidatesPath}`);

        const candidatesRef = ref(realtimeDb, `calls/${callId}/${candidatesPath}`);
        
        const handleValue = (snapshot) => {
            if (snapshot.exists()) {
                const candidates = snapshot.val();
                Object.values(candidates).forEach(candidate => {
                    console.log(`🧊 [Signaling] ICE candidate received`);
                    callback({
                        candidate: candidate.candidate,
                        sdpMid: candidate.sdpMid,
                        sdpMLineIndex: candidate.sdpMLineIndex
                    });
                });
            }
        };

        onValue(candidatesRef, handleValue);

        return () => {
            off(candidatesRef, 'value', handleValue);
            console.log(`🔇 [Signaling] Stopped listening for ICE candidates`);
        };
    }

    /**
     * Listen for call status changes
     * @param {string} callId - Call identifier
     * @param {function} callback - Callback function when status changes
     * @returns {function} Unsubscribe function
     */
    listenForStatusChange(callId, callback) {
        console.log(`👂 [Signaling] Listening for status changes on call: ${callId}`);

        const statusRef = ref(realtimeDb, `calls/${callId}/status`);
        
        const handleValue = (snapshot) => {
            if (snapshot.exists()) {
                const status = snapshot.val();
                console.log(`🔄 [Signaling] Call status changed to: ${status}`);
                callback(status);
            }
        };

        onValue(statusRef, handleValue);

        return () => {
            off(statusRef, 'value', handleValue);
            console.log(`🔇 [Signaling] Stopped listening for status changes`);
        };
    }

    /**
     * Update call status
     * @param {string} callId - Call identifier
     * @param {string} status - New status
     */
    async updateCallStatus(callId, status) {
        try {
            console.log(`🔄 [Signaling] Updating call status to: ${status}`);
            const statusRef = ref(realtimeDb, `calls/${callId}/status`);
            await set(statusRef, status);
            
            // If call ended, add endedAt timestamp
            if (status === 'ended' || status === 'missed' || status === 'rejected') {
                const endedAtRef = ref(realtimeDb, `calls/${callId}/endedAt`);
                await set(endedAtRef, serverTimestamp());
            }
            
            console.log(`✅ [Signaling] Call status updated`);
        } catch (error) {
            console.error('❌ [Signaling] Error updating call status:', error);
        }
    }

    /**
     * End call and cleanup
     * @param {string} callId - Call identifier
     */
    async endCall(callId) {
        try {
            console.log(`📵 [Signaling] Ending call: ${callId}`);
            
            await this.updateCallStatus(callId, 'ended');
            
            // Optional: Remove call data after some time (or keep for history)
            // For now, we'll keep it for call history purposes
            
            console.log(`✅ [Signaling] Call ended`);
        } catch (error) {
            console.error('❌ [Signaling] Error ending call:', error);
        }
    }

    /**
     * Reject incoming call
     * @param {string} callId - Call identifier
     */
    async rejectCall(callId) {
        try {
            console.log(`❌ [Signaling] Rejecting call: ${callId}`);
            await this.updateCallStatus(callId, 'rejected');
            console.log(`✅ [Signaling] Call rejected`);
        } catch (error) {
            console.error('❌ [Signaling] Error rejecting call:', error);
        }
    }

    /**
     * Mark call as missed
     * @param {string} callId - Call identifier
     */
    async markAsMissed(callId) {
        try {
            console.log(`📞 [Signaling] Marking call as missed: ${callId}`);
            await this.updateCallStatus(callId, 'missed');
            console.log(`✅ [Signaling] Call marked as missed`);
        } catch (error) {
            console.error('❌ [Signaling] Error marking call as missed:', error);
        }
    }

    /**
     * Get call data
     * @param {string} callId - Call identifier
     * @returns {Promise<Object|null>}
     */
    async getCallData(callId) {
        try {
            const callRef = ref(realtimeDb, `calls/${callId}`);
            return new Promise((resolve) => {
                onValue(callRef, (snapshot) => {
                    if (snapshot.exists()) {
                        resolve(snapshot.val());
                    } else {
                        resolve(null);
                    }
                }, { onlyOnce: true });
            });
        } catch (error) {
            console.error('❌ [Signaling] Error getting call data:', error);
            return null;
        }
    }

    /**
     * Delete call data (cleanup)
     * @param {string} callId - Call identifier
     */
    async deleteCall(callId) {
        try {
            console.log(`🗑️ [Signaling] Deleting call data: ${callId}`);
            const callRef = ref(realtimeDb, `calls/${callId}`);
            await remove(callRef);
            console.log(`✅ [Signaling] Call data deleted`);
        } catch (error) {
            console.error('❌ [Signaling] Error deleting call:', error);
        }
    }

    /**
     * Cleanup all active listeners
     */
    cleanupListeners() {
        console.log(`🧹 [Signaling] Cleaning up all listeners`);
        this.activeListeners.forEach((listener, key) => {
            off(listener.ref, 'value', listener.handler);
        });
        this.activeListeners.clear();
    }

    /**
     * Create a group call
     * @param {string} callerId - User initiating the call
     * @param {Array<string>} participantIds - Array of participant IDs (including caller)
     * @param {string} type - Call type ('audio' or 'video')
     * @returns {Promise<{success: boolean, callId?: string, error?: string}>}
     */
    async createGroupCall(callerId, participantIds, type) {
        try {
            console.log(`📞 [Signaling] Creating group ${type} call with ${participantIds.length} participants`);

            const callId = `group_call_${Date.now()}_${callerId}`;
            const callRef = ref(realtimeDb, `calls/${callId}`);

            const callData = {
                callId,
                caller: callerId,
                participants: participantIds.reduce((acc, id) => {
                    acc[id] = {
                        joined: id === callerId,
                        joinedAt: id === callerId ? serverTimestamp() : null,
                        status: id === callerId ? 'connected' : 'pending'
                    };
                    return acc;
                }, {}),
                type,
                isGroupCall: true,
                status: 'active',
                createdAt: serverTimestamp()
            };

            await set(callRef, callData);
            console.log(`✅ [Signaling] Group call created: ${callId}`);

            return { success: true, callId };
        } catch (error) {
            console.error('❌ [Signaling] Error creating group call:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Join a group call
     * @param {string} callId - Call identifier
     * @param {string} userId - User joining the call
     */
    async joinGroupCall(callId, userId) {
        try {
            console.log(`📞 [Signaling] User ${userId} joining group call ${callId}`);
            
            const participantRef = ref(realtimeDb, `calls/${callId}/participants/${userId}`);
            await update(participantRef, {
                joined: true,
                joinedAt: serverTimestamp(),
                status: 'connected'
            });

            console.log('✅ [Signaling] Joined group call');
        } catch (error) {
            console.error('❌ [Signaling] Error joining group call:', error);
        }
    }

    /**
     * Leave a group call
     * @param {string} callId - Call identifier
     * @param {string} userId - User leaving the call
     */
    async leaveGroupCall(callId, userId) {
        try {
            console.log(`📞 [Signaling] User ${userId} leaving group call ${callId}`);
            
            const participantRef = ref(realtimeDb, `calls/${callId}/participants/${userId}`);
            await update(participantRef, {
                joined: false,
                leftAt: serverTimestamp(),
                status: 'disconnected'
            });

            console.log('✅ [Signaling] Left group call');
        } catch (error) {
            console.error('❌ [Signaling] Error leaving group call:', error);
        }
    }

    /**
     * Get current participants in a group call
     * @param {string} callId - Call identifier
     * @returns {Promise<Array<string>>} - Array  of active participant IDs
     */
    async getActiveParticipants(callId) {
        try {
            const participantsRef = ref(realtimeDb, `calls/${callId}/participants`);
            return new Promise((resolve) => {
                onValue(participantsRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const participants = snapshot.val();
                        const active = Object.entries(participants)
                            .filter(([id, data]) => data.joined && data.status === 'connected')
                            .map(([id]) => id);
                        resolve(active);
                    } else {
                        resolve([]);
                    }
                }, { onlyOnce: true });
            });
        } catch (error) {
            console.error('❌ [Signaling] Error getting participants:', error);
            return [];
        }
    }

    /**
     * Listen for participant changes in a group call
     * @param {string} callId - Call identifier
     * @param {function} callback - Callback when participants change
     * @returns {function} Unsubscribe function
     */
    listenForParticipantChanges(callId, callback) {
        console.log(`👂 [Signaling] Listening for participant changes on call: ${callId}`);

        const participantsRef = ref(realtimeDb, `calls/${callId}/participants`);
        
        const handleValue = (snapshot) => {
            if (snapshot.exists()) {
                const participants = snapshot.val();
                const active = Object.entries(participants)
                    .filter(([id, data]) => data.joined && data.status === 'connected')
                    .map(([id]) => id);
                
                console.log(`👥 [Signaling] Active participants: ${active.length}`);
                callback(active, participants);
            }
        };

        onValue(participantsRef, handleValue);

        return () => {
            off(participantsRef, 'value', handleValue);
            console.log(`🔇 [Signaling] Stopped listening for participant changes`);
        };
    }

    /**
     * Send offer to specific participant in group call
     * @param {string} callId - Call identifier
     * @param {string} participantId - Target participant
     * @param {RTCSessionDescriptionInit} offer - SDP offer
     */
    async sendGroupCallOffer(callId, participantId, offer) {
        try {
            console.log(`📤 [Signaling] Sending offer to ${participantId} in group call ${callId}`);
            const offerRef = ref(realtimeDb, `calls/${callId}/offers/${participantId}`);
            await set(offerRef, {
                type: offer.type,
                sdp: offer.sdp,
                timestamp: serverTimestamp()
            });
            console.log('✅ [Signaling] Group call offer sent');
        } catch (error) {
            console.error('❌ [Signaling] Error sending group call offer:', error);
        }
    }

    /**
     * Send answer to specific participant in group call
     * @param {string} callId - Call identifier
     * @param {string} participantId - Target participant
     * @param {RTCSessionDescriptionInit} answer - SDP answer
     */
    async sendGroupCallAnswer(callId, participantId, answer) {
        try {
            console.log(`📤 [Signaling] Sending answer to ${participantId} in group call ${callId}`);
            const answerRef = ref(realtimeDb, `calls/${callId}/answers/${participantId}`);
            await set(answerRef, {
                type: answer.type,
                sdp: answer.sdp,
                timestamp: serverTimestamp()
            });
            console.log('✅ [Signaling] Group call answer sent');
        } catch (error) {
            console.error('❌ [Signaling] Error sending group call answer:', error);
        }
    }

    /**
     * Listen for offers from other participants
     * @param {string} callId - Call identifier
     * @param {string} myUserId - Current user's ID
     * @param {function} callback - Callback when offer received
     * @returns {function} Unsubscribe function
     */
    listenForGroupCallOffers(callId, myUserId, callback) {
        console.log(`👂 [Signaling] Listening for group call offers on call: ${callId}`);

        const offersRef = ref(realtimeDb, `calls/${callId}/offers/${myUserId}`);
        
        const handleValue = (snapshot) => {
            if (snapshot.exists()) {
                const offer = snapshot.val();
                console.log(`📥 [Signaling] Group call offer received`);
                callback(offer);
            }
        };

        onValue(offersRef, handleValue);

        return () => {
            off(offersRef, 'value', handleValue);
            console.log(`🔇 [Signaling] Stopped listening for group call offers`);
        };
    }

    /**
     * Listen for answers from other participants
     * @param {string} callId - Call identifier
     * @param {string} myUserId - Current user's ID
     * @param {function} callback - Callback when answer received
     * @returns {function} Unsubscribe function
     */
    listenForGroupCallAnswers(callId, myUserId, callback) {
        console.log(`👂 [Signaling] Listening for group call answers on call: ${callId}`);

        const answersRef = ref(realtimeDb, `calls/${callId}/answers/${myUserId}`);
        
        const handleValue = (snapshot) => {
            if (snapshot.exists()) {
                const answer = snapshot.val();
                console.log(`📥 [Signaling] Group call answer received`);
                callback(answer);
            }
        };

        onValue(answersRef, handleValue);

        return () => {
            off(answersRef, 'value', handleValue);
            console.log(`🔇 [Signaling] Stopped listening for group call answers`);
        };
    }
}

// Export singleton instance
export const signalingService = new SignalingService();
export default signalingService;
