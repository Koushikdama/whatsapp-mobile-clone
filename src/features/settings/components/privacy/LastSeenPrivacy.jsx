import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsHeader from '../../../../shared/components/settings/SettingsHeader';
import PrivacyOptionSelector from '../../../../shared/components/settings/PrivacyOptionSelector';
import { useApp } from '../../../../shared/context/AppContext';

/**
 * Last Seen & Online Privacy Settings
 * Control who can see when user was last online
 */
const LastSeenPrivacy = () => {
  const navigate = useNavigate();
  const { privacySettings, updatePrivacySettings } = useApp();
  const [loading, setLoading] = useState(false);

  const handleChange = async (value) => {
    setLoading(true);
    try {
      await updatePrivacySettings({ lastSeen: value });
    } catch (error) {
      console.error('Error updating last seen privacy:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-wa-dark-bg flex flex-col animate-in slide-in-from-right duration-200">
      <SettingsHeader title="Last Seen & Online" />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 px-2">
            Who can see my last seen and online status
          </p>

          {/* Privacy Options */}
          <PrivacyOptionSelector
            value={privacySettings.lastSeen}
            onChange={handleChange}
            loading={loading}
          />

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> If you don't share your last seen, you won't be able to see other people's last seen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LastSeenPrivacy;
