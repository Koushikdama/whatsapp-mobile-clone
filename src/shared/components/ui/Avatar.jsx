import React from 'react';
import PropTypes from 'prop-types';

const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
    '2xl': 'w-16 h-16'
};

const indicatorSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4'
};

const Avatar = ({
    src,
    alt = 'User avatar',
    size = 'md',
    online = false,
    className = '',
    fallback = null
}) => {
    
    const avatarClasses = `
        ${sizeStyles[size] || sizeStyles.md}
        rounded-full object-cover
        ${className}
    `.trim().replace(/\s+/g, ' ');
    
    return (
        <div className="relative inline-block shrink-0">
            {src ? (
                <img 
                    src={src} 
                    alt={alt} 
                    className={avatarClasses}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        if (fallback) {
                            e.target.nextSibling.style.display = 'flex';
                        }
                    }}
                />
            ) : null}
            
            {/* Fallback */}
            {(!src || fallback) && (
                <div 
                    className={`${avatarClasses} bg-wa-gray-300 dark:bg-wa-gray-700 flex items-center justify-center text-white font-medium ${!src ? '' : 'hidden'}`}
                    style={{ display: src ? 'none' : 'flex' }}
                >
                    {fallback || (alt ? alt.charAt(0).toUpperCase() : '?')}
                </div>
            )}
            
            {/* Online Indicator */}
            {online && (
                <div 
                    className={`
                        absolute bottom-0 right-0 
                        ${indicatorSizes[size] || indicatorSizes.md}
                        bg-green-500 rounded-full border-2 border-white dark:border-wa-gray-900
                    `.trim().replace(/\s+/g, ' ')}
                />
            )}
        </div>
    );
};

Avatar.propTypes = {
    src: PropTypes.string,
    alt: PropTypes.string,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl']),
    online: PropTypes.bool,
    className: PropTypes.string,
    fallback: PropTypes.node
};

export default Avatar;
