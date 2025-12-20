import React from 'react';
import { X, AlertCircle } from 'lucide-react';

/**
 * DeleteMessageModal - Shows delete options for messages
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close modal callback
 * @param {Function} props.onDeleteForMe - Delete for me callback
 * @param {Function} props.onDeleteForEveryone - Delete for everyone callback
 * @param {number} props.messageCount - Number of messages to delete
 * @param {boolean} props.canDeleteForEveryone - Whether "Delete for Everyone" is allowed
 * @param {string} props.timeWarning - Warning message about time limit
 */
const DeleteMessageModal = ({
    isOpen,
    onClose,
    onDeleteForMe,
    onDeleteForEveryone,
    messageCount = 1,
    canDeleteForEveryone = true,
    timeWarning = null
}) => {
    if (!isOpen) return null;

    const messageText = messageCount > 1 ? `${messageCount} messages` : 'message';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] animate-in fade-in duration-200">
            <div className="bg-white dark:bg-wa-dark-paper rounded-lg shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Delete {messageText}?
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    {/* Time Warning */}
                    {!canDeleteForEveryone && timeWarning && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                {timeWarning}
                            </p>
                        </div>
                    )}

                    {/* Delete for Me */}
                    <button
                        onClick={() => {
                            onDeleteForMe();
                            onClose();
                        }}
                        className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group"
                    >
                        <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400">
                            Delete for Me
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            This {messageText} will be removed from your chat only
                        </div>
                    </button>

                    {/* Delete for Everyone */}
                    <button
                        onClick={() => {
                            if (canDeleteForEveryone) {
                                onDeleteForEveryone();
                                onClose();
                            }
                        }}
                        disabled={!canDeleteForEveryone}
                        className={`w-full p-3 text-left rounded-lg transition-colors group ${
                            canDeleteForEveryone
                                ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'
                                : 'opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <div className={`font-medium ${
                            canDeleteForEveryone
                                ? 'text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400'
                                : 'text-gray-400 dark:text-gray-600'
                        }`}>
                            Delete for Everyone
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            This {messageText} will be deleted for all chat participants
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteMessageModal;
