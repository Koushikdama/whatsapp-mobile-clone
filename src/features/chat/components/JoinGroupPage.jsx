import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import groupInviteLinkService from '../../../services/GroupInviteLinkService';

/**
 * JoinGroupPage Component
 * Handles joining groups via invite links
 */
const JoinGroupPage = () => {
    const { linkId } = useParams();
    const navigate = useNavigate();
    const { currentUser, addGroupParticipants, chats } = useApp();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [groupInfo, setGroupInfo] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (linkId && currentUser?.id) {
            handleJoin();
        }
    }, [linkId, currentUser?.id]);

    const handleJoin = async () => {
        try {
            setLoading(true);
            
            // Validate invite link
            const result = await groupInviteLinkService.validateInviteLink(linkId);
            
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }

            // Get group info
            const group = chats.find(c => c.id === result.groupId);
            
            if (!group) {
                setError('Group not found');
                setLoading(false);
                return;
            }

            // Check if already a member
            if (group.groupParticipants?.includes(currentUser.id)) {
                setGroupInfo(group);
                setSuccess(true);
                setLoading(false);
                
                // Navigate to group after delay
                setTimeout(() => {
                    navigate(`/chat/${result.groupId}`);
                }, 1500);
                return;
            }

            setGroupInfo(group);

            // Add user to group
            await addGroupParticipants(result.groupId, [currentUser.id]);
            
            // Record link usage
            await groupInviteLinkService.recordLinkUsage(linkId);

            setSuccess(true);
            setLoading(false);

            // Navigate to group chat after delay
            setTimeout(() => {
                navigate(`/chat/${result.groupId}`);
            }, 2000);

        } catch (err) {
            console.error('Join group error:', err);
            setError(err.message || 'Failed to join group');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-wa-grayBg dark:bg-wa-dark-bg">
                <div className="w-12 h-12 border-4 border-wa-teal border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Joining group...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-wa-grayBg dark:bg-wa-dark-bg p-4">
                <div className="bg-white dark:bg-wa-dark-paper rounded-lg p-6 max-w-md w-full text-center shadow-lg">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-medium text-[#111b21] dark:text-gray-100 mb-2">Unable to Join</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <button 
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-wa-teal text-white rounded-lg hover:bg-wa-tealDark transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (success && groupInfo) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-wa-grayBg dark:bg-wa-dark-bg p-4">
                <div className="bg-white dark:bg-wa-dark-paper rounded-lg p-6 max-w-md w-full text-center shadow-lg">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} className="text-green-500" />
                    </div>
                    <h2 className="text-xl font-medium text-[#111b21] dark:text-gray-100 mb-2">Success!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">You've joined</p>
                    <p className="text-wa-teal font-medium text-lg mb-4">{groupInfo.groupName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Redirecting to chat...</p>
                </div>
            </div>
        );
    }

    return null;
};

export default JoinGroupPage;
