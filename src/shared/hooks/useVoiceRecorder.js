import { useState, useRef, useCallback } from 'react';

/**
 * useVoiceRecorder - Custom hook for recording voice messages
 * Uses Web Audio API (MediaRecorder) for real audio recording
 * 
 * @returns {Object} Recording state and controls
 */
export const useVoiceRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [error, setError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const streamRef = useRef(null);

    const startRecording = useCallback(async () => {
        try {
            setError(null);

            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            streamRef.current = stream;

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            // Handle data available
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            // Handle recording stop
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);

                setAudioBlob(blob);
                setAudioUrl(url);

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };

            // Start recording
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Unable to access microphone. Please grant permission.');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    }, [isRecording]);

    const cancelRecording = useCallback(() => {
        stopRecording();
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);

        // Clean up URL
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
    }, [stopRecording, audioUrl]);

    const resetRecording = useCallback(() => {
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setError(null);

        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
    }, [audioUrl]);

    return {
        isRecording,
        recordingTime,
        audioBlob,
        audioUrl,
        error,
        startRecording,
        stopRecording,
        cancelRecording,
        resetRecording
    };
};
