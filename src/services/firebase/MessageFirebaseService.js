/**
 * Message Service  
 * Manages messages using Firebase Realtime Database for real-time performance
 */

import { realtimeDb } from '../../config/firebaseConfig';
import { 
    ref, 
    get, 
    set, 
    update, 
    remove, 
    push, 
    onValue, 
    off,
    query,
    orderByChild,
    limitToLast,
    serverTimestamp as realtimeServerTimestamp
} from 'firebase/database';
import FirebaseService, { handleFirebaseError } from './FirebaseService';

class MessageFirebaseService extends FirebaseService {
    constructor() {
        super();
        this.messagesPath = 'messages';
        this.typingPath = 'typing';
    }

    /**
     * Send a message
     */
    async sendMessage(chatId, messageData) {
        try {
            const messagesRef = ref(realtimeDb, `${this.messagesPath}/${chatId}`);
            const newMessageRef = push(messagesRef);
            
            const message = {
                id: newMessageRef.key,
                chatId,
                senderId: messageData.senderId,
                text: messageData.text || '',
                timestamp: Date.now(),
                status: 'sent',
                type: messageData.type || 'text',
                ...messageData
            };

            await set(newMessageRef, message);

            return {
                success: true,
                messageId: newMessageRef.key,
                message
            };
        } catch (error) {
            console.error('[MessageService] Send message error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get messages for a chat
     */
    async getMessages(chatId, limitCount = 50) {
        try {
            const messagesRef = ref(realtimeDb, `${this.messagesPath}/${chatId}`);
            const messagesQuery = query(messagesRef, limitToLast(limitCount));
            
            const snapshot = await get(messagesQuery);
            
            if (!snapshot.exists()) {
                return {
                    success: true,
                    messages: []
                };
            }

            const messagesObj = snapshot.val();
            const messages = Object.keys(messagesObj).map(key => ({
                ...messagesObj[key],
                id: key
            }));

            // Sort by timestamp
            messages.sort((a, b) => a.timestamp - b.timestamp);

            return {
                success: true,
                messages
            };
        } catch (error) {
            console.error('[MessageService] Get messages error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update message
     */
    async updateMessage(chatId, messageId, updates) {
        try {
            const messageRef = ref(realtimeDb, `${this.messagesPath}/${chatId}/${messageId}`);
            await update(messageRef, updates);

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Update message error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Delete message
     */
    async deleteMessage(chatId, messageId, deleteForEveryone = false) {
        try {
            const messageRef = ref(realtimeDb, `${this.messagesPath}/${chatId}/${messageId}`);
            
            if (deleteForEveryone) {
                // Mark as deleted
                await update(messageRef, {
                    isDeleted: true,
                    text: 'This message was deleted',
                    type: 'text',
                    mediaUrl: null,
                    pollData: null,
                    reactions: null
                });
            } else {
                // Remove completely
                await remove(messageRef);
            }

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Delete message error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Delete multiple messages
     */
    async deleteMessages(chatId, messageIds, deleteForEveryone = false) {
        try {
            const updates = {};
            
            for (const messageId of messageIds) {
                if (deleteForEveryone) {
                    updates[`${this.messagesPath}/${chatId}/${messageId}/isDeleted`] = true;
                    updates[`${this.messagesPath}/${chatId}/${messageId}/text`] = 'This message was deleted';
                    updates[`${this.messagesPath}/${chatId}/${messageId}/type`] = 'text';
                    updates[`${this.messagesPath}/${chatId}/${messageId}/mediaUrl`] = null;
                } else {
                    updates[`${this.messagesPath}/${chatId}/${messageId}`] = null;
                }
            }

            await update(ref(realtimeDb), updates);

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Delete messages error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update message status (sent/delivered/read)
     */
    async updateMessageStatus(chatId, messageId, status) {
        try {
            const messageRef = ref(realtimeDb, `${this.messagesPath}/${chatId}/${messageId}`);
            await update(messageRef, { status });

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Update status error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Add reaction to message
     */
    async addReaction(chatId, messageId, userId, emoji) {
        try {
            const reactionRef = ref(realtimeDb, `${this.messagesPath}/${chatId}/${messageId}/reactions/${userId}`);
            await set(reactionRef, emoji);

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Add reaction error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Remove reaction from message
     */
    async removeReaction(chatId, messageId, userId) {
        try {
            const reactionRef = ref(realtimeDb, `${this.messagesPath}/${chatId}/${messageId}/reactions/${userId}`);
            await remove(reactionRef);

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Remove reaction error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Pin/unpin message
     */
    async togglePinMessage(chatId, messageId) {
        try {
            const messageRef = ref(realtimeDb, `${this.messagesPath}/${chatId}/${messageId}`);
            const snapshot = await get(messageRef);
            
            if (snapshot.exists()) {
                const message = snapshot.val();
                await update(messageRef, { isPinned: !message.isPinned });
            }

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Toggle pin error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Star/unstar message
     */
    async toggleStarMessage(chatId, messageId) {
        try {
            const messageRef = ref(realtimeDb, `${this.messagesPath}/${chatId}/${messageId}`);
            const snapshot = await get(messageRef);
            
            if (snapshot.exists()) {
                const message = snapshot.val();
                await update(messageRef, { isStarred: !message.isStarred });
            }

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Toggle star error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Edit message
     */
    async editMessage(chatId, messageId, newText) {
        try {
            const messageRef = ref(realtimeDb, `${this.messagesPath}/${chatId}/${messageId}`);
            await update(messageRef, {
                text: newText,
                isEdited: true,
                editedAt: Date.now()
            });

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Edit message error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Vote on poll
     */
    async votePoll(chatId, messageId, optionIds, userId) {
        try {
            const messageRef = ref(realtimeDb, `${this.messagesPath}/${chatId}/${messageId}`);
            const snapshot = await get(messageRef);
            
            if (!snapshot.exists()) {
                throw new Error('Message not found');
            }

            const message = snapshot.val();
            if (!message.pollData) {
                throw new Error('Not a poll message');
            }

            const updatedOptions = message.pollData.options.map(option => {
                const voters = option.voters || [];
                const hasVoted = optionIds.includes(option.id);
                
                if (hasVoted && !voters.includes(userId)) {
                    voters.push(userId);
                } else if (!hasVoted && voters.includes(userId)) {
                    const index = voters.indexOf(userId);
                    voters.splice(index, 1);
                }

                return { ...option, voters };
            });

            await update(messageRef, {
                'pollData/options': updatedOptions
            });

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Vote poll error:', error);
            throw handleFirebaseError(error);
        }
    }

   

/**
     * Set typing indicator
     */
    async setTyping(chatId, userId, isTyping) {
        try {
            const typingRef = ref(realtimeDb, `${this.typingPath}/${chatId}/${userId}`);
            
            if (isTyping) {
                await set(typingRef, Date.now());
            } else {
                await remove(typingRef);
            }

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Set typing error:', error);
            // Don't throw for typing indicators
            return { success: false };
        }
    }

    /**
     * Subscribe to messages real-time
     */
    subscribeToMessages(chatId, callback, onError) {
        const messagesRef = ref(realtimeDb, `${this.messagesPath}/${chatId}`);
        
        const handleValue = (snapshot) => {
            if (snapshot.exists()) {
                const messagesObj = snapshot.val();
                const messages = Object.keys(messagesObj).map(key => ({
                    ...messagesObj[key],
                    id: key
                }));
                
                // Sort by timestamp
                messages.sort((a, b) => a.timestamp - b.timestamp);
                
                callback(messages);
            } else {
                callback([]);
            }
        };

        const handleError = (error) => {
            console.error('[MessageService] Messages subscription error:', error);
            if (onError) onError(handleFirebaseError(error));
        };

        onValue(messagesRef, handleValue, handleError);

        const unsubscribe = () => off(messagesRef, 'value', handleValue);
        this.listeners.set(`messages:${chatId}`, unsubscribe);
        
        return unsubscribe;
    }

    /**
     * Subscribe to typing indicators
     */
    subscribeToTyping(chatId, callback, onError) {
        const typingRef = ref(realtimeDb, `${this.typingPath}/${chatId}`);
        
        const handleValue = (snapshot) => {
            if (snapshot.exists()) {
                const typingData = snapshot.val();
                const typingUsers = Object.keys(typingData).map(userId => ({
                    userId,
                    timestamp: typingData[userId]
                }));
                
                // Filter out old typing indicators (>5 seconds)
                const now = Date.now();
                const activeTyping = typingUsers.filter(t => now - t.timestamp < 5000);
                
                callback(activeTyping.map(t => t.userId));
            } else {
                callback([]);
            }
        };

        const handleError = (error) => {
            console.error('[MessageService] Typing subscription error:', error);
            if (onError) onError(handleFirebaseError(error));
        };

        onValue(typingRef, handleValue, handleError);

        const unsubscribe = () => off(typingRef, 'value', handleValue);
        this.listeners.set(`typing:${chatId}`, unsubscribe);
        
        return unsubscribe;
    }
}

// Export singleton instance
export const messageFirebaseService = new MessageFirebaseService();
export default messageFirebaseService;
