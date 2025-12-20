
import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VideoMessage from './VideoMessage';

const MediaCarousel = ({ mediaUrls }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);
    const minSwipeDistance = 40;

    const next = (e) => {
        e?.stopPropagation();
        if (currentIndex < mediaUrls.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const prev = (e) => {
        e?.stopPropagation();
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleTouchStart = (e) => {
        touchEndX.current = null;
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        if (!touchStartX.current || !touchEndX.current) return;
        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentIndex < mediaUrls.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else if (isRightSwipe && currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
        // Reset
        touchStartX.current = null;
        touchEndX.current = null;
    };

    const isVideo = (url) => {
        const lower = url.toLowerCase();
        // Check for common video extensions or blob URLs (often videos in this context) or explicit 'video' keyword in mock URLs
        return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || url.startsWith('blob:') || lower.includes('video');
    };

    if (!mediaUrls || mediaUrls.length === 0) return null;

    return (
        <div
            className="relative w-full max-w-[300px] md:max-w-[350px] aspect-square bg-black rounded-lg overflow-hidden group select-none touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Sliding Track */}
            <div
                className="flex w-full h-full transition-transform duration-300 ease-out will-change-transform"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {mediaUrls.map((url, idx) => (
                    <div key={idx} className="w-full h-full flex-shrink-0 relative flex items-center justify-center bg-black">
                        {isVideo(url) ? (
                            <VideoMessage
                                src={url}
                                className="w-full h-full"
                            />
                        ) : (
                            <img
                                src={url}
                                alt={`Slide ${idx + 1}`}
                                className="w-full h-full object-cover pointer-events-none"
                                loading="lazy"
                                draggable={false}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Gradient Overlay for controls visibility (Only over images or when controls hidden) */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-40" />

            {/* Navigation Arrows */}
            {mediaUrls.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-sm transition-all z-30 hover:bg-black/60 active:scale-95 border border-white/10
                            ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                        `}
                        aria-label="Previous media"
                    >
                        <ChevronLeft size={20} strokeWidth={3} />
                    </button>

                    <button
                        onClick={next}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-sm transition-all z-30 hover:bg-black/60 active:scale-95 border border-white/10
                            ${currentIndex === mediaUrls.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                        `}
                        aria-label="Next media"
                    >
                        <ChevronRight size={20} strokeWidth={3} />
                    </button>
                </>
            )}

            {/* Pagination Dots */}
            {mediaUrls.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
                    {mediaUrls.map((_, idx) => (
                        <div
                            key={idx}
                            className={`rounded-full shadow-sm transition-all duration-300 ${idx === currentIndex
                                ? 'bg-white w-2 h-2 opacity-100 scale-110'
                                : 'bg-white/50 w-1.5 h-1.5 opacity-70'
                                }`}
                        />
                    ))}
                </div>
            )}

            {/* Counter Badge */}
            {mediaUrls.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm z-20 font-medium pointer-events-none border border-white/10">
                    {currentIndex + 1}/{mediaUrls.length}
                </div>
            )}
        </div>
    )
};

export default MediaCarousel;
