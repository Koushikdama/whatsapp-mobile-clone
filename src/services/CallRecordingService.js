/**
 * Call Recording Service
 * Records missed group calls using MediaRecorder API
 * Stores recordings in Firebase Storage
 */

import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebaseConfig';


class CallRecordingService {
    constructor() {
        this.activeRecordings = new Map(); // callId -> recording data
        this.mediaRecorder = null;
        this.recordedChunks = [];
    }

    /**
     * Start recording a call
     */
    async startRecording(callId, stream) {
        try {
            console.log(`🔴 [CallRecording] Starting recording for call: ${callId}`);

            // Check if already recording
            if (this.activeRecordings.has(callId)) {
                console.warn('⚠️ Already recording this call');
                return { success: false, error: 'Already recording' };
            }

            this.recordedChunks = [];

            // Create MediaRecorder
            const options = {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000
            };

            this.mediaRecorder = new MediaRecorder(stream, options);

            // Collect recorded data
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second

            const recording = {
                callId,
                startTime: Date.now(),
                isRecording: true
            };

            this.activeRecordings.set(callId, recording);

            console.log('✅ [CallRecording] Recording started');
            return { success: true };
        } catch (error) {
            console.error('❌ [CallRecording] Start error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop recording and upload to Firebase
     */
    async stopRecording(callId, callData) {
        try {
            console.log(`⏹️ [CallRecording] Stopping recording for call: ${callId}`);

            const recording = this.activeRecordings.get(callId);
            
            if (!recording || !recording.isRecording) {
                return { success: false, error: 'No active recording' };
            }

            return new Promise((resolve) => {
                this.mediaRecorder.onstop = async () => {
                    try {
                        // Create blob from recorded chunks
                        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                        const duration = (Date.now() - recording.startTime) / 1000; // seconds

                        console.log(`📦 [CallRecording] Recording complete - ${duration}s, ${blob.size} bytes`);

                        // Upload to Firebase Storage
                        const uploadResult = await this.uploadRecording(callId, blob, callData);

                        if (uploadResult.success) {
                            // Cleanup
                            this.recordedChunks = [];
                            this.activeRecordings.delete(callId);

                            resolve({
                                success: true,
                                url: uploadResult.url,
                                duration,
                                size: blob.size
                            });
                        } else {
                            resolve(uploadResult);
                        }
                    } catch (error) {
                        console.error('❌ [CallRecording] Stop processing error:', error);
                        resolve({ success: false, error: error.message });
                    }
                };

                this.mediaRecorder.stop();
            });
        } catch (error) {
            console.error('❌ [CallRecording] Stop error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Upload recording to Firebase Storage
     */
    async uploadRecording(callId, blob, callData) {
        try {
            console.log('☁️ [CallRecording] Uploading to Firebase Storage...');

            const fileName = `call-recordings/${callId}_${Date.now()}.webm`;
            const fileRef = storageRef(storage, fileName);

            // Upload file
            await uploadBytes(fileRef, blob, {
                contentType: 'audio/webm',
                customMetadata: {
                    callId,
                    groupId: callData.groupId || '',
                    participants: JSON.stringify(callData.participants || []),
                    timestamp: Date.now().toString()
                }
            });

            // Get download URL
            const url = await getDownloadURL(fileRef);

            console.log('✅ [CallRecording] Upload complete:', url);
            return { success: true, url };
        } catch (error) {
            console.error('❌ [CallRecording] Upload error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if call is being recorded
     */
    isRecording(callId) {
        const recording = this.activeRecordings.get(callId);
        return recording ? recording.isRecording : false;
    }

    /**
     * Cancel recording without saving
     */
    async cancelRecording(callId) {
        try {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }

            this.recordedChunks = [];
            this.activeRecordings.delete(callId);

            console.log('🗑️ [CallRecording] Recording cancelled');
            return { success: true };
        } catch (error) {
            console.error('❌ [CallRecording] Cancel error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
export const callRecordingService = new CallRecordingService();
export default callRecordingService;
