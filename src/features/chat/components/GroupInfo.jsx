
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Bell, Lock, Search, MoreVertical, Star, ThumbsUp, Trash2, LogOut, Pin, Palette, Check, Grid, Image as ImageIcon, Video as VideoIcon, FileText, BarChart2, ChevronRight, Download, Shield, EyeOff, ChevronDown, Unlock, CircleDashed, Plus, Settings, Ban, UserPlus, QrCode, X, Archive, History } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import { formatTimestamp } from '../../../shared/utils/formatTime';
import StatusViewer from '../../status/components/StatusViewer';
import EditButton from '../../../shared/components/ui/EditButton';

const THEME_COLORS = [
    { name: 'Default', value: '' },
    { name: 'Blue', value: '#d1e4f9' },
    { name: 'Red', value: '#fec5c5' },
    { name: 'Purple', value: '#e2d5f7' },
    { name: 'Orange', value: '#ffe4c4' },
    { name: 'Teal', value: '#ccf2f4' }
];


const GroupInfo = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { chats, messages, currentUser, currentUserId, users, updateChatTheme, toggleChatLock, toggleArchiveChat, securitySettings, chatDocuments, chatSettings, updateGroupRole, updateGroupSettings, addGroupParticipants, updateGroupInfo } = useApp();

    // Tab State
    const [topTab, setTopTab] = useState('public');
    const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);

    // Auth Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authPin, setAuthPin] = useState('');
    const [authError, setAuthError] = useState('');
    const [authMode, setAuthMode] = useState('chat_lock');

    // Media State
    const [mediaFilter, setMediaFilter] = useState('all');
    const [isMediaSectionExpanded, setIsMediaSectionExpanded] = useState(false);

    // Media Privacy Dropdown State (Settings)
    const [isMediaPrivacyOpen, setIsMediaPrivacyOpen] = useState(false);
    const [mediaVisibility, setMediaVisibility] = useState('Default (Yes)');

    // Group Status State
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [groupStatuses, setGroupStatuses] = useState([]);
    const [viewerState, setViewerState] = useState({ isOpen: false, startIndex: 0 });
    const statusFileInputRef = useRef(null);

    // Group Settings & Roles State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showPermissions, setShowPermissions] = useState(false);
    const [expandedAdmins, setExpandedAdmins] = useState(false);
    const menuButtonRef = useRef(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

    // Add Participant State
    const [showAddParticipants, setShowAddParticipants] = useState(false);
    const [participantSearch, setParticipantSearch] = useState('');
    const [selectedToAdd, setSelectedToAdd] = useState(new Set());

    // Archive Action PIN Modal
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [archivePin, setArchivePin] = useState('');
    const [archiveError, setArchiveError] = useState('');

    // Edit Group Info Modals
    const [showEditName, setShowEditName] = useState(false);
    const [showEditDescription, setShowEditDescription] = useState(false);
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupDescription, setEditGroupDescription] = useState('');

    const chat = chats.find(c => c.id === chatId);

    // Initialize mock statuses for group participants
    useEffect(() => {
        if (chat?.isGroup && chat.groupParticipants) {
            const mocks = chat.groupParticipants
                .filter(pid => pid !== currentUserId && Math.random() > 0.6) // Randomly assign statuses to some members
                .map((pid, idx) => ({
                    id: `gs_${pid}_${idx}`,
                    userId: pid,
                    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                    imageUrl: `https://picsum.photos/seed/gs_${pid}/400/800`,
                    caption: `Status update in ${chat.groupName}`,
                    viewed: false
                }));
            setGroupStatuses(mocks);
        }
    }, [chat?.id, chat?.isGroup, chat?.groupName, chat?.groupParticipants, currentUserId]);

    if (!chat) return null;

    const isGroup = chat.isGroup;
    const contact = !isGroup ? users[chat.contactId] : null;
    const chatMessages = messages[chat.id] || [];
    const pinnedMessages = chatMessages.filter(m => m.isPinned);

    // Role Logic
    const myRole = isGroup ? (chat.groupRoles?.[currentUserId] || 'member') : 'member';
    const isOwner = myRole === 'owner';
    const isAdmin = myRole === 'admin' || isOwner;
    const canAddParticipants = isAdmin || chat.groupSettings?.addMembers === 'all';

    // Edit permission check
    const canEditGroupInfo = isGroup && (
        chat.groupSettings?.editInfo === 'all' ||
        (chat.groupSettings?.editInfo === 'admins' && isAdmin)
    );

    // Initialize edit values from chat data
    useEffect(() => {
        if (chat && isGroup) {
            setEditGroupName(chat.groupName || '');
            setEditGroupDescription(chat.groupDescription || '');
        }
    }, [chat, isGroup]);

    // --- Filtering Logic for Locked Dates ---
    const isDateLocked = (timestamp) => {
        try {
            const dateStr = new Date(timestamp).toLocaleDateString();
            return chat.hiddenDates?.includes(dateStr);
        } catch (e) {
            return false;
        }
    };

    // Filter Messages based on visibility (Public vs Private)
    const allImages = chatMessages.filter(m => m.type === 'image');
    const allVideos = chatMessages.filter(m => m.type === 'video');

    const publicImages = allImages.filter(m => !isDateLocked(m.timestamp));
    const publicVideos = allVideos.filter(m => !isDateLocked(m.timestamp));

    const privateImages = allImages.filter(m => isDateLocked(m.timestamp));
    const privateVideos = allVideos.filter(m => isDateLocked(m.timestamp));

    // Documents
    const documents = (chatId && chatDocuments[chatId]) ? chatDocuments[chatId] : [];

    // Determine active media based on tab
    const activeImages = topTab === 'private' ? privateImages : publicImages;
    const activeVideos = topTab === 'private' ? privateVideos : publicVideos;
    const activeAllMedia = [...activeImages, ...activeVideos].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Analysis Calculations (Based on current view)
    const activeMessages = chatMessages.filter(m => topTab === 'private' ? isDateLocked(m.timestamp) : !isDateLocked(m.timestamp));
    const textCount = activeMessages.filter(m => m.type === 'text').length;

    const stats = {
        images: { count: activeImages.length, size: activeImages.length * 1.5, color: '#008069' },
        videos: { count: activeVideos.length, size: activeVideos.length * 15, color: '#34B7F1' },
        docs: { count: documents.length, size: 4.5, color: '#FFB347' },
        text: { count: textCount, size: textCount * 0.0005, color: '#8696a0' }
    };

    const totalSize = stats.images.size + stats.videos.size + stats.docs.size + stats.text.size;
    const totalMsgs = activeMessages.length;

    const title = isGroup ? chat.groupName : contact?.name;
    const subtitle = isGroup ? `Group · ${chat.groupParticipants?.length} participants` : contact?.phone;
    const avatar = isGroup ? 'https://picsum.photos/300' : contact?.avatar;

    // --- Handlers ---

    const handleTabChange = (tab) => {
        if (tab === 'private' && !isPrivateUnlocked) {
            setAuthMode('private_tab');
            setAuthPin('');
            setAuthError('');
            setShowAuthModal(true);
        } else {
            setTopTab(tab);
        }
    };

    const handleChatLockClick = () => {
        setAuthMode('chat_lock');
        setAuthPin('');
        setAuthError('');
        setShowAuthModal(true);
    };

    const handleAuthVerify = () => {
        const requiredPin = authMode === 'private_tab'
            ? (securitySettings.dailyLockPassword || '')
            : (securitySettings.chatLockPassword || '');

        if (authPin === requiredPin) {
            if (authMode === 'private_tab') {
                setIsPrivateUnlocked(true);
                setTopTab('private');
                setShowAuthModal(false);
            } else {
                if (chatId) {
                    toggleChatLock(chatId);
                    setShowAuthModal(false);
                    if (!chat.isLocked) {
                        navigate('/chats');
                    }
                }
            }
        } else {
            setAuthError('Incorrect PIN');
            setAuthPin('');
        }
    };

    const handleStatusUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            const newStatus = {
                id: `gs_me_${Date.now()}`,
                userId: currentUserId,
                timestamp: new Date().toISOString(),
                imageUrl: url,
                caption: 'New group status',
                viewed: false
            };
            setGroupStatuses(prev => [newStatus, ...prev]);
        }
        // Reset input
        if (statusFileInputRef.current) statusFileInputRef.current.value = '';
    };

    const handleToggleAdmin = (participantId) => {
        if (!isOwner || participantId === currentUserId) return;
        const currentRole = chat.groupRoles?.[participantId];
        if (currentRole === 'admin') {
            updateGroupRole(chat.id, participantId, 'member');
        } else {
            updateGroupRole(chat.id, participantId, 'admin');
        }
    };

    const handleMenuToggle = (e) => {
        e.stopPropagation();
        if (!isMenuOpen && menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 5,
                right: window.innerWidth - rect.right
            });
        }
        setIsMenuOpen(!isMenuOpen);
    };

    // --- Add Participant Handlers ---
    const toggleSelectUser = useCallback((userId) => {
        setSelectedToAdd(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) newSet.delete(userId);
            else newSet.add(userId);
            return newSet;
        });
    }, []);

    const handleAddParticipants = useCallback(() => {
        if (selectedToAdd.size === 0 || !chatId) return;
        addGroupParticipants(chatId, Array.from(selectedToAdd));
        setShowAddParticipants(false);
        setSelectedToAdd(new Set());
        setParticipantSearch('');
    }, [selectedToAdd, chatId, addGroupParticipants]);

    // Theme update handlers with logging
    const handleOutgoingTheme = useCallback((colorValue) => {
        console.log('🎨 Outgoing theme button clicked:', colorValue);
        if (chatId) {
            updateChatTheme(chatId, colorValue, 'outgoing');
        }
    }, [chatId, updateChatTheme]);

    const handleIncomingTheme = useCallback((colorValue) => {
        console.log('🎨 Incoming theme button clicked:', colorValue);
        if (chatId) {
            updateChatTheme(chatId, colorValue, 'incoming');
        }
    }, [chatId, updateChatTheme]);

    // Archive action handler with PIN protection
    const handleArchiveAction = () => {
        if (securitySettings.archiveLockPassword && securitySettings.archiveLockPassword !== '') {
            setShowArchiveModal(true);
            setArchivePin('');
            setArchiveError('');
        } else {
            toggleArchiveChat(chatId);
        }
    };

    const verifyArchivePin = () => {
        const requiredPin = securitySettings.archiveLockPassword || '0000';
        if (archivePin === requiredPin) {
            toggleArchiveChat(chatId);
            setShowArchiveModal(false);
            setArchivePin('');
        } else {
            setArchiveError('Incorrect PIN');
            setArchivePin('');
        }
    };

    // --- Edit Group Info Handlers ---
    const handleSaveGroupName = async () => {
        if (!editGroupName.trim() || editGroupName === chat.groupName) {
            setShowEditName(false);
            return;
        }

        const result = await updateGroupInfo(chatId, { groupName: editGroupName.trim() });
        if (result.success) {
            setShowEditName(false);
        }
    };

    const handleSaveGroupDescription = async () => {
        const trimmedDesc = editGroupDescription.trim();
        if (trimmedDesc === (chat.groupDescription || '')) {
            setShowEditDescription(false);
            return;
        }

        const result = await updateGroupInfo(chatId, { groupDescription: trimmedDesc });
        if (result.success) {
            setShowEditDescription(false);
        }
    };

    // --- Render Helpers ---

    const renderMediaContent = (isPrivateContext) => {
        if (!isPrivateContext && chat.isLocked) {
            return (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-gray-50/80 dark:bg-white/5 mx-4 mb-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-wa-grayBg dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 text-gray-500">
                        <Lock size={20} />
                    </div>
                    <h4 className="text-sm font-medium text-[#111b21] dark:text-gray-100">Media Locked</h4>
                    <p className="text-xs text-[#667781] dark:text-gray-500 mt-1 max-w-[220px]">
                        Media is hidden because this chat is locked.
                    </p>
                </div>
            );
        }

        switch (mediaFilter) {
            case 'all':
                return (
                    <div className="p-1">
                        {activeAllMedia.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1">
                                {activeAllMedia.slice(0, 9).map((m) => (
                                    <div key={m.id} className="aspect-square relative cursor-pointer bg-gray-100 dark:bg-gray-800">
                                        {m.type === 'image' && <img src={m.mediaUrl || m.mediaUrls?.[0]} className="w-full h-full object-cover" alt="" />}
                                        {m.type === 'video' && (
                                            <div className="w-full h-full flex items-center justify-center bg-black/10 text-white">
                                                <VideoIcon size={24} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-[#667781] dark:text-gray-500 text-sm bg-white/50 dark:bg-black/20 rounded-lg">
                                {isPrivateContext ? 'No private media found' : 'No public media found'}
                            </div>
                        )}
                        {activeAllMedia.length > 9 && (
                            <button className="w-full py-3 text-wa-teal text-sm font-medium hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors">
                                View all media
                            </button>
                        )}
                    </div>
                );
            case 'images':
                return (
                    <div className="p-1">
                        {activeImages.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1">
                                {activeImages.map((m) => (
                                    <div key={m.id} className="aspect-square relative cursor-pointer">
                                        <img src={m.mediaUrl || m.mediaUrls?.[0]} className="w-full h-full object-cover" alt="" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-[#667781] dark:text-gray-500 text-sm bg-white/50 dark:bg-black/20 rounded-lg">No images found</div>
                        )}
                    </div>
                );
            case 'videos':
                return (
                    <div className="p-1">
                        {activeVideos.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1">
                                {activeVideos.map((m) => (
                                    <div key={m.id} className="aspect-square relative cursor-pointer bg-black/80 flex items-center justify-center text-white">
                                        <VideoIcon size={32} />
                                        <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 px-1 rounded">{m.duration}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-[#667781] dark:text-gray-500 text-sm bg-white/50 dark:bg-black/20 rounded-lg">No videos found</div>
                        )}
                    </div>
                );
            case 'doc':
                if (isPrivateContext) return <div className="py-8 text-center text-[#667781] dark:text-gray-500 text-sm bg-white/50 dark:bg-black/20 rounded-lg">No private documents</div>;

                return (
                    <div className="flex flex-col">
                        {documents.length > 0 ? documents.map(doc => (
                            <div key={doc.id} className="flex items-center gap-3 p-3 hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0 bg-white/60 dark:bg-wa-dark-header/60 backdrop-blur-sm">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-500">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[#111b21] dark:text-gray-100 text-sm font-medium truncate">{doc.name}</h4>
                                    <p className="text-[#667781] dark:text-gray-500 text-xs">{doc.size} • {doc.date} • {doc.type.toUpperCase()}</p>
                                </div>
                                <Download size={18} className="text-[#667781] dark:text-gray-500" />
                            </div>
                        )) : (
                            <div className="py-8 text-center text-[#667781] dark:text-gray-500 text-sm bg-white/50 dark:bg-black/20 rounded-lg">No documents found</div>
                        )}
                    </div>
                );
            case 'analysis':
                const chartData = [
                    { label: 'Videos', value: stats.videos.size, color: stats.videos.color },
                    { label: 'Images', value: stats.images.size, color: stats.images.color },
                    { label: 'Docs', value: stats.docs.size, color: stats.docs.color },
                    { label: 'Text', value: stats.text.size, color: stats.text.color }
                ];
                const R = 36;
                const C = 2 * Math.PI * R;
                let currentOffset = 0;

                return (
                    <div className="p-5 bg-white/60 dark:bg-wa-dark-header/60 backdrop-blur-sm">
                        <div className="flex flex-col items-center mb-6">
                            <h4 className="text-sm font-medium text-[#111b21] dark:text-gray-100 mb-4 self-start">{isPrivateContext ? 'Private Storage' : 'Public Storage'}</h4>
                            <div className="relative w-48 h-48">
                                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                                    <circle cx="50" cy="50" r={R} stroke="#e9edef" strokeWidth="12" fill="none" className="dark:stroke-gray-700" />
                                    {totalSize > 0 && chartData.map((item, i) => {
                                        const percent = item.value / totalSize;
                                        const dashArray = `${percent * C} ${C}`;
                                        const dashOffset = -currentOffset;
                                        currentOffset += percent * C;
                                        return (
                                            <circle
                                                key={item.label}
                                                cx="50" cy="50" r={R}
                                                fill="none"
                                                stroke={item.color}
                                                strokeWidth="12"
                                                strokeDasharray={dashArray}
                                                strokeDashoffset={dashOffset}
                                                className="transition-all duration-500 ease-out"
                                            />
                                        );
                                    })}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-light text-[#111b21] dark:text-gray-100">{totalSize.toFixed(1)}</span>
                                    <span className="text-xs text-[#667781] dark:text-gray-500 uppercase font-medium">MB Used</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6 px-2">
                            {chartData.map(item => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-[#111b21] dark:text-gray-200">{item.label}</span>
                                        <span className="text-xs text-[#667781] dark:text-gray-500">{item.value.toFixed(1)} MB</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                            <h4 className="text-sm font-medium text-[#111b21] dark:text-gray-100 mb-3">{isPrivateContext ? 'Private Activity' : 'Public Activity'}</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#667781] dark:text-gray-400">Total Messages</span>
                                    <span className="font-medium text-[#111b21] dark:text-gray-100">{totalMsgs}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#667781] dark:text-gray-400">Text Messages</span>
                                    <span className="font-medium text-[#111b21] dark:text-gray-100">{stats.text.count}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#667781] dark:text-gray-400">Media Files</span>
                                    <span className="font-medium text-[#111b21] dark:text-gray-100">{stats.images.count + stats.videos.count}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderMediaSection = (isPrivateContext) => (
        <div className="bg-white/90 dark:bg-wa-dark-header/90 backdrop-blur-sm mb-3 shadow-sm transition-colors overflow-hidden rounded-lg">
            <div
                className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50"
                onClick={() => setIsMediaSectionExpanded(!isMediaSectionExpanded)}
            >
                <div className="flex flex-col">
                    <h3 className="text-sm text-[#111b21] dark:text-gray-100 font-medium flex items-center gap-2">
                        {isPrivateContext ? 'Private Media' : 'Media, Docs & Analysis'}
                    </h3>
                    <p className="text-[10px] text-gray-400">
                        {isPrivateContext ? `${activeAllMedia.length} secured files` : `${activeAllMedia.length} files • ${documents.length} docs`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-[#667781] dark:text-gray-500">{isMediaSectionExpanded ? 'Hide' : 'View'}</span>
                    <ChevronRight size={16} className={`text-[#667781] dark:text-gray-400 transition-transform duration-200 ${isMediaSectionExpanded ? 'rotate-90' : ''}`} />
                </div>
            </div>

            {isMediaSectionExpanded && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                    {/* Filter Tabs */}
                    <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-gray-800">
                        {['all', 'images', 'videos', 'doc', 'analysis'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setMediaFilter(f)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors whitespace-nowrap
                                   ${mediaFilter === f
                                        ? 'bg-wa-teal text-white shadow-sm'
                                        : 'bg-gray-100 dark:bg-wa-dark-paper text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                                    }
                               `}
                            >
                                {f === 'doc' ? 'Docs' : f}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="min-h-[150px]">
                        {renderMediaContent(isPrivateContext)}
                    </div>

                    {/* Media Visibility Option (Only if public) */}
                    {mediaFilter !== 'analysis' && !isPrivateContext && !chat.isLocked && (
                        <div className="border-t border-gray-100 dark:border-gray-800">
                            <div
                                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50"
                                onClick={() => setIsMediaPrivacyOpen(!isMediaPrivacyOpen)}
                            >
                                <span className="text-sm text-[#111b21] dark:text-gray-100">Media visibility</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[#667781] dark:text-gray-500">{mediaVisibility}</span>
                                    <ChevronRight size={16} className={`text-[#667781] dark:text-gray-400 transition-transform duration-200 ${isMediaPrivacyOpen ? 'rotate-90' : ''}`} />
                                </div>
                            </div>

                            {isMediaPrivacyOpen && (
                                <div className="px-6 pb-4 animate-in slide-in-from-top-2 duration-200">
                                    <p className="text-xs text-[#667781] dark:text-gray-500 mb-3 leading-relaxed">
                                        Show newly downloaded media from this chat in your device's gallery?
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        {['Default (Yes)', 'Yes', 'No'].map(opt => (
                                            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${mediaVisibility === opt ? 'border-wa-teal' : 'border-gray-400 dark:border-gray-500 group-hover:border-gray-600'}`}>
                                                    {mediaVisibility === opt && <div className="w-2.5 h-2.5 rounded-full bg-wa-teal"></div>}
                                                </div>
                                                <span className="text-sm text-[#111b21] dark:text-gray-100">{opt}</span>
                                                <input
                                                    type="radio"
                                                    name="mediaVisibility"
                                                    className="hidden"
                                                    checked={mediaVisibility === opt}
                                                    onChange={() => setMediaVisibility(opt)}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const containerStyle = chatSettings.contactInfoBackgroundImage ? {
        backgroundImage: `url(${chatSettings.contactInfoBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
    } : {};

    // --- ADD PARTICIPANT SCREEN ---
    if (showAddParticipants) {
        const allUsers = Object.values(users);
        const availableUsers = allUsers.filter(u =>
            u.id !== currentUserId &&
            !chat.groupParticipants?.includes(u.id) &&
            u.name.toLowerCase().includes(participantSearch.toLowerCase())
        );

        return (
            <div className="flex flex-col h-full bg-white dark:bg-wa-dark-bg animate-in slide-in-from-right duration-200">
                <div className="h-[60px] bg-wa-teal dark:bg-wa-dark-header flex items-center px-4 shrink-0 shadow-sm text-white">
                    <button onClick={() => setShowAddParticipants(false)} className="mr-3 p-1 rounded-full active:bg-white/10">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-xl font-medium">Add participants</h2>
                        {selectedToAdd.size > 0 && <span className="text-xs opacity-80">{selectedToAdd.size} selected</span>}
                    </div>
                </div>

                <div className="p-2 border-b border-wa-border dark:border-wa-dark-border bg-white dark:bg-wa-dark-bg">
                    <div className="bg-wa-grayBg dark:bg-wa-dark-input rounded-lg px-4 py-2 flex items-center gap-4 text-wa-gray dark:text-gray-400 h-9">
                        <Search size={18} />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent outline-none text-sm w-full text-black dark:text-white placeholder:text-wa-gray dark:placeholder:text-gray-500"
                            value={participantSearch}
                            onChange={(e) => setParticipantSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Selected Chips */}
                {selectedToAdd.size > 0 && (
                    <div className="flex gap-2 p-2 overflow-x-auto border-b border-wa-border dark:border-wa-dark-border no-scrollbar bg-white dark:bg-wa-dark-bg">
                        {Array.from(selectedToAdd).map((id) => {
                            const u = users[id];
                            return (
                                <div key={id} onClick={() => toggleSelectUser(id)} className="flex items-center gap-1 bg-gray-100 dark:bg-wa-dark-paper rounded-full pl-1 pr-2 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 shrink-0">
                                    <img src={u?.avatar} className="w-5 h-5 rounded-full" alt="" />
                                    <span className="text-xs text-[#111b21] dark:text-gray-200">{u?.name.split(' ')[0]}</span>
                                    <X size={12} className="text-gray-500" />
                                </div>
                            )
                        })}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto pb-20">
                    {availableUsers.map(user => {
                        const isSelected = selectedToAdd.has(user.id);
                        return (
                            <div
                                key={user.id}
                                onClick={() => toggleSelectUser(user.id)}
                                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover active:bg-[#e9edef] dark:active:bg-wa-dark-paper transition-colors"
                            >
                                <div className="relative">
                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                    {isSelected && (
                                        <div className="absolute -bottom-1 -right-1 bg-wa-teal rounded-full p-0.5 border-2 border-white dark:border-wa-dark-bg">
                                            <Check size={10} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 border-b border-wa-border dark:border-wa-dark-border pb-3 -mb-3">
                                    <h3 className={`text-[17px] font-medium ${isSelected ? 'text-[#111b21] dark:text-gray-100' : 'text-[#111b21] dark:text-gray-100'}`}>
                                        {user.name}
                                    </h3>
                                    <p className="text-[14px] text-[#667781] dark:text-gray-500 truncate">{user.about}</p>
                                </div>
                            </div>
                        )
                    })}
                    {availableUsers.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm">No contacts available to add.</div>
                    )}
                </div>

                {selectedToAdd.size > 0 && (
                    <div className="absolute bottom-6 right-6 z-20">
                        <button
                            onClick={handleAddParticipants}
                            className="w-14 h-14 bg-wa-teal rounded-full shadow-lg flex items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all"
                        >
                            <Check size={24} strokeWidth={3} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // --- PERMISSIONS SCREEN ---
    if (showPermissions) {
        return (
            <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-[#111b21] animate-in slide-in-from-right duration-200">
                <div className="h-[60px] bg-wa-teal dark:bg-wa-dark-header flex items-center px-4 shrink-0 shadow-sm text-white">
                    <button onClick={() => setShowPermissions(false)} className="mr-3 p-1 rounded-full active:bg-white/10">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-medium">Group permissions</h2>
                </div>
                <div className="p-4 flex-col gap-4">
                    <div className="bg-white dark:bg-wa-dark-header rounded-lg shadow-sm p-4">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-base text-[#111b21] dark:text-gray-100">Edit group info</h3>
                            <div className={`text-xs px-2 py-1 rounded bg-gray-100 dark:bg-white/10 ${isAdmin ? 'text-green-600' : 'text-gray-500'}`}>
                                {chat.groupSettings?.editInfo === 'all' ? 'All participants' : 'Only admins'}
                            </div>
                        </div>
                        <p className="text-xs text-[#667781] dark:text-gray-500 mb-4">Choose who can change the group's subject, icon, and description.</p>

                        {isAdmin && (
                            <div className="flex gap-2">
                                <button onClick={() => updateGroupSettings(chat.id, { editInfo: 'all' })} className={`flex-1 py-2 text-sm rounded border ${chat.groupSettings?.editInfo === 'all' ? 'border-wa-teal text-wa-teal bg-green-50 dark:bg-green-900/10' : 'border-gray-300 text-gray-500'}`}>All</button>
                                <button onClick={() => updateGroupSettings(chat.id, { editInfo: 'admins' })} className={`flex-1 py-2 text-sm rounded border ${chat.groupSettings?.editInfo === 'admins' ? 'border-wa-teal text-wa-teal bg-green-50 dark:bg-green-900/10' : 'border-gray-300 text-gray-500'}`}>Admins</button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-wa-dark-header rounded-lg shadow-sm p-4 mt-4">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-base text-[#111b21] dark:text-gray-100">Send messages</h3>
                            <div className={`text-xs px-2 py-1 rounded bg-gray-100 dark:bg-white/10 ${isAdmin ? 'text-green-600' : 'text-gray-500'}`}>
                                {chat.groupSettings?.sendMessages === 'all' ? 'All participants' : 'Only admins'}
                            </div>
                        </div>
                        <p className="text-xs text-[#667781] dark:text-gray-500 mb-4">Choose who can send messages to this group.</p>

                        {isAdmin && (
                            <div className="flex gap-2">
                                <button onClick={() => updateGroupSettings(chat.id, { sendMessages: 'all' })} className={`flex-1 py-2 text-sm rounded border ${chat.groupSettings?.sendMessages === 'all' ? 'border-wa-teal text-wa-teal bg-green-50 dark:bg-green-900/10' : 'border-gray-300 text-gray-500'}`}>All</button>
                                <button onClick={() => updateGroupSettings(chat.id, { sendMessages: 'admins' })} className={`flex-1 py-2 text-sm rounded border ${chat.groupSettings?.sendMessages === 'admins' ? 'border-wa-teal text-wa-teal bg-green-50 dark:bg-green-900/10' : 'border-gray-300 text-gray-500'}`}>Admins</button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-wa-dark-header rounded-lg shadow-sm p-4 mt-4">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-base text-[#111b21] dark:text-gray-100">Add other participants</h3>
                            <div className={`text-xs px-2 py-1 rounded bg-gray-100 dark:bg-white/10 ${isAdmin ? 'text-green-600' : 'text-gray-500'}`}>
                                {chat.groupSettings?.addMembers === 'all' ? 'All participants' : 'Only admins'}
                            </div>
                        </div>
                        <p className="text-xs text-[#667781] dark:text-gray-500 mb-4">Choose who can add other participants to this group.</p>

                        {isAdmin && (
                            <div className="flex gap-2">
                                <button onClick={() => updateGroupSettings(chat.id, { addMembers: 'all' })} className={`flex-1 py-2 text-sm rounded border ${chat.groupSettings?.addMembers === 'all' ? 'border-wa-teal text-wa-teal bg-green-50 dark:bg-green-900/10' : 'border-gray-300 text-gray-500'}`}>All</button>
                                <button onClick={() => updateGroupSettings(chat.id, { addMembers: 'admins' })} className={`flex-1 py-2 text-sm rounded border ${chat.groupSettings?.addMembers === 'admins' ? 'border-wa-teal text-wa-teal bg-green-50 dark:bg-green-900/10' : 'border-gray-300 text-gray-500'}`}>Admins</button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-wa-dark-header rounded-lg shadow-sm p-4 mt-4 flex justify-between items-center">
                        <div className="flex-1 mr-4">
                            <h3 className="text-base text-[#111b21] dark:text-gray-100 mb-1">Approve new participants</h3>
                            <p className="text-xs text-[#667781] dark:text-gray-500">When turned on, admins must approve anyone who wants to join the group.</p>
                        </div>
                        <div
                            onClick={() => isAdmin && updateGroupSettings(chat.id, { approveMembers: !chat.groupSettings?.approveMembers })}
                            className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${chat.groupSettings?.approveMembers ? 'bg-wa-teal' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${chat.groupSettings?.approveMembers ? 'translate-x-4' : ''}`}></div>
                        </div>
                    </div>

                    {/* Show History to New Members Toggle (Owner Only) */}
                    {isOwner && (
                        <div className="bg-white dark:bg-wa-dark-header rounded-lg shadow-sm p-4 mt-4 flex justify-between items-center">
                            <div className="flex items-center gap-3 flex-1 mr-4">
                                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center shrink-0">
                                    <History size={18} className="text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base text-[#111b21] dark:text-gray-100 mb-1">Show History to New Members</h3>
                                    <p className="text-xs text-[#667781] dark:text-gray-500">
                                        {chat.settings?.showHistoryToNewMembers !== false
                                            ? 'New members can see all past messages'
                                            : 'New members only see messages after joining'}
                                    </p>
                                </div>
                            </div>
                            <div
                                onClick={() => updateGroupSettings(chat.id, { showHistoryToNewMembers: !(chat.settings?.showHistoryToNewMembers !== false) })}
                                className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${(chat.settings?.showHistoryToNewMembers !== false) ? 'bg-wa-teal' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${(chat.settings?.showHistoryToNewMembers !== false) ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </div>
                    )}

                    {isOwner && (
                        <div className="bg-white dark:bg-wa-dark-header rounded-lg shadow-sm mt-4 overflow-hidden">
                            <div
                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                                onClick={() => setExpandedAdmins(!expandedAdmins)}
                            >
                                <h3 className="text-base text-[#111b21] dark:text-gray-100">Edit group admins</h3>
                                <ChevronDown size={20} className={`transition-transform ${expandedAdmins ? 'rotate-180' : ''}`} />
                            </div>

                            {expandedAdmins && (
                                <div className="border-t border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto">
                                    {chat.groupParticipants?.filter(pid => pid !== currentUserId).map(pid => {
                                        const u = users[pid];
                                        const role = chat.groupRoles?.[pid];
                                        return (
                                            <div key={pid} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5">
                                                <div className="flex items-center gap-3">
                                                    <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                                                    <span className="text-sm font-medium dark:text-gray-200">{u.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleAdmin(pid)}
                                                    className={`text-xs px-3 py-1.5 rounded-full border ${role === 'admin' ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                                >
                                                    {role === 'admin' ? 'Dismiss' : 'Make Admin'}
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex flex-col h-full overflow-y-auto relative ${!chatSettings.contactInfoBackgroundImage ? 'bg-[#f0f2f5] dark:bg-[#0b141a]' : ''}`}
            style={containerStyle}
        >
            {/* Viewer Portal */}
            {viewerState.isOpen && (
                <StatusViewer
                    updates={groupStatuses}
                    initialIndex={viewerState.startIndex}
                    onClose={() => setViewerState({ isOpen: false, startIndex: 0 })}
                />
            )}

            {/* AUTH MODAL */}
            {showAuthModal && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl w-full max-w-xs p-6 flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 text-white ${authMode === 'private_tab' ? 'bg-blue-500' : 'bg-wa-teal'}`}>
                            {authMode === 'private_tab' ? <Shield size={24} /> : <Lock size={24} />}
                        </div>
                        <h3 className="text-lg font-medium text-[#111b21] dark:text-gray-100 mb-2">
                            {authMode === 'private_tab' ? 'Private Access' : (chat.isLocked ? 'Unlock Chat' : 'Lock Chat')}
                        </h3>
                        <p className="text-sm text-[#667781] dark:text-gray-400 mb-6 text-center">
                            Enter {authMode === 'private_tab' ? 'Daily Lock PIN' : 'Chat Lock PIN'}
                        </p>

                        <input
                            type="password"
                            maxLength={4}
                            value={authPin}
                            onChange={(e) => {
                                setAuthPin(e.target.value);
                                setAuthError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleAuthVerify()}
                            className="w-full text-center text-2xl tracking-[0.5em] font-medium py-2 border-b-2 border-wa-teal bg-transparent outline-none mb-2 text-[#111b21] dark:text-gray-100 placeholder-transparent"
                            placeholder="****"
                            autoFocus
                        />

                        {authError && <p className="text-red-500 text-xs mb-4">{authError}</p>}

                        <div className="flex gap-3 w-full mt-4">
                            <button onClick={() => setShowAuthModal(false)} className="flex-1 py-2 text-wa-teal font-medium hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover rounded-full transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleAuthVerify} className="flex-1 py-2 bg-wa-teal text-white font-medium rounded-full shadow-sm hover:shadow-md transition-all">
                                Verify
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ARCHIVE ACTION PIN MODAL */}
            {showArchiveModal && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl w-full max-w-xs p-6 flex flex-col items-center">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-4 text-white">
                            <Archive size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-[#111b21] dark:text-gray-100 mb-2">Archive Lock</h3>
                        <p className="text-sm text-[#667781] dark:text-gray-400 mb-6 text-center">
                            Enter PIN to {chat.isArchived ? 'unarchive' : 'archive'} chat
                        </p>

                        <input
                            type="password"
                            maxLength={4}
                            value={archivePin}
                            onChange={(e) => {
                                setArchivePin(e.target.value);
                                setArchiveError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && verifyArchivePin()}
                            className="w-full text-center text-2xl tracking-[0.5em] font-medium py-2 border-b-2 border-purple-500 bg-transparent outline-none mb-2 text-[#111b21] dark:text-gray-100 placeholder-transparent"
                            placeholder="****"
                            autoFocus
                        />

                        {archiveError && <p className="text-red-500 text-xs mb-4">{archiveError}</p>}

                        <div className="flex gap-3 w-full mt-4">
                            <button onClick={() => setShowArchiveModal(false)} className="flex-1 py-2 text-purple-500 font-medium hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover rounded-full transition-colors">
                                Cancel
                            </button>
                            <button onClick={verifyArchivePin} className="flex-1 py-2 bg-purple-500 text-white font-medium rounded-full shadow-sm hover:shadow-md transition-all">
                                Unlock
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* When bg image is set, add overlay */}
            {chatSettings.contactInfoBackgroundImage && (
                <div className="fixed inset-0 bg-white/40 dark:bg-black/40 pointer-events-none z-0 backdrop-blur-[2px]"></div>
            )}

            {/* Header */}
            <div className="h-[60px] bg-white/90 dark:bg-wa-dark-header/90 backdrop-blur-md flex items-center justify-between px-4 shrink-0 shadow-sm sticky top-0 z-10 transition-colors">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/chat/${chatId}`)} className="text-wa-gray dark:text-gray-400">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-lg text-[#111b21] dark:text-gray-100 font-medium">
                        {isGroup ? 'Group Info' : 'User Info'}
                    </h2>
                </div>

                {/* Settings Menu for Groups */}
                {isGroup && (
                    <div className="relative">
                        <button
                            ref={menuButtonRef}
                            onClick={handleMenuToggle}
                            className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-wa-gray dark:text-gray-400 transition-colors"
                        >
                            <MoreVertical size={22} />
                        </button>
                        {isMenuOpen && createPortal(
                            <>
                                <div className="fixed inset-0 z-[60]" onClick={() => setIsMenuOpen(false)}></div>
                                <div
                                    className="fixed w-48 bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl border border-wa-border dark:border-gray-700 z-[61] py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                                    style={{ top: menuPos.top, right: menuPos.right }}
                                >
                                    <button onClick={() => { setIsMenuOpen(false); setShowPermissions(true); }} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-wa-dark-hover text-[#111b21] dark:text-gray-100 text-[15px]">Group permissions</button>
                                </div>
                            </>,
                            document.body
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 pb-10 relative z-10">
                <div className="bg-white/90 dark:bg-wa-dark-header/90 backdrop-blur-sm flex flex-col items-center py-6 mb-3 shadow-sm transition-colors rounded-b-lg">

                    {/* 3D Flip Profile Container */}
                    <div className="relative w-28 h-28 mb-4 group cursor-pointer perspective-[1000px]">
                        <div className="relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                            {/* Front Face - Profile Picture */}
                            <div className="absolute inset-0 w-full h-full [backface-visibility:hidden]">
                                <img
                                    src={avatar}
                                    alt="Avatar"
                                    className="w-full h-full rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-wa-dark-bg"
                                />
                            </div>

                            {/* Back Face - QR Code */}
                            <div className="absolute inset-0 w-full h-full rounded-full bg-white flex items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-sm ring-2 ring-wa-teal overflow-hidden">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${chatId}`}
                                    alt="QR Code"
                                    className="w-3/4 h-3/4 object-contain opacity-90"
                                />
                            </div>
                        </div>
                        {/* Small visual cue for flip interaction */}
                        <div className="absolute bottom-0 right-0 bg-white dark:bg-wa-dark-paper rounded-full p-1 shadow-md opacity-80 group-hover:opacity-0 transition-opacity">
                            <QrCode size={12} className="text-wa-teal" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl text-[#111b21] dark:text-gray-100 font-normal">{title}</h1>
                        {isGroup && canEditGroupInfo && (
                            <EditButton
                                onClick={() => setShowEditName(true)}
                                size={18}
                            />
                        )}
                    </div>
                    <p className="text-[#667781] dark:text-gray-500 text-base mb-2">{subtitle}</p>

                    {/* Group Description */}
                    {isGroup && (
                        <div className="flex items-center justify-center gap-2 px-6 max-w-md mx-auto">
                            <p className="text-[#667781] dark:text-gray-400 text-sm text-center italic">
                                {chat.groupDescription || 'No description'}
                            </p>
                            {canEditGroupInfo && (
                                <EditButton
                                    onClick={() => setShowEditDescription(true)}
                                    size={14}
                                />
                            )}
                        </div>
                    )}

                    {/* Public / Private Toggle */}
                    <div className="flex p-1 bg-gray-100 dark:bg-wa-dark-paper rounded-lg w-64 shadow-inner mt-4">
                        <button
                            onClick={() => handleTabChange('public')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${topTab === 'public' ? 'bg-white dark:bg-wa-dark-header text-wa-teal shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Public
                        </button>
                        <button
                            onClick={() => handleTabChange('private')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${topTab === 'private' ? 'bg-white dark:bg-wa-dark-header text-wa-teal shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Private
                            {!isPrivateUnlocked && <Lock size={12} />}
                        </button>
                    </div>
                </div>

                {/* PUBLIC TAB CONTENT */}
                {topTab === 'public' && (
                    <>
                        <div className="bg-white/90 dark:bg-wa-dark-header/90 backdrop-blur-sm mb-3 shadow-sm transition-colors rounded-lg">
                            <div className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50">
                                <div className="w-6 flex justify-center text-wa-gray dark:text-gray-400"><Bell size={22} /></div>
                                <div className="flex-1">
                                    <h3 className="text-base text-[#111b21] dark:text-gray-100">Notifications</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50">
                                <div className="w-6 flex justify-center text-wa-gray dark:text-gray-400"><Search size={22} /></div>
                                <div className="flex-1">
                                    <h3 className="text-base text-[#111b21] dark:text-gray-100">Search messages</h3>
                                </div>
                            </div>
                        </div>

                        {renderMediaSection(false)}

                        {/* GROUP STATUS SECTION - ONLY VISIBLE FOR GROUPS */}
                        {isGroup && (
                            <div className="bg-white/90 dark:bg-wa-dark-header/90 backdrop-blur-sm mb-3 shadow-sm transition-colors overflow-hidden rounded-lg">
                                <div
                                    className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50"
                                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                >
                                    <div className="flex flex-col">
                                        <h3 className="text-sm text-[#667781] dark:text-gray-400 font-medium flex items-center gap-2">
                                            Group Status
                                            <ChevronDown size={14} className={`transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                                        </h3>
                                        <p className="text-[10px] text-gray-400">
                                            {groupStatuses.length} updates
                                        </p>
                                    </div>
                                    <CircleDashed size={20} className="text-[#667781] dark:text-gray-400" />
                                </div>

                                {isStatusDropdownOpen && (
                                    <div className="p-4 overflow-x-auto no-scrollbar flex gap-4 animate-in slide-in-from-top-2 duration-200">
                                        {/* Add Status Button */}
                                        <div className="flex flex-col items-center gap-1 cursor-pointer shrink-0" onClick={() => statusFileInputRef.current?.click()}>
                                            <div className="relative w-14 h-14">
                                                <img src={currentUser.avatar} className="w-full h-full rounded-full object-cover opacity-80" alt="Me" />
                                                <div className="absolute bottom-0 right-0 bg-wa-teal text-white rounded-full p-1 border-2 border-white dark:border-wa-dark-bg">
                                                    <Plus size={12} strokeWidth={3} />
                                                </div>
                                            </div>
                                            <span className="text-xs text-[#111b21] dark:text-gray-100 font-medium mt-1">Add</span>
                                        </div>

                                        <input type="file" ref={statusFileInputRef} className="hidden" accept="image/*,video/*" onChange={handleStatusUpload} />

                                        {/* List Statuses */}
                                        {groupStatuses.map((status, idx) => {
                                            const u = users[status.userId] || (status.userId === currentUserId ? currentUser : null);
                                            if (!u) return null;
                                            return (
                                                <div key={status.id} className="flex flex-col items-center gap-1 cursor-pointer shrink-0" onClick={() => setViewerState({ isOpen: true, startIndex: idx })}>
                                                    <div className="w-14 h-14 rounded-full p-[2px] border-2 border-wa-teal">
                                                        <img src={u.avatar} className="w-full h-full rounded-full object-cover" alt={u.name} />
                                                    </div>
                                                    <span className="text-xs text-[#111b21] dark:text-gray-100 font-medium mt-1 w-16 truncate text-center">{u.name.split(' ')[0]}</span>
                                                </div>
                                            )
                                        })}

                                        {groupStatuses.length === 0 && (
                                            <div className="flex items-center justify-center text-xs text-gray-400 italic px-4">
                                                No recent updates
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-white/90 dark:bg-wa-dark-header/90 backdrop-blur-sm mb-3 shadow-sm transition-colors px-6 py-6 rounded-lg">
                            {/* Theme Selectors */}
                            <div className="mb-8 mt-2">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-6 flex justify-center text-wa-gray dark:text-gray-400">
                                        <Palette size={22} />
                                    </div>
                                    <h3 className="text-base text-[#111b21] dark:text-gray-100 font-medium">My Message Theme</h3>
                                </div>
                                <div className="flex gap-4 pl-10 overflow-x-auto no-scrollbar pb-2 -mr-6 pr-6">
                                    {THEME_COLORS.map((color) => {
                                        const isSelected = (chat.userSettings?.themeColor || chat.themeColor || '') === color.value;
                                        return (
                                            <button
                                                key={color.name}
                                                onClick={() => handleOutgoingTheme(color.value)}
                                                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center relative shadow-sm transition-transform hover:scale-105 ${isSelected ? 'border-2 border-wa-teal' : 'border-2 border-gray-200 dark:border-gray-600'}`}
                                                style={{ backgroundColor: color.value || '#D9FDD3' }}
                                                title={color.name}
                                            >
                                                {isSelected && <Check size={16} strokeWidth={3} className="text-black/60" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-6 flex justify-center text-wa-gray dark:text-gray-400">
                                        <Palette size={22} />
                                    </div>
                                    <h3 className="text-base text-[#111b21] dark:text-gray-100 font-medium">Sender Message Theme</h3>
                                </div>
                                <div className="flex gap-4 pl-10 overflow-x-auto no-scrollbar pb-2 -mr-6 pr-6">
                                    {THEME_COLORS.map((color) => {
                                        const isSelected = (chat.userSettings?.incomingThemeColor || chat.incomingThemeColor || '') === color.value;
                                        return (
                                            <button
                                                key={color.name}
                                                onClick={() => handleIncomingTheme(color.value)}
                                                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center relative shadow-sm transition-transform hover:scale-105 ${isSelected ? 'border-2 border-wa-teal' : 'border-2 border-gray-200 dark:border-gray-600'}`}
                                                style={{ backgroundColor: color.value || '#FFFFFF' }}
                                                title={color.name}
                                            >
                                                {isSelected && <Check size={16} strokeWidth={3} className="text-black/60" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Archive Toggle */}
                            <div className="flex items-center gap-4 cursor-pointer py-2 mb-4" onClick={handleArchiveAction}>
                                <div className="w-6 flex justify-center text-wa-gray dark:text-gray-400"><Archive size={22} /></div>
                                <div className="flex-1">
                                    <h3 className="text-base text-[#111b21] dark:text-gray-100">Archive Chat</h3>
                                    <p className="text-xs text-[#667781] dark:text-gray-500">Hide this chat in archived folder</p>
                                </div>
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${chat.isArchived ? 'bg-wa-teal' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${chat.isArchived ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>

                            {/* Chat Lock Toggle */}
                            <div className="flex items-center gap-4 cursor-pointer py-2" onClick={handleChatLockClick}>
                                <div className="w-6 flex justify-center text-wa-gray dark:text-gray-400"><Lock size={22} /></div>
                                <div className="flex-1">
                                    <h3 className="text-base text-[#111b21] dark:text-gray-100">Chat Lock</h3>
                                    <p className="text-xs text-[#667781] dark:text-gray-500">Require PIN to access this chat</p>
                                </div>
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${chat.isLocked ? 'bg-wa-teal' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${chat.isLocked ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>
                        </div>

                        {pinnedMessages.length > 0 && (
                            <div className="bg-white/90 dark:bg-wa-dark-header/90 backdrop-blur-sm mb-3 shadow-sm transition-colors rounded-lg overflow-hidden">
                                <div className="px-6 py-3 text-sm text-wa-teal dark:text-wa-teal font-medium uppercase bg-white/50 dark:bg-black/10">
                                    {pinnedMessages.length} Pinned Messages
                                </div>
                                {pinnedMessages.map(msg => (
                                    <div key={msg.id} className="px-6 py-3 hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50 cursor-pointer border-t border-wa-border dark:border-wa-dark-border">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-wa-gray dark:text-gray-400">
                                                {msg.senderId === currentUserId ? 'You' : users[msg.senderId]?.name}
                                            </span>
                                            <span className="text-xs text-wa-gray dark:text-gray-500">
                                                {formatTimestamp(msg.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#111b21] dark:text-gray-200 line-clamp-2">{msg.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isGroup && contact?.about && (
                            <div className="bg-white/90 dark:bg-wa-dark-header/90 backdrop-blur-sm mb-3 shadow-sm px-6 py-4 transition-colors rounded-lg">
                                <h3 className="text-sm text-wa-teal dark:text-wa-teal font-medium mb-1">About</h3>
                                <p className="text-base text-[#111b21] dark:text-gray-100">{contact.about}</p>
                            </div>
                        )}

                        {isGroup && (
                            <div className="bg-white/90 dark:bg-wa-dark-header/90 backdrop-blur-sm mb-3 shadow-sm transition-colors rounded-lg overflow-hidden">
                                <div className="px-6 py-3 text-sm text-[#667781] dark:text-gray-400 bg-white/50 dark:bg-black/10">
                                    {chat.groupParticipants?.length} participants
                                </div>

                                {canAddParticipants && (
                                    <div
                                        className="flex items-center gap-4 px-6 py-3 hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50 cursor-pointer"
                                        onClick={() => setShowAddParticipants(true)}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-wa-teal flex items-center justify-center text-white shrink-0">
                                            <UserPlus size={22} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-base text-[#111b21] dark:text-gray-100">Add participants</h3>
                                        </div>
                                    </div>
                                )}

                                {chat.groupParticipants?.map(pid => {
                                    const user = users[pid] || (pid === currentUserId ? currentUser : null);
                                    if (!user) return null;
                                    const role = chat.groupRoles?.[pid];

                                    return (
                                        <div key={pid} className="flex items-center gap-4 px-6 py-3 hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50 cursor-pointer relative group">
                                            <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="text-base text-[#111b21] dark:text-gray-100">
                                                        {user.name} {pid === currentUserId && '(You)'}
                                                    </h3>
                                                    {role && role !== 'member' && (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${role === 'owner' ? 'border-blue-200 text-blue-600 bg-blue-50' : 'border-green-200 text-green-600 bg-green-50'}`}>
                                                            {role === 'owner' ? 'Group Creator' : 'Group Admin'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#667781] dark:text-gray-500">{user.about}</p>
                                            </div>

                                            {/* Inline Admin Action (Owner only) */}
                                            {isOwner && pid !== currentUserId && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleToggleAdmin(pid); }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex px-3 py-1 bg-white dark:bg-wa-dark-paper shadow-sm rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700"
                                                >
                                                    {role === 'admin' ? 'Dismiss Admin' : 'Make Admin'}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        <div className="bg-white/90 dark:bg-wa-dark-header/90 backdrop-blur-sm shadow-sm transition-colors rounded-lg overflow-hidden">
                            {/* Exit Group (Only for groups) */}
                            {isGroup && (
                                <div className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50 text-red-500">
                                    <div className="w-6 flex justify-center"><LogOut size={22} /></div>
                                    <h3 className="text-base">Exit group</h3>
                                </div>
                            )}

                            {/* Report */}
                            <div className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50 text-red-500">
                                <div className="w-6 flex justify-center"><Trash2 size={22} /></div>
                                <h3 className="text-base">Report {isGroup ? 'group' : 'user'}</h3>
                            </div>

                            {/* Block (Only for users) */}
                            {!isGroup && (
                                <div className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50 text-red-500">
                                    <div className="w-6 flex justify-center"><Ban size={22} /></div>
                                    <h3 className="text-base">Block {contact?.name || 'user'}</h3>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* PRIVATE TAB CONTENT */}
                {topTab === 'private' && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                        <div className="mx-4 mb-4 p-4 bg-blue-50/90 dark:bg-blue-900/40 rounded-lg border border-blue-100 dark:border-blue-900/30 flex gap-3 backdrop-blur-sm">
                            <Shield size={24} className="text-blue-500 shrink-0" />
                            <div className="flex-col">
                                <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">Private Secure Zone</h3>
                                <p className="text-xs text-blue-600 dark:text-blue-300">
                                    Items in this tab are encrypted and require authentication to view.
                                </p>
                            </div>
                        </div>

                        {renderMediaSection(true)}

                        <div className="bg-white/90 dark:bg-wa-dark-header/90 backdrop-blur-sm mb-3 shadow-sm transition-colors px-6 py-4 mt-3 rounded-lg">
                            <div className="flex items-center gap-4 opacity-50">
                                <div className="w-6 flex justify-center text-wa-gray dark:text-gray-400"><EyeOff size={22} /></div>
                                <div className="flex-1">
                                    <h3 className="text-base text-[#111b21] dark:text-gray-100">Hidden Messages</h3>
                                    <p className="text-xs text-[#667781] dark:text-gray-500">
                                        {chat.hiddenDates?.length || 0} locked dates found
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/90 dark:bg-wa-dark-header/90 backdrop-blur-sm shadow-sm transition-colors px-6 py-4 rounded-lg">
                            <button
                                onClick={() => { setIsPrivateUnlocked(false); setTopTab('public'); }}
                                className="w-full py-2 border border-wa-teal text-wa-teal rounded-full font-medium text-sm hover:bg-wa-grayBg/50 dark:hover:bg-wa-dark-hover/50 transition-colors"
                            >
                                Lock Private View
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* EDIT GROUP NAME MODAL */}
            {
                showEditName && createPortal(
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl w-full max-w-sm p-6">
                            <h3 className="text-lg font-medium text-[#111b21] dark:text-gray-100 mb-4">Edit Group Name</h3>
                            <input
                                type="text"
                                value={editGroupName}
                                onChange={(e) => setEditGroupName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveGroupName()}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                     bg-white dark:bg-wa-dark-input text-[#111b21] dark:text-gray-100 
                                     outline-none focus:border-wa-teal transition-colors"
                                placeholder="Enter group name"
                                autoFocus
                                maxLength={50}
                            />
                            <p className="text-xs text-gray-500 mt-1">{editGroupName.length}/50</p>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowEditName(false);
                                        setEditGroupName(chat.groupName || '');
                                    }}
                                    className="flex-1 py-2 text-wa-teal font-medium hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover rounded-full transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveGroupName}
                                    disabled={!editGroupName.trim()}
                                    className="flex-1 py-2 bg-wa-teal text-white font-medium rounded-full shadow-sm 
                                         hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* EDIT GROUP DESCRIPTION MODAL */}
            {
                showEditDescription && createPortal(
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl w-full max-w-sm p-6">
                            <h3 className="text-lg font-medium text-[#111b21] dark:text-gray-100 mb-4">Edit Group Description</h3>
                            <textarea
                                value={editGroupDescription}
                                onChange={(e) => setEditGroupDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                     bg-white dark:bg-wa-dark-input text-[#111b21] dark:text-gray-100 
                                     outline-none focus:border-wa-teal transition-colors resize-none"
                                placeholder="Add a group description"
                                rows={4}
                                autoFocus
                                maxLength={200}
                            />
                            <p className="text-xs text-gray-500 mt-1">{editGroupDescription.length}/200</p>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowEditDescription(false);
                                        setEditGroupDescription(chat.groupDescription || '');
                                    }}
                                    className="flex-1 py-2 text-wa-teal font-medium hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover rounded-full transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveGroupDescription}
                                    className="flex-1 py-2 bg-wa-teal text-white font-medium rounded-full shadow-sm 
                                         hover:shadow-md transition-all">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div>
    );
};

export default GroupInfo;
