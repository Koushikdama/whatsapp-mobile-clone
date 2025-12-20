/**
 * Chat Service
 * Manages chats (individual and group) in Firestore
 */

import { db } from '../../config/firebaseConfig';
import {
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    serverTimestamp,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import FirebaseService, { handleFirebaseError } from './FirebaseService';

class ChatFirebaseService extends FirebaseService {
    constructor() {
        super();
        this.collectionName = 'chats';
    }

    /**
     * Create individual chat
     */
    async createIndividualChat(userId, contactId) {
        try {
            // Check if chat already exists
            const existingChat = await this.findChatByParticipants([userId, contactId]);
            if (existingChat) {
                return {
                    success: true,
                    chatId: existingChat.id,
                    chat: existingChat
                };
            }

            const chatId = `chat_${Date.now()}_${userId}_${contactId}`;
            const chatRef = doc(db, this.collectionName, chatId);

            const chatData = {
                id: chatId,
                type: 'individual',
                participants: [userId, contactId],
                createdBy: userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastMessage: null
            };

            await setDoc(chatRef, chatData);

            // Create user-specific settings for both participants
            await this.createUserChatSettings(chatId, userId);
            await this.createUserChatSettings(chatId, contactId);

            return {
                success: true,
                chatId,
                chat: chatData
            };
        } catch (error) {
            console.error('[ChatService] Create individual chat error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Create group chat
     */
    async createGroupChat(userId, groupName, participantIds, groupData = {}) {
        try {
            const chatId = `group_${Date.now()}_${userId}`;
            const chatRef = doc(db, this.collectionName, chatId);

            const allParticipants = [userId, ...participantIds];
            const groupRoles = { [userId]: 'owner' };
            participantIds.forEach(id => (groupRoles[id] = 'member'));

            const chatData = {
                id: chatId,
                type: 'group',
                participants: allParticipants,
                groupName: groupName,
                groupAvatar: groupData.groupAvatar || null,
                groupDescription: groupData.groupDescription || '',
                groupRoles,
                groupSettings: {
                    editInfo: 'all',
                    sendMessages: 'all',
                    addMembers: 'all',
                    approveMembers: false
                },
                createdBy: userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastMessage: null
            };

            await setDoc(chatRef, chatData);

            // Create user-specific settings for all participants
            for (const participantId of allParticipants) {
                await this.createUserChatSettings(chatId, participantId);
            }

            return {
                success: true,
                chatId,
                chat: chatData
            };
        } catch (error) {
            console.error('[ChatService] Create group chat error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Create user-specific chat settings
     */
    async createUserChatSettings(chatId, userId) {
        try {
            const settingsRef = doc(db, this.collectionName, chatId, 'userSettings', userId);
            await setDoc(settingsRef, {
                isPinned: false,
                isMuted: false,
                isArchived: false,
                isLocked: false,
                themeColor: null,
                incomingThemeColor: null,
                wallpaper: null,
                hiddenDates: [],
                unreadCount: 0,
                createdAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('[ChatService] Create user chat settings error:', error);
            // Don't throw, this is not critical
            return { success: false };
        }
    }

    /**
     * Get user's chats
     */
    async getUserChats(userId, limitCount = 50) {
        try {
            const chatsRef = collection(db, this.collectionName);
            const q = query(
                chatsRef,
                where('participants', 'array-contains', userId),
                orderBy('updatedAt', 'desc'),
                firestoreLimit(limitCount)
            );

            const snapshot = await getDocs(q);
            const chats = [];

            for (const chatDoc of snapshot.docs) {
                const chatData = { id: chatDoc.id, ...chatDoc.data() };
                
                // Get user-specific settings
                const settingsRef = doc(db, this.collectionName, chatDoc.id, 'userSettings', userId);
                const settingsSnap = await getDoc(settingsRef);
                
                if (settingsSnap.exists()) {
                    chatData.userSettings = settingsSnap.data();
                }

                chats.push(chatData);
            }

            return {
                success: true,
                chats
            };
        } catch (error) {
            console.error('[ChatService] Get user chats error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get chat by ID
     */
    async getChat(chatId, userId = null) {
        try {
            const chatRef = doc(db, this.collectionName, chatId);
            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) {
                return { success: false, error: 'Chat not found' };
            }

            const chatData = { id: chatSnap.id, ...chatSnap.data() };

            // Get user-specific settings if userId provided
            if (userId) {
                const settingsRef = doc(db, this.collectionName, chatId, 'userSettings', userId);
                const settingsSnap = await getDoc(settingsRef);
                
                if (settingsSnap.exists()) {
                    chatData.userSettings = settingsSnap.data();
                }
            }

            return {
                success: true,
                chat: chatData
            };
        } catch (error) {
            console.error('[ChatService] Get chat error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Find chat by participants (for individual chats)
     */
    async findChatByParticipants(participantIds) {
        try {
            if (participantIds.length !== 2) return null;

            const chatsRef = collection(db, this.collectionName);
            const q = query(
                chatsRef,
                where('type', '==', 'individual'),
                where('participants', 'array-contains', participantIds[0])
            );

            const snapshot = await getDocs(q);
            
            for (const chatDoc of snapshot.docs) {
                const chat = chatDoc.data();
                if (chat.participants.includes(participantIds[1])) {
                    return { id: chatDoc.id, ...chat };
                }
            }

            return null;
        } catch (error) {
            console.error('[ChatService] Find chat error:', error);
            return null;
        }
    }

    /**
     * Update chat (for group info updates)
     */
    async updateChat(chatId, updates) {
        try {
            const chatRef = doc(db, this.collectionName, chatId);
            await updateDoc(chatRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('[ChatService] Update chat error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update last message
     */
    async updateLastMessage(chatId, lastMessage) {
        try {
            const chatRef = doc(db, this.collectionName, chatId);
            await updateDoc(chatRef, {
                lastMessage,
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('[ChatService] Update last message error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update user chat settings
     */
    async updateUserChatSettings(chatId, userId, settings) {
        try {
            const settingsRef = doc(db, this.collectionName, chatId, 'userSettings', userId);
            await updateDoc(settingsRef, settings);

            return { success: true };
        } catch (error) {
            console.error('[ChatService] Update user chat settings error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Pin/unpin chat
     */
    async togglePinChat(chatId, userId) {
        try {
            const settingsRef = doc(db, this.collectionName, chatId, 'userSettings', userId);
            const settingsSnap = await getDoc(settingsRef);
            
            if (settingsSnap.exists()) {
                const currentPinned = settingsSnap.data().isPinned || false;
                await updateDoc(settingsRef, { isPinned: !currentPinned });
            }

            return { success: true };
        } catch (error) {
            console.error('[ChatService] Toggle pin error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Archive/unarchive chat
     */
    async toggleArchiveChat(chatId, userId) {
        try {
            const settingsRef = doc(db, this.collectionName, chatId, 'userSettings', userId);
            const settingsSnap = await getDoc(settingsRef);
            
            if (settingsSnap.exists()) {
                const currentArchived = settingsSnap.data().isArchived || false;
                await updateDoc(settingsRef, { isArchived: !currentArchived });
            }

            return { success: true };
        } catch (error) {
            console.error('[ChatService] Toggle archive error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Add participants to group
     */
    async addParticipants(chatId, participantIds) {
        try {
            const chatRef = doc(db, this.collectionName, chatId);
            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists() || chatSnap.data().type !== 'group') {
                throw new Error('Group chat not found');
            }

            await updateDoc(chatRef, {
                participants: arrayUnion(...participantIds),
                updatedAt: serverTimestamp()
            });

            // Create user settings for new participants
            for (const participantId of participantIds) {
                await this.createUserChatSettings(chatId, participantId);
                
                // Set role as member
                await updateDoc(chatRef, {
                    [`groupRoles.${participantId}`]: 'member'
                });
            }

            return { success: true };
        } catch (error) {
            console.error('[ChatService] Add participants error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Remove participant from group
     */
    async removeParticipant(chatId, participantId) {
        try {
            const chatRef = doc(db, this.collectionName, chatId);
            await updateDoc(chatRef, {
                participants: arrayRemove(participantId),
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('[ChatService] Remove participant error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update group role
     */
    async updateGroupRole(chatId, userId, role) {
        try {
            const chatRef = doc(db, this.collectionName, chatId);
            await updateDoc(chatRef, {
                [`groupRoles.${userId}`]: role,
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('[ChatService] Update group role error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Delete chat
     */
    async deleteChat(chatId) {
        try {
            const chatRef = doc(db, this.collectionName, chatId);
            await deleteDoc(chatRef);

            return { success: true };
        } catch (error) {
            console.error('[ChatService] Delete chat error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Subscribe to user's chats
     */
    subscribeToUserChats(userId, callback, onError) {
        const queryConstraints = [
            where('participants', 'array-contains', userId),
            orderBy('updatedAt', 'desc')
        ];

        return this.subscribeToCollection(this.collectionName, queryConstraints, callback, onError);
    }

    /**
     * Subscribe to specific chat
     */
    subscribeToChat(chatId, callback, onError) {
        return this.subscribeToDocument(this.collectionName, chatId, callback, onError);
    }
}

// Export singleton instance
export const chatFirebaseService = new ChatFirebaseService();
export default chatFirebaseService;
