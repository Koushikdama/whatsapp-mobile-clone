import React, { useState, useEffect } from 'react';
import { Check, X, User } from 'lucide-react';
import { Avatar, Badge, Button, Card } from '../../../shared/components/ui';
import { useApp } from '../../../shared/context/AppContext';
import followFirebaseService from '../../../services/firebase/FollowFirebaseService';
import userService from '../../../services/firebase/UserService';

/**
 * Follow Request List Component
 * Display and manage incoming follow requests for private accounts
 */
const FollowRequestList = () => {
    const { currentUser } = useApp();
    const [requests, setRequests] = useState([]);
    const [requestUsers, setRequestUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState(new Set());

    // Load pending requests
    useEffect(() => {
        if (!currentUser?.id) return;

        const loadRequests = async () => {
            setLoading(true);
            try {
                const { success, requests: pendingRequests } = await followFirebaseService.getPendingRequests(currentUser.id);
                
                if (success) {
                    setRequests(pendingRequests);
                    
                    // Load user details for each request
                    const userPromises = pendingRequests.map(req => 
                        userService.getUser(req.followerId)
                    );
                    const userResults = await Promise.all(userPromises);
                    
                    const usersMap = {};
                    userResults.forEach((result, index) => {
                        if (result.success) {
                            usersMap[pendingRequests[index].followerId] = result.user;
                        }
                    });
                    
                    setRequestUsers(usersMap);
                }
            } catch (error) {
                console.error('Error loading requests:', error);
            }
            setLoading(false);
        };

        loadRequests();
    }, [currentUser]);

    const handleAccept = async (followerId) => {
        if (!currentUser?.id) return;

        setProcessingIds(prev => new Set([...prev, followerId]));

        try {
            const result = await followFirebaseService.acceptFollowRequest(followerId, currentUser.id);
            
            if (result.success) {
                // Remove from list
                setRequests(prev => prev.filter(req => req.followerId !== followerId));
            }
        } catch (error) {
            console.error('Error accepting request:', error);
        }

        setProcessingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(followerId);
            return newSet;
        });
    };

    const handleReject = async (followerId) => {
        if (!currentUser?.id) return;

        setProcessingIds(prev => new Set([...prev, followerId]));

        try {
            const result = await followFirebaseService.rejectFollowRequest(followerId, currentUser.id);
            
            if (result.success) {
                // Remove from list
                setRequests(prev => prev.filter(req => req.followerId !== followerId));
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
        }

        setProcessingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(followerId);
            return newSet;
        });
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto p-4">
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-wa-gray-900 dark:text-gray-100">
                        Follow Requests
                    </h2>
                    <p className="text-sm text-wa-gray-500 dark:text-gray-400">
                        {requests.length} pending {requests.length === 1 ? 'request' : 'requests'}
                    </p>
                </div>
                {requests.length > 0 && (
                    <Badge variant="primary" size="md">
                        {requests.length}
                    </Badge>
                )}
            </div>

            {requests.length === 0 ? (
                <Card>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-wa-gray-100 dark:bg-wa-gray-800 flex items-center justify-center mb-4">
                            <User className="w-8 h-8 text-wa-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-wa-gray-900 dark:text-gray-100 mb-2">
                            No Pending Requests
                        </h3>
                        <p className="text-sm text-wa-gray-500 dark:text-gray-400">
                            When someone requests to follow you, their request will appear here
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-2">
                    {requests.map((request) => {
                        const user = requestUsers[request.followerId];
                        const isProcessing = processingIds.has(request.followerId);

                        return (
                            <Card key={request.id} hover className="transition-all">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        src={user?.avatar}
                                        alt={user?.name || 'User'}
                                        size="lg"
                                        fallback={user?.name?.[0]}
                                    />
                                    
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-wa-gray-900 dark:text-gray-100 truncate">
                                            {user?.name || 'Unknown User'}
                                        </h3>
                                        <p className="text-sm text-wa-gray-500 dark:text-gray-400 truncate">
                                            {user?.about || 'No bio'}
                                        </p>
                                        <p className="text-xs text-wa-gray-400 dark:text-gray-500 mt-1">
                                            Requested {new Date(request.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-2 shrink-0">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleAccept(request.followerId)}
                                            disabled={isProcessing}
                                            className="!px-3"
                                        >
                                            <Check size={18} />
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleReject(request.followerId)}
                                            disabled={isProcessing}
                                            className="!px-3"
                                        >
                                            <X size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FollowRequestList;
