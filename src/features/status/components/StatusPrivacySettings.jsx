import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, UserX, Check, Globe, Archive } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';


const StatusPrivacySettings = () => {
    const navigate = useNavigate();
    const { statusPrivacy, setStatusPrivacy, chats, users } = useApp();
    const [selectedPrivacy, setSelectedPrivacy] = useState(statusPrivacy);

    // Calculate counts for display (Mock logic based on connectionType and archive state)
    const usersList = Object.values(users);
    const followersCount = usersList.filter(u => u.connectionType === 'follower').length;
    const followingCount = usersList.filter(u => u.connectionType === 'following').length;
    const archivedCount = chats.filter(c => c.isArchived).length;

    const handleSave = () => {
        setStatusPrivacy(selectedPrivacy);
        navigate('/status');
    };


    const PrivacyOption = ({ type, label, sub, count }) => (
        <div
            onClick={() => setSelectedPrivacy(type)}
            className="flex items-center justify-between py-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors -mx-6 px-6"
        >
            <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${selectedPrivacy === type ? 'border-wa-teal' : 'border-gray-400 dark:border-gray-500'}`}>
                    {selectedPrivacy === type && <div className="w-2.5 h-2.5 rounded-full bg-wa-teal"></div>}
                </div>
                <div className="flex flex-col">
                    <span className="text-[#111b21] dark:text-gray-100 font-normal text-base">{label}</span>
                    {sub && <span className="text-[#667781] dark:text-gray-500 text-sm mt-0.5">{sub}</span>}
                </div>
            </div>
            {count !== undefined && count > 0 && <span className="text-[#667781] dark:text-gray-500 text-sm font-medium">{count}</span>}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-[#111b21]">
            {/* Header */}
            <div className="h-[60px] bg-wa-teal dark:bg-wa-dark-header flex items-center gap-3 px-4 text-white shrink-0 shadow-sm transition-colors">
                <button onClick={() => navigate('/status')} className="p-1 -ml-2 rounded-full active:bg-black/10">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-medium">Status privacy</h2>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <p className="text-[#667781] dark:text-gray-400 text-sm mb-4 px-2 font-medium">
                    Who can see my status updates
                </p>

                <div className="bg-white dark:bg-wa-dark-paper rounded-lg shadow-sm px-6 overflow-hidden">
                    <PrivacyOption
                        type="all"
                        label="All Friends"
                        sub="Followers, followings, and archived list"
                    />
                    <div className="border-t border-gray-100 dark:border-gray-800"></div>
                    <PrivacyOption
                        type="followers"
                        label="Only Followers"
                        sub="People who follow you"
                        count={followersCount}
                    />
                    <div className="border-t border-gray-100 dark:border-gray-800"></div>
                    <PrivacyOption
                        type="followings"
                        label="Only Followings"
                        sub="People you follow"
                        count={followingCount}
                    />
                    <div className="border-t border-gray-100 dark:border-gray-800"></div>
                    <PrivacyOption
                        type="archive"
                        label="Only Archived Friends"
                        sub="Friends in your archive list"
                        count={archivedCount}
                    />
                </div>

                <p className="text-[#667781] dark:text-gray-400 text-[13px] mt-4 px-2 leading-relaxed">
                    Changes to your privacy settings won't affect status updates that you've sent already.
                </p>

                {selectedPrivacy !== statusPrivacy && (
                    <div className="flex justify-center mt-10">
                        <button
                            onClick={handleSave}
                            className="bg-wa-teal text-white px-10 py-3 rounded-full font-bold shadow-md active:scale-95 transition-transform tracking-wide"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatusPrivacySettings;
