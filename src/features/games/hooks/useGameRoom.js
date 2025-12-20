import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useApp } from '../../../shared/context/AppContext';

export const useGameRoom = (roomId) => {
    const { roomSession, activeGame } = useGame();
    const { currentUserId } = useApp();

    // Local state for the game (synced with roomSession in real app)
    const [gameState, setGameState] = useState({
        status: 'waiting', // waiting, active, finished
        turn: 'white', // userId or color
        board: null, // game specific board state
        winner: null
    });

    const [players, setPlayers] = useState([]);

    useEffect(() => {
        // In a real app, subscribe to websocket/firebase for this roomId
        // For now, sync with initial Context state
        if (activeGame) {
            setPlayers(activeGame.players || []);
        }
    }, [activeGame]);

    const makeMove = useCallback((moveData) => {
        // Validate turn
        const isMyTurn = (gameState.turn === currentUserId) ||
            (gameState.turn === 'white' && players.find(p => p.userId === currentUserId)?.color === 'white') ||
            (gameState.turn === 'black' && players.find(p => p.userId === currentUserId)?.color === 'black');

        if (!isMyTurn) {
            console.warn("Not your turn!");
            return false;
        }

        // Optimistic update
        setGameState(prev => ({
            ...prev,
            // Mock logic: switch turn
            turn: prev.turn === 'white' ? 'black' : 'white',
            // Update board logic would go here or be passed in
            board: moveData.newBoard || prev.board
        }));

        // Send move to server...
        return true;
    }, [gameState.turn, currentUserId, players]);

    const leaveRoom = useCallback(() => {
        // Logic to leave
    }, []);

    return {
        gameState,
        players,
        isMyTurn: (gameState.turn === currentUserId) ||
            (gameState.turn === 'white' && players.find(p => p.userId === currentUserId)?.color === 'white') ||
            (gameState.turn === 'black' && players.find(p => p.userId === currentUserId)?.color === 'black'),
        currentUserId,
        makeMove,
        leaveRoom
    };
};
