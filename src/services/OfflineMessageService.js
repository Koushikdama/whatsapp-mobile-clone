/**
 * Offline Message Service
 * Manages message queue for offline messaging using IndexedDB
 * 
 * Features:
 * - Queue messages when offline
 * - Persist queue in IndexedDB
 * - Auto-sync when connection restored
 * - Retry logic for failed sends
 */

const DB_NAME = 'WhatsAppOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'messageQueue';

class OfflineMessageService {
    constructor() {
        this.db = null;
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.listeners = new Set();
        this.initDB();
        this.setupConnectionListeners();
    }

    /**
     * Initialize IndexedDB
     */
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('[OfflineService] IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ [OfflineService] IndexedDB initialized');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // Create indexes
                    objectStore.createIndex('chatId', 'chatId', { unique: false });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('status', 'status', { unique: false });
                    
                    console.log('✅ [OfflineService] Object store created');
                }
            };
        });
    }

    /**
     * Setup online/offline event listeners
     */
    setupConnectionListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 [OfflineService] Connection restored');
            this.isOnline = true;
            this.notifyListeners({ type: 'online' });
            this.syncQueue();
        });

        window.addEventListener('offline', () => {
            console.log('📴 [OfflineService] Connection lost');
            this.isOnline = false;
            this.notifyListeners({ type: 'offline' });
        });
    }

    /**
     * Subscribe to connection status changes
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners
     */
    notifyListeners(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('[OfflineService] Listener error:', error);
            }
        });
    }

    /**
     * Queue a message for later sending
     */
    async queueMessage(chatId, messageData) {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const queuedMessage = {
                chatId,
                messageData: {
                    ...messageData,
                    queuedAt: Date.now(),
                    status: 'queued'
                },
                timestamp: Date.now(),
                status: 'pending',
                retryCount: 0,
                maxRetries: 3
            };

            const request = store.add(queuedMessage);

            request.onsuccess = () => {
                const messageId = request.result;
                console.log(`📦 [OfflineService] Message queued: ${messageId}`);
                this.notifyListeners({ 
                    type: 'messageQueued', 
                    chatId, 
                    messageId 
                });
                resolve({ success: true, queueId: messageId });
            };

            request.onerror = () => {
                console.error('[OfflineService] Queue error:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all queued messages
     */
    async getQueuedMessages(chatId = null) {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            
            let request;
            
            if (chatId) {
                const index = store.index('chatId');
                request = index.getAll(chatId);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => {
                const messages = request.result.filter(msg => msg.status === 'pending');
                resolve(messages);
            };

            request.onerror = () => {
                console.error('[OfflineService] Get messages error:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get count of queued messages
     */
    async getQueueCount(chatId = null) {
        const messages = await this.getQueuedMessages(chatId);
        return messages.length;
    }

    /**
     * Remove message from queue
     */
    async removeFromQueue(queueId) {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(queueId);

            request.onsuccess = () => {
                console.log(`✅ [OfflineService] Message removed from queue: ${queueId}`);
                this.notifyListeners({ type: 'messageRemoved', queueId });
                resolve({ success: true });
            };

            request.onerror = () => {
                console.error('[OfflineService] Remove error:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Update message status in queue
     */
    async updateQueuedMessage(queueId, updates) {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(queueId);

            getRequest.onsuccess = () => {
                const message = getRequest.result;
                if (!message) {
                    reject(new Error('Message not found'));
                    return;
                }

                const updatedMessage = { ...message, ...updates };
                const putRequest = store.put(updatedMessage);

                putRequest.onsuccess = () => {
                    resolve({ success: true });
                };

                putRequest.onerror = () => {
                    reject(putRequest.error);
                };
            };

            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    }

    /**
     * Sync all queued messages
     */
    async syncQueue(messageService = null) {
        if (!this.isOnline) {
            console.log('📴 [OfflineService] Cannot sync - offline');
            return { success: false, reason: 'offline' };
        }

        if (this.syncInProgress) {
            console.log('⏳ [OfflineService] Sync already in progress');
            return { success: false, reason: 'sync_in_progress' };
        }

        this.syncInProgress = true;
        this.notifyListeners({ type: 'syncStarted' });

        try {
            const queuedMessages = await this.getQueuedMessages();
            
            if (queuedMessages.length === 0) {
                console.log('✅ [OfflineService] No messages to sync');
                this.syncInProgress = false;
                return { success: true, synced: 0 };
            }

            console.log(`📤 [OfflineService] Syncing ${queuedMessages.length} messages...`);

            let successCount = 0;
            let failedCount = 0;

            for (const queuedMsg of queuedMessages) {
                try {
                    // Import dynamically to avoid circular dependency
                    if (!messageService) {
                        const { messageFirebaseService } = await import('./firebase/MessageFirebaseService');
                        messageService = messageFirebaseService;
                    }

                    // Send the message
                    const result = await messageService.sendMessage(
                        queuedMsg.chatId,
                        queuedMsg.messageData
                    );

                    if (result.success) {
                        // Remove from queue
                        await this.removeFromQueue(queuedMsg.id);
                        successCount++;
                        
                        this.notifyListeners({ 
                            type: 'messageSynced', 
                            chatId: queuedMsg.chatId,
                            queueId: queuedMsg.id,
                            messageId: result.messageId
                        });
                    } else {
                        throw new Error('Send failed');
                    }
                } catch (error) {
                    console.error(`❌ [OfflineService] Failed to send message ${queuedMsg.id}:`, error);
                    
                    // Increment retry count
                    const newRetryCount = (queuedMsg.retryCount || 0) + 1;
                    
                    if (newRetryCount >= queuedMsg.maxRetries) {
                        // Max retries reached, mark as failed
                        await this.updateQueuedMessage(queuedMsg.id, { 
                            status: 'failed',
                            retryCount: newRetryCount,
                            lastError: error.message
                        });
                        failedCount++;
                        
                        this.notifyListeners({ 
                            type: 'messageFailed', 
                            chatId: queuedMsg.chatId,
                            queueId: queuedMsg.id
                        });
                    } else {
                        // Retry later
                        await this.updateQueuedMessage(queuedMsg.id, { 
                            retryCount: newRetryCount,
                            lastError: error.message
                        });
                        failedCount++;
                    }
                }
            }

            console.log(`✅ [OfflineService] Sync complete - Success: ${successCount}, Failed: ${failedCount}`);
            
            this.notifyListeners({ 
                type: 'syncCompleted', 
                successCount, 
                failedCount 
            });

            return { 
                success: true, 
                synced: successCount, 
                failed: failedCount 
            };
        } catch (error) {
            console.error('[OfflineService] Sync error:', error);
            this.notifyListeners({ type: 'syncError', error });
            return { success: false, error };
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Clear all queued messages for a chat
     */
    async clearChatQueue(chatId) {
        if (!this.db) {
            await this.initDB();
        }

        const messages = await this.getQueuedMessages(chatId);
        
        for (const msg of messages) {
            await this.removeFromQueue(msg.id);
        }

        return { success: true, cleared: messages.length };
    }

    /**
     * Clear entire queue
     */
    async clearAllQueues() {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('✅ [OfflineService] All queues cleared');
                this.notifyListeners({ type: 'allQueuesCleared' });
                resolve({ success: true });
            };

            request.onerror = () => {
                console.error('[OfflineService] Clear error:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Check if currently online
     */
    getOnlineStatus() {
        return this.isOnline;
    }
}

// Export singleton instance
export const offlineMessageService = new OfflineMessageService();
export default offlineMessageService;
