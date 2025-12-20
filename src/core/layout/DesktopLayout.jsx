import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, CircleDashed, Settings, Search } from 'lucide-react';

import ChatList from '../../features/chat/components/ChatList';
import ChatWindow from '../../features/chat/components/ChatWindow';
import UpdatesTab from '../../features/updates/components/UpdatesTab';
import StatusPrivacySettings from '../../features/status/components/StatusPrivacySettings';
import CallsTab from '../../features/call/components/CallsTab';
import SettingsTab from '../../features/settings/components/SettingsTab';
import NewChat from '../../features/chat/components/NewChat';
import GroupInfo from '../../features/chat/components/GroupInfo';
import ArchivedChats from '../../features/chat/components/ArchivedChats';

import { useApp } from '../../shared/context/AppContext';
import { useOnlineStatus } from '../../shared/hooks/useOnlineStatus';
import useResponsive from '../../shared/hooks/useResponsive';
import GlobalGameUI from '../../features/games/components/GlobalGameUI';
import CallOverlay from '../../features/call/components/CallOverlay';

const DesktopLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('chats');
    const { searchQuery, setSearchQuery, currentUser, logoEffect, theme } = useApp();
    const { isDesktopLarge, width } = useResponsive();

    // Track online status
    useOnlineStatus();

    // Determine active view based on path
    useEffect(() => {
        if (location.pathname.startsWith('/status') || location.pathname.startsWith('/updates')) setActiveTab('status');
        else if (location.pathname.startsWith('/calls')) setActiveTab('calls');
        else if (location.pathname.startsWith('/settings')) setActiveTab('settings');
        else setActiveTab('chats');
    }, [location]);

    // Determine if we should show the main sidebar header (Avatar + Nav Icons)
    const isSubPage =
        location.pathname.startsWith('/settings') ||
        location.pathname.startsWith('/calls') ||
        location.pathname.startsWith('/new-chat') ||
        location.pathname.startsWith('/archived') ||
        location.pathname === '/status' ||
        location.pathname === '/updates' ||
        location.pathname.startsWith('/status/privacy');

    const showSidebarHeader = !isSubPage;

    // Determine effect class for desktop header
    const getDesktopEffectClass = () => {
        if (logoEffect === 'wave') return 'effect-wave';
        if (logoEffect === 'shine') {
            return theme === 'dark' ? 'effect-shine' : 'effect-shine-dark';
        }
        return '';
    };

    const desktopEffectClass = getDesktopEffectClass();
    const desktopTextColors = logoEffect === 'shine' ? '' : 'text-[#111b21] dark:text-gray-100';

    // Responsive sidebar width based on screen size
    const sidebarWidth = useMemo(() => {
        if (width >= 1920) return 'w-[440px]';
        if (width >= 1600) return 'w-[420px]';
        if (width >= 1440) return 'w-[400px]';
        return 'w-[380px]';
    }, [width]);

    // Max container width for ultra-wide screens
    const containerMaxWidth = width >= 1920 ? 'max-w-[1800px]' : width >= 1600 ? 'max-w-[1600px]' : '';

    return (
        <div className="flex h-screen w-full bg-[#EFEAE2] dark:bg-[#0b141a] relative overflow-hidden">
            {/* Green background strip for desktop visual */}
            <div className="absolute top-0 left-0 w-full h-32 bg-wa-teal dark:bg-wa-tealDark -z-10 hidden xl:block"></div>

            {/* Max-width container for ultra-wide screens */}
            <div className={`flex w-full h-full bg-white dark:bg-wa-dark-bg overflow-hidden ${containerMaxWidth} ${containerMaxWidth ? 'mx-auto shadow-2xl' : ''}`}>
                {/* Left Sidebar - Fluid responsive width */}
                <div className={`${sidebarWidth} flex flex-col border-r border-wa-border dark:border-wa-dark-border bg-white dark:bg-wa-dark-bg h-full relative z-10 transition-all duration-200`}>

                    {/* Header - Only shown for main chat list */}
                    {showSidebarHeader && (
                        <div className="h-[60px] bg-wa-grayBg dark:bg-wa-dark-header flex items-center justify-between px-4 shrink-0 border-b border-wa-border dark:border-wa-dark-border">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/settings')}>
                                <img src={currentUser?.avatar || 'https://ui-avatars.com/api/?name=User&background=128c7e&color=fff'} alt="Me" className="w-10 h-10 rounded-full object-cover" />
                                <span className={`font-medium ${desktopTextColors} ${desktopEffectClass}`}>
                                    {currentUser?.name || 'User'}
                                </span>
                            </div>
                            <div className="flex gap-5 text-wa-gray dark:text-gray-400">
                                <button 
                                    onClick={() => navigate('/status')} 
                                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                    style={{ minWidth: '44px', minHeight: '44px' }}
                                >
                                    <CircleDashed size={24} strokeWidth={activeTab === 'status' ? 2.5 : 2} className={activeTab === 'status' ? 'text-wa-teal dark:text-wa-teal' : ''} />
                                </button>
                                <button 
                                    onClick={() => navigate('/new-chat')} 
                                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                    style={{ minWidth: '44px', minHeight: '44px' }}
                                >
                                    <MessageCircle size={24} strokeWidth={activeTab === 'chats' ? 2.5 : 2} className={location.pathname === '/new-chat' ? 'text-wa-teal dark:text-wa-teal' : ''} />
                                </button>
                                <button 
                                    onClick={() => navigate('/calls')} 
                                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                    style={{ minWidth: '44px', minHeight: '44px' }}
                                >
                                    <Phone size={24} strokeWidth={activeTab === 'calls' ? 2.5 : 2} className={activeTab === 'calls' ? 'text-wa-teal dark:text-wa-teal' : ''} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Search - Only shown when Sidebar Header is shown */}
                    {showSidebarHeader && (
                        <div className="bg-white dark:bg-wa-dark-bg p-2 border-b border-wa-border dark:border-wa-dark-border">
                            <div className="bg-wa-grayBg dark:bg-wa-dark-input rounded-lg px-4 py-2 flex items-center gap-4 text-wa-gray dark:text-gray-400 h-9 transition-colors">
                                <Search size={18} />
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

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white dark:bg-wa-dark-bg">
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

                            {/* On mobile: show chat window in sidebar area (effectively full screen). 
                    On desktop: show ChatList in sidebar while right side handles content. */}
                            <Route path="/chat/:chatId" element={
                                <>
                                    <div className="md:hidden h-full"><ChatWindow /></div>
                                    <div className="hidden md:block h-full"><ChatList /></div>
                                </>
                            } />
                            <Route path="/chat/:chatId/info" element={
                                <>
                                    <div className="md:hidden h-full"><GroupInfo /></div>
                                    <div className="hidden md:block h-full"><ChatList /></div>
                                </>
                            } />
                        </Routes>
                    </div>
                </div>

                {/* Right Side - Chat Window (Desktop Only) */}
                <div className="hidden md:flex flex-1 bg-wa-bg relative flex-col h-full border-l border-wa-border dark:border-wa-dark-border">
                    <Routes>
                        <Route path="/chat/:chatId" element={<ChatWindow />} />
                        <Route path="/chat/:chatId/info" element={<GroupInfo />} />
                        <Route path="*" element={
                            <div className="flex flex-col items-center justify-center h-full text-center px-10 border-b-[6px] border-wa-teal dark:border-wa-tealDark bg-[#f0f2f5] dark:bg-wa-dark-border">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" className="w-20 h-20 opacity-30 mb-8" />
                                <h1 className={`text-3xl font-light text-[#41525d] dark:text-gray-300 mb-4 ${logoEffect === 'shine' ? 'effect-shine-dark' : logoEffect === 'wave' ? 'effect-wave' : ''}`}>
                                    WhatsApp Web
                                </h1>
                                <p className="text-[#667781] dark:text-gray-400 text-sm">Send and receive messages without keeping your phone online.<br />Use WhatsApp on up to 4 linked devices and 1 phone.</p>
                            </div>
                        } />
                    </Routes>
                </div>
            </div>

            {/* Global Game System UI Overlay */}
            <GlobalGameUI />
            {/* Global Call Overlay */}
            <CallOverlay />
        </div>
    );
};

export default DesktopLayout;
