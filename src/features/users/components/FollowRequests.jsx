import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, User, Clock, Search } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import followFirebaseService from '../../../services/firebase/FollowFirebaseService';
import userService from '../../../services/firebase/UserService';

const FollowRequests = () => {
    const navigate = useNavigate();
    const { currentUser, pendingRequests, acceptRequest, rejectRequest } = useApp();
    
    const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' or 'outgoing'
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadRequests();
    }, [currentUser?.id]);

    const loadRequests = async () => {
        if (!currentUser?.id) return;

        setLoading(true);
        try {
            // Get incoming pending requests
            const { success: incomingSuccess, requests: incomingPending } = await followFirebaseService.getPendingRequests(currentUser.id);

            if (incomingSuccess && incomingPending.length > 0) {
            // Enrich with user details
                const enrichedIncoming = await Promise.all(incomingPending.map(async (req) => {
                    const { user } = await userService.getUser(req.followerId);
                    return {
                        ...req,
                        user: user || { name: 'Unknown User', avatar: null, email: '' }
                    };
                }));
                setIncomingRequests(enrichedIncoming);
            } else {
                setIncomingRequests([]);
            }

            // Get outgoing requests
            const { success: outgoingSuccess, requests: outgoingPending } = await followFirebaseService.getOutgoingRequests(currentUser.id);

            if (outgoingSuccess && outgoingPending.length > 0) {
                // Enrich with user details
                const enrichedOutgoing = await Promise.all(outgoingPending.map(async (req) => {
                    const { user } = await userService.getUser(req.followingId);
                    return {
                        ...req,
                        user: user || { name: 'Unknown User', avatar: null, email: '' }
                    };
                }));
                setOutgoingRequests(enrichedOutgoing);
            } else {
                setOutgoingRequests([]);
            }
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (request) => {
        setProcessingId(request.id);
        try {
            const result = await followFirebaseService.acceptFollowRequest(request.followerId, currentUser.id);
            if (result.success) {
                setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            alert('Failed to accept request. Please try again.');
        }
        setProcessingId(null);
    };

    const handleRejectRequest = async (request) => {
        setProcessingId(request.id);
        try {
            const result = await followFirebaseService.rejectFollowRequest(request.followerId, currentUser.id);
            if (result.success) {
                setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Failed to reject request. Please try again.');
        }
        setProcessingId(null);
    };

    const handleCancelRequest = async (request) => {
        setProcessingId(request.id);
        try {
            const result = await followFirebaseService.cancelFollowRequest(currentUser.id, request.followingId);
            if (result.success) {
                setOutgoingRequests(prev => prev.filter(r => r.id !== request.id));
            }
        } catch (error) {
            console.error('Error canceling request:', error);
            alert('Failed to cancel request. Please try again.');
        }
        setProcessingId(null);
    };

    const handleAcceptAll = async () => {
        if (!confirm(`Accept all ${incomingRequests.length} follow requests?`)) return;

        setLoading(true);
        for (const request of incomingRequests) {
            try {
                await followFirebaseService.acceptFollowRequest(request.followerId, currentUser.id);
            } catch (error) {
                console.error('Error accepting request:', error);
            }
        }
        await loadRequests();
    };

    const handleRejectAll = async () => {
        if (!confirm(`Reject all ${incomingRequests.length} follow requests?`)) return;

        setLoading(true);
        for (const request of incomingRequests) {
            try {
                await followFirebaseService.rejectFollowRequest(request.followerId, currentUser.id);
            } catch (error) {
                console.error('Error rejecting request:', error);
            }
        }
        await loadRequests();
    };

    const currentRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;
    const filteredRequests = currentRequests.filter(req =>
        req.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const RequestCard = ({ request, type }) => (
        <div className="bg-white dark:bg-wa-dark p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => navigate(`/profile/${type === 'incoming' ? request.followerId : request.followingId}`)}
                >
                    <img 
                        src={request.user?.avatar || `https://ui-avatars.com/api/?name=${request.user?.name || 'User'}`}
                        alt={request.user?.name}
                        className="w-12 h-12 rounded-full object-cover bg-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {request.user?.name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {request.user?.about || 'Hey there! I am using WhatsApp'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-2">
                    {type === 'incoming' ? (
                        <>
                            <button
                                onClick={() => handleAcceptRequest(request)}
                                disabled={processingId === request.id}
                                className="p-2 bg-wa-teal text-white rounded-lg hover:bg-wa-teal-dark disabled:opacity-50 transition-colors"
                                title="Accept"
                            >
                                <Check size={20} />
                            </button>
                            <button
                                onClick={() => handleRejectRequest(request)}
                                disabled={processingId === request.id}
                                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                                title="Reject"
                            >
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => handleCancelRequest(request)}
                            disabled={processingId === request.id}
                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm font-medium"
                        >
                            {processingId === request.id ? 'Canceling...' : 'Cancel'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-wa-dark-bg">
            {/* Header */}
            <div className="bg-white dark:bg-wa-dark border-b border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-xl font-medium text-gray-800 dark:text-gray-100">Follow Requests</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activeTab === 'incoming' ? `${incomingRequests.length} incoming` : `${outgoingRequests.length} outgoing`}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('incoming')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'incoming'
                                ? 'text-wa-teal dark:text-wa-teal'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Incoming {incomingRequests.length > 0 && `(${incomingRequests.length})`}
                        {activeTab === 'incoming' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-wa-teal" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('outgoing')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'outgoing'
                                ? 'text-wa-teal dark:text-wa-teal'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Outgoing {outgoingRequests.length > 0 && `(${outgoingRequests.length})`}
                        {activeTab === 'outgoing' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-wa-teal" />
                        )}
                    </button>
                </div>

                {/* Search and Batch Actions */}
                {currentRequests.length > 0 && (
                    <div className="p-4 space-y-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wa-teal"
                            />
                        </div>

                        {/* Batch Actions for Incoming */}
                        {activeTab === 'incoming' && incomingRequests.length > 1 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAcceptAll}
                                    className="flex-1 py-2 px-3 bg-wa-teal text-white rounded-lg text-sm font-medium hover:bg-wa-teal-dark transition-colors"
                                >
                                    Accept All
                                </button>
                                <button
                                    onClick={handleRejectAll}
                                    className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Reject All
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                            {activeTab === 'incoming' ? (
                                <User className="w-8 h-8 opacity-50" />
                            ) : (
                                <Clock className="w-8 h-8 opacity-50" />
                            )}
                            </div>
                            <p className="text-center font-medium mb-1">
                                {searchQuery ? 'No requests found' : activeTab === 'incoming' ? 'No incoming requests' : 'No outgoing requests'}
                            </p>
                            <p className="text-sm text-center max-w-xs">
                                {searchQuery
                                    ? `No requests matching "${searchQuery}"`
                                    : activeTab === 'incoming'
                                        ? 'When someone requests to follow you, their request will appear here'
                                        : 'Your outgoing follow requests will appear here'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-w-2xl mx-auto">
                            {filteredRequests.map((request) => (
                                <RequestCard
                                    key={request.id}
                                    request={request}
                                    type={activeTab}
                                />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FollowRequests;
