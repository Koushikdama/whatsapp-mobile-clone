import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, User } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
// import { useFollowActions } from '../../../shared/hooks/useFollowActions';
import followFirebaseService from '../../../services/firebase/FollowFirebaseService';
import userService from '../../../services/firebase/UserService';

const FollowRequests = () => {
    const navigate = useNavigate();
    const { currentUser, acceptRequest, rejectRequest } = useApp();
    // const { acceptRequest, rejectRequest, loading: actionLoading } = useFollowActions();
    
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        const loadRequests = async () => {
            if (!currentUser?.id) return;
            
            setLoading(true);
            try {
                // Get pending requests
                const { success, requests: pendingRequests } = await followFirebaseService.getPendingRequests(currentUser.id);
                
                if (success && pendingRequests.length > 0) {
                    // Enrich with user details
                    const enrichedRequests = await Promise.all(pendingRequests.map(async (req) => {
                        const { user } = await userService.getUser(req.followerId);
                        return {
                            ...req,
                            followerName: user?.name || 'Unknown User',
                            followerAvatar: user?.avatar,
                            followerEmail: user?.email
                        };
                    }));
                    setRequests(enrichedRequests);
                } else {
                    setRequests([]);
                }
            } catch (error) {
                console.error('Error loading requests:', error);
            } finally {
                setLoading(false);
            }
        };

        loadRequests();
    }, [currentUser?.id]);

    const handleAccept = async (request) => {
        setProcessingId(request.id);
        const result = await acceptRequest(request.followerId);
        if (result.success) {
            setRequests(prev => prev.filter(r => r.id !== request.id));
        }
        setProcessingId(null);
    };

    const handleReject = async (request) => {
        setProcessingId(request.id);
        const result = await rejectRequest(request.followerId);
        if (result.success) {
            setRequests(prev => prev.filter(r => r.id !== request.id));
        }
        setProcessingId(null);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-wa-dark-bg">
            {/* Header */}
            <div className="bg-white dark:bg-wa-dark border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <h1 className="text-xl font-medium text-gray-800 dark:text-gray-100">Follow Requests</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                            <User className="w-8 h-8 opacity-50" />
                        </div>
                        <p>No pending follow requests</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map((request) => (
                            <div 
                                key={request.id}
                                className="bg-white dark:bg-wa-dark p-4 rounded-xl shadow-sm flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={request.followerAvatar || `https://ui-avatars.com/api/?name=${request.followerName}`}
                                        alt={request.followerName}
                                        className="w-12 h-12 rounded-full object-cover bg-gray-200"
                                    />
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {request.followerName}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {request.followerEmail}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleAccept(request)}
                                        disabled={processingId === request.id}
                                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                        title="Accept"
                                    >
                                        <Check size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleReject(request)}
                                        disabled={processingId === request.id}
                                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                                        title="Reject"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FollowRequests;
