import React from 'react';


/**
 * Badge Component
 * Status badges for counts, labels, and indicators
 */
const Badge = ({
    children,
    variant = 'default',
    size = 'md',
    rounded = false,
    className = ''
}) => {
    // Variant styles
    const variantStyles = {
        default: 'bg-wa-gray-100 text-wa-gray-700 dark:bg-wa-gray-800 dark:text-gray-300',
        primary: 'bg-wa-teal/10 text-wa-teal dark:bg-wa-teal/20 dark:text-wa-teal-light',
        success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-wa-orange/10 text-wa-orange dark:bg-wa-orange/20',
        danger: 'bg-red-100 text-wa-red dark:bg-red-900/30 dark:text-red-400',
        info: 'bg-blue-100 text-wa-blue dark:bg-blue-900/30 dark:text-blue-400',
        following: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        follower: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };
    
    // Size styles
    const sizeStyles = {
        sm: 'text-xs px-1.5 py-0.5',
        md: 'text-xs px-2 py-1',
        lg: 'text-sm px-2.5 py-1'
    };
    
    // Shape
    const shapeStyles = rounded ? 'rounded-full' : 'rounded';
    
    const badgeClasses = `
        inline-flex items-center justify-center font-medium uppercase tracking-wide
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${shapeStyles}
        ${className}
    `.trim().replace(/\s+/g, ' ');
    
    return (
        <span className={badgeClasses}>
            {children}
        </span>
    );
};



export default Badge;
