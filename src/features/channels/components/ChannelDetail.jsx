import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Bell, BellOff, Share2, Info, ThumbsUp, MessageCircle, Forward } from 'lucide-react';
import { useApp } from '../../../shared/context/AppContext';
import { formatTimestamp } from '../../../shared/utils/formatTime';

const ChannelDetail = () => {
    const { channelId } = useParams();
    const navigate = useNavigate();
    const { channels } = useApp();
    const channel = channels.find(c => c.id === channelId);

    const [isFollowing, setIsFollowing] = useState(true);
    const [isMuted, setIsMuted] = useState(false);

    // Mock Posts
    const posts = [
        {
            id: 'p1',
            text: 'Welcome to the official channel! 🌟 Here you will find the latest news, updates and exclusive content.',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            image: null,
            views: '1.2M',
            reactions: { '👍': 1200, '❤️': 3500 }
        },
        {
            id: 'p2',
            text: 'Big announcement coming later today! Stay tuned.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            image: 'https://picsum.photos/seed/announce/800/600',
            views: '450K',
            reactions: { '😮': 800, '🔥': 2100 }
        },
        {
            id: 'p3',
            text: 'What do you think about the new features? Let us know in the comments below!',
            timestamp: new Date().toISOString(),
            image: null,
            views: '50K',
            reactions: { '🤔': 200, '👍': 500 }
        }
    ];

    if (!channel) return <div className="flex justify-center items-center h-full">Channel not found</div>;

    return (
        <div className="flex flex-col h-full bg-[#EFEAE2] dark:bg-[#0b141a] relative">
            <div className="absolute inset-0 opacity-40 pointer-events-none z-0"
                style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}
            ></div>

            {/* Header */}
            <div className="h-[60px] bg-wa-grayBg dark:bg-wa-dark-header flex items-center justify-between px-2 shrink-0 border-b border-wa-border dark:border-wa-dark-border z-10 sticky top-0">
                <div className="flex items-center gap-1">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeft size={24} className="text-[#54656f] dark:text-gray-300" />
                    </button>
                    <div className="flex items-center gap-3 cursor-pointer">
                        <img src={channel.avatar} alt={channel.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-1">
                                <h3 className="text-[16px] font-medium text-[#111b21] dark:text-gray-100 leading-tight">
                                    {channel.name}
                                </h3>
                                {channel.isVerified && (
                                    <svg viewBox="0 0 24 24" width="16" height="16" className="text-wa-teal fill-current">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                                    </svg>
                                )}
                            </div>
                            <p className="text-[12px] text-[#667781] dark:text-gray-400 leading-none mt-0.5">
                                {channel.followers}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#54656f] dark:text-gray-300"
                    >
                        {isMuted ? <BellOff size={22} /> : <Bell size={22} />}
                    </button>
                    <button className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#54656f] dark:text-gray-300">
                        <MoreVertical size={22} />
                    </button>
                </div>
            </div>

            {/* Posts Feed */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 z-10">
                <div className="self-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs px-3 py-1.5 rounded-lg shadow-sm mb-4">
                    🔒 This channel is public. Anyone can see the content.
                </div>

                {posts.map(post => (
                    <div key={post.id} className="self-start max-w-[90%] md:max-w-[600px] bg-white dark:bg-wa-dark-paper rounded-lg shadow-sm overflow-hidden border border-transparent dark:border-white/5 mx-auto w-full">
                        {post.image && (
                            <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700">
                                <img src={post.image} alt="Post" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="p-3">
                            <p className="text-[15px] text-[#111b21] dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                                {post.text}
                            </p>

                            <div className="flex justify-between items-end mt-2">
                                <div className="flex items-center gap-1 text-[11px] text-[#667781] dark:text-gray-500">
                                    <span className="font-medium text-wa-teal cursor-pointer">Read more</span>
                                </div>
                                <div className="text-[11px] text-[#667781] dark:text-gray-500">
                                    {formatTimestamp(post.timestamp)}
                                </div>
                            </div>
                        </div>

                        {/* Footer / Interaction Bar */}
                        <div className="px-3 py-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {Object.entries(post.reactions).map(([emoji, count]) => (
                                    <div key={emoji} className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                                        <span className="text-sm">{emoji}</span>
                                        <span className="text-[11px] text-[#667781] dark:text-gray-400 font-medium">{count}</span>
                                    </div>
                                ))}
                                <div className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-[#667781] dark:text-gray-400 cursor-pointer">
                                    <Plus size={16} />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-[#667781] dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <span className="text-[11px]">{post.views}</span>
                                </div>
                                <Share2 size={18} className="cursor-pointer hover:text-wa-teal" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 bg-wa-grayBg dark:bg-wa-dark-header shrink-0 z-10 flex justify-center border-t border-wa-border dark:border-wa-dark-border">
                {isFollowing ? (
                    <div className="flex items-center gap-4 text-sm text-[#54656f] dark:text-gray-400">
                        <span>You are following this channel</span>
                        <button onClick={() => setIsFollowing(false)} className="text-red-500 font-medium hover:underline">Unfollow</button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsFollowing(true)}
                        className="w-full max-w-sm bg-wa-teal hover:bg-[#00a884] text-white py-2.5 rounded-full font-medium shadow-sm transition-colors"
                    >
                        Follow Channel
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChannelDetail;
