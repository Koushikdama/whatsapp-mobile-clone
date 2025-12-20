import React from 'react';
import { useApp } from '../../../shared/context/AppContext';
import GameInviteModal from './GameInviteModal';
import FloatingGameView from './FloatingGameView';
import GameNotifications from './GameNotifications';

const GlobalGameUI = () => {
    const { isGameInviteOpen, closeGameInvite, inviteToGame, inviteOptions } = useApp();
    const handleGameSelect = (type) => {
        if (inviteOptions.chatId) {
            inviteToGame(inviteOptions.chatId, type);
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
