/**
 * Firebase Data Migration Service
 * Seeds initial data from data.json to Firebase
 */

import authService from '../firebase/AuthService';
import chatFirebaseService from '../firebase/ChatFirebaseService';
import messageFirebaseService from '../firebase/MessageFirebaseService';
import statusFirebaseService from '../firebase/StatusFirebaseService';
import callFirebaseService from '../firebase/CallFirebaseService';
import { db } from '../../config/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

class MigrationService {
    constructor() {
        this.migrationLog = [];
    }

    log(message, type = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            message
        };
        this.migrationLog.push(logEntry);
        console.log(`[Migration ${type.toUpperCase()}]`, message);
    }

    /**
     * Seed initial data from data.json to Firebase
     */
    async seedDataToFirebase(data) {
        try {
            this.log('Starting Firebase data migration...');

            // 1. Create users
            await this.migrateUsers(data.users, data.currentUserId);

            // 2. Create chats
            await this.migrateChats(data.chats);

            // 3. Create messages
            await this.migrateMessages(data.messages);

            // 4. Create calls
            await this.migrateCalls(data.calls);

            // 5. Create status updates
            await this.migrateStatusUpdates(data.statusUpdates);

            // 6. Create channels (if any)
            if (data.channels) {
                await this.migrateChannels(data.channels);
            }

            // 7. Create game configs (if any)
            if (data.gameConfig) {
                await this.migrateGameConfig(data.gameConfig);
            }

            this.log('Migration completed successfully!', 'success');

            return {
                success: true,
                log: this.migrationLog
            };
        } catch (error) {
            this.log(`Migration failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Migrate users to Firestore
     */
    async migrateUsers(users, currentUserId) {
        this.log(`Migrating ${Object.keys(users).length} users...`);

        for (const [userId, userData] of Object.entries(users)) {
            try {
                const userRef = doc(db, 'users', userId);
                await setDoc(userRef, {
                    id: userId,
                    email: userData.email || `${userId}@whatsapp.clone`,
                    name: userData.name,
                    avatar: userData.avatar,
                    about: userData.about,
                    phone: userData.phone,
                    createdAt: serverTimestamp(),
                    lastSeen: serverTimestamp(),
                    isOnline: userId === currentUserId,
                    blockedUsers: [],
                    settings: this.getDefaultSettings()
                });

                this.log(`User migrated: ${userData.name} (${userId})`);
            } catch (error) {
                this.log(`Failed to migrate user ${userId}: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Get default user settings
     */
    getDefaultSettings() {
        return {
            appSettings: {
                theme: 'light',
                language: 'English',
                appColor: '#008069',
                logoEffect: 'none',
                notifications: {
                    enabled: true,
                    sound: true,
                    vibration: true,
                    preview: true
                }
            },
            chatSettings: {
                fontSize: 'medium',
                outgoingBubbleColor: '#D9FDD3',
                incomingBubbleColor: '#FFFFFF',
                chatListBackgroundImage: null,
                contactInfoBackgroundImage: null,
                translationLanguage: 'Spanish',
                enterToSend: false,
                mediaAutoDownload: {
                    photos: true,
                    videos: false,
                    documents: false
                }
            },
            securitySettings: {
                isAppLockEnabled: false,
                dailyLockPassword: '',
                chatLockPassword: '',
                fingerprintEnabled: false,
                autoLockTime: 300000
            },
            privacySettings: {
                lastSeen: 'everyone',
                profilePhoto: 'everyone',
                about: 'everyone',
                statusPrivacy: 'contacts',
                selectedContacts: [],
                readReceipts: true,
                blockedUsers: []
            }
        };
    }

    /**
     * Migrate chats to Firestore
     */
    async migrateChats(chats) {
        this.log(`Migrating ${chats.length} chats...`);

        for (const chat of chats) {
            try {
                const chatRef = doc(db, 'chats', chat.id);
                
                const chatData = {
                    id: chat.id,
                    type: chat.isGroup ? 'group' : 'individual',
                    participants: chat.isGroup 
                        ? chat.groupParticipants 
                        : ['me', chat.contactId],
                    createdBy: 'me',
                    createdAt: serverTimestamp(),
                    updatedAt: new Date(chat.timestamp),
                    lastMessage: null
                };

                if (chat.isGroup) {
                    chatData.groupName = chat.groupName;
                    chatData.groupAvatar = null;
                    chatData.groupDescription = '';
                    chatData.groupRoles = chat.groupRoles || {};
                    chatData.groupSettings = chat.groupSettings || {
                        editInfo: 'all',
                        sendMessages: 'all',
                        addMembers: 'all',
                        approveMembers: false
                    };
                }

                await setDoc(chatRef, chatData);

                // Create user settings for participants
                const participants = chat.isGroup ? chat.groupParticipants : ['me', chat.contactId];
                for (const participantId of participants) {
                    const settingsRef = doc(db, 'chats', chat.id, 'userSettings', participantId);
                    await setDoc(settingsRef, {
                        isPinned: chat.isPinned || false,
                        isMuted: chat.isMuted || false,
                        isArchived: chat.isArchived || false,
                        isLocked: chat.isLocked || false,
                        themeColor: chat.themeColor || null,
                        incomingThemeColor: chat.incomingThemeColor || null,
                        wallpaper: null,
                        hiddenDates: chat.hiddenDates || [],
                        unreadCount: participantId === 'me' ? (chat.unreadCount || 0) : 0,
                        createdAt: serverTimestamp()
                    });
                }

                this.log(`Chat migrated: ${chat.id} (${chat.isGroup ? 'Group' : 'Individual'})`);
            } catch (error) {
                this.log(`Failed to migrate chat ${chat.id}: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Migrate messages to Realtime Database
     */
    async migrateMessages(messages) {
        this.log(`Migrating messages for ${Object.keys(messages).length} chats...`);

        for (const [chatId, chatMessages] of Object.entries(messages)) {
            try {
                for (const message of chatMessages) {
                    await messageFirebaseService.sendMessage(chatId, {
                        senderId: message.senderId,
                        text: message.text,
                        type: message.type,
                        timestamp: new Date(message.timestamp).getTime(),
                        status: message.status || 'read',
                        mediaUrl: message.mediaUrl,
                        mediaUrls: message.mediaUrls,
                        duration: message.duration,
                        pollData: message.pollData,
                        replyToId: message.replyToId,
                        reactions: message.reactions,
                        isPinned: message.isPinned,
                        isStarred: message.isStarred,
                        isViewOnce: message.isViewOnce
                    });
                }

                this.log(`Messages migrated for chat: ${chatId} (${chatMessages.length} messages)`);
            } catch (error) {
                this.log(`Failed to migrate messages for chat ${chatId}: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Migrate calls to Firestore
     */
    async migrateCalls(calls) {
        this.log(`Migrating ${calls.length} calls...`);

        for (const call of calls) {
            try {
                await callFirebaseService.logCall({
                    userId: 'me',
                    contactId: call.contactId,
                    type: call.type,
                    direction: call.direction,
                    duration: call.duration,
                    status: call.duration ? 'completed' : 'missed'
                });

                this.log(`Call migrated: ${call.id}`);
            } catch (error) {
                this.log(`Failed to migrate call ${call.id}: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Migrate status updates to Firestore
     */
    async migrateStatusUpdates(statusUpdates) {
        this.log(`Migrating ${statusUpdates.length} status updates...`);

        for (const status of statusUpdates) {
            try {
                await statusFirebaseService.postStatus(status.userId, {
                    type: 'image',
                    mediaUrl: status.imageUrl,
                    caption: status.caption,
                    privacy: 'contacts'
                });

                this.log(`Status migrated: ${status.id} for user ${status.userId}`);
            } catch (error) {
                this.log(`Failed to migrate status ${status.id}: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Migrate channels to Firestore
     */
    async migrateChannels(channels) {
        this.log(`Migrating ${channels.length} channels...`);

        for (const channel of channels) {
            try {
                const channelRef = doc(db, 'channels', channel.id);
                await setDoc(channelRef, {
                    id: channel.id,
                    name: channel.name,
                    avatar: channel.avatar,
                    followers: parseInt(channel.followers.replace(/\D/g, '')) * 1000000 || 0,
                    isVerified: channel.isVerified,
                    createdAt: serverTimestamp()
                });

                this.log(`Channel migrated: ${channel.name}`);
            } catch (error) {
                this.log(`Failed to migrate channel ${channel.id}: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Migrate game config to Firestore
     */
    async migrateGameConfig(gameConfig) {
        this.log('Migrating game configurations...');

        try {
            const gameConfigRef = doc(db, 'gameConfigs', 'config');
            await setDoc(gameConfigRef, gameConfig);

            this.log('Game config migrated successfully');
        } catch (error) {
            this.log(`Failed to migrate game config: ${error.message}`, 'error');
        }
    }

    /**
     * Get migration log
     */
    getMigrationLog() {
        return this.migrationLog;
    }
}

// Export singleton instance
export const migrationService = new MigrationService();
export default migrationService;
