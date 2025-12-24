import React, { useRef, useEffect } from 'react';
import { User as UserIcon, Mic, MicOff } from 'lucide-react';

/**
 * Participant Grid Component
 * Displays video streams for all participants in a grid layout
 * Responsive: 1x1, 2x2, or 3x3 grids based on participant count
 */
const ParticipantGrid = ({ 
    participants = [], 
    localStream = null, 
    currentUserId,
    users = {},
    dominantSpeakerId = null 
}) => {
    const getGridClass = (count) => {
        if (count <= 1) return 'grid-cols-1';
        if (count <= 4) return 'grid-cols-2';
        return 'grid-cols-3';
    };

    const totalParticipants = participants.length + (localStream ? 1 : 0);

    return (
        <div className="w-full h-full p-4">
            <div className={`grid ${getGridClass(totalParticipants)} gap-3 w-full h-full`}>
                {/* Local Stream (Current User) */}
                {localStream && (
                    <ParticipantTile
                        stream={localStream}
                        userId={currentUserId}
                        user={users[currentUserId]}
                        isLocal={true}
                        isDominant={dominantSpeakerId === currentUserId}
                    />
                )}

                {/* Remote Participants */}
                {participants.map((participant) => (
                    <ParticipantTile
                        key={participant.id}
                        stream={participant.stream}
                        userId={participant.id}
                        user={users[participant.id]}
                        isLocal={false}
                        isDominant={dominantSpeakerId === participant.id}
                        isMuted={participant.isMuted}
                    />
                ))}
            </div>
        </div>
    );
};

/**
 * Individual Participant Tile
 */
const ParticipantTile = ({ 
    stream, 
    userId, 
    user, 
    isLocal, 
    isDominant,
    isMuted = false 
}) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const hasVideo = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;

    return (
        <div 
            className={`relative bg-gray-800 rounded-lg overflow-hidden transition-all ${
                isDominant ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/50' : ''
            }`}
        >
            {/* Video Stream */}
            {hasVideo ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="w-full h-full object-cover"
                />
            ) : (
                // Avatar fallback when video is off
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    {user?.avatar ? (
                        <img 
                            src={user.avatar} 
                            className="w-24 h-24 rounded-full border-2 border-gray-700" 
                            alt={user.name} 
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full border-2 border-gray-700 bg-gray-700 flex items-center justify-center">
                            <UserIcon size={48} className="text-gray-400" />
                        </div>
                    )}
                </div>
            )}

            {/* User Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium truncate">
                            {user?.name || userId}
                            {isLocal && ' (You)'}
                        </span>
                        {isDominant && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                    </div>
                    
                    {/* Mic Status */}
                    {isMuted && (
                        <div className="bg-red-500 p-1.5 rounded-full">
                            <MicOff size={12} className="text-white" />
                        </div>
                    )}
                </div>
            </div>

            {/* Connection Quality Indicator (optional) */}
            <div className="absolute top-2 right-2">
                <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-green-500 rounded-full"></div>
                    <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                    <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default ParticipantGrid;
