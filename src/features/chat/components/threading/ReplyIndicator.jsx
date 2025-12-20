import React from 'react';
import { Reply } from 'lucide-react';
import useResponsive from '../../../../shared/hooks/useResponsive';

/**
 * ReplyIndicator - Shows which message the current message is replying to
 * Responsive across all screen sizes
 */
const ReplyIndicator = ({ replyTo, onClick }) => {
  const { isMobile, isMobileSmall } = useResponsive();
  
  if (!replyTo) return null;
  
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-2 mb-1 cursor-pointer
        bg-gray-100 dark:bg-gray-800/50 
        border-l-4 border-wa-teal
        ${isMobileSmall ? 'px-2 py-1 rounded-r' : isMobile ? 'px-2.5 py-1.5 rounded-r' : 'px-3 py-1.5 rounded-r'}
        hover:bg-gray-200 dark:hover:bg-gray-700/50
        transition-colors
        active:scale-[0.98]
      `}
    >
      <Reply 
        size={isMobileSmall ? 12 : isMobile ? 14 : 16} 
        className="text-wa-teal shrink-0" 
      />
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-wa-teal ${isMobileSmall ? 'text-xs' : isMobile ? 'text-xs' : 'text-sm'}`}>
          {replyTo.sender}
        </p>
        <p className={`text-gray-600 dark:text-gray-400 truncate ${isMobileSmall ? 'text-xs' : isMobile ? 'text-xs' : 'text-sm'}`}>
          {replyTo.type === 'image' ? '📷 Photo' : 
           replyTo.type === 'video' ? '🎥 Video' : 
           replyTo.type === 'voice' ? '🎤 Voice message' :
           replyTo.text}
        </p>
      </div>
    </div>
  );
};

export default ReplyIndicator;
