/**
 * Offline Banner Component
 * Displays when user is offline and shows queued messages count
 */

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';

const OfflineBanner = () => {
    const { isOnline, queuedCount, isSyncing, triggerSync } = useOfflineSync();

    // Don't show banner if online and no queued messages
    if (isOnline && queuedCount === 0) {
        return null;
    }

    return (
        <div className={`offline-banner ${isOnline ? 'syncing' : 'offline'}`}>
            <div className="offline-banner-content">
                <div className="offline-banner-icon">
                    {isSyncing ? (
                        <RefreshCw className="icon-spinning" size={18} />
                    ) : (
                        <WifiOff size={18} />
                    )}
                </div>
                
                <div className="offline-banner-text">
                    {isSyncing ? (
                        <span>Sending messages...</span>
                    ) : isOnline ? (
                        <span>{queuedCount} message{queuedCount !== 1 ? 's' : ''} queued</span>
                    ) : (
                        <span>You're offline • {queuedCount} message{queuedCount !== 1 ? 's' : ''} queued</span>
                    )}
                </div>

                {isOnline && queuedCount > 0 && !isSyncing && (
                    <button 
                        className="offline-banner-retry"
                        onClick={triggerSync}
                        aria-label="Retry sending"
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                )}
            </div>

            <style jsx>{`
                .offline-banner {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
                    color: white;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    animation: slideDown 0.3s ease-out;
                }

                .offline-banner.syncing {
                    background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
                }

                .offline-banner-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .offline-banner-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .icon-spinning {
                    animation: spin 1s linear infinite;
                }

                .offline-banner-text {
                    flex: 1;
                    font-weight: 500;
                    text-align: center;
                }

                .offline-banner-retry {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 6px;
                    color: white;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .offline-banner-retry:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-1px);
                }

                .offline-banner-retry:active {
                    transform: translateY(0);
                }

                @keyframes slideDown {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                /* Mobile adjustments */
                @media (max-width: 768px) {
                    .offline-banner {
                        padding: 10px 12px;
                        font-size: 13px;
                    }

                    .offline-banner-content {
                        gap: 8px;
                    }

                    .offline-banner-retry {
                        padding: 5px 10px;
                        font-size: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default OfflineBanner;
