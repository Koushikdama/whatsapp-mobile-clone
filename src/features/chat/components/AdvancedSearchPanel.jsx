import React from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useMessageSearch } from '../../../shared/hooks/useMessageSearch';

/**
 * AdvancedSearchPanel - Advanced search UI with filters
 * 
 * @param {Object} props
 * @param {Array} props.messages - All messages to search
 * @param {Object} props.users - Users object
 * @param {Function} props.onResultSelect - Callback when result is selected
 * @param {Function} props.onClose - Callback to close panel
 */
const AdvancedSearchPanel = ({ messages, users, onResultSelect, onClose }) => {
    const search = useMessageSearch(messages, users);

    const handleSearch = () => {
        if (search.currentResult) {
            onResultSelect(search.currentResult);
        }
    };

    const handleNavigate = (direction) => {
        const result = search.navigateTo(direction);
        if (result) {
            onResultSelect(result);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="bg-white dark:bg-wa-dark-header border-b border-gray-200 dark:border-gray-700 p-4 z-40 animate-in slide-in-from-top duration-200 shadow-md">
            {/* Search Input */}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 flex items-center bg-gray-100 dark:bg-wa-dark-input rounded-lg px-3 py-2.5">
                    <Search size={18} className="text-gray-400 mr-2 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={search.searchQuery}
                        onChange={(e) => search.setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-500"
                        autoFocus
                    />
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors shrink-0"
                    aria-label="Close search"
                >
                    <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {/* Sender Filter */}
                <select
                    value={search.filters.sender}
                    onChange={(e) => search.updateFilter('sender', e.target.value)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-wa-teal transition-all"
                >
                    <option value="all">All Senders</option>
                    {Object.values(users).map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>

                {/* Type Filter */}
                <select
                    value={search.filters.type}
                    onChange={(e) => search.updateFilter('type', e.target.value)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-wa-teal transition-all"
                >
                    <option value="all">All Types</option>
                    <option value="text">Text</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="voice">Voice</option>
                </select>

                {/* Date From */}
                <input
                    type="date"
                    value={search.filters.dateFrom}
                    onChange={(e) => search.updateFilter('dateFrom', e.target.value)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-wa-teal transition-all"
                    placeholder="From date"
                />

                {/* Date To */}
                <input
                    type="date"
                    value={search.filters.dateTo}
                    onChange={(e) => search.updateFilter('dateTo', e.target.value)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-wa-teal transition-all"
                    placeholder="To date"
                />
            </div>

            {/* Results Navigation */}
            {search.hasResults ? (
                <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                        {search.currentResultIndex + 1} of {search.resultCount} results
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => handleNavigate('prev')}
                            disabled={search.currentResultIndex === 0}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label="Previous result"
                        >
                            <ChevronUp size={18} className="text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                            onClick={() => handleNavigate('next')}
                            disabled={search.currentResultIndex === search.resultCount - 1}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label="Next result"
                        >
                            <ChevronDown size={18} className="text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>
                </div>
            ) : search.searchQuery || search.filters.sender !== 'all' || search.filters.type !== 'all' || search.filters.dateFrom || search.filters.dateTo ? (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                    No results found
                </div>
            ) : null}
        </div>
    );
};

export default AdvancedSearchPanel;
