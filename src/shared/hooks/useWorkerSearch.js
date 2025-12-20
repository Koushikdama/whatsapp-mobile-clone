import { useState, useEffect, useRef } from 'react';
import { createWorker } from '../utils/searchWorker';
import { useDebounce } from './useDebounce';

export const useWorkerChatSearch = ({ chats, users, searchQuery, activeFilter }) => {
    const [sortedChats, setSortedChats] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const workerRef = useRef(null);

    // Debounce search query to reduce worker messages during rapid typing
    const debouncedQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        workerRef.current = createWorker();
        workerRef.current.onmessage = (e) => {
            if (e.data.type === 'FILTER_CHATS_RESULT') {
                setSortedChats(e.data.result);
                setIsSearching(false);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    useEffect(() => {
        if (workerRef.current) {
            setIsSearching(true);
            workerRef.current.postMessage({
                type: 'FILTER_CHATS',
                payload: { chats, users, query: debouncedQuery, activeFilter }
            });
        }
    }, [chats, users, debouncedQuery, activeFilter]);

    return { sortedChats, isSearching };
};

export const useWorkerMessageSearch = ({ messages, searchQuery }) => {
    const [filteredMessages, setFilteredMessages] = useState(messages);
    const workerRef = useRef(null);

    useEffect(() => {
        workerRef.current = createWorker();
        workerRef.current.onmessage = (e) => {
            if (e.data.type === 'FILTER_MESSAGES_RESULT') {
                setFilteredMessages(e.data.result);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    useEffect(() => {
        if (workerRef.current) {
            workerRef.current.postMessage({
                type: 'FILTER_MESSAGES',
                payload: { messages, query: searchQuery }
            });
        }
    }, [messages, searchQuery]);

    return { filteredMessages };
};
