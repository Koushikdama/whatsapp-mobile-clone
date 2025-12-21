import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import groupService from '../../../services/firebase/GroupService';

/**
 * GroupPermissions Component
 * Configure group permissions
 */
const GroupPermissions = () => {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const { chats, currentUser } = useApp();
    
    const [group, setGroup] = useState(null);
    const [permissions, setPermissions] = useState({
        sendMessages: 'everyone',
        editGroupInfo: 'admins',
        addMembers: 'admins',
        sendMedia: 'everyone',
        pinMessages: 'admins'
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadGroupData();
    }, [groupId]);

    const loadGroupData = async () => {
        try {
            const groupChat = chats.find(c => c.id === groupId && c.isGroup);
            if (groupChat) {
                setGroup(groupChat);
                
                // Load existing permissions if they exist
                if (groupChat.permissions) {
                    setPermissions(groupChat.permissions);
                }
                
                // Check if user is admin
                const adminStatus = await groupService.isAdmin(groupId, currentUser?.id);
                setIsAdmin(adminStatus);
            }
        } catch (error) {
            console.error('Failed to load group:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await groupService.updateGroupPermissions(groupId, permissions);
            if (result.success) {
                navigate(-1);
            } else {
                alert('Failed to update permissions');
            }
        } catch (error) {
            alert('Error updating permissions');
        } finally {
            setSaving(false);
        }
    };

    const updatePermission = (key, value) => {
        setPermissions(prev => ({
            ...prev,
            [key]: value
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-wa-dark-bg">
                <div className="w-12 h-12 border-4 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-wa-dark-bg p-4">
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                    Only group admins can change permissions
                </p>
                <button 
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-wa-teal text-white rounded-lg"
                >
                    Go Back
                </button>
            </div>
        );
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
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-4">Group Permissions</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 m-4 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-300">
                        Configure who can perform certain actions in this group. Changes take effect immediately for all members.
                    </p>
                </div>

                {/* Permissions */}
                <div className="bg-white dark:bg-wa-dark-paper">
                    <PermissionItem
                        title="Send Messages"
                        description="Who can send messages in this group"
                        value={permissions.sendMessages}
                        onChange={(value) => updatePermission('sendMessages', value)}
                    />
                    
                    <PermissionItem
                        title="Edit Group Info"
                        description="Who can change group name, photo, and description"
                        value={permissions.editGroupInfo}
                        onChange={(value) => updatePermission('editGroupInfo', value)}
                    />
                    
                    <PermissionItem
                        title="Add Members"
                        description="Who can add new participants to the group"
                        value={permissions.addMembers}
                        onChange={(value) => updatePermission('addMembers', value)}
                    />
                    
                    <PermissionItem
                        title="Send Media"
                        description="Who can send photos, videos, and files"
                        value={permissions.sendMedia}
                        onChange={(value) => updatePermission('sendMedia', value)}
                    />
                    
                    <PermissionItem
                        title="Pin Messages"
                        description="Who can pin important messages"
                        value={permissions.pinMessages}
                        onChange={(value) => updatePermission('pinMessages', value)}
                    />
                </div>
            </div>

            {/* Save Button */}
            <div className="p-4 border-t border-gray-200 dark:border-wa-dark-border">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 bg-wa-teal text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-wa-tealDark transition-colors"
                >
                    {saving ? 'Saving...' : 'Save Permissions'}
                </button>
            </div>
        </div>
    );
};

/**
 * Permission Item Component - DRY principle
 */
const PermissionItem = ({ title, description, value, onChange }) => {
    const [expanded, setExpanded] = useState(false);

    const options = [
        { value: 'everyone', label: 'Everyone' },
        { value: 'admins', label: 'Only Admins' }
    ];

    return (
        <div className="border-b border-gray-200 dark:border-wa-dark-border">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-wa-dark-hover transition-colors"
            >
                <div className="flex-1 text-left">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
                    <p className="text-sm text-wa-teal mt-1 capitalize">{value}</p>
                </div>
            </button>

            {expanded && (
                <div className="px-4 pb-4">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setExpanded(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-wa-dark-hover rounded-lg transition-colors"
                        >
                            <span className="text-gray-900 dark:text-gray-100">{option.label}</span>
                            {value === option.value && (
                                <Check size={20} className="text-wa-teal" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GroupPermissions;
