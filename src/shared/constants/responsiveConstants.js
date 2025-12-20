/**
 * Responsive Design Constants
 * Centralized constants for consistent responsive behavior across the application
 */

// Minimum touch target sizes (Apple & Material Design guidelines)
export const TOUCH_TARGETS = {
    MIN_SIZE: 44, // 44px minimum for comfortable tapping
    COMFORTABLE_SIZE: 48, // 48px for better accessibility
    ICON_SMALL: 20,
    ICON_MEDIUM: 24,
    ICON_LARGE: 28,
};

// Responsive spacing scale (matches design tokens)
export const SPACING = {
    xs: { mobile: 4, tablet: 6, desktop: 8 },
    sm: { mobile: 8, tablet: 12, desktop: 16 },
    md: { mobile: 12, tablet: 16, desktop: 20 },
    lg: { mobile: 16, tablet: 20, desktop: 24 },
    xl: { mobile: 20, tablet: 28, desktop: 32 },
    '2xl': { mobile: 24, tablet: 32, desktop: 40 },
};

// Typography scales for different screen sizes
export const TYPOGRAPHY = {
    // Heading sizes
    h1: { mobile: 24, tablet: 28, desktop: 32 },
    h2: { mobile: 20, tablet: 24, desktop: 28 },
    h3: { mobile: 18, tablet: 20, desktop: 24 },
    h4: { mobile: 16, tablet: 18, desktop: 20 },
    
    // Body text
    body: { mobile: 14, tablet: 15, desktop: 16 },
    bodyLarge: { mobile: 15, tablet: 16, desktop: 17 },
    bodySmall: { mobile: 13, tablet: 14, desktop: 15 },
    
    // Utility text
    caption: { mobile: 11, tablet: 12, desktop: 13 },
    label: { mobile: 12, tablet: 13, desktop: 14 },
};

// Avatar sizes for different contexts
export const AVATAR_SIZES = {
    chatList: { mobile: 48, tablet: 52, desktop: 56 },
    chatHeader: { mobile: 40, tablet: 44, desktop: 48 },
    messageBubble: { mobile: 28, tablet: 32, desktop: 32 },
    profileLarge: { mobile: 80, tablet: 96, desktop: 120 },
};

// Animation timings
export const ANIMATIONS = {
    FAST: 150,
    NORMAL: 200,
    SLOW: 300,
    RESIZE_DEBOUNCE: 150,
};

// Layout dimensions
export const LAYOUT = {
    // Header heights
    headerMobile: { small: 56, large: 60 },
    headerTablet: 60,
    headerDesktop: 60,
    
    // Bottom navigation
    bottomNavHeight: { small: 58, large: 60 },
    
    // Sidebar widths
    sidebarTablet: { min: 320, default: 360, max: 400 },
    sidebarDesktop: { min: 380, default: 400, max: 440 },
    sidebarDesktopLarge: { min: 400, default: 420, max: 480 },
    
    // Content max-widths
    contentMaxWidth: {
        mobile: '100%',
        tablet: 768,
        desktop: 1280,
        desktopLarge: 1600,
        ultraWide: 1920,
    },
    
    // Message bubble max-widths (percentage)
    messageBubbleMaxWidth: {
        mobile: 85,
        tablet: 75,
        desktop: 65,
        desktopLarge: 60,
    },
};

// Z-index scale for consistent layering
export const Z_INDEX = {
    BASE: 1,
    DROPDOWN: 10,
    STICKY: 20,
    MODAL_BACKDROP: 40,
    MODAL: 50,
    TOAST: 60,
    GAME_FLOATING: 100,
    GAME_MODAL: 110,
};

// Breakpoint values (matching useResponsive hook)
export const BREAKPOINTS = {
    xs: 375,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};

// Safe area insets for devices with notches
export const SAFE_AREA = {
    top: 'env(safe-area-inset-top, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
};

// Helper function to get responsive value based on screen size
export const getResponsiveValue = (values, screenSize) => {
    if (typeof values !== 'object') return values;
    
    // Map screen sizes to value keys
    const sizeMap = {
        'mobile-small': 'mobile',
        'mobile-large': 'mobile',
        'tablet': 'tablet',
        'desktop': 'desktop',
        'desktop-large': 'desktopLarge',
    };
    
    const key = sizeMap[screenSize] || 'mobile';
    return values[key] || values.mobile || values.default;
};

// Utility to generate responsive class names
export const responsiveClass = (baseClass, screens) => {
    let classes = baseClass;
    Object.entries(screens).forEach(([breakpoint, className]) => {
        classes += ` ${breakpoint}:${className}`;
    });
    return classes;
};

export default {
    TOUCH_TARGETS,
    SPACING,
    TYPOGRAPHY,
    AVATAR_SIZES,
    ANIMATIONS,
    LAYOUT,
    Z_INDEX,
    BREAKPOINTS,
    SAFE_AREA,
    getResponsiveValue,
    responsiveClass,
};
