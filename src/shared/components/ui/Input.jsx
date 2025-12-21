import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Input = forwardRef(({
    type = 'text',
    size = 'md',
    error = false,
    disabled = false,
    fullWidth = false,
    leftIcon = null,
    rightIcon = null,
    className = '',
    ...rest
}, ref) => {
    // Base styles
    const baseStyles = 'border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-wa-gray-800 text-wa-gray-900 dark:text-gray-100';
    
    // State styles
    const stateStyles = error
        ? 'border-wa-red focus:ring-wa-red focus:border-wa-red'
        : 'border-wa-gray-200 dark:border-wa-gray-700 focus:ring-wa-teal focus:border-wa-teal';
    
    // Size styles
    const sizeStyles = {
        sm: 'text-sm px-3 py-1.5 h-8',
        md: 'text-base px-4 py-2 h-10',
        lg: 'text-lg px-4 py-3 h-12'
    };
    
    // Icon padding adjustments
    const iconPadding = {
        left: leftIcon ? 'pl-10' : '',
        right: rightIcon ? 'pr-10' : ''
    };
    
    // Combine classes
    const inputClasses = `
        ${baseStyles}
        ${stateStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${iconPadding.left}
        ${iconPadding.right}
        ${fullWidth ? 'w-full' : ''}
        ${className}
    `.trim().replace(/\s+/g, ' ');
    
    if (leftIcon || rightIcon) {
        return (
            <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'}`}>
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-wa-gray-500 dark:text-gray-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    ref={ref}
                    type={type}
                    className={inputClasses}
                    disabled={disabled}
                    {...rest}
                />
                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-wa-gray-500 dark:text-gray-400">
                        {rightIcon}
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <input
            ref={ref}
            type={type}
            className={inputClasses}
            disabled={disabled}
            {...rest}
        />
    );
});

Input.displayName = 'Input';

Input.propTypes = {
    type: PropTypes.string,
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    disabled: PropTypes.bool,
    fullWidth: PropTypes.bool,
    leftIcon: PropTypes.node,
    rightIcon: PropTypes.node,
    className: PropTypes.string
};

export default Input;
