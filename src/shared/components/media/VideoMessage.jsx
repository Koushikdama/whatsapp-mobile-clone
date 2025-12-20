
import React, { useState, useRef } from 'react';
import { Play, Video } from 'lucide-react';

const VideoMessage = ({ src, poster, duration, className }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = (e) => {
        e?.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(e => console.log("Video play failed:", e));
            }
            setIsPlaying(!isPlaying);
        }
    }

    const handleVideoClick = (e) => {
        e.stopPropagation();
        // If controls are visible, let the browser handle clicks on controls
        // If clicking the video area, toggle play
        if (!isPlaying) {
            togglePlay(e);
        }
    };

    if (!src) return null;

    return (
        <div className={`relative bg-black overflow-hidden cursor-pointer group flex items-center justify-center ${className || 'w-full max-w-[300px] md:max-w-[350px] max-h-[250px] md:max-h-[300px] min-w-[200px] rounded-lg'}`} onClick={handleVideoClick}>
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="w-full h-full object-cover"
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                playsInline
                controls={isPlaying}
            />

            {/* Play Button Overlay - Only visible when NOT playing */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-all z-10">
                    <div
                        onClick={togglePlay}
                        className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm border border-white/30 shadow-lg transform group-hover:scale-110 transition-transform"
                    >
                        <Play size={24} fill="currentColor" className="ml-1 opacity-100" />
                    </div>
                </div>
            )}

            {/* Duration Badge - Only visible when NOT playing */}
            {duration && !isPlaying && (
                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[11px] px-2 py-1 rounded-md backdrop-blur-md font-medium z-10 flex items-center gap-1.5 shadow-sm">
                    <Video size={12} /> {duration}
                </span>
            )}
        </div>
    )
};

export default VideoMessage;
