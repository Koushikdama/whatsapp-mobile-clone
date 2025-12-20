/**
 * NotificationPrompt Component
 * Displays a prompt to request notification permissions
 */

import React from 'react';
import { Bell, X } from 'lucide-react';
import './NotificationPrompt.css';

export const NotificationPrompt = ({ onAllow, onDismiss }) => {
    return (
        <div className="notification-prompt">
            <div className="notification-prompt__content">
                <div className="notification-prompt__icon">
                    <Bell size={24} />
                </div>
                <div className="notification-prompt__text">
                    <h3>Enable Notifications</h3>
                    <p>Stay updated with new messages and calls</p>
                </div>
                <div className="notification-prompt__actions">
                    <button 
                        className="notification-prompt__button notification-prompt__button--primary"
                        onClick={onAllow}
                    >
                        Allow
                    </button>
                    <button 
                        className="notification-prompt__button notification-prompt__button--secondary"
                        onClick={onDismiss}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationPrompt;
