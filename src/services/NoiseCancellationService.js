/**
 * Noise Cancellation Service
 * Uses Web Audio API to apply noise suppression to audio streams
 * Follows Single Responsibility Principle - manages audio processing only
 */

class NoiseCancellationService {
    constructor() {
        this.audioContext = null;
        this.processors = new Map(); // Map callId to processor info
        this.isSupported = this.checkSupport();
    }

    /**
     * Check if Web Audio API is supported
     * @returns {boolean}
     */
    checkSupport() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }

    /**
     * Initialize audio context
     * @private
     */
    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    /**
     * Apply noise cancellation to an audio stream
     * @param {string} callId - Unique call identifier
     * @param {MediaStream} stream - Original audio stream
     * @param {Object} options - Processing options
     * @returns {Promise<MediaStream>} - Processed audio stream
     */
    async applyNoiseCancellation(callId, stream, options = {}) {
        if (!this.isSupported) {
            console.warn('⚠️ [NoiseCancellation] Web Audio API not supported');
            return stream;
        }

        try {
            console.log(`🎙️ [NoiseCancellation] Applying noise cancellation for call: ${callId}`);

            const audioContext = this.initAudioContext();
            const audioTracks = stream.getAudioTracks();
            
            if (audioTracks.length === 0) {
                console.warn('⚠️ [NoiseCancellation] No audio tracks found');
                return stream;
            }

            // Create source from the MediaStream
            const source = audioContext.createMediaStreamSource(stream);

            // Create filter chain for noise reduction
            const filterChain = this.createFilterChain(audioContext, options);

            // Create destination (output stream)
            const destination = audioContext.createMediaStreamDestination();

            // Connect: source -> filters -> destination
            let currentNode = source;
            filterChain.forEach(filter => {
                currentNode.connect(filter);
                currentNode = filter;
            });
            currentNode.connect(destination);

            // Store processor info for later cleanup
            this.processors.set(callId, {
                audioContext,
                source,
                filters: filterChain,
                destination,
                originalStream: stream
            });

            console.log('✅ [NoiseCancellation] Noise cancellation applied');
            return destination.stream;

        } catch (error) {
            console.error('❌ [NoiseCancellation] Error applying noise cancellation:', error);
            return stream; // Return original stream on error
        }
    }

    /**
     * Create filter chain for noise reduction
     * @private
     * @param {AudioContext} audioContext
     * @param {Object} options
     * @returns {Array<AudioNode>}
     */
    createFilterChain(audioContext, options = {}) {
        const filters = [];

        // 1. High-pass filter to remove low-frequency noise
        const highPassFilter = audioContext.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.value = options.highPassFreq || 85; // Hz - removes rumble
        highPassFilter.Q.value = 0.7;
        filters.push(highPassFilter);

        // 2. Dynamic compressor to normalize volume and reduce noise
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = options.threshold || -50; // dB
        compressor.knee.value = options.knee || 40; // dB
        compressor.ratio.value = options.ratio || 12; // ratio
        compressor.attack.value = options.attack || 0.003; // seconds
        compressor.release.value = options.release || 0.25; // seconds
        filters.push(compressor);

        // 3. Low-pass filter to remove high-frequency hiss
        const lowPassFilter = audioContext.createBiquadFilter();
        lowPassFilter.type = 'lowpass';
        lowPassFilter.frequency.value = options.lowPassFreq || 8000; // Hz - removes hiss
        lowPassFilter.Q.value = 0.7;
        filters.push(lowPassFilter);

        // 4. Gain control
        const gainNode = audioContext.createGain();
        gainNode.gain.value = options.gain || 1.2; // Slight boost after compression
        filters.push(gainNode);

        return filters;
    }

    /**
     * Remove noise cancellation and restore original stream
     * @param {string} callId - Call identifier
     * @returns {MediaStream|null} - Original stream or null
     */
    removeNoiseCancellation(callId) {
        const processor = this.processors.get(callId);
        
        if (!processor) {
            console.warn(`⚠️ [NoiseCancellation] No processor found for call: ${callId}`);
            return null;
        }

        try {
            console.log(`🔇 [NoiseCancellation] Removing noise cancellation for call: ${callId}`);

            // Disconnect all nodes
            processor.source.disconnect();
            processor.filters.forEach(filter => filter.disconnect());

            // Remove from map
            this.processors.delete(callId);

            console.log('✅ [NoiseCancellation] Noise cancellation removed');
            return processor.originalStream;

        } catch (error) {
            console.error('❌ [NoiseCancellation] Error removing noise cancellation:', error);
            return processor.originalStream;
        }
    }

    /**
     * Update noise cancellation settings in real-time
     * @param {string} callId - Call identifier
     * @param {Object} options - New options
     */
    updateSettings(callId, options = {}) {
        const processor = this.processors.get(callId);
        
        if (!processor) {
            console.warn(`⚠️ [NoiseCancellation] No processor found for call: ${callId}`);
            return;
        }

        try {
            const [highPass, compressor, lowPass, gain] = processor.filters;

            if (options.highPassFreq !== undefined) {
                highPass.frequency.value = options.highPassFreq;
            }
            if (options.threshold !== undefined) {
                compressor.threshold.value = options.threshold;
            }
            if (options.knee !== undefined) {
                compressor.knee.value = options.knee;
            }
            if (options.ratio !== undefined) {
                compressor.ratio.value = options.ratio;
            }
            if (options.lowPassFreq !== undefined) {
                lowPass.frequency.value = options.lowPassFreq;
            }
            if (options.gain !== undefined) {
                gain.gain.value = options.gain;
            }

            console.log('✅ [NoiseCancellation] Settings updated');
        } catch (error) {
            console.error('❌ [NoiseCancellation] Error updating settings:', error);
        }
    }

    /**
     * Check if noise cancellation is active for a call
     * @param {string} callId - Call identifier
     * @returns {boolean}
     */
    isActive(callId) {
        return this.processors.has(callId);
    }

    /**
     * Cleanup all processors
     */
    cleanup() {
        console.log('🧹 [NoiseCancellation] Cleaning up all processors');
        
        this.processors.forEach((processor, callId) => {
            this.removeNoiseCancellation(callId);
        });

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    /**
     * Get preset configurations
     * @returns {Object}
     */
    static getPresets() {
        return {
            light: {
                highPassFreq: 60,
                threshold: -40,
                knee: 30,
                ratio: 8,
                lowPassFreq: 10000,
                gain: 1.1
            },
            medium: {
                highPassFreq: 85,
                threshold: -50,
                knee: 40,
                ratio: 12,
                lowPassFreq: 8000,
                gain: 1.2
            },
            aggressive: {
                highPassFreq: 100,
                threshold: -60,
                knee: 50,
                ratio: 20,
                lowPassFreq: 6000,
                gain: 1.5
            }
        };
    }
}

// Export singleton instance
export const noiseCancellationService = new NoiseCancellationService();
export default noiseCancellationService;
