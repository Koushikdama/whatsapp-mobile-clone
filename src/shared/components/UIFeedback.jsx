import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

/**
 * Toast Notification Component
 * Reusable toast for success/error/warning/info messages
 */
export const Toast = ({ type = 'success', message, onClose }) => {
    const icons = {
        success: <CheckCircle size={20} className="text-green-500" />,
        error: <XCircle size={20} className="text-red-500" />,
        warning: <AlertCircle size={20} className="text-yellow-500" />,
        info: <Info size={20} className="text-blue-500" />
    };

    const backgrounds = {
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    };

    const textColors = {
        success: 'text-green-900 dark:text-green-100',
        error: 'text-red-900 dark:text-red-100',
        warning: 'text-yellow-900 dark:text-yellow-100',
        info: 'text-blue-900 dark:text-blue-100'
    };

    return (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300`}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${backgrounds[type]}`}>
                {icons[type]}
                <span className={`font-medium ${textColors[type]}`}>{message}</span>
                <button
                    onClick={onClose}
                    className="ml-2 hover:opacity-70 transition-opacity"
                >
                    <XCircle size={16} className={textColors[type]} />
                </button>
            </div>
        </div>
    );
};

/**
 * Confirmation Dialog Component
 * Reusable confirmation modal with customization
 */
export const ConfirmDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmDanger = false,
    loading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {message}
                </p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-wa-dark-hover rounded-lg transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${
                            confirmDanger 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-wa-teal hover:bg-wa-tealDark text-white'
                        }`}
                    >
                        {loading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Loading Spinner Component
 * Reusable loading indicator
 */
export const LoadingSpinner = ({ size = 'md', fullScreen = false, message }) => {
    const sizes = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <div className={`${sizes[size]} border-wa-teal border-t-transparent rounded-full animate-spin`} />
            {message && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-wa-dark-bg">
                {spinner}
            </div>
        );
    }

    return spinner;
};

/**
 * Empty State Component
 * Reusable empty state message
 */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        {Icon && <Icon size={48} className="text-gray-300 dark:text-gray-600 mb-4" />}
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {title}
        </h3>
        {description && (
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
                {description}
            </p>
        )}
        {action}
    </div>
);

/**
 * Error Message Component
 * Reusable error display
 */
export const ErrorMessage = ({ message, onRetry }) => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 m-4">
        <div className="flex items-start gap-3">
            <XCircle size={20} className="text-red-500 mt-0.5" />
            <div className="flex-1">
                <p className="text-red-900 dark:text-red-100 font-medium">Error</p>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{message}</p>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                >
                    Retry
                </button>
            )}
        </div>
    </div>
);

/**
 * Success Banner Component
 * Temporary success message
 */
export const SuccessBanner = ({ message, onClose }) => (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 m-4 animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500" />
            <p className="text-green-900 dark:text-green-100 font-medium flex-1">{message}</p>
            <button
                onClick={onClose}
                className="text-green-700 dark:text-green-300 hover:opacity-70"
            >
                <XCircle size={16} />
            </button>
        </div>
    </div>
);

export default {
    Toast,
    ConfirmDialog,
    LoadingSpinner,
    EmptyState,
    ErrorMessage,
    SuccessBanner
};
