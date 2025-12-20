import React from 'react';
import { useGame } from '../context/GameContext';
import GameInviteModal from './GameInviteModal';
import FloatingGameView from './FloatingGameView';
import GameNotifications from './GameNotifications';

const GlobalGameUI = () => {
    const { isGameInviteOpen, closeGameInvite, inviteGame, inviteOptions } = useGame();
    const handleGameSelect = (type) => {
        if (inviteOptions.chatId) {
            inviteGame(type, inviteOptions.chatId);
        } else {
            console.error("Game initialization failed: Missing chat context");
            closeGameInvite();
        }
    };

    return (
        <>
            <GameInviteModal
                isOpen={isGameInviteOpen}
                isGroup={inviteOptions.isGroup}
                onClose={closeGameInvite}
                onSelectGame={handleGameSelect}
            />
            <FloatingGameView />
            <GameNotifications />
        </>
    );
};

export default GlobalGameUI;
