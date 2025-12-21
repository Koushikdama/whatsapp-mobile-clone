import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Box } from './Box';

const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline'
};

const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
};

const Stack = forwardRef(({
    direction = 'column',
    spacing = 2,
    align = 'stretch',
    justify = 'start',
    wrap = false,
    className = '',
    children,
    ...props
}, ref) => {
    return (
        <Box
            ref={ref}
            className={`
                flex
                ${direction === 'row' ? 'flex-row' : 'flex-col'}
                gap-${spacing}
                ${alignClasses[align]}
                ${justifyClasses[justify]}
                ${wrap ? 'flex-wrap' : 'flex-nowrap'}
                ${className}
            `.trim().replace(/\s+/g, ' ')}
            {...props}
        >
            {children}
        </Box>
    );
});

Stack.displayName = 'Stack';

Stack.propTypes = {
    direction: PropTypes.oneOf(['row', 'column']),
    spacing: PropTypes.number,
    align: PropTypes.oneOf(['start', 'center', 'end', 'stretch', 'baseline']),
    justify: PropTypes.oneOf(['start', 'center', 'end', 'between', 'around', 'evenly']),
    wrap: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node
};

export { Stack };
