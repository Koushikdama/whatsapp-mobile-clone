/**
 * Firebase Authentication Service
 * Handles email/password authentication only
 */

import { auth, db } from '../../config/firebaseConfig';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    updateEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirebaseError } from './FirebaseService';

class AuthService {
    constructor() {
        this.auth = auth;
        this.currentUser = null;
        this.authStateListeners = [];
        
        // Listen to auth state changes
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            this.authStateListeners.forEach(callback => callback(user));
        });
    }

    /**
     * Register new user with email and password
     */
    async register(email, password, userData) {
        try {
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // Update display name if provided
            if (userData.name) {
                await updateProfile(user, {
                    displayName: userData.name,
                    photoURL: userData.avatar || null
                });
            }

            // Create user profile in Firestore
            await this.createUserProfile(user.uid, {
                email: user.email,
                name: userData.name || 'User',
                avatar: userData.avatar || `https://picsum.photos/seed/${user.uid}/200`,
                about: userData.about || 'Hey there! I am using WhatsApp',
                phone: userData.phone || '',
                createdAt: serverTimestamp(),
                lastSeen: serverTimestamp(),
                isOnline: true,
                isPrivate: false,
                blockedUsers: []
            });

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                }
            };
        } catch (error) {
            console.error('[Auth] Registration error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Sign in with email and password
     */
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // Update online status
            await this.updateOnlineStatus(user.uid, true);

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                }
            };
        } catch (error) {
            console.error('[Auth] Login error:', error);
            
            // Provide specific error messages
            const errorMessages = {
                'auth/user-not-found': 'No account found with this email',
                'auth/wrong-password': 'Incorrect password',
                'auth/invalid-email': 'Invalid email address',
                'auth/user-disabled': 'This account has been disabled',
                'auth/too-many-requests': 'Too many failed attempts. Please try again later'
            };

            const message = errorMessages[error.code] || error.message;
            throw new Error(message);
        }
    }

    /**
     * Sign out current user
     */
    async logout() {
        try {
            const uid = this.currentUser?.uid;
            
            // Update online status before signing out
            if (uid) {
                await this.updateOnlineStatus(uid, false);
            }

            await signOut(this.auth);

            return { success: true };
        } catch (error) {
            console.error('[Auth] Logout error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Send password reset email
     */
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(this.auth, email);
            return {
                success: true,
                message: 'Password reset email sent. Please check your inbox.'
            };
        } catch (error) {
            console.error('[Auth] Password reset error:', error);
            
            const errorMessages = {
                'auth/user-not-found': 'No account found with this email',
                'auth/invalid-email': 'Invalid email address'
            };

            const message = errorMessages[error.code] || error.message;
            throw new Error(message);
        }
    }

    /**
     * Change user password
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const user = this.auth.currentUser;
            if (!user || !user.email) {
                throw new Error('No user logged in');
            }

            // Re-authenticate user
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);

            return {
                success: true,
                message: 'Password updated successfully'
            };
        } catch (error) {
            console.error('[Auth] Change password error:', error);
            
            const errorMessages = {
                'auth/wrong-password': 'Current password is incorrect',
                'auth/weak-password': 'New password is too weak'
            };

            const message = errorMessages[error.code] || error.message;
            throw new Error(message);
        }
    }

    /**
     * Update user email
     */
    async changeEmail(newEmail, password) {
        try {
            const user = this.auth.currentUser;
            if (!user || !user.email) {
                throw new Error('No user logged in');
            }

            // Re-authenticate user
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);

            // Update email
            await updateEmail(user, newEmail);

            // Update email in Firestore
            await updateDoc(doc(db, 'users', user.uid), {
                email: newEmail
            });

            return {
                success: true,
                message: 'Email updated successfully'
            };
        } catch (error) {
            console.error('[Auth] Change email error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Create user profile in Firestore
     */
    async createUserProfile(uid, userData) {
        try {
            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, {
                id: uid,
                ...userData,
                settings: {
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
                }
            });

            return { success: true };
        } catch (error) {
            console.error('[Auth] Create profile error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Get user profile from Firestore
     */
    async getUserProfile(uid) {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return {
                    success: true,
                    user: { id: userSnap.id, ...userSnap.data() }
                };
            } else {
                throw new Error('User profile not found');
            }
        } catch (error) {
            console.error('[Auth] Get profile error:', error);
            throw handleFirebaseError(error);
        }
    }

    /**
     * Update online status
     */
    async updateOnlineStatus(uid, isOnline) {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                isOnline,
                lastSeen: serverTimestamp()
            });
        } catch (error) {
            console.error('[Auth] Update online status error:', error);
            // Don't throw error for online status updates
        }
    }

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.authStateListeners.indexOf(callback);
            if (index > -1) {
                this.authStateListeners.splice(index, 1);
            }
        };
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        return this.auth.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.auth.currentUser;
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        return this.auth.currentUser?.uid || null;
    }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
