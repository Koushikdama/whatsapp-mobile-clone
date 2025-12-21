import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, CircleDashed, Settings, Search, ArrowLeft, Plus } from 'lucide-react';

// Lazy load route components
const ChatList = lazy(() => import('../../features/chat/components/ChatList'));
const ChatWindow = lazy(() => import('../../features/chat/components/ChatWindow'));
const UpdatesTab = lazy(() => import('../../features/updates/components/UpdatesTab'));
const ChannelDetail = lazy(() => import('../../features/channels/components/ChannelDetail'));
const StatusPrivacySettings = lazy(() => import('../../features/status/components/StatusPrivacySettings'));
const CallsTab = lazy(() => import('../../features/call/components/CallsTab'));
const SettingsTab = lazy(() => import('../../features/settings/components/SettingsTab'));
const NewChat = lazy(() => import('../../features/chat/components/NewChat'));
const GroupInfo = lazy(() => import('../../features/chat/components/GroupInfo'));
const ArchivedChats = lazy(() => import('../../features/chat/components/ArchivedChats'));
const UserProfile = lazy(() => import('../../features/users/components/UserProfile'));
const PrivacySettings = lazy(() => import('../../features/settings/components/PrivacySettings'));
const FollowRequests = lazy(() => import('../../features/users/components/FollowRequests'));

import { useApp } from '../../shared/context/AppContext';
import { useOnlineStatus } from '../../shared/hooks/useOnlineStatus';
import useResponsive from '../../shared/hooks/useResponsive';
import GlobalGameUI from '../../features/games/components/GlobalGameUI';
import CallOverlay from '../../features/call/components/CallOverlay';

// Loading fallback component
const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const MobileLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { searchQuery, setSearchQuery, currentUser, logoEffect, chats, pendingRequests } = useApp();
    const [showSearch, setShowSearch] = useState(false);
    const { isMobileSmall } = useResponsive(); // Get responsive info

    // Track online status
    useOnlineStatus();

    // Calculate total unread count
    const totalUnread = useMemo(() => {
        return chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    }, [chats]);

    // Check if we are in a sub-view that should take full screen and hide nav
    const isChatOpen = location.pathname.includes('/chat/') && !location.pathname.includes('/new-chat');
    const isChannelOpen = location.pathname.includes('/channels/');
    const isSubPage = location.pathname === '/new-chat' || 
                      location.pathname === '/archived' || 
                      location.pathname === '/status/privacy' ||
        location.pathname.includes('/profile/') ||
        location.pathname.includes('/starred') ||
        location.pathname === '/privacy' ||
        location.pathname === '/follow-requests';

    useEffect(() => {
        // Reset search when changing tabs, but keep it if toggling search UI
        if (!location.pathname.includes('chats')) {
            setShowSearch(false);
            setSearchQuery('');
        }
    }, [location.pathname]);

    // Wrap Mobile Chat View
    if (isChatOpen || isChannelOpen) {
        return (
            <div className="h-screen w-full bg-wa-bg">
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/chat/:chatId" element={<ChatWindow />} />
                        <Route path="/chat/:chatId/info" element={<GroupInfo />} />
                        <Route path="/channels/:channelId" element={<ChannelDetail />} />
                    </Routes>
                </Suspense>
                <GlobalGameUI />
                <CallOverlay />
            </div>
        );
    }

    if (isSubPage) {
        return (
            <div className="h-screen w-full bg-white dark:bg-wa-dark-bg">
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/new-chat" element={<NewChat />} />
                        <Route path="/archived" element={<ArchivedChats />} />
                        <Route path="/status/privacy" element={<StatusPrivacySettings />} />
                        <Route path="/profile/:userId" element={<UserProfile />} />
                        <Route path="/privacy" element={<PrivacySettings />} />
                        <Route path="/follow-requests" element={<FollowRequests />} />
                    </Routes>
                </Suspense>
                <CallOverlay />
            </div>
        )
    }

    return (
        <div className="h-screen w-full flex flex-col bg-white dark:bg-wa-dark-bg transition-colors">
            {/* Top Bar - Only show on main tabs (chats, calls), not on updates/status */}
            {(!location.pathname.includes('updates') && !location.pathname.includes('status') && !location.pathname.includes('settings')) && (
                <div className={`${isMobileSmall ? 'h-[56px]' : 'h-[60px]'} bg-wa-teal dark:bg-wa-dark-header text-white dark:text-gray-200 flex items-center justify-between px-4 shadow-sm z-20 transition-colors shrink-0`} style={{ minHeight: '56px' }}>
                    {showSearch ? (
                        <div className="flex items-center w-full gap-3 animate-in fade-in slide-in-from-right-4 duration-200">
                            <ArrowLeft size={24} onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="cursor-pointer" />
                            <input
                                autoFocus
                                type="text"
                                className="bg-transparent text-white placeholder:text-white/70 outline-none w-full text-lg"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    ) : (
                        <>
                            <span className={`text-xl font-medium truncate max-w-[70%] ${logoEffect === 'shine' ? 'effect-shine' : logoEffect === 'wave' ? 'effect-wave' : ''}`}>
                                {currentUser?.name || 'User'}
                            </span>
                            <div className="flex gap-5">
                                <Search size={22} onClick={() => setShowSearch(true)} className="cursor-pointer" />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* View Content Wrapper */}
            <div className="flex-1 relative overflow-hidden bg-white dark:bg-wa-dark-bg">
                {/* Scrollable Content */}
                <div className={`absolute inset-0 overflow-y-auto no-scrollbar ${location.pathname === '/' || location.pathname.includes('chats') || location.pathname.includes('calls') ? 'pb-20' : 'pb-4'}`}>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route path="/" element={<ChatList />} />
                            <Route path="/chats" element={<ChatList />} />
                            <Route path="/status" element={<UpdatesTab />} />
                            <Route path="/updates" element={<UpdatesTab />} />
                            <Route path="/calls" element={<CallsTab />} />
                            <Route path="/settings" element={<SettingsTab />} />
                        </Routes>
                    </Suspense>
                </div>

                {/* Floating Action Buttons */}

                {/* Chats FAB - Responsive sizing with minimum 44px touch target */}
                {(location.pathname === '/' || location.pathname === '/chats') && (
                    <div
                        onClick={() => navigate('/new-chat')}
                        className={`absolute ${isMobileSmall ? 'bottom-5 right-4' : 'bottom-6 right-5'} bg-wa-teal dark:bg-wa-tealDark rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center text-white cursor-pointer active:brightness-90 transition-all z-20 hover:scale-105`}
                        style={{ 
                            width: isMobileSmall ? '56px' : '60px',
                            height: isMobileSmall ? '56px' : '60px',
                            minWidth: '44px',
                            minHeight: '44px'
                        }}
                    >
                        <MessageCircle className="fill-white" size={isMobileSmall ? 22 : 24} />
                        <div 
                            className={`absolute -top-1 -right-1 bg-wa-teal dark:bg-wa-tealDark rounded-full border-2 border-white dark:border-wa-dark-bg flex items-center justify-center`}
                            style={{ width: isMobileSmall ? '18px' : '20px', height: isMobileSmall ? '18px' : '20px' }}
                        >
                            <Plus size={isMobileSmall ? 10 : 12} strokeWidth={3} />
                        </div>
                    </div>
                )}

                {/* Calls FAB - Centered at bottom with minimum 44px touch target */}
                {location.pathname === '/calls' && (
                    <div 
                        className={`absolute ${isMobileSmall ? 'bottom-20' : 'bottom-24'} left-1/2 transform -translate-x-1/2 bg-wa-teal dark:bg-wa-tealDark rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center text-white cursor-pointer active:brightness-90 transition-all z-20 hover:scale-105`}
                        style={{ 
                            width: isMobileSmall ? '56px' : '60px',
                            height: isMobileSmall ? '56px' : '60px',
                            minWidth: '44px',
                            minHeight: '44px'
                        }}
                    >
                        <Phone className="fill-white" size={isMobileSmall ? 22 : 24} />
                        <Plus size={isMobileSmall ? 12 : 14} strokeWidth={3} className="absolute top-2 right-2 text-white" />
                    </div>
                )}
            </div>

            {/* Bottom Nav - Responsive height with minimum 60px for good touch targets */}
            <div className={`border-t border-wa-border dark:border-wa-dark-border bg-white dark:bg-wa-dark-header flex justify-around items-center text-[#54656f] dark:text-gray-400 shrink-0 z-30`} style={{ height: isMobileSmall ? '58px' : '62px', minHeight: '58px' }}>
                <div 
                    className={`flex flex-col items-center gap-0.5 cursor-pointer relative transition-colors ${location.pathname.includes('chats') || location.pathname === '/' ? 'text-black dark:text-white font-medium' : ''}`} 
                    onClick={() => navigate('/chats')}
                    style={{ minWidth: '60px', minHeight: '50px', padding: '4px 8px' }}
                >
                    <MessageCircle size={24} className={location.pathname.includes('chats') || location.pathname === '/' ? 'fill-black dark:fill-white' : ''} />
                    <span className="text-[10px]">Chats</span>
                    {totalUnread > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-wa-lightGreen rounded-full flex items-center justify-center px-1">
                            <span className="text-white text-[9px] font-semibold">
                                {totalUnread > 99 ? '99' : totalUnread}
                            </span>
                        </div>
                    )}
                </div>
                <div 
                    className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${location.pathname.includes('updates') || location.pathname.includes('status') ? 'text-black dark:text-white font-medium' : ''}`} 
                    onClick={() => navigate('/updates')}
                    style={{ minWidth: '60px', minHeight: '50px', padding: '4px 8px' }}
                >
                    <CircleDashed size={24} strokeWidth={2.5} />
                    <span className="text-[10px]">Updates</span>
                </div>
                <div 
                    className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${location.pathname.includes('calls') ? 'text-black dark:text-white font-medium' : ''}`} 
                    onClick={() => navigate('/calls')}
                    style={{ minWidth: '60px', minHeight: '50px', padding: '4px 8px' }}
                >
                    <Phone size={24} className={location.pathname.includes('calls') ? 'fill-black dark:fill-white' : ''} />
                    <span className="text-[10px]">Calls</span>
                </div>
                <div 
                    className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${location.pathname.includes('settings') ? 'text-black dark:text-white font-medium' : ''}`} 
                    onClick={() => navigate('/settings')}
                    style={{ minWidth: '60px', minHeight: '50px', padding: '4px 8px' }}
                >
                    <div className="relative">
                        <Settings size={24} />
                        {pendingRequests?.length > 0 && (
                            <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-wa-dark-header">
                                <span className="text-white text-[9px] font-bold">
                                    {pendingRequests.length > 99 ? '99+' : pendingRequests.length}
                                </span>
                            </div>
                        )}
                    </div>
                    <span className="text-[10px]">Settings</span>
                </div>
            </div>

            {/* Global Game Overlay for non-chat screens (minimized view) */}
            <GlobalGameUI />
            {/* Global Call Overlay */}
            <CallOverlay />
        </div>
    );
};

export default MobileLayout;
