import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Box } from '../base/Box';

const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variantStyles = {
    primary: 'bg-wa-teal hover:bg-wa-teal-dark text-white focus:ring-wa-teal shadow-sm hover:shadow-md',
    secondary: 'bg-wa-gray-100 dark:bg-wa-gray-800 hover:bg-wa-gray-200 dark:hover:bg-wa-gray-700 text-wa-gray-900 dark:text-gray-100 focus:ring-wa-gray-400',
    ghost: 'bg-transparent hover:bg-wa-gray-100 dark:hover:bg-wa-gray-800 text-wa-teal dark:text-wa-teal-light focus:ring-wa-teal',
    danger: 'bg-wa-red hover:bg-red-700 text-white focus:ring-wa-red shadow-sm hover:shadow-md'
};

const sizeStyles = {
    sm: 'text-sm px-3 py-1.5 h-8',
    md: 'text-base px-4 py-2 h-10',
    lg: 'text-lg px-6 py-3 h-12'
};

const Button = forwardRef(({
    variant = 'primary',
    size = 'md',
    disabled = false,
    fullWidth = false,
    loading = false,
    children,
    className = '',
    type = 'button',
    ...rest
}, ref) => {
    
    // Combine classes
    const buttonClasses = `
        ${baseStyles}
        ${variantStyles[variant] || variantStyles.primary}
        ${sizeStyles[size] || sizeStyles.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
    `.trim().replace(/\s+/g, ' ');
    
    return (
        <Box
            as="button"
            ref={ref}
            type={type}
            className={buttonClasses}
            disabled={disabled || loading}
            {...rest}
        >
            {loading ? (
                <span className="mr-2 animate-spin">
                    <svg className="h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </span>
            ) : null}
            {children}
        </Box>
    );
});

Button.displayName = 'Button';

Button.propTypes = {
    variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    disabled: PropTypes.bool,
    fullWidth: PropTypes.bool,
    loading: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    type: PropTypes.oneOf(['button', 'submit', 'reset'])
};

export default Button;
