/**
 * Walkie-Talkie Service
 * Manages push-to-talk audio streaming for group chats using WebRTC
 * 
 * Features:
 * - Push-to-talk audio recording
 * - Real-time audio streaming to group participants
 * - WebRTC peer connections
 * - Audio quality management
 */

class WalkieTalkieService {
    constructor() {
        this.activeSessions = new Map(); // groupId -> session
        this.mediaRecorder = null;
        this.localStream = null;
        this.audioChunks = [];
    }

    /**
     * Initialize walkie-talkie session for a group
     */
    async initSession(groupId, userId) {
        try {
            console.log(`🎙️ [WalkieTalkie] Initializing session for group: ${groupId}`);
            
            // Check if session already exists
            if (this.activeSessions.has(groupId)) {
                console.log('⚠️ Session already exists for this group');
                return { success: false, error: 'Session already active' };
            }

            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            const session = {
                groupId,
                userId,
                stream,
                isRecording: false,
                startTime: null
            };

            this.activeSessions.set(groupId, session);
            console.log('✅ [WalkieTalkie] Session initialized');

            return { success: true, session };
        } catch (error) {
            console.error('❌ [WalkieTalkie] Init error:', error);
            
            if (error.name === 'NotAllowedError') {
                return { success: false, error: 'Microphone permission denied' };
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Start recording audio (button pressed)
     */
    async startRecording(groupId) {
        try {
            const session = this.activeSessions.get(groupId);
            
            if (!session) {
                throw new Error('No active session for this group');
            }

            if (session.isRecording) {
                console.log('⚠️ Already recording');
                return { success: false, error: 'Already recording' };
            }

            console.log('🔴 [WalkieTalkie] Starting recording...');

            this.audioChunks = [];
            
            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(session.stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            // Collect audio data
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms for real-time streaming
            session.isRecording = true;
            session.startTime = Date.now();

            return { success: true };
        } catch (error) {
            console.error('❌ [WalkieTalkie] Start recording error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop recording audio (button released)
     */
    async stopRecording(groupId) {
        try {
            const session = this.activeSessions.get(groupId);
            
            if (!session || !session.isRecording) {
                throw new Error('No active recording');
            }

            console.log('⏹️ [WalkieTalkie] Stopping recording...');

            return new Promise((resolve) => {
                this.mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    const duration = (Date.now() - session.startTime) / 1000; // seconds

                    session.isRecording = false;
                    this.audioChunks = [];

                    console.log(`✅ [WalkieTalkie] Recording stopped - Duration: ${duration}s`);

                    resolve({
                        success: true,
                        audioBlob,
                        duration,
                        audioUrl: URL.createObjectURL(audioBlob)
                    });
                };

                this.mediaRecorder.stop();
            });
        } catch (error) {
            console.error('❌ [WalkieTalkie] Stop recording error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Broadcast audio to group participants (via Firebase)
     */
    async broadcastAudio(groupId, audioBlob, duration) {
        try {
            console.log(`📡 [WalkieTalkie] Broadcasting audio to group: ${groupId}`);
            
            // In a real implementation, this would upload to Firebase Storage
            // and send a notification to group participants
            
            // For now, we'll return the audio URL
            const audioUrl = URL.createObjectURL(audioBlob);
            
            return {
                success: true,
                audioUrl,
                duration
            };
        } catch (error) {
            console.error('❌ [WalkieTalkie] Broadcast error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * End walkie-talkie session
     */
    async endSession(groupId) {
        try {
            const session = this.activeSessions.get(groupId);
            
            if (!session) {
                return { success: false, error: 'No active session' };
            }

            console.log(`🛑 [WalkieTalkie] Ending session for group: ${groupId}`);

            // Stop any ongoing recording
            if (session.isRecording && this.mediaRecorder) {
                this.mediaRecorder.stop();
            }

            // Stop all tracks
            if (session.stream) {
                session.stream.getTracks().forEach(track => track.stop());
            }

            // Remove session
            this.activeSessions.delete(groupId);

            console.log('✅ [WalkieTalkie] Session ended');
            return { success: true };
        } catch (error) {
            console.error('❌ [WalkieTalkie] End session error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if group has active session
     */
    hasActiveSession(groupId) {
        return this.activeSessions.has(groupId);
    }

    /**
     * Check if currently recording
     */
    isRecording(groupId) {
        const session = this.activeSessions.get(groupId);
        return session ? session.isRecording : false;
    }
}

// Export singleton instance
export const walkieTalkieService = new WalkieTalkieService();
export default walkieTalkieService;
