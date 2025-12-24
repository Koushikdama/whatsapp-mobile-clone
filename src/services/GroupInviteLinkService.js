/**
 * Group Invite Link Service
 * Manages creation, validation, and usage of group invite links
 * Follows SOLID principles - Single Responsibility, Clean and Simple
 */

import { db } from '../config/firebaseConfig';
import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';

class GroupInviteLinkService {
    /**
     * Generate a unique invite link for a group
     * @param {string} groupId - Group ID
     * @param {string} createdBy - User ID who created the link
     * @param {number} expiryHours - Hours until link expires (default 72)
     * @returns {Promise<string>} Full invite link URL
     */
    async generateInviteLink(groupId, createdBy, expiryHours = 72) {
        const linkId = this.generateLinkId();
        const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        const linkData = {
            linkId,
            groupId,
            createdBy,
            createdAt: new Date(),
            expiresAt,
            uses: 0,
            maxUses: null, // unlimited
            isActive: true
        };

        await setDoc(doc(db, 'groupInviteLinks', linkId), linkData);

        return `${window.location.origin}/#/join/${linkId}`;
    }

    /**
     * Get active invite link for a group
     * @param {string} groupId - Group ID
     * @returns {Promise<string|null>} Invite link or null if none exists
     */
    async getGroupInviteLink(groupId) {
        try {
            const q = query(
                collection(db, 'groupInviteLinks'),
                where('groupId', '==', groupId),
                where('isActive', '==', true)
            );

            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const linkData = snapshot.docs[0].data();
                
                // Check if expired
                if (linkData.expiresAt.toDate() < new Date()) {
                    return null;
                }
                
                return `${window.location.origin}/#/join/${linkData.linkId}`;
            }

            return null;
        } catch (error) {
            console.error('[GroupInviteLinkService] Get link error:', error);
            return null;
        }
    }

    /**
     * Reset (revoke) existing link and create new one
     * @param {string} groupId - Group ID
     * @param {string} createdBy - User ID who created the link
     * @returns {Promise<string>} New invite link URL
     */
    async resetInviteLink(groupId, createdBy) {
        try {
            // Deactivate old links
            const q = query(
                collection(db, 'groupInviteLinks'),
                where('groupId', '==', groupId),
                where('isActive', '==', true)
            );

            const snapshot = await getDocs(q);
            const updatePromises = snapshot.docs.map(docSnap => 
                setDoc(docSnap.ref, { isActive: false }, { merge: true })
            );
            await Promise.all(updatePromises);

            // Generate new link
            return await this.generateInviteLink(groupId, createdBy);
        } catch (error) {
            console.error('[GroupInviteLinkService] Reset link error:', error);
            throw error;
        }
    }

    /**
     * Validate and get group info from invite link
     * @param {string} linkId - Invite link ID
     * @returns {Promise<{success: boolean, groupId?: string, error?: string}>}
     */
    async validateInviteLink(linkId) {
        try {
            const linkRef = doc(db, 'groupInviteLinks', linkId);
            const linkSnap = await getDoc(linkRef);

            if (!linkSnap.exists()) {
                return { success: false, error: 'Invalid invite link' };
            }

            const linkData = linkSnap.data();

            // Validate link
            if (!linkData.isActive) {
                return { success: false, error: 'This link has been revoked' };
            }

            if (linkData.expiresAt.toDate() < new Date()) {
                return { success: false, error: 'This link has expired' };
            }

            if (linkData.maxUses && linkData.uses >= linkData.maxUses) {
                return { success: false, error: 'This link has reached its maximum uses' };
            }

            return { 
                success: true, 
                groupId: linkData.groupId 
            };
        } catch (error) {
            console.error('[GroupInviteLinkService] Validate link error:', error);
            return { success: false, error: 'Failed to validate link' };
        }
    }

    /**
     * Record link usage (increment counter)
     * @param {string} linkId - Invite link ID
     * @returns {Promise<boolean>} Success status
     */
    async recordLinkUsage(linkId) {
        try {
            const linkRef = doc(db, 'groupInviteLinks', linkId);
            const linkSnap = await getDoc(linkRef);

            if (linkSnap.exists()) {
                const linkData = linkSnap.data();
                await setDoc(linkRef, { uses: linkData.uses + 1 }, { merge: true });
                return true;
            }

            return false;
        } catch (error) {
            console.error('[GroupInviteLinkService] Record usage error:', error);
            return false;
        }
    }

    /**
     * Generate random link ID
     * @private
     * @returns {string} Random 12-character string
     */
    generateLinkId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: 12 }, () => 
            chars[Math.floor(Math.random() * chars.length)]
        ).join('');
    }
}

// Export singleton instance
const groupInviteLinkService = new GroupInviteLinkService();
export default groupInviteLinkService;
