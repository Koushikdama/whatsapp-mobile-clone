import React, { useState, useMemo } from 'react';
import { MapPin, ChevronUp, ChevronDown } from 'lucide-react';

const NearbyFriendsSection = ({ isExpanded, onToggle, searchQuery }) => {
    const [radiusFilter, setRadiusFilter] = useState(5); // km

    // Mock Data for Nearby Friends
    const NEARBY_USERS = [
        { id: 'n1', name: 'Sarah Connor', distance: 0.5, avatar: 'https://picsum.photos/seed/sarah/200' },
        { id: 'n2', name: 'John Wick', distance: 2.1, avatar: 'https://picsum.photos/seed/wick/200' },
        { id: 'n3', name: 'Ellen Ripley', distance: 4.5, avatar: 'https://picsum.photos/seed/ellen/200' },
        { id: 'n4', name: 'Luke Skywalker', distance: 8.0, avatar: 'https://picsum.photos/seed/luke/200' },
        { id: 'n5', name: 'Tony Stark', distance: 12.5, avatar: 'https://picsum.photos/seed/tony/200' },
        { id: 'n6', name: 'Natasha Romanoff', distance: 0.8, avatar: 'https://picsum.photos/seed/nat/200' },
        { id: 'n7', name: 'Bruce Wayne', distance: 15.0, avatar: 'https://picsum.photos/seed/bruce/200' },
        { id: 'n8', name: 'Peter Parker', distance: 3.2, avatar: 'https://picsum.photos/seed/peter/200' },
    ];

    const filteredNearbyUsers = useMemo(() => {
        return NEARBY_USERS.filter(u => u.distance <= radiusFilter);
    }, [radiusFilter]);

    if (searchQuery) return null;

    return (
        <div className="border-t border-wa-border dark:border-wa-dark-border mt-2">
            <div
                onClick={onToggle}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-wa-grayBg dark:hover:bg-wa-dark-hover transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                        <MapPin size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-[17px] text-[#111b21] dark:text-gray-200 font-medium">Nearby Friends</h3>
                        <p className="text-[13px] text-[#667781] dark:text-gray-500">Find people around you</p>
                    </div>
                </div>
                <div className="text-[#667781] dark:text-gray-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {isExpanded && (
                <div className="animate-in slide-in-from-top-2 duration-200 pb-4">
                    {/* Radius Filter */}
                    <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
                        {[1, 5, 10, 20, 50].map(r => (
                            <button
                                key={r}
                                onClick={(e) => { e.stopPropagation(); setRadiusFilter(r); }}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shadow-sm ${radiusFilter === r
                                    ? 'bg-wa-teal text-white'
                                    : 'bg-gray-100 dark:bg-wa-dark-header text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-wa-dark-hover'
                                    }`}
                            >
                                Within {r} km
                            </button>
                        ))}
                    </div>

                    {/* Horizontal List */}
                    <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
                        {filteredNearbyUsers.map(user => (
                            <div key={user.id} className="w-[140px] shrink-0 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col items-center gap-2 bg-white dark:bg-wa-dark-paper shadow-sm">
                                <div className="relative">
                                    <img src={user.avatar} className="w-14 h-14 rounded-full object-cover" alt="" />
                                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-wa-dark-paper rounded-full px-1.5 py-0.5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-0.5">
                                        <MapPin size={8} className="text-blue-500" />
                                        <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300">{user.distance}km</span>
                                    </div>
                                </div>
                                <div className="text-center w-full mb-1">
                                    <h4 className="text-sm font-medium text-[#111b21] dark:text-gray-100 truncate">{user.name}</h4>
                                </div>
                                <button className="w-full py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors rounded-full text-xs font-bold">
                                    Say Hi 👋
                                </button>
                            </div>
                        ))}
                        {filteredNearbyUsers.length === 0 && (
                            <div className="w-full text-center py-4 text-sm text-gray-500 italic">
                                No friends found within {radiusFilter} km.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NearbyFriendsSection;
