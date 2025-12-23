import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsHeader from '../../../../shared/components/settings/SettingsHeader';
import PrivacyOptionSelector from '../../../../shared/components/settings/PrivacyOptionSelector';
import { useApp } from '../../../../shared/context/AppContext';

/**
 * Groups Privacy Settings
 * Control who can add user to groups
 */
const GroupsPrivacy = () => {
  const navigate = useNavigate();
  const { privacySettings, updatePrivacySettings } = useApp();
  const [loading, setLoading] = useState(false);

  const handleChange = async (value) => {
    setLoading(true);
    try {
      await updatePrivacySettings({ groups: value });
    } catch (error) {
      console.error('Error updating groups privacy:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-wa-dark-bg flex flex-col animate-in slide-in-from-right duration-200">
      <SettingsHeader title="Groups" />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 px-2">
            Who can add me to groups
          </p>

          {/* Privacy Options */}
          <PrivacyOptionSelector
            value={privacySettings.groups}
            onChange={handleChange}
            loading={loading}
          />

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> When set to "My Contacts" or "Nobody", people will need to send you a group invite that you can accept or decline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupsPrivacy;
