import React from 'react';
import { motion } from 'framer-motion';
import useResponsive from '../../hooks/useResponsive';

/**
 * ResponsiveGameContainer
 * 
 * Wrapper component for all games ensuring consistent responsive behavior
 * Handles sizing, animations, and layout across different screen sizes
 */
const ResponsiveGameContainer = ({ 
  children, 
  className = '', 
  showHeader = false,
  headerContent = null,
  minHeight = '400px',
  maxWidth = '600px',
}) => {
  const { isMobile, isTablet, isDesktop, width, height } = useResponsive();

  // Calculate responsive dimensions
  const getDimensions = () => {
    if (isMobile) {
      return {
        width: '100%',
        maxWidth: '95vw',
        height: 'auto',
        padding: '1rem',
      };
    } else if (isTablet) {
      return {
        width: '90%',
        maxWidth: '550px',
        height: 'auto',
        padding: '1.5rem',
      };
    } else {
      return {
        width: '100%',
        maxWidth: maxWidth,
        height: 'auto',
        padding: '2rem',
      };
    }
  };

  const dimensions = getDimensions();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`responsive-game-container ${className}`}
      style={{
        width: dimensions.width,
        maxWidth: dimensions.maxWidth,
        minHeight,
        margin: '0 auto',
        ...dimensions,
      }}
    >
      {showHeader && headerContent && (
        <div className="game-header mb-4">
          {headerContent}
        </div>
      )}
      
      <div className="game-content">
        {children}
      </div>
    </motion.div>
  );
};

export default ResponsiveGameContainer;
