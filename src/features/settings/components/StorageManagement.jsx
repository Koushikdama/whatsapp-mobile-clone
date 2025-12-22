/**
 * Storage Management Page
 * Shows storage usage with donut chart, chat selection dropdown, and storage breakdown
 * Follows DRY and SOLID principles
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../../shared/context/AppContext';
import SettingsHeader from '../../../shared/components/settings/SettingsHeader';
import DonutChart from '../../../shared/components/settings/DonutChart';
import { ChevronDown, Image, File, Music, FileText } from 'lucide-react';

const StorageManagement = () => {
  const { chats, messages, users } = useApp();
  const [selectedChatId, setSelectedChatId] = useState('all');

  // Calculate storage for each message type
  const calculateStorage = useMemo(() => {
    const storage = {
      media: 0,
      audio: 0,
      files: 0,
      documents: 0,
      other: 0,
      byChat: {}
    };

    const chatsToAnalyze = selectedChatId === 'all' 
      ? Object.keys(messages)
      : [selectedChatId];

    chatsToAnalyze.forEach(chatId => {
      const chatMessages = messages[chatId] || [];
      let chatStorage = { media: 0, audio: 0, files: 0, documents: 0, other: 0, total: 0, count: 0 };

      chatMessages.forEach(msg => {
        if (msg.image) {
          const size = 500 * 1024; // Assume 500KB per image
          storage.media += size;
          chatStorage.media += size;
          chatStorage.count++;
        }
        if (msg.audio) {
          const size = 300 * 1024; // Assume 300KB per audio
          storage.audio += size;
          chatStorage.audio += size;
          chatStorage.count++;
        }
        if (msg.file && msg.file.type?.startsWith('audio')) {
          const size = msg.file.size || 300 * 1024;
          storage.audio += size;
          chatStorage.audio += size;
          chatStorage.count++;
        } else if (msg.file && msg.file.type?.startsWith('image')) {
          const size = msg.file.size || 500 * 1024;
          storage.media += size;
          chatStorage.media += size;
          chatStorage.count++;
        } else if (msg.file) {
          const size = msg.file.size || 200 * 1024;
          storage.files += size;
          chatStorage.files += size;
          chatStorage.count++;
        }
        if (msg.document) {
          const size = 200 * 1024; // Assume 200KB per document
          storage.documents += size;
          chatStorage.documents += size;
          chatStorage.count++;
        }
        // Text messages contribute minimal storage
        const textSize = (msg.text?.length || 0) * 2; // 2 bytes per character
        storage.other += textSize;
        chatStorage.other += textSize;
      });

      chatStorage.total =
 chatStorage.media + chatStorage.audio + chatStorage.files + chatStorage.documents + chatStorage.other;
      storage.byChat[chatId] = chatStorage;
    });

    return storage;
  }, [messages, selectedChatId]);

  const totalStorage = useMemo(() => {
    return calculateStorage.media + calculateStorage.audio + 
           calculateStorage.files + calculateStorage.documents + 
           calculateStorage.other;
  }, [calculateStorage]);

  const chartData = [
    { label: 'Media', value: calculateStorage.media, color: '#008069' },
    { label: 'Audio', value: calculateStorage.audio, color: '#FF9800' },
    { label: 'Files', value: calculateStorage.files, color: '#2196F3' },
    { label: 'Other', value: calculateStorage.other + calculateStorage.documents, color: '#9E9E9E' }
  ].filter(item => item.value > 0);

  // Sort chats by storage usage
  const sortedChats = useMemo(() => {
    return Object.entries(calculateStorage.byChat)
      .map(([chatId, storage]) => ({
        chatId,
        ...storage,
        chat: chats.find(c => c.id === chatId)
      }))
      .filter(item => item.chat && item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [calculateStorage.byChat, chats]);

  const getChatName = (chat) => {
    if (chat.isGroup) return chat.groupName;
    const contact = users[chat.contactId];
    return contact?.name || 'Unknown';
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroup) return chat.groupAvatar;
    const contact = users[chat.contactId];
    return contact?.avatar;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-wa-dark-bg">
      <SettingsHeader title="Storage and Data" />

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Storage Overview */}
        <div className="bg-white dark:bg-wa-dark-paper rounded-lg p-4 sm:p-6 shadow-sm">
          <DonutChart 
            data={chartData} 
            total={totalStorage}
            size={220}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button className="px-4 py-2 text-sm font-medium text-wa-teal border-b-2 border-wa-teal">
            Media
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            Files
          </button>
        </div>

        {/* Chat Selector Dropdown */}
        <div className="bg-white dark:bg-wa-dark-paper rounded-lg p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by Chat
          </label>
          <div className="relative">
            <select
              value={selectedChatId}
              onChange={(e) => setSelectedChatId(e.target.value)}
              className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none cursor-pointer text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-wa-teal focus:border-transparent"
            >
              <option value="all">All Chats</option>
              {chats.map(chat => (
                <option key={chat.id} value={chat.id}>
                  {getChatName(chat)} {chat.isGroup ? '(Group)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Manage Storage Section */}
        <div className="bg-white dark:bg-wa-dark-paper rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Manage Storage
            </h3>
          </div>

          {sortedChats.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>No storage data available</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedChats.map(({ chatId, chat, total, media, audio, files, count }) => (
                <div 
                  key={chatId}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                        {getChatAvatar(chat) ? (
                          <img 
                            src={getChatAvatar(chat)} 
                            alt={getChatName(chat)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold">
                            {getChatName(chat).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {getChatName(chat)}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {media > 0 && (
                            <span className="flex items-center gap-1">
                              <Image size={12} />
                              {(media / 1024 / 1024).toFixed(1)} MB
                            </span>
                          )}
                          {audio > 0 && (
                            <span className="flex items-center gap-1">
                              <Music size={12} />
                              {(audio / 1024 / 1024).toFixed(1)} MB
                            </span>
                          )}
                          {files > 0 && (
                            <span className="flex items-center gap-1">
                              <File size={12} />
                              {(files / 1024 / 1024).toFixed(1)} MB
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Total Size */}
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {(total / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {count} {count === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageManagement;
