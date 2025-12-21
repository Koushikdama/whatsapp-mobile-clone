import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users, Camera, ArrowRight, Check, X } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import followFirebaseService from '../../../services/firebase/FollowFirebaseService';


const NewChat = () => {
    const navigate = useNavigate();
    const { startChat, createGroup, chats, users, currentUserId, isFollowing } = useApp();
    const [activeTab, setActiveTab] = useState('following');
    const [searchQuery, setSearchQuery] = useState('');

    // Group Creation State
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [creationStep, setCreationStep] = useState(1);
    const [selectedParticipants, setSelectedParticipants] = useState(new Set());
    const [groupName, setGroupName] = useState('');
    const [groupCreationFilter, setGroupCreationFilter] = useState('all');

    // State for followers
    const [followerUsers, setFollowerUsers] = useState([]);

    // Load followers from Firebase
    useEffect(() => {
        if (!currentUserId) return;

        const loadFollowers = async () => {
            try {
                const result = await followFirebaseService.getFollowers(currentUserId);
                if (result.success && result.followers) {
                    // Get the follower user IDs
                    const followerIds = result.followers.map(f => f.followerId);
                    // Filter users to get follower user objects
                    const followers = Object.values(users).filter(u => followerIds.includes(u.id));
                    setFollowerUsers(followers);
                }
            } catch (error) {
                console.error('Error loading followers:', error);
            }
        };

        loadFollowers();
    }, [currentUserId, users]);

    const lockedContactIds = new Set(
        chats.filter(c => c.isLocked).map(c => c.contactId)
    );

    const allContacts = Object.values(users).filter(u => u.id !== currentUserId);

    // Use actual Firebase follow relationships instead of connectionType
    const followingContacts = allContacts.filter(u => isFollowing(u.id));
    const followerContacts = followerUsers; // Use loaded followers
    const groupChats = chats.filter(c => c.isGroup);

    const handleContactClick = async (contactId) => {
        const chatId = await startChat(contactId);
        navigate(`/chat/${chatId}`);
    };

    const handleGroupClick = (chatId) => {
        navigate(`/chat/${chatId}`);
    };

    const startGroupCreation = (filter) => {
        setGroupCreationFilter(filter);
        setSelectedParticipants(new Set());
        setGroupName('');
        setCreationStep(1);
        setIsCreatingGroup(true);
    };

    const toggleParticipant = (userId) => {
        setSelectedParticipants(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) newSet.delete(userId);
            else newSet.add(userId);
            return newSet;
        });
    };

    const finalizeGroupCreation = () => {
        if (!groupName.trim()) return;
        const chatId = createGroup(groupName, Array.from(selectedParticipants));
        navigate(`/chat/${chatId}`);
    };

    // --- Components ---

    const TabButton = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 text-sm font-medium uppercase transition-all relative ${activeTab === id
                ? 'text-wa-teal dark:text-wa-teal'
                : 'text-[#54656f] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
        >
            {label}
            {activeTab === id && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-wa-teal rounded-t-full"></span>
            )}
        </button>
    );

    const Badge = ({ type }) => (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide ml-2 ${type === 'following'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
            {type}
        </span>
    );

    // --- RENDER: GROUP CREATION WIZARD ---
    if (isCreatingGroup) {
        const availableContacts = groupCreationFilter === 'following' ? followingContacts : allContacts;
        const filteredForSelection = availableContacts
            .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter(u => !lockedContactIds.has(u.id))
            .sort((a, b) => a.name.localeCompare(b.name));

        return (
            <div className="flex flex-col h-full bg-white dark:bg-wa-dark-bg">
                {/* Wizard Header */}
                <div className="h-[60px] bg-wa-teal dark:bg-wa-dark-header flex items-center px-4 shrink-0 shadow-sm text-white transition-colors">
                    <button onClick={() => {
                        if (creationStep === 2) setCreationStep(1);
                        else setIsCreatingGroup(false);
                    }} className="mr-3 p-1 rounded-full active:bg-white/10">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-xl font-medium">
                            {creationStep === 1 ? 'New Group' : 'New Group'}
                        </h2>
                        <p className="text-xs opacity-80">
                            {creationStep === 1 ? 'Add participants' : 'Add subject'}
                        </p>
                    </div>
                </div>

                {/* Step 1: Participant Selection */}
                {creationStep === 1 && (
                    <>
                        <div className="p-2 border-b border-wa-border dark:border-wa-dark-border">
                            <div className="bg-wa-grayBg dark:bg-wa-dark-input rounded-lg px-4 py-2 flex items-center gap-4 text-wa-gray dark:text-gray-400 h-9 transition-colors">
                                <Search size={18} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-transparent outline-none text-sm w-full text-black dark:text-white placeholder:text-wa-gray dark:placeholder:text-gray-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Selected Chips */}
                        {selectedParticipants.size > 0 && (
                            <div className="flex gap-2 p-2 overflow-x-auto border-b border-wa-border dark:border-wa-dark-border no-scrollbar">
                                {Array.from(selectedParticipants).map((id) => {
                                    const u = users[id];
                                    return (
                                        <div key={id} onClick={() => toggleParticipant(id)} className="flex items-center gap-1 bg-gray-100 dark:bg-wa-dark-paper rounded-full pl-1 pr-2 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10">
                                            <img src={u?.avatar} className="w-5 h-5 rounded-full" alt="" />
                                            <span className="text-xs text-[#111b21] dark:text-gray-200">{u?.name.split(' ')[0]}</span>
                                            <X size={12} className="text-gray-500" />
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto pb-20">
                            {filteredForSelection.map(user => {
                                const isSelected = selectedParticipants.has(user.id);

                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleParticipant(user.id)}
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
                                        <div className="flex-1 border-b border-wa-border dark:border-wa-dark-border pb-3 -mb-3 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center">
                                                    <h3 className={`text-[17px] font-medium ${isSelected ? 'text-[#111b21] dark:text-gray-100' : 'text-[#111b21] dark:text-gray-100'}`}>
                                                        {user.name}
                                                    </h3>
                                                    {user.connectionType && user.connectionType !== 'contact' && (
                                                        <Badge type={user.connectionType} />
                                                    )}
                                                </div>
                                                <p className="text-[14px] text-[#667781] dark:text-gray-500 truncate">{user.about}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* FAB Next */}
                        {selectedParticipants.size > 0 && (
                            <div className="absolute bottom-6 right-6 z-20">
                                <button
                                    onClick={() => setCreationStep(2)}
                                    className="w-14 h-14 bg-wa-teal rounded-full shadow-lg flex items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all"
                                >
                                    <ArrowRight size={24} />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Step 2: Group Info */}
                {creationStep === 2 && (
                    <div className="flex flex-col items-center pt-8 px-6 animate-in slide-in-from-right duration-300">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-wa-dark-header rounded-full flex items-center justify-center text-gray-500 mb-8 cursor-pointer hover:opacity-80 transition-opacity relative">
                            <Camera size={32} />
                            <span className="absolute text-[10px] bottom-4 font-medium">ADD ICON</span>
                        </div>

                        <div className="w-full border-b-2 border-wa-teal mb-2">
                            <input
                                autoFocus
                                type="text"
                                className="w-full bg-transparent outline-none text-lg py-2 text-[#111b21] dark:text-gray-100 placeholder:text-gray-400"
                                placeholder="Type group subject"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                maxLength={25}
                            />
                        </div>
                        <div className="w-full flex justify-between text-gray-400 text-xs mb-8">
                            <span>Provide a group subject and optional group icon</span>
                            <span>{groupName.length}/25</span>
                        </div>

                        <div className="w-full bg-gray-50 dark:bg-wa-dark-header rounded-lg p-4 mb-4">
                            <h3 className="text-sm font-medium text-[#111b21] dark:text-gray-200 mb-2">Participants: {selectedParticipants.size}</h3>
                            <div className="flex flex-wrap gap-2">
                                {Array.from(selectedParticipants).map(id => (
                                    <span key={id} className="text-xs bg-gray-200 dark:bg-white/10 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                                        {users[id]?.name.split(' ')[0]}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={finalizeGroupCreation}
                            disabled={!groupName.trim()}
                            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all mt-4
                            ${groupName.trim() ? 'bg-wa-teal hover:scale-105 active:scale-95' : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'}
                        `}
                        >
                            <Check size={24} strokeWidth={3} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER: MAIN TAB VIEW ---

    return (
        <div className="flex flex-col h-full bg-white dark:bg-wa-dark-bg">
            {/* Header */}
            <div className="h-[60px] bg-wa-teal dark:bg-wa-dark-header flex items-center gap-3 px-4 text-white shrink-0 shadow-sm md:bg-wa-grayBg md:border-b md:border-wa-border md:dark:border-wa-dark-border md:text-black md:dark:text-white transition-colors">
                <button onClick={() => navigate('/chats')} className="p-1 -ml-2 rounded-full active:bg-black/10">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-medium md:text-lg">New Chat</h2>
                </div>
                <Search size={22} className="md:hidden" />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-wa-border dark:border-wa-dark-border bg-white dark:bg-wa-dark-bg shrink-0 sticky top-0 z-10">
                <TabButton id="following" label="Following" />
                <TabButton id="followers" label="Followers" />
                <TabButton id="groups" label="Groups" />
            </div>

            {/* Search Input (Desktop Style / Persist) */}
            <div className="p-2 border-b border-wa-border dark:border-wa-dark-border bg-white dark:bg-wa-dark-bg">
                <div className="bg-wa-grayBg dark:bg-wa-dark-input rounded-lg px-4 py-2 flex items-center gap-4 text-wa-gray dark:text-gray-400 h-9 transition-colors">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={activeTab === 'groups' ? "Search groups" : "Search contacts"}
                        className="bg-transparent outline-none text-sm w-full text-black dark:text-white placeholder:text-wa-gray dark:placeholder:text-gray-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
                {/* CONTENT: FOLLOWING TAB */}
                {activeTab === 'following' && (
                    <>
                        <div onClick={() => startGroupCreation('following')} className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover active:bg-[#e9edef] dark:active:bg-wa-dark-paper transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-wa-teal dark:bg-wa-tealDark flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                <Users size={20} />
                            </div>
                            <h3 className="text-[17px] text-[#111b21] dark:text-gray-100 font-medium">New Group with Friends</h3>
                        </div>

                        <div className="px-4 py-2 text-[#667781] dark:text-gray-400 text-xs font-medium uppercase tracking-wide bg-gray-50 dark:bg-white/5">
                            Following ({followingContacts.length})
                        </div>

                        {followingContacts
                            .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(user => (
                                <div key={user.id} onClick={() => handleContactClick(user.id)} className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors">
                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div className="flex-1 border-b border-wa-border dark:border-wa-dark-border pb-3 -mb-3">
                                        <h3 className="text-[17px] text-[#111b21] dark:text-gray-100 font-medium">{user.name}</h3>
                                        <p className="text-[14px] text-[#667781] dark:text-gray-500 truncate">{user.about}</p>
                                    </div>
                                </div>
                            ))}
                    </>
                )}

                {/* CONTENT: FOLLOWERS TAB */}
                {activeTab === 'followers' && (
                    <>
                        <div className="px-4 py-2 text-[#667781] dark:text-gray-400 text-xs font-medium uppercase tracking-wide bg-gray-50 dark:bg-white/5">
                            Followers ({followerContacts.length})
                        </div>
                        {followerContacts
                            .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(user => (
                                <div key={user.id} onClick={() => handleContactClick(user.id)} className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors">
                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div className="flex-1 border-b border-wa-border dark:border-wa-dark-border pb-3 -mb-3">
                                        <h3 className="text-[17px] text-[#111b21] dark:text-gray-100 font-medium">{user.name}</h3>
                                        <p className="text-[14px] text-[#667781] dark:text-gray-500 truncate">{user.about}</p>
                                    </div>
                                </div>
                            ))}
                        {followerContacts.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No followers yet.</div>}
                    </>
                )}

                {/* CONTENT: GROUPS TAB */}
                {activeTab === 'groups' && (
                    <>
                        <div onClick={() => startGroupCreation('all')} className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover active:bg-[#e9edef] dark:active:bg-wa-dark-paper transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-wa-teal dark:bg-wa-tealDark flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                <Users size={20} />
                            </div>
                            <h3 className="text-[17px] text-[#111b21] dark:text-gray-100 font-medium">Create New Group</h3>
                        </div>

                        <div className="px-4 py-2 text-[#667781] dark:text-gray-400 text-xs font-medium uppercase tracking-wide bg-gray-50 dark:bg-white/5">
                            My Groups ({groupChats.length})
                        </div>

                        {groupChats
                            .filter(c => (c.groupName || '').toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(chat => (
                                <div key={chat.id} onClick={() => handleGroupClick(chat.id)} className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300">
                                        <Users size={20} />
                                    </div>
                                    <div className="flex-1 border-b border-wa-border dark:border-wa-dark-border pb-3 -mb-3">
                                        <h3 className="text-[17px] text-[#111b21] dark:text-gray-100 font-medium">{chat.groupName}</h3>
                                        <p className="text-[14px] text-[#667781] dark:text-gray-500 truncate">
                                            {chat.groupParticipants?.length} participants
                                        </p>
                                    </div>
                                </div>
                            ))}
                        {groupChats.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No groups found.</div>}
                    </>
                )}
            </div>
        </div>
    );
};

export default NewChat;
