/**
 * Enhanced Calls Tab Component
 * Displays call history with missed call indicators, recording playback, and actions
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, ArrowUpRight, ArrowDownLeft, Link, ArrowLeft, PhoneMissed, Trash2, Filter } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import { useCall } from '../context/CallContext';
import { useCalls } from '../../../shared/hooks/data/useCalls';
import { formatTimestamp } from '../../../shared/utils/formatTime';
import CallRecordingPlayer from '../../../shared/components/media/CallRecordingPlayer';
import CallBadge from '../../../shared/components/notifications/CallBadge';
import callFirebaseService from '../../../services/firebase/CallFirebaseService';

const CallsTab = () => {
    const navigate = useNavigate();
    const { users, searchQuery, currentUser } = useApp();
    const { startCall } = useCall();
    const { calls, loading } = useCalls(currentUser?.id);

    const [filter, setFilter] = useState('all'); // all, missed, audio, video
    const [expandedRecording, setExpandedRecording] = useState(null);

    const handleCallClick = (contactId, type) => {
        startCall(contactId, type);
    };

    const handleDeleteCall = async (e, callId) => {
        e.stopPropagation();
        if (window.confirm('Delete this call from history?')) {
            await callFirebaseService.deleteCall(callId);
        }
    };

    const toggleRecording = (e, callId) => {
        e.stopPropagation();
        setExpandedRecording(expandedRecording === callId ? null : callId);
    };

    // Filter calls based on search and filter type
    const filteredCalls = calls
        .filter(call => {
            const user = users[call.contactId];
            if (!user) return false;

            // Search filter
            if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Type filter
            if (filter === 'missed' && call.status !== 'missed') return false;
            if (filter === 'audio' && call.type !== 'audio') return false;
            if (filter === 'video' && call.type !== 'video') return false;

            return true;
        })
        .sort((a, b) => {
            // Sort by timestamp, newest first
            const timeA = a.timestamp?.toMillis?.() || a.timestamp || 0;
            const timeB = b.timestamp?.toMillis?.() || b.timestamp || 0;
            return timeB - timeA;
        });

    // Count missed calls for badge
    const missedCount = calls.filter(c => c.status === 'missed').length;

    return (
        <div className="flex flex-col pb-20 bg-white dark:bg-wa-dark-bg min-h-full">

            {/* Desktop Header with Back Button */}
            <div className="hidden md:flex h-[60px] bg-wa-grayBg dark:bg-wa-dark-header items-center gap-3 px-4 shrink-0 border-b border-wa-border dark:border-wa-dark-border text-[#111b21] dark:text-gray-100 transition-colors sticky top-0 z-10">
                <button onClick={() => navigate('/chats')} className="p-2 -ml-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-medium md:text-lg flex items-center gap-2">
                    Calls
                    {missedCount > 0 && <CallBadge count={missedCount} />}
                </h2>
                <div className="ml-auto" />

                {/* Filter Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter === 'all'
                                ? 'bg-wa-teal text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('missed')}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter === 'missed'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        <PhoneMissed size={14} className="inline mr-1" />
                        Missed
                    </button>
                </div>
            </div>

            {!searchQuery && (
                <div className="flex items-center gap-4 px-4 py-3 cursor-pointer active:bg-wa-grayBg dark:active:bg-wa-dark-paper hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors">
                    <div className="w-12 h-12 rounded-full bg-wa-teal flex items-center justify-center text-white">
                        <Link size={24} className="-rotate-45" />
                    </div>
                    <div>
                        <h3 className="text-[17px] text-[#111b21] dark:text-gray-100 font-medium">Create call link</h3>
                        <p className="text-[13px] text-[#667781] dark:text-gray-500">Share a link for your WhatsApp call</p>
                    </div>
                </div>
            )}

            <div className="px-4 py-2 text-[#667781] dark:text-gray-400 text-[15px] font-medium mt-2">
                {searchQuery ? 'Search Results' : 'Recent'}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wa-teal"></div>
                </div>
            ) : filteredCalls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-[#667781] dark:text-gray-500 text-sm">
                    <p>No calls found {searchQuery ? `matching "${searchQuery}"` : ''}</p>
                </div>
            ) : (
                filteredCalls.map((call) => {
                    const user = users[call.contactId];
                    if (!user) return null;

                    const isMissed = call.status === 'missed';
                    const hasRecording = call.recordingUrl;

                    return (
                        <div key={call.id} className="border-b border-wa-border dark:border-wa-dark-border last:border-b-0">
                            <div
                                className="flex items-center gap-4 px-4 py-3 cursor-pointer active:bg-wa-grayBg dark:active:bg-wa-dark-paper hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors"
                                onClick={() => handleCallClick(call.contactId, call.type)}
                            >
                                <div className="relative">
                                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                                    {isMissed && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-wa-dark-bg">
                                            <PhoneMissed size={10} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex justify-between items-center">
                                    <div>
                                        <h3 className={`text-[17px] font-medium ${isMissed ? 'text-red-500' : 'text-[#111b21] dark:text-gray-100'}`}>
                                            {user.name}
                                        </h3>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {call.direction === 'incoming' && <ArrowDownLeft size={16} className="text-wa-lightGreen" />}
                                            {call.direction === 'outgoing' && <ArrowUpRight size={16} className="text-wa-lightGreen" />}
                                            {call.status === 'missed' && <PhoneMissed size={16} className="text-red-500" />}
                                            <span className="text-[13px] text-[#667781] dark:text-gray-500">
                                                {formatTimestamp(call.timestamp?.toMillis ? call.timestamp.toMillis() : call.timestamp)}
                                                {call.duration > 0 && ` (${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')})`}
                                            </span>
                                        </div>
                                        {hasRecording && (
                                            <button
                                                onClick={(e) => toggleRecording(e, call.id)}
                                                className="text-xs text-wa-teal hover:underline mt-1"
                                            >
                                                {expandedRecording === call.id ? 'Hide' : 'View'} Recording
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-wa-teal dark:text-wa-teal p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                            {call.type === 'audio' ? <Phone size={22} /> : <Video size={24} />}
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteCall(e, call.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                            title="Delete call"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recording Player (Expandable) */}
                            {hasRecording && expandedRecording === call.id && (
                                <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/50">
                                    <CallRecordingPlayer
                                        recordingUrl={call.recordingUrl}
                                        duration={call.recordingDuration}
                                        participants={[user.name]}
                                        timestamp={call.timestamp?.toMillis ? call.timestamp.toMillis() : call.timestamp}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default CallsTab;
