/**
 * Group Feature Settings Component
 * Allows admins to configure walkie-talkie, music sharing, and call recording settings
 */

import React, { useState } from 'react';
import { Mic, Music, Phone, ChevronRight, Users } from 'lucide-react';
import { useGroupSettings } from '../hooks/useGroupSettings';

const GroupFeatureSettings = ({ groupId, userRole, participants = [] }) => {
    const { settings, updateSettings, loading } = useGroupSettings(groupId);
    const [saving, setSaving] = useState(false);

    const isAdmin = userRole === 'admin' || userRole === 'owner';

    const handleToggle = async (settingKey, value) => {
        setSaving(true);
        await updateSettings({ [settingKey]: value });
        setSaving(false);
    };

    const handlePermissionChange = async (settingKey, value) => {
        setSaving(true);
        await updateSettings({ [settingKey]: value });
        setSaving(false);
    };

    if (!isAdmin) {
        return (
            <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                Only group admins can modify these settings
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-wa-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-wa-dark-bg">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Feature Settings
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Configure group features and permissions
                </p>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Walkie-Talkie Settings */}
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                            <Mic size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                Walkie-Talkie
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Push-to-talk audio for group
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.walkieTalkieEnabled}
                                onChange={(e) => handleToggle('walkieTalkieEnabled', e.target.checked)}
                                disabled={saving}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wa-teal/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-wa-teal"></div>
                        </label>
                    </div>

                    {settings.walkieTalkieEnabled && (
                        <div className="ml-13 space-y-2">
                            <label className="text-sm text-gray-700 dark:text-gray-300">
                                Who can use:
                            </label>
                            <select
                                value={settings.walkieTalkiePermission}
                                onChange={(e) => handlePermissionChange('walkieTalkiePermission', e.target.value)}
                                disabled={saving}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-wa-teal focus:border-transparent"
                            >
                                <option value="all">All members</option>
                                <option value="admins">Only admins</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Music Sharing Settings */}
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <Music size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                Music Sharing
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Synchronized music playback
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.musicSharingEnabled}
                                onChange={(e) => handleToggle('musicSharingEnabled', e.target.checked)}
                                disabled={saving}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wa-teal/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-wa-teal"></div>
                        </label>
                    </div>

                    {settings.musicSharingEnabled && (
                        <div className="ml-13 space-y-2">
                            <label className="text-sm text-gray-700 dark:text-gray-300">
                                Who can share:
                            </label>
                            <select
                                value={settings.musicSharingPermission}
                                onChange={(e) => handlePermissionChange('musicSharingPermission', e.target.value)}
                                disabled={saving}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-wa-teal focus:border-transparent"
                            >
                                <option value="all">All members</option>
                                <option value="admins">Only admins</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Call Recording Settings */}
                <div className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <Phone size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                Call Recording
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Record missed group calls
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.callRecordingEnabled}
                                onChange={(e) => handleToggle('callRecordingEnabled', e.target.checked)}
                                disabled={saving}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wa-teal/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-wa-teal"></div>
                        </label>
                    </div>
                </div>
            </div>

            {saving && (
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                        Saving changes...
                    </p>
                </div>
            )}
        </div>
    );
};

export default GroupFeatureSettings;
