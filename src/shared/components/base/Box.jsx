import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Box = forwardRef(({
    as: Component = 'div',
    className = '',
    children,
    ...props
}, ref) => {
    return (
        <Component
            ref={ref}
            className={className}
            {...props}
        >
            {children}
        </Component>
    );
});

Box.displayName = 'Box';

Box.propTypes = {
    as: PropTypes.elementType,
    className: PropTypes.string,
    children: PropTypes.node
};

export { Box };
