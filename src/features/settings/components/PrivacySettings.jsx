import React, { useState } from 'react';
import { Lock, Unlock, Info, Users, ChevronRight, Eye, MessageCircle, Clock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/ui';
import SettingsHeader from '../../../shared/components/settings/SettingsHeader';
import SettingCard from '../../../shared/components/settings/SettingCard';
import userService from '../../../services/firebase/UserService';
import { useApp } from '../../../shared/context/AppContext';

/**
 * Privacy Settings Component
 * Toggle between private and public account with explanation
 * Includes blocked users management and status privacy controls
 */
const PrivacySettings = () => {
    const navigate = useNavigate();
    const { currentUser, updateUserProfile, statusPrivacy, privacySettings } = useApp();
    const [isPrivate, setIsPrivate] = useState(currentUser?.isPrivate || false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleTogglePrivacy = async () => {
        if (!currentUser?.id) return;

        setLoading(true);
        setError(null);

        try {
            const newPrivacyValue = !isPrivate;
            
            // Update in Firebase
            await userService.updateUserProfile(currentUser.id, {
                isPrivate: newPrivacyValue
            });

            // Update local state
            setIsPrivate(newPrivacyValue);
            
            // Update context if updateUserProfile exists
            if (updateUserProfile) {
                updateUserProfile(currentUser.name, currentUser.about, currentUser.avatar, { isPrivate: newPrivacyValue });
            }

            setLoading(false);
        } catch (err) {
            console.error('Privacy toggle error:', err);
            setError('Failed to update privacy settings');
            setLoading(false);
        }
    };

    const blockedUsersCount = currentUser?.blockedUsers?.length || 0;

    return (
        <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-wa-dark-bg flex flex-col animate-in slide-in-from-right duration-200">
            <SettingsHeader title="Privacy" />

            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-2xl mx-auto space-y-4">


                {/* Private Account Toggle */}
                <Card hover>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${isPrivate ? 'bg-wa-teal/10' : 'bg-wa-gray-100 dark:bg-wa-gray-800'}`}>
                            {isPrivate ? (
                                <Lock className="w-6 h-6 text-wa-teal" />
                            ) : (
                                <Unlock className="w-6 h-6 text-wa-gray-500" />
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-medium text-wa-gray-900 dark:text-gray-100">
                                    Private Account
                                </h3>

                                {/* Toggle Switch */}
                                <button
                                    onClick={handleTogglePrivacy}
                                    disabled={loading}
                                    className={`
                                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                                        ${isPrivate ? 'bg-wa-teal' : 'bg-wa-gray-300 dark:bg-wa-gray-700'}
                                        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                    role="switch"
                                    aria-checked={isPrivate}
                                    aria-label="Toggle private account"
                                >
                                    <span
                                        className={`
                                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                            ${isPrivate ? 'translate-x-6' : 'translate-x-1'}
                                        `}
                                    />
                                </button>
                            </div>

                            <p className="text-sm text-wa-gray-600 dark:text-gray-400 mb-3">
                                {isPrivate ? (
                                    'Your account is private. Only approved followers can see your profile and send you messages.'
                                ) : (
                                    'Your account is public. Anyone can see your profile and send you messages.'
                                )}
                            </p>

                            {/* Info Box */}
                            <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    {isPrivate ? (
                                        <>
                                            <p className="font-medium mb-1">How Private Accounts Work:</p>
                                            <ul className="list-disc list-inside space-y-1 text-xs">
                                                <li>Users must send you a follow request</li>
                                                <li>You can approve or reject requests</li>
                                                <li>Only accepted followers can message you</li>
                                                <li>Your profile is hidden from non-followers</li>
                                                <li>Status updates visible to followers only</li>
                                            </ul>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-medium mb-1">Public Account Benefits:</p>
                                            <ul className="list-disc list-inside space-y-1 text-xs">
                                                <li>Anyone can find and view your profile</li>
                                                <li>Users can message you directly</li>
                                                <li>No need to approve follow requests</li>
                                                    <li>Status updates visible to all contacts</li>
                                            </ul>
                                        </>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <p className="mt-2 text-sm text-wa-red">{error}</p>
                            )}
                        </div>
                    </div>
                </Card>

                    {/* WHO CAN SEE MY PERSONAL INFO */}
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 mt-6 mb-3">
                        Who can see my personal info
                    </p>

                    {/* Last Seen & Online */}
                    <SettingCard
                        icon={Clock}
                        title="Last Seen & Online"
                        value={privacySettings?.lastSeen === 'everyone' ? 'Everyone' : privacySettings?.lastSeen === 'my_contacts' ? 'My Contacts' : 'Nobody'}
                        onClick={() => navigate('/privacy/last-seen')}
                        iconBgColor="bg-blue-50 dark:bg-blue-900/20"
                        iconColor="text-blue-600 dark:text-blue-400"
                    />

                    {/* Profile Photo */}
                    <SettingCard
                        icon={Eye}
                        title="Profile Photo"
                        value={privacySettings?.profilePhoto === 'everyone' ? 'Everyone' : privacySettings?.profilePhoto === 'my_contacts' ? 'My Contacts' : 'Nobody'}
                        onClick={() => navigate('/privacy/profile-photo')}
                        iconBgColor="bg-purple-50 dark:bg-purple-900/20"
                        iconColor="text-purple-600 dark:text-purple-400"
                    />

                    {/* About */}
                    <SettingCard
                        icon={MessageCircle}
                        title="About"
                        value={privacySettings?.about === 'everyone' ? 'Everyone' : privacySettings?.about === 'my_contacts' ? 'My Contacts' : 'Nobody'}
                        onClick={() => navigate('/privacy/about')}
                        iconBgColor="bg-green-50 dark:bg-green-900/20"
                        iconColor="text-green-600 dark:text-green-400"
                    />

                    {/* Groups */}
                    <SettingCard
                        icon={Users}
                        title="Groups"
                        subtitle="Who can add me to groups"
                        value={privacySettings?.groups === 'everyone' ? 'Everyone' : privacySettings?.groups === 'my_contacts' ? 'My Contacts' : 'Nobody'}
                        onClick={() => navigate('/privacy/groups')}
                        iconBgColor="bg-orange-50 dark:bg-orange-900/20"
                        iconColor="text-orange-600 dark:text-orange-400"
                    />

                    {/* Status */}
                    <SettingCard
                        icon={Shield}
                        title="Status"
                        subtitle="Who can see my status updates"
                        value="My Contacts"
                        onClick={() => navigate('/status/privacy')}
                        iconBgColor="bg-teal-50 dark:bg-teal-900/20"
                        iconColor="text-teal-600 dark:text-teal-400"
                    />

                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">
                            DISAPPEARING MESSAGES
                        </h3>

                        <SettingCard
                            icon={Clock}
                            title="Default Message Timer"
                            subtitle="Set a timer for new chats"
                            value="Off"
                            onClick={() => navigate('/settings/privacy/disappearing-messages')}
                            iconBgColor="bg-indigo-50 dark:bg-indigo-900/20"
                            iconColor="text-indigo-600 dark:text-indigo-400"
                        />
                    </div>

                {/* Blocked Users */}

                <Card hover onClick={() => navigate('/settings/blocked-users')} className="cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20">
                                <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-wa-gray-900 dark:text-gray-100">
                                    Blocked Users
                                </h3>
                                <p className="text-sm text-wa-gray-500 dark:text-gray-400">
                                    {blockedUsersCount > 0 ? `${blockedUsersCount} blocked` : 'Manage blocked users'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                </Card>

                {/* Additional Privacy Info */}
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Privacy Tips
                    </h4>
                    <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                            <span className="text-wa-teal mt-0.5">✓</span>
                            <span>Block users who spam or harass you</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-wa-teal mt-0.5">✓</span>
                            <span>Use private account if you want to control who follows you</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-wa-teal mt-0.5">✓</span>
                            <span>Review follow requests regularly to maintain your privacy</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        </div>
    );

};

export default PrivacySettings;
