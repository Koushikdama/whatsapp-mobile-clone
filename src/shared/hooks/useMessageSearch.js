import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from 'use-debounce';

/**
 * useMessageSearch - Hook for advanced message search with filters
 * 
 * @param {Array} messages - All messages in chat
 * @param {Object} users - Users object
 * @returns {Object} Search state and functions
 */
export const useMessageSearch = (messages, users) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        sender: 'all',
        type: 'all',
        dateFrom: '',
        dateTo: ''
    });
    const [currentResultIndex, setCurrentResultIndex] = useState(0);

    // Debounce search query
    const [debouncedQuery] = useDebounce(searchQuery, 300);

    /**
     * Filter messages based on query and filters
     */
    const searchResults = useMemo(() => {
        if (!debouncedQuery && filters.sender === 'all' && filters.type === 'all' && !filters.dateFrom && !filters.dateTo) {
            return [];
        }

        return messages.filter(msg => {
            // Text match
            if (debouncedQuery && !msg.text.toLowerCase().includes(debouncedQuery.toLowerCase())) {
                return false;
            }

            // Sender filter
            if (filters.sender !== 'all' && msg.senderId !== filters.sender) {
                return false;
            }

            // Type filter
            if (filters.type !== 'all' && msg.type !== filters.type) {
                return false;
            }

            // Date from filter
            if (filters.dateFrom) {
                const msgDate = new Date(msg.timestamp);
                const fromDate = new Date(filters.dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                if (msgDate < fromDate) return false;
            }

            // Date to filter
            if (filters.dateTo) {
                const msgDate = new Date(msg.timestamp);
                const toDate = new Date(filters.dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (msgDate > toDate) return false;
            }

            return true;
        });
    }, [messages, debouncedQuery, filters]);

    /**
     * Navigate to next/previous result
     */
    const navigateTo = useCallback((direction) => {
        if (searchResults.length === 0) return null;

        let newIndex;
        if (direction === 'next') {
            newIndex = Math.min(currentResultIndex + 1, searchResults.length - 1);
        } else {
            newIndex = Math.max(currentResultIndex - 1, 0);
        }

        setCurrentResultIndex(newIndex);
        return searchResults[newIndex];
    }, [currentResultIndex, searchResults]);

    /**
     * Update filter
     */
    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentResultIndex(0); // Reset to first result
    }, []);

    /**
     * Reset search
     */
    const resetSearch = useCallback(() => {
        setSearchQuery('');
        setFilters({
            sender: 'all',
            type: 'all',
            dateFrom: '',
            dateTo: ''
        });
        setCurrentResultIndex(0);
    }, []);

    /**
     * Get current result
     */
    const currentResult = useMemo(() => {
        if (searchResults.length === 0) return null;
        return searchResults[currentResultIndex];
    }, [searchResults, currentResultIndex]);

    return {
        searchQuery,
        setSearchQuery,
        filters,
        updateFilter,
        searchResults,
        currentResult,
        currentResultIndex,
        navigateTo,
        resetSearch,
        hasResults: searchResults.length > 0,
        resultCount: searchResults.length
    };
};
