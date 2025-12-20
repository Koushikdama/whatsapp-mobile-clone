import React, { useRef, useEffect, useState } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

/**
 * VoiceMessagePlayer - Audio player for voice messages
 * Uses react-h5-audio-player for playback controls
 * 
 * @param {Object} props
 * @param {string} props.src - Audio source URL
 * @param {number} props.duration - Duration in seconds
 */
const VoiceMessagePlayer = ({ src, duration }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="voice-message-player min-w-[200px] max-w-[300px]">
            <AudioPlayer
                src={src}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                showJumpControls={false}
                showDownloadProgress={false}
                showFilledProgress={true}
                customProgressBarSection={['CURRENT_TIME', 'PROGRESS_BAR', 'DURATION']}
                customControlsSection={['MAIN_CONTROLS', 'VOLUME_CONTROLS']}
                layout="horizontal-reverse"
                className="voice-player"
                style={{
                    boxShadow: 'none',
                    background: 'transparent',
                    padding: 0,
                    minHeight: '50px'
                }}
            />

            <style jsx>{`
        .voice-message-player :global(.rhap_container) {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        
        .voice-message-player :global(.rhap_main) {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .voice-message-player :global(.rhap_main-controls-button) {
          width: 40px !important;
          height: 40px !important;
          background: #128c7e !important;
          border-radius: 50% !important;
          color: white !important;
        }
        
        .voice-message-player :global(.rhap_progress-container) {
          flex: 1;
          margin: 0 8px;
        }
        
        .voice-message-player :global(.rhap_progress-bar) {
          height: 4px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
        }
        
        .voice-message-player :global(.rhap_progress-filled) {
          background: #128c7e !important;
        }
        
        .voice-message-player :global(.rhap_progress-indicator) {
          width: 12px;
          height: 12px;
          background: #128c7e !important;
          top: -4px;
        }
        
        .voice-message-player :global(.rhap_time) {
          font-size: 11px;
          color: #667781;
        }
        
        .voice-message-player :global(.rhap_volume-controls) {
          display: none;
        }
      `}</style>
        </div>
    );
};

export default VoiceMessagePlayer;
