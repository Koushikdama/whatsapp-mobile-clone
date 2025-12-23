/**
 * Chat Service
 * Manages chats (individual and group) in Firestore
 */

import { db } from '../../config/firebaseConfig';
import notificationFirebaseService, { NOTIFICATION_TYPES } from './NotificationFirebaseService';
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
                settings: {
                    showHistoryToNewMembers: true  // Default: new members see history
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

            // Send notifications to all participants (except the creator)
            console.log(`📬 Sending notifications to ${participantIds.length} members...`);
            const notificationPromises = participantIds.map(async (participantId) => {
                try {
                    await notificationFirebaseService.createNotification(
                        participantId,                      // Receiver
                        userId,                             // Creator (actor)
                        NOTIFICATION_TYPES.ADDED_TO_GROUP,
                        {
                            groupId: chatId,
                            groupName: groupName,
                            groupAvatar: groupData.groupAvatar || null
                        }
                    );
                    console.log(`✅ Notification sent to ${participantId}`);
                } catch (error) {
                    console.error(`❌ Failed to send notification to ${participantId}:`, error);
                    // Don't fail the whole group creation if notification fails
                }
            });

            await Promise.all(notificationPromises);
            console.log(`🎉 Group created successfully with ${participantIds.length} notifications sent`);

            // Add system message to group chat showing who created it and who was added
            try {
                const { default: messageFirebaseService } = await import('./MessageFirebaseService');

                // Get creator's name from Firebase or use ID as fallback
                let creatorName = 'Someone';
                try {
                    const { default: userService } = await import('./UserService');
                    const creatorResult = await userService.getUser(userId);
                    if (creatorResult.success && creatorResult.user) {
                        creatorName = creatorResult.user.name || creatorName;
                    }
                } catch (error) {
                    console.warn('Could not fetch creator name:', error);
                }

                // Create system message
                const systemMessageContent = participantIds.length === 1
                    ? `${creatorName} added you`
                    : `${creatorName} created this group`;

                await messageFirebaseService.sendMessage(chatId, {
                    senderId: 'system',
                    text: systemMessageContent,
                    type: 'system'
                });

                console.log('✅ System message added to group chat');
            } catch (error) {
                console.error('❌ Failed to add system message:', error);
                // Don't fail group creation if system message fails
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
            // Removed orderBy to avoid requiring composite index
            // Sorting will be done in JavaScript instead
            const q = query(
                chatsRef,
                where('participants', 'array-contains', userId),
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

            // Sort by updatedAt in JavaScript instead of Firestore
            chats.sort((a, b) => {
                const aTime = a.updatedAt?.toMillis?.() || 0;
                const bTime = b.updatedAt?.toMillis?.() || 0;
                return bTime - aTime; // Descending order (newest first)
            });

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
     * Subscribe to real-time chat updates for a user
     * Returns an unsubscribe function
     */
    subscribeToUserChats(userId, callback) {
        try {
            const { onSnapshot } = require('firebase/firestore');

            const chatsRef = collection(db, this.collectionName);
            const q = query(
                chatsRef,
                where('participants', 'array-contains', userId)
            );

            console.log('🔔 Setting up real-time chat listener for user:', userId);

            const unsubscribe = onSnapshot(q, async (snapshot) => {
                console.log('📡 Received chat update:', snapshot.docs.length, 'chats');

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

                // Sort by updatedAt
                chats.sort((a, b) => {
                    const aTime = a.updatedAt?.toMillis?.() || 0;
                    const bTime = b.updatedAt?.toMillis?.() || 0;
                    return bTime - aTime;
                });

                callback(chats);
            }, (error) => {
                console.error('❌ Chat listener error:', error);
            });

            return unsubscribe;
        } catch (error) {
            console.error('[ChatService] Subscribe to chats error:', error);
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
     * Create or get direct chat between two users
     * This is a convenience method that checks if chat exists first
     */
    async createDirectChat(userId1, userId2) {
        try {
            console.log(`📱 Creating/finding direct chat between ${userId1} and ${userId2}`);

            // Try to find existing chat
            const existingChat = await this.findChatByParticipants([userId1, userId2]);

            if (existingChat) {
                console.log(`✅ Found existing chat: ${existingChat.id}`);
                return {
                    success: true,
                    chatId: existingChat.id,
                    chat: existingChat,
                    isNew: false
                };
            }

            // Create new chat
            console.log('📝 Creating new chat...');
            const result = await this.createIndividualChat(userId1, userId2);

            return {
                ...result,
                isNew: true
            };
        } catch (error) {
            console.error('[ChatService] Create direct chat error:', error);
            throw handleFirebaseError(error);
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
     * Update group info (name, avatar, description)
     * Only allows updating specific group-related fields
     */
    async updateGroupInfo(chatId, updates) {
        try {
            console.log('🔵 Updating group info:', chatId, updates);

            // Only allow specific fields to be updated
            const allowedFields = ['groupName', 'groupAvatar', 'groupDescription'];
            const filteredUpdates = Object.keys(updates)
                .filter(key => allowedFields.includes(key))
                .reduce((obj, key) => {
                    obj[key] = updates[key];
                    return obj;
                }, {});

            if (Object.keys(filteredUpdates).length === 0) {
                console.warn('⚠️ No valid fields to update');
                return { success: false, error: 'No valid fields to update' };
            }

            const chatRef = doc(db, this.collectionName, chatId);
            await updateDoc(chatRef, {
                ...filteredUpdates,
                updatedAt: serverTimestamp()
            });

            console.log('✅ Group info updated successfully');
            return { success: true };
        } catch (error) {
            console.error('[ChatService] Update group info error:', error);
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
            await setDoc(settingsRef, settings, { merge: true });

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
