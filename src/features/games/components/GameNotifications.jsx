import React, { useEffect } from 'react';
import { useApp } from '../../../shared/context/AppContext';
import { Gamepad2, Trophy, Users, XCircle } from 'lucide-react';
import { getGameTitle} from '../../../shared/utils/gameUtils';

/**
 * GameNotifications Component
 * 
 * Displays toast notifications for game events:
 * - Game invitations received
 * - Player joined your game
 * - Game ended (won/lost/draw)
 */

const GameNotifications = () => {
    const { activeGames, gameHistory, users, currentUserId } = useApp();

    useEffect(() => {
        // Listen for new game history entries
        if (gameHistory.length > 0) {
            const latestGame = gameHistory[0];
            
            // Check if game just ended (within last 2 seconds)
            const endedAt = new Date(latestGame.endedAt);
            const now = new Date();
            const timeDiff = (now - endedAt) / 1000; // in seconds

            if (timeDiff < 2) {
                // Show notification
                const isWinner = latestGame.result?.winner === currentUserId;
                const isDraw = latestGame.result?.isDraw;
                
                let message = '';
                let icon = '';
                
                if (isDraw) {
                    message = `Game ended in a draw - ${getGameTitle(latestGame.type)}`;
                    icon = '🤝';
                } else if (isWinner) {
                    message = `You won! - ${getGameTitle(latestGame.type)}`;
                    icon = '🏆';
                } else {
                    const winnerName = latestGame.result?.winner ? users[latestGame.result.winner]?.name : 'Opponent';
                    message = `${winnerName} won - ${getGameTitle(latestGame.type)}`;
                    icon = '❌';
                }

                // Show browser notification if supported
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('WhatsApp Game', {
                        body: message,
                        icon: '/favicon.ico',
                        badge: '/favicon.ico'
                    });
                }
            }
        }
    }, [gameHistory, users, currentUserId]);

    return null; // This component only manages notifications, no UI
};

export default GameNotifications;
