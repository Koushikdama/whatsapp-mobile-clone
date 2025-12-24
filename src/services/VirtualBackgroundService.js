/**
 * Virtual Background Service
 * Uses MediaPipe Selfie Segmentation for background replacement
 * Follows Single Responsibility Principle - handles video background processing
 */

import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

class VirtualBackgroundService {
    constructor() {
        this.segmentation = null;
        this.canvasElements = new Map(); // Map callId to canvas elements
        this.videoElements = new Map(); // Map callId to video elements
        this.isInitialized = false;
        this.activeProcessors = new Map(); // Map callId to processor info
    }

    /**
     * Initialize MediaPipe Selfie Segmentation
     * @returns {Promise<boolean>}
     */
    async initialize() {
        if (this.isInitialized) return true;

        try {
            console.log('🎭 [VirtualBackground] Initializing MediaPipe Selfie Segmentation');

            this.segmentation = new SelfieSegmentation({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
                }
            });

            this.segmentation.setOptions({
                modelSelection: 1, // 0 for general, 1 for landscape (better quality)
                selfieMode: true
            });

            await this.segmentation.initialize();
            this.isInitialized = true;

            console.log('✅ [VirtualBackground] MediaPipe initialized');
            return true;

        } catch (error) {
            console.error('❌ [VirtualBackground] Initialization error:', error);
            return false;
        }
    }

    /**
     * Apply virtual background to video stream
     * @param {string} callId - Unique call identifier
     * @param {MediaStream} stream - Original video stream
     * @param {Object} backgroundConfig - Background configuration
     * @returns {Promise<MediaStream>} - Processed video stream
     */
    async applyVirtualBackground(callId, stream, backgroundConfig = {}) {
        if (!this.isInitialized) {
            const initialized = await this.initialize();
            if (!initialized) {
                console.warn('⚠️ [VirtualBackground] Failed to initialize, returning original stream');
                return stream;
            }
        }

        try {
            console.log(`🎭 [VirtualBackground] Applying background for call: ${callId}`);

            const videoTrack = stream.getVideoTracks()[0];
            if (!videoTrack) {
                console.warn('⚠️ [VirtualBackground] No video track found');
                return stream;
            }

            // Create video element from stream
            const videoElement = document.createElement('video');
            videoElement.srcObject = new MediaStream([videoTrack]);
            videoElement.autoplay = true;
            videoElement.muted = true;
            await videoElement.play();

            // Create canvas for processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            canvas.width = videoTrack.getSettings().width || 1280;
            canvas.height = videoTrack.getSettings().height || 720;

            // Load background if it's an image
            let backgroundImage = null;
            if (backgroundConfig.type === 'image' && backgroundConfig.url) {
                backgroundImage = await this.loadImage(backgroundConfig.url);
            }

            // Store elements
            this.videoElements.set(callId, videoElement);
            this.canvasElements.set(callId, canvas);

            // Start processing frames
            const processFrame = async () => {
                if (!this.activeProcessors.has(callId)) {
                    return; // Stop processing if removed
                }

                try {
                    await this.processFrame(
                        videoElement,
                        canvas,
                        ctx,
                        backgroundConfig,
                        backgroundImage
                    );

                    // Continue processing
                    requestAnimationFrame(processFrame);
                } catch (error) {
                    console.error('❌ [VirtualBackground] Frame processing error:', error);
                }
            };

            // Get stream from canvas
            const processedStream = canvas.captureStream(30); // 30 FPS
            const processedVideoTrack = processedStream.getVideoTracks()[0];

            // Add audio tracks from original stream
            const audioTracks = stream.getAudioTracks();
            audioTracks.forEach(track => processedStream.addTrack(track));

            // Store processor info
            this.activeProcessors.set(callId, {
                videoElement,
                canvas,
                ctx,
                backgroundConfig,
                backgroundImage,
                originalStream: stream,
                processedStream
            });

            // Start processing
            requestAnimationFrame(processFrame);

            console.log('✅ [VirtualBackground] Background applied');
            return processedStream;

        } catch (error) {
            console.error('❌ [VirtualBackground] Error applying background:', error);
            return stream;
        }
    }

    /**
     * Process a single frame
     * @private
     */
    async processFrame(videoElement, canvas, ctx, backgroundConfig, backgroundImage) {
        const { width, height } = canvas;

        // Draw video frame to canvas
        ctx.drawImage(videoElement, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        // Perform segmentation
        await this.segmentation.send({ image: imageData });

        // Get segmentation mask
        this.segmentation.onResults((results) => {
            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Save context state
            ctx.save();

            // Draw background
            if (backgroundConfig.type === 'blur') {
                // Apply blur to original frame
                ctx.filter = `blur(${backgroundConfig.blurAmount || 10}px)`;
                ctx.drawImage(results.image, 0, 0, width, height);
                ctx.filter = 'none';
            } else if (backgroundConfig.type === 'image' && backgroundImage) {
                // Draw background image
                ctx.drawImage(backgroundImage, 0, 0, width, height);
            } else if (backgroundConfig.type === 'color') {
                // Fill with solid color
                ctx.fillStyle = backgroundConfig.color || '#00ff00';
                ctx.fillRect(0, 0, width, height);
            } else {
                // Default: white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
            }

            // Use segmentation mask to composite person on top
            ctx.globalCompositeOperation = 'destination-atop';
            ctx.drawImage(results.segmentationMask, 0, 0, width, height);

            ctx.globalCompositeOperation = 'destination-over';
            ctx.drawImage(results.image, 0, 0, width, height);

            // Restore context
            ctx.restore();
        });
    }

    /**
     * Load image from URL
     * @private
     * @param {string} url - Image URL
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    /**
     * Update background configuration in real-time
     * @param {string} callId - Call identifier
     * @param {Object} newConfig - New configuration
     */
    updateBackground(callId, newConfig) {
        const processor = this.activeProcessors.get(callId);
        
        if (!processor) {
            console.warn(`⚠️ [VirtualBackground] No processor found for call: ${callId}`);
            return;
        }

        // Update config
        processor.backgroundConfig = { ...processor.backgroundConfig, ...newConfig };

        // Load new image if needed
        if (newConfig.type === 'image' && newConfig.url && newConfig.url !== processor.backgroundConfig.url) {
            this.loadImage(newConfig.url).then(img => {
                processor.backgroundImage = img;
            });
        }

        console.log('✅ [VirtualBackground] Background updated');
    }

    /**
     * Remove virtual background and restore original stream
     * @param {string} callId - Call identifier
     * @returns {MediaStream|null}
     */
    removeVirtualBackground(callId) {
        const processor = this.activeProcessors.get(callId);
        
        if (!processor) {
            console.warn(`⚠️ [VirtualBackground] No processor found for call: ${callId}`);
            return null;
        }

        try {
            console.log(`🎭 [VirtualBackground] Removing background for call: ${callId}`);

            // Stop processed stream
            processor.processedStream.getTracks().forEach(track => track.stop());

            // Clean up video element
            if (processor.videoElement) {
                processor.videoElement.pause();
                processor.videoElement.srcObject = null;
            }

            // Remove from maps
            this.activeProcessors.delete(callId);
            this.videoElements.delete(callId);
            this.canvasElements.delete(callId);

            console.log('✅ [VirtualBackground] Background removed');
            return processor.originalStream;

        } catch (error) {
            console.error('❌ [VirtualBackground] Error removing background:', error);
            return processor.originalStream;
        }
    }

    /**
     * Check if virtual background is active for a call
     * @param {string} callId - Call identifier
     * @returns {boolean}
     */
    isActive(callId) {
        return this.activeProcessors.has(callId);
    }

    /**
     * Get available background presets
     * @returns {Array<Object>}
     */
    static getPresets() {
        return [
            {
                id: 'none',
                name: 'None',
                type: 'none'
            },
            {
                id: 'blur-light',
                name: 'Light Blur',
                type: 'blur',
                blurAmount: 5
            },
            {
                id: 'blur-medium',
                name: 'Medium Blur',
                type: 'blur',
                blurAmount: 10
            },
            {
                id: 'blur-heavy',
                name: 'Heavy Blur',
                type: 'blur',
                blurAmount: 20
            },
            {
                id: 'office',
                name: 'Office',
                type: 'image',
                url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&h=720&fit=crop'
            },
            {
                id: 'library',
                name: 'Library',
                type: 'image',
                url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1280&h=720&fit=crop'
            },
            {
                id: 'nature',
                name: 'Nature',
                type: 'image',
                url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&h=720&fit=crop'
            }
        ];
    }

    /**
     * Cleanup all processors
     */
    cleanup() {
        console.log('🧹 [VirtualBackground] Cleaning up all processors');
        
        this.activeProcessors.forEach((processor, callId) => {
            this.removeVirtualBackground(callId);
        });

        if (this.segmentation) {
            this.segmentation.close();
            this.segmentation = null;
        }

        this.isInitialized = false;
    }
}

// Export singleton instance
export const virtualBackgroundService = new VirtualBackgroundService();
export default virtualBackgroundService;
