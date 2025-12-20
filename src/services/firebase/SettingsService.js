/**
 * Settings Service
 * Manages user settings in Firestore (app, chat, security, privacy settings)
 */

import { db } from '../../config/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import FirebaseService, { handleFirebaseError } from './FirebaseService';

class SettingsService extends FirebaseService {
    constructor() {
        super();
        this.collectionName = 'users';
    }

    /**
     * Get all user settings
     */
    async getAllSettings(userId) {
        try {
            const userRef = doc(db, this.collectionName, userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                return {
                    success: true,
                    settings: userData.settings || {}
                };
            } else {
                return {
                    success: false,
                    error: 'User not found'
                };
            }
        } catch (error) {
            console.error('[SettingsService] Get settings error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update app settings
     */
    async updateAppSettings(userId, appSettings) {
        try {
            const userRef = doc(db, this.collectionName, userId);
            await updateDoc(userRef, {
                'settings.appSettings': {
                    ...appSettings,
                    updatedAt: serverTimestamp()
                }
            });

            return { success: true };
        } catch (error) {
            console.error('[SettingsService] Update app settings error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update chat settings
     */
    async updateChatSettings(userId, chatSettings) {
        try {
            const userRef = doc(db, this.collectionName, userId);
            await updateDoc(userRef, {
                'settings.chatSettings': {
                    ...chatSettings,
                    updatedAt: serverTimestamp()
                }
            });

            return { success: true };
        } catch (error) {
            console.error('[SettingsService] Update chat settings error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update security settings
     */
    async updateSecuritySettings(userId, securitySettings) {
        try {
            const userRef = doc(db, this.collectionName, userId);
            await updateDoc(userRef, {
                'settings.securitySettings': {
                    ...securitySettings,
                    updatedAt: serverTimestamp()
                }
            });

            return { success: true };
        } catch (error) {
            console.error('[SettingsService] Update security settings error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update privacy settings
     */
    async updatePrivacySettings(userId, privacySettings) {
        try {
            const userRef = doc(db, this.collectionName, userId);
            await updateDoc(userRef, {
                'settings.privacySettings': {
                    ...privacySettings,
                    updatedAt: serverTimestamp()
                }
            });

            return { success: true };
        } catch (error) {
            console.error('[SettingsService] Update privacy settings error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Subscribe to settings changes
     */
    subscribeToSettings(userId, callback, onError) {
        return this.subscribeToDocument(this.collectionName, userId, (userData) => {
            if (userData && userData.settings) {
                callback(userData.settings);
            } else {
                callback(null);
            }
        }, onError);
    }
}

// Export singleton instance
export const settingsService = new SettingsService();
export default settingsService;
