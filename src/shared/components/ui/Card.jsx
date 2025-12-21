import React from 'react';


/**
 * Card Component
 * Container component for grouped content
 */
const Card = ({
    children,
    padding = 'md',
    shadow = 'md',
    hover = false,
    className = ''
}) => {
    // Padding variants
    const paddingStyles = {
        none: 'p-0',
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6'
    };
    
    // Shadow variants
    const shadowStyles = {
        none: '',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl'
    };
    
    // Hover effect
    const hoverStyles = hover ? 'hover:shadow-lg transition-shadow duration-200' : '';
    
    const cardClasses = `
        bg-white dark:bg-wa-dark-paper rounded-lg border border-wa-gray-100 dark:border-wa-gray-700
        ${paddingStyles[padding]}
        ${shadowStyles[shadow]}
        ${hoverStyles}
        ${className}
    `.trim().replace(/\s+/g, ' ');
    
    return (
        <div className={cardClasses}>
            {children}
        </div>
    );
};



export default Card;
