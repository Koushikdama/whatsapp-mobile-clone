/**
 * Music Session Service
 * Manages shared music listening sessions with synchronized playback
 * Supports both YouTube videos and local audio files
 */

import { ref as dbRef, set, onValue, off, update } from 'firebase/database';
import { realtimeDb } from '../config/firebaseConfig';


class MusicSessionService {
    constructor() {
        this.activeSessions = new Map(); // chatId -> session data
        this.listeners = new Map(); // chatId -> unsubscribe function
    }

    /**
     * Create a new music session
     */
    async createSession(chatId, userId, musicData) {
        try {
            const sessionId = `music_${chatId}_${Date.now()}`;
            const sessionRef = dbRef(realtimeDb, `musicSessions/${sessionId}`);

            const session = {
                id: sessionId,
                chatId,
                createdBy: userId,
                createdAt: Date.now(),
                musicType: musicData.type, // 'youtube' or 'local'
                musicUrl: musicData.url,
                musicTitle: musicData.title || 'Unknown',
                musicDuration: musicData.duration || 0,
                thumbnailUrl: musicData.thumbnail,
                // Playback state
                isPlaying: false,
                currentTime: 0,
                participants: [userId],
                // For YouTube
                youtubeId: musicData.youtubeId
            };

            await set(sessionRef, session);
            this.activeSessions.set(chatId, session);

            console.log('✅ [MusicSession] Session created:', sessionId);
            return { success: true, session };
        } catch (error) {
            console.error('❌ [MusicSession] Create error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Join an existing music session
     */
    async joinSession(sessionId, userId) {
        try {
            const sessionRef = dbRef(realtimeDb, `musicSessions/${sessionId}`);
            const participantsRef = dbRef(realtimeDb, `musicSessions/${sessionId}/participants`);

            // Add user to participants
            const session = this.activeSessions.get(sessionId);
            if (session && !session.participants.includes(userId)) {
                const updatedParticipants = [...session.participants, userId];
                await update(sessionRef, { participants: updatedParticipants });
            }

            console.log('✅ [MusicSession] Joined session:', sessionId);
            return { success: true };
        } catch (error) {
            console.error('❌ [MusicSession] Join error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update playback state (play/pause)
     */
    async updatePlaybackState(sessionId, isPlaying, currentTime) {
        try {
            const sessionRef = dbRef(realtimeDb, `musicSessions/${sessionId}`);
            
            await update(sessionRef, {
                isPlaying,
                currentTime,
                lastUpdated: Date.now()
            });

            console.log(`🎵 [MusicSession] Playback ${isPlaying ? 'playing' : 'paused'} at ${currentTime}s`);
            return { success: true };
        } catch (error) {
            console.error('❌ [MusicSession] Update playback error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Seek to specific time
     */
    async seek(sessionId, time) {
        try {
            const sessionRef = dbRef(realtimeDb, `musicSessions/${sessionId}`);
            
            await update(sessionRef, {
                currentTime: time,
                lastUpdated: Date.now()
            });

            console.log(`⏩ [MusicSession] Seeked to ${time}s`);
            return { success: true };
        } catch (error) {
            console.error('❌ [MusicSession] Seek error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Subscribe to session updates
     */
    subscribeToSession(sessionId, callback) {
        const sessionRef = dbRef(realtimeDb, `musicSessions/${sessionId}`);

        const unsubscribe = onValue(sessionRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.activeSessions.set(data.chatId, data);
                callback(data);
            }
        });

        this.listeners.set(sessionId, () => off(sessionRef));
        
        return () => {
            const unsub = this.listeners.get(sessionId);
            if (unsub) unsub();
            this.listeners.delete(sessionId);
        };
    }

    /**
     * End music session
     */
    async endSession(sessionId) {
        try {
            const sessionRef = dbRef(realtimeDb, `music Sessions/${sessionId}`);
            
            await set(sessionRef, null); // Delete the session
            
            // Cleanup local state
            const session = Array.from(this.activeSessions.values()).find(s => s.id === sessionId);
            if (session) {
                this.activeSessions.delete(session.chatId);
            }

            const unsub = this.listeners.get(sessionId);
            if (unsub) unsub();
            this.listeners.delete(sessionId);

            console.log('🛑 [MusicSession] Session ended:', sessionId);
            return { success: true };
        } catch (error) {
            console.error('❌ [MusicSession] End session error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get active session for a chat
     */
    getActiveSession(chatId) {
        return this.activeSessions.get(chatId);
    }

    /**
     * Extract YouTube video ID from URL
     */
    extractYouTubeId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }
}

// Export singleton instance
export const musicSessionService = new MusicSessionService();
export default musicSessionService;
