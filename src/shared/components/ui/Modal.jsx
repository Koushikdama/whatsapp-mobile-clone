import React from 'react';
import { createPortal } from 'react-dom';

import { X } from 'lucide-react';

/**
 * Modal Component
 * Reusable modal/dialog with backdrop and animations
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer = null,
    size = 'md',
    showCloseButton = true,
    closeOnBackdrop = true,
    className = ''
}) => {
    if (!isOpen) return null;
    
    // Size variants
    const sizeStyles = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-full mx-4'
    };
    
    const handleBackdropClick = (e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
            onClose();
        }
    };
    
    return createPortal(
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div 
                className={`
                    bg-white dark:bg-wa-dark-paper rounded-lg shadow-xl w-full
                    ${sizeStyles[size]}
                    animate-in slide-in-from-bottom-5 zoom-in-95 duration-200
                    ${className}
                `.trim().replace(/\s+/g, ' ')}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between p-4 border-b border-wa-gray-100 dark:border-wa-gray-700">
                        {title && (
                            <h3 className="text-lg font-semibold text-wa-gray-900 dark:text-gray-100">
                                {title}
                            </h3>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-1 rounded-full hover:bg-wa-gray-100 dark:hover:bg-wa-gray-800 transition-colors"
                                aria-label="Close modal"
                            >
                                <X size={20} className="text-wa-gray-500 dark:text-gray-400" />
                            </button>
                        )}
                    </div>
                )}
                
                {/* Body */}
                <div className="p-4">
                    {children}
                </div>
                
                {/* Footer */}
                {footer && (
                    <div className="p-4 border-t border-wa-gray-100 dark:border-wa-gray-700 bg-wa-gray-50 dark:bg-wa-gray-900/50 rounded-b-lg">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};



export default Modal;
