import { useState, useEffect, useCallback } from 'react';

/**
 * useThreadMessages - Async hook for fetching and managing thread messages
 * Implements optimistic updates and pagination
 */
export const useThreadMessages = (parentMessageId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  
  // Fetch thread messages
  const fetchThreadMessages = useCallback(async (pageNum = 1) => {
    if (!parentMessageId) return;
    
    setLoading(true);
    
    try {
      // Simulate API call with setTimeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data - replace with actual API call
      const mockReplies = [];
      
      if (pageNum === 1) {
        setMessages(mockReplies);
      } else {
        setMessages(prev => [...prev, ...mockReplies]);
      }
      
      setHasMore(false); // No more for now
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch thread messages:', error);
    } finally {
      setLoading(false);
    }
  }, [parentMessageId]);
  
  // Initial load
  useEffect(() => {
    if (parentMessageId) {
      fetchThreadMessages(1);
    }
  }, [parentMessageId, fetchThreadMessages]);
  
  // Load more messages
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchThreadMessages(page + 1);
    }
  }, [loading, hasMore, page, fetchThreadMessages]);
  
  // Send reply (optimistic update)
  const sendReply = useCallback(async (replyData) => {
    const optimisticMessage = {
      id: `temp_${Date.now()}`,
      ...replyData,
      timestamp: Date.now(),
      sending: true
    };
    
    // Add optimistically
    setMessages(prev => [optimisticMessage, ...prev]);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const savedMessage = {
        ...optimisticMessage,
        id: `msg_${Date.now()}`,
        sending: false
      };
      
      // Replace temp message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? savedMessage : msg
      ));
      
      return savedMessage;
    } catch (error) {
      console.error('Failed to send reply:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      throw error;
    }
  }, []);
  
  return {
    threadMessages: messages,
    loading,
    hasMore,
    loadMore,
    sendReply,
    refresh: () => fetchThreadMessages(1)
  };
};
