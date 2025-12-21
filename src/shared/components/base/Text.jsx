import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const variantStyles = {
    h1: 'text-4xl font-bold tracking-tight',
    h2: 'text-3xl font-bold tracking-tight',
    h3: 'text-2xl font-semibold',
    h4: 'text-xl font-semibold',
    h5: 'text-lg font-medium',
    h6: 'text-base font-medium',
    body: 'text-base',
    caption: 'text-sm text-gray-500',
    small: 'text-xs text-gray-500'
};

const Text = forwardRef(({
    as,
    variant = 'body',
    className = '',
    children,
    ...props
}, ref) => {
    const Component = as || (variant.startsWith('h') ? variant : 'p');
    
    return (
        <Component
            ref={ref}
            className={`${variantStyles[variant] || variantStyles.body} ${className}`}
            {...props}
        >
            {children}
        </Component>
    );
});

Text.displayName = 'Text';

Text.propTypes = {
    as: PropTypes.elementType,
    variant: PropTypes.oneOf([
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'body', 'caption', 'small'
    ]),
    className: PropTypes.string,
    children: PropTypes.node
};

export { Text };
