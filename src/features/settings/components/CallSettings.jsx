/**
 * Call Settings Component
 * User preferences for calls and privacy settings
 */

import React, { useState, useEffect } from 'react';
import { Phone, Video, Mic, Bell, Shield, Info } from 'lucide-react';
import storage from '../../../shared/utils/storage';

const CallSettings = () => {
  const [settings, setSettings] = useState({
    autoRecordMissed: false,
    showRecordingIndicator: true,
    defaultCamera: 'user', // 'user' or 'environment'
    notifyIncomingCalls: true,
    notifyMissedCalls: true,
    vibrate: true
  });

  // Load settings from storage
  useEffect(() => {
    const savedSettings = {
      autoRecordMissed: storage.local.get('call_auto_record_missed', false),
      showRecordingIndicator: storage.local.get('call_show_recording_indicator', true),
      defaultCamera: storage.local.get('call_default_camera', 'user'),
      notifyIncomingCalls: storage.local.get('call_notify_incoming', true),
      notifyMissedCalls: storage.local.get('call_notify_missed', true),
      vibrate: storage.local.get('call_vibrate', true)
    };
    setSettings(savedSettings);
  }, []);

  // Save setting to storage
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Save to localStorage
    const storageKey = `call_${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`;
    storage.local.set(storageKey, value);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Call Settings</h1>

      {/* Privacy & Recording Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="text-wa-teal" size={20} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy & Recording</h2>
        </div>

        {/* Auto-Record Missed Calls */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Video size={18} className="text-gray-600 dark:text-gray-400" />
                <h3 className="font-medium text-gray-900 dark:text-white">Auto-Record Missed Calls</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                Automatically record a short clip when you miss a call. Recording will be saved for playback later.
              </p>
              <div className="mt-2 ml-6 flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <Info size={14} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Both parties will be notified when recording starts. Recordings are stored locally and encrypted.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={settings.autoRecordMissed}
                onChange={(e) => updateSetting('autoRecordMissed', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wa-teal/20 dark:peer-focus:ring-wa-teal/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-wa-teal"></div>
            </label>
          </div>
        </div>

        {/* Show Recording Indicator */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <h3 className="font-medium text-gray-900 dark:text-white">Show Recording Indicator</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-5">
                Display a visual indicator when calls are being recorded
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={settings.showRecordingIndicator}
                onChange={(e) => updateSetting('showRecordingIndicator', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wa-teal/20 dark:peer-focus:ring-wa-teal/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-wa-teal"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="text-wa-teal" size={20} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
        </div>

        {/* Notify Incoming Calls */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">Incoming Call Notifications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Show notifications when receiving calls</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={settings.notifyIncomingCalls}
                onChange={(e) => updateSetting('notifyIncomingCalls', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wa-teal/20 dark:peer-focus:ring-wa-teal/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-wa-teal"></div>
            </label>
          </div>
        </div>

        {/* Notify Missed Calls */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">Missed Call Notifications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Alert when you miss a call</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={settings.notifyMissedCalls}
                onChange={(e) => updateSetting('notifyMissedCalls', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wa-teal/20 dark:peer-focus:ring-wa-teal/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-wa-teal"></div>
            </label>
          </div>
        </div>

        {/* Vibrate */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">Vibrate on Call</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vibrate when receiving calls (mobile only)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={settings.vibrate}
                onChange={(e) => updateSetting('vibrate', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wa-teal/20 dark:peer-focus:ring-wa-teal/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-wa-teal"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Camera Settings */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Video className="text-wa-teal" size={20} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Camera</h2>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Default Camera</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <input
                type="radio"
                name="camera"
                value="user"
                checked={settings.defaultCamera === 'user'}
                onChange={(e) => updateSetting('defaultCamera', e.target.value)}
                className="w-4 h-4 text-wa-teal border-gray-300 focus:ring-wa-teal focus:ring-2"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Front Camera</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use front-facing camera by default</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <input
                type="radio"
                name="camera"
                value="environment"
                checked={settings.defaultCamera === 'environment'}
                onChange={(e) => updateSetting('defaultCamera', e.target.value)}
                className="w-4 h-4 text-wa-teal border-gray-300 focus:ring-wa-teal focus:ring-2"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Back Camera</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use rear-facing camera by default</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex gap-2">
          <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Privacy Notice</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Recording calls without consent may violate privacy laws in your jurisdiction. 
              Both parties will be notified when recording starts. All recordings are encrypted and stored securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallSettings;
