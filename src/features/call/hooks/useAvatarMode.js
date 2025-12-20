
import { useState, useRef, useEffect, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';

export const useAvatarMode = () => {
    const [isAvatarMode, setIsAvatarMode] = useState(false);
    const [avatarStream, setAvatarStream] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const faceMeshRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Initialize FaceMesh
    useEffect(() => {
        const faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults(onResults);
        faceMeshRef.current = faceMesh;

        return () => {
            if (faceMeshRef.current) {
                faceMeshRef.current.close();
            }
        };
    }, []);

    const onResults = useCallback((results) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.save();
        ctx.clearRect(0, 0, width, height);

        // Fill background
        ctx.fillStyle = '#111827'; // Dark gray/black background
        ctx.fillRect(0, 0, width, height);

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            drawAvatar(ctx, landmarks, width, height);
        } else {
            // Draw idle state if no face detected
            drawIdleAvatar(ctx, width, height);
        }

        ctx.restore();
    }, []);

    const drawAvatar = (ctx, landmarks, width, height) => {
        // Simple geometric avatar
        // Landmarks: 
        // 133, 33, 160, 158, 136, 153, 144, 145, 153... (Left Eye)
        // 362, 263, 387, 385, 365, 380, 373, 374, 380... (Right Eye)
        // 13, 14 (Lips center, vertical)

        // Colors
        const skinColor = '#FFD700'; // Gold/Yellow
        const eyeColor = 'white';
        const pupilColor = 'black';

        // Calculate head position (approximate from nose tip #1)
        const nose = landmarks[1];
        const cx = nose.x * width;
        const cy = nose.y * height;
        const scale = 1.5; // Scale face up a bit

        // Draw Head (Circle)
        ctx.beginPath();
        ctx.arc(cx, cy, 100 * scale, 0, 2 * Math.PI);
        ctx.fillStyle = skinColor;
        ctx.fill();

        // Draw Left Eye
        const leftEye = landmarks[159]; // Top of left eye
        const leftEyeBottom = landmarks[145]; // Bottom of left eye
        const leftEyeHeight = Math.abs(leftEye.y - leftEyeBottom.y);
        const isLeftBlink = leftEyeHeight < 0.01;

        ctx.beginPath();
        if (isLeftBlink) {
            ctx.moveTo(landmarks[33].x * width, landmarks[33].y * height);
            ctx.lineTo(landmarks[133].x * width, landmarks[133].y * height);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            ctx.ellipse(landmarks[159].x * width, landmarks[159].y * height + 10,
                15 * scale, 10 * (isLeftBlink ? 0.1 : 1) * scale, 0, 0, 2 * Math.PI);
            ctx.fillStyle = eyeColor;
            ctx.fill();
            // Pupil
            ctx.beginPath();
            ctx.arc(landmarks[159].x * width, landmarks[159].y * height + 10, 5 * scale, 0, 2 * Math.PI);
            ctx.fillStyle = pupilColor;
            ctx.fill();
        }

        // Draw Right Eye
        const rightEye = landmarks[386]; // Top
        const rightEyeBottom = landmarks[374]; // Bottom
        const rightEyeHeight = Math.abs(rightEye.y - rightEyeBottom.y);
        const isRightBlink = rightEyeHeight < 0.01;

        ctx.beginPath();
        if (isRightBlink) {
            ctx.moveTo(landmarks[362].x * width, landmarks[362].y * height);
            ctx.lineTo(landmarks[263].x * width, landmarks[263].y * height);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            ctx.ellipse(landmarks[386].x * width, landmarks[386].y * height + 10,
                15 * scale, 10 * (isRightBlink ? 0.1 : 1) * scale, 0, 0, 2 * Math.PI);
            ctx.fillStyle = eyeColor;
            ctx.fill();
            // Pupil
            ctx.beginPath();
            ctx.arc(landmarks[386].x * width, landmarks[386].y * height + 10, 5 * scale, 0, 2 * Math.PI);
            ctx.fillStyle = pupilColor;
            ctx.fill();
        }

        // Draw Mouth
        // Simple line from 78 to 308 (corners of mouth)
        // Check 13 and 14 destance for openness
        const mouthTop = landmarks[13];
        const mouthBottom = landmarks[14];
        const mouthOpen = Math.abs(mouthTop.y - mouthBottom.y);

        ctx.beginPath();
        if (mouthOpen > 0.02) {
            ctx.ellipse((landmarks[13].x + landmarks[14].x) / 2 * width, (landmarks[13].y + landmarks[14].y) / 2 * height,
                20 * scale, 15 * scale * (mouthOpen * 10), 0, 0, 2 * Math.PI);
            ctx.fillStyle = '#333';
            ctx.fill();
        } else {
            ctx.moveTo(landmarks[78].x * width, landmarks[78].y * height);
            ctx.quadraticCurveTo(landmarks[13].x * width, landmarks[13].y * height + 10, landmarks[308].x * width, landmarks[308].y * height);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    };

    const drawIdleAvatar = (ctx, width, height) => {
        const cx = width / 2;
        const cy = height / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, 100, 0, 2 * Math.PI);
        ctx.fillStyle = '#555'; // Gray inactive
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(cx - 30, cy - 20, 10, 0, 2 * Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 30, cy - 20, 10, 0, 2 * Math.PI); ctx.fill();

        // Mouth line
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy + 20);
        ctx.lineTo(cx + 20, cy + 20);
        ctx.strokeStyle = 'white';
        ctx.stroke();
    };

    const processVideo = async () => {
        if (!isAvatarMode || !videoRef.current || !faceMeshRef.current) return;

        const video = videoRef.current;
        if (video.readyState === 4) {
            try {
                await faceMeshRef.current.send({ image: video });
            } catch (e) {
                console.error("FaceMesh Error", e);
            }
        }
        animationFrameRef.current = requestAnimationFrame(processVideo);
    };

    const startAvatarMode = async () => {
        setIsLoading(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480 } });
            cameraStreamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadeddata = () => {
                    videoRef.current.play();
                    processVideo();
                };
            }

            // Init canvas stream
            if (canvasRef.current) {
                const stream = canvasRef.current.captureStream(30);
                setAvatarStream(stream);
            }

            setIsAvatarMode(true);
        } catch (err) {
            console.error("Failed to start avatar mode", err);
        } finally {
            setIsLoading(false);
        }
    };

    const stopAvatarMode = () => {
        setIsAvatarMode(false);
        setAvatarStream(null);

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const toggleAvatarMode = () => {
        if (isAvatarMode) {
            stopAvatarMode();
        } else {
            startAvatarMode();
        }
    };

    // Resume processing loop when toggled on
    useEffect(() => {
        if (isAvatarMode) {
            processVideo();
        }
    }, [isAvatarMode]);


    return {
        isAvatarMode,
        avatarStream,
        toggleAvatarMode,
        canvasRef,
        videoRef,
        isLoading
    };
};
