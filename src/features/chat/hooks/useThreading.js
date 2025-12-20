import { useState, useCallback } from 'react';

/**
 * useThreading - Hook for managing message threading logic
 * Handles reply-to state and thread navigation
 */
export const useThreading = () => {
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeThread, setActiveThread] = useState(null);

  const handleReplyTo = useCallback((message) => {
    setReplyingTo({
      id: message.id,
      text: message.text,
      sender: message.sender || 'User',
      type: message.type || 'text'
    });
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const openThread = useCallback((message) => {
    setActiveThread(message);
  }, []);

  const closeThread = useCallback(() => {
    setActiveThread(null);
  }, []);

  return {
    replyingTo,
    activeThread,
    handleReplyTo,
    cancelReply,
    openThread,
    closeThread
  };
};
