/**
 * WebRTC Service
 * Manages WebRTC peer connections for real-time audio/video communication
 * Follows SOLID principles - Single Responsibility for peer connection management
 */

class WebRTCService {
    constructor() {
        // Map to store active peer connections by callId
        this.peerConnections = new Map();
        
        // Map to store local streams by callId
        this.localStreams = new Map();
        
        // ICE server configuration (using Google's public STUN servers)
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
            ]
        };
    }

    /**
     * Create a new peer connection
     * @param {string} callId - Unique identifier for the call
     * @param {boolean} isOfferer - Whether this peer is creating the offer
     * @param {function} onIceCandidate - Callback for ICE candidate events
     * @param {function} onTrack - Callback for remote track events
     * @param {function} onConnectionStateChange - Callback for connection state changes
     * @returns {RTCPeerConnection}
     */
    createPeerConnection(callId, isOfferer, onIceCandidate, onTrack, onConnectionStateChange) {
        try {
            console.log(`🔗 [WebRTC] Creating peer connection for call: ${callId} (offerer: ${isOfferer})`);

            // Create new RTCPeerConnection
            const peerConnection = new RTCPeerConnection(this.iceServers);

            // Handle ICE candidate events
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log(`🧊 [WebRTC] ICE candidate generated for ${callId}`);
                    onIceCandidate?.(event.candidate);
                }
            };

            // Handle remote track events (receiving audio/video)
            peerConnection.ontrack = (event) => {
                console.log(`📹 [WebRTC] Remote track received for ${callId}`, event.streams);
                onTrack?.(event.streams[0]);
            };

            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                const state = peerConnection.connectionState;
                console.log(`🔄 [WebRTC] Connection state changed to: ${state}`);
                onConnectionStateChange?.(state);

                // Cleanup on disconnect/failed
                if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                    this.closePeerConnection(callId);
                }
            };

            // Handle ICE connection state changes
            peerConnection.oniceconnectionstatechange = () => {
                console.log(`❄️ [WebRTC] ICE connection state: ${peerConnection.iceConnectionState}`);
            };

            // Store peer connection
            this.peerConnections.set(callId, peerConnection);

            return peerConnection;
        } catch (error) {
            console.error('❌ [WebRTC] Error creating peer connection:', error);
            throw error;
        }
    }

    /**
     * Get user media stream (camera + microphone)
     * @param {boolean} audioEnabled - Enable audio track
     * @param {boolean} videoEnabled - Enable video track
     * @returns {Promise<MediaStream>}
     */
    async getLocalStream(audioEnabled = true, videoEnabled = false) {
        try {
            console.log(`🎥 [WebRTC] Requesting media - Audio: ${audioEnabled}, Video: ${videoEnabled}`);

            const constraints = {
                audio: audioEnabled ? {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : false,
                video: videoEnabled ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user' // Front camera by default
                } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ [WebRTC] Local stream acquired');

            return stream;
        } catch (error) {
            console.error('❌ [WebRTC] Error getting user media:', error);
            throw error;
        }
    }

    /**
     * Add local stream to peer connection
     * @param {string} callId - Call identifier
     * @param {MediaStream} stream - Local media stream
     */
    addLocalStream(callId, stream) {
        const peerConnection = this.peerConnections.get(callId);
        if (!peerConnection) {
            console.error(`❌ [WebRTC] No peer connection found for call: ${callId}`);
            return;
        }

        // Add all tracks from stream to peer connection
        stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
            console.log(`➕ [WebRTC] Added ${track.kind} track to peer connection`);
        });

        // Store local stream
        this.localStreams.set(callId, stream);
    }

    /**
     * Create SDP offer
     * @param {string} callId - Call identifier
     * @returns {Promise<RTCSessionDescriptionInit>}
     */
    async createOffer(callId) {
        try {
            const peerConnection = this.peerConnections.get(callId);
            if (!peerConnection) {
                throw new Error('No peer connection found');
            }

            console.log(`📤 [WebRTC] Creating offer for call: ${callId}`);

            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            await peerConnection.setLocalDescription(offer);
            console.log('✅ [WebRTC] Offer created and set as local description');

            return offer;
        } catch (error) {
            console.error('❌ [WebRTC] Error creating offer:', error);
            throw error;
        }
    }

    /**
     * Create SDP answer
     * @param {string} callId - Call identifier
     * @param {RTCSessionDescriptionInit} offer - Remote offer
     * @returns {Promise<RTCSessionDescriptionInit>}
     */
    async createAnswer(callId, offer) {
        try {
            const peerConnection = this.peerConnections.get(callId);
            if (!peerConnection) {
                throw new Error('No peer connection found');
            }

            console.log(`📥 [WebRTC] Creating answer for call: ${callId}`);

            // Set remote description (the offer)
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('✅ [WebRTC] Remote offer set');

            // Create answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            console.log('✅ [WebRTC] Answer created and set as local description');

            return answer;
        } catch (error) {
            console.error('❌ [WebRTC] Error creating answer:', error);
            throw error;
        }
    }

    /**
     * Set remote answer
     * @param {string} callId - Call identifier
     * @param {RTCSessionDescriptionInit} answer - Remote answer
     */
    async setRemoteAnswer(callId, answer) {
        try {
            const peerConnection = this.peerConnections.get(callId);
            if (!peerConnection) {
                throw new Error('No peer connection found');
            }

            console.log(`📥 [WebRTC] Setting remote answer for call: ${callId}`);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('✅ [WebRTC] Remote answer set');
        } catch (error) {
            console.error('❌ [WebRTC] Error setting remote answer:', error);
            throw error;
        }
    }

    /**
     * Add ICE candidate
     * @param {string} callId - Call identifier
     * @param {RTCIceCandidateInit} candidate - ICE candidate
     */
    async addIceCandidate(callId, candidate) {
        try {
            const peerConnection = this.peerConnections.get(callId);
            if (!peerConnection) {
                console.warn(`⚠️ [WebRTC] No peer connection found for ICE candidate`);
                return;
            }

            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log(`✅ [WebRTC] ICE candidate added`);
        } catch (error) {
            console.error('❌ [WebRTC] Error adding ICE candidate:', error);
        }
    }

    /**
     * Toggle audio track (mute/unmute)
     * @param {string} callId - Call identifier
     * @param {boolean} enabled - Enable or disable audio
     */
    toggleAudio(callId, enabled) {
        const stream = this.localStreams.get(callId);
        if (!stream) return;

        stream.getAudioTracks().forEach(track => {
            track.enabled = enabled;
        });
        console.log(`🔊 [WebRTC] Audio ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Toggle video track
     * @param {string} callId - Call identifier
     * @param {boolean} enabled - Enable or disable video
     */
    toggleVideo(callId, enabled) {
        const stream = this.localStreams.get(callId);
        if (!stream) return;

        stream.getVideoTracks().forEach(track => {
            track.enabled = enabled;
        });
        console.log(`📹 [WebRTC] Video ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Switch camera (front/back) - mainly for mobile
     * @param {string} callId - Call identifier
     */
    async switchCamera(callId) {
        try {
            const stream = this.localStreams.get(callId);
            if (!stream) return;

            const videoTrack = stream.getVideoTracks()[0];
            if (!videoTrack) return;

            const currentFacingMode = videoTrack.getSettings().facingMode;
            const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

            // Stop current video track
            videoTrack.stop();

            // Get new stream with different camera
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: newFacingMode }
            });

            const newVideoTrack = newStream.getVideoTracks()[0];

            // Replace track in peer connection
            const peerConnection = this.peerConnections.get(callId);
            const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
                await sender.replaceTrack(newVideoTrack);
            }

            // Update local stream
            stream.removeTrack(videoTrack);
            stream.addTrack(newVideoTrack);

            console.log(`🔄 [WebRTC] Camera switched to: ${newFacingMode}`);
        } catch (error) {
            console.error('❌ [WebRTC] Error switching camera:', error);
        }
    }

    /**
     * Get connection statistics
     * @param {string} callId - Call identifier
     * @returns {Promise<Object>}
     */
    async getConnectionStats(callId) {
        try {
            const peerConnection = this.peerConnections.get(callId);
            if (!peerConnection) return null;

            const stats = await peerConnection.getStats();
            const statsData = {
                audio: { bitrate: 0, packetsLost: 0 },
                video: { bitrate: 0, packetsLost: 0 }
            };

            stats.forEach(report => {
                if (report.type === 'inbound-rtp') {
                    if (report.kind === 'audio') {
                        statsData.audio.bitrate = report.bytesReceived;
                        statsData.audio.packetsLost = report.packetsLost;
                    } else if (report.kind === 'video') {
                        statsData.video.bitrate = report.bytesReceived;
                        statsData.video.packetsLost = report.packetsLost;
                    }
                }
            });

            return statsData;
        } catch (error) {
            console.error('❌ [WebRTC] Error getting stats:', error);
            return null;
        }
    }

    /**
     * Close peer connection and cleanup
     * @param {string} callId - Call identifier
     */
    closePeerConnection(callId) {
        console.log(`🔌 [WebRTC] Closing peer connection for call: ${callId}`);

        // Stop local stream tracks
        const localStream = this.localStreams.get(callId);
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            this.localStreams.delete(callId);
        }

        // Close peer connection
        const peerConnection = this.peerConnections.get(callId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(callId);
        }

        console.log('✅ [WebRTC] Connection closed and cleaned up');
    }

    /**
     * Check if peer connection exists
     * @param {string} callId - Call identifier
     * @returns {boolean}
     */
    hasConnection(callId) {
        return this.peerConnections.has(callId);
    }

    /**
     * Get peer connection for a call
     * @param {string} callId - Call identifier
     * @returns {RTCPeerConnection|null}
     */
    getPeerConnection(callId) {
        return this.peerConnections.get(callId) || null;
    }

    /**
     * Get local stream for a call
     * @param {string} callId - Call identifier
     * @returns {MediaStream|null}
     */
    getLocalStream(callId) {
        return this.localStreams.get(callId) || null;
    }

    /**
     * Create data channel for a peer connection
     * @param {string} callId - Call identifier
     * @param {string} channelName - Data channel name
     * @param {Object} options - Data channel options
     * @returns {RTCDataChannel|null}
     */
    createDataChannel(callId, channelName = 'data', options = {}) {
        try {
            const peerConnection = this.peerConnections.get(callId);
            if (!peerConnection) {
                console.error(`❌ [WebRTC] No peer connection found for call: ${callId}`);
                return null;
            }

            console.log(`📡 [WebRTC] Creating data channel '${channelName}' for call: ${callId}`);
            const dataChannel = peerConnection.createDataChannel(channelName, {
                ordered: true,
                ...options
            });

            console.log('✅ [WebRTC] Data channel created');
            return dataChannel;
        } catch (error) {
            console.error('❌ [WebRTC] Error creating data channel:', error);
            return null;
        }
    }

    /**
     * Replace video track in peer connection (for virtual background, screen share, etc.)
     * @param {string} callId - Call identifier
     * @param {MediaStreamTrack} newTrack - New video track
     * @returns {Promise<boolean>}
     */
    async replaceVideoTrack(callId, newTrack) {
        try {
            const peerConnection = this.peerConnections.get(callId);
            if (!peerConnection) {
                console.error(`❌ [WebRTC] No peer connection found for call: ${callId}`);
                return false;
            }

            const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
                await sender.replaceTrack(newTrack);
                console.log('✅ [WebRTC] Video track replaced');
                return true;
            }

            console.warn('⚠️ [WebRTC] No video sender found');
            return false;
        } catch (error) {
            console.error('❌ [WebRTC] Error replacing video track:', error);
            return false;
        }
    }

    /**
     * Replace audio track in peer connection (for noise cancellation, etc.)
     * @param {string} callId - Call identifier
     * @param {MediaStreamTrack} newTrack - New audio track
     * @returns {Promise<boolean>}
     */
    async replaceAudioTrack(callId, newTrack) {
        try {
            const peerConnection = this.peerConnections.get(callId);
            if (!peerConnection) {
                console.error(`❌ [WebRTC] No peer connection found for call: ${callId}`);
                return false;
            }

            const sender = peerConnection.getSenders().find(s => s.track?.kind === 'audio');
            if (sender) {
                await sender.replaceTrack(newTrack);
                console.log('✅ [WebRTC] Audio track replaced');
                return true;
            }

            console.warn('⚠️ [WebRTC] No audio sender found');
            return false;
        } catch (error) {
            console.error('❌ [WebRTC] Error replacing audio track:', error);
            return false;
        }
    }

    /**
     * Enter Picture-in-Picture mode
     * @param {HTMLVideoElement} videoElement - Video element to make PiP
     * @returns {Promise<void>}
     */
    async enterPictureInPicture(videoElement) {
        try {
            if (!document.pictureInPictureEnabled) {
                console.warn('⚠️ [WebRTC] Picture-in-Picture not supported');
                return;
            }

            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            }

            await videoElement.requestPictureInPicture();
            console.log('🖼️ [WebRTC] Entered Picture-in-Picture mode');
        } catch (error) {
            console.error('❌ [WebRTC] Error entering PiP:', error);
            throw error;
        }
    }

    /**
     * Exit Picture-in-Picture mode
     * @returns {Promise<void>}
     */
    async exitPictureInPicture() {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                console.log('🖼️ [WebRTC] Exited Picture-in-Picture mode');
            }
        } catch (error) {
            console.error('❌ [WebRTC] Error exiting PiP:', error);
        }
    }

    /**
     * Start screen sharing
     * @param {string} callId - Call identifier
     * @returns {Promise<MediaStream>}
     */
    async startScreenShare(callId) {
        try {
            console.log('🖥️ [WebRTC] Starting screen share');

            // Get screen sharing stream
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'monitor'
                },
                audio: false // Screen audio can be enabled if needed
            });

            const peerConnection = this.peerConnections.get(callId);
            if (!peerConnection) {
                throw new Error('No peer connection found');
            }

            // Get current video sender
            const videoSender = peerConnection.getSenders().find(sender => sender.track?.kind === 'video');
            
            if (videoSender) {
                const screenTrack = screenStream.getVideoTracks()[0];
                
                // Replace video track with screen share track
                await videoSender.replaceTrack(screenTrack);
                console.log('✅ [WebRTC] Screen share started');

                // Listen for screen share stop (user clicks browser's stop sharing button)
                screenTrack.onended = () => {
                    console.log('🖥️ [WebRTC] Screen share stopped by user');
                    this.stopScreenShare(callId);
                };

                return screenStream;
            } else {
                throw new Error('No video sender found');
            }
        } catch (error) {
            console.error('❌ [WebRTC] Error starting screen share:', error);
            throw error;
        }
    }

    /**
     * Stop screen sharing and restore camera
     * @param {string} callId - Call identifier
     * @returns {Promise<void>}
     */
    async stopScreenShare(callId) {
        try {
            console.log('🖥️ [WebRTC] Stopping screen share');

            const peerConnection = this.peerConnections.get(callId);
            if (!peerConnection) {
                throw new Error('No peer connection found');
            }

            // Get new camera stream
            const cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            const videoSender = peerConnection.getSenders().find(sender => sender.track?.kind === 'video');
            
            if (videoSender) {
                const cameraTrack = cameraStream.getVideoTracks()[0];
                await videoSender.replaceTrack(cameraTrack);
                
                // Update local stream
                const localStream = this.localStreams.get(callId);
                if (localStream) {
                    const oldVideoTrack = localStream.getVideoTracks()[0];
                    if (oldVideoTrack) {
                        localStream.removeTrack(oldVideoTrack);
                        oldVideoTrack.stop();
                    }
                    localStream.addTrack(cameraTrack);
                }

                console.log('✅ [WebRTC] Screen share stopped, camera restored');
            }
        } catch (error) {
            console.error('❌ [WebRTC] Error stopping screen share:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const webRTCService = new WebRTCService();
export default webRTCService;
