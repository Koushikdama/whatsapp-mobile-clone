import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, CircleDashed, Settings, Search } from 'lucide-react';

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

import { useApp } from '../../shared/context/AppContext';
import { useOnlineStatus } from '../../shared/hooks/useOnlineStatus';
import GlobalGameUI from '../../features/games/components/GlobalGameUI';
import CallOverlay from '../../features/call/components/CallOverlay';

// Loading fallback component
const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
    </div>
);

/**
 * TabletLayout - Optimized layout for tablet devices (768px - 1023px)
 * Combines best of mobile and desktop: persistent sidebar + main content area
 * Follows Instagram, Twitter tablet patterns
 */
const TabletLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('chats');
    const { searchQuery, setSearchQuery, currentUser, logoEffect, theme } = useApp();

    // Track online status
    useOnlineStatus();

    // Determine active view based on path
    useEffect(() => {
        if (location.pathname.startsWith('/status') || location.pathname.startsWith('/updates')) setActiveTab('status');
        else if (location.pathname.startsWith('/calls')) setActiveTab('calls');
        else if (location.pathname.startsWith('/settings')) setActiveTab('settings');
        else setActiveTab('chats');
    }, [location]);

    // Determine if we should show the main sidebar header
    const isSubPage =
        location.pathname.startsWith('/settings') ||
        location.pathname.startsWith('/calls') ||
        location.pathname.startsWith('/new-chat') ||
        location.pathname.startsWith('/archived') ||
        location.pathname === '/status' ||
        location.pathname === '/updates' ||
        location.pathname.startsWith('/status/privacy');

    const showSidebarHeader = !isSubPage;

    // Determine effect class for tablet header
    const getTabletEffectClass = () => {
        if (logoEffect === 'wave') return 'effect-wave';
        if (logoEffect === 'shine') {
            return theme === 'dark' ? 'effect-shine' : 'effect-shine-dark';
        }
        return '';
    };

    const tabletEffectClass = getTabletEffectClass();
    const tabletTextColors = logoEffect === 'shine' ? '' : 'text-[#111b21] dark:text-gray-100';

    const { width, isPortrait } = useResponsive();
    
    // Responsive sidebar width for tablets
    const sidebarWidth = useMemo(() => {
        if (isPortrait) {
            // Portrait: wider sidebar for better readability
            return width >= 850 ? 'w-[380px]' : 'w-[360px]';
        } else {
            // Landscape: narrower sidebar to show more chat content
            return width >= 1200 ? 'w-[360px]' : 'w-[340px]';
        }
    }, [width, isPortrait]);

    return (
        <div className="flex h-screen w-full bg-[#EFEAE2] dark:bg-[#0b141a] relative overflow-hidden">
            {/* Green background strip for tablet visual (similar to desktop) */}
            <div className="absolute top-0 left-0 w-full h-28 bg-wa-teal dark:bg-wa-tealDark -z-10"></div>

            <div className="flex w-full h-full bg-white dark:bg-wa-dark-bg overflow-hidden">
                {/* Left Sidebar - Fluid responsive width */}
                <div className={`${sidebarWidth} flex flex-col border-r border-wa-border dark:border-wa-dark-border bg-white dark:bg-wa-dark-bg h-full relative z-10 transition-all duration-200`}>

                    {/* Header - Only shown for main chat list */}
                    {showSidebarHeader && (
                        <div className="h-[60px] bg-wa-grayBg dark:bg-wa-dark-header flex items-center justify-between px-4 shrink-0 border-b border-wa-border dark:border-wa-dark-border">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/settings')}>
                                <img src={currentUser?.avatar || 'https://ui-avatars.com/api/?name=User&background=128c7e&color=fff'} alt="Me" className="w-10 h-10 rounded-full object-cover" />
                                <span className={`font-medium ${tabletTextColors} ${tabletEffectClass}`}>
                                    {currentUser?.name || 'User'}
                                </span>
                            </div>
                            <div className="flex gap-4 text-wa-gray dark:text-gray-400">
                                <button 
                                    onClick={() => navigate('/status')} 
                                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                    style={{ minWidth: '44px', minHeight: '44px' }}
                                >
                                    <CircleDashed size={22} strokeWidth={activeTab === 'status' ? 2.5 : 2} className={activeTab === 'status' ? 'text-wa-teal dark:text-wa-teal' : ''} />
                                </button>
                                <button 
                                    onClick={() => navigate('/new-chat')} 
                                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                    style={{ minWidth: '44px', minHeight: '44px' }}
                                >
                                    <MessageCircle size={22} strokeWidth={activeTab === 'chats' ? 2.5 : 2} className={location.pathname === '/new-chat' ? 'text-wa-teal dark:text-wa-teal' : ''} />
                                </button>
                                <button 
                                    onClick={() => navigate('/calls')} 
                                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                    style={{ minWidth: '44px', minHeight: '44px' }}
                                >
                                    <Phone size={22} strokeWidth={activeTab === 'calls' ? 2.5 : 2} className={activeTab === 'calls' ? 'text-wa-teal dark:text-wa-teal' : ''} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Search - Only shown when Sidebar Header is shown */}
                    {showSidebarHeader && (
                        <div className="bg-white dark:bg-wa-dark-bg p-2 border-b border-wa-border dark:border-wa-dark-border">
                            <div className="bg-wa-grayBg dark:bg-wa-dark-input rounded-lg px-4 py-2 flex items-center gap-3 text-wa-gray dark:text-gray-400 h-9 transition-colors">
                                <Search size={17} />
                                <input
                                    type="text"
                                    placeholder="Search or start new chat"
                                    className="bg-transparent outline-none text-sm w-full text-black dark:text-white placeholder:text-wa-gray dark:placeholder:text-gray-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Content Area - Sidebar content */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white dark:bg-wa-dark-bg">
                        <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                                <Route path="/" element={<ChatList />} />
                                <Route path="/chats" element={<ChatList />} />
                                <Route path="/status" element={<UpdatesTab />} />
                                <Route path="/updates" element={<UpdatesTab />} />
                                <Route path="/status/privacy" element={<StatusPrivacySettings />} />
                                <Route path="/calls" element={<CallsTab />} />
                                <Route path="/settings" element={<SettingsTab />} />
                                <Route path="/new-chat" element={<NewChat />} />
                                <Route path="/archived" element={<ArchivedChats />} />

                                {/* On tablet: show ChatList in sidebar while right side handles chat window */}
                                <Route path="/chat/:chatId" element={<ChatList />} />
                                <Route path="/chat/:chatId/info" element={<ChatList />} />
                                <Route path="/channels/:channelId" element={<ChatList />} />
                            </Routes>
                        </Suspense>
                    </div>
                </div>

                {/* Right Side - Main Content Area (Tablet optimized) */}
                <div className="flex-1 bg-wa-bg relative flex flex-col h-full border-l border-wa-border dark:border-wa-dark-border">
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route path="/chat/:chatId" element={<ChatWindow />} />
                            <Route path="/chat/:chatId/info" element={<GroupInfo />} />
                            <Route path="/channels/:channelId" element={<ChannelDetail />} />
                            <Route path="*" element={
                                <div className="flex flex-col items-center justify-center h-full text-center px-8 border-b-[6px] border-wa-teal dark:border-wa-tealDark bg-[#f0f2f5] dark:bg-wa-dark-border">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" className="w-16 h-16 opacity-30 mb-6" />
                                    <h1 className={`text-2xl font-light text-[#41525d] dark:text-gray-300 mb-3 ${logoEffect === 'shine' ? 'effect-shine-dark' : logoEffect === 'wave' ? 'effect-wave' : ''}`}>
                                        WhatsApp Tablet
                                    </h1>
                                    <p className="text-[#667781] dark:text-gray-400 text-sm">Select a chat to start messaging.</p>
                                </div>
                            } />
                        </Routes>
                    </Suspense>
                </div>
            </div>

            {/* Global Game System UI Overlay */}
            <GlobalGameUI />
            {/* Global Call Overlay */}
            <CallOverlay />
        </div>
    );
};

export default TabletLayout;
