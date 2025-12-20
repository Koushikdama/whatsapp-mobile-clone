/**
 * ChatService - Manages in-game chat functionality
 * 
 * Features:
 * - Message storage and retrieval
 * - localStorage persistence
 * - Message filtering
 * - Auto-cleanup
 */

const CHAT_STORAGE_KEY = 'game_chats';
const MAX_MESSAGES_PER_GAME = 100;

class ChatService {
  constructor() {
    this.chats = new Map(); // gameId -> messages[]
    this._loadFromStorage();
  }

  /**
   * Load chats from localStorage
   */
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.chats = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('[ChatService] Load error:', error);
    }
  }

  /**
   * Save chats to localStorage
   */
  _saveToStorage() {
    try {
      const data = Object.fromEntries(this.chats);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[ChatService] Save error:', error);
    }
  }

  /**
   * Add message to game chat
   */
  addMessage(gameId, message) {
    if (!this.chats.has(gameId)) {
      this.chats.set(gameId, []);
    }

    const messages = this.chats.get(gameId);
    
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gameId,
      senderId: message.senderId,
      senderName: message.senderName,
      text: this._sanitize(message.text),
      type: message.type || 'text',
      timestamp: Date.now(),
      reactions: [],
      ...message,
    };

    messages.push(newMessage);

    // Limit messages
    if (messages.length > MAX_MESSAGES_PER_GAME) {
      messages.shift();
    }

    this.chats.set(gameId, messages);
    this._saveToStorage();

    return newMessage;
  }

  /**
   * Get messages for a game
   */
  getMessages(gameId, limit = MAX_MESSAGES_PER_GAME) {
    const messages = this.chats.get(gameId) || [];
    return messages.slice(-limit);
  }

  /**
   * Add reaction to message
   */
  addReaction(gameId, messageId, emoji, userId) {
    const messages = this.chats.get(gameId);
    if (!messages) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    if (!message.reactions) message.reactions = [];

    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    
    if (existingReaction) {
      if (!existingReaction.userIds.includes(userId)) {
        existingReaction.userIds.push(userId);
      }
    } else {
      message.reactions.push({ emoji, userIds: [userId] });
    }

    this._saveToStorage();
  }

  /**
   * Remove reaction from message
   */
  removeReaction(gameId, messageId, emoji, userId) {
    const messages = this.chats.get(gameId);
    if (!messages) return;

    const message = messages.find(m => m.id === messageId);
    if (!message || !message.reactions) return;

    const reaction = message.reactions.find(r => r.emoji === emoji);
    if (reaction) {
      reaction.userIds = reaction.userIds.filter(id => id !== userId);
      if (reaction.userIds.length === 0) {
        message.reactions = message.reactions.filter(r => r.emoji !== emoji);
      }
    }

    this._saveToStorage();
  }

  /**
   * Clear chat for a game
   */
  clearChat(gameId) {
    this.chats.delete(gameId);
    this._saveToStorage();
  }

  /**
   * Sanitize message text (basic XSS prevention)
   */
  _sanitize(text) {
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .slice(0, 500); // Max 500 chars
  }

  /**
   * Add system message
   */
  addSystemMessage(gameId, text) {
    return this.addMessage(gameId, {
      senderId: 'system',
      senderName: 'System',
      text,
      type: 'system',
    });
  }
}

// Singleton instance
export const chatService = new ChatService();
export default chatService;
