import React from 'react';
import { CheckCircle2, MessageCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * UserCard - Instagram-style user card with follow and message buttons
 */
const UserCard = ({ user, isFollowing, onFollow, onUnfollow, onMessage, mutualCount = 0 }) => {
    const navigate = useNavigate();

    const handleButtonClick = (e) => {
        e.stopPropagation();
        if (isFollowing) {
            onUnfollow();
        } else {
            onFollow();
        }
    };

    const handleMessageClick = (e) => {
        e.stopPropagation();
        if (onMessage) {
            onMessage();
        }
    };

    const handleCardClick = () => {
        navigate(`/profile/${user.id}`);
    };

    return (
        <div 
            onClick={handleCardClick}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-wa-dark-hover transition-colors cursor-pointer"
        >
            {/* Avatar */}
            <div className="relative">
                <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-medium text-[#111b21] dark:text-gray-100 truncate">
                    {user.name}
                </h3>
                <p className="text-[13px] text-[#667781] dark:text-gray-400 truncate">
                    {user.about || 'Hey there! I am using WhatsApp.'}
                </p>
                {mutualCount > 0 && (
                    <p className="text-[12px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                        <Users size={12} />
                        {mutualCount} mutual connection{mutualCount > 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Message Button - Only show if following */}
                {isFollowing && onMessage && (
                    <button
                        onClick={handleMessageClick}
                        className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all active:scale-95"
                        title="Message"
                    >
                        <MessageCircle size={18} />
                    </button>
                )}

                {/* Follow Button */}
                <button
                    onClick={handleButtonClick}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isFollowing
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1'
                            : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                    }`}
                >
                    {isFollowing ? (
                        <>
                            <CheckCircle2 size={14} />
                            Following
                        </>
                    ) : (
                        'Follow'
                    )}
                </button>
            </div>
        </div>
    );
};

export default UserCard;
