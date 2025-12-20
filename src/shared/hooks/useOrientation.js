import { useState, useEffect } from 'react';

/**
 * Custom hook for detecting screen orientation changes
 * Uses the Screen Orientation API when available, falls back to window dimensions
 * @returns {Object} Orientation state with type and angle
 */
const useOrientation = () => {
    const getOrientation = () => {
        if (typeof window === 'undefined') {
            return { type: 'portrait-primary', angle: 0, isPortrait: true, isLandscape: false };
        }

        // Try to use Screen Orientation API first
        if (window.screen?.orientation) {
            const { type, angle } = window.screen.orientation;
            return {
                type,
                angle,
                isPortrait: type.includes('portrait'),
                isLandscape: type.includes('landscape'),
            };
        }

        // Fallback to window dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isPortrait = height > width;
        
        return {
            type: isPortrait ? 'portrait-primary' : 'landscape-primary',
            angle: isPortrait ? 0 : 90,
            isPortrait,
            isLandscape: !isPortrait,
        };
    };

    const [orientation, setOrientation] = useState(getOrientation);

    useEffect(() => {
        const handleOrientationChange = () => {
            setOrientation(getOrientation());
        };

        // Listen for orientation change events
        if (window.screen?.orientation) {
            // Modern browsers
            window.screen.orientation.addEventListener('change', handleOrientationChange);
        } else {
            // Fallback to resize events
            window.addEventListener('resize', handleOrientationChange);
            // Also listen for deprecated orientationchange event as fallback
            window.addEventListener('orientationchange', handleOrientationChange);
        }

        // Cleanup
        return () => {
            if (window.screen?.orientation) {
                window.screen.orientation.removeEventListener('change', handleOrientationChange);
            } else {
                window.removeEventListener('resize', handleOrientationChange);
                window.removeEventListener('orientationchange', handleOrientationChange);
            }
        };
    }, []);

    return orientation;
};

export default useOrientation;
