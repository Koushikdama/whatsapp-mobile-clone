import { useState, useEffect, useMemo } from 'react';

/**
 * Breakpoint definitions matching Tailwind CSS default breakpoints
 * Following social media responsive patterns
 */
export const BREAKPOINTS = {
    xs: 375,      // Small phones
    sm: 640,      // Large phones
    md: 768,      // Tablets
    lg: 1024,     // Small desktops
    xl: 1280,     // Desktops
    '2xl': 1536,  // Large desktops
};

/**
 * Screen size categories for easier conditional rendering
 */
export const SCREEN_SIZES = {
    MOBILE_SMALL: 'mobile-small',    // < 640px
    MOBILE_LARGE: 'mobile-large',    // 640px - 767px
    TABLET: 'tablet',                // 768px - 1023px
    DESKTOP: 'desktop',              // 1024px - 1439px
    DESKTOP_LARGE: 'desktop-large',  // >= 1440px
};

/**
 * Custom hook for responsive breakpoint detection
 * Returns current breakpoint information and boolean flags
 * @returns {Object} Responsive state
 */
const useResponsive = () => {
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );

    useEffect(() => {
        // Debounce resize handler to improve performance
        let timeoutId;
        
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setWindowWidth(window.innerWidth);
            }, 150); // 150ms debounce
        };

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, []);

    // Memoize computed values to prevent unnecessary re-renders
    const responsive = useMemo(() => {
        // Get orientation
        const height = typeof window !== 'undefined' ? window.innerHeight : 768;
        const isPortrait = height > windowWidth;
        const isLandscape = windowWidth >= height;
        
        // Detect device capabilities
        const hasTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        const hasHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
        
        // Determine current screen size category
        let screenSize;
        if (windowWidth < BREAKPOINTS.sm) {
            screenSize = SCREEN_SIZES.MOBILE_SMALL;
        } else if (windowWidth < BREAKPOINTS.md) {
            screenSize = SCREEN_SIZES.MOBILE_LARGE;
        } else if (windowWidth < BREAKPOINTS.lg) {
            screenSize = SCREEN_SIZES.TABLET;
        } else if (windowWidth < 1440) {
            screenSize = SCREEN_SIZES.DESKTOP;
        } else {
            screenSize = SCREEN_SIZES.DESKTOP_LARGE;
        }

        // Helper function to check if width is between two breakpoints
        const isBetween = (min, max) => windowWidth >= min && windowWidth < max;

        return {
            // Current window dimensions
            width: windowWidth,
            height,
            
            // Orientation
            isPortrait,
            isLandscape,
            
            // Device capabilities
            hasTouch,
            hasHover,
            isTouchDevice: hasTouch && !hasHover,
            
            // Current screen size category
            screenSize,
            
            // Boolean flags for common breakpoint checks
            isMobileSmall: windowWidth < BREAKPOINTS.sm,
            isMobileLarge: windowWidth >= BREAKPOINTS.sm && windowWidth < BREAKPOINTS.md,
            isMobile: windowWidth < BREAKPOINTS.md,
            isTablet: windowWidth >= BREAKPOINTS.md && windowWidth < BREAKPOINTS.lg,
            isDesktop: windowWidth >= BREAKPOINTS.lg,
            isDesktopLarge: windowWidth >= 1440,
            
            // Specific breakpoint checks
            isAboveSm: windowWidth >= BREAKPOINTS.sm,
            isAboveMd: windowWidth >= BREAKPOINTS.md,
            isAboveLg: windowWidth >= BREAKPOINTS.lg,
            isAboveXl: windowWidth >= BREAKPOINTS.xl,
            isAbove2xl: windowWidth >= BREAKPOINTS['2xl'],
            
            // Reverse checks
            isBelowSm: windowWidth < BREAKPOINTS.sm,
            isBelowMd: windowWidth < BREAKPOINTS.md,
            isBelowLg: windowWidth < BREAKPOINTS.lg,
            isBelowXl: windowWidth < BREAKPOINTS.xl,
            isBelow2xl: windowWidth < BREAKPOINTS['2xl'], // FIXED: was duplicate isBelowXl
            
            // Helper functions
            isBetween,
        };
    }, [windowWidth]);

    return responsive;
};

export default useResponsive;
