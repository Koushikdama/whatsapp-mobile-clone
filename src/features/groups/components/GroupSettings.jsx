import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ArrowLeft, Users, Shield, Bell, BellOff, Image, LogOut, 
    Trash2, Link as LinkIcon, Lock, Unlock, Settings 
} from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import groupService from '../../../services/firebase/GroupService';
import { LoadingSpinner, ConfirmDialog, Toast, ErrorMessage } from '../../../shared/components/UIFeedback';

/**
 * GroupSettings Component
 * Main settings page for group configuration
 * Follows SOLID principles - single responsibility for settings display
 */
const GroupSettings = () => {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const { chats, currentUser } = useApp();
    
    const [group, setGroup] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // UI feedback states
    const [showConfirm, setShowConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Load group data
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
        setLoading(true);
        setError(null);
        try {
            // Find group from chats
            const groupChat = chats.find(c => c.id === groupId && c.isGroup);
            if (groupChat) {
                setGroup(groupChat);
                
                // Check user role
                const adminStatus = await groupService.isAdmin(groupId, currentUser?.id);
                const ownerStatus = await groupService.isOwner(groupId, currentUser?.id);
                setIsAdmin(adminStatus);
                setIsOwner(ownerStatus);
            } else {
                setError('Group not found');
            }
        } catch (error) {
            console.error('Failed to load group:', error);
            setError('Failed to load group settings');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveGroup = () => {
        if (isOwner) {
            setToast({
                type: 'error',
                message: 'Owner must transfer ownership before leaving'
            });
            return;
        }

        setShowConfirm({
            title: 'Leave Group?',
            message: 'Are you sure you want to leave this group? You can be added back by an admin.',
            confirmText: 'Leave',
            confirmDanger: true,
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    const result = await groupService.leaveGroup(groupId, currentUser?.id);
                    if (result.success) {
                        setToast({ type: 'success', message: 'Left group successfully' });
                        setTimeout(() => navigate('/chats'), 1000);
                    } else {
                        setToast({ type: 'error', message: result.error || 'Failed to leave group' });
                    }
                } catch (error) {
                    setToast({ type: 'error', message: 'Error leaving group' });
                } finally {
                    setActionLoading(false);
                    setShowConfirm(null);
                }
            }
        });
    };

    const handleDeleteGroup = () => {
        setShowConfirm({
            title: 'Delete Group?',
            message: 'This will permanently delete the group for all members. This action cannot be undone.',
            confirmText: 'Delete',
            confirmDanger: true,
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await groupService.deleteGroup(groupId);
                    setToast({ type: 'success', message: 'Group deleted successfully' });
                    setTimeout(() => navigate('/chats'), 1000);
                } catch (error) {
                    setToast({ type: 'error', message: 'Error deleting group' });
                } finally {
                    setActionLoading(false);
                    setShowConfirm(null);
                }
            }
        });
    };

    const handleMuteToggle = async () => {
        const isMuted = group?.settings?.muteUntil && new Date(group.settings.muteUntil) > new Date();
        
        try {
            const duration = isMuted ? null : 8 * 60 * 60 * 1000; // 8 hours
            await groupService.muteGroup(groupId, duration);
            setToast({ 
                type: 'success', 
                message: isMuted ? 'Notifications unmuted' : 'Notifications muted for 8 hours' 
            });
            loadGroupData(); // Reload to get updated mute status
        } catch (error) {
            setToast({ type: 'error', message: 'Error updating mute status' });
        }
    };

    // Loading state
    if (loading) {
        return <LoadingSpinner fullScreen message="Loading group settings..." />;
    }

    // Error state
    if (error || !group) {
        return (
            <div className="flex flex-col h-screen bg-white dark:bg-wa-dark-bg">
                <div className="h-[60px] bg-wa-grayBg dark:bg-wa-dark-header flex items-center px-4 border-b border-wa-border dark:border-wa-dark-border">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full -ml-2"
                    >
                        <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-4">Group Settings</h1>
                </div>
                <ErrorMessage 
                    message={error || 'Group not found'} 
                    onRetry={loadGroupData}
                />
                <div className="flex flex-col items-center justify-center flex-1 gap-4">
                    <button 
                        onClick={() => navigate('/chats')}
                        className="px-4 py-2 bg-wa-teal text-white rounded-lg hover:bg-wa-tealDark transition-colors"
                    >
                        Back to Chats
                    </button>
                </div>
            </div>
        );
    }

    const isMuted = group?.settings?.muteUntil && new Date(group.settings.muteUntil) > new Date();

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
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-4">Group Settings</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Group Info Section */}
                <div className="bg-white dark:bg-wa-dark-paper p-4 border-b-8 border-gray-100 dark:border-wa-dark-bg">
                    <div className="flex items-center gap-4">
                        <img 
                            src={group.avatar || 'https://ui-avatars.com/api/?name=Group&background=128c7e&color=fff'} 
                            alt={group.groupName}
                            className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {group.groupName}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {group.participants?.length || 0} participants
                            </p>
                            {(isAdmin || isOwner) && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-wa-teal/10 text-wa-teal text-xs rounded-full">
                                    {isOwner ? 'Owner' : 'Admin'}
                                </span>
                            )}
                        </div>
                    </div>

                    {group.description && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                            {group.description}
                        </p>
                    )}
                </div>

                {/* Settings Sections */}
                <div className="bg-white dark:bg-wa-dark-paper">
                    {/* Quick Actions */}
                   <SettingsSection title="Quick Actions">
                        <SettingsItem
                            icon={isMuted ? Bell : BellOff}
                            label={isMuted ? 'Unmute' : 'Mute'}
                            onClick={handleMuteToggle}
                        />
                        <SettingsItem
                            icon={Users}
                            label="Manage Participants"
                            onClick={() => navigate(`/group/${groupId}/participants`)}
                            showArrow
                        />
                        {isAdmin && (
                            <SettingsItem
                                icon={Shield}
                                label="Permissions"
                                onClick={() => navigate(`/group/${groupId}/permissions`)}
                                showArrow
                            />
                        )}
                    </SettingsSection>

                    {/* Media & Files */}
                    <SettingsSection title="Media & Files">
                        <SettingsItem
                            icon={Image}
                            label="Media, Links & Docs"
                            onClick={() => navigate(`/chat/${groupId}/info`)}
                            showArrow
                        />
                    </SettingsSection>

                    {/* Privacy & Notifications */}
                    {isAdmin && (
                        <SettingsSection title="Privacy & Notifications">
                            <SettingsItem
                                icon={group?.privacy === 'private' ? Lock : Unlock}
                                label="Group Privacy"
                                sublabel={group?.privacy === 'private' ? 'Private' : 'Public'}
                                onClick={() => {/* TODO: Toggle privacy */}}
                            />
                            <SettingsItem
                                icon={isMuted ? BellOff : Bell}
                                label={isMuted ? 'Notifications Muted' : 'Notifications Active'}
                                onClick={handleMuteToggle}
                            />
                        </SettingsSection>
                    )}

                    {/* Group Actions */}
                    <SettingsSection title="Group Actions">
                        <SettingsItem
                            icon={LogOut}
                            label="Leave Group"
                            onClick={handleLeaveGroup}
                            danger
                        />
                        {isOwner && (
                            <SettingsItem
                                icon={Trash2}
                                label="Delete Group"
                                onClick={handleDeleteGroup}
                                danger
                            />
                        )}
                    </SettingsSection>
                </div>
            </div>

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

/**
 * Settings Section Component - DRY principle
 */
const SettingsSection = ({ title, children }) => (
    <div className="border-b-8 border-gray-100 dark:border-wa-dark-bg">
        <div className="px-4 py-2">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {title}
            </h3>
        </div>
        <div>
            {children}
        </div>
    </div>
);

/**
 * Settings Item Component - DRY principle
 */
const SettingsItem = ({ icon: Icon, label, sublabel, onClick, danger, showArrow }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-wa-dark-hover transition-colors"
    >
        <Icon 
            size={22} 
            className={danger ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'} 
        />
        <div className="flex-1 text-left">
            <span className={`block ${danger ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                {label}
            </span>
            {sublabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400">{sublabel}</span>
            )}
        </div>
        {showArrow && (
            <ArrowLeft size={20} className="text-gray-400 rotate-180" />
        )}
    </button>
);

export default GroupSettings;
