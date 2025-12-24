/**
 * Call Reactions Service
 * Manages real-time reactions during calls using WebRTC Data Channels
 * Follows Single Responsibility Principle - handles reaction transmission and display
 */

class CallReactionsService {
    constructor() {
        // Map callId -> Map of participantId -> RTCDataChannel
        this.dataChannels = new Map();
        
        // Map callId -> Array of recent reactions
        this.recentReactions = new Map();
        
        // Reaction throttling
        this.lastReactionTime = new Map();
        this.THROTTLE_MS = 2000; // Max 1 reaction per 2 seconds
        
        // Available reactions
        this.REACTIONS = ['❤️', '😂', '😮', '👍', '👏', '🎉'];
    }

    /**
     * Create data channel for a peer connection
     * @param {string} callId - Call identifier
     * @param {string} participantId - Participant identifier
     * @param {RTCPeerConnection} peerConnection - WebRTC peer connection
     * @param {function} onReactionReceived - Callback when reaction is received
     */
    createDataChannel(callId, participantId, peerConnection, onReactionReceived) {
        try {
            console.log(`📡 [CallReactions] Creating data channel for ${participantId}`);

            // Create data channel
            const dataChannel = peerConnection.createDataChannel('reactions', {
                ordered: true
            });

            // Handle channel open
            dataChannel.onopen = () => {
                console.log(`✅ [CallReactions] Data channel open with ${participantId}`);
            };

            // Handle incoming messages
            dataChannel.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    
                    if (message.type === 'reaction') {
                        console.log(`👋 [CallReactions] Received reaction from ${participantId}: ${message.emoji}`);
                        
                        // Add to recent reactions
                        this.addRecentReaction(callId, {
                            participantId,
                            emoji: message.emoji,
                            timestamp: Date.now()
                        });
                        
                        // Trigger callback
                        onReactionReceived?.(participantId, message.emoji);
                    }
                } catch (error) {
                    console.error('❌ [CallReactions] Error parsing message:', error);
                }
            };

            // Handle errors
            dataChannel.onerror = (error) => {
                console.error(`❌ [CallReactions] Data channel error with ${participantId}:`, error);
            };

            // Handle close
            dataChannel.onclose = () => {
                console.log(`🔌 [CallReactions] Data channel closed with ${participantId}`);
            };

            // Store data channel
            if (!this.dataChannels.has(callId)) {
                this.dataChannels.set(callId, new Map());
            }
            this.dataChannels.get(callId).set(participantId, dataChannel);

            // Listen for incoming data channels (for the answering peer)
            peerConnection.ondatachannel = (event) => {
                const receivedChannel = event.channel;
                console.log(`📡 [CallReactions] Received data channel from ${participantId}`);
                
                receivedChannel.onmessage = dataChannel.onmessage;
                receivedChannel.onerror = dataChannel.onerror;
                receivedChannel.onclose = dataChannel.onclose;
                
                this.dataChannels.get(callId).set(participantId, receivedChannel);
            };

        } catch (error) {
            console.error('❌ [CallReactions] Error creating data channel:', error);
        }
    }

    /**
     * Send reaction to all participants
     * @param {string} callId - Call identifier
     * @param {string} emoji - Emoji to send
     * @returns {boolean} - Success status
     */
    sendReaction(callId, emoji) {
        try {
            // Check if emoji is valid
            if (!this.REACTIONS.includes(emoji)) {
                console.warn(`⚠️ [CallReactions] Invalid reaction emoji: ${emoji}`);
                return false;
            }

            // Check throttling
            const lastTime = this.lastReactionTime.get(callId) || 0;
            const now = Date.now();
            
            if (now - lastTime < this.THROTTLE_MS) {
                console.warn(`⚠️ [CallReactions] Reaction throttled. Wait ${Math.ceil((this.THROTTLE_MS - (now - lastTime)) / 1000)}s`);
                return false;
            }

            console.log(`🎭 [CallReactions] Sending reaction: ${emoji}`);

            const channels = this.dataChannels.get(callId);
            if (!channels || channels.size === 0) {
                console.warn('⚠️ [CallReactions] No data channels available');
                return false;
            }

            // Create message
            const message = JSON.stringify({
                type: 'reaction',
                emoji,
                timestamp: now
            });

            // Send to all participants
            let sentCount = 0;
            channels.forEach((dataChannel, participantId) => {
                if (dataChannel.readyState === 'open') {
                    try {
                        dataChannel.send(message);
                        sentCount++;
                    } catch (error) {
                        console.error(`❌ [CallReactions] Error sending to ${participantId}:`, error);
                    }
                }
            });

            if (sentCount > 0) {
                // Update throttle time
                this.lastReactionTime.set(callId, now);
                
                // Add to own recent reactions
                this.addRecentReaction(callId, {
                    participantId: 'self',
                    emoji,
                    timestamp: now
                });
                
                console.log(`✅ [CallReactions] Reaction sent to ${sentCount} participants`);
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ [CallReactions] Error sending reaction:', error);
            return false;
        }
    }

    /**
     * Add reaction to recent list
     * @private
     * @param {string} callId - Call identifier
     * @param {Object} reaction - Reaction object
     */
    addRecentReaction(callId, reaction) {
        if (!this.recentReactions.has(callId)) {
            this.recentReactions.set(callId, []);
        }

        const reactions = this.recentReactions.get(callId);
        reactions.push(reaction);

        // Keep only last 50 reactions
        if (reactions.length > 50) {
            reactions.shift();
        }

        // Clean up old reactions (older than 10 seconds)
        const cutoffTime = Date.now() - 10000;
        const filtered = reactions.filter(r => r.timestamp > cutoffTime);
        this.recentReactions.set(callId, filtered);
    }

    /**
     * Get recent reactions for a call
     * @param {string} callId - Call identifier
     * @param {number} limit - Maximum number of reactions to return
     * @returns {Array} - Array of recent reactions
     */
    getRecentReactions(callId, limit = 10) {
        const reactions = this.recentReactions.get(callId) || [];
        return reactions.slice(-limit);
    }

    /**
     * Get available reactions
     * @returns {Array<string>}
     */
    getAvailableReactions() {
        return [...this.REACTIONS];
    }

    /**
     * Check if can send reaction (throttling check)
     * @param {string} callId - Call identifier
     * @returns {Object} - { canSend: boolean, waitTime: number }
     */
    canSendReaction(callId) {
        const lastTime = this.lastReactionTime.get(callId) || 0;
        const now = Date.now();
        const elapsed = now - lastTime;
        
        if (elapsed >= this.THROTTLE_MS) {
            return { canSend: true, waitTime: 0 };
        }
        
        return {
            canSend: false,
            waitTime: Math.ceil((this.THROTTLE_MS - elapsed) / 1000)
        };
    }

    /**
     * Close data channel for a participant
     * @param {string} callId - Call identifier
     * @param {string} participantId - Participant identifier
     */
    closeDataChannel(callId, participantId) {
        const channels = this.dataChannels.get(callId);
        if (!channels) return;

        const dataChannel = channels.get(participantId);
        if (dataChannel) {
            try {
                dataChannel.close();
            } catch (error) {
                console.error('❌ [CallReactions] Error closing data channel:', error);
            }
            channels.delete(participantId);
        }
    }

    /**
     * Cleanup reactions for a call
     * @param {string} callId - Call identifier
     */
    cleanupCall(callId) {
        console.log(`🧹 [CallReactions] Cleaning up call: ${callId}`);

        // Close all data channels
        const channels = this.dataChannels.get(callId);
        if (channels) {
            channels.forEach((dataChannel, participantId) => {
                try {
                    dataChannel.close();
                } catch (error) {
                    // Ignore errors during cleanup
                }
            });
            channels.clear();
        }

        // Clear data
        this.dataChannels.delete(callId);
        this.recentReactions.delete(callId);
        this.lastReactionTime.delete(callId);

        console.log('✅ [CallReactions] Call cleaned up');
    }

    /**
     * Cleanup all calls
     */
    cleanup() {
        console.log('🧹 [CallReactions] Cleaning up all calls');

        this.dataChannels.forEach((channels, callId) => {
            this.cleanupCall(callId);
        });

        this.dataChannels.clear();
        this.recentReactions.clear();
        this.lastReactionTime.clear();
    }
}

// Export singleton instance
export const callReactionsService = new CallReactionsService();
export default callReactionsService;
