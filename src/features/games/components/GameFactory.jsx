import React, { Suspense } from 'react';
import ChessGame from './ChessGame';
import LudoGame from './LudoGame';
import SnakeLaddersGame from './SnakeLaddersGame';
import TicTacToeGame from './TicTacToeGame';

// We can lazy load these if they are heavy
// const ChessGame = React.lazy(() => import('./chess/ChessGame'));
// const LudoGame = React.lazy(() => import('./ludo/LudoGame'));
// const SnakeLaddersGame = React.lazy(() => import('./snake-ladders/SnakeLaddersGame'));

const GameFactory = ({ gameType, ...props }) => {
    switch (gameType) {
        case 'chess':
            return <ChessGame {...props} />;
        case 'ludo':
            return <LudoGame {...props} />;
        case 'snake':
            return <SnakeLaddersGame {...props} />;
        case 'tictactoe':
            return <TicTacToeGame {...props} />;
        default:
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p>Unknown Game Type: {gameType}</p>
                </div>
            );
    }
};

export default GameFactory;
