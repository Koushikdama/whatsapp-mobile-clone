import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, BadgeCheck, Camera, Edit2, Archive, ChevronDown, ChevronUp, MoreVertical, Compass, MapPin, ArrowLeft, Plus, Search } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import { formatTimestamp } from '../../../shared/utils/formatTime';
import StatusViewer from '../../status/components/StatusViewer';
import UserCard from './UserCard';
import userService from '../../../services/firebase/UserService';
import chatFirebaseService from '../../../services/firebase/ChatFirebaseService';
import { getNonFollowedUsers, filterUsersBySearch } from '../../../shared/utils/userUtils';

// Mock Data for Nearby Friends
const NEARBY_USERS = [
    { id: 'n1', name: 'Sarah Connor', distance: 0.5, avatar: 'https://picsum.photos/seed/sarah/200' },
    { id: 'n2', name: 'John Wick', distance: 2.1, avatar: 'https://picsum.photos/seed/wick/200' },
    { id: 'n3', name: 'Ellen Ripley', distance: 4.5, avatar: 'https://picsum.photos/seed/ellen/200' },
    { id: 'n4', name: 'Luke Skywalker', distance: 8.0, avatar: 'https://picsum.photos/seed/luke/200' },
    { id: 'n5', name: 'Tony Stark', distance: 12.5, avatar: 'https://picsum.photos/seed/tony/200' },
    { id: 'n6', name: 'Natasha Romanoff', distance: 0.8, avatar: 'https://picsum.photos/seed/nat/200' },
    { id: 'n7', name: 'Bruce Wayne', distance: 15.0, avatar: 'https://picsum.photos/seed/bruce/200' },
    { id: 'n8', name: 'Peter Parker', distance: 3.2, avatar: 'https://picsum.photos/seed/peter/200' },
];

const StatusItem = ({ update, isViewed, onClick }) => {
    const { users } = useApp();
    const user = users[update.userId];
    if (!user) return null;

    return (
        <div onClick={onClick} className="flex items-center gap-4 px-4 py-3 active:bg-wa-grayBg dark:active:bg-wa-dark-paper hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors cursor-pointer">
            <div className={`p-[2px] rounded-full border-2 ${isViewed ? 'border-gray-300 dark:border-gray-600' : 'border-wa-lightGreen'}`}>
                <img src={user.avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-white dark:border-wa-dark-bg" />
            </div>
            <div className="flex-1 border-b border-wa-border dark:border-wa-dark-border pb-3 -mb-3">
                <h3 className="text-[17px] text-[#111b21] dark:text-gray-200 font-medium">{user.name}</h3>
                <p className="text-[13px] text-[#667781] dark:text-gray-500">{formatTimestamp(update.timestamp)}</p>
            </div>
        </div>
    )
};

const UpdatesTab = () => {
    const navigate = useNavigate();
    const {
        users, currentUserId, statusUpdates, channels, addStatusUpdate, searchQuery, chats, setChats, securitySettings,
        followUser, unfollowUser, isFollowing, followedUsers, getMutualConnectionsCount
    } = useApp();
    const myStatusUser = users[currentUserId];

    // Safety check: If essential data isn't loaded yet, show loading state
    if (!myStatusUser || !currentUserId) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-wa-dark-bg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wa-teal mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading updates...</p>
                </div>
            </div>
        );
    }

    // UI States
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
    const [isViewedExpanded, setIsViewedExpanded] = useState(false);
    const [showArchiveAuth, setShowArchiveAuth] = useState(false);
    const [authPin, setAuthPin] = useState('');
    const [authError, setAuthError] = useState('');

    // Dropdown States
    const [isNearbyExpanded, setIsNearbyExpanded] = useState(false);
    const [radiusFilter, setRadiusFilter] = useState(5); // km

    // Suggestions State (removed 'All' and 'Following' tabs)
    const [firebaseUsers, setFirebaseUsers] = useState([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [mutualConnections, setMutualConnections] = useState({});

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
            if (!searchQuery) return true;
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

    // Nearby Users Filtering
    const filteredNearbyUsers = useMemo(() => {
        return NEARBY_USERS.filter(u => u.distance <= radiusFilter);
    }, [radiusFilter]);

    // Fetch users from Firebase
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const result = await userService.getAllUsers(100);
                if (result.success && result.users.length > 0) {
                    console.log('✅ Fetched users from Firebase:', result.users.length);
                    console.log('📊 Firebase users:', result.users);
                    console.log('👤 Current user ID:', currentUserId);
                    setFirebaseUsers(result.users);
                } else {
                    // No fallback - only show Firebase users in suggestions
                    console.log('⚠️ No Firebase users found');
                    setFirebaseUsers([]);
                }
            } catch (error) {
                console.warn('⚠️ Firebase error:', error.message);
                // Don't fallback to local users - suggestions should only show database users
                setFirebaseUsers([]);
            }
        };
        fetchUsers();
    }, [users, currentUserId]);

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
            // In a real app, this would route to a media editor.
            // For now, we simulate an immediate send or logic.
            // Let's mimic status tab's logic roughly:
            handleSendStatus('New update', { url, file, type });
        }
        e.target.value = '';
    };

    const handleSendStatus = (caption, media) => {
        const newStatus = {
            id: `s_${Date.now()}`,
            userId: currentUserId,
            timestamp: new Date().toISOString(),
            imageUrl: media?.url || 'https://picsum.photos/seed/text/800/1200',
            caption: caption,
            viewed: false
        };
        addStatusUpdate(newStatus);
        setUploadPreview(null);
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

    const handleChannelClick = (channelId) => {
        navigate(`/channels/${channelId}`);
    };

    const handleMessageUser = async (userId) => {
        try {
            console.log(`💬 Messaging user ${userId}`);

            const user = users[userId];
            if (!user) {
                console.error('User not found:', userId);
                alert('User not found.');
                return;
            }

            // Create or find chat
            const result = await chatFirebaseService.createDirectChat(currentUserId, userId);

            if (result.success) {
                console.log(`✅ Chat ${result.isNew ? 'created' : 'found'}: ${result.chatId}`);

                // Navigate with user info in state so ChatWindow can use it
                navigate(`/chat/${result.chatId}`, {
                    state: {
                        contactId: userId,
                        contactName: user.name,
                        contactAvatar: user.avatar,
                        contactAbout: user.about
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error creating/finding chat:', error);
            // Show error to user
            alert('Unable to create chat. Please try again.');
        }
    };

    if (!myStatusUser) return null;

    const hasUnviewedArchived = archivedUpdates.some(s => !s.viewed);

    return (
        <div className="flex flex-col pb-20 bg-white dark:bg-wa-dark-bg min-h-full relative">
            {/* Desktop Header */}
            <div className="hidden md:flex h-[60px] bg-wa-grayBg dark:bg-wa-dark-header items-center gap-3 px-4 shrink-0 border-b border-wa-border dark:border-wa-dark-border text-[#111b21] dark:text-gray-100 transition-colors sticky top-0 z-10">
                <button onClick={() => navigate('/chats')} className="p-2 -ml-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-medium md:text-lg">Updates</h2>
            </div>

            {/* Mobile Header */}
            <div className="flex items-center justify-between px-4 py-4 md:hidden">
                <h1 className="text-xl font-medium text-[#111b21] dark:text-gray-100">Updates</h1>
                <div className="flex items-center gap-4">
                    <button className="text-[#111b21] dark:text-gray-100">
                        <Camera size={22} onClick={triggerUpload} />
                    </button>
                    <button className="text-[#111b21] dark:text-gray-100">
                        <Search size={22} />
                    </button>
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

            {viewerState.isOpen && (
                <StatusViewer
                    updates={viewerState.updates}
                    initialIndex={viewerState.startIndex}
                    onClose={closeViewer}
                />
            )}

            {/* Status Section */}
            <div className="mb-4">


                {/* My Status */}
                {(!searchQuery || myStatusUser.name.toLowerCase().includes(searchQuery.toLowerCase())) && (
                    <div
                        onClick={handleMyStatusClick}
                        className="flex items-center gap-4 px-4 py-3 cursor-pointer active:bg-wa-grayBg dark:active:bg-wa-dark-paper hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors group"
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
                            <p className="text-[14px] text-[#667781] dark:text-gray-500">
                                {myUpdates.length > 0 ? formatTimestamp(myUpdates[0].timestamp) : 'Tap to add status update'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Horizontal Recent Updates List - Modern Style */}
                {recentUpdates.length > 0 && (
                    <div className="mt-2">
                        <div className="px-4 text-[14px] font-semibold text-[#667781] dark:text-gray-400 mb-2">Recent updates</div>
                        {recentUpdates.map((s, idx) => (
                            <StatusItem key={s.id} update={s} isViewed={false} onClick={() => openViewer(recentUpdates, idx)} />
                        ))}
                    </div>
                )}
                {viewedUpdates.length > 0 && (
                    <div className="mt-2">
                        <div
                            onClick={() => setIsViewedExpanded(!isViewedExpanded)}
                            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors"
                        >
                            <div className="text-[#667781] dark:text-gray-400 text-[14px] font-semibold">
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

                {/* Muted Updates Section */}
                {archivedUpdates.length > 0 && (
                    <div className="mt-2">
                        <div
                            onClick={handleArchiveHeaderClick}
                            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors"
                        >
                            <div className="text-[#667781] dark:text-gray-400 text-[14px] font-semibold">
                                Muted updates
                            </div>
                            <div className="text-[#667781] dark:text-gray-400">
                                {isArchiveExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </div>

                        {isArchiveExpanded && (
                            <div className="animate-in slide-in-from-top-2 duration-200 opacity-70">
                                {archivedUpdates.map((s, idx) => (
                                    <StatusItem key={s.id} update={s} isViewed={true} onClick={() => openViewer(archivedUpdates, idx)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>


            <div className="h-[1px] bg-wa-border dark:bg-wa-dark-border mx-4 my-2"></div>

            {/* Suggestions Section - WhatsApp Channels Style */}
            <div className="mt-2">
                <div
                    onClick={() => setIsViewedExpanded(!isViewedExpanded)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors"
                >
                    <div>
                        <h2 className="text-lg font-bold text-[#111b21] dark:text-gray-100">Find People</h2>
                        <p className="text-xs text-[#667781] dark:text-gray-400">Discover new connections</p>
                    </div>
                    <div className="text-[#667781] dark:text-gray-400">
                        {isViewedExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>

                {isViewedExpanded && (
                    <div className="animate-in slide-in-from-top-2 duration-200 px-4 pb-4">
                        {/* Search Input */}
                        <div className="mb-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search suggested users..."
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-800 text-[#111b21] dark:text-gray-100 rounded-lg border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                />
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            </div>
                        </div>

                        {/* Suggestions Grid - Two Rows, Horizontal Scroll */}
                        <div className="mb-2">
                            {(() => {
                                // Only use Firebase users for suggestions (not local JSON users)
                                const firebaseUsersObj = firebaseUsers.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});

                                // Filter to only show non-followed users from Firebase (suggestions)
                                const suggestedUsers = getNonFollowedUsers(
                                    firebaseUsersObj,
                                    currentUserId,
                                    isFollowing
                                );

                                // Apply search filter
                                const filteredUsers = filterUsersBySearch(suggestedUsers, userSearchQuery);

                                if (filteredUsers.length === 0) {
                                    return (
                                        <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                            {userSearchQuery.trim()
                                                ? `No users found matching "${userSearchQuery}"`
                                                : firebaseUsers.length === 0
                                                    ? 'No users in database yet. Add users to see suggestions!'
                                                    : 'No suggestions available. All database users are already connected!'}
                                        </div>
                                    );
                                }

                                // Split into two rows for better layout
                                const halfLength = Math.ceil(filteredUsers.length / 2);
                                const firstRow = filteredUsers.slice(0, halfLength);
                                const secondRow = filteredUsers.slice(halfLength);

                                const renderUserCard = (user) => (
                                    <div
                                        key={user.id}
                                        className="flex-shrink-0 w-[140px] border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col items-center gap-2 bg-white dark:bg-wa-dark-paper shadow-sm hover:shadow-md transition-all"
                                    >
                                        {/* Avatar */}
                                        <div
                                            onClick={() => handleMessageUser(user.id)}
                                            className="cursor-pointer"
                                        >
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                        </div>

                                        {/* Name */}
                                        <div className="text-center w-full">
                                            <h4 className="text-sm font-medium text-[#111b21] dark:text-gray-100 truncate">
                                                {user.name}
                                            </h4>
                                            {mutualConnections[user.id] > 0 && (
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                    {mutualConnections[user.id]} mutual
                                                </p>
                                            )}
                                        </div>

                                        {/* Follow Button */}
                                        <button
                                            onClick={() => {
                                                if (isFollowing(user.id)) {
                                                    unfollowUser(user.id);
                                                } else {
                                                    followUser(user.id);
                                                }
                                            }}
                                            className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all ${isFollowing(user.id)
                                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                                }`}
                                        >
                                            {isFollowing(user.id) ? 'Following' : 'Follow'}
                                        </button>
                                    </div>
                                );

                                return (
                                    <div className="space-y-3">
                                        {/* First Row */}
                                        {firstRow.length > 0 && (
                                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                                {firstRow.map(renderUserCard)}
                                            </div>
                                        )}

                                        {/* Second Row */}
                                        {secondRow.length > 0 && (
                                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                                {secondRow.map(renderUserCard)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* Nearby Friends Section (Moved to bottom or kept here?) */}
            {/* Keeping it as "Find People" feature similar to Telegram's nearby */}
            {!searchQuery && (
                <div className="border-t border-wa-border dark:border-wa-dark-border mt-8">
                    <div
                        onClick={() => setIsNearbyExpanded(!isNearbyExpanded)}
                        className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                <MapPin size={20} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-[16px] text-[#111b21] dark:text-gray-200 font-medium">Find People Nearby</h3>
                                <p className="text-[13px] text-[#667781] dark:text-gray-500">See who is around you</p>
                            </div>
                        </div>
                        <div className="text-[#667781] dark:text-gray-400">
                            {isNearbyExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    </div>

                    {isNearbyExpanded && (
                        <div className="animate-in slide-in-from-top-2 duration-200 pb-4">
                            {/* Radius Filter */}
                            <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
                                {[1, 5, 10, 20, 50].map(r => (
                                    <button
                                        key={r}
                                        onClick={(e) => { e.stopPropagation(); setRadiusFilter(r); }}
                                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shadow-sm
                                       ${radiusFilter === r
                                                ? 'bg-wa-teal text-white'
                                                : 'bg-gray-100 dark:bg-wa-dark-header text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-wa-dark-hover'
                                            }`}
                                    >
                                        Within {r} km
                                    </button>
                                ))}
                            </div>

                            {/* Horizontal List */}
                            <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
                                {filteredNearbyUsers.map(user => (
                                    <div key={user.id} className="w-[140px] shrink-0 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col items-center gap-2 bg-white dark:bg-wa-dark-paper shadow-sm">
                                        <div className="relative">
                                            <img src={user.avatar} className="w-14 h-14 rounded-full object-cover" alt="" />
                                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-wa-dark-paper rounded-full px-1.5 py-0.5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-0.5">
                                                <MapPin size={8} className="text-blue-500" />
                                                <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300">{user.distance}km</span>
                                            </div>
                                        </div>
                                        <div className="text-center w-full mb-1">
                                            <h4 className="text-sm font-medium text-[#111b21] dark:text-gray-100 truncate">{user.name}</h4>
                                        </div>
                                        <button className="w-full py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors rounded-full text-xs font-bold">
                                            Say Hi 👋
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Action Buttons */}
            <div
                onClick={() => handleSendStatus('Text Status', null)} // Placeholder for text status
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

export default UpdatesTab;
