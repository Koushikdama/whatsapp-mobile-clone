/**
 * Message Service  
 * Manages messages using Firestore
 */

import { db } from '../../config/firebaseConfig';
import { 
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    writeBatch,
    increment
} from 'firebase/firestore';
import FirebaseService, { handleFirebaseError } from './FirebaseService';

class MessageFirebaseService extends FirebaseService {
    constructor() {
        super();
        this.messagesCollection = 'messages';
        this.chatsCollection = 'chats';
    }

    /**
     * Send a message
     */
    async sendMessage(chatId, messageData) {
        try {
            // Clean messageData - remove undefined properties
            const cleanMessageData = Object.fromEntries(
                Object.entries(messageData).filter(([_, value]) => value !== undefined)
            );

            const messageId = cleanMessageData.id || `m_${Date.now()}`;
            const messageRef = doc(db, this.messagesCollection, messageId);
            
            const message = {
                id: messageId,
                chatId,
                senderId: cleanMessageData.senderId,
                text: cleanMessageData.text || '',
                timestamp: cleanMessageData.timestamp || new Date().toISOString(),
                status: 'sent',
                type: cleanMessageData.type || 'text',
                ...cleanMessageData,
                createdAt: serverTimestamp()
            };

            await setDoc(messageRef, message);

            // Update chat's lastMessage - create chat if it doesn't exist
            const chatRef = doc(db, this.chatsCollection, chatId);
            const chatSnap = await getDoc(chatRef);

            if (chatSnap.exists()) {
                // Chat exists, just update it
                await updateDoc(chatRef, {
                    lastMessage: message.text,
                    lastMessageId: messageId,
                    updatedAt: serverTimestamp()
                });
            } else {
                console.log('Chat document does not exist, skipping lastMessage update');
                // Don't create the chat here - let the chat service handle chat creation
            }

            return {
                success: true,
                messageId,
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
            const messagesRef = collection(db, this.messagesCollection);
            const q = query(
                messagesRef,
                where('chatId', '==', chatId),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );
            
            const snapshot = await getDocs(q);
            
            const messages = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));

            // Reverse to get chronological order
            messages.reverse();

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
    async updateMessage(messageId, updates) {
        try {
            const messageRef = doc(db, this.messagesCollection, messageId);
            await updateDoc(messageRef, updates);

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Update message error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Delete message
     */
    async deleteMessage(messageId, deleteForEveryone = false) {
        try {
            const messageRef = doc(db, this.messagesCollection, messageId);
            
            if (deleteForEveryone) {
                // Mark as deleted
                await updateDoc(messageRef, {
                    isDeleted: true,
                    text: 'This message was deleted',
                    type: 'text',
                    mediaUrl: null,
                    pollData: null,
                    reactions: null
                });
            } else {
                // Remove completely
                await deleteDoc(messageRef);
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
    async deleteMessages(messageIds, deleteForEveryone = false) {
        try {
            const batch = writeBatch(db);
            
            for (const messageId of messageIds) {
                const messageRef = doc(db, this.messagesCollection, messageId);

                if (deleteForEveryone) {
                    batch.update(messageRef, {
                        isDeleted: true,
                        text: 'This message was deleted',
                        type: 'text',
                        mediaUrl: null
                    });
                } else {
                    batch.delete(messageRef);
                }
            }

            await batch.commit();

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Delete messages error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update message status (sent/delivered/read)
     */
    async updateMessageStatus(messageId, status) {
        try {
            const messageRef = doc(db, this.messagesCollection, messageId);
            await updateDoc(messageRef, { status });

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Update status error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Add reaction to message
     */
    async addReaction(messageId, userId, emoji) {
        try {
            const messageRef = doc(db, this.messagesCollection, messageId);
            const messageSnap = await getDoc(messageRef);

            if (messageSnap.exists()) {
                const reactions = messageSnap.data().reactions || {};
                reactions[userId] = emoji;
                await updateDoc(messageRef, { reactions });
            }

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Add reaction error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Remove reaction from message
     */
    async removeReaction(messageId, userId) {
        try {
            const messageRef = doc(db, this.messagesCollection, messageId);
            const messageSnap = await getDoc(messageRef);

            if (messageSnap.exists()) {
                const reactions = messageSnap.data().reactions || {};
                delete reactions[userId];
                await updateDoc(messageRef, { reactions });
            }

            return { success: true };
        } catch (error) {
            console.error('[MessageService] Remove reaction error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Edit message
     */
    async editMessage(messageId, newText) {
        try {
            const messageRef = doc(db, this.messagesCollection, messageId);
            await updateDoc(messageRef, {
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
     * Subscribe to messages real-time
     */
    subscribeToMessages(chatId, callback, onError) {
        const messagesRef = collection(db, this.messagesCollection);
        const q = query(
            messagesRef,
            where('chatId', '==', chatId),
            orderBy('timestamp', 'asc')
        );
        
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const messages = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                }));
                callback(messages);
            },
            (error) => {
                console.error('[MessageService] Messages subscription error:', error);
                if (onError) onError(handleFirebaseError(error));
            }
        );

        this.listeners.set(`messages:${chatId}`, unsubscribe);

        return unsubscribe;
    }
}

// Export singleton instance
export const messageFirebaseService = new MessageFirebaseService();
export default messageFirebaseService;
