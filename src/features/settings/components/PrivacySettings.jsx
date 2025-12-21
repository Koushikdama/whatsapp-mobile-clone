import React, { useState } from 'react';
import { Lock, Unlock, Info, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/components/ui';
import userService from '../../../services/firebase/UserService';
import { useApp } from '../../../shared/context/AppContext';

/**
 * Privacy Settings Component
 * Toggle between private and public account with explanation
 * Includes blocked users management and status privacy controls
 */
const PrivacySettings = () => {
    const navigate = useNavigate();
    const { currentUser, updateUserProfile } = useApp();
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
        <div className="min-h-screen bg-gray-50 dark:bg-wa-dark-bg pb-20 md:pb-4">
            <div className="max-w-2xl mx-auto p-4 space-y-4">
                <div>
                    <h2 className="text-2xl font-semibold text-wa-gray-900 dark:text-gray-100 mb-2">
                        Privacy Settings
                    </h2>
                    <p className="text-sm text-wa-gray-500 dark:text-gray-400">
                        Control who can see your profile and send you messages
                    </p>
                </div>

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
    );
};

export default PrivacySettings;
