import { useState, useEffect } from 'react';

/**
 * Custom hook to match CSS media queries in JavaScript
 * @param {string} query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns {boolean} - Whether the media query matches
 */
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        // Create media query list
        const mediaQueryList = window.matchMedia(query);
        
        // Set initial value
        setMatches(mediaQueryList.matches);

        // Handler for media query changes
        const handleChange = (event) => {
            setMatches(event.matches);
        };

        // Add listener (using modern addEventListener, compatible with more browsers)
        mediaQueryList.addEventListener('change', handleChange);

        // Cleanup
        return () => {
            mediaQueryList.removeEventListener('change', handleChange);
        };
    }, [query]);

    return matches;
};

export default useMediaQuery;
