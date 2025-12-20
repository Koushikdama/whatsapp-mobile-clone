import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Minus, X, Minimize2, Maximize2, MessageCircle, Trophy, Dice5, Gamepad2, Eye } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useApp } from '../../../shared/context/AppContext';
import useResponsive from '../../../shared/hooks/useResponsive';
import GameFactory from './GameFactory';
import GameSpectatorMode from './GameSpectatorMode';
import GameChatPanel from './chat/GameChatPanel';
import { GAME_CONFIG } from '../../../shared/constants/gameConstants';

const FloatingGameView = () => {
    const { activeGame, closeGame, minimizeGame, maximizeGame } = useGame();
    const { currentUserId, currentUser } = useApp();
    const dragControls = useDragControls();
    const { width, height, isMobile, isTablet, isDesktop, isPortrait, isLandscape, isMobileSmall } = useResponsive();
    const [spectatorMode, setSpectatorMode] = useState(false);
    const [chatMinimized, setChatMinimized] = useState(true);

    // Calculate responsive dimensions with orientation support
    const dimensions = useMemo(() => {
        if (isMobile) {
            // Mobile devices - different behavior for portrait vs landscape
            if (isPortrait) {
                // Portrait mode: prioritize vertical space
                const gameWidth = Math.min(width * 0.95, 400);
                const gameHeight = Math.min(height * 0.7, 650);
                
                // Very small screens: go nearly fullscreen
                const isVerySmall = width < 360 || height < 640;
                
                return {
                    width: isVerySmall ? width : gameWidth,
                    height: isVerySmall ? height - 80 : gameHeight, // Leave space for minimal header
                    bottomPosition: isVerySmall ? 'inset-0' : 'bottom-20',
                    isFullscreen: isVerySmall,
                };
            } else {
                // Landscape mode: optimize for horizontal gaming
                return {
                    width: Math.min(width * 0.6, 500),
                    height: Math.min(height * 0.85, 600),
                    bottomPosition: 'bottom-4',
                    isFullscreen: false,
                };
            }
        } else if (isTablet) {
            // Tablet: fluid sizing based on orientation
            if (isPortrait) {
                return {
                    width: Math.min(width * 0.7, 550),
                    height: Math.min(height * 0.65, 700),
                    bottomPosition: 'bottom-6',
                    isFullscreen: false,
                };
            } else {
                // Landscape tablet: utilize horizontal space
                return {
                    width: Math.min(width * 0.5, 600),
                    height: Math.min(height * 0.75, 650),
                    bottomPosition: 'bottom-4',
                    isFullscreen: false,
                };
            }
        } else {
            // Desktop: size based on viewport width
            const baseWidth = width >= 1920 ? 600 : width >= 1440 ? 500 : 420;
            const maxHeight = Math.min(height * 0.8, 750);
            
            return {
                width: baseWidth,
                height: maxHeight,
                bottomPosition: 'bottom-4',
                isFullscreen: false,
            };
        }
    }, [width, height, isMobile, isTablet, isDesktop, isPortrait, isLandscape]);

    if (!activeGame) return null;

    const gameConfig = GAME_CONFIG[activeGame.type];

    const getIcon = (type) => {
        return gameConfig?.icon || <Gamepad2 size={18} />;
    };

    const getTitle = (type) => {
        return gameConfig?.displayName || 'Game';
    };

    const getColor = (type) => {
        const colorMap = {
            chess: 'bg-indigo-600',
            ludo: 'bg-red-600',
            snake: 'bg-green-600',
            tictactoe: 'bg-blue-600',
        };
        return colorMap[type] || 'bg-wa-teal';
    };

    // Minimized State (Floating Pill)
    if (activeGame.isMinimized) {
        // Responsive pill sizing
        const pillSize = isMobileSmall ? 40 : 44;
        const pillPadding = isMobileSmall ? 'pl-2 pr-3 py-2' : 'pl-2 pr-4 py-2.5';
        
        return (
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                drag
                dragConstraints={{ 
                    left: -(width - 100), 
                    right: 20, 
                    top: -(height - 100), 
                    bottom: 20 
                }}
                onClick={maximizeGame}
                className={`fixed ${dimensions.bottomPosition === 'inset-0' ? 'bottom-20' : dimensions.bottomPosition} right-4 z-[100] flex items-center gap-2 md:gap-3 bg-white dark:bg-wa-dark-paper ${pillPadding} rounded-full shadow-2xl cursor-pointer border border-wa-border dark:border-gray-700 hover:scale-105 transition-transform`}
                style={{ minHeight: '44px' }} // Ensure minimum touch target
            >
                <div 
                    className={`rounded-full ${getColor(activeGame.type)} text-white flex items-center justify-center shadow-lg`}
                    style={{ width: pillSize, height: pillSize }}
                >
                    {getIcon(activeGame.type)}
                </div>
                <div className="flex flex-col">
                    <span className={`${isMobileSmall ? 'text-xs' : 'text-sm'} font-bold text-[#111b21] dark:text-gray-100 truncate max-w-[120px]`}>
                        {getTitle(activeGame.type)}
                    </span>
                    <span className="text-[10px] text-green-500 font-black uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        In Progress
                    </span>
                </div>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                drag={!dimensions.isFullscreen}
                dragControls={dragControls}
                dragListener={!dimensions.isFullscreen}
                dragConstraints={{ 
                    left: -(width - dimensions.width), 
                    right: 0, 
                    top: -(height - dimensions.height), 
                    bottom: 0 
                }}
                className={`fixed z-[100] flex flex-col bg-white dark:bg-[#111b21] overflow-hidden ${
                    dimensions.isFullscreen 
                        ? 'inset-0' 
                        : `${dimensions.bottomPosition} right-4 rounded-2xl shadow-2xl border border-wa-border dark:border-gray-700`
                }`}
                style={!dimensions.isFullscreen ? { 
                    width: dimensions.width, 
                    height: dimensions.height,
                    maxHeight: '90vh' // Prevent overflow on small screens
                } : {}}
            >
                {/* Header (Drag Handle) */}
                <div
                    onPointerDown={(e) => !dimensions.isFullscreen && dragControls.start(e)}
                    className={`${getColor(activeGame.type)} p-3 md:p-4 flex justify-between items-center text-white shrink-0 shadow-lg z-10 ${
                        dimensions.isFullscreen ? '' : 'cursor-grab active:cursor-grabbing'
                    } select-none`}
                >
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                            {getIcon(activeGame.type)}
                        </div>
                        <span className="font-bold tracking-tight text-base md:text-lg truncate">
                            {getTitle(activeGame.type)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 shrink-0">
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => setSpectatorMode(!spectatorMode)}
                            className={`p-2 rounded-xl transition-colors ${spectatorMode ? 'bg-purple-500 text-white' : 'hover:bg-white/20'}`}
                            style={{ minWidth: '44px', minHeight: '44px' }}
                            title="Toggle Spectator Mode"
                        >
                            <Eye size={20} strokeWidth={2.5} />
                        </button>
                        {!dimensions.isFullscreen && (
                            <button 
                                onPointerDown={(e) => e.stopPropagation()} 
                                onClick={minimizeGame} 
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                style={{ minWidth: '44px', minHeight: '44px' }}
                            >
                                <Minus size={20} strokeWidth={2.5} />
                            </button>
                        )}
                        <button 
                            onPointerDown={(e) => e.stopPropagation()} 
                            onClick={closeGame} 
                            className="p-2 hover:bg-red-500/40 rounded-xl transition-colors"
                            style={{ minWidth: '44px', minHeight: '44px' }}
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Game Content */}
                <div className="flex-1 flex flex-col bg-wa-grayBg dark:bg-[#0b141a] relative overflow-hidden">
    
                {/* Content */}
                <div className="flex-1 overflow-auto relative">
                    {spectatorMode && (
                        <GameSpectatorMode
                            game={activeGame}
                            onClose={() => setSpectatorMode(false)}
                        />
                    )}
                    <GameFactory gameType={activeGame.type} />
                </div>
            </div>

            {/* Chat Panel */}
            <GameChatPanel
                gameId={activeGame.id}
                currentUserId={currentUserId}
                currentUserName={currentUser?.name || 'You'}
                participants={activeGame.players || []}
                isMinimized={chatMinimized}
                onToggle={() => setChatMinimized(!chatMinimized)}
            />
        </motion.div>
        </AnimatePresence>
    );
};

export default FloatingGameView;
