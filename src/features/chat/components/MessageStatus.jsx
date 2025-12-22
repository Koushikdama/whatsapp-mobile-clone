import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';

/**
 * MessageStatus component - displays message delivery status icons
 * @param {Object} props
 * @param {'queued'|'sent'|'delivered'|'read'} props.status - Message delivery status
 * @param {number} [props.size=16] - Icon size in pixels
 */
const MessageStatus = ({ status, size = 16 }) => {
    switch (status) {
        case 'queued':
            return (
                <Clock
                    size={size}
                    className="text-orange-500 dark:text-orange-400 flex-shrink-0"
                    strokeWidth={2.5}
                />
            );
        case 'sent':
            return (
                <Check
                    size={size}
                    className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                    strokeWidth={2.5}
                />
            );
        case 'delivered':
            return (
                <CheckCheck
                    size={size}
                    className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                    strokeWidth={2.5}
                />
            );
        case 'read':
            return (
                <CheckCheck
                    size={size}
                    className="text-blue-500 dark:text-blue-400 flex-shrink-0"
                    strokeWidth={2.5}
                />
            );
        default:
            return null;
    }
};

export default MessageStatus;
