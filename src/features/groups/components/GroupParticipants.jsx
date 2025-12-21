import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ArrowLeft, Search, UserPlus, Crown, Shield, UserMinus, 
    MoreVertical, X 
} from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import groupService from '../../../services/firebase/GroupService';
import userService from '../../../services/firebase/UserService';
import { LoadingSpinner, ConfirmDialog, Toast, EmptyState } from '../../../shared/components/UIFeedback';

/**
 * GroupParticipants Component
 * Manages group participants with admin controls
 */
const GroupParticipants = () => {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const { chats, currentUser, users } = useApp();
    
    const [group, setGroup] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // UI feedback states
    const [showConfirm, setShowConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadGroupData();
    }, [groupId]);

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const loadGroupData = async () => {
        try {
            const groupChat = chats.find(c => c.id === groupId && c.isGroup);
            if (groupChat) {
                setGroup(groupChat);
                
                // Load participant details
                const participantDetails = await Promise.all(
                    (groupChat.participants || []).map(async (userId) => {
                        if (users[userId]) {
                            return users[userId];
                        }
                        const result = await userService.getUser(userId);
                        return result.success ? result.user : null;
                    })
                );
                
                setParticipants(participantDetails.filter(Boolean));
                
                // Check user role
                const adminStatus = await groupService.isAdmin(groupId, currentUser?.id);
                const ownerStatus = await groupService.isOwner(groupId, currentUser?.id);
                setIsAdmin(adminStatus);
                setIsOwner(ownerStatus);
            }
        } catch (error) {
            console.error('Failed to load participants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePromoteToAdmin = async (userId, userName) => {
        setShowConfirm({
            title: 'Make Admin?',
            message: `Give ${userName} admin privileges? They will be able to manage participants and group settings.`,
            confirmText: 'Make Admin',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    const result = await groupService.promoteToAdmin(groupId, userId);
                    if (result.success) {
                        setToast({ type: 'success', message: `${userName} is now an admin` });
                        await loadGroupData();
                        setSelectedUser(null);
                    } else {
                        setToast({ type: 'error', message: result.error || 'Failed to promote user' });
                    }
                } catch (error) {
                    setToast({ type: 'error', message: 'Error promoting user' });
                } finally {
                    setActionLoading(false);
                    setShowConfirm(null);
                }
            }
        });
    };

    const handleDemoteFromAdmin = async (userId, userName) => {
        setShowConfirm({
            title: 'Remove Admin?',
            message: `Remove admin privileges from ${userName}? They will become a regular member.`,
            confirmText: 'Remove Admin',
            confirmDanger: true,
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await groupService.demoteFromAdmin(groupId, userId);
                    setToast({ type: 'success', message: `${userName} is no longer an admin` });
                    await loadGroupData();
                    setSelectedUser(null);
                } catch (error) {
                    setToast({ type: 'error', message: 'Error removing admin' });
                } finally {
                    setActionLoading(false);
                    setShowConfirm(null);
                }
            }
        });
    };

    const handleRemoveParticipant = (userId, userName) => {
        setShowConfirm({
            title: 'Remove Participant?',
            message: `Remove ${userName} from the group? They can be added back by an admin.`,
            confirmText: 'Remove',
            confirmDanger: true,
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    const result = await groupService.removeParticipant(groupId, userId);
                    if (result.success) {
                        setToast({ type: 'success', message: `${userName} removed from group` });
                        await loadGroupData();
                        setSelectedUser(null);
                    } else {
                        setToast({ type: 'error', message: result.error || 'Failed to remove participant' });
                    }
                } catch (error) {
                    setToast({ type: 'error', message: 'Error removing participant' });
                } finally {
                    setActionLoading(false);
                    setShowConfirm(null);
                }
            }
        });
    };

    const filteredParticipants = participants.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isUserAdmin = (userId) => group?.admins?.includes(userId);
    const isUserOwner = (userId) => group?.owner === userId;

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading participants..." />;
    }

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-wa-dark-bg">
            {/* Header */}
            <div className="h-[60px] bg-wa-grayBg dark:bg-wa-dark-header flex items-center px-4 border-b border-wa-border dark:border-wa-dark-border shrink-0">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full -ml-2"
                >
                    <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex-1 ml-4">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Participants</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{participants.length} members</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => navigate(`/group/${groupId}/add-participants`)}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
                    >
                        <UserPlus size={24} className="text-wa-teal" />
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-wa-dark-border">
                <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search participants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-wa-dark-hover rounded-lg outline-none text-gray-900 dark:text-gray-100"
                    />
                </div>
            </div>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto">
                {filteredParticipants.map((user) => {
                    const userIsAdmin = isUserAdmin(user.id);
                    const userIsOwner = isUserOwner(user.id);
                    const canManage = (isAdmin || isOwner) && user.id !== currentUser?.id && !userIsOwner;

                    return (
                        <div
                            key={user.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-wa-dark-hover transition-colors"
                        >
                            {/* Avatar */}
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=128c7e&color=fff`}
                                alt={user.name}
                                className="w-12 h-12 rounded-full object-cover shrink-0"
                            />

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {user.name}
                                        {user.id === currentUser?.id && ' (You)'}
                                    </h3>
                                    {userIsOwner && (
                                        <Crown size={16} className="text-yellow-500" fill="currentColor" />
                                    )}
                                    {userIsAdmin && !userIsOwner && (
                                        <Shield size={16} className="text-wa-teal" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {userIsOwner ? 'Group Owner' : userIsAdmin ? 'Group Admin' : user.about || 'Hey there! I am using WhatsApp.'}
                                </p>
                            </div>

                            {/* Actions Menu */}
                            {canManage && (
                                <button
                                    onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
                                >
                                    <MoreVertical size={20} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            )}

                            {/* Actions Dropdown */}
                            {selectedUser === user.id && (
                                <div className="absolute right-4 mt-2 bg-white dark:bg-wa-dark-paper rounded-lg shadow-lg border border-gray-200 dark:border-wa-dark-border z-10">
                                    {!userIsAdmin && isAdmin && (
                                        <button
                                            onClick={() => handlePromoteToAdmin(user.id, user.name)}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-wa-dark-hover w-full text-left"
                                        >
                                            <Shield size={18} className="text-wa-teal" />
                                            <span className="text-gray-900 dark:text-gray-100">Make Admin</span>
                                        </button>
                                    )}
                                    {userIsAdmin && isOwner && (
                                        <button
                                            onClick={() => handleDemoteFromAdmin(user.id, user.name)}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-wa-dark-hover w-full text-left"
                                        >
                                            <Shield size={18} className="text-gray-500" />
                                            <span className="text-gray-900 dark:text-gray-100">Remove as Admin</span>
                                        </button>
                                    )}
                                    {(isAdmin || isOwner) && (
                                        <button
                                            onClick={() => handleRemoveParticipant(user.id, user.name)}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-wa-dark-hover w-full text-left border-t border-gray-200 dark:border-wa-dark-border"
                                        >
                                            <UserMinus size={18} className="text-red-500" />
                                            <span className="text-red-500">Remove from Group</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredParticipants.length === 0 && (
                    <EmptyState
                        icon={Search}
                        title="No participants found"
                        description={searchQuery ? `No results for "${searchQuery}"` : "This group has no participants"}
                    />
                )}
            </div>

            {/* Click outside to close dropdown */}
            {selectedUser && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setSelectedUser(null)}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast 
                    type={toast.type} 
                    message={toast.message} 
                    onClose={() => setToast(null)}
                />
            )}

            {/* Confirmation Dialog */}
            {showConfirm && (
                <ConfirmDialog
                    isOpen={true}
                    title={showConfirm.title}
                    message={showConfirm.message}
                    confirmText={showConfirm.confirmText}
                    cancelText="Cancel"
                    confirmDanger={showConfirm.confirmDanger}
                    loading={actionLoading}
                    onConfirm={showConfirm.onConfirm}
                    onClose={() => setShowConfirm(null)}
                />
            )}
        </div>
    );
};

export default GroupParticipants;
