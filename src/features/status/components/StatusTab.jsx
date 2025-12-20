
import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Edit2, Archive, ChevronDown, ChevronUp, MoreVertical, ArrowLeft, Plus, Camera } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import { formatTimestamp } from '../../../shared/utils/formatTime';
import StatusViewer from './StatusViewer';
import StatusItem from './StatusItem';
import ChannelSuggestions from './ChannelSuggestions';
import NearbyFriendsSection from './NearbyFriendsSection';
// import MediaEditor from './media/MediaEditor'; // TODO: Create MediaEditor component



const StatusTab = () => {
    const navigate = useNavigate();
    const { users, currentUserId, statusUpdates, channels, addStatusUpdate, searchQuery, chats, securitySettings, statusPrivacy } = useApp();
    const myStatusUser = users[currentUserId];

    // UI States
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
    const [isViewedExpanded, setIsViewedExpanded] = useState(false);
    const [showArchiveAuth, setShowArchiveAuth] = useState(false);
    const [authPin, setAuthPin] = useState('');
    const [authError, setAuthError] = useState('');

    // Dropdown States
    const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(true);
    const [isNearbyExpanded, setIsNearbyExpanded] = useState(false);

    const [radiusFilter, setRadiusFilter] = useState(5); // km - This state might be moved to NearbyFriendsSection if not shared

    // Upload State
    const fileInputRef = useRef(null);
    const [uploadPreview, setUploadPreview] = useState(null);

    // Viewer State
    const [viewerState, setViewerState] = useState({ isOpen: false, updates: [], startIndex: 0 });

    // --- Filtering Logic ---
    const { myUpdates, recentUpdates, viewedUpdates, archivedUpdates } = useMemo(() => {
        const archivedContactIds = new Set(
            chats.filter(c => c.isArchived).map(c => c.contactId)
        );

        const filtered = statusUpdates.filter(s => {
            if (!searchQuery) {
                // Filter out updates older than 24 hours
                const updateTime = new Date(s.timestamp).getTime();
                const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
                if (updateTime < twentyFourHoursAgo) return false;
            }

            const user = users[s.userId];
            return user && user.name.toLowerCase().includes(searchQuery.toLowerCase());
        });

        const myBucket = [];
        const archivedBucket = [];
        const recentBucket = [];
        const viewedBucket = [];

        filtered.forEach(s => {
            if (s.userId === currentUserId) {
                myBucket.push(s);
            } else if (archivedContactIds.has(s.userId)) {
                archivedBucket.push(s);
            } else {
                if (s.viewed) viewedBucket.push(s);
                else recentBucket.push(s);
            }
        });

        return {
            myUpdates: myBucket,
            archivedUpdates: archivedBucket,
            recentUpdates: recentBucket,
            viewedUpdates: viewedBucket
        };
    }, [statusUpdates, chats, currentUserId, searchQuery, users]);



    // --- Handlers ---

    const handleArchiveHeaderClick = () => {
        if (isArchiveExpanded) {
            setIsArchiveExpanded(false);
        } else {
            setAuthPin('');
            setAuthError('');
            setShowArchiveAuth(true);
        }
    };

    const verifyArchivePin = (e) => {
        e?.preventDefault();
        const requiredPin = securitySettings.chatLockPassword || '0000';
        if (authPin === requiredPin) {
            setShowArchiveAuth(false);
            setIsArchiveExpanded(true);
        } else {
            setAuthError('Incorrect PIN');
            setAuthPin('');
        }
    };

    const openViewer = (updates, startIndex) => {
        setViewerState({ isOpen: true, updates, startIndex });
    };

    const closeViewer = () => {
        setViewerState(prev => ({ ...prev, isOpen: false }));
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            setUploadPreview({ url, file, type });
        }
        e.target.value = '';
    };

    const handleSendStatus = (caption) => {
        if (uploadPreview) {
            const newStatus = {
                id: `s_${Date.now()}`,
                userId: currentUserId,
                timestamp: new Date().toISOString(),
                imageUrl: uploadPreview.url,
                caption: caption,
                viewed: false
            };
            addStatusUpdate(newStatus);
            setUploadPreview(null);
        }
    };

    const triggerUpload = (e) => {
        e?.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleMyStatusClick = () => {
        if (myUpdates.length > 0) {
            openViewer(myUpdates, 0);
        } else {
            triggerUpload();
        }
    };

    const getPrivacyLabel = (type) => {
        switch (type) {
            case 'all': return 'Status (All Friends)';
            case 'followers': return 'Status (Followers)';
            case 'followings': return 'Status (Followings)';
            case 'archive': return 'Status (Archive)';
            case 'contacts': return 'Status (Contacts)';
            case 'except': return 'Status (Custom)';
            case 'only': return 'Status (Custom)';
            default: return 'Status (All)';
        }
    };

    if (!myStatusUser) return null;

    const hasUnviewedArchived = archivedUpdates.some(s => !s.viewed);

    return (
        <div className="flex flex-col pb-20 bg-white dark:bg-wa-dark-bg min-h-full relative">

            {/* Desktop Header with Back Button - Only visible on md+ screens */}
            <div className="hidden md:flex h-[60px] bg-wa-grayBg dark:bg-wa-dark-header items-center gap-3 px-4 shrink-0 border-b border-wa-border dark:border-wa-dark-border text-[#111b21] dark:text-gray-100 transition-colors sticky top-0 z-10">
                <button onClick={() => navigate('/chats')} className="p-2 -ml-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-medium md:text-lg">Status</h2>
            </div>

            {/* Mobile Header Row for Status */}
            <div className="flex items-center justify-between px-4 py-4 md:hidden">
                <h1 className="text-xl font-medium text-[#111b21] dark:text-gray-100">Status</h1>
                <div className="relative">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <MoreVertical size={20} className="text-[#54656f] dark:text-gray-400" />
                    </button>
                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl border border-wa-border dark:border-gray-700 z-50 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                <button onClick={() => { setIsMenuOpen(false); navigate('/status/privacy'); }} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-wa-dark-hover text-[#111b21] dark:text-gray-100 text-[15px]">Status privacy</button>
                                <button onClick={() => setIsMenuOpen(false)} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-wa-dark-hover text-[#111b21] dark:text-gray-100 text-[15px]">Settings</button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
            />

            {/* Archive Lock Modal */}
            {showArchiveAuth && (
                // ... (Modal Content kept same as before, simplified for this snippet) ...
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-wa-dark-paper rounded-xl shadow-2xl w-full max-w-xs p-6 flex flex-col items-center">
                        <Lock size={24} className="mb-4 text-wa-teal" />
                        <h3 className="text-lg font-medium text-[#111b21] dark:text-gray-100 mb-2">Locked Status</h3>
                        <input type="password" value={authPin} onChange={e => setAuthPin(e.target.value)} className="border-b-2 border-wa-teal outline-none text-center text-xl w-full mb-4 bg-transparent dark:text-white" autoFocus />
                        {authError && <p className="text-red-500 text-xs mb-2">{authError}</p>}
                        <button onClick={(e) => verifyArchivePin(e)} className="w-full bg-wa-teal text-white py-2 rounded-full">Unlock</button>
                        <button onClick={() => setShowArchiveAuth(false)} className="w-full text-wa-teal py-2 mt-2">Cancel</button>
                    </div>
                </div>
            )}

            {/* Media Editor for Upload */}
            {/*
            {uploadPreview && (
                <MediaEditor
                    file={uploadPreview}
                    onClose={() => setUploadPreview(null)}
                    onSend={handleSendStatus}
                    footerElement={
                        <div
                            onClick={() => { setUploadPreview(null); navigate('/status/privacy'); }}
                            className="bg-[#1f2c34] hover:bg-[#2a3942] rounded-full px-3 py-1.5 flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                            <div className="text-gray-300 text-[11px] font-medium flex items-center gap-1">
                                {getPrivacyLabel(statusPrivacy)}
                            </div>
                        </div>
                    }
                />
            )}

            {viewerState.isOpen && (
                <StatusViewer
                    updates={viewerState.updates}
                    initialIndex={viewerState.startIndex}
                    onClose={closeViewer}
                />
            )}

            {/* My Status */}
            {(!searchQuery || myStatusUser.name.toLowerCase().includes(searchQuery.toLowerCase())) && (
                <div
                    onClick={handleMyStatusClick}
                    className="flex items-center gap-4 px-4 py-4 cursor-pointer active:bg-wa-grayBg dark:active:bg-wa-dark-paper hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors group"
                >
                    <div className="relative">
                        <div className={`p-[2px] rounded-full border-2 ${myUpdates.length > 0 ? 'border-wa-lightGreen' : 'border-transparent'}`}>
                            <img src={myStatusUser.avatar} alt="Me" className="w-12 h-12 rounded-full object-cover" />
                        </div>
                        {myUpdates.length === 0 && (
                            <div className="absolute bottom-0 right-0 bg-wa-lightGreen rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-wa-dark-bg text-white">
                                <Plus size={14} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[17px] text-[#111b21] dark:text-gray-200 font-medium">My Status</h3>
                        <p className="text-[13px] text-[#667781] dark:text-gray-500">
                            {myUpdates.length > 0 ? formatTimestamp(myUpdates[0].timestamp) : 'Tap to add status update'}
                        </p>
                    </div>
                </div>
            )}

            {/* Archived Status Dropdown */}
            {archivedUpdates.length > 0 && (
                <div className="border-t border-wa-border dark:border-wa-dark-border">
                    <div
                        onClick={handleArchiveHeaderClick}
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover active:bg-[#e9edef] dark:active:bg-wa-dark-paper transition-colors"
                    >
                        <div className="flex items-center gap-4 opacity-90">
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-transparent">
                                <Archive size={20} className="text-[#667781] dark:text-gray-400" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-[17px] text-[#111b21] dark:text-gray-200 font-medium flex items-center gap-2">
                                    Archived updates
                                    {!isArchiveExpanded && hasUnviewedArchived && (
                                        <div className="w-2 h-2 rounded-full bg-wa-lightGreen animate-pulse"></div>
                                    )}
                                </h3>
                                {!isArchiveExpanded && (
                                    <p className="text-[13px] text-[#667781] dark:text-gray-500">{archivedUpdates.length} updates hidden</p>
                                )}
                            </div>
                        </div>
                        <div className="text-[#667781] dark:text-gray-400">
                            {isArchiveExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    </div>

                    {isArchiveExpanded && (
                        <div className="animate-in slide-in-from-top-2 duration-200 bg-gray-50/50 dark:bg-white/5 pb-2">
                            {archivedUpdates.map((s, idx) => (
                                <StatusItem key={s.id} update={s} isViewed={s.viewed} onClick={() => openViewer(archivedUpdates, idx)} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {recentUpdates.length > 0 && (
                <>
                    <div className="px-4 py-2 bg-transparent text-[#667781] dark:text-gray-400 text-[13px] font-medium uppercase mt-2">
                        Recent updates
                    </div>

                    {recentUpdates.map((s, idx) => (
                        <StatusItem key={s.id} update={s} isViewed={false} onClick={() => openViewer(recentUpdates, idx)} />
                    ))}
                </>
            )}

            {/* Viewed Updates Dropdown */}
            {viewedUpdates.length > 0 && (
                <div className="border-t border-wa-border dark:border-wa-dark-border mt-2">
                    <div
                        onClick={() => setIsViewedExpanded(!isViewedExpanded)}
                        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors"
                    >
                        <div className="text-[#667781] dark:text-gray-400 text-[13px] font-medium uppercase">
                            Viewed updates
                        </div>
                        <div className="text-[#667781] dark:text-gray-400">
                            {isViewedExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </div>

                    {isViewedExpanded && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                            {viewedUpdates.map((s, idx) => (
                                <StatusItem key={s.id} update={s} isViewed={true} onClick={() => openViewer(viewedUpdates, idx)} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* No Results State */}
            {searchQuery && myUpdates.length === 0 && recentUpdates.length === 0 && viewedUpdates.length === 0 && archivedUpdates.length === 0 && (
                <div className="p-8 text-center text-[#667781] dark:text-gray-500 text-sm">
                    No status updates found for "{searchQuery}"
                </div>
            )}

            <ChannelSuggestions
                channels={channels}
                isExpanded={isSuggestionsExpanded}
                onToggle={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
                searchQuery={searchQuery}
            />

            <NearbyFriendsSection
                isExpanded={isNearbyExpanded}
                onToggle={() => setIsNearbyExpanded(!isNearbyExpanded)}
                searchQuery={searchQuery}
            />

            <div className="flex justify-center items-center gap-1 mt-4 text-[11px] text-[#667781] dark:text-gray-500">
                <Lock size={10} /> Your status updates are end-to-end encrypted
            </div>

            <div className="h-20"></div>

            {/* Status FABs */}
            <div
                onClick={() => setUploadPreview({ url: 'https://picsum.photos/seed/text/800/1200', file: new File([], 'dummy'), type: 'image' })}
                className="fixed bottom-[148px] right-6 w-10 h-10 bg-wa-grayBg dark:bg-wa-dark-paper shadow-md rounded-full flex items-center justify-center text-[#54656f] dark:text-white transition-colors cursor-pointer z-40 hover:scale-105"
            >
                <Edit2 size={18} />
            </div>
            <div
                onClick={(e) => triggerUpload(e)}
                className="fixed bottom-[76px] right-5 w-14 h-14 bg-wa-teal dark:bg-wa-tealDark shadow-[0_4px_10px_rgba(0,0,0,0.3)] rounded-full flex items-center justify-center text-white transition-colors cursor-pointer z-40 hover:scale-105"
            >
                <Camera size={24} />
            </div>
        </div>
    );
};

export default StatusTab;
