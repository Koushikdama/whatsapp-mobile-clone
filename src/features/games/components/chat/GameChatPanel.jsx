import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, X, Minus, MessageCircle } from 'lucide-react';
import { chatService } from '../../../../services/ChatService';
import { webSocketService, GameEventTypes } from '../../../../services/WebSocketService';

/**
 * GameChatPanel - In-game chat interface
 * 
 * Features:
 * - Real-time messaging
 * - Emoji reactions
 * - System messages
 * - Minimize/expand
 */
const GameChatPanel = ({ gameId, currentUserId, currentUserName, participants = [], isMinimized, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const commonEmojis = ['👍', '❤️', '😂', '🎉', '🔥', '👏', '😮', '😢'];

  /**
   * Load messages and subscribe to new ones
   */
  useEffect(() => {
    // Load existing messages
    const existing = chatService.getMessages(gameId);
    setMessages(existing);

    // Subscribe to chat events
    const handleChatEvent = (event) => {
      if (event.type === GameEventTypes.GAME_MOVE) {
        // Add system message for moves
        const moveMsg = chatService.addSystemMessage(
          gameId,
          `${event.data.playerName || 'Player'} made a move`
        );
        setMessages(prev => [...prev, moveMsg]);
      } else if (event.type === 'chat_message') {
        const newMsg = chatService.addMessage(gameId, event.data);
        setMessages(prev => [...prev, newMsg]);
        
        // Update unread count if minimized
        if (isMinimized && event.data.senderId !== currentUserId) {
          setUnreadCount(prev => prev + 1);
        }
      } else if (event.type === 'chat_reaction') {
        chatService.addReaction(
          gameId,
          event.data.messageId,
          event.data.emoji,
          event.data.userId
        );
        setMessages(prev => [...chatService.getMessages(gameId)]);
      }
    };

    webSocketService.subscribeToGame(gameId, handleChatEvent);

    return () => {
      webSocketService.unsubscribeFromGame(gameId);
    };
  }, [gameId, currentUserId, isMinimized]);

  /**
   * Auto-scroll to bottom
   */
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  /**
   * Reset unread count when expanded
   */
  useEffect(() => {
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  /**
   * Send message
   */
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const messageData = {
      senderId: currentUserId,
      senderName: currentUserName,
      text: inputText.trim(),
      type: 'text',
    };

    // Add to local chat
    const newMsg = chatService.addMessage(gameId, messageData);
    setMessages(prev => [...prev, newMsg]);

    // Broadcast via WebSocket
    webSocketService.sendGameEvent('chat_message', {
      gameId,
      ...messageData,
    });

    setInputText('');
    inputRef.current?.focus();
  };

  /**
   * Send emoji
   */
  const handleSendEmoji = (emoji) => {
    const messageData = {
      senderId: currentUserId,
      senderName: currentUserName,
      text: emoji,
      type: 'emoji',
    };

    const newMsg = chatService.addMessage(gameId, messageData);
    setMessages(prev => [...prev, newMsg]);

    webSocketService.sendGameEvent('chat_message', {
      gameId,
      ...messageData,
    });

    setShowEmojiPicker(false);
  };

  /**
   * Add reaction to message
   */
  const handleReaction = (messageId, emoji) => {
    chatService.addReaction(gameId, messageId, emoji, currentUserId);
    setMessages([...chatService.getMessages(gameId)]);

    webSocketService.sendGameEvent('chat_reaction', {
      gameId,
      messageId,
      emoji,
      userId: currentUserId,
    });
  };

  /**
   * Format timestamp
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Minimized view
  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 p-4 bg-wa-teal hover:bg-teal-600 text-white rounded-full shadow-lg transition-colors"
      >
        <MessageCircle size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>
    );
  }

  // Expanded view
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed bottom-4 right-4 z-40 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-wa-teal" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            Game Chat
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({participants.length})
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Minus size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => chatService.clearChat(gameId)}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${
                msg.type === 'system' ? 'items-center' : 
                msg.senderId === currentUserId ? 'items-end' : 'items-start'
              }`}
            >
              {msg.type === 'system' ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {msg.text}
                </div>
              ) : (
                <div className={`max-w-[80%] ${msg.senderId === currentUserId ? 'bg-wa-teal text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'} rounded-lg p-2 shadow`}>
                  {msg.senderId !== currentUserId && (
                    <div className="text-xs font-semibold mb-1 opacity-70">
                      {msg.senderName}
                    </div>
                  )}
                  <div className={msg.type === 'emoji' ? 'text-2xl' : 'text-sm'}>
                    {msg.text}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {formatTime(msg.timestamp)}
                  </div>
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {msg.reactions.map((reaction, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full"
                        >
                          {reaction.emoji} {reaction.userIds.length}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {showEmojiPicker && (
          <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg grid grid-cols-8 gap-1">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendEmoji(emoji)}
                className="text-xl hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Smile size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wa-teal"
            maxLength={500}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="p-2 bg-wa-teal hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default GameChatPanel;
